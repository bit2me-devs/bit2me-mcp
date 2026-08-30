import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProTool } from "../../src/tools/pro.js";
import * as bit2meService from "../../src/services/bit2me.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("axios");
vi.mock("../../src/config.js", () => ({
    getConfig: vi.fn(() => ({
        API_KEY: "test-key",
        API_SECRET: "test-secret",
        INCLUDE_RAW_RESPONSE: false,
    })),
}));

describe("Pro Tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle pro_get_balance", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleProTool("pro_get_balance", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/wallet/balance");
    });

    it("should handle pro_create_order", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
        await handleProTool("pro_create_order", {
            pair: "BTC-USD",
            side: "buy",
            type: "market",
            amount: "1",
            confirm: true,
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/trading/order",
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle pro_get_open_orders", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleProTool("pro_get_open_orders", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            "/v1/trading/order",
            expect.objectContaining({ status: "open" })
        );
    });

    it("should handle pro_get_open_orders with order_id filter", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleProTool("pro_get_open_orders", { order_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", `/v1/trading/order/${VALID_UUID}`);
    });

    it("should handle pro_get_order_trades", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleProTool("pro_get_order_trades", { order_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(`GET`, `/v1/trading/order/${VALID_UUID}/trades`);
    });

    it("should handle pro_get_trades", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleProTool("pro_get_trades", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/trade", expect.any(Object));
    });

    it("should handle pro_cancel_order", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleProTool("pro_cancel_order", { order_id: VALID_UUID, confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            `DELETE`,
            `/v1/trading/order/${VALID_UUID}`,
            undefined,
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle pro_cancel_all_orders", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleProTool("pro_cancel_all_orders", { confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "DELETE",
            "/v1/trading/order",
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle pro_deposit", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleProTool("pro_deposit", { symbol: "EUR", amount: "100", confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/trading/wallet/deposit",
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle pro_withdraw", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleProTool("pro_withdraw", { symbol: "EUR", amount: "100", confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/trading/wallet/withdraw",
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should throw for unknown pro tool", async () => {
        await expect(handleProTool("unknown", {})).rejects.toThrow("Unknown pro tool");
    });
});
