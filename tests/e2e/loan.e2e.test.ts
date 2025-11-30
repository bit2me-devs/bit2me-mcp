import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleLoanTool } from "../../src/tools/loan.js";

describeE2E("E2E: Loan Tools", () => {
    it(
        "should get loan configuration",
        async () => {
            const result = await handleLoanTool("loan_get_config", {});
            const config = JSON.parse(result.content[0].text);

            expect(typeof config).toBe("object");
            // Config structure may vary
        },
        E2E_TIMEOUT
    );

    it(
        "should calculate LTV",
        async () => {
            const result = await handleLoanTool("loan_get_ltv", {
                guaranteeCurrency: "BTC",
                loanCurrency: "EUR",
                userCurrency: "EUR",
                guaranteeAmount: "0.1",
            });
            const ltv = JSON.parse(result.content[0].text);

            expect(typeof ltv).toBe("object");
            expect(ltv).toHaveProperty("ltv");
        },
        E2E_TIMEOUT
    );

    it(
        "should get active loans",
        async () => {
            const result = await handleLoanTool("loan_get_active", {});
            const loans = JSON.parse(result.content[0].text);

            expect(Array.isArray(loans)).toBe(true);
            // May be empty if no active loans
            if (loans.length > 0) {
                expect(loans[0]).toHaveProperty("id");
                expect(loans[0]).toHaveProperty("guarantee_currency");
                expect(loans[0]).toHaveProperty("loan_currency");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get loan orders",
        async () => {
            const result = await handleLoanTool("loan_get_orders", { limit: 5 });
            const orders = JSON.parse(result.content[0].text);

            expect(Array.isArray(orders)).toBe(true);
            // May be empty if no loan history
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test loan creation/payback in E2E to avoid real financial operations
});
