import { describe, it, expect } from "vitest";
import {
    mapEarnRewardsConfigResponse,
    mapEarnPositionRewardsConfigResponse,
    mapEarnPositionRewardsSummaryResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Earn Mappers", () => {
        it("should map earn rewards config response", () => {
            expect(() => mapEarnRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "d3841daf-b619-4903-838c-032f31fbd593",
                userId: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                currency: "B3X",
                lockPeriodId: null,
                rewardCurrency: "B3X",
                createdAt: "2022-09-13T20:36:21.065Z",
                updatedAt: "2025-07-02T13:37:26.141Z",
            };
            const result = mapEarnRewardsConfigResponse(valid);
            expect(result).toMatchObject({
                position_id: "d3841daf-b619-4903-838c-032f31fbd593",
                user_id: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                symbol: "B3X",
                lock_period_id: null,
                reward_symbol: "B3X",
                created_at: "2022-09-13T20:36:21.065Z",
                updated_at: "2025-07-02T13:37:26.141Z",
            });
            // wallet_id should still be present for backward compatibility
            expect(result).toHaveProperty("wallet_id", "d3841daf-b619-4903-838c-032f31fbd593");
        });

        it("should map earn wallet rewards config response", () => {
            expect(() => mapEarnPositionRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "f482981e-6f8e-4d43-841d-8585a1021f94",
                userId: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                currency: "DOT",
                lockPeriodId: null,
                rewardCurrency: "B2M",
                createdAt: "2025-04-23T04:00:32.551Z",
                updatedAt: "2025-07-02T13:37:26.141Z",
            };
            const result = mapEarnPositionRewardsConfigResponse(valid);
            expect(result).toMatchObject({
                position_id: "f482981e-6f8e-4d43-841d-8585a1021f94",
                user_id: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                symbol: "DOT",
                lock_period_id: null,
                reward_symbol: "B2M",
                created_at: "2025-04-23T04:00:32.551Z",
                updated_at: "2025-07-02T13:37:26.141Z",
            });
            // wallet_id should still be present for backward compatibility
            expect(result).toHaveProperty("wallet_id", "f482981e-6f8e-4d43-841d-8585a1021f94");
        });

        it("should map earn wallet rewards summary response", () => {
            expect(() => mapEarnPositionRewardsSummaryResponse(null)).toThrow(ValidationError);
            const valid = {
                accumulatedRewards: [
                    {
                        currency: "B2M",
                        amount: "3861562.41527785",
                    },
                ],
                totalConvertedReward: {
                    currency: "EUR",
                    amount: "46361.57588988",
                },
            };
            const result = mapEarnPositionRewardsSummaryResponse(valid);
            expect(result).toEqual({
                reward_symbol: "B2M",
                reward_amount: "3861562.41527785",
                reward_converted_symbol: "EUR",
                reward_converted_amount: "46361.58", // Fiat value rounded to 2 decimals
            });
        });
    });
});
