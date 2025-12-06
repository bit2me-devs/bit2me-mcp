/**
 * Optimized response schemas for Bit2Me MCP tools
 * These schemas are designed to be LLM-friendly: concise, flat, and descriptive
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// EXTENDED TOOL INTERFACE WITH DEPRECATION SUPPORT
// ============================================================================

/**
 * Extended Tool interface with deprecation support
 * Use this when defining tools that may be deprecated in the future
 */
export interface ExtendedTool extends Tool {
    /** Mark tool as deprecated - will show warning in description */
    deprecated?: boolean;
    /** Reason for deprecation and migration path */
    deprecationMessage?: string;
    /** Version when tool was deprecated */
    deprecatedSince?: string;
    /** Replacement tool name, if any */
    replacedBy?: string;
}

/**
 * Adds deprecation warning to tool description if deprecated
 * @param tool - The tool definition
 * @returns Tool with updated description if deprecated
 */
export function processToolDeprecation(tool: ExtendedTool): Tool {
    if (!tool.deprecated) {
        return tool;
    }

    const deprecationNotice = [
        "⚠️ DEPRECATED",
        tool.deprecatedSince ? `(since ${tool.deprecatedSince})` : "",
        tool.replacedBy ? `- Use ${tool.replacedBy} instead.` : "",
        tool.deprecationMessage || "",
    ]
        .filter(Boolean)
        .join(" ");

    return {
        ...tool,
        description: `${deprecationNotice} ${tool.description}`,
    };
}

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export interface MarketTickerResponse {
    base_symbol: string;
    quote_symbol: string;
    date: string;
    price: string;
    market_cap: string;
    volume_24h: string;
    max_supply?: string;
    total_supply?: string;
}

export interface MarketAssetResponse {
    symbol: string;
    name: string;
    type: "crypto" | "fiat";
    network?: string;
    enabled: boolean;
    tradeable: boolean;
    loanable: boolean;
    pro_trading_pairs: string[];
}

export interface ProMarketConfigResponse {
    id: string;
    pair: string;
    base_precision: string;
    quote_precision: string;
    min_amount: string;
    max_amount: string;
    min_price: string;
    max_price: string;
    min_order_size: string;
    tick_size: string;
    fee_maker: string;
    fee_taker: string;
    status: "active" | "inactive";
}

export interface OrderBookEntry {
    price: string;
    amount: string;
}

export interface MarketOrderBookResponse {
    pair: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    date: string;
}

export interface ProTickerResponse {
    symbol: string;
    open: string;
    close: string;
    bid: string;
    ask: string;
    high: string;
    low: string;
    baseVolume: string;
    percentage: string;
    quoteVolume: string;
    date: string;
}

export interface PublicTradeResponse {
    id: string;
    pair: string;
    price: string;
    amount: string;
    side: "buy" | "sell";
    date: string;
}

