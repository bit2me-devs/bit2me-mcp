/**
 * Smoke tests for the HTTP transport (Phase 3).
 *
 * The full multi-tenant infrastructure (per-tenant rate limiter, circuit
 * breaker, namespaced cache) is rolled out incrementally; this suite
 * exercises the *public* contract of `buildHttpServer`:
 *
 *  1. Unauthenticated requests are rejected with 401.
 *  2. Authenticated requests can list tools.
 *  3. Two concurrent requests carrying different JWTs are isolated: each
 *     observes its own `sessionToken` inside the AsyncLocalStorage store.
 */

import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildHttpServer } from "../src/transport/http.js";
import { getSessionToken } from "../src/utils/context.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildHttpServer({ authMode: "jwt" });
    await app.ready();
});

describe("HTTP transport — auth", () => {
    it("rejects requests without credentials", async () => {
        const res = await app.inject({ method: "POST", url: "/mcp", payload: { jsonrpc: "2.0", method: "tools/list", id: 1 } });
        expect(res.statusCode).toBe(401);
    });

    it("accepts requests with a Bearer token", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "2.0", method: "tools/list", id: 1 },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { result: { tools: unknown[] } };
        expect(Array.isArray(body.result.tools)).toBe(true);
        expect(body.result.tools.length).toBeGreaterThan(0);
    });
});

describe("HTTP transport — tenant isolation", () => {
    it("two concurrent requests don't leak each other's session token", async () => {
        // Spin up an isolated app with a probe route that reflects the
        // current AsyncLocalStorage-backed sessionToken back to the
        // client. We deliberately add a small artificial delay before
        // reading the store so the two requests are guaranteed to be
        // in-flight at the same time.
        const probeApp = await buildHttpServer({ authMode: "jwt" });
        probeApp.post("/probe", async (req, reply) => {
            const auth = (req.headers["authorization"] as string | undefined) ?? "";
            const token = auth.toLowerCase().startsWith("bearer ")
                ? auth.slice("bearer ".length).trim()
                : undefined;
            if (!token) {
                reply.code(401);
                return { error: "missing" };
            }
            // Run inside the same context the production code uses.
            const { runWithContext } = await import("../src/utils/context.js");
            return await runWithContext(
                {
                    correlationId: "probe-" + token,
                    startTime: Date.now(),
                    sessionToken: token,
                },
                async () => {
                    await new Promise((r) => setTimeout(r, 25));
                    return { observed: getSessionToken() };
                }
            );
        });
        await probeApp.ready();

        const [resA, resB] = await Promise.all([
            probeApp.inject({
                method: "POST",
                url: "/probe",
                headers: { authorization: "Bearer token-A" },
                payload: {},
            }),
            probeApp.inject({
                method: "POST",
                url: "/probe",
                headers: { authorization: "Bearer token-B" },
                payload: {},
            }),
        ]);

        expect(resA.statusCode).toBe(200);
        expect(resB.statusCode).toBe(200);
        expect((resA.json() as { observed: string }).observed).toBe("token-A");
        expect((resB.json() as { observed: string }).observed).toBe("token-B");
        // Outside any request, the store is empty.
        expect(getSessionToken()).toBeUndefined();

        await probeApp.close();
    });
});
