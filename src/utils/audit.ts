/**
 * Append-only audit log for write operations.
 *
 * Every successful (or failed) mutation of user state — order placement,
 * cancellation, withdrawal, loan creation, earn deposit/withdraw — is
 * recorded here. The log is intended for after-the-fact reconciliation,
 * compliance, and forensic debugging when a user disputes a trade.
 *
 * Storage:
 *  - When `AUDIT_LOG_PATH` is set, lines are appended to that file.
 *  - Otherwise the audit entry is emitted via `logger.info` with a
 *    distinct `audit: true` tag, keeping the dependency surface minimal.
 *
 * The log contains NO sensitive identifiers (API keys, JWTs, full PII).
 * Tenant identification is via the AsyncLocalStorage correlation ID and
 * the masked session token already used elsewhere.
 */

import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { logger } from "./logger.js";
import { getCorrelationId, getSessionToken } from "./context.js";

export interface AuditEntry {
    /** Tool name as exposed by the MCP catalog (e.g. `pro_create_order`). */
    tool: string;
    /** "success" | "error" */
    outcome: "success" | "error";
    /** Sanitised arguments that drove the call. */
    args: Record<string, unknown>;
    /** Optional error message (when outcome === "error"). */
    error?: string;
    /** Optional idempotency key, when applicable. */
    idempotencyKey?: string;
}

/** Recorded shape on disk / in the log stream. */
interface AuditRecord extends AuditEntry {
    ts: string;
    correlationId: string | undefined;
    /**
     * Short SHA-256 prefix of the session token used during this call.
     *
     * Property name is deliberately `sessionFingerprint` (NOT `tokenHash`
     * or `*token*`): the logger's PII sanitizer aggressively redacts any
     * key matching `/token|secret|key|jwt/`, and we want the fingerprint
     * to remain visible — it's a one-way digest, never the token itself.
     */
    sessionFingerprint: string | undefined;
}

function fingerprint(token: string | undefined): string | undefined {
    if (!token) return undefined;
    return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

export function recordAudit(entry: AuditEntry): void {
    const record: AuditRecord = {
        ts: new Date().toISOString(),
        correlationId: getCorrelationId(),
        sessionFingerprint: fingerprint(getSessionToken()),
        ...entry,
    };

    const path = process.env.AUDIT_LOG_PATH;
    if (path) {
        try {
            appendFileSync(path, JSON.stringify(record) + "\n", { encoding: "utf8" });
            return;
        } catch (err) {
            // Falling through to logger so the audit isn't silently lost.
            logger.warn("Failed to write audit log; falling back to logger", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    logger.info("audit", { audit: true, ...record });
}
