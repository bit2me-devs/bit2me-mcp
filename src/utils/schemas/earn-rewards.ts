export interface EarnMovementsSummaryResponse {
    type: string;
    total_amount: string;
    total_count: number;
    symbol: string;
}

export interface EarnLockPeriod {
    id: string;
    months: number;
}

export interface EarnAssetWithAPY {
    symbol: string;
    name?: string;
    disabled: boolean;
    deposit_disabled: boolean;
    withdrawal_disabled: boolean;
    is_new: boolean;
    lock_periods?: EarnLockPeriod[];
    reward_currencies?: string[];
    level_extra_yield_percentage?: number;
    apy?: {
        daily_yield_ratio: string;
        weekly_yield_ratio: string;
        monthly_yield_ratio: string;
    };
}

export interface EarnAssetsResponse {
    assets: EarnAssetWithAPY[];
}

export interface EarnRewardsConfigResponse {
    position_id: string;
    user_id: string;
    symbol: string;
    lock_period_id: string | null;
    reward_symbol: string;
    created_at: string;
    updated_at: string;
    // Keep wallet_id for backward compatibility
    wallet_id?: string;
}

/**
 * Earn position rewards configuration
 * API: GET /v1/earn/wallets/{walletId}/rewards/config
 */
export interface EarnPositionRewardsConfigResponse {
    position_id: string;
    user_id: string;
    symbol: string;
    lock_period_id: string | null;
    reward_symbol: string;
    created_at: string;
    updated_at: string;
    // Keep wallet_id for backward compatibility
    wallet_id?: string;
}

/**
 * Earn position rewards summary
 * API: GET /v1/earn/wallets/{walletId}/rewards/summary
 */
export interface EarnPositionRewardsSummaryResponse {
    reward_symbol: string;
    reward_amount: string;
    reward_converted_symbol: string;
    reward_converted_amount: string;
}

export interface EarnOperationResponse {
    id: string;
    type: "deposit" | "withdrawal";
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}
