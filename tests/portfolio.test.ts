import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_WALLET_POCKETS, MOCK_PRO_WALLETS, MOCK_EARN_WALLETS } from "./fixtures.js";

// Mock the API module
vi.mock("../src/services/bit2me.js", () => ({
    bit2meRequest: vi.fn(),
    getMarketPrice: vi.fn(),
    getTicker: vi.fn(),
}));

describe("Meta-Tool: Portfolio Valuation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should aggregate wallet + pro + earn and convert to EUR", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleAggregationTool } = await import("../src/tools/aggregation.js");

        // Mock API responses
        vi.mocked(bit2meRequest).mockImplementation(async (method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") {
                return MOCK_WALLET_POCKETS;
            }
            if (endpoint === "/v1/trading/wallet/balance") {
                return MOCK_PRO_WALLETS;
            }
            if (endpoint === "/v2/earn/wallets") {
                return MOCK_EARN_WALLETS;
            }
            if (endpoint === "/v1/loan/orders") {
                return { data: [] }; // No loans
            }
            return [];
        });

        // Mock market prices
        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string, _fiat: string) => {
            if (crypto === "EUR") return 1;
            if (crypto === "BTC") return 50000;
            if (crypto === "ETH") return 3000;
            if (crypto === "USDT") return 0.95;
            return 0;
        });

        const result = await handleAggregationTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        // Verify contextual structure
        expect(data).toHaveProperty("request");
        expect(data).toHaveProperty("result");
        expect(data.result).toHaveProperty("quote_symbol", "EUR");
        expect(data.result).toHaveProperty("total_value");
        expect(data.result).toHaveProperty("details");
        expect(Array.isArray(data.result.details)).toBe(true);

        // Verify calculations
        // BTC: Wallet (0.5) + Pro (1.0) = 1.5 BTC * 50000 = 75000 EUR
        // ETH: Wallet (2.5) = 2.5 ETH * 3000 = 7500 EUR
        // EUR: Wallet (1000.5) + Pro (5000) = 6000.5 EUR
        // USDT: Earn (1000) * 0.95 = 950 EUR
        // Expected total: 75000 + 7500 + 6000.5 + 950 = 89450.5 EUR

        expect(parseFloat(data.result.total_value)).toBeGreaterThan(80000);
        expect(parseFloat(data.result.total_value)).toBeLessThan(100000);

        // Verify BTC is in the breakdown
        const btcDetail = data.result.details.find((d: any) => d.asset === "BTC");
        expect(btcDetail).toBeDefined();
        // BTC: Wallet (0.5) + Pro (1.0) + Earn (0.1) = 1.6 BTC
        expect(btcDetail.amount).toBe("1.6");
        expect(btcDetail.price_unit).toBe("50000");
    });

    it("should handle API failures gracefully", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleAggregationTool } = await import("../src/tools/aggregation.js");

        // Mock some APIs failing
        vi.mocked(bit2meRequest).mockImplementation(async (method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") {
                return MOCK_WALLET_POCKETS;
            }
            // Other endpoints fail
            throw new Error("API Error");
        });

        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string, _fiat: string) => {
            if (crypto === "EUR") return 1;
            if (crypto === "BTC") return 50000;
            if (crypto === "ETH") return 3000;
            return 0;
        });

        // Should not throw, but continue with available data
        const result = await handleAggregationTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        // Should still have wallet data
        expect(parseFloat(data.result.total_value)).toBeGreaterThan(0);
        expect(data.result.details.length).toBeGreaterThan(0);
    });

    it("should filter out dust (very small amounts)", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleAggregationTool } = await import("../src/tools/aggregation.js");

        // Mock wallet with dust amounts
        vi.mocked(bit2meRequest).mockImplementation(async (method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") {
                return [
                    { currency: "BTC", balance: "0.5", available: "0.5", name: "BTC" },
                    { currency: "DUST", balance: "0.0001", available: "0.0001", name: "Dust" },
                ];
            }
            return [];
        });

        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string, _fiat: string) => {
            if (crypto === "BTC") return 50000;
            if (crypto === "DUST") return 0.0001; // Very small value
            return 0;
        });

        const result = await handleAggregationTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        // DUST should be filtered out (value < 0.01)
        const dustDetail = data.result.details.find((d: any) => d.asset === "DUST");
        expect(dustDetail).toBeUndefined();

        // BTC should be present
        const btcDetail = data.result.details.find((d: any) => d.asset === "BTC");
        expect(btcDetail).toBeDefined();
    });

    it("should sort assets by value (descending)", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleAggregationTool } = await import("../src/tools/aggregation.js");

        vi.mocked(bit2meRequest).mockImplementation(async (method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") {
                return [
                    { currency: "BTC", balance: "0.1", available: "0.1", name: "BTC" },
                    { currency: "EUR", balance: "10000", available: "10000", name: "EUR" },
                    { currency: "ETH", balance: "1", available: "1", name: "ETH" },
                ];
            }
            return [];
        });

        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string, _fiat: string) => {
            if (crypto === "EUR") return 1;
            if (crypto === "BTC") return 50000; // 0.1 * 50000 = 5000
            if (crypto === "ETH") return 3000; // 1 * 3000 = 3000
            return 0;
        });

        const result = await handleAggregationTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        // Should be sorted: EUR (10000) > BTC (5000) > ETH (3000)
        expect(data.result.details[0].asset).toBe("EUR");
        expect(data.result.details[1].asset).toBe("BTC");
        expect(data.result.details[2].asset).toBe("ETH");
    });
});
