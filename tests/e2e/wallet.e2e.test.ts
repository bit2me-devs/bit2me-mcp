import { it, expect } from "vitest";
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
        "should filter pockets by symbol",
        async () => {
            const result = await handleWalletTool("wallet_get_pockets", { symbol: "EUR" });
            const pockets = JSON.parse(result.content[0].text);

            expect(Array.isArray(pockets)).toBe(true);
            pockets.forEach((pocket: any) => {
                expect(pocket.symbol).toBe("EUR");
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
            const result = await handleWalletTool("wallet_get_pocket_details", { pocket_id: pocketId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", pocketId);
            expect(details).toHaveProperty("currency");
            expect(details).toHaveProperty("balance");
            expect(details).toHaveProperty("created_at");
        },
        E2E_TIMEOUT
    );

    it(
        "should get available networks for a currency",
        async () => {
            const result = await handleWalletTool("wallet_get_networks", { symbol: "BTC" });
            const networks = JSON.parse(result.content[0].text);

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBeGreaterThan(0);
            expect(networks[0]).toHaveProperty("id");
            expect(networks[0]).toHaveProperty("name");
        },
        E2E_TIMEOUT
    );

    it(
        "should get wallet movements",
        async () => {
            const result = await handleWalletTool("wallet_get_movements", { limit: 5 });
            const response = JSON.parse(result.content[0].text);

            expect(response).toHaveProperty("metadata");
            expect(response).toHaveProperty("movements");
            expect(Array.isArray(response.movements)).toBe(true);
            if (response.movements.length > 0) {
                expect(response.movements[0]).toHaveProperty("id");
                expect(response.movements[0]).toHaveProperty("type");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should validate transaction flow (buy crypto)",
        async () => {
            // Get EUR and BTC pockets
            const eurResult = await handleWalletTool("wallet_get_pockets", { symbol: "EUR" });
            const eurPockets = JSON.parse(eurResult.content[0].text);
            const eurPocket = eurPockets.find((p: any) => parseFloat(p.balance) > 1);

            if (!eurPocket) {
                console.warn("⚠️ Skipping transaction test - no EUR pocket with sufficient balance");
                return;
            }

            const btcResult = await handleWalletTool("wallet_get_pockets", { symbol: "BTC" });
            const btcPockets = JSON.parse(btcResult.content[0].text);
            const btcPocket = btcPockets[0];

            if (!btcPocket) {
                console.warn("⚠️ Skipping transaction test - no BTC pocket found");
                return;
            }

            // NOTE: Trading operations (buy/sell/swap) have been moved to broker tools
            // See tests/e2e/broker.e2e.test.ts for broker_quote_buy tests
        },
        E2E_TIMEOUT * 2
    );

    it(
        "should get pocket addresses",
        async () => {
            // First get a crypto pocket (not fiat)
            const btcResult = await handleWalletTool("wallet_get_pockets", { symbol: "BTC" });
            const btcPockets = JSON.parse(btcResult.content[0].text);

            if (btcPockets.length === 0) {
                console.warn("⚠️ Skipping pocket addresses test - no BTC pocket found");
                return;
            }

            const pocketId = btcPockets[0].id;

            // Get addresses for this pocket
            const result = await handleWalletTool("wallet_get_pocket_addresses", {
                pocket_id: pocketId,
                network: "bitcoin",
            });
            const addresses = JSON.parse(result.content[0].text);

            expect(Array.isArray(addresses)).toBe(true);
            if (addresses.length > 0) {
                expect(addresses[0]).toHaveProperty("address");
                expect(addresses[0]).toHaveProperty("network");
                expect(addresses[0]).toHaveProperty("created_at");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get movement details",
        async () => {
            // First get movements
            const txResult = await handleWalletTool("wallet_get_movements", { limit: 5 });
            const response = JSON.parse(txResult.content[0].text);

            if (response.movements.length === 0) {
                console.warn("⚠️ Skipping movement details test - no movements found");
                return;
            }

            const movementId = response.movements[0].id;

            // Get movement details
            const result = await handleWalletTool("wallet_get_movement_details", { movement_id: movementId });
            const details = JSON.parse(result.content[0].text);

            expect(details).toHaveProperty("id", movementId);
            expect(details).toHaveProperty("type");
            expect(details).toHaveProperty("status");
            expect(details).toHaveProperty("amount");
        },
        E2E_TIMEOUT
    );
});
