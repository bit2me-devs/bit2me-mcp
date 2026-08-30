export interface EarnSummaryResponse {
    symbol: string;
    total_balance: string;
    total_rewards: string;
}

export interface EarnPositionResponse {
    position_id: string;
    symbol: string;
    balance: string;
    strategy: string;
    lock_period?:
        | {
              lock_period_id: string;
              months: number;
          }
        | undefined;
    converted_balance?:
        | {
              value: string;
              symbol: string;
              created_at?: string | undefined;
          }
        | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    // Keep id and wallet_id for backward compatibility
    id?: string | undefined;
    wallet_id?: string | undefined;
    total_balance?: string | undefined; // v2/earn/wallets has totalBalance
}

/**
 * Earn APY rates for a symbol.
 * All yield values are decimals where 1.0 = 100%.
 * Example: 0.05 means 5% yield.
 */
export interface EarnAPYResponse {
    symbol: string;
    rates: {
        /** Daily yield as decimal (1.0 = 100%) */
        daily_yield_ratio: string;
        /** Weekly yield as decimal (1.0 = 100%) */
        weekly_yield_ratio: string;
        /** Monthly yield as decimal (1.0 = 100%) */
        monthly_yield_ratio: string;
    };
}

/**
 * Earn movement for a specific position
 * API: GET /v1/earn/wallets/{walletId}/movements
 */
export interface EarnPositionMovementResponse {
    id: string;
    type: "deposit" | "withdrawal" | "reward" | "fee";
    symbol: string;
    amount: string;
    created_at: string;
    position_id: string;
    // Keep wallet_id for backward compatibility
    wallet_id?: string;
}

/**
 * Earn movement (global, all positions)
 * API: GET /v2/earn/movements
 */
export interface EarnMovementResponse {
    id: string;
    type: "deposit" | "reward" | "withdrawal" | "discount-funds" | "discount-rewards" | "fee";
    created_at: string;
    position_id: string;
    amount: {
        value: string;
        symbol: string;
    };
    rate?: {
        amount: {
            value: string;
            symbol: string;
        };
        pair: string;
    };
    converted_amount?: {
        value: string;
        symbol: string;
    };
    source?: {
        pocket_id: string;
        symbol: string;
    };
    issuer?: {
        id: string;
        name: string;
        integrator: string;
    };
    // Keep wallet_id for backward compatibility
    wallet_id?: string;
}
