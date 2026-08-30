import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("Tools - Error Handling", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { cache } = await import("../src/utils/cache.js");
        cache.clear();
    });

    it("should throw AuthenticationError on 401", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 401, data: { message: "Unauthorized" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Bit2Me API Error (401): Authentication failed");
    });

    it("should throw BadRequestError on 400", async () => {
        const axios = (await import("axios")).default;
        const { bit2meRequest } = await import("../src/services/bit2me.js");
        vi.mocked(axios).mockRejectedValue({
            response: { status: 400, data: { message: "Bad Request" } },
        });

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Bit2Me API Error (400): Bad request");
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

        await expect(bit2meRequest("GET", "/test")).rejects.toThrow(
            "Bit2Me API Error (500): Upstream temporarily unavailable"
        );
    });

    it("should handle getMarketPrice success", async () => {
        const axios = (await import("axios")).default;
        const { getMarketPrice } = await import("../src/services/bit2me.js");

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: { EUR: { BTC: [{ price: "50000" }] } },
        });

        const price = await getMarketPrice("BTC", "EUR");
        expect(price).toBe(50000);
    });

    it("should handle getMarketPrice failure", async () => {
        const axios = (await import("axios")).default;
        const { getMarketPrice } = await import("../src/services/bit2me.js");

        vi.mocked(axios).mockRejectedValue(new Error("Network Error"));
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
