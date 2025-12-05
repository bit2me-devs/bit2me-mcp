/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGeneralTool } from "../../src/tools/general.js";
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

describe("General Tools Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle get_assets_details without symbol (all assets)", async () => {
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

        const result = await handleGeneralTool("get_assets_details", { include_testnet: true });

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

    it("should handle get_assets_details with symbol (single asset)", async () => {
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

        const result = await handleGeneralTool("get_assets_details", { symbol: "BTC" });

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
        await expect(handleGeneralTool("unknown_tool", {} as any)).rejects.toThrow("Unknown general tool");
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
