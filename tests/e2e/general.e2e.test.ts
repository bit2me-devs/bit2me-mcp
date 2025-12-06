import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleGeneralTool } from "../../src/tools/general.js";

describeE2E("E2E: General Tools", () => {
    it(
        "should get all available assets",
        async () => {
            const result = await handleGeneralTool("general_get_assets_config", {});
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
            const result = await handleGeneralTool("general_get_assets_config", { symbol: "BTC" });
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
