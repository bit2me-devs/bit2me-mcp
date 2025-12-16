import { it, expect } from "vitest";
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
            const result = await handleLoanTool("loan_get_simulation", {
                guarantee_symbol: "BTC",
                loan_symbol: "EUR",
                user_symbol: "EUR",
                guarantee_amount: "0.1",
            });
            const simulation = JSON.parse(result.content[0].text);

            expect(typeof simulation).toBe("object");
            expect(simulation.result).toHaveProperty("ltv");
            expect(simulation.result).toHaveProperty("apr");
            expect(simulation.result).toHaveProperty("guarantee_amount_converted");
            expect(simulation.result).toHaveProperty("loan_amount_converted");
        },
        E2E_TIMEOUT
    );

    it(
        "should get loan orders",
        async () => {
            const result = await handleLoanTool("loan_get_orders", { limit: 10 });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("result");
            expect(Array.isArray(response.result)).toBe(true);
            // May be empty if no loan orders
            if (response.result.length > 0) {
                expect(response.result[0]).toHaveProperty("id");
                expect(response.result[0]).toHaveProperty("status");
                expect(response.result[0]).toHaveProperty("guarantee_symbol");
                expect(response.result[0]).toHaveProperty("loan_symbol");
                expect(response.result[0]).toHaveProperty("created_at");
                expect(response.result[0]).toHaveProperty("expires_at");
                expect(response.result[0]).toHaveProperty("expires_timestamp");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get loan orders with pagination",
        async () => {
            const result = await handleLoanTool("loan_get_orders", { limit: 5 });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("result");
            expect(Array.isArray(response.result)).toBe(true);
            // May be empty if no loan history
            if (response.result.length > 0) {
                expect(response.result[0]).toHaveProperty("id");
                expect(response.result[0]).toHaveProperty("status");
                expect(response.result[0]).toHaveProperty("guarantee_symbol");
                expect(response.result[0]).toHaveProperty("loan_symbol");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get loan order details",
        async () => {
            // First get loan orders
            const ordersResult = await handleLoanTool("loan_get_orders", { limit: 5 });
            const ordersResponse = JSON.parse(ordersResult.content[0].text);

            if (ordersResponse.result.length === 0) {
                // eslint-disable-next-line no-console
                console.warn("⚠️ Skipping loan order details test - no loan orders found");
                return;
            }

            const orderId = ordersResponse.result[0].id;

            // Get order details using order_id filter
            const result = await handleLoanTool("loan_get_orders", { order_id: orderId });
            const details = JSON.parse(result.content[0].text);

            expect(details.result).toHaveLength(1);
            expect(details.result[0]).toHaveProperty("id", orderId);
            expect(details.result[0]).toHaveProperty("guarantee_symbol");
        },
        E2E_TIMEOUT
    );

    it(
        "should get loan movements",
        async () => {
            const result = await handleLoanTool("loan_get_movements", { limit: 5 });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("movements");
            expect(Array.isArray(response.movements)).toBe(true);
            if (response.movements.length > 0) {
                expect(response.movements[0]).toHaveProperty("type");
                expect(response.movements[0]).toHaveProperty("amount");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test loan creation/payback in E2E to avoid real financial operations
});
