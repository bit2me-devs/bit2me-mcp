/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGeneralTool } from "../../src/tools/general.js";
import { handleEarnTool } from "../../src/tools/earn.js";
import { handleLoanTool } from "../../src/tools/loan.js";
import { handleProTool } from "../../src/tools/pro.js";
import * as bit2meService from "../../src/services/bit2me.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";

vi.mock("../../src/services/bit2me.js");
vi.mock("axios");
vi.mock("../../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: vi.fn(() => ({
        API_KEY: "test-key",
        API_SECRET: "test-secret",
        INCLUDE_RAW_RESPONSE: false,
    })),
}));

describe("Other Tool Handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- General Tools (Account) ---
    describe("General Tools - Account", () => {
        it("should handle account_get_info", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: "user1" });
            const result = await handleGeneralTool("account_get_info", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/account");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result).toEqual(expect.objectContaining({ user_id: "user1" }));
        });

        it("should throw for unknown general tool", async () => {
            await expect(handleGeneralTool("unknown", {})).rejects.toThrow("Unknown general tool");
        });
    });

    // --- Aggregation Tools ---
    describe("Aggregation Tools", () => {
        it("should handle portfolio_get_valuation", async () => {
            // Mock responses for all portfolio calls
            vi.mocked(bit2meService.bit2meRequest).mockImplementation(async (method, url) => {
                if (url.includes("/v1/wallet/pocket")) return [];
                if (url.includes("/v2/earn/wallets")) return [];
                if (url.includes("/v1/loan/orders")) return [];
                if (url.includes("/v1/trading/wallet/balance")) return [];
                return [];
            });

            // Mock ticker for valuation
            vi.mocked(bit2meService.getTicker).mockResolvedValue({ last: "100" } as any);

            const result = await handleGeneralTool("portfolio_get_valuation", { fiat_symbol: "EUR" });

            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result).toHaveProperty("total_value");
            expect(parsed.result).toHaveProperty("quote_symbol", "EUR");
        });

        it("should throw for unknown aggregation tool", async () => {
            await expect(handleGeneralTool("unknown_portfolio", {})).rejects.toThrow("Unknown general tool");
        });
    });

    // --- Earn Tools ---
    describe("Earn Tools", () => {
        it("should handle earn_get_summary", async () => {
            // API returns array of summaries per currency
            const mockResponse = [{ currency: "EUR", totalBalance: "100", totalRewards: "1" }];
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);

            const result = await handleEarnTool("earn_get_summary", {});

            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/summary");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result).toEqual([
                {
                    symbol: "EUR",
                    total_balance: "100",
                    total_rewards: "1",
                },
            ]);
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
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result).toHaveLength(1);
            expect(parsed.result[0]).toEqual(
                expect.objectContaining({
                    position_id: VALID_UUID,
                    symbol: "EUR",
                    balance: "100",
                })
            );
        });

        it("should handle earn_get_positions with direct array structure", async () => {
            const mockResponse = [{ walletId: VALID_UUID_2, currency: "BTC", balance: "0.1" }];
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);

            const result = await handleEarnTool("earn_get_positions", {});

            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result).toHaveLength(1);
            expect(parsed.result[0]).toEqual(
                expect.objectContaining({
                    position_id: VALID_UUID_2,
                    symbol: "BTC",
                })
            );
        });

        it("should handle earn_get_position_details", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
                id: VALID_UUID,
                currency: "BTC",
                balance: "1",
                status: "active",
            });
            await handleEarnTool("earn_get_position_details", { position_id: VALID_UUID });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", `/v1/earn/wallets/${VALID_UUID}`);
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
            // Type is normalized to lowercase
            await handleEarnTool("earn_get_movements_summary", { type: "DEPOSIT" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/movements/deposit/summary");
        });

        it("should handle earn_deposit", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
            await handleEarnTool("earn_deposit", {
                pocket_id: VALID_UUID,
                symbol: "BTC",
                amount: "1",
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                `/v1/earn/wallets/${VALID_UUID}/movements`,
                expect.any(Object)
            );
        });

        it("should handle earn_withdraw", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
            await handleEarnTool("earn_withdraw", {
                pocket_id: VALID_UUID,
                symbol: "BTC",
                amount: "1",
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                `/v1/earn/wallets/${VALID_UUID}/movements`,
                expect.any(Object)
            );
        });

        it("should handle earn_get_assets with object structure", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ assets: ["BTC", "EUR"] });
            const result = await handleEarnTool("earn_get_assets", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/assets");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result.symbols).toEqual(["BTC", "EUR"]);
        });

        it("should handle earn_get_assets with array structure", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(["BTC", "EUR"]);
            const result = await handleEarnTool("earn_get_assets", {});
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
            expect(parsed.result.symbols).toEqual(["BTC", "EUR"]);
        });

        it("should handle earn_get_apy", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_apy", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/apy");
        });

        it("should handle earn_get_rewards_config", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([{ currency: "B2M", walletId: VALID_UUID }]);
            const result = await handleEarnTool("earn_get_rewards_config", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/rewards/config");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("request");
            expect(parsed).toHaveProperty("result");
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

    // --- Loan Tools ---
    describe("Loan Tools", () => {
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
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/loan", expect.any(Object));
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

        it("should handle loan_get_order_details", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_get_order_details", { order_id: VALID_UUID });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(`GET`, `/v1/loan/orders/${VALID_UUID}`);
        });

        it("should handle loan_get_movements", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleLoanTool("loan_get_movements", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/movements", expect.any(Object));
        });

        it("should handle loan_increase_guarantee", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_increase_guarantee", { order_id: VALID_UUID, guarantee_amount: "1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                `/v1/loan/${VALID_UUID}/guarantee/increase`,
                expect.any(Object)
            );
        });

        it("should handle loan_payback", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_payback", { order_id: VALID_UUID, payback_amount: "100" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                `/v1/loan/${VALID_UUID}/payback`,
                expect.any(Object)
            );
        });

        it("should throw for unknown loan tool", async () => {
            await expect(handleLoanTool("unknown", {})).rejects.toThrow("Unknown loan tool");
        });
    });

    // --- Pro Tools ---
    describe("Pro Tools", () => {
        it("should handle pro_get_balance", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleProTool("pro_get_balance", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/wallet/balance");
        });

        it("should handle pro_create_order", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
            await handleProTool("pro_create_order", { pair: "BTC-USD", side: "buy", type: "market", amount: "1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/trading/order", expect.any(Object));
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

        it("should handle pro_get_order_details", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_get_order_details", { order_id: VALID_UUID });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(`GET`, `/v1/trading/order/${VALID_UUID}`);
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
            await handleProTool("pro_cancel_order", { order_id: VALID_UUID });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(`DELETE`, `/v1/trading/order/${VALID_UUID}`);
        });

        it("should handle pro_cancel_all_orders", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_cancel_all_orders", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("DELETE", "/v1/trading/order", expect.any(Object));
        });

        it("should handle pro_deposit", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_deposit", { symbol: "EUR", amount: "100" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                "/v1/trading/wallet/deposit",
                expect.any(Object)
            );
        });

        it("should handle pro_withdraw", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_withdraw", { symbol: "EUR", amount: "100" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                "/v1/trading/wallet/withdraw",
                expect.any(Object)
            );
        });

        it("should throw for unknown pro tool", async () => {
            await expect(handleProTool("unknown", {})).rejects.toThrow("Unknown pro tool");
        });
    });
});
