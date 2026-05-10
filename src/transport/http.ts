/**
 * HTTP/SSE transport for the Bit2Me MCP server.
 *
 * This is the multi-tenant variant of the server: instead of a single
 * stdio process backed by `BIT2ME_API_KEY` / `BIT2ME_API_SECRET` env vars,
 * each request carries its own credentials in headers and the server
 * isolates state (rate limit, circuit breaker, in-flight context) by
 * tenant.
 *
 * The transport intentionally stays thin: tool implementations don't need
 * to know whether they are running under stdio or HTTP. The auth hook
 * extracts credentials, places them into the per-request `AsyncLocalStorage`
 * (Phase 0), and the rest of the pipeline behaves identically.
 *
 * NOTE: TLS termination is delegated to a reverse proxy (nginx, traefik,
 * caddy, ...). The server only accepts plain HTTP and trusts standard
 * `X-Forwarded-*` headers when present.
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import rateLimit from "@fastify/rate-limit";
import crypto from "node:crypto";

import { logger } from "../utils/logger.js";
import { runWithContext, type RequestContext } from "../utils/context.js";
import { dispatchTool, getAllTools } from "../tools/registry.js";
import { performHealthCheck, getLivenessStatus, getReadinessStatus } from "../utils/health.js";
import { metricsCollector } from "../utils/metrics.js";
import {
    ValidationError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    BadRequestError,
    Bit2MeAPIError,
} from "../utils/errors.js";

export interface HttpTransportOptions {
    host?: string;
    port?: number;
    /** Maximum incoming requests per minute, per IP. Defaults to 600. */
    rateLimitPerMinute?: number;
    /**
     * Maximum authentication failures (HTTP 401) per identity per
     * minute. Triggers a temporary lockout to slow down credential
     * stuffing. Defaults to 10. The identity key is the tenant id when
     * the request carries enough credentials to derive one, otherwise
     * the (possibly proxy-resolved) client IP.
     */
    authFailureMaxPerMinute?: number;
    /**
     * Authentication mode:
     *  - `api_key` (default): require `X-Bit2Me-Api-Key` + `X-Bit2Me-Api-Secret`.
     *  - `jwt`: require `Authorization: Bearer <jwt>`.
     *  - `both`: accept either.
     */
    authMode?: "api_key" | "jwt" | "both";
    /**
     * Reverse-proxy trust policy passed to Fastify. The default
     * (`false`) tells Fastify to use the raw socket address and
     * ignore `X-Forwarded-*` headers, which prevents IP spoofing on
     * directly-exposed deployments. Set to a CIDR list (or
     * `"loopback"`/`"linklocal"`) only when this server lives behind
     * a proxy that you control and that strips/rewrites the headers.
     */
    trustProxy?: boolean | string | string[];
}

interface RequestCredentials {
    /** Stable hash used as tenant identifier (never logs the raw value). */
    tenantId: string;
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
function extractCredentials(req: FastifyRequest, mode: HttpTransportOptions["authMode"]): RequestCredentials | null {
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
            if (hasApiKeyPair) creds = { tenantId: hashIdentifier(apiKey!), apiKey, apiSecret };
            break;
        case "jwt":
            if (hasJwt) creds = { tenantId: hashIdentifier(jwt!), sessionToken: jwt };
            break;
        case "both":
            if (hasApiKeyPair) creds = { tenantId: hashIdentifier(apiKey!), apiKey, apiSecret };
            else if (hasJwt) creds = { tenantId: hashIdentifier(jwt!), sessionToken: jwt };
            break;
    }
    return creds;
}

/**
 * Per-process random key used to derive opaque tenant identifiers from
 * credentials. The key never leaves memory and is regenerated on every
 * restart, which means tenant IDs are stable for the lifetime of a single
 * process (enough to namespace caches/rate limiters) but cannot be
 * pre-computed offline from a leaked credential. Using HMAC instead of a
 * bare hash also avoids the credential ever being subject to a length-
 * extension or rainbow-table style attack.
 *
 * NOTE for static analysers: this is NOT a password hash. Credentials are
 * never stored — they live only in the request context (AsyncLocalStorage)
 * for the duration of a single HTTP request. The output of this function is
 * a non-reversible label used purely for in-memory bookkeeping.
 */
const TENANT_ID_KEY: Buffer = crypto.randomBytes(32);

function hashIdentifier(value: string): string {
    return crypto.createHmac("sha256", TENANT_ID_KEY).update(value).digest("hex").slice(0, 16);
}

