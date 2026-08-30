import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleLoanTool } from "../../src/tools/loan.js";
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

describe("Loan Tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle loan_get_orders", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleLoanTool("loan_get_orders", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/orders", expect.any(Object));
    });

    it("should handle loan_create", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
        await handleLoanTool("loan_create", {
            guarantee_symbol: "BTC",
            guarantee_amount: "1",
            loan_symbol: "EUR",
            loan_amount: "100",
            amount_type: "fixed_collateral",
            confirm: true,
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/loan",
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle loan_get_config", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleLoanTool("loan_get_config", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/loan/currency/configuration");
    });

    it("should handle loan_get_simulation", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleLoanTool("loan_get_simulation", {
            guarantee_symbol: "BTC",
            loan_symbol: "EUR",
            user_symbol: "EUR",
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/ltv", expect.any(Object));
    });

    it("should handle loan_get_orders with order_id filter", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleLoanTool("loan_get_orders", { order_id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", `/v1/loan/orders/${VALID_UUID}`);
    });

    it("should handle loan_get_movements", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await handleLoanTool("loan_get_movements", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/movements", expect.any(Object));
    });

    it("should handle loan_increase_guarantee", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleLoanTool("loan_increase_guarantee", {
            order_id: VALID_UUID,
            guarantee_amount: "1",
            confirm: true,
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            `/v1/loan/${VALID_UUID}/guarantee/increase`,
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle loan_payback", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
        await handleLoanTool("loan_payback", { order_id: VALID_UUID, payback_amount: "100", confirm: true });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            `/v1/loan/${VALID_UUID}/payback`,
            expect.any(Object),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should throw for unknown loan tool", async () => {
        await expect(handleLoanTool("unknown", {})).rejects.toThrow("Unknown loan tool");
    });
});
