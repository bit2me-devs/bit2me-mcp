import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleWalletTool } from "../../src/tools/wallet.js";

describeE2E("E2E: Wallet Tools", () => {
    it(
        "should get user pockets (wallets)",
        async () => {
            const result = await handleWalletTool("wallet_get_pockets", {});
            const pockets = JSON.parse(result.content[0].text);

            expect(Array.isArray(pockets)).toBe(true);
            expect(pockets.length).toBeGreaterThan(0);
            expect(pockets[0]).toHaveProperty("id");
            expect(pockets[0]).toHaveProperty("currency");
            expect(pockets[0]).toHaveProperty("balance");
        },
        E2E_TIMEOUT
    );

    it(
        "should filter pockets by currency",
        async () => {
            const result = await handleWalletTool("wallet_get_pockets", { currency: "EUR" });
            const pockets = JSON.parse(result.content[0].text);

            expect(Array.isArray(pockets)).toBe(true);
            pockets.forEach((pocket: any) => {
                expect(pocket.currency).toBe("EUR");
            });
        },
        E2E_TIMEOUT
    );

    it(
        "should get pocket details",
        async () => {
            // First get a pocket ID
            const pocketsResult = await handleWalletTool("wallet_get_pockets", {});
            const pockets = JSON.parse(pocketsResult.content[0].text);
            const pocketId = pockets[0].id;

            // Then get its details
            const result = await handleWalletTool("wallet_get_pocket_details", { pocketId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", pocketId);
            expect(details).toHaveProperty("currency");
            expect(details).toHaveProperty("balance");
        },
        E2E_TIMEOUT
    );

    it(
        "should get available networks for a currency",
        async () => {
            const result = await handleWalletTool("wallet_get_networks", { currency: "BTC" });
            const networks = JSON.parse(result.content[0].text);

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBeGreaterThan(0);
            expect(networks[0]).toHaveProperty("id");
            expect(networks[0]).toHaveProperty("name");
        },
        E2E_TIMEOUT
    );

    it(
        "should get wallet transactions",
        async () => {
            const result = await handleWalletTool("wallet_get_transactions", { limit: "5" });
            const transactions = JSON.parse(result.content[0].text);

            expect(Array.isArray(transactions)).toBe(true);
            if (transactions.length > 0) {
                expect(transactions[0]).toHaveProperty("id");
                expect(transactions[0]).toHaveProperty("type");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should validate transaction flow (create proforma)",
        async () => {
            // Get EUR and BTC pockets
            const eurResult = await handleWalletTool("wallet_get_pockets", { currency: "EUR" });
            const eurPockets = JSON.parse(eurResult.content[0].text);
            const eurPocket = eurPockets.find((p: any) => parseFloat(p.balance) > 1);

            if (!eurPocket) {
                console.warn("⚠️ Skipping transaction test - no EUR pocket with sufficient balance");
                return;
            }

            const btcResult = await handleWalletTool("wallet_get_pockets", { currency: "BTC" });
            const btcPockets = JSON.parse(btcResult.content[0].text);
            const btcPocket = btcPockets[0];

            // Create proforma (quote) - NOT confirming to avoid real transaction
            const proformaResult = await handleWalletTool("wallet_create_proforma", {
                origin_pocket_id: eurPocket.id,
                destination_pocket_id: btcPocket.id,
                amount: "0.01", // Very small amount for testing
                currency: "EUR",
            });

            const proforma = JSON.parse(proformaResult.content[0].text);
            expect(proforma).toHaveProperty("proforma_id");
            expect(proforma).toHaveProperty("origin_currency", "EUR");
            expect(proforma).toHaveProperty("destination_currency", "BTC");

            // NOTE: We're NOT calling wallet_confirm_transaction in E2E tests
            // to avoid making real transactions. The proforma creation validates
            // the endpoint is correct.
        },
        E2E_TIMEOUT * 2
    );
});
