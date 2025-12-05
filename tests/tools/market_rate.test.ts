import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBrokerTool } from "../../src/tools/broker.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

describe("Market Tools - Currency Rate", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch currency rates in USD (default)", async () => {
        const mockData = [
            {
                fiat: { USD: 1, EUR: 0.9 },
                crypto: { BTC: 0.00001, ETH: 0.0005 }, // 1 USD = 0.00001 BTC -> 1 BTC = 100,000 USD
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_price", {});
        const content = JSON.parse(result.content[0].text);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/currency/rate"),
            expect.objectContaining({})
        );
        expect(content).toHaveProperty("request");
        expect(content).toHaveProperty("result");
        expect(content.result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    base_symbol: "BTC",
                    price: "100000",
                    quote_symbol: "USD",
                }),
            ])
        );
    });

    it("should fetch currency rates in EUR", async () => {
        const mockData = [
            {
                fiat: { USD: 1, EUR: 0.9 },
                crypto: { BTC: 0.00001 }, // 1 USD = 0.00001 BTC
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_price", { quote_symbol: "EUR" });
        const content = JSON.parse(result.content[0].text);

        // Price BTC in EUR = Rate(EUR) / Rate(BTC) = 0.9 / 0.00001 = 90,000
        expect(content).toHaveProperty("request");
        expect(content).toHaveProperty("result");
        expect(content.result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    base_symbol: "BTC",
                    price: "90000",
                    quote_symbol: "EUR",
                }),
            ])
        );
    });

    it("should filter by symbol", async () => {
        const mockData = [
            {
                fiat: { USD: 1 },
                crypto: { BTC: 0.00001, ETH: 0.0005 },
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_price", { base_symbol: "BTC" });
        const content = JSON.parse(result.content[0].text);

        expect(content).toHaveProperty("request");
        expect(content).toHaveProperty("result");
        expect(content.result).toHaveLength(1);
        expect(content.result[0].base_symbol).toBe("BTC");
    });

    it("should pass date parameter", async () => {
        const mockData = [
            {
                fiat: { USD: 1 },
                crypto: {},
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        await handleBrokerTool("broker_get_price", { date: "2023-01-01" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v1/currency/rate"),
            expect.objectContaining({ time: "2023-01-01" })
        );
    });
});
