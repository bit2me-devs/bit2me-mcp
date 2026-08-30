import { describe, it, expect } from "vitest";
import {
    mapOperationConfirmationResponse,
    mapEarnOperationResponse,
    mapProDepositResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Operation Mappers", () => {
        it("should map operation confirmation response", () => {
            expect(() => mapOperationConfirmationResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", status: "confirmed", message: "Success" };
            expect(mapOperationConfirmationResponse(valid)).toEqual({
                id: "tx1",
                status: "confirmed",
            });
        });

        it("should map earn operation response", () => {
            expect(() => mapEarnOperationResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                type: "deposit",
                currency: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            };
            expect(mapEarnOperationResponse(valid)).toEqual({
                id: "tx1",
                type: "deposit",
                symbol: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            });
        });

        it("should map pro deposit response", () => {
            expect(() => mapProDepositResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", currency: "EUR", amount: "100", status: "completed", message: "Deposited" };
            expect(mapProDepositResponse(valid)).toEqual({
                id: "tx1",
                symbol: "EUR",
                amount: "100",
                status: "completed",
                message: "Deposited",
            });
        });
    });
});
