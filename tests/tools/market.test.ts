/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMarketTool } from "../../src/tools/market.js";
import { handleProTool } from "../../src/tools/pro.js";
import * as bit2meService from "../../src/services/bit2me.js";
import { NotFoundError } from "../../src/utils/errors.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

describe("Market Tools Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle market_get_data", async () => {
        const mockTicker = {
            price: "50000",
            time: "1234567890",
            marketCap: "1000000",
            totalVolume: "1000",
            maxSupply: "21000000",
            totalSupply: "18000000",
        };

        vi.mocked(bit2meService.getTicker).mockResolvedValue(mockTicker as any);

        const result = await handleMarketTool("market_get_data", { base_symbol: "BTC", quote_symbol: "EUR" });

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

    it("should handle market_get_data not found", async () => {
        vi.mocked(bit2meService.getTicker).mockRejectedValue(new NotFoundError("/v1/ticker", "Ticker not found"));

        await expect(handleMarketTool("market_get_data", { base_symbol: "UNKNOWN" })).rejects.toThrow(
            "Ticker not found"
        );
    });

    it("should handle market_get_chart", async () => {
        const mockData = [
            [1630000000000, 0.00002, 0.85], // timestamp, usdPerUnit, eurUsdRate
            [1630003600000, 0.000021, 0.85],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleMarketTool("market_get_chart", { pair: "BTC-USD", timeframe: "one-hour" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v3/currency/chart"),
            expect.objectContaining({ ticker: "BTC-USD", temporality: "one-hour" })
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(2);
        expect(parsed.result[0]).toHaveProperty("price");
        expect(parsed.result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle market_get_chart with small values (precision check)", async () => {
        const mockData = [[1630000000000, 4445.82759, 1]];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleMarketTool("market_get_chart", { pair: "VRA/EUR", timeframe: "one-day" });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parseFloat(parsed.result[0].price)).not.toBe(0);
    });

    it("should handle market_get_chart with smart rounding", async () => {
        const mockData = [
            [1630000000000, 0.00002, 1],
            [1630000000000, 2, 1],
            [1630000000000, 5000, 1],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleMarketTool("market_get_chart", { pair: "MIXED/EUR", timeframe: "one-day" });
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(3);
        expect(parseFloat(parsed.result[0].price)).toBe(50000);
        expect(parseFloat(parsed.result[1].price)).toBe(0.5);
        expect(parseFloat(parsed.result[2].price)).toBe(0.0002);
    });

    it("should handle market_get_assets_details without symbol (all assets)", async () => {
        const mockAssets = {
            BTC: {
                name: "Bitcoin",
                precision: 8,
                assetType: "crypto",
                network: "BITCOIN",
                enabled: true,
                ticker: true,
                loanable: false,
                pairsWith: ["EUR"],
            },
            ETH: {
                name: "Ethereum",
                precision: 18,
                assetType: "crypto",
                network: "ETHEREUM",
                enabled: true,
                ticker: true,
                loanable: false,
                pairsWith: ["EUR"],
            },
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAssets);

        const result = await handleMarketTool("market_get_assets_details", { include_testnet: true });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/currency/assets"),
            expect.objectContaining({ includeTestnet: true })
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(2);
        // Verify network is lowercase
        expect(parsed.result[0].network).toBe("bitcoin");
        expect(parsed.result[1].network).toBe("ethereum");
    });

    it("should handle market_get_assets_details with symbol (single asset)", async () => {
        const mockAsset = {
            name: "Bitcoin",
            precision: 8,
            assetType: "crypto",
            network: "BITCOIN",
            enabled: true,
            ticker: true,
            loanable: false,
            pairsWith: ["EUR"],
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAsset);

        const result = await handleMarketTool("market_get_assets_details", { symbol: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/currency/assets/BTC"),
            expect.any(Object)
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parsed.result.symbol).toBe("BTC");
        // Verify network is lowercase
        expect(parsed.result.network).toBe("bitcoin");
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleMarketTool("unknown_tool", {} as any)).rejects.toThrow("Unknown market tool");
    });
});

// Tests for PRO Trading tools that were previously in market.ts
describe("Pro Trading Market Tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle pro_get_market_config", async () => {
        const mockConfig = {
            "BTC-USD": { minAmount: "10", minSize: "0.0001" },
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockConfig);

        await handleProTool("pro_get_market_config", { pair: "BTC-USD" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/trading/market-config"),
            expect.objectContaining({ symbol: "BTC-USD" })
        );
    });

    it("should handle pro_get_order_book", async () => {
        const mockBook = { orderBook: { bids: [], asks: [] } };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockBook);

        await handleProTool("pro_get_order_book", { pair: "BTC-USD" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/trading/order-book"),
            expect.objectContaining({ symbol: "BTC-USD" })
        );
    });

    it("should handle pro_get_public_trades", async () => {
        const mockTrades = [{ id: "1", price: "50000", amount: "0.1", side: "buy", date: "2023-01-01T00:00:00Z" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockTrades);

        await handleProTool("pro_get_public_trades", { pair: "BTC-USD" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/trading/trade/last"),
            expect.objectContaining({ symbol: "BTC-USD" })
        );
    });

    it("should handle pro_get_candles", async () => {
        const mockCandles = [[1630000000, 50000, 51000, 49000, 50500, 100]];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockCandles);

        const result = await handleProTool("pro_get_candles", { pair: "BTC-USD", timeframe: "1h" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/trading/candle"),
            expect.objectContaining({ symbol: "BTC-USD", timeframe: "1h" })
        );

        // Check for contextual structure
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed).toHaveProperty("metadata");
        expect(parsed.result).toHaveLength(1);
    });
});
