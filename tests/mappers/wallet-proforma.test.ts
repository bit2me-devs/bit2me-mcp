import { describe, it, expect } from "vitest";
import { mapProformaResponse } from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Wallet Mappers", () => {
        it("should map proforma response with legacy format", () => {
            expect(() => mapProformaResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "pf1",
                originAmount: "100",
                originCurrency: "EUR",
                destinationAmount: "0.1",
                destinationCurrency: "BTC",
                rate: "1000",
                validUntil: "2023-01-01",
            };
            expect(mapProformaResponse(valid)).toEqual({
                proforma_id: "pf1",
                origin_amount: "100",
                origin_symbol: "EUR",
                destination_amount: "0.1",
                destination_symbol: "BTC",
                rate: "1000",
                rate_pair: undefined,
                total_fee: "0",
                fee_currency: "",
                fee_breakdown: undefined,
                expires_at: "2023-01-01",
            });
        });

        it("should map proforma response with full API format", () => {
            // Real API structure: destination.rate.value (NOT rate.rate.value)
            const fullApiResponse = {
                id: "pf123",
                expirationTime: "2024-01-15T12:00:00Z",
                origin: {
                    amount: "100",
                    currency: "EUR",
                    rate: { value: "1", pair: { base: "EUR", quote: "EUR" } },
                },
                destination: {
                    amount: "0.00001276",
                    currency: "BTC",
                    rate: { value: "79084.258000000000", extraDecimals: "4", pair: { base: "BTC", quote: "EUR" } },
                },
                fee: {
                    flip: { percentage: "0.5", amount: "0.50", currency: "EUR" },
                    teller: {
                        fixed: { amount: "0", currency: "EUR" },
                        variable: { percentage: "1.5", amount: "1.50", currency: "EUR" },
                    },
                },
            };
            const result = mapProformaResponse(fullApiResponse);
            expect(result.proforma_id).toBe("pf123");
            expect(result.origin_amount).toBe("100");
            expect(result.origin_symbol).toBe("EUR");
            expect(result.destination_amount).toBe("0.00001276");
            expect(result.destination_symbol).toBe("BTC");
            // Rate comes from destination.rate.value
            expect(result.rate).toBe("79084.258000000000");
            expect(result.rate_pair).toBe("BTC/EUR");
            expect(result.total_fee).toBe("2");
            expect(result.fee_currency).toBe("EUR");
            expect(result.fee_breakdown).toEqual({
                flip: { amount: "0.50", currency: "EUR", percentage: "0.5" },
                teller_fixed: { amount: "0", currency: "EUR" },
                teller_variable: { amount: "1.50", currency: "EUR", percentage: "1.5" },
            });
            expect(result.expires_at).toBe("2024-01-15T12:00:00Z");
        });

        it("should fallback to userRate when destination.rate is not present", () => {
            const apiResponse = {
                id: "pf456",
                expirationTime: "2024-01-15T12:00:00Z",
                origin: { amount: "100", currency: "EUR" },
                destination: { amount: "0.00127", currency: "BTC" },
                userRate: { rate: { value: "78500.00", pair: { base: "EUR", quote: "BTC" } } },
            };
            const result = mapProformaResponse(apiResponse);
            expect(result.rate).toBe("78500.00");
            expect(result.rate_pair).toBe("EUR/BTC");
        });
    });
});
