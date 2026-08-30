import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBrokerTool } from "../../src/tools/broker.js";
import * as bit2meService from "../../src/services/bit2me.js";
import { NotFoundError } from "../../src/utils/errors.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

describe("Broker Tools Handler — read", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle broker_get_asset_price", async () => {
        const mockRates = [
            {
                fiat: { USD: 1, EUR: 0.9 },
                crypto: { BTC: 0.00002 }, // 1 USD = 0.00002 BTC -> 1 BTC = 50,000 USD -> 45,000 EUR
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockRates);

        const result = await handleBrokerTool("broker_get_asset_price", { quote_symbol: "EUR", base_symbol: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/currency/rate", expect.any(Object));
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
    });

    it("should handle broker_get_asset_data", async () => {
        const mockTicker = {
            price: "50000",
            time: "1234567890",
            marketCap: "1000000",
            totalVolume: "1000",
            maxSupply: "21000000",
            totalSupply: "18000000",
        };

        vi.mocked(bit2meService.getTicker).mockResolvedValue(mockTicker);

        const result = await handleBrokerTool("broker_get_asset_data", { base_symbol: "BTC", quote_symbol: "EUR" });

        expect(bit2meService.getTicker).toHaveBeenCalledWith("BTC", "EUR");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toEqual(
            expect.objectContaining({
                price: "50000",
                date: expect.any(String),
            })
        );
    });

    it("should handle broker_get_asset_data not found", async () => {
        vi.mocked(bit2meService.getTicker).mockRejectedValue(new NotFoundError("/v1/ticker", "Ticker not found"));

        await expect(handleBrokerTool("broker_get_asset_data", { base_symbol: "UNKNOWN" })).rejects.toThrow(
            "Bit2Me API Error (404): Resource not found"
        );
    });

    it("should handle broker_get_asset_chart", async () => {
        const mockData = [
            [1630000000000, 0.00002, 0.85], // timestamp, usdPerUnit, eurUsdRate
            [1630003600000, 0.000021, 0.85],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_asset_chart", { pair: "BTC-USD", timeframe: "1h" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v3/currency/chart?ticker=BTC/USD&temporality=one-hour"),
            undefined
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(2);
        expect(parsed.result[0]).toHaveProperty("price");
        expect(parsed.result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle broker_get_asset_chart with small values (precision check)", async () => {
        const mockData = [[1630000000000, 4445.82759, 1]];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_asset_chart", { pair: "VRA/EUR", timeframe: "1d" });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parseFloat(parsed.result[0].price)).not.toBe(0);
    });

    it("should handle broker_get_asset_chart with smart rounding", async () => {
        const mockData = [
            [1630000000000, 0.00002, 1],
            [1630000000000, 2, 1],
            [1630000000000, 5000, 1],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_asset_chart", { pair: "MIXED/EUR", timeframe: "1d" });
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(3);
        expect(parseFloat(parsed.result[0].price)).toBe(50000);
        expect(parseFloat(parsed.result[1].price)).toBe(0.5);
        expect(parseFloat(parsed.result[2].price)).toBe(0.0002);
    });

    it("should throw error for invalid timeframe", async () => {
        await expect(
            handleBrokerTool("broker_get_asset_chart", { pair: "BTC-USD", timeframe: "invalid" })
        ).rejects.toThrow("Invalid timeframe");
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleBrokerTool("unknown_tool", {})).rejects.toThrow("Unknown broker tool");
    });
});
