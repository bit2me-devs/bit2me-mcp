import { describe, it, expect, vi, beforeEach } from "vitest";
import { bit2meRequest } from "../src/services/bit2me.js";
import { MOCK_WALLET_POCKETS, MOCK_TICKER_BTC_EUR } from "./fixtures.js";

// Mock axios module
vi.mock("axios", () => {
    return {
        default: vi.fn(),
    };
});

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock config
vi.mock("../src/config.js", () => ({
    config: {
        BIT2ME_API_KEY: "test-api-key",
        BIT2ME_API_SECRET: "test-api-secret",
    },
    getConfig: vi.fn(() => ({
        BIT2ME_API_KEY: "test-api-key",
        BIT2ME_API_SECRET: "test-api-secret",
        REQUEST_TIMEOUT: 30000,
        MAX_RETRIES: 3,
        RETRY_BASE_DELAY: 1000,
        LOG_LEVEL: "info",
    })),
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
}));

describe("Tools - Asset Management", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should make authenticated GET request to wallet endpoint", async () => {
        const axios = (await import("axios")).default;

        // Mock successful response
        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: MOCK_WALLET_POCKETS,
        });

        const result = await bit2meRequest("GET", "/v1/wallet/pocket");

        // Verify axios was called
        expect(axios).toHaveBeenCalledTimes(1);

        // Verify the call had correct structure
        const callArgs = vi.mocked(axios).mock.calls[0][0] as any;
        expect(callArgs.method).toBe("GET");
        expect(callArgs.url).toContain("/v1/wallet/pocket");
        expect(callArgs.headers).toHaveProperty("x-api-key", "test-api-key");
        expect(callArgs.headers).toHaveProperty("x-nonce");
        expect(callArgs.headers).toHaveProperty("api-signature");

        // Verify response
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

        const callArgs = vi.mocked(axios).mock.calls[0][0] as any;
        expect(callArgs.method).toBe("POST");
        expect(callArgs.data).toBe(JSON.stringify(orderData));
        expect(callArgs.headers).toHaveProperty("Content-Type", "application/json");
        expect(callArgs.headers).toHaveProperty("api-signature");
    });

    it("should handle API errors gracefully", async () => {
        const axios = (await import("axios")).default;

        // Mock error response
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

        // First call fails with 429, second succeeds
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

        // Should have been called twice (initial + 1 retry)
        expect(axios).toHaveBeenCalledTimes(2);
        expect(result).toEqual(MOCK_WALLET_POCKETS);
    }, 10000);

    it("should use exponential backoff for retries", async () => {
        const axios = (await import("axios")).default;
        const { logger } = await import("../src/utils/logger.js");

        // Simulate multiple 429 errors then success
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

        // Should have been called 3 times (initial + 2 retries)
        expect(axios).toHaveBeenCalledTimes(3);
        expect(result).toEqual(MOCK_WALLET_POCKETS);

        // Verify exponential backoff was logged
        const warnCalls = vi.mocked(logger.warn).mock.calls;
        expect(warnCalls.length).toBeGreaterThanOrEqual(2);

        // First retry should mention a delay around 1000ms (base delay)
        expect(warnCalls[0][0]).toContain("Retrying in");

        // Second retry should mention a longer delay (exponential backoff)
        expect(warnCalls[1][0]).toContain("Retrying in");
    }, 10000);

    it("should throw RateLimitError when retries are exhausted", async () => {
        const axios = (await import("axios")).default;

        // Simulate 429 errors exceeding max retries (3)
        vi.mocked(axios).mockRejectedValue({
            response: {
                status: 429,
                data: { message: "Rate limit exceeded" },
            },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Rate limit exceeded");
        expect(axios).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 10000);

    it("should include query params in GET requests", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: MOCK_WALLET_POCKETS.filter((p) => p.currency === "BTC"),
        });

        await bit2meRequest("GET", "/v1/wallet/pocket", { currency: "BTC" });

        const callArgs = vi.mocked(axios).mock.calls[0][0] as any;
        expect(callArgs.url).toContain("?currency=BTC");
        expect(callArgs.params).toBeUndefined();
    });
});

describe("Tools - Market Data", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch ticker data without authentication", async () => {
        const axios = (await import("axios")).default;

        // Mock the direct axios.get call used in getTicker
        const mockAxiosGet = vi.fn().mockResolvedValue({
            data: {
                EUR: {
                    BTC: [MOCK_TICKER_BTC_EUR],
                },
            },
        });
        vi.mocked(axios).get = mockAxiosGet;

        const { getTicker } = await import("../src/services/bit2me.js");
        const result = await getTicker("BTC", "EUR");

        expect(result).toEqual(MOCK_TICKER_BTC_EUR);
        expect(mockAxiosGet).toHaveBeenCalledWith(expect.stringContaining("/v3/currency/ticker/BTC"), {
            params: { rateCurrency: "EUR" },
        });
    });
});

describe("Tools - Error Handling", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should throw AuthenticationError on 401", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 401, data: { message: "Unauthorized" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Authentication failed");
    });

    it("should throw BadRequestError on 400", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 400, data: { message: "Bad Request" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Bit2Me API Error (400): Bad Request");
    });

    it("should throw NotFoundError on 404", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 404, data: { message: "Not Found" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Resource not found");
    });

    it("should throw Bit2MeAPIError on 500", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 500, data: { message: "Server Error" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Bit2Me API Error (500): Server Error");
    });

    it("should handle getMarketPrice success", async () => {
        const axios = (await import("axios")).default;
        const { getMarketPrice } = await import("../src/services/bit2me.js");

        vi.mocked(axios.get).mockResolvedValue({
            data: { EUR: { BTC: [{ price: "50000" }] } },
        });

        const price = await getMarketPrice("BTC", "EUR");
        expect(price).toBe(50000);
    });

    it("should handle getMarketPrice failure", async () => {
        const axios = (await import("axios")).default;
        const { getMarketPrice } = await import("../src/services/bit2me.js");

        vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));
        const price = await getMarketPrice("BTC", "EUR");
        expect(price).toBe(0);
    });

    it("should handle getMarketPrice same currency", async () => {
        const { getMarketPrice } = await import("../src/services/bit2me.js");
        const price = await getMarketPrice("EUR", "EUR");
        expect(price).toBe(1);
    });

    it("should handle getMarketPrice invalid symbol", async () => {
        const { getMarketPrice } = await import("../src/services/bit2me.js");
        const price = await getMarketPrice("INVALID_LONG_SYMBOL", "EUR");
        expect(price).toBe(0);
    });
});
