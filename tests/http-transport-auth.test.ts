import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildHttpServer, isLoopbackHost, warnIfApiKeyOnNonLoopback } from "../src/transport/http.js";
import { getSessionToken } from "../src/utils/context.js";
import { logger } from "../src/utils/logger.js";
import { readyJwtApp } from "./http-transport-app.js";

let app: FastifyInstance;

beforeAll(async () => {
    app = await readyJwtApp();
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

describe("HTTP transport — auth-failure lockout", () => {
    it("locks out the same identity after the failure cap is hit", async () => {
        const lockoutApp = await buildHttpServer({
            authMode: "jwt",
            authFailureMaxPerMinute: 3,
        });
        await lockoutApp.ready();

        for (let i = 0; i < 3; i++) {
            const r = await lockoutApp.inject({ method: "GET", url: "/health" });
            expect(r.statusCode).toBe(401);
        }

        const final = await lockoutApp.inject({ method: "GET", url: "/health" });
        expect(final.statusCode).toBe(429);

        const live = await lockoutApp.inject({ method: "GET", url: "/livez" });
        expect(live.statusCode).toBe(200);

        await lockoutApp.close();
    });
});

describe("HTTP transport — ALS request isolation", () => {
    it("two concurrent requests don't leak each other's session token", async () => {
        const probeApp = await buildHttpServer({ authMode: "jwt" });
        probeApp.post("/probe", async (req, reply) => {
            const auth = (req.headers["authorization"] as string | undefined) ?? "";
            const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice("bearer ".length).trim() : undefined;
            if (!token) {
                reply.code(401);
                return { error: "missing" };
            }
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
