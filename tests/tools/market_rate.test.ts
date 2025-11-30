import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMarketTool } from "../../src/tools/market.js";
import axios from "axios";

vi.mock("axios");

describe("Market Tools - Currency Rate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch currency rates in USD (default)", async () => {
        const mockResponse = {
            data: {
                BTC: { rate: "0.00001", timestamp: "2023-01-01T00:00:00Z" }, // 1 USD = 0.00001 BTC -> 1 BTC = 100,000 USD
                EUR: { rate: "0.9", timestamp: "2023-01-01T00:00:00Z" },
            },
        };
        vi.mocked(axios.get).mockResolvedValue(mockResponse);

        const result = await handleMarketTool("market_get_currency_rate", {});
        const content = JSON.parse(result.content[0].text);

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v1/currency/rate"), { params: {} });
        expect(content).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    symbol: "BTC",
                    rate: "100000",
                    currency: "USD",
                }),
            ])
        );
    });

    it("should fetch currency rates in EUR", async () => {
        const mockResponse = {
            data: {
                BTC: { rate: "0.00001", timestamp: "2023-01-01T00:00:00Z" }, // 1 USD = 0.00001 BTC
                EUR: { rate: "0.9", timestamp: "2023-01-01T00:00:00Z" }, // 1 USD = 0.9 EUR
            },
        };
        vi.mocked(axios.get).mockResolvedValue(mockResponse);

        const result = await handleMarketTool("market_get_currency_rate", { fiat_currency: "EUR" });
        const content = JSON.parse(result.content[0].text);

        // Price BTC in EUR = Rate(EUR) / Rate(BTC) = 0.9 / 0.00001 = 90,000
        expect(content).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    symbol: "BTC",
                    rate: "90000",
                    currency: "EUR",
                }),
            ])
        );
    });

    it("should filter by symbol", async () => {
        const mockResponse = {
            data: {
                BTC: { rate: "0.00001", timestamp: "2023-01-01T00:00:00Z" },
                ETH: { rate: "0.0005", timestamp: "2023-01-01T00:00:00Z" },
            },
        };
        vi.mocked(axios.get).mockResolvedValue(mockResponse);

        const result = await handleMarketTool("market_get_currency_rate", { symbol: "BTC" });
        const content = JSON.parse(result.content[0].text);

        expect(content).toHaveLength(1);
        expect(content[0].symbol).toBe("BTC");
    });

    it("should pass date parameter", async () => {
        const mockResponse = { data: {} };
        vi.mocked(axios.get).mockResolvedValue(mockResponse);

        await handleMarketTool("market_get_currency_rate", { date: "2023-01-01" });

        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/v1/currency/rate"), {
            params: { time: "2023-01-01" },
        });
    });
});
