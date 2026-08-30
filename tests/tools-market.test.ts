import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_TICKER_BTC_EUR } from "./fixtures.js";

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

describe("Tools - Market Data", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch ticker data without authentication", async () => {
        const axios = (await import("axios")).default;

        vi.mocked(axios).mockResolvedValue({
            status: 200,
            data: {
                EUR: {
                    BTC: [MOCK_TICKER_BTC_EUR],
                },
            },
        });

        const { getTicker } = await import("../src/services/bit2me.js");
        const result = await getTicker("BTC", "EUR");

        expect(result).toEqual(MOCK_TICKER_BTC_EUR);
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                url: expect.stringContaining("/v3/currency/ticker/BTC"),
                method: "GET",
            })
        );
    });
});
