import { describe, it, expect } from "vitest";
import {
    mapLoanOrdersResponse,
    mapLoanMovementsResponse,
    mapLoanOrderDetailsResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Loan Mappers", () => {
        it("should map loan orders response with full details", () => {
            expect(mapLoanOrdersResponse(null)).toEqual([]);
            const valid = {
                data: [
                    {
                        orderId: "fb930f0c-8e90-403a-95e4-112394183cf2",
                        status: "active",
                        guaranteeCurrency: "BTC",
                        guaranteeAmount: "1.0",
                        guaranteeAmountConverted: "76854.8000",
                        loanCurrency: "EUR",
                        loanAmount: "52220.14",
                        loanOriginalAmount: "50750.0",
                        loanAmountConverted: "52214.918406",
                        ltv: "0.6791",
                        apr: "0.17",
                        interestAmount: "1470.14",
                        remainingAmount: "52220.14",
                        paybackAmount: "0",
                        createdAt: "2025-07-27T16:23:59.876Z",
                        startedAt: "2025-07-27T16:24:00.119Z",
                        expiresAt: "2025-07-30T16:23:59.872Z",
                    },
                ],
            };
            const result = mapLoanOrdersResponse(valid);
            expect(result).toEqual([
                {
                    id: "fb930f0c-8e90-403a-95e4-112394183cf2",
                    status: "active",
                    guarantee_symbol: "BTC",
                    guarantee_amount: "1.0",
                    guarantee_amount_fiat: "76854.8",
                    loan_symbol: "EUR",
                    loan_amount: "52220.14",
                    loan_original_amount: "50750.0",
                    loan_amount_fiat: "52214.92",
                    ltv: "0.6791",
                    apr: "0.17",
                    interest_amount: "1470.14",
                    remaining_amount: "52220.14",
                    payback_amount: "0",
                    created_at: "2025-07-27T16:23:59.876Z",
                    started_at: "2025-07-27T16:24:00.119Z",
                    expires_at: "2025-07-30T16:23:59.872Z",
                },
            ]);
        });

        it("should map loan movements response with full payload", () => {
            expect(mapLoanMovementsResponse(null)).toEqual([]);

            // Test with real API structure (LTV in payload as per actual API response)
            const valid = {
                data: [
                    {
                        movementId: "1b3aa379-0262-48eb-970d-da6b89882c67",
                        type: "approve",
                        createdAt: "2025-07-27T16:24:00.118Z",
                        updatedAt: "2025-07-27T16:24:00.118Z",
                        orderId: "fb930f0c-8e90-403a-95e4-112394183cf2",
                        payload: {
                            loanAmount: {
                                value: "50750.0",
                                converted: "50749.949999",
                                currency: "EURR",
                            },
                            guaranteeAmount: {
                                value: "1.0",
                                converted: "101499.899999",
                                currency: "BTC",
                            },
                            ltv: "0.5000",
                            previousLtv: "0.5000",
                        },
                        status: "completed",
                    },
                ],
            };

            const result = mapLoanMovementsResponse(valid);
            expect(result).toEqual([
                {
                    id: "1b3aa379-0262-48eb-970d-da6b89882c67",
                    order_id: "fb930f0c-8e90-403a-95e4-112394183cf2",
                    type: "approve",
                    status: "completed",
                    loan: {
                        amount: "50750.0",
                        symbol: "EURR",
                        amount_fiat: "50749.95",
                    },
                    guarantee: {
                        amount: "1.0",
                        symbol: "BTC",
                        amount_fiat: "101499.90",
                    },
                    ltv: "0.50",
                    previous_ltv: "0.50",
                    created_at: "2025-07-27T16:24:00.118Z",
                },
            ]);
        });

        it("should map loan order details response", () => {
            expect(() => mapLoanOrderDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                orderId: "1",
                status: "active",
                guaranteeCurrency: "BTC",
                guaranteeAmount: "1",
                loanCurrency: "EUR",
                loanAmount: "1000",
                remainingAmount: "1000",
                ltv: "50",
                apr: "5",
                liquidationPriceReference: "20000",
                createdAt: "2023-01-01",
                expiresAt: "2024-01-01",
            };
            const result = mapLoanOrderDetailsResponse(valid);
            expect(result).toMatchObject({
                id: "1",
                status: "active",
                guarantee_symbol: "BTC",
                guarantee_amount: "1",
                loan_symbol: "EUR",
                loan_amount: "1000",
                remaining_amount: "1000",
                ltv: "50",
                apr: "5",
                liquidation_price: "20000",
                created_at: "2023-01-01",
                expires_at: "2024-01-01",
            });
        });
    });
});
