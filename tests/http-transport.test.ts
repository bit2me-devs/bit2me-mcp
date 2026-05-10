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

import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildHttpServer, isLoopbackHost, warnIfApiKeyOnNonLoopback } from "../src/transport/http.js";
import { getSessionToken } from "../src/utils/context.js";
import { logger } from "../src/utils/logger.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildHttpServer({ authMode: "jwt" });
    await app.ready();
});

describe("HTTP transport — auth", () => {
    it("rejects requests without credentials", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/mcp",
            payload: { jsonrpc: "2.0", method: "tools/list", id: 1 },
        });
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

describe("HTTP transport — public health probes", () => {
    it("/livez is reachable without credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/livez" });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { status: string; timestamp: string };
        expect(body.status).toBe("ok");
        expect(typeof body.timestamp).toBe("string");
    });

    it("/livez does not expose runtime stats", async () => {
        const res = await app.inject({ method: "GET", url: "/livez" });
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("runtime");
        expect(body).not.toHaveProperty("components");
        expect(body).not.toHaveProperty("version");
    });

    it("/readyz is reachable without credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/readyz" });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { status: string };
        expect(["ok", "degraded"]).toContain(body.status);
    });

    it("/readyz does not expose runtime stats", async () => {
        const res = await app.inject({ method: "GET", url: "/readyz" });
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("runtime");
        expect(body).not.toHaveProperty("components");
    });
});

describe("HTTP transport — authenticated diagnostics", () => {
    it("/health requires credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/health" });
        expect(res.statusCode).toBe(401);
    });

    it("/metrics requires credentials", async () => {
        const res = await app.inject({ method: "GET", url: "/metrics" });
        expect(res.statusCode).toBe(401);
    });

    it("/health returns the full snapshot when authenticated", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/health",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as {
            status: string;
            version: string;
            uptime_seconds: number;
            components: { circuit_breaker: { state: string } };
            runtime?: unknown;
        };
        expect(["ok", "degraded"]).toContain(body.status);
        expect(typeof body.version).toBe("string");
        expect(typeof body.uptime_seconds).toBe("number");
        expect(body.components.circuit_breaker.state).toBeTruthy();
        expect(body.runtime).toBeDefined();
    });

    it("/metrics returns Prometheus when authenticated", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/metrics",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toMatch(/^text\/plain/);
    });

    it("/health does not call the upstream API (no axios is needed)", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/health",
            headers: { authorization: "Bearer test-token" },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as Record<string, unknown>;
        expect(body).not.toHaveProperty("components.bit2me_server");
        expect(body).not.toHaveProperty("components.mcp_server");
    });
});

describe("HTTP transport — auth-failure lockout", () => {
    it("locks out the same identity after the failure cap is hit", async () => {
        const lockoutApp = await buildHttpServer({
            authMode: "jwt",
            authFailureMaxPerMinute: 3,
        });
        await lockoutApp.ready();

        // First 3 attempts are 401 (still inside the budget).
        for (let i = 0; i < 3; i++) {
            const r = await lockoutApp.inject({ method: "GET", url: "/health" });
            expect(r.statusCode).toBe(401);
        }

        // 4th attempt — the lockout limiter should now respond 429.
        const final = await lockoutApp.inject({ method: "GET", url: "/health" });
        expect(final.statusCode).toBe(429);

        // Public probes are still reachable while the lockout is active.
        const live = await lockoutApp.inject({ method: "GET", url: "/livez" });
        expect(live.statusCode).toBe(200);

        await lockoutApp.close();
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
            const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice("bearer ".length).trim() : undefined;
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

describe("HTTP transport — credential surface warning (ADR 0001)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("isLoopbackHost", () => {
        it("recognises common loopback literals", () => {
            expect(isLoopbackHost("127.0.0.1")).toBe(true);
            expect(isLoopbackHost("127.1.2.3")).toBe(true);
            expect(isLoopbackHost("localhost")).toBe(true);
            expect(isLoopbackHost("LOCALHOST")).toBe(true);
            expect(isLoopbackHost("::1")).toBe(true);
            expect(isLoopbackHost("[::1]")).toBe(true);
        });

        it("treats wildcard / external hosts as non-loopback", () => {
            expect(isLoopbackHost("0.0.0.0")).toBe(false);
            expect(isLoopbackHost("::")).toBe(false);
            expect(isLoopbackHost("10.0.0.5")).toBe(false);
            expect(isLoopbackHost("203.0.113.4")).toBe(false);
            expect(isLoopbackHost("example.com")).toBe(false);
            expect(isLoopbackHost("")).toBe(false);
            expect(isLoopbackHost(undefined)).toBe(false);
        });
    });

    describe("warnIfApiKeyOnNonLoopback", () => {
        it("warns when api_key auth is exposed on a non-loopback host", () => {
            const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

            warnIfApiKeyOnNonLoopback("0.0.0.0", "api_key");

            expect(warnSpy).toHaveBeenCalledTimes(1);
            const [message, context] = warnSpy.mock.calls[0]!;
            expect(message).toContain("api_key");
            expect(message).toContain("non-loopback");
            expect(context).toMatchObject({ host: "0.0.0.0", authMode: "api_key" });
        });

        it("warns when both auth modes are accepted on a non-loopback host", () => {
            const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

            warnIfApiKeyOnNonLoopback("203.0.113.4", "both");

            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy.mock.calls[0]![1]).toMatchObject({ authMode: "both" });
        });

        it("stays silent on loopback hosts even with api_key", () => {
            const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

            warnIfApiKeyOnNonLoopback("127.0.0.1", "api_key");
            warnIfApiKeyOnNonLoopback("localhost", "both");
            warnIfApiKeyOnNonLoopback("::1", "api_key");

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("stays silent when authMode is jwt regardless of host", () => {
            const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

            warnIfApiKeyOnNonLoopback("0.0.0.0", "jwt");
            warnIfApiKeyOnNonLoopback("203.0.113.4", "jwt");

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("treats undefined authMode as the api_key default", () => {
            const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

            warnIfApiKeyOnNonLoopback("0.0.0.0", undefined);

            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy.mock.calls[0]![1]).toMatchObject({ authMode: "api_key" });
        });
    });
});