/**
 * Sliding-window counter of recent authentication failures keyed by
 * tenant id (when one can be derived from the headers) or by client
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

interface AuthFailureLimiter {
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

function createAuthFailureLimiter(maxPerMinute: number): AuthFailureLimiter {
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
 * Derive the lockout key for an inbound request. Prefers a partial
 * tenant id (so an attacker rotating IPs cannot reset their counter
 * by spraying credentials) and falls back to the client IP otherwise.
 */
function authFailureKey(req: FastifyRequest): string {
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
 * Build a Fastify server that exposes the MCP tool catalog over HTTP.
 *
 * The HTTP surface mirrors a subset of the MCP JSON-RPC protocol: the most
 * common deployment pattern (and the one the MCP spec recommends for HTTP)
 * is a single `POST /mcp` endpoint that takes a JSON-RPC request and
 * returns a JSON-RPC response. SSE upgrades are accepted at `GET /mcp` but
 * are wired into a future iteration; this initial implementation focuses
 * on correctness of the multi-tenant request/response path.
 */
export async function buildHttpServer(opts: HttpTransportOptions = {}): Promise<FastifyInstance> {
    const app = Fastify({
        logger: false,
        // `trustProxy` is opt-in: by default we ignore `X-Forwarded-*`
        // headers so that an attacker on a directly-exposed deployment
        // cannot spoof their client IP and bypass the rate limiter.
        trustProxy: opts.trustProxy ?? false,
        bodyLimit: 1024 * 1024, // 1 MiB; MCP payloads are tiny
    });

    await app.register(rateLimit, {
        max: opts.rateLimitPerMinute ?? 600,
        timeWindow: "1 minute",
    });

    const authMode = opts.authMode ?? "api_key";
    const authFailureLimiter = createAuthFailureLimiter(opts.authFailureMaxPerMinute ?? 10);

    /**
     * Reject requests whose identity (tenant id or IP) is currently
     * locked out. Mounted as a global hook because the lockout must
     * apply to *every* authenticated route uniformly.
     */
    app.addHook("onRequest", async (req, reply) => {
        // Public probes are intentionally exempt: they expose no state
        // and rejecting them would defeat the purpose of liveness.
        if (req.url === "/livez" || req.url === "/readyz") return;
        const key = authFailureKey(req);
        if (authFailureLimiter.isLockedOut(key)) {
            logger.warn("Auth failure lockout hit", { key, url: req.url });
            reply.code(429);
            reply.send({ error: "Too many authentication failures, slow down." });
        }
    });

    /**
     * Reject the authenticated request with 401 and increment the
     * per-identity failure counter. Subsequent requests from the same
     * identity will be short-circuited with 429 once the cap is hit
     * (handled by the `onRequest` lockout hook above).
     */
    function rejectUnauthenticated(req: FastifyRequest, reply: FastifyReply, body: object): void {
        const key = authFailureKey(req);
        authFailureLimiter.recordFailure(key);
        reply.code(401);
        reply.send(body);
    }

    // ------------------------------------------------------------------
    // Liveness & readiness — public, no upstream calls, no runtime data.
    // ------------------------------------------------------------------
    // These probes never touch the Bit2Me API. Operators that need to
    // monitor the upstream platform should do it from their own
    // synthetic monitoring stack; this server only reports its own
    // state.
    app.get("/livez", async () => getLivenessStatus());
    app.get("/readyz", async () => getReadinessStatus());

    // ------------------------------------------------------------------
    // Authenticated diagnostics: full snapshot + Prometheus scrape.
    // ------------------------------------------------------------------
    app.get("/health", async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            rejectUnauthenticated(req, reply, { error: "Missing credentials" });
            return;
        }
        return performHealthCheck({ includeRuntime: true });
    });

    app.get("/metrics", async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            rejectUnauthenticated(req, reply, { error: "Missing credentials" });
            return;
        }
        reply.type("text/plain; version=0.0.4");
        return metricsCollector.toPrometheus();
    });

    app.get("/mcp/tools", async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            rejectUnauthenticated(req, reply, { error: "Missing credentials" });
            return;
        }
        return { tools: getAllTools() };
    });

    app.post("/mcp", async (req: FastifyRequest, reply: FastifyReply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            rejectUnauthenticated(req, reply, {
                jsonrpc: "2.0",
                error: { code: -32001, message: "Missing credentials" },
                id: null,
            });
            return;
        }

        const body = req.body as
            | {
                  jsonrpc?: string;
                  method?: string;
                  params?: { name?: string; arguments?: Record<string, unknown> };
                  id?: string | number | null;
              }
            | undefined;

        if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
            reply.code(400);
            return { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: null };
        }

        const ctx: RequestContext = {
            correlationId: crypto.randomUUID(),
            startTime: Date.now(),
            sessionToken: creds.sessionToken,
            apiKey: creds.apiKey,
            apiSecret: creds.apiSecret,
            tenantId: creds.tenantId,
        };

        return runWithContext(ctx, async () => {
            try {
                if (body.method === "tools/list") {
                    return { jsonrpc: "2.0", id: body.id ?? null, result: { tools: getAllTools() } };
                }
                if (body.method === "tools/call") {
                    const name = body.params?.name;
                    if (typeof name !== "string") {
                        return {
                            jsonrpc: "2.0",
                            id: body.id ?? null,
                            error: { code: -32602, message: "Invalid params: missing tool name" },
                        };
                    }
                    const args = (body.params?.arguments ?? {}) as Record<string, unknown>;
                    // Per-request API key/secret (when supplied) and
                    // `sessionToken` are already in `ctx`; bit2meRequest
                    // picks them up via getRequestApiKey/Secret/getSessionToken.
                    const result = await dispatchTool(name, args);
                    return { jsonrpc: "2.0", id: body.id ?? null, result };
                }
                return {
                    jsonrpc: "2.0",
                    id: body.id ?? null,
                    error: { code: -32601, message: "Method not found" },
                };
            } catch (err: unknown) {
                const internalMessage = err instanceof Error ? err.message : String(err);
                logger.error("HTTP MCP request failed", {
                    method: body.method,
                    tenantId: creds.tenantId,
                    error: internalMessage,
                    errorName: err instanceof Error ? err.name : "unknown",
                });
                // Map to JSON-RPC 2.0 error codes. Only echo back error
                // text for client-induced failures (validation, auth,
                // rate limit, not found) — every other path returns a
                // generic "Internal error" so we don't accidentally
                // leak upstream stack traces or response bodies.
                const { code, message } = mapErrorToJsonRpc(err);
                return {
                    jsonrpc: "2.0",
                    id: body.id ?? null,
                    error: { code, message },
                };
            }
        });
    });

    return app;
}

