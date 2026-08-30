/**
 * Bind-address helpers for the HTTP transport (ADR 0003: default loopback).
 */

import { logger } from "../utils/logger.js";
import type { HttpAuthMode } from "./http-auth.js";

/**
 * Returns `true` if `host` resolves to a loopback interface or hostname.
 *
 * The check is conservative: only well-known loopback literals are accepted.
 * Any wildcard bind (`0.0.0.0`, `::`, empty string) or external interface is
 * treated as non-loopback so the operator gets the security warning emitted
 * by `warnIfApiKeyOnNonLoopback`.
 */
export function isLoopbackHost(host: string | undefined): boolean {
    if (!host) return false;
    const normalized = host.trim().toLowerCase();
    if (normalized === "localhost") return true;
    if (normalized === "::1" || normalized === "[::1]") return true;
    // IPv4 loopback range is 127.0.0.0/8. Validate without regex to keep the
    // security linter happy (no nested quantifiers / backtracking surface).
    const parts = normalized.split(".");
    if (parts.length !== 4) return false;
    if (parts[0] !== "127") return false;
    for (let i = 1; i < 4; i++) {
        const part = parts[i];
        if (!part || part.length > 3) return false;
        const n = Number(part);
        if (!Number.isInteger(n) || n < 0 || n > 255) return false;
        // Reject leading zeroes and non-canonical forms (e.g. "01", "+1").
        if (String(n) !== part) return false;
    }
    return true;
}

/**
 * Emit a startup warning when the legacy `api_key` auth mode is exposed on a
 * non-loopback interface.
 *
 * Forwarding `X-Bit2Me-Api-Secret` over a network-reachable interface widens
 * the credential surface — see ADR 0001. If you bind a non-loopback
 * interface, prefer `jwt` so the API secret does not travel on the LAN.
 * We only warn (not refuse) so `api_key` keeps working on loopback.
 *
 * Exported for unit testing without binding a real socket.
 */
/**
 * ADR 0001: plain HTTP on a reachable address is a misconfiguration
 * regardless of auth mode. We warn (not refuse) so loopback stays quiet.
 */
export function warnIfPlainHttpOnNonLoopback(host: string | undefined): void {
    if (isLoopbackHost(host)) return;
    logger.warn(
        "HTTP transport is bound to a non-loopback interface without TLS in this process. " +
            "Plain HTTP on a reachable address is a misconfiguration (ADR 0001). " +
            "Put TLS in front or bind 127.0.0.1.",
        { host }
    );
}

export function warnIfApiKeyOnNonLoopback(host: string | undefined, authMode: HttpAuthMode | undefined): void {
    const mode = authMode ?? "api_key";
    if (mode !== "api_key" && mode !== "both") return;
    if (isLoopbackHost(host)) return;
    logger.warn(
        "HTTP transport is exposing the legacy api_key auth mode on a non-loopback interface. " +
            'The Bit2Me API secret will travel on every request. Consider switching to authMode="jwt" ' +
            "(MCP_HTTP_AUTH_MODE=jwt). See docs/adr/0001-valet-key-http-credentials.md.",
        { host, authMode: mode }
    );
}
