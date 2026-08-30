import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleEarnTool } from "../../src/tools/earn.js";
import * as bit2meService from "../../src/services/bit2me.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return { ...actual, bit2meRequest: vi.fn(), getTicker: vi.fn(), getMarketPrice: vi.fn() };
});
vi.mock("axios");
vi.mock("../../src/config.js", () => ({
    getConfig: vi.fn(() => ({ API_KEY: "test-key", API_SECRET: "test-secret", INCLUDE_RAW_RESPONSE: false })),
}));

describe("Earn Tools — write and assets", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle earn_deposit", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
        await handleEarnTool("earn_deposit", { pocket_id: VALID_UUID, symbol: "BTC", amount: "1", confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            `/v1/earn/wallets/${VALID_UUID}/movements`,
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle earn_withdraw", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
        await handleEarnTool("earn_withdraw", { pocket_id: VALID_UUID, symbol: "BTC", amount: "1", confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            `/v1/earn/wallets/${VALID_UUID}/movements`,
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle earn_get_assets with object structure", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockImplementation(async (_method, url) => {
            if (url.includes("/v2/earn/assets")) {
                return {
                    assets: [
                        { currency: "BTC", name: "Bitcoin", disabled: false, depositDisabled: false },
                        { currency: "EUR", disabled: true },
                    ],
                };
            }
            if (url.includes("/v2/earn/apy")) return { BTC: { daily: 0.1 } };
            return {};
        });
        const result = await handleEarnTool("earn_get_assets", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/assets");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result.assets[0]).toMatchObject({
            symbol: "BTC",
            name: "Bitcoin",
            disabled: false,
            deposit_disabled: false,
        });
        expect(parsed.result.assets[1]).toMatchObject({ symbol: "EUR", disabled: true });
    });

    it("should handle earn_get_assets with array structure", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockImplementation(async (_method, url) => {
            if (url.includes("/v2/earn/assets")) return ["BTC", "EUR"];
            if (url.includes("/v2/earn/apy")) return {};
            return {};
        });
        const result = await handleEarnTool("earn_get_assets", {});
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result.assets[0]).toMatchObject({
            symbol: "BTC",
            disabled: false,
            deposit_disabled: false,
            withdrawal_disabled: false,
            is_new: false,
        });
    });

    it("should handle earn_get_rewards_config", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([{ currency: "B2M", walletId: VALID_UUID }]);
        const result = await handleEarnTool("earn_get_rewards_config", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/rewards/config");
        const parsed = JSON.parse(result.content[0].text);
        expect(Array.isArray(parsed.result) ? parsed.result[0] : parsed.result).toEqual(
            expect.objectContaining({ symbol: "B2M", position_id: VALID_UUID })
        );
    });

    it("should handle earn_get_position_rewards_config", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleEarnTool("earn_get_position_rewards_config", { position_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            `/v1/earn/wallets/${VALID_UUID}/rewards/config`
        );
    });

    it("should handle earn_get_position_rewards_summary", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleEarnTool("earn_get_position_rewards_summary", { position_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            `/v1/earn/wallets/${VALID_UUID}/rewards/summary`,
            expect.any(Object)
        );
    });

    it("should throw for unknown earn tool", async () => {
        await expect(handleEarnTool("unknown", {})).rejects.toThrow("Unknown earn tool");
    });
});
