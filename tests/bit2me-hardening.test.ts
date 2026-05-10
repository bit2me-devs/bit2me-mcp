/**
 * Hardening tests for `src/services/bit2me.ts`. These guard against
 * regressions of the OWASP audit fixes:
 *
 *   - HTTP header / cookie injection through a session token (CRLF,
 *     control bytes, semicolons).
 *   - Silent serialisation of nested params as `[object Object]`.
 *   - Browser-impersonating User-Agent.
 *   - Missing axios size limits.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("axios", () => {
    const mock = vi.fn();
    return { default: mock };
});

import axios from "axios";
import { bit2meRequest } from "../src/services/bit2me.js";
import { runWithContext } from "../src/utils/context.js";
import { ValidationError } from "../src/utils/errors.js";

interface AxiosCallConfig {
    url?: string;
    headers?: Record<string, string>;
    maxContentLength?: number;
    maxBodyLength?: number;
}

function lastAxiosCall(): AxiosCallConfig {
    const calls = vi.mocked(axios).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[calls.length - 1];
    return args[0] as unknown as AxiosCallConfig;
}

describe("bit2meRequest hardening", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axios).mockResolvedValue({ status: 200, data: { ok: true } });
    });

    it("rejects session tokens that contain CRLF (HTTP header injection)", async () => {
        await expect(
            runWithContext(
                {
                    correlationId: "test-crlf",
                    startTime: Date.now(),
                    sessionToken: "abc\r\nSet-Cookie: evil=1",
                },
                () => bit2meRequest("GET", "/v1/account")
            )
        ).rejects.toBeInstanceOf(ValidationError);
        expect(axios).not.toHaveBeenCalled();
    });

    it("rejects session tokens with semicolons (cookie smuggling)", async () => {
        await expect(
            runWithContext(
                {
                    correlationId: "test-semi",
                    startTime: Date.now(),
                    sessionToken: "abc; admin=true",
                },
                () => bit2meRequest("GET", "/v1/account")
            )
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects session tokens larger than 4 KiB", async () => {
        const huge = "a".repeat(5000);
        await expect(
            runWithContext(
                {
                    correlationId: "test-huge",
                    startTime: Date.now(),
                    sessionToken: huge,
                },
                () => bit2meRequest("GET", "/v1/account")
            )
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("accepts a JWT-shaped session token", async () => {
        await runWithContext(
            {
                correlationId: "test-jwt",
                startTime: Date.now(),
                sessionToken: "eyJhbGciOi.payload.signature",
            },
            () => bit2meRequest("GET", "/v1/account")
        );
        expect(axios).toHaveBeenCalledTimes(1);
        const cfg = lastAxiosCall();
        expect(cfg.headers?.["Cookie"]).toContain("eyJhbGciOi.payload.signature");
    });

    it("rejects nested objects in GET query params", async () => {
        await expect(bit2meRequest("GET", "/v1/test", { filter: { nested: true } })).rejects.toBeInstanceOf(
            ValidationError
        );
        expect(axios).not.toHaveBeenCalled();
    });

    it("rejects array values in GET query params", async () => {
        await expect(bit2meRequest("GET", "/v1/test", { ids: [1, 2, 3] })).rejects.toBeInstanceOf(ValidationError);
    });

    it("accepts scalar GET params and serialises them deterministically", async () => {
        await bit2meRequest("GET", "/v1/test", { symbol: "BTC", limit: 10, active: true });
        const cfg = lastAxiosCall();
        expect(cfg.url).toContain("?");
        expect(cfg.url).toContain("symbol=BTC");
        expect(cfg.url).toContain("limit=10");
        expect(cfg.url).toContain("active=true");
    });

    it("uses an identifying User-Agent (no browser impersonation)", async () => {
        await bit2meRequest("GET", "/v1/test");
        const cfg = lastAxiosCall();
        expect(cfg.headers?.["User-Agent"]).toMatch(/^bit2me-mcp\//);
        expect(cfg.headers?.["User-Agent"]).not.toMatch(/Mozilla|Chrome|Safari/);
    });

    it("caps response and request body sizes", async () => {
        await bit2meRequest("GET", "/v1/test");
        const cfg = lastAxiosCall();
        expect(cfg.maxContentLength ?? 0).toBeGreaterThan(0);
        expect(cfg.maxBodyLength ?? 0).toBeGreaterThan(0);
        expect(cfg.maxContentLength ?? 0).toBeLessThanOrEqual(20 * 1024 * 1024);
    });
});
