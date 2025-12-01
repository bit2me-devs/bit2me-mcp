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

    it(
        "should get pro order details",
        async () => {
            // First get open orders
            const ordersResult = await handleProTool("pro_get_open_orders", {});
            const orders = JSON.parse(ordersResult.content[0].text);

            if (orders.length === 0) {
                console.warn("⚠️ Skipping pro order details test - no open orders found");
                return;
            }

            const orderId = orders[0].id;

            // Get order details
            const result = await handleProTool("pro_get_order_details", { orderId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", orderId);
            expect(details).toHaveProperty("symbol");
            expect(details).toHaveProperty("type");
        },
        E2E_TIMEOUT
    );

    it(
        "should get order trades",
        async () => {
            // First get transactions to find an order ID
            const txResult = await handleProTool("pro_get_transactions", { limit: 5 });
            const transactions = JSON.parse(txResult.content[0].text);

            if (transactions.length === 0) {
                console.warn("⚠️ Skipping order trades test - no transactions found");
                return;
            }

            const orderId = transactions[0].order_id || transactions[0].id;

            // Get trades for this order
            const result = await handleProTool("pro_get_order_trades", { orderId });
            const trades = JSON.parse(result.content[0].text);

            expect(Array.isArray(trades)).toBe(true);
            if (trades.length > 0) {
                expect(trades[0]).toHaveProperty("price");
                expect(trades[0]).toHaveProperty("amount");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test order creation/cancellation in E2E to avoid real trades
});
