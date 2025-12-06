import { it, expect } from "vitest";
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
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("orders");
            expect(Array.isArray(response.orders)).toBe(true);
            // May be empty if no open orders
            if (response.orders.length > 0) {
                expect(response.orders[0]).toHaveProperty("id");
                expect(response.orders[0]).toHaveProperty("pair");
                expect(response.orders[0]).toHaveProperty("type");
                expect(response.orders[0]).toHaveProperty("created_at");
                expect(response.orders[0]).toHaveProperty("created_timestamp");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get trade history",
        async () => {
            const result = await handleProTool("pro_get_trades", { limit: 5 });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("trades");
            expect(Array.isArray(response.trades)).toBe(true);
            // May be empty if no trades yet
            if (response.trades.length > 0) {
                expect(response.trades[0]).toHaveProperty("id");
                expect(response.trades[0]).toHaveProperty("pair");
                expect(response.trades[0]).toHaveProperty("price");
                expect(response.trades[0]).toHaveProperty("amount");
                expect(response.trades[0]).toHaveProperty("timestamp");
                expect(response.trades[0]).toHaveProperty("date");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get pro order details",
        async () => {
            // First get open orders
            const ordersResult = await handleProTool("pro_get_open_orders", {});
            const ordersResponse = JSON.parse(ordersResult.content[0].text);

            if (ordersResponse.result.length === 0) {
                console.warn("⚠️ Skipping pro order details test - no open orders found");
                return;
            }

            const orderId = ordersResponse.result[0].id;

            // Get order details using order_id filter
            const result = await handleProTool("pro_get_open_orders", { order_id: orderId });
            const details = JSON.parse(result.content[0].text);

            expect(details.result).toHaveLength(1);
            expect(details.result[0]).toHaveProperty("id", orderId);
            expect(details.result[0]).toHaveProperty("pair");
            expect(details.result[0]).toHaveProperty("type");
            expect(details.result[0]).toHaveProperty("created_at");
        },
        E2E_TIMEOUT
    );

    it(
        "should get order trades",
        async () => {
            // First get trades to find an order ID
            const txResult = await handleProTool("pro_get_trades", { limit: 5 });
            const txResponse = JSON.parse(txResult.content[0].text);

            if (txResponse.trades.length === 0) {
                console.warn("⚠️ Skipping order trades test - no transactions found");
                return;
            }

            const orderId = txResponse.trades[0].order_id || txResponse.trades[0].id;

            // Get trades for this order
            const result = await handleProTool("pro_get_order_trades", { order_id: orderId });
            const tradesResponse = JSON.parse(result.content[0].text);

            expect(tradesResponse).toHaveProperty("order_id");
            expect(tradesResponse).toHaveProperty("trades");
            expect(Array.isArray(tradesResponse.trades)).toBe(true);
            if (tradesResponse.trades.length > 0) {
                expect(tradesResponse.trades[0]).toHaveProperty("pair");
                expect(tradesResponse.trades[0]).toHaveProperty("price");
                expect(tradesResponse.trades[0]).toHaveProperty("amount");
                expect(tradesResponse.trades[0]).toHaveProperty("timestamp");
                expect(tradesResponse.trades[0]).toHaveProperty("date");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test order creation/cancellation in E2E to avoid real trades
});
