import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleEarnTool } from "../../src/tools/earn.js";

describeE2E("E2E: Earn/Staking Tools", () => {
    it(
        "should get earn positions",
        async () => {
            const result = await handleEarnTool("earn_get_positions", {});
            const positions = JSON.parse(result.content[0].text);

            expect(Array.isArray(positions)).toBe(true);
            if (positions.length > 0) {
                expect(positions[0]).toHaveProperty("position_id");
                expect(positions[0]).toHaveProperty("symbol");
                expect(positions[0]).toHaveProperty("balance");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get APY rates",
        async () => {
            const result = await handleEarnTool("earn_get_apy", {});
            const apy = JSON.parse(result.content[0].text);

            expect(typeof apy).toBe("object");
            // APY data structure may vary
        },
        E2E_TIMEOUT
    );

    it(
        "should get available earn assets",
        async () => {
            const result = await handleEarnTool("earn_get_assets", {});
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("result");
            expect(response.result).toHaveProperty("symbols");
            expect(Array.isArray(response.result.symbols)).toBe(true);
            if (response.result.symbols.length > 0) {
                expect(typeof response.result.symbols[0]).toBe("string");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn summary",
        async () => {
            const result = await handleEarnTool("earn_get_summary", {});
            const summary = JSON.parse(result.content[0].text);

            // Summary is an array of objects per currency
            expect(Array.isArray(summary)).toBe(true);
            if (summary.length > 0) {
                expect(summary[0]).toHaveProperty("currency");
                expect(summary[0]).toHaveProperty("total_balance");
                expect(summary[0]).toHaveProperty("total_rewards");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn position details",
        async () => {
            // First get earn positions
            const positionsResult = await handleEarnTool("earn_get_positions", {});
            const positions = JSON.parse(positionsResult.content[0].text);

            if (positions.result.length === 0) {
                console.warn("⚠️ Skipping earn position details test - no earn positions found");
                return;
            }

            const positionId = positions.result[0].position_id || positions.result[0].id;

            // Get position details using position_id filter
            const result = await handleEarnTool("earn_get_positions", { position_id: positionId });
            const details = JSON.parse(result.content[0].text);

            expect(details.result).toHaveLength(1);
            expect(details.result[0]).toHaveProperty("position_id", positionId);
            expect(details.result[0]).toHaveProperty("symbol");
            expect(details.result[0]).toHaveProperty("balance");
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn position movements",
        async () => {
            // First get earn positions
            const positionsResult = await handleEarnTool("earn_get_positions", {});
            const positions = JSON.parse(positionsResult.content[0].text);

            if (positions.length === 0) {
                console.warn("⚠️ Skipping earn position movements test - no earn positions found");
                return;
            }

            const positionId = positions[0].position_id || positions[0].id;

            // Get movements for this position
            const result = await handleEarnTool("earn_get_position_movements", {
                position_id: positionId,
                limit: 5,
            });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("movements");
            expect(Array.isArray(response.movements)).toBe(true);
            if (response.movements.length > 0) {
                expect(response.movements[0]).toHaveProperty("type");
                expect(response.movements[0]).toHaveProperty("amount");
                expect(response.movements[0]).toHaveProperty("position_id");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn movements (global)",
        async () => {
            // Get all movements across all positions
            const result = await handleEarnTool("earn_get_movements", {
                limit: 10,
            });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("movements");
            expect(Array.isArray(response.movements)).toBe(true);
            if (response.movements.length > 0) {
                expect(response.movements[0]).toHaveProperty("id");
                expect(response.movements[0]).toHaveProperty("type");
                expect(response.movements[0]).toHaveProperty("amount");
                expect(response.movements[0].amount).toHaveProperty("value");
                expect(response.movements[0].amount).toHaveProperty("currency");
                expect(response.movements[0]).toHaveProperty("created_at");
                expect(response.movements[0]).toHaveProperty("created_timestamp");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test earn_deposit/earn_withdraw in E2E to avoid real transactions
});
