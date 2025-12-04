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
            expect(valuation).toHaveProperty("total_value");
            expect(valuation).toHaveProperty("currency", "EUR");
            expect(valuation).toHaveProperty("details");
            expect(Array.isArray(valuation.details)).toBe(true);
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

            expect(valuation).toHaveProperty("currency", "USD");
        },
        E2E_TIMEOUT
    );
});
