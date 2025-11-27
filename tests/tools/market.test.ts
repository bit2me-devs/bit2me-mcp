/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMarketTool } from "../../src/tools/market.js";
import axios from "axios";
import * as bit2meService from "../../src/services/bit2me.js";

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

    it("should handle market_get_ticker", async () => {
        const mockTicker = {
            price: "50000",
            time: "1234567890",
            marketCap: "1000000",
            totalVolume: "1000",
            maxSupply: "21000000",
            totalSupply: "18000000",
        };

        vi.mocked(bit2meService.getTicker).mockResolvedValue(mockTicker as any);

        const result = await handleMarketTool("market_get_ticker", { symbol: "BTC", currency: "EUR" });

        expect(bit2meService.getTicker).toHaveBeenCalledWith("BTC", "EUR");
        expect(JSON.parse(result.content[0].text)).toEqual(
            expect.objectContaining({
                price: "50000",
                time: "1234567890",
            })
        );
    });

    it("should handle market_get_ticker not found", async () => {
        vi.mocked(bit2meService.getTicker).mockResolvedValue(null);
        const result = await handleMarketTool("market_get_ticker", { symbol: "UNKNOWN" });
        expect(result.content[0].text).toBe("Ticker not found");
    });

    it("should handle market_get_chart", async () => {
        const mockData = [
            [1630000000000, 0.00002, 0.85], // timestamp, usdPerUnit, eurUsdRate
            [1630003600000, 0.000021, 0.85],
        ];

        vi.mocked(axios.get).mockResolvedValue({ data: mockData });

        const result = await handleMarketTool("market_get_chart", { ticker: "BTC/EUR", timeframe: "one-hour" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v3/currency/chart"), expect.any(Object));
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toHaveProperty("price_fiat");
    });

    it("should handle market_get_assets", async () => {
        const mockAssets = {
            BTC: { name: "Bitcoin", precision: 8 },
            ETH: { name: "Ethereum", precision: 18 },
        };
        vi.mocked(axios.get).mockResolvedValue({ data: mockAssets });

        const result = await handleMarketTool("market_get_assets", { includeTestnet: true });

        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining("/v2/currency/assets"),
            expect.objectContaining({ params: { includeTestnet: true } })
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveLength(2);
    });

    it("should handle market_get_asset_details", async () => {
        const mockAsset = { name: "Bitcoin", precision: 8 };
        vi.mocked(axios.get).mockResolvedValue({ data: mockAsset });

        const result = await handleMarketTool("market_get_asset_details", { symbol: "BTC" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v2/currency/assets/BTC"), expect.any(Object));
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.symbol).toBe("BTC");
    });

    it("should handle market_get_config", async () => {
        const mockConfig = {
            "BTC/EUR": { minAmount: "10", minSize: "0.0001" },
        };
        vi.mocked(axios.get).mockResolvedValue({ data: mockConfig });

        await handleMarketTool("market_get_config", { symbol: "BTC/EUR" });

        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining("/v1/trading/market-config"),
            expect.any(Object)
        );
    });

    it("should handle market_get_order_book", async () => {
        const mockBook = { bids: [], asks: [] };
        vi.mocked(axios.get).mockResolvedValue({ data: mockBook });

        await handleMarketTool("market_get_order_book", { symbol: "BTC/EUR" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v2/trading/order-book"), expect.any(Object));
    });

    it("should handle market_get_public_trades", async () => {
        const mockTrades = [{ id: "1", price: "50000", amount: "0.1", side: "buy" }];
        vi.mocked(axios.get).mockResolvedValue({ data: mockTrades });

        await handleMarketTool("market_get_public_trades", { symbol: "BTC/EUR" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v1/trading/trade/last"), expect.any(Object));
    });

    it("should handle market_get_candles", async () => {
        const mockCandles = [[1630000000, 50000, 51000, 49000, 50500, 100]];
        vi.mocked(axios.get).mockResolvedValue({ data: mockCandles });

        await handleMarketTool("market_get_candles", { symbol: "BTC/EUR", timeframe: "1h" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v1/trading/candle"), expect.any(Object));
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleMarketTool("unknown_tool", {})).rejects.toThrow("Unknown market tool");
    });
});
