import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGeneralTool } from "../../src/tools/general.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

describe("General Tools Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle general_get_assets_config without symbol (all assets)", async () => {
        const mockAssets = {
            BTC: {
                name: "Bitcoin",
                precision: 8,
                assetType: "crypto",
                network: "BITCOIN",
                enabled: true,
                ticker: true,
                loanable: false,
                pairsWith: ["EUR"],
            },
            ETH: {
                name: "Ethereum",
                precision: 18,
                assetType: "crypto",
                network: "ETHEREUM",
                enabled: true,
                ticker: true,
                loanable: false,
                pairsWith: ["EUR"],
            },
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAssets);

        const result = await handleGeneralTool("general_get_assets_config", { include_testnet: true });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/currency/assets"),
            expect.objectContaining({ includeTestnet: true })
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(2);
        expect(parsed.result[0].network).toBe("bitcoin");
        expect(parsed.result[1].network).toBe("ethereum");
    });

    it("should handle general_get_assets_config with symbol (single asset)", async () => {
        const mockAsset = {
            name: "Bitcoin",
            precision: 8,
            assetType: "crypto",
            network: "BITCOIN",
            enabled: true,
            ticker: true,
            loanable: false,
            pairsWith: ["EUR"],
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAsset);

        const result = await handleGeneralTool("general_get_assets_config", { symbol: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            expect.stringContaining("/v2/currency/assets/BTC"),
            expect.any(Object)
        );
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("result");
        expect(parsed.result.symbol).toBe("BTC");
        expect(parsed.result.network).toBe("bitcoin");
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleGeneralTool("unknown_tool", {})).rejects.toThrow("Unknown general tool");
    });
});
