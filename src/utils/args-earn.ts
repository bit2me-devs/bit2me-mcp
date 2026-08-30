import type { WriteToolArgs } from "./args-write.js";

/** Args for earn_get_movements — all movements across all positions */
export interface EarnMovementsArgs {
    user_symbol?: string;
    symbol?: string;
    related_symbol?: string;
    position_id?: string;
    start_date?: string;
    end_date?: string;
    type?: "deposit" | "reward" | "withdrawal" | "discount-funds" | "discount-rewards";
    limit?: number;
    offset?: number;
    sort_by?: "createdAt";
}

/** Args for earn_get_position_movements */
export interface EarnPositionMovementsArgs {
    position_id: string;
    limit?: number;
    offset?: number;
}

export interface EarnMovementsSummaryArgs {
    type: string;
}

export interface EarnDepositArgs extends WriteToolArgs {
    pocket_id: string;
    symbol: string;
    amount: string;
}

export interface EarnWithdrawArgs extends WriteToolArgs {
    pocket_id: string;
    symbol: string;
    amount: string;
}

export interface EarnPositionRewardsConfigArgs {
    position_id: string;
}

export interface EarnPositionRewardsSummaryArgs {
    position_id: string;
    user_currency?: string;
}
