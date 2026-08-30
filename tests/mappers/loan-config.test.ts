import { describe, it, expect } from "vitest";
import { mapLoanConfigResponse, mapLoanSimulationResponse } from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Loan Mappers", () => {
        it("should map loan config response", () => {
            expect(mapLoanConfigResponse(null)).toEqual({
                guarantee_currencies: [],
                loan_currencies: [],
            });
            const valid = {
                loanCurrencies: [
                    {
                        currencyConfigurationLoanId: "loan-id-123",
                        currency: "USDC",
                        enabled: true,
                        liquidity: "250000.000000000000000000",
                        liquidityStatus: "high",
                        apr: "0.130000000000000000",
                        minimumAmount: "100.000000000000000000",
                        maximumAmount: "250000.000000000000000000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        currencyConfigurationLoanId: "loan-id-456",
                        currency: "EURC",
                        enabled: true,
                        liquidity: "150000.000000000000000000",
                        liquidityStatus: "medium",
                        apr: "0.120000000000000000",
                        minimumAmount: "50.000000000000000000",
                        maximumAmount: "150000.000000000000000000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                ],
                guaranteeCurrencies: [
                    {
                        currencyConfigurationGuaranteeId: "guarantee-id-123",
                        currency: "BTC",
                        enabled: true,
                        liquidationLtv: "0.8500",
                        initialLtv: "0.5000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        currencyConfigurationGuaranteeId: "guarantee-id-456",
                        currency: "ETH",
                        enabled: true,
                        liquidationLtv: "0.8000",
                        initialLtv: "0.4500",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                ],
            };
            const result = mapLoanConfigResponse(valid);
            expect(result).toEqual({
                guarantee_currencies: [
                    {
                        symbol: "BTC",
                        enabled: true,
                        liquidation_ltv: "0.8500",
                        initial_ltv: "0.5000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        symbol: "ETH",
                        enabled: true,
                        liquidation_ltv: "0.8000",
                        initial_ltv: "0.4500",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                ],
                loan_currencies: [
                    {
                        symbol: "USDC",
                        enabled: true,
                        liquidity: "250000.000000000000000000",
                        liquidity_status: "high",
                        apr: "0.130000000000000000",
                        minimum_amount: "100.000000000000000000",
                        maximum_amount: "250000.000000000000000000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        symbol: "EURC",
                        enabled: true,
                        liquidity: "150000.000000000000000000",
                        liquidity_status: "medium",
                        apr: "0.120000000000000000",
                        minimum_amount: "50.000000000000000000",
                        maximum_amount: "150000.000000000000000000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                ],
            });
        });

        it("should map loan simulation response", () => {
            expect(() => mapLoanSimulationResponse(null)).toThrow(ValidationError);
            const valid = {
                guaranteeCurrency: "BTC",
                guaranteeAmount: "0.5678",
                guaranteeAmountConverted: "57000.34",
                loanCurrency: "USDC",
                loanAmount: "1250.34",
                loanAmountConverted: "1300.34",
                userCurrency: "EUR",
                ltv: "0.5",
                apr: "13.12",
            };
            expect(mapLoanSimulationResponse(valid)).toEqual({
                guarantee_symbol: "BTC",
                guarantee_amount: "0.5678",
                guarantee_amount_converted: "57000.34",
                loan_symbol: "USDC",
                loan_amount: "1250.34",
                loan_amount_converted: "1300.34",
                user_symbol: "EUR",
                ltv: "0.5",
                apr: "13.12",
            });
        });
    });
});
