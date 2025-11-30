import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleProTool } from "../../src/tools/pro.js";

describeE2E("E2E: Pro Trading Tools", () => {
    it(
        "should get pro trading balance",
        async () => {
            const result = await handleProTool("pro_get_balance", {});
            const balances = JSON.parse(result.content[0].text);

            expect(Array.isArray(balances)).toBe(true);
            if (balances.length > 0) {
                expect(balances[0]).toHaveProperty("currency");
                expect(balances[0]).toHaveProperty("available");
                expect(balances[0]).toHaveProperty("blocked");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get open orders",
        async () => {
            const result = await handleProTool("pro_get_open_orders", {});
            const orders = JSON.parse(result.content[0].text);

            expect(Array.isArray(orders)).toBe(true);
            // May be empty if no open orders
            if (orders.length > 0) {
                expect(orders[0]).toHaveProperty("id");
                expect(orders[0]).toHaveProperty("symbol");
                expect(orders[0]).toHaveProperty("type");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get trade history",
        async () => {
            const result = await handleProTool("pro_get_transactions", { limit: 5 });
            const transactions = JSON.parse(result.content[0].text);

            expect(Array.isArray(transactions)).toBe(true);
            // May be empty if no trades yet
            if (transactions.length > 0) {
                expect(transactions[0]).toHaveProperty("id");
                expect(transactions[0]).toHaveProperty("price");
                expect(transactions[0]).toHaveProperty("amount");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test order creation/cancellation in E2E to avoid real trades
});