export interface CandleResponse {
    date: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface ChartDataPoint {
    date: string;
    price: string;
    quote_symbol: string;
}

export interface CurrencyRateResponse {
    base_symbol: string;
    price: string;
    quote_symbol: string;
    date: string;
}

// ============================================================================
// WALLET TOOLS
// ============================================================================

export interface WalletPocketResponse {
    id: string;
    symbol: string;
    balance: string;
    available: string;
    name?: string;
}

export interface WalletMovementResponse {
    id: string;
    created_at: string;
    type: string;
    subtype?: string;
    status: "pending" | "completed" | "failed";
    amount: string;
    symbol: string;
    origin?: {
        amount: string;
        symbol: string;
        class: string;
    };
    destination?: {
        amount: string;
        symbol: string;
        class: string;
    };
    fee?: {
        amount: string;
        symbol: string;
        class: string;
    };
}

export interface WalletAddressResponse {
    id: string;
    address: string;
    network: string;
    symbol?: string;
    tag: string;
    created_at: string;
}

export interface WalletNetworkResponse {
    id: string;
    name: string;
    native_symbol: string;
    fee_symbol: string;
    has_tag: boolean;
}

export interface WalletCardResponse {
    card_id: string;
    type: string;
    brand: string;
    country: string;
    last4: string;
    expire_month: string;
    expire_year: string;
    alias: string;
    created_at: string;
}

// ============================================================================
// EARN TOOLS
// ============================================================================

/**
 * Earn summary item - one per currency
 * API: GET /v1/earn/summary returns array of these
 */
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
    lock_period?: {
        lock_period_id: string;
        months: number;
    };
    converted_balance?: {
        value: string;
        symbol: string;
        created_at?: string;
    };
    created_at?: string;
    updated_at?: string;
    // Keep id and wallet_id for backward compatibility
    id?: string;
    wallet_id?: string;
    total_balance?: string; // v2/earn/wallets has totalBalance
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

// ============================================================================
// LOAN TOOLS
// ============================================================================

export interface LoanOrderResponse {
    id: string;
    status: "active" | "completed" | "expired";
    // Guarantee (collateral)
    guarantee_symbol: string;
    guarantee_amount: string;
    guarantee_amount_fiat: string;
    // Loan
    loan_symbol: string;
    loan_amount: string;
    loan_original_amount: string;
    loan_amount_fiat: string;
    // Interest & Risk
    ltv: string;
    apr: string;
    interest_amount: string;
    // Payback tracking
    remaining_amount: string;
    payback_amount: string;
    // Dates
    created_at: string;
    started_at: string;
    expires_at: string;
}

/**
 * Loan simulation response.
 * LTV (Loan-to-Value) is a ratio where 1.0 = 100%.
 * Example: "0.75" means 75% LTV.
 */
export interface LoanSimulationResponse {
    guarantee_symbol: string;
    guarantee_amount: string;
    guarantee_amount_converted: string;
    loan_symbol: string;
    loan_amount: string;
    loan_amount_converted: string;
    user_symbol: string;
    /** LTV ratio as string (1.0 = 100%) */
    ltv: string;
    /** APR as string (e.g., "13.12" means 13.12%) */
    apr: string;
}

export interface GuaranteeCurrencyConfig {
    symbol: string;
    enabled: boolean;
    liquidation_ltv: string;
    initial_ltv: string;
    created_at: string;
    updated_at: string;
}

export interface LoanCurrencyConfig {
    symbol: string;
    enabled: boolean;
    liquidity: string;
    liquidity_status: string;
    apr: string;
    minimum_amount: string;
    maximum_amount: string;
    created_at: string;
    updated_at: string;
}

export interface LoanConfigResponse {
    guarantee_currencies: GuaranteeCurrencyConfig[];
    loan_currencies: LoanCurrencyConfig[];
}

// ============================================================================
// PRO TRADING TOOLS
// ============================================================================

export interface ProBalanceResponse {
    symbol: string;
    balance: string;
    blocked: string;
    available: string;
}

export interface ProOrderResponse {
    id: string;
    pair: string;
    side: "buy" | "sell";
    type: "limit" | "market" | "stop-limit";
    status: "open" | "filled" | "cancelled";
    price?: string;
    amount: string;
    filled: string;
    remaining: string;
    created_at: string;
}

export interface ProTradeResponse {
    id: string;
    order_id: string;
    pair: string;
    side: "buy" | "sell";
    order_type: "limit" | "market" | "stop-limit";
    price: string;
    amount: string;
    cost: string;
    fee: string;
    fee_symbol: string;
    is_maker: boolean;
    date: string;
}

// ============================================================================
// ACCOUNT TOOLS
// ============================================================================

export interface AccountInfoResponse {
    user_id: string;
    email: string;
    level: string;
    kyc_status: string;
    created_at: string;
    features: {
        trading: boolean;
        earn: boolean;
        loans: boolean;
    };
}

// ============================================================================
// AGGREGATION TOOLS
// ============================================================================

export interface PortfolioAssetDetail {
    asset: string;
    amount: string;
    price_unit: string;
    value_fiat: string;
}

export interface PortfolioValuationResponse {
    quote_symbol: string;
    total_balance: string;
    details: PortfolioAssetDetail[];
}

// ============================================================================
// OPERATION TOOLS (Responses for write operations)
// ============================================================================

export interface ProformaResponse {
    proforma_id: string;
    origin_amount: string;
    origin_symbol: string;
    destination_amount: string;
    destination_symbol: string;
    rate: string;
    fee: string;
    expires_at: string;
}

export interface OperationConfirmationResponse {
    id: string;
    status: string;
}

export interface OrderCreationResponse {
    order_id: string;
    status: string;
    message: string;
}

// ============================================================================
// ADDITIONAL WALLET TOOL RESPONSES
// ============================================================================

export interface WalletPocketDetailsResponse {
    id: string;
    symbol: string;
    balance: string;
    available: string;
    blocked: string;
    name?: string;
    created_at: string;
}

export interface WalletAddressDetailsResponse {
    address: string;
    network: string;
    symbol: string;
    tag?: string;
    created_at: string;
}

export interface WalletMovementDetailsResponse {
    id: string;
    created_at: string;
    type: "deposit" | "withdrawal" | "swap" | "purchase" | "transfer" | "fee" | "other";
    subtype?: string;
    status: "pending" | "completed" | "failed";
    amount: string;
    symbol: string;
    origin?: {
        amount: string;
        symbol: string;
        class: string;
        rate_applied?: string;
    };
    destination?: {
        amount: string;
        symbol: string;
        class: string;
    };
    fee?: {
        amount: string;
        symbol: string;
        class: string;
    };
}

// ============================================================================
// ADDITIONAL EARN TOOL RESPONSES
// ============================================================================

export interface EarnPositionDetailsResponse {
    position_id: string;
    symbol: string;
    balance: string;
    strategy: string;
    lock_period?: {
        lock_period_id: string;
        months: number;
    };
    converted_balance?: {
        value: string;
        symbol: string;
        created_at?: string;
    };
    created_at?: string;
    updated_at?: string;
    // Keep id and wallet_id for backward compatibility
    id?: string;
    wallet_id?: string;
    total_balance?: string;
}

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

// ============================================================================
// ADDITIONAL LOAN TOOL RESPONSES
// ============================================================================

/**
 * Nested amount object for loan movements
 */
export interface LoanMovementAmount {
    amount: string;
    symbol: string;
    amount_fiat: string;
}

export interface LoanMovementResponse {
    id: string;
    order_id: string;
    type: "approve" | "repay" | "liquidate" | "interest";
    status: "pending" | "completed" | "failed";
    // Nested objects for cleaner structure
    loan: LoanMovementAmount;
    guarantee: LoanMovementAmount;
    // LTV tracking (as decimal, e.g., "0.50" = 50%)
    ltv: string;
    previous_ltv: string;
    // Date
    created_at: string;
}

export interface LoanOrderDetailsResponse {
    id: string;
    status: "active" | "completed" | "expired";
    guarantee_symbol: string;
    guarantee_amount: string;
    loan_symbol: string;
    loan_amount: string;
    remaining_amount: string;
    ltv: string;
    apr: string;
    liquidation_price: string;
    created_at: string;
    expires_at: string;
    apr_details?: {
        base_apr: string;
        final_apr: string;
        user_discount: string;
        total_discount: string;
    };
}

// ============================================================================
// ADDITIONAL PRO TRADING TOOL RESPONSES
// ============================================================================

export interface ProOpenOrdersResponse {
    orders: ProOrderResponse[];
}

export interface ProTradesResponse {
    trades: ProTradeResponse[];
}

export interface ProOrderTradesResponse {
    order_id: string;
    trades: ProTradeResponse[];
}

// ============================================================================
// OPERATION TOOL RESPONSES (Extended)
// ============================================================================

export interface ProCancelOrderResponse {
    id: string;
    status: string;
    message: string;
}

export interface ProCancelAllOrdersResponse {
    cancelled: number;
    message: string;
}

export interface ProDepositResponse {
    id: string;
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}

export interface ProWithdrawResponse {
    id: string;
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}

export interface EarnOperationResponse {
    id: string;
    type: "deposit" | "withdrawal";
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}

export interface LoanCreateResponse {
    id: string;
    guarantee_symbol: string;
    guarantee_amount: string;
    loan_symbol: string;
    loan_amount: string;
    ltv: string;
    apr: string;
    status: string;
    created_at: string;
}

export interface LoanIncreaseGuaranteeResponse {
    id: string;
    new_guarantee_amount: string;
    new_ltv: string;
    status: string;
    message: string;
}

export interface LoanPaybackResponse {
    id: string;
    payback_amount: string;
    remaining_amount: string;
    status: string;
    message: string;
}
