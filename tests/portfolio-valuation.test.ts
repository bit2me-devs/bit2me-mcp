import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockStandardBalances, mockStandardPrices } from "./portfolio-helpers.js";

interface PortfolioDetail {
    symbol: string;
    balance?: string;
    price_unit?: string;
}

function findDetail(details: unknown, symbol: string): PortfolioDetail | undefined {
    if (!Array.isArray(details)) return undefined;
    return details.find((d): d is PortfolioDetail => {
        return typeof d === "object" && d !== null && "symbol" in d && (d as PortfolioDetail).symbol === symbol;
    });
}

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

    it("should aggregate wallet + pro + earn and convert to EUR", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

        mockStandardBalances(vi.mocked(bit2meRequest));
        mockStandardPrices(vi.mocked(getMarketPrice));

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        expect(data).toHaveProperty("request");
        expect(data).toHaveProperty("result");
        expect(data.result).toHaveProperty("quote_symbol", "EUR");
        expect(data.result).toHaveProperty("total_balance");
        expect(data.result).toHaveProperty("by_service");
        expect(data.result.by_service).toHaveProperty("wallet_balance");
        expect(data.result.by_service).toHaveProperty("pro_balance");
        expect(data.result.by_service).toHaveProperty("earn_balance");
        expect(data.result.by_service).toHaveProperty("loan_guarantees_balance");
        expect(data.result).toHaveProperty("details");
        expect(Array.isArray(data.result.details)).toBe(true);

        expect(parseFloat(data.result.total_balance)).toBeGreaterThan(80000);
        expect(parseFloat(data.result.total_balance)).toBeLessThan(100000);

        const btcDetail = findDetail(data.result.details, "BTC");
        expect(btcDetail).toBeDefined();
        expect(btcDetail?.balance).toBe("1.6");
        expect(btcDetail?.price_unit).toBe("50000");
    });

    it("should filter out dust (very small amounts)", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

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
            if (crypto === "DUST") return 0.0001;
            return 0;
        });

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        const dustDetail = findDetail(data.result.details, "DUST");
        expect(dustDetail).toBeUndefined();

        const btcDetail = findDetail(data.result.details, "BTC");
        expect(btcDetail).toBeDefined();
    });

    it("should sort assets by value (descending)", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

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
            if (crypto === "BTC") return 50000;
            if (crypto === "ETH") return 3000;
            return 0;
        });

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);

        expect(data.result.details[0].symbol).toBe("EUR");
        expect(data.result.details[1].symbol).toBe("BTC");
        expect(data.result.details[2].symbol).toBe("ETH");
    });

    it("counts loan guarantees when /v1/loan/orders returns a plain array", async () => {
        const { bit2meRequest, getMarketPrice } = await import("../src/services/bit2me.js");
        const { handleGeneralTool } = await import("../src/tools/general.js");

        vi.mocked(bit2meRequest).mockImplementation(async (_method: string, endpoint: string) => {
            if (endpoint === "/v1/wallet/pocket") return [];
            if (endpoint === "/v1/trading/wallet/balance") return [];
            if (endpoint === "/v2/earn/wallets") return { data: [] };
            if (endpoint === "/v1/loan/orders") {
                return [{ guaranteeAmount: "0.5", guaranteeCurrency: "BTC" }];
            }
            return [];
        });
        vi.mocked(getMarketPrice).mockImplementation(async (crypto: string) => {
            if (crypto === "BTC") return 50000;
            return 0;
        });

        const result = await handleGeneralTool("portfolio_get_valuation", { quote_symbol: "EUR" });
        const data = JSON.parse(result.content[0].text);
        expect(data.result.by_service.loan_guarantees_balance).toBeDefined();
        const loanTotal = parseFloat(String(data.result.by_service.loan_guarantees_balance));
        expect(loanTotal).toBeGreaterThan(0);
        const btcDetail = findDetail(data.result.details, "BTC");
        expect(btcDetail).toBeDefined();
    });
});
