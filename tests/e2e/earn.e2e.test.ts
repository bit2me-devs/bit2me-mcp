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
            const assets = JSON.parse(result.content[0].text);

            expect(Array.isArray(assets)).toBe(true);
            if (assets.length > 0) {
                expect(assets[0]).toHaveProperty("currency");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn summary",
        async () => {
            const result = await handleEarnTool("earn_get_summary", {});
            const summary = JSON.parse(result.content[0].text);

            expect(typeof summary).toBe("object");
            expect(summary).toHaveProperty("total_rewards");
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
            const result = await handleEarnTool("earn_get_wallet_details", { walletId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", walletId);
            expect(details).toHaveProperty("currency");
            expect(details).toHaveProperty("balance");
        },
        E2E_TIMEOUT
    );

    it(
        "should get earn transactions",
        async () => {
            // First get earn wallets
            const walletsResult = await handleEarnTool("earn_get_wallets", {});
            const wallets = JSON.parse(walletsResult.content[0].text);

            if (wallets.length === 0) {
                console.warn("⚠️ Skipping earn transactions test - no earn wallets found");
                return;
            }

            const walletId = wallets[0].id;

            // Get transactions for this wallet
            const result = await handleEarnTool("earn_get_transactions", {
                walletId,
                limit: "5",
            });
            const transactions = JSON.parse(result.content[0].text);

            expect(Array.isArray(transactions)).toBe(true);
            if (transactions.length > 0) {
                expect(transactions[0]).toHaveProperty("type");
                expect(transactions[0]).toHaveProperty("amount");
            }
        },
        E2E_TIMEOUT
    );

    // NOTE: We don't test deposit/withdrawal in E2E to avoid real transactions
});
