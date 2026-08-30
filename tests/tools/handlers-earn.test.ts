import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleEarnTool } from "../../src/tools/earn.js";
import * as bit2meService from "../../src/services/bit2me.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";

vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return { ...actual, bit2meRequest: vi.fn(), getTicker: vi.fn(), getMarketPrice: vi.fn() };
});
vi.mock("axios");
vi.mock("../../src/config.js", () => ({
    getConfig: vi.fn(() => ({ API_KEY: "test-key", API_SECRET: "test-secret", INCLUDE_RAW_RESPONSE: false })),
}));

describe("Earn Tools — read", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle earn_get_summary", async () => {
        const mockResponse = [{ currency: "EUR", totalBalance: "100", totalRewards: "1" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);
        const result = await handleEarnTool("earn_get_summary", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/summary");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed.result).toEqual([{ symbol: "EUR", total_balance: "100", total_rewards: "1" }]);
    });

    it("should handle earn_get_positions with nested data structure", async () => {
        const mockResponse = {
            total: 1,
            data: [{ walletId: VALID_UUID, currency: "EUR", totalBalance: "100", status: "active" }],
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);
        const result = await handleEarnTool("earn_get_positions", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/wallets");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result).toHaveLength(1);
        expect(parsed.result[0]).toEqual(
            expect.objectContaining({ position_id: VALID_UUID, symbol: "EUR", balance: "100" })
        );
    });

    it("should handle earn_get_positions with direct array structure", async () => {
        const mockResponse = [{ walletId: VALID_UUID_2, currency: "BTC", balance: "0.1" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);
        const result = await handleEarnTool("earn_get_positions", {});
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result).toHaveLength(1);
        expect(parsed.result[0]).toEqual(expect.objectContaining({ position_id: VALID_UUID_2, symbol: "BTC" }));
    });

    it("should handle earn_get_positions with position_id filter", async () => {
        const mockResponse = {
            data: [
                { walletId: VALID_UUID, currency: "BTC", totalBalance: "1", status: "active" },
                { walletId: VALID_UUID_2, currency: "EUR", totalBalance: "100", status: "active" },
            ],
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);
        const result = await handleEarnTool("earn_get_positions", { position_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/wallets");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.result).toHaveLength(1);
        expect(parsed.result[0].position_id).toBe(VALID_UUID);
    });

    it("should handle earn_get_position_movements", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleEarnTool("earn_get_position_movements", { position_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            `/v1/earn/wallets/${VALID_UUID}/movements`,
            expect.any(Object)
        );
    });

    it("should handle earn_get_movements (global)", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ total: 0, data: [] });
        await handleEarnTool("earn_get_movements", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/movements", expect.any(Object));
    });

    it("should handle earn_get_movements with filters", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ total: 0, data: [] });
        await handleEarnTool("earn_get_movements", {
            symbol: "BTC",
            position_id: VALID_UUID,
            type: "deposit",
            limit: 50,
            offset: 10,
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            "/v2/earn/movements",
            expect.objectContaining({
                currency: "BTC",
                walletId: VALID_UUID,
                type: "deposit",
                limit: 50,
                offset: 10,
            })
        );
    });

    it("should handle earn_get_movements_summary", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleEarnTool("earn_get_movements_summary", { type: "DEPOSIT" });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/movements/deposit/summary");
    });
});
