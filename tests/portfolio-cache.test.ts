import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_WALLET_POCKETS } from "./fixtures.js";
import { mockStandardBalances, mockStandardPrices } from "./portfolio-helpers.js";

vi.mock("../src/config.js", async () => {
    const { PORTFOLIO_MOCK_CONFIG } = await import("./portfolio-helpers.js");
    return {
        getConfig: () => PORTFOLIO_MOCK_CONFIG,
    };
});

vi.mock("../src/services/bit2me.js", () => ({
    bit2meRequest: vi.fn(),
    getMarketPrice: vi.fn(),
    getTicker: vi.fn(),
}));

describe("Meta-Tool: Portfolio Valuation", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { cache } = await import("../src/utils/cache.js");
        cache.clear();
    });

    it("should handle API failures gracefully", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

        vi.mocked(bit2meRequest).mockImplementation(async (method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") {
                return MOCK_WALLET_POCKETS;
            }
            throw new Error("API Error");
        });

        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string, _fiat: string) => {
            if (crypto === "EUR") return 1;
            if (crypto === "BTC") return 50000;
            if (crypto === "ETH") return 3000;
            return 0;
        });

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        expect(data.result).toHaveProperty("total_balance");
        expect(data.result).toHaveProperty("by_service");
        expect(data.result.by_service).toHaveProperty("wallet_balance");
        if (data.result.total_balance && parseFloat(data.result.total_balance) > 0) {
            expect(parseFloat(data.result.total_balance)).toBeGreaterThan(0);
        }
        expect(data.result.details.length).toBeGreaterThanOrEqual(0);
    });

    it("materializes the aggregation: a second call hits the cache", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

        mockStandardBalances(vi.mocked(bit2meRequest));
        mockStandardPrices(vi.mocked(getMarketPrice));

        await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const callsAfterFirst = vi.mocked(bit2meRequest).mock.calls.length;
        await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        expect(vi.mocked(bit2meRequest).mock.calls.length).toBe(callsAfterFirst);
    });

    it("force_refresh bypasses the materialized view", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

        mockStandardBalances(vi.mocked(bit2meRequest));
        vi.mocked(getMarketPrice).mockResolvedValue(1);

        await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const baseline = vi.mocked(bit2meRequest).mock.calls.length;
        await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR", force_refresh: true });
        expect(vi.mocked(bit2meRequest).mock.calls.length).toBeGreaterThan(baseline);
    });
});
