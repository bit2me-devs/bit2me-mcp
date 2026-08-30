import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGeneralTool } from "../../src/tools/general.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("axios");
vi.mock("../../src/config.js", () => ({
    getConfig: vi.fn(() => ({
        API_KEY: "test-key",
        API_SECRET: "test-secret",
        INCLUDE_RAW_RESPONSE: false,
    })),
}));

describe("Aggregation Tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle portfolio_get_valuation", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockImplementation(async (method, url) => {
            if (url.includes("/v1/wallet/pocket")) return [];
            if (url.includes("/v2/earn/wallets")) return [];
            if (url.includes("/v1/loan/orders")) return [];
            if (url.includes("/v1/trading/wallet/balance")) return [];
            return [];
        });

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveProperty("total_balance");
        expect(parsed.result).toHaveProperty("quote_symbol", "EUR");
        expect(parsed.result).toHaveProperty("by_service");
        expect(parsed.result.by_service).toHaveProperty("wallet_balance");
        expect(parsed.result.by_service).toHaveProperty("pro_balance");
        expect(parsed.result.by_service).toHaveProperty("earn_balance");
        expect(parsed.result.by_service).toHaveProperty("loan_guarantees_balance");
    });

    it("should accept fiat_symbol as alias of quote_symbol", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);

        const result = await handleGeneralTool("portfolio_get_valuation", { fiat_symbol: "USD" });
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result).toHaveProperty("quote_symbol", "USD");
    });

    it("should throw for unknown aggregation tool", async () => {
        await expect(handleGeneralTool("unknown_portfolio", {})).rejects.toThrow("Unknown general tool");
    });
});
