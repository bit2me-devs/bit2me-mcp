/**
 * Concurrency safety tests.
 *
 * These tests assert that two `executeTool` invocations running in parallel
 * cannot leak each other's session token or correlation ID. Before the
 * AsyncLocalStorage migration, the second `setSessionToken()` would overwrite
 * the first because the value lived on the global object.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setLevel: vi.fn(),
        addSensitiveKey: vi.fn(),
    },
    initLogger: vi.fn(),
}));

vi.mock("../src/utils/metrics.js", () => ({
    metricsCollector: {
        recordToolExecution: vi.fn(),
    },
}));

import { executeTool } from "../src/utils/tool-wrapper.js";
import { getSessionToken, getCorrelationId, runWithContext, getContext } from "../src/utils/context.js";
import { nextNonce } from "../src/services/bit2me.js";

describe("Concurrency - per-request context isolation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("isolates session tokens across two interleaved tool executions", async () => {
        const seenA: string[] = [];
        const seenB: string[] = [];

        let resolveA!: () => void;
        const blockA = new Promise<void>((r) => (resolveA = r));

        const runA = executeTool("tool_a", { jwt: "JWT_A" }, async () => {
            seenA.push(getSessionToken() ?? "<none>");
            await blockA;
            seenA.push(getSessionToken() ?? "<none>");
            return "A_done";
        });

        // Start B while A is suspended on `blockA`. B must not affect A.
        const runB = executeTool("tool_b", { jwt: "JWT_B" }, async () => {
            seenB.push(getSessionToken() ?? "<none>");
            await Promise.resolve();
            seenB.push(getSessionToken() ?? "<none>");
            return "B_done";
        });

        // Let B advance, then unblock A.
        await runB;
        resolveA();
        await runA;

        expect(seenB).toEqual(["JWT_B", "JWT_B"]);
        expect(seenA).toEqual(["JWT_A", "JWT_A"]);
    });

    it("isolates correlation IDs across concurrent executions", async () => {
        let idA: string | undefined;
        let idB: string | undefined;

        const a = executeTool("tool_a", {}, async () => {
            idA = getCorrelationId();
            await new Promise((r) => setTimeout(r, 5));
            // After awaiting, the correlation ID must still be A's, not B's.
            expect(getCorrelationId()).toBe(idA);
            return "ok";
        });

        const b = executeTool("tool_b", {}, async () => {
            idB = getCorrelationId();
            await new Promise((r) => setTimeout(r, 1));
            expect(getCorrelationId()).toBe(idB);
            return "ok";
        });

        await Promise.all([a, b]);

        expect(idA).toBeDefined();
        expect(idB).toBeDefined();
        expect(idA).not.toBe(idB);
    });

    it("does not leak session token outside the runWithContext boundary", async () => {
        await executeTool("tool_a", { jwt: "JWT_A" }, async () => {
            expect(getSessionToken()).toBe("JWT_A");
        });
        // After the executor resolves, no session should remain visible to
        // unrelated callers (the fallback global is not used by executeTool).
        expect(getSessionToken()).toBeUndefined();
    });

    it("propagates per-request API credentials from a parent context into executeTool", async () => {
        const { getRequestApiKey, getRequestApiSecret } = await import("../src/utils/context.js");

        let observedKey: string | undefined;
        let observedSecret: string | undefined;

        await runWithContext(
            {
                correlationId: "parent-corr",
                startTime: Date.now(),
                apiKey: "TENANT_A_KEY",
                apiSecret: "TENANT_A_SECRET",
            },
            async () => {
                await executeTool("inner", {}, async () => {
                    observedKey = getRequestApiKey();
                    observedSecret = getRequestApiSecret();
                });
            }
        );

        expect(observedKey).toBe("TENANT_A_KEY");
        expect(observedSecret).toBe("TENANT_A_SECRET");
        // Outside the parent context, nothing leaks.
        expect(getRequestApiKey()).toBeUndefined();
        expect(getRequestApiSecret()).toBeUndefined();
    });

    it("runWithContext attaches a fresh context to its callback", () => {
        const result = runWithContext(
            { correlationId: "corr-123", startTime: Date.now(), sessionToken: "tok" },
            () => {
                const ctx = getContext();
                return {
                    corr: ctx?.correlationId,
                    tok: ctx?.sessionToken,
                };
            }
        );

        expect(result).toEqual({ corr: "corr-123", tok: "tok" });
    });
});

describe("Concurrency - monotonic nonce", () => {
    it("emits strictly increasing nonces even when called rapidly in the same ms", () => {
        const nonces = Array.from({ length: 200 }, () => nextNonce());
        const set = new Set(nonces);
        expect(set.size).toBe(nonces.length);
        for (let i = 1; i < nonces.length; i++) {
            expect(nonces[i]).toBeGreaterThan(nonces[i - 1]);
        }
    });
});
