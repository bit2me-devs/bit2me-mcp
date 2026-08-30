import { describe, it, expect } from "vitest";
import { mapWalletMovementsResponse, mapWalletMovementDetailsResponse } from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Wallet Mappers", () => {
        it("should map wallet movements response", () => {
            expect(mapWalletMovementsResponse(null)).toEqual([]);
            const valid = [
                {
                    id: "tx1",
                    date: "2023-01-01",
                    type: "deposit",
                    subtype: "fiat",
                    status: "completed",
                    denomination: { amount: "100", currency: "EUR" },
                    origin: { amount: "100", currency: "EUR", class: "bank" },
                    destination: { amount: "100", currency: "EUR", class: "wallet" },
                    fee: { mercantile: { amount: "1", currency: "EUR", class: "fee" } },
                },
            ];
            expect(mapWalletMovementsResponse(valid)).toEqual([
                {
                    id: "tx1",
                    created_at: "2023-01-01",
                    type: "deposit",
                    subtype: "fiat",
                    status: "completed",
                    amount: "100",
                    symbol: "EUR",
                    origin: { amount: "100", symbol: "EUR", class: "bank" },
                    destination: { amount: "100", symbol: "EUR", class: "wallet" },
                    fee: { amount: "1", symbol: "EUR", class: "fee" },
                },
            ]);
            // Test defaults and missing optional fields
            expect(mapWalletMovementsResponse([{}])).toEqual([
                {
                    id: "tx_0",
                    created_at: undefined,
                    type: undefined,
                    subtype: undefined,
                    status: "pending",
                    amount: "0",
                    symbol: "",
                    origin: undefined,
                    destination: undefined,
                    fee: undefined,
                },
            ]);
        });

        it("should map wallet movement details response", () => {
            expect(() => mapWalletMovementDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                date: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                denomination: { amount: "100", currency: "EUR" },
                origin: { amount: "100", currency: "EUR", class: "bank", rate: { value: "1" } },
            };
            expect(mapWalletMovementDetailsResponse(valid)).toEqual({
                id: "tx1",
                created_at: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                amount: "100",
                symbol: "EUR",
                origin: { amount: "100", symbol: "EUR", class: "bank", rate_applied: "1" },
                destination: undefined,
                fee: undefined,
            });
        });
    });
});
