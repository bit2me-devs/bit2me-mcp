/**
 * HTTP routes for the Bit2Me MCP transport. Probe paths stay public;
 * diagnostics and /mcp require credentials.
 */

import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import { logger } from "../utils/logger.js";
import { runWithContext, type RequestContext } from "../utils/context.js";
import { getAllTools } from "../tools/registry.js";
import { handleMcpRpc } from "./mcp-rpc.js";
import { performHealthCheck, getLivenessStatus, getReadinessStatus } from "../utils/health.js";
import { metricsCollector } from "../utils/metrics.js";
import { extractCredentials, rejectUnauthenticated, type HttpAuthMode, type AuthFailureLimiter } from "./http-auth.js";
import { mapErrorToJsonRpc } from "./http-errors.js";

interface McpRpcBody {
    jsonrpc?: string;
    method?: string;
    params?: unknown;
    id?: string | number | null;
}

function rpcParams(value: unknown): Record<string, unknown> | undefined | false {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "object" || Array.isArray(value)) return false;
    return value as Record<string, unknown>;
}

/**
 * Per-route rate-limit envelopes.
 *
 * We already register `@fastify/rate-limit` globally (~600 req/min),
 * but we redeclare the config on each sensitive route so the intent is
 * explicit at the call-site (and so static analysers that inspect the
 * route definition — e.g. CodeQL's `js/missing-rate-limiting` query —
 * see the protection rather than having to infer it from the plugin).
 *
 * The values are deliberately tighter than the global so a misbehaving
 * caller cannot saturate diagnostics or the tool-invocation surface
 * even if the global budget would still allow it.
 */
const healthRouteCfg = { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } } as const;
const metricsRouteCfg = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } } as const;
const toolsRouteCfg = { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } } as const;
const mcpRouteCfg = { config: { rateLimit: { max: 300, timeWindow: "1 minute" } } } as const;

export function registerHttpRoutes(
    app: FastifyInstance,
    authMode: HttpAuthMode,
    authFailureLimiter: AuthFailureLimiter
): void {
    // Public probes — no upstream calls, no runtime data. Operators that
    // need to monitor Bit2Me should do it from their own synthetic stack.
    app.get("/livez", async () => getLivenessStatus());
    app.get("/readyz", async () => getReadinessStatus());

    app.get("/health", healthRouteCfg, async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            return rejectUnauthenticated(authFailureLimiter, req, reply, { error: "Missing credentials" });
        }
        return performHealthCheck({ includeRuntime: true });
    });

    app.get("/metrics", metricsRouteCfg, async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            return rejectUnauthenticated(authFailureLimiter, req, reply, { error: "Missing credentials" });
        }
        reply.type("text/plain; version=0.0.4");
        return metricsCollector.toPrometheus();
    });

    app.get("/mcp/tools", toolsRouteCfg, async (req, reply) => {
        const creds = extractCredentials(req, authMode);
        if (!creds) {
            return rejectUnauthenticated(authFailureLimiter, req, reply, { error: "Missing credentials" });
        }
        return { tools: getAllTools() };
    });

    app.post("/mcp", mcpRouteCfg, async (req: FastifyRequest, reply: FastifyReply) => {
        return handleMcpPost(req, reply, authMode, authFailureLimiter);
    });
}

async function handleMcpPost(
    req: FastifyRequest,
    reply: FastifyReply,
    authMode: HttpAuthMode,
    authFailureLimiter: AuthFailureLimiter
) {
    const creds = extractCredentials(req, authMode);
    if (!creds) {
        return rejectUnauthenticated(authFailureLimiter, req, reply, {
            jsonrpc: "2.0",
            error: { code: -32001, message: "Missing credentials" },
            id: null,
        });
    }

    const body = req.body as McpRpcBody | undefined;
    if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
        reply.code(400);
        return { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: null };
    }
    const method = body.method;
    // JSON-RPC notification: no `id` → must not reply (MCP HTTP: 202 empty).
    if (!Object.hasOwn(body, "id")) {
        return reply.code(202).send();
    }
    const params = rpcParams(body.params);
    if (params === false) {
        reply.code(400);
        return {
            jsonrpc: "2.0",
            error: { code: -32602, message: "Invalid params: params must be an object" },
            id: body.id ?? null,
        };
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
            return await handleMcpRpc(method, params, body.id ?? null);
        } catch (err: unknown) {
            const internalMessage = err instanceof Error ? err.message : String(err);
            logger.error("HTTP MCP request failed", {
                method: body.method,
                correlationId: ctx.correlationId,
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
}
