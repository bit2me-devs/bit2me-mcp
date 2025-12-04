import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleEarnTool } from "../../src/tools/earn.js";

describeE2E("E2E: Earn/Staking Tools", () => {
    it(
        "should get earn wallets",
        async () => {
            const result = await handleEarnTool("earn_get_wallets", {});
            const wallets = JSON.parse(result.content[0].text);

            expect(Array.isArray(wallets)).toBe(true);
            if (wallets.length > 0) {
                expect(wallets[0]).toHaveProperty("id");
                expect(wallets[0]).toHaveProperty("currency");
                expect(wallets[0]).toHaveProperty("balance");
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
        "should get earn wallet details",
        async () => {
            // First get earn wallets
            const walletsResult = await handleEarnTool("earn_get_wallets", {});
            const wallets = JSON.parse(walletsResult.content[0].text);

            if (wallets.length === 0) {
                console.warn("⚠️ Skipping earn wallet details test - no earn wallets found");
                return;
            }

            const walletId = wallets[0].id;

            // Get wallet details
            const result = await handleEarnTool("earn_get_wallet_details", { wallet_id: walletId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", walletId);
            expect(details).toHaveProperty("currency");
            expect(details).toHaveProperty("balance");
            expect(details).toHaveProperty("created_at");
            expect(details).toHaveProperty("created_timestamp");
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn wallet movements",
        async () => {
            // First get earn wallets
            const walletsResult = await handleEarnTool("earn_get_wallets", {});
            const wallets = JSON.parse(walletsResult.content[0].text);

            if (wallets.length === 0) {
                console.warn("⚠️ Skipping earn wallet movements test - no earn wallets found");
                return;
            }

            const walletId = wallets[0].id;

            // Get movements for this wallet
            const result = await handleEarnTool("earn_get_wallet_movements", {
                wallet_id: walletId,
                limit: 5,
            });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("movements");
            expect(Array.isArray(response.movements)).toBe(true);
            if (response.movements.length > 0) {
                expect(response.movements[0]).toHaveProperty("type");
                expect(response.movements[0]).toHaveProperty("amount");
                expect(response.movements[0]).toHaveProperty("wallet_id");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn movements (global)",
        async () => {
            // Get all movements across all wallets
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
