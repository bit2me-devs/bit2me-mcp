import { describe, it, expect } from "vitest";
import {
    mapProMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
    mapCandlesResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Market Mappers", () => {
        it("should map market config response", () => {
            expect(mapProMarketConfigResponse(null)).toEqual([]);

            // Test array format (real API format)
            const arrayValid = [
                {
                    id: "31fdfac9-a5b2-4efd-ae3f-b578532294e7",
                    symbol: "GFI/EUR",
                    feeMakerPercentage: 0,
                    feeTakerPercentage: 0.1,
                    minAmount: 3,
                    maxAmount: 50000,
                    minPrice: 0.1,
                    maxPrice: 100,
                    minOrderSize: 2,
                    tickSize: 0.001,
                    pricePrecision: 3,
                    amountPrecision: 5,
                    marketEnabled: "enabled",
                },
            ];
            const arrayResult = mapProMarketConfigResponse(arrayValid);
            expect(arrayResult).toEqual([
                {
                    id: "31fdfac9-a5b2-4efd-ae3f-b578532294e7",
                    pair: "GFI-EUR",
                    base_precision: "5",
                    quote_precision: "3",
                    min_amount: "3",
                    max_amount: "50000",
                    min_price: "0.1",
                    max_price: "100",
                    min_order_size: "2",
                    tick_size: "0.001",
                    fee_maker: "0",
                    fee_taker: "0.1",
                    status: "active",
                },
            ]);

            // Test status mapping
            const disabledMarket = [{ symbol: "TEST/EUR", marketEnabled: "disabled" }];
            expect(mapProMarketConfigResponse(disabledMarket)[0].status).toBe("inactive");

            // Test fallback map format
            const mapValid = {
                "BTC-USD": {
                    amountPrecision: 8,
                    pricePrecision: 2,
                    minAmount: "0.001",
                    maxAmount: "10",
                    marketEnabled: "enabled",
                },
            };
            const mapResult = mapProMarketConfigResponse(mapValid);
            expect(mapResult[0]).toMatchObject({
                pair: "BTC-USD",
                base_precision: "8",
                quote_precision: "2",
                status: "active",
            });
        });

        it("should map order book response", () => {
            expect(() => mapOrderBookResponse(null)).toThrow(ValidationError);
            const valid = {
                symbol: "BTC-USD",
                bids: [["100", "1"]],
                asks: [{ price: "101", amount: "1" }],
                timestamp: 123,
            };
            const result = mapOrderBookResponse(valid);
            expect(result).toMatchObject({
                pair: "BTC-USD",
                bids: [{ price: "100", amount: "1" }],
                asks: [{ price: "101", amount: "1" }],
                date: expect.any(String),
            });
            // Test defaults
            const defaultResult = mapOrderBookResponse({});
            expect(defaultResult).toMatchObject({
                pair: "",
                bids: [],
                asks: [],
                date: expect.any(String),
            });
        });

        it("should map public trades response", () => {
            expect(mapPublicTradesResponse(null)).toEqual([]);

            // Test array format (API format): [side, price, amount, timestamp]
            const arrayFormat = [
                ["sell", 63606.3, 0.0008, 1715087548704],
                ["buy", 63601.2, 0.0013, 1715087523417],
            ];
            const arrayResult = mapPublicTradesResponse(arrayFormat);
            expect(arrayResult).toHaveLength(2);
            expect(arrayResult[0]).toMatchObject({
                id: expect.stringContaining("trade-0"),
                pair: "",
                price: "63606.3",
                amount: "0.0008",
                side: "sell",
                date: expect.any(String),
            });
            expect(arrayResult[1]).toMatchObject({
                id: expect.stringContaining("trade-1"),
                pair: "",
                price: "63601.2",
                amount: "0.0013",
                side: "buy",
                date: expect.any(String),
            });

            // Test object format (fallback for backward compatibility)
            const valid = [{ id: "1", symbol: "BTC-USD", price: "100", amount: "1", side: "buy", timestamp: 123 }];
            const result = mapPublicTradesResponse(valid);
            expect(result).toMatchObject([
                {
                    id: "1",
                    pair: "BTC-USD",
                    price: "100",
                    amount: "1",
                    side: "buy",
                    date: expect.any(String),
                },
            ]);

            // Test defaults with empty object
            const defaultResult = mapPublicTradesResponse([{}]);
            expect(defaultResult).toMatchObject([
                {
                    id: expect.stringContaining("trade-0"),
                    pair: "",
                    price: "0",
                    amount: "0",
                    side: "buy",
                    date: expect.any(String),
                },
            ]);
        });

        it("should map candles response", () => {
            expect(mapCandlesResponse(null)).toEqual([]);
            const valid = [{ timestamp: 123, open: "100", high: "110", low: "90", close: "105", volume: "10" }];
            const result = mapCandlesResponse(valid);
            expect(result).toMatchObject([
                {
                    date: expect.any(String),
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
            // Test array format
            const arrayResult = mapCandlesResponse([[123, "100", "110", "90", "105", "10"]]);
            expect(arrayResult).toMatchObject([
                {
                    date: expect.any(String),
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
            // Test volume as number (passed through as-is)
            const numericVolume = [{ timestamp: 123, open: 100, high: 110, low: 90, close: 105, volume: 10.5 }];
            const numericResult = mapCandlesResponse(numericVolume);
            expect(numericResult[0].volume).toBe(10.5);
        });
    });
});
