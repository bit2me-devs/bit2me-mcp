import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleMarketTool } from "../../src/tools/market.js";

describeE2E("E2E: Market Tools", () => {

    it(
        "should get all available assets",
        async () => {
            const result = await handleMarketTool("market_get_assets_details", {});
            const assets = JSON.parse(result.content[0].text);

            expect(Array.isArray(assets)).toBe(true);
            expect(assets.length).toBeGreaterThan(0);
            expect(assets[0]).toHaveProperty("symbol");
            expect(assets[0]).toHaveProperty("name");
            // Verify network is lowercase
            if (assets[0].network) {
                expect(assets[0].network).toBe(assets[0].network.toLowerCase());
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get asset details",
        async () => {
            const result = await handleMarketTool("market_get_assets_details", { symbol: "BTC" });
            const asset = JSON.parse(result.content[0].text);

            expect(asset).toHaveProperty("symbol", "BTC");
            expect(asset).toHaveProperty("type");
            // Verify network is lowercase
            if (asset.network) {
                expect(asset.network).toBe(asset.network.toLowerCase());
            }
        },
        E2E_TIMEOUT
    );

});
