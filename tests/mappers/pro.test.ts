import { describe, it, expect } from "vitest";
import {
    mapProBalanceResponse,
    mapProOrderResponse,
    mapProOpenOrdersResponse,
    mapProOrderTradesResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Pro Mappers", () => {
        it("should map pro balance response", () => {
            expect(mapProBalanceResponse(null)).toEqual([]);
            const valid = [
                { currency: "EUR", balance: 100, blockedBalance: 10 },
                { currency: "BTC", balance: 0, blockedBalance: 0 },
            ];
            const result = mapProBalanceResponse(valid);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                symbol: "EUR",
                balance: "100",
                blocked: "10",
                available: "90",
            });
        });

        it("should map pro order response", () => {
            expect(() => mapProOrderResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "1",
                symbol: "BTC-USD",
                side: "buy",
                type: "limit",
                status: "open",
                price: "20000",
                amount: "1",
                filled: "0",
                remaining: "1",
                createdAt: "2023-01-01",
            };
            const result = mapProOrderResponse(valid);
            expect(result).toMatchObject({
                id: "1",
                pair: "BTC-USD",
                side: "buy",
                type: "limit",
            });
            // Verify numeric values are converted to strings
            expect(result.price).toBeTypeOf("string");
            expect(result.amount).toBeTypeOf("string");
            expect(result.filled).toBeTypeOf("string");
            expect(result.remaining).toBeTypeOf("string");

            // Test with numeric values from API
            const numericValid = {
                id: "2",
                symbol: "ETH-USD",
                side: "sell",
                type: "market",
                status: "filled",
                price: 2500.5,
                amount: 2.5,
                filled: 2.5,
                remaining: 0,
                createdAt: "2023-01-02",
            };
            const numericResult = mapProOrderResponse(numericValid);
            expect(numericResult.price).toBeTypeOf("string");
            expect(numericResult.amount).toBeTypeOf("string");
            expect(numericResult.filled).toBeTypeOf("string");
            expect(numericResult.remaining).toBeTypeOf("string");
        });

        it("should map pro open orders response", () => {
            expect(mapProOpenOrdersResponse(null)).toEqual({ orders: [] });
            const valid = [
                {
                    id: "1",
                    symbol: "BTC-USD",
                    side: "buy",
                    type: "limit",
                    status: "open",
                    price: "20000",
                    amount: "1",
                    filled: "0",
                    remaining: "1",
                    createdAt: "2023-01-01",
                },
            ];
            const result = mapProOpenOrdersResponse(valid);
            expect(result).toMatchObject({
                orders: [
                    {
                        id: "1",
                        pair: "BTC-USD",
                        side: "buy",
                        type: "limit",
                        status: "open",
                        price: "20000",
                        amount: "1",
                        filled: "0",
                        remaining: "1",
                        created_at: "2023-01-01",
                    },
                ],
            });
        });

        it("should map pro order trades response", () => {
            expect(mapProOrderTradesResponse(null)).toEqual({ order_id: "", trades: [] });
            const valid = {
                orderId: "o1",
                trades: [
                    {
                        id: "t1",
                        orderId: "o1",
                        symbol: "BTC-USD",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        timestamp: 123,
                    },
                ],
            };
            const result = mapProOrderTradesResponse(valid);
            expect(result).toMatchObject({
                order_id: "o1",
                trades: [
                    {
                        id: "t1",
                        order_id: "o1",
                        pair: "BTC-USD",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        date: expect.any(String),
                    },
                ],
            });
        });
    });
});
