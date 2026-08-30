/**
 * Per-request credentials and auth-failure lockout (ADR 0003).
 * Lockout key is a credential HMAC fingerprint or client IP — not a tenant id.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";

export type HttpAuthMode = "api_key" | "jwt" | "both";

export interface RequestCredentials {
    apiKey?: string;
    apiSecret?: string;
    sessionToken?: string;
}

/**
 * Extract per-request credentials from headers.
 *
 * Returns `null` if the headers don't satisfy the configured auth mode
 * (the caller is then expected to reject with 401).
 */
export function extractCredentials(req: FastifyRequest, mode: HttpAuthMode | undefined): RequestCredentials | null {
    const headers = req.headers;
    const apiKey = typeof headers["x-bit2me-api-key"] === "string" ? headers["x-bit2me-api-key"] : undefined;
    const apiSecret = typeof headers["x-bit2me-api-secret"] === "string" ? headers["x-bit2me-api-secret"] : undefined;
    const authHeader = typeof headers["authorization"] === "string" ? headers["authorization"] : undefined;
    const jwt =
        authHeader && authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : undefined;

    const hasApiKeyPair = !!apiKey && !!apiSecret;
    const hasJwt = !!jwt;

    let creds: RequestCredentials | null = null;
    switch (mode ?? "api_key") {
        case "api_key":
            if (hasApiKeyPair) creds = { apiKey, apiSecret };
            break;
        case "jwt":
            if (hasJwt) creds = { sessionToken: jwt };
            break;
        case "both":
            if (hasApiKeyPair) creds = { apiKey, apiSecret };
            else if (hasJwt) creds = { sessionToken: jwt };
            break;
    }
    return creds;
}

/**
 * Per-process random key used to derive opaque lockout labels from
 * credentials. The key never leaves memory and is regenerated on every
 * restart. Using HMAC instead of a bare hash avoids the credential ever
 * being subject to a length-extension or rainbow-table style attack.
 *
 * NOTE for static analysers: this is NOT a password hash. Credentials are
 * never stored — they live only in the request context (AsyncLocalStorage)
 * for the duration of a single HTTP request. The output is a
 * non-reversible label for the auth-failure counter.
 */
const LOCKOUT_HMAC_KEY: Buffer = crypto.randomBytes(32);

function hashIdentifier(value: string): string {
    return crypto.createHmac("sha256", LOCKOUT_HMAC_KEY).update(value).digest("hex").slice(0, 16);
}

/**
 * Sliding-window counter of recent authentication failures keyed by
 * a credential fingerprint (when headers carry one) or by client
 * IP otherwise. Entries expire automatically once their window closes.
 *
 * The map is bounded: when it grows past `AUTH_FAILURE_MAX_KEYS` the
 * oldest entry is evicted (FIFO) so the memory footprint cannot be
 * weaponised by an attacker rotating many distinct identities.
 */
interface AuthFailureBucket {
    count: number;
    /** Timestamp (ms) when the current sliding window expires. */
    resetAt: number;
}

const AUTH_FAILURE_WINDOW_MS = 60_000;
const AUTH_FAILURE_MAX_KEYS = 10_000;

export interface AuthFailureLimiter {
    /**
     * Returns `true` when the identity has accumulated too many failures
     * and the *next* request must be rejected with 429. Designed to be
     * checked at the start of the request lifecycle.
     */
    isLockedOut(key: string): boolean;
    /**
     * Record a single authentication failure for `key`. Does not affect
     * the in-flight response (the caller is already returning 401);
     * instead it advances the counter so that *subsequent* requests
     * within the window can be locked out.
     */
    recordFailure(key: string): void;
}

export function createAuthFailureLimiter(maxPerMinute: number): AuthFailureLimiter {
    const buckets = new Map<string, AuthFailureBucket>();
    const cap = Math.max(1, maxPerMinute);

    function evictIfNeeded(): void {
        if (buckets.size < AUTH_FAILURE_MAX_KEYS) return;
        const firstKey = buckets.keys().next().value;
        if (firstKey !== undefined) buckets.delete(firstKey);
    }

    function getBucket(key: string, now: number): AuthFailureBucket {
        const existing = buckets.get(key);
        if (existing && existing.resetAt > now) return existing;
        const fresh: AuthFailureBucket = { count: 0, resetAt: now + AUTH_FAILURE_WINDOW_MS };
        evictIfNeeded();
        buckets.set(key, fresh);
        return fresh;
    }

    return {
        isLockedOut(key: string): boolean {
            const now = Date.now();
            const bucket = buckets.get(key);
            if (!bucket) return false;
            if (bucket.resetAt <= now) {
                buckets.delete(key);
                return false;
            }
            return bucket.count >= cap;
        },
        recordFailure(key: string): void {
            const now = Date.now();
            const bucket = getBucket(key, now);
            bucket.count += 1;
        },
    };
}

/**
 * Derive the lockout key for an inbound request. Prefers a credential
 * fingerprint (so rotating IPs cannot reset the counter by spraying
 * credentials) and falls back to the client IP otherwise.
 */
export function authFailureKey(req: FastifyRequest): string {
    const headers = req.headers;
    const apiKey = typeof headers["x-bit2me-api-key"] === "string" ? headers["x-bit2me-api-key"] : undefined;
    const authHeader = typeof headers["authorization"] === "string" ? headers["authorization"] : undefined;
    const jwt =
        authHeader && authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : undefined;
    if (apiKey) return `key:${hashIdentifier(apiKey)}`;
    if (jwt) return `jwt:${hashIdentifier(jwt)}`;
    return `ip:${req.ip ?? "unknown"}`;
}

/**
 * Reject with 401 and increment the per-identity failure counter.
 * Subsequent requests from the same identity are short-circuited with
 * 429 once the cap is hit (handled by the `onRequest` lockout hook).
 *
 * Returns the {@link FastifyReply} so callers can `return` it from an
 * async route handler (Fastify-recommended short-circuit).
 */
export function rejectUnauthenticated(
    limiter: AuthFailureLimiter,
    req: FastifyRequest,
    reply: FastifyReply,
    body: object
): FastifyReply {
    limiter.recordFailure(authFailureKey(req));
    return reply.code(401).send(body);
}
