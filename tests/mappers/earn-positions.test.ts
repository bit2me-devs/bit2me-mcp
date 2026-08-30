import { describe, it, expect } from "vitest";
import {
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnPositionsResponse,
    mapEarnAssetsResponse,
} from "../../src/utils/response-mappers.js";

describe("Response Mappers", () => {
    describe("Earn Mappers", () => {
        it("should map earn summary response", () => {
            // API returns array of summaries per currency
            expect(mapEarnSummaryResponse(null)).toEqual([]);
            const valid = [{ currency: "BTC", totalBalance: "1", totalRewards: "0.1" }];
            expect(mapEarnSummaryResponse(valid)).toEqual([
                {
                    symbol: "BTC",
                    total_balance: "1",
                    total_rewards: "0.1",
                },
            ]);
        });

        it("should map earn APY response", () => {
            expect(mapEarnAPYResponse(null)).toEqual({});
            const valid = { BTC: { daily: 0.01, weekly: 0.07, monthly: 0.3 } };
            expect(mapEarnAPYResponse(valid)).toEqual({
                BTC: {
                    symbol: "BTC",
                    rates: {
                        daily_yield_ratio: "0.01",
                        weekly_yield_ratio: "0.07",
                        monthly_yield_ratio: "0.3",
                    },
                },
            });
        });

        it("should map earn wallets response", () => {
            expect(mapEarnPositionsResponse(null)).toEqual([]);
            const valid = [{ id: "1", currency: "BTC", totalBalance: "1", strategy: "flexible", status: "active" }];
            const result = mapEarnPositionsResponse(valid);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: "1",
                symbol: "BTC",
                balance: "1",
                strategy: "flexible",
                total_balance: "1",
            });
            // APY should not be present
            expect(result[0]).not.toHaveProperty("apy");
        });

        it("should map earn assets response", () => {
            expect(mapEarnAssetsResponse(null)).toEqual({ assets: [] });

            // Test simple string array
            const simpleValid = { assets: ["BTC", "ETH"] };
            const simpleResult = mapEarnAssetsResponse(simpleValid);
            expect(simpleResult.assets[0]).toMatchObject({
                symbol: "BTC",
                disabled: false,
                deposit_disabled: false,
                withdrawal_disabled: false,
                is_new: false,
            });

            // Test full object structure
            const fullValid = {
                assets: [
                    {
                        currency: "BTC",
                        name: "Bitcoin",
                        disabled: false,
                        depositDisabled: false,
                        withdrawalDisabled: true,
                        isNew: false,
                        lockPeriodsAllowed: [{ id: "flex", months: 0 }],
                        currenciesRewardAllowed: ["BTC", "B2M"],
                    },
                ],
            };
            const fullResult = mapEarnAssetsResponse(fullValid);
            expect(fullResult.assets[0]).toMatchObject({
                symbol: "BTC",
                name: "Bitcoin",
                disabled: false,
                deposit_disabled: false,
                withdrawal_disabled: true,
                is_new: false,
                lock_periods: [{ id: "flex", months: 0 }],
                reward_currencies: ["BTC", "B2M"],
            });
        });
    });
});