/**
 * Translate an internal error into a safe JSON-RPC 2.0 error payload.
 *
 * Client-induced errors (validation, auth, rate limit, not found, bad
 * request) are echoed back verbatim because they carry actionable
 * information for the caller. Every other error category collapses to
 * a generic "Internal error" — the full message is still logged on the
 * server so operators can correlate by `correlationId`/`tenantId`,
 * but it never leaves the process.
 */
function mapErrorToJsonRpc(err: unknown): { code: number; message: string } {
    if (err instanceof ValidationError) {
        return { code: -32602, message: err.message };
    }
    if (err instanceof AuthenticationError) {
        return { code: -32001, message: "Authentication failed" };
    }
    if (err instanceof RateLimitError) {
        return { code: -32029, message: "Rate limit exceeded" };
    }
    if (err instanceof NotFoundError) {
        return { code: -32004, message: "Resource not found" };
    }
    if (err instanceof BadRequestError) {
        return { code: -32602, message: err.message };
    }
    if (err instanceof Bit2MeAPIError) {
        return { code: -32000, message: "Upstream API error" };
    }
    return { code: -32000, message: "Internal error" };
}

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
 * the credential surface — see ADR 0001 for the threat model. The recommended
 * mode for production deployments is `jwt`. We only warn (not refuse) so the
 * legacy mode keeps working until operators migrate.
 *
 * Exported for unit testing without binding a real socket.
 */
export function warnIfApiKeyOnNonLoopback(host: string | undefined, authMode: HttpTransportOptions["authMode"]): void {
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

/** Convenience: start the HTTP server. */
export async function startHttpServer(opts: HttpTransportOptions = {}): Promise<FastifyInstance> {
    const app = await buildHttpServer(opts);
    const host = opts.host ?? process.env.MCP_HTTP_HOST ?? "127.0.0.1";
    const port = opts.port ?? Number(process.env.MCP_HTTP_PORT ?? 3000);
    warnIfApiKeyOnNonLoopback(host, opts.authMode ?? "api_key");
    await app.listen({ host, port });
    logger.info(`Bit2Me MCP HTTP server listening on http://${host}:${port}`);
    return app;
}
