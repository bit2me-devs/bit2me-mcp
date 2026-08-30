import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosRequestConfig } from "axios";
import { bit2meRequest } from "../src/services/bit2me.js";
import { MOCK_WALLET_POCKETS } from "./fixtures.js";

function firstAxiosConfig(axiosFn: { mock: { calls: unknown[][] } }): AxiosRequestConfig {
    const first = axiosFn.mock.calls[0]?.[0];
    if (!first || typeof first !== "object") {
        throw new Error("expected axios to have been called with a config object");
    }
    return first as AxiosRequestConfig;
}

vi.mock("axios", () => {
    return {
        default: vi.fn(),
    };
});

vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("../src/config.js", () => ({
    getConfig: vi.fn(() => ({
        BIT2ME_API_KEY: "test-api-key",
        BIT2ME_API_SECRET: "test-api-secret",
        REQUEST_TIMEOUT: 30000,
        MAX_RETRIES: 3,
        RETRY_BASE_DELAY: 1000,
        LOG_LEVEL: "info",
        GATEWAY_URL: "https://gateway.bit2me.com",
    })),
    getGatewayUrl: () => "https://gateway.bit2me.com",
}));

describe("Tools - Asset Management", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should make authenticated GET request to wallet endpoint", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: MOCK_WALLET_POCKETS,
        });

        const result = await bit2meRequest("GET", "/v1/wallet/pocket");

        expect(axios).toHaveBeenCalledTimes(1);

        const callArgs = firstAxiosConfig(vi.mocked(axios));
        expect(callArgs.method).toBe("GET");
        expect(callArgs.url).toContain("/v1/wallet/pocket");
        expect(callArgs.headers).toHaveProperty("x-api-key", "test-api-key");
        expect(callArgs.headers).toHaveProperty("x-nonce");
        expect(callArgs.headers).toHaveProperty("api-signature");

        expect(result).toEqual(MOCK_WALLET_POCKETS);
    });

    it("should make authenticated POST request with body", async () => {
        const axios = (await import("axios")).default;

        const orderData = { pair: "BTC-EUR", amount: "0.1", type: "BUY" };

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: { orderId: "uuid-order-123", status: "PENDING" },
        });

        await bit2meRequest("POST", "/v1/trading/order", orderData);

        expect(axios).toHaveBeenCalledTimes(1);

        const callArgs = firstAxiosConfig(vi.mocked(axios));
        expect(callArgs.method).toBe("POST");
        expect(callArgs.data).toBe(JSON.stringify(orderData));
        expect(callArgs.headers).toHaveProperty("Content-Type", "application/json");
        expect(callArgs.headers).toHaveProperty("api-signature");
    });

    it("should handle API errors gracefully", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockRejectedValue({
            response: {
                status: 401,
                data: { message: "Invalid API key" },
            },
            message: "Request failed",
        });

        await expect(bit2meRequest("GET", "/v1/wallet/pocket")).rejects.toThrow(
            "Bit2Me API Error (401): Authentication failed"
        );
    });

    it("should retry on rate limit (429)", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios)
            .mockRejectedValueOnce({
                response: {
                    status: 429,
                    data: { message: "Rate limit exceeded" },
                },
            })
            .mockResolvedValueOnce({
                status: 200,
                data: MOCK_WALLET_POCKETS,
            });

        const result = await bit2meRequest("GET", "/v1/wallet/pocket");

        expect(axios).toHaveBeenCalledTimes(2);
        expect(result).toEqual(MOCK_WALLET_POCKETS);
    }, 10000);

    it("should use exponential backoff for retries", async () => {
        const axios = (await import("axios")).default;
        const { logger } = await import("../src/utils/logger.js");

        vi.mocked(axios)
            .mockRejectedValueOnce({
                response: {
                    status: 429,
                    data: { message: "Rate limit exceeded" },
                },
            })
            .mockRejectedValueOnce({
                response: {
                    status: 429,
                    data: { message: "Rate limit exceeded" },
                },
            })
            .mockResolvedValueOnce({
                status: 200,
                data: MOCK_WALLET_POCKETS,
            });

        const result = await bit2meRequest("GET", "/v1/wallet/pocket");

        expect(axios).toHaveBeenCalledTimes(3);
        expect(result).toEqual(MOCK_WALLET_POCKETS);

        const warnCalls = vi.mocked(logger.warn).mock.calls;
        expect(warnCalls.length).toBeGreaterThanOrEqual(2);

        expect(warnCalls[0][0]).toContain("Retrying in");

        expect(warnCalls[1][0]).toContain("Retrying in");
    }, 10000);

    it("should throw RateLimitError when retries are exhausted", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockRejectedValue({
            response: {
                status: 429,
                data: { message: "Rate limit exceeded" },
            },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Bit2Me API Error (429): Rate limited");
        expect(axios).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 10000);

    it("should include query params in GET requests", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: MOCK_WALLET_POCKETS.filter((p) => p.currency === "BTC"),
        });

        await bit2meRequest("GET", "/v1/wallet/pocket", { currency: "BTC" });

        const callArgs = firstAxiosConfig(vi.mocked(axios));
        expect(callArgs.url).toContain("?currency=BTC");
        expect(callArgs.params).toBeUndefined();
    });
});
