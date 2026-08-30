import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProTool } from "../../src/tools/pro.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

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
        const mockBook = { bids: [], asks: [], timestamp: 123456789, symbol: "BTC/USD" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockBook);

        await handleProTool("pro_get_order_book", { pair: "BTC-USD" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/trading/order-book"),
            expect.objectContaining({ symbol: "BTC/USD" })
        );
    });

    it("should handle pro_get_public_trades", async () => {
        const mockTrades = [{ id: "1", price: "50000", amount: "0.1", side: "buy", date: "2023-01-01T00:00:00Z" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockTrades);

        await handleProTool("pro_get_public_trades", { pair: "BTC-USD" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/trading/trade/last"),
            expect.objectContaining({ symbol: "BTC/USD" })
        );
    });

    it("should handle pro_get_candles", async () => {
        const mockCandles = [[1630000000000, 50000, 51000, 49000, 50500, 100]];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockCandles);

        const result = await handleProTool("pro_get_candles", { pair: "BTC-EUR", timeframe: "1h" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/trading/candle"),
            expect.objectContaining({
                symbol: "BTC/EUR",
                interval: expect.any(Number),
                startTime: expect.any(Number),
                endTime: expect.any(Number),
                limit: 1000,
            })
        );

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed).toHaveProperty("metadata");
        expect(parsed.result).toHaveLength(1);
    });
});
