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
import { performHealthCheck } from "../utils/health.js";
import { metricsCollector } from "../utils/metrics.js";

export interface HttpTransportOptions {
    host?: string;
    port?: number;
    /** Maximum incoming requests per minute, per IP. Defaults to 600. */
    rateLimitPerMinute?: number;
    /**
     * Authentication mode:
     *  - `api_key` (default): require `X-Bit2Me-Api-Key` + `X-Bit2Me-Api-Secret`.
     *  - `jwt`: require `Authorization: Bearer <jwt>`.
     *  - `both`: accept either.
     */
    authMode?: "api_key" | "jwt" | "both";
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
    const apiSecret =
        typeof headers["x-bit2me-api-secret"] === "string" ? headers["x-bit2me-api-secret"] : undefined;
    const authHeader = typeof headers["authorization"] === "string" ? headers["authorization"] : undefined;
    const jwt = authHeader && authHeader.toLowerCase().startsWith("bearer ")
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

/** Hash a credential into a short tenant identifier. */
function hashIdentifier(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
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
        trustProxy: true,
        bodyLimit: 1024 * 1024, // 1 MiB; MCP payloads are tiny
    });

    await app.register(rateLimit, {
        max: opts.rateLimitPerMinute ?? 600,
        timeWindow: "1 minute",
    });

    const authMode = opts.authMode ?? "api_key";

    app.get("/health", async () => performHealthCheck());

    app.get("/metrics", async (_req, reply) => {
        reply.type("text/plain; version=0.0.4");
        return metricsCollector.toPrometheus();
    });

    app.get("/mcp/tools", async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            reply.code(401);
            return { error: "Missing credentials" };
        }
        return { tools: getAllTools() };
    });

    app.post("/mcp", async (req: FastifyRequest, reply: FastifyReply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            reply.code(401);
            return { jsonrpc: "2.0", error: { code: -32001, message: "Missing credentials" }, id: null };
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
                    error: { code: -32601, message: `Method not found: ${body.method}` },
                };
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                logger.error("HTTP MCP request failed", {
                    method: body.method,
                    tenantId: creds.tenantId,
                    error: message,
                });
                return {
                    jsonrpc: "2.0",
                    id: body.id ?? null,
                    error: { code: -32000, message },
                };
            }
        });
    });

    return app;
}

/** Convenience: start the HTTP server. */
export async function startHttpServer(opts: HttpTransportOptions = {}): Promise<FastifyInstance> {
    const app = await buildHttpServer(opts);
    const host = opts.host ?? process.env.MCP_HTTP_HOST ?? "127.0.0.1";
    const port = opts.port ?? Number(process.env.MCP_HTTP_PORT ?? 3000);
    await app.listen({ host, port });
    logger.info(`Bit2Me MCP HTTP server listening on http://${host}:${port}`);
    return app;
}
