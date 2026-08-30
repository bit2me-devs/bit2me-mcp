import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleLoanTool } from "../../src/tools/loan.js";
import * as bit2meService from "../../src/services/bit2me.js";
import { ValidationError } from "../../src/utils/errors.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const CREATE_ARGS = {
    guarantee_symbol: "BTC",
    guarantee_amount: "1",
    loan_symbol: "EUR",
    loan_amount: "100",
    amount_type: "fixed_collateral",
};

vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false, API_KEY: "test", API_SECRET: "test" }),
}));

function parseText(result: { content: Array<{ text: string }> }) {
    return JSON.parse(result.content[0].text);
}

describe("Loan Tools — gaps", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        ["loan_create", CREATE_ARGS],
        ["loan_payback", { order_id: VALID_UUID, payback_amount: "100" }],
        ["loan_increase_guarantee", { order_id: VALID_UUID, guarantee_amount: "1" }],
    ] as const)("%s without confirm returns needs_confirmation and skips API", async (name, args) => {
        const result = await handleLoanTool(name, { ...args });
        expect(parseText(result).status).toBe("needs_confirmation");
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it.each(["0", "10abc"])("loan_payback rejects payback_amount %s and skips API", async (payback_amount) => {
        await expect(
            handleLoanTool("loan_payback", { order_id: VALID_UUID, payback_amount, confirm: true })
        ).rejects.toThrow(ValidationError);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("loan_create rejects invalid guarantee_amount and skips API", async () => {
        await expect(
            handleLoanTool("loan_create", { ...CREATE_ARGS, guarantee_amount: "10abc", confirm: true })
        ).rejects.toThrow(ValidationError);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("loan_increase_guarantee rejects amount 0 and skips API", async () => {
        await expect(
            handleLoanTool("loan_increase_guarantee", {
                order_id: VALID_UUID,
                guarantee_amount: "0",
                confirm: true,
            })
        ).rejects.toThrow(ValidationError);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("rejects invalid order_id on confirmed loan_payback", async () => {
        await expect(
            handleLoanTool("loan_payback", { order_id: "not-a-uuid", payback_amount: "100", confirm: true })
        ).rejects.toThrow(/Invalid order_id/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("rejects invalid order_id on loan_get_orders", async () => {
        await expect(handleLoanTool("loan_get_orders", { order_id: "not-a-uuid" })).rejects.toThrow(/Invalid order_id/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("throws for unknown loan tool", async () => {
        await expect(handleLoanTool("unknown_loan", {})).rejects.toThrow("Unknown loan tool");
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("maps loan_get_config guarantee and loan currencies", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            loanCurrencies: [
                {
                    currency: "USDC",
                    enabled: true,
                    liquidity: "250000",
                    liquidityStatus: "high",
                    apr: "0.13",
                    minimumAmount: "100",
                    maximumAmount: "250000",
                },
            ],
            guaranteeCurrencies: [{ currency: "BTC", enabled: true, liquidationLtv: "0.85", initialLtv: "0.5" }],
        });
        const parsed = parseText(await handleLoanTool("loan_get_config", {}));
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/loan/currency/configuration");
        expect(parsed.result.loan_currencies[0]).toMatchObject({
            symbol: "USDC",
            apr: "0.13",
            minimum_amount: "100",
            liquidity_status: "high",
        });
        expect(parsed.result.guarantee_currencies[0]).toMatchObject({
            symbol: "BTC",
            liquidation_ltv: "0.85",
            initial_ltv: "0.5",
        });
    });

    it("maps loan_get_orders camelCase amounts to snake_case", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            data: [
                {
                    orderId: VALID_UUID,
                    status: "active",
                    guaranteeCurrency: "BTC",
                    guaranteeAmount: "1.0",
                    loanCurrency: "EUR",
                    loanAmount: "52220.14",
                    loanOriginalAmount: "50750.0",
                    ltv: "0.6791",
                    apr: "0.17",
                },
            ],
        });
        const parsed = parseText(await handleLoanTool("loan_get_orders", {}));
        expect(parsed.result[0]).toMatchObject({
            id: VALID_UUID,
            status: "active",
            guarantee_symbol: "BTC",
            guarantee_amount: "1.0",
            loan_symbol: "EUR",
            loan_amount: "52220.14",
            loan_original_amount: "50750.0",
            ltv: "0.6791",
            apr: "0.17",
        });
    });

    it("maps loan_get_simulation LTV payload", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            guaranteeCurrency: "BTC",
            guaranteeAmount: "0.5678",
            guaranteeAmountConverted: "57000.34",
            loanCurrency: "USDC",
            loanAmount: "1250.34",
            loanAmountConverted: "1300.34",
            userCurrency: "EUR",
            ltv: "0.5",
            apr: "13.12",
        });
        const parsed = parseText(
            await handleLoanTool("loan_get_simulation", {
                guarantee_symbol: "BTC",
                loan_symbol: "USDC",
                user_symbol: "EUR",
            })
        );
        expect(parsed.result).toMatchObject({
            guarantee_symbol: "BTC",
            guarantee_amount: "0.5678",
            loan_symbol: "USDC",
            loan_amount: "1250.34",
            user_symbol: "EUR",
            ltv: "0.5",
            apr: "13.12",
        });
    });
});
