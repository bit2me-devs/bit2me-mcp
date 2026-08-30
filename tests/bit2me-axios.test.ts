/**
 * Axios request config: no redirects, relative paths only, safe Idempotency-Key.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";

vi.mock("axios", () => {
    const mock = vi.fn();
    return { default: mock };
});

beforeAll(() => {
    if (!process.env.BIT2ME_API_KEY) process.env.BIT2ME_API_KEY = "test-api-key";
    if (!process.env.BIT2ME_API_SECRET) process.env.BIT2ME_API_SECRET = "test-api-secret";
});

import axios from "axios";
import { bit2meRequest } from "../src/services/bit2me.js";
import { ValidationError } from "../src/utils/errors.js";

interface AxiosCallConfig {
    url?: string;
    headers?: Record<string, string>;
    maxRedirects?: number;
}

function lastAxiosCall(): AxiosCallConfig {
    const calls = vi.mocked(axios).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    return calls[calls.length - 1][0] as unknown as AxiosCallConfig;
}

describe("bit2meRequest axios surface", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axios).mockResolvedValue({ status: 200, data: { ok: true } });
    });

    it("does not follow HTTP redirects", async () => {
        await bit2meRequest("GET", "/v1/account");
        expect(lastAxiosCall().maxRedirects).toBe(0);
    });

    it("rejects an absolute URL as endpoint", async () => {
        await expect(bit2meRequest("GET", "https://evil.example/v1/account")).rejects.toBeInstanceOf(ValidationError);
        expect(axios).not.toHaveBeenCalled();
    });

    it("rejects query strings embedded in the path", async () => {
        await expect(bit2meRequest("GET", "/v1/account?steal=1")).rejects.toBeInstanceOf(ValidationError);
        expect(axios).not.toHaveBeenCalled();
    });

    it("rejects CRLF in the endpoint", async () => {
        await expect(bit2meRequest("GET", "/v1/account\r\nX-Injected: 1")).rejects.toBeInstanceOf(ValidationError);
        expect(axios).not.toHaveBeenCalled();
    });

    it("rejects a CRLF idempotency key before I/O", async () => {
        await expect(
            bit2meRequest("POST", "/v1/trading/order", { pair: "BTC-EUR" }, undefined, undefined, undefined, {
                idempotencyKey: "ok\r\nX-Injected: 1",
            })
        ).rejects.toBeInstanceOf(ValidationError);
        expect(axios).not.toHaveBeenCalled();
    });
});
