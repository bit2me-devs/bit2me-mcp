/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBrokerTool } from "../../src/tools/broker.js";
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

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";

describe("Broker Tools Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle broker_get_price", async () => {
        const mockRates = [
            {
                fiat: { USD: 1, EUR: 0.9 },
                crypto: { BTC: 0.00002 }, // 1 USD = 0.00002 BTC -> 1 BTC = 50,000 USD -> 45,000 EUR
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockRates);

        const result = await handleBrokerTool("broker_get_price", { quote_symbol: "EUR", base_symbol: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/currency/rate", expect.any(Object));
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
    });

    it("should handle broker_get_info", async () => {
        const mockTicker = {
            price: "50000",
            time: "1234567890",
            marketCap: "1000000",
            totalVolume: "1000",
            maxSupply: "21000000",
            totalSupply: "18000000",
        };

        vi.mocked(bit2meService.getTicker).mockResolvedValue(mockTicker as any);

        const result = await handleBrokerTool("broker_get_info", { base_symbol: "BTC", quote_symbol: "EUR" });

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

    it("should handle broker_get_info not found", async () => {
        vi.mocked(bit2meService.getTicker).mockRejectedValue(new NotFoundError("/v1/ticker", "Ticker not found"));

        await expect(handleBrokerTool("broker_get_info", { base_symbol: "UNKNOWN" })).rejects.toThrow(
            "Ticker not found"
        );
    });

    it("should handle broker_get_chart", async () => {
        const mockData = [
            [1630000000000, 0.00002, 0.85], // timestamp, usdPerUnit, eurUsdRate
            [1630003600000, 0.000021, 0.85],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_chart", { pair: "BTC-USD", timeframe: "1h" });

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

    it("should handle broker_get_chart with small values (precision check)", async () => {
        const mockData = [[1630000000000, 4445.82759, 1]];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_chart", { pair: "VRA/EUR", timeframe: "1d" });

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parseFloat(parsed.result[0].price)).not.toBe(0);
    });

    it("should handle broker_get_chart with smart rounding", async () => {
        const mockData = [
            [1630000000000, 0.00002, 1],
            [1630000000000, 2, 1],
            [1630000000000, 5000, 1],
        ];

        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockData);

        const result = await handleBrokerTool("broker_get_chart", { pair: "MIXED/EUR", timeframe: "1d" });
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(3);
        expect(parseFloat(parsed.result[0].price)).toBe(50000);
        expect(parseFloat(parsed.result[1].price)).toBe(0.5);
        expect(parseFloat(parsed.result[2].price)).toBe(0.0002);
    });

    it("should handle broker_quote_buy", async () => {
        const mockPocket = { id: VALID_UUID, currency: "EUR", balance: "1000" };
        const mockProforma = { id: VALID_UUID, amount: "100" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "100" };
        await handleBrokerTool("broker_quote_buy", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "buy",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "100",
            })
        );
    });

    it("should handle broker_quote_sell", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleBrokerTool("broker_quote_sell", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "sell",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
            })
        );
    });

    it("should handle broker_quote_swap", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleBrokerTool("broker_quote_swap", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "purchase",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
            })
        );
    });

    it("should handle broker_confirm_quote", async () => {
        const mockConfirm = { status: "confirmed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockConfirm);

        await handleBrokerTool("broker_confirm_quote", { proforma_id: VALID_UUID });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/wallet/transaction", {
            proforma: VALID_UUID,
        });
    });

    it("should throw error for invalid timeframe", async () => {
        await expect(handleBrokerTool("broker_get_chart", { pair: "BTC-USD", timeframe: "invalid" })).rejects.toThrow(
            "Invalid timeframe"
        );
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleBrokerTool("unknown_tool", {} as any)).rejects.toThrow("Unknown broker tool");
    });
});
