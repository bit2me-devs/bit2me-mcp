import { describe, it, expect } from "vitest";
import {
    mapEarnPositionMovementsResponse,
    mapEarnMovementsResponse,
    mapEarnMovementsSummaryResponse,
} from "../../src/utils/response-mappers.js";

describe("Response Mappers", () => {
    describe("Earn Mappers", () => {
        it("should map earn wallet movements response", () => {
            // API returns { total, data } structure for wallet-specific endpoint
            expect(mapEarnPositionMovementsResponse(null)).toEqual({ total: 0, movements: [] });
            const valid = {
                total: 1,
                data: [
                    {
                        movementId: "1",
                        type: "deposit",
                        amount: { value: "1", currency: "BTC" },
                        createdAt: "2023-01-01T00:00:00Z",
                        walletId: "w1",
                    },
                ],
            };
            const result = mapEarnPositionMovementsResponse(valid);
            expect(result.total).toBe(1);
            expect(result.movements).toHaveLength(1);
            expect(result.movements[0]).toMatchObject({
                id: "1",
                type: "deposit",
                symbol: "BTC",
                amount: "1",
                position_id: "w1",
            });
        });

        it("should map earn movements response (global endpoint)", () => {
            // API returns { total, data } structure for global endpoint
            expect(mapEarnMovementsResponse(null)).toEqual({ total: 0, movements: [] });
            const valid = {
                total: 1,
                data: [
                    {
                        movementId: "mov-123",
                        type: "deposit",
                        createdAt: "2023-01-01T00:00:00Z",
                        walletId: "wallet-789",
                        amount: { value: "1.5", currency: "BTC" },
                        rate: {
                            amount: { value: "50000", currency: "EUR" },
                            pair: "BTC-USD",
                        },
                        convertedAmount: { value: "75000", currency: "EUR" },
                        source: { walletId: "source-123", currency: "EUR" },
                        issuer: { id: "issuer-1", name: "Bit2Me", integrator: "bit2me" },
                    },
                ],
            };
            const result = mapEarnMovementsResponse(valid);
            expect(result.total).toBe(1);
            expect(result.movements).toHaveLength(1);
            expect(result.movements[0]).toMatchObject({
                id: "mov-123",
                type: "deposit",
                position_id: "wallet-789",
                amount: { value: "1.5", symbol: "BTC" },
                rate: {
                    amount: { value: "50000", symbol: "EUR" },
                    pair: "BTC-USD",
                },
                converted_amount: { value: "75000", symbol: "EUR" },
                source: { pocket_id: "source-123", symbol: "EUR" },
                issuer: { id: "issuer-1", name: "Bit2Me", integrator: "bit2me" },
            });
            expect(result.movements[0].created_at).toBeTypeOf("string");
            // user_id should not be present (movements are always for the authenticated user)
            expect(result.movements[0]).not.toHaveProperty("user_id");
        });

        it("should map earn movements summary response", () => {
            // Handle null/undefined - should return defaults instead of throwing
            expect(mapEarnMovementsSummaryResponse(null)).toEqual({
                type: "",
                total_amount: "0",
                total_count: 0,
                symbol: "",
            });

            // Handle valid object response
            const valid = { type: "deposit", totalAmount: "10", totalCount: 5, currency: "BTC" };
            expect(mapEarnMovementsSummaryResponse(valid)).toEqual({
                type: "deposit",
                total_amount: "10",
                total_count: 5,
                symbol: "BTC",
            });

            // Handle array response (take first element)
            const arrayResponse = [{ type: "reward", totalAmount: "5", totalCount: 3, currency: "ETH" }];
            expect(mapEarnMovementsSummaryResponse(arrayResponse)).toEqual({
                type: "reward",
                total_amount: "5",
                total_count: 3,
                symbol: "ETH",
            });

            // Handle empty array
            expect(mapEarnMovementsSummaryResponse([])).toEqual({
                type: "",
                total_amount: "0",
                total_count: 0,
                symbol: "",
            });

            // Handle object with alternative field names
            const altFields = { movementType: "withdrawal", total: "20", count: 7, symbol: "EUR" };
            expect(mapEarnMovementsSummaryResponse(altFields)).toEqual({
                type: "withdrawal",
                total_amount: "20",
                total_count: 7,
                symbol: "EUR",
            });
        });
    });
});
