/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleAccountTool } from "../../src/tools/account.js";
import { handleAggregationTool } from "../../src/tools/aggregation.js";
import { handleEarnTool } from "../../src/tools/earn.js";
import { handleLoanTool } from "../../src/tools/loan.js";
import { handleProTool } from "../../src/tools/pro.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("../../src/services/bit2me.js");
vi.mock("axios");

describe("Other Tool Handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Account Tools ---
    describe("Account Tools", () => {
        it("should handle account_get_info", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: "user1" });
            const result = await handleAccountTool("account_get_info", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/account");
            expect(JSON.parse(result.content[0].text)).toEqual(expect.objectContaining({ user_id: "user1" }));
        });

        it("should throw for unknown account tool", async () => {
            await expect(handleAccountTool("unknown", {})).rejects.toThrow("Unknown account tool");
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

            const result = await handleAggregationTool("portfolio_get_valuation", { fiat_currency: "EUR" });

            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveProperty("total_value");
            expect(parsed).toHaveProperty("currency", "EUR");
        });

        it("should throw for unknown aggregation tool", async () => {
            await expect(handleAggregationTool("unknown", {})).rejects.toThrow("Unknown aggregation tool");
        });
    });

    // --- Earn Tools ---
    describe("Earn Tools", () => {
        it("should handle earn_get_summary", async () => {
            const mockResponse = [[{ currency: "EUR", totalBalance: "100", rewardsEarned: "1" }]];
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);

            const result = await handleEarnTool("earn_get_summary", {});

            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/summary");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual({
                currency: "EUR",
                total_balance: "100",
                rewards_earned: "1",
                apy: "0",
            });
        });

        it("should handle earn_get_wallets", async () => {
            const mockResponse = [
                {
                    total: 1,
                    data: [{ walletId: "w1", currency: "EUR", balance: "100" }],
                },
            ];
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);

            const result = await handleEarnTool("earn_get_wallets", {});

            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/wallets");
            const parsed = JSON.parse(result.content[0].text);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toEqual(
                expect.objectContaining({
                    id: "w1",
                    currency: "EUR",
                    balance: "100",
                })
            );
        });

        it("should handle earn_get_wallet_details", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_wallet_details", { walletId: "w1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/w1");
        });

        it("should handle earn_get_transactions", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleEarnTool("earn_get_transactions", { walletId: "w1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "GET",
                "/v1/earn/wallets/w1/movements",
                expect.any(Object)
            );
        });

        it("should handle earn_get_transactions_summary", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_transactions_summary", { type: "DEPOSIT" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/movements/DEPOSIT/summary");
        });

        it("should handle earn_create_transaction", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: "tx1" });
            await handleEarnTool("earn_create_transaction", {
                pocketId: "p1",
                currency: "BTC",
                amount: "1",
                type: "deposit",
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                "/v1/earn/wallets/p1/movements",
                expect.any(Object)
            );
        });

        it("should handle earn_get_assets", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_assets", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/assets");
        });

        it("should handle earn_get_apy", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_apy", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/earn/apy");
        });

        it("should handle earn_get_rewards_config", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_rewards_config", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/rewards/config");
        });

        it("should handle earn_get_wallet_rewards_config", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_wallet_rewards_config", { walletId: "w1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/w1/rewards/config");
        });

        it("should handle earn_get_wallet_rewards_summary", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleEarnTool("earn_get_wallet_rewards_summary", { walletId: "w1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/wallets/w1/rewards");
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
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: "loan1" });
            await handleLoanTool("loan_create", {
                guaranteeCurrency: "BTC",
                guaranteeAmount: "1",
                loanCurrency: "EUR",
                loanAmount: "100",
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/loan", expect.any(Object));
        });

        it("should handle loan_get_active", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleLoanTool("loan_get_active", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/orders");
        });

        it("should handle loan_get_config", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleLoanTool("loan_get_config", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/config");
        });

        it("should handle loan_get_ltv", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_get_ltv", {
                guaranteeCurrency: "BTC",
                loanCurrency: "EUR",
                userCurrency: "EUR",
            });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/ltv", expect.any(Object));
        });

        it("should handle loan_get_order_details", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_get_order_details", { orderId: "o1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/order/o1");
        });

        it("should handle loan_get_transactions", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleLoanTool("loan_get_transactions", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/loan/movements", expect.any(Object));
        });

        it("should handle loan_increase_guarantee", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_increase_guarantee", { orderId: "o1", guaranteeAmount: "1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                "/v1/loan/o1/guarantee/increase",
                expect.any(Object)
            );
        });

        it("should handle loan_payback", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleLoanTool("loan_payback", { orderId: "o1", paybackAmount: "100" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/loan/o1/payback", expect.any(Object));
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
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: "order1" });
            await handleProTool("pro_create_order", { symbol: "BTC/EUR", side: "buy", type: "market", amount: 1 });
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
            await handleProTool("pro_get_order_details", { orderId: "o1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/order/o1");
        });

        it("should handle pro_get_order_trades", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleProTool("pro_get_order_trades", { orderId: "o1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/order/o1/trades");
        });

        it("should handle pro_get_transactions", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
            await handleProTool("pro_get_transactions", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/trading/trade", expect.any(Object));
        });

        it("should handle pro_cancel_order", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_cancel_order", { orderId: "o1" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("DELETE", "/v1/trading/order/o1");
        });

        it("should handle pro_cancel_all_orders", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_cancel_all_orders", {});
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "DELETE",
                "/v1/trading/orders",
                expect.any(Object)
            );
        });

        it("should handle pro_deposit", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_deposit", { currency: "EUR", amount: "100" });
            expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
                "POST",
                "/v1/trading/wallet/deposit",
                expect.any(Object)
            );
        });

        it("should handle pro_withdraw", async () => {
            vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({});
            await handleProTool("pro_withdraw", { currency: "EUR", amount: "100" });
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
