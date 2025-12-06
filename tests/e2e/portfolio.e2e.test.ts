import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleAggregationTool } from "../../src/tools/aggregation.js";

describeE2E("E2E: Portfolio Tools", () => {
    it(
        "should get portfolio valuation",
        async () => {
            const result = await handleAggregationTool("portfolio_get_valuation", {
                fiat: "EUR",
            });
            const valuation = JSON.parse(result.content[0].text);

            expect(typeof valuation).toBe("object");
            expect(valuation.result).toHaveProperty("total_balance");
            expect(valuation.result).toHaveProperty("quote_symbol", "EUR");
            expect(valuation.result).toHaveProperty("by_service");
            expect(valuation.result.by_service).toHaveProperty("wallet_balance");
            expect(valuation.result.by_service).toHaveProperty("pro_balance");
            expect(valuation.result.by_service).toHaveProperty("earn_balance");
            expect(valuation.result.by_service).toHaveProperty("loan_guarantees_balance");
            expect(valuation.result).toHaveProperty("details");
            expect(Array.isArray(valuation.result.details)).toBe(true);
        },
        E2E_TIMEOUT
    );

    it(
        "should support different fiat currencies",
        async () => {
            const result = await handleAggregationTool("portfolio_get_valuation", {
                fiat: "USD",
            });
            const valuation = JSON.parse(result.content[0].text);

            expect(valuation.result).toHaveProperty("quote_symbol", "USD");
        },
        E2E_TIMEOUT
    );
});
