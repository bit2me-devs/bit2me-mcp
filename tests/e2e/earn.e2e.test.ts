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

    // NOTE: We don't test deposit/withdrawal in E2E to avoid real transactions
});
