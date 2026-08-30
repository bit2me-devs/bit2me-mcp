/**
 * HTTP/SSE transport for the Bit2Me MCP server.
 *
 * Local one-user proxy (ADR 0003). Default bind is loopback.
 * Each request may carry credentials in headers (ALS). Rate limit
 * and circuit breaker are process-wide per endpoint group.
 *
 * The transport stays thin: tools do not need to know stdio vs HTTP.
 * The auth hook puts credentials into AsyncLocalStorage; the rest of
 * the pipeline is the same.
 *
 * Plain HTTP on loopback is the usual case. If you bind a non-loopback
 * interface, put TLS in front. Do not trust X-Forwarded-* unless
 * MCP_HTTP_TRUST_PROXY is set.
 */

import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

import { logger } from "../utils/logger.js";
import { authFailureKey, createAuthFailureLimiter, type HttpAuthMode } from "./http-auth.js";
import { isLoopbackHost, warnIfApiKeyOnNonLoopback, warnIfPlainHttpOnNonLoopback } from "./http-bind.js";
import { registerHttpRoutes } from "./http-routes.js";

export type { HttpAuthMode };
export { isLoopbackHost, warnIfApiKeyOnNonLoopback, warnIfPlainHttpOnNonLoopback };

export interface HttpTransportOptions {
    host?: string;
    port?: number;
    /** Maximum incoming requests per minute, per IP. Defaults to 600. */
    rateLimitPerMinute?: number;
    /**
     * Maximum authentication failures (HTTP 401) per identity per
     * minute. Triggers a temporary lockout to slow down credential
     * stuffing. Defaults to 10. The identity key is a credential
     * fingerprint when headers carry one, otherwise the (possibly
     * proxy-resolved) client IP.
     */
    authFailureMaxPerMinute?: number;
    /**
     * Authentication mode:
     *  - `api_key` (default): require `X-Bit2Me-Api-Key` + `X-Bit2Me-Api-Secret`.
     *  - `jwt`: require `Authorization: Bearer <jwt>`.
     *  - `both`: accept either.
     */
    authMode?: HttpAuthMode;
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

/**
 * Build a Fastify server that exposes the MCP catalog over HTTP.
 *
 * `POST /mcp` is JSON-RPC (tools, prompts, resources, initialize).
 * The usual HTTP deployment is that single endpoint. SSE on `GET /mcp`
 * is reserved. Per-request credentials stay in AsyncLocalStorage.
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
     * Reject requests whose identity (credential fingerprint or IP)
     * is currently locked out. Mounted as a global hook because the
     * lockout must apply to *every* authenticated route uniformly.
     */
    app.addHook("onRequest", async (req, reply) => {
        // Public probes are intentionally exempt: they expose no state
        // and rejecting them would defeat the purpose of liveness.
        if (req.url === "/livez" || req.url === "/readyz") return;
        const key = authFailureKey(req);
        if (authFailureLimiter.isLockedOut(key)) {
            logger.warn("Auth failure lockout hit", { key, url: req.url });
            // `return reply.send(...)` is the Fastify-recommended pattern
            // for short-circuiting an async hook: it both writes the
            // response and signals the framework that no further hooks
            // or the route handler should run.
            return reply.code(429).send({ error: "Too many authentication failures, slow down." });
        }
    });

    registerHttpRoutes(app, authMode, authFailureLimiter);
    return app;
}

/** Convenience: start the HTTP server. */
export async function startHttpServer(opts: HttpTransportOptions = {}): Promise<FastifyInstance> {
    const app = await buildHttpServer(opts);
    const host = opts.host ?? process.env.MCP_HTTP_HOST ?? "127.0.0.1";
    const port = opts.port ?? Number(process.env.MCP_HTTP_PORT ?? 3000);
    warnIfPlainHttpOnNonLoopback(host);
    warnIfApiKeyOnNonLoopback(host, opts.authMode ?? "api_key");
    await app.listen({ host, port });
    logger.info(`Bit2Me MCP HTTP server listening on http://${host}:${port}`);
    return app;
}
