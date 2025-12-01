/**
 * Optimized response schemas for Bit2Me MCP tools
 * These schemas are designed to be LLM-friendly: concise, flat, and descriptive
 */

// ============================================================================
// MARKET TOOLS
// ============================================================================

export interface MarketTickerResponse {
    time: number;
    price: string;
    market_cap: string;
    volume_24h: string;
    max_supply?: string;
    total_supply?: string;
}

export interface MarketAssetResponse {
    symbol: string;
    name: string;
    asset_type: string;
    network?: string;
    enabled: boolean;
    tradeable: boolean;
    loanable: boolean;
    pairs_with: string[];
}

export interface MarketConfigResponse {
    symbol: string;
    base_precision: number;
    quote_precision: number;
    min_amount: string;
    max_amount: string;
    status: string;
}

export interface OrderBookEntry {
    price: string;
    amount: string;
}

export interface MarketOrderBookResponse {
    symbol: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    timestamp: number;
}

export interface PublicTradeResponse {
    id: string;
    symbol: string;
    price: string;
    amount: string;
    side: "buy" | "sell";
    timestamp: number;
}

export interface CandleResponse {
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface ChartDataPoint {
    timestamp: number;
    date: string;
    price_usd: number;
    price_fiat: number;
    currency: string;
}

export interface CurrencyRateResponse {
    symbol: string;
    rate: string;
    currency: string;
    timestamp?: number;
}

// ============================================================================
// WALLET TOOLS
// ============================================================================

export interface WalletPocketResponse {
    id: string;
    currency: string;
    balance: string;
    available: string;
    name?: string;
}

export interface WalletTransactionResponse {
    id: string;
    date: string;
    type: string;
    subtype?: string;
    status: string;
    amount: string;
    currency: string;
    origin?: {
        amount: string;
        currency: string;
        class: string;
    };
    destination?: {
        amount: string;
        currency: string;
        class: string;
    };
    fee?: {
        amount: string;
        currency: string;
    };
}

export interface WalletAddressResponse {
    id: string;
    address: string;
    network: string;
    currency?: string;
    tag: string;
    created_at: string;
}

export interface WalletNetworkResponse {
    id: string;
    name: string;
    native_currency_code: string;
    fee_currency_code: string;
    has_tag: boolean;
}

// ============================================================================
// EARN TOOLS
// ============================================================================

export interface EarnSummaryResponse {
    currency: string;
    total_balance: string;
    rewards_earned: string;
}

export interface EarnWalletResponse {
    id: string;
    currency: string;
    balance: string;
    strategy: string;
    apy: string;
    status: string;
}

export interface EarnAPYResponse {
    currency: string;
    daily: number;
    weekly: number;
    monthly: number;
}

export interface EarnTransactionResponse {
    id: string;
    type: "deposit" | "withdrawal" | "reward";
    currency: string;
    amount: string;
    date: string;
    status: string;
    message?: string;
}

// ============================================================================
// LOAN TOOLS
// ============================================================================

export interface LoanOrderResponse {
    order_id: string;
    status: "active" | "completed" | "expired";
    guarantee_currency: string;
    guarantee_amount: string;
    loan_currency: string;
    loan_amount: string;
    remaining_amount: string;
    ltv: string;
    apr: string;
    liquidation_price: string;
    created_at: string;
    expires_at: string;
}

export interface LoanLTVResponse {
    ltv: string;
    max_loan_amount: string;
    liquidation_price: string;
    health_factor: string;
}

export interface LoanConfigResponse {
    currency: string;
    min_guarantee: string;
    max_ltv: string;
    apr: string;
    available_as_guarantee: boolean;
    available_as_loan: boolean;
}

// ============================================================================
// PRO TRADING TOOLS
// ============================================================================

export interface ProBalanceResponse {
    currency: string;
    balance: number;
    blocked_balance: number;
    available: number;
}

export interface ProOrderResponse {
    id: string;
    symbol: string;
    side: "buy" | "sell";
    type: "limit" | "market" | "stop-limit";
    status: string;
    price?: string;
    amount: string;
    filled: string;
    remaining: string;
    created_at: string;
}

export interface ProTradeResponse {
    id: string;
    order_id: string;
    symbol: string;
    side: "buy" | "sell";
    price: string;
    amount: string;
    fee: string;
    timestamp: number;
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
    amount: number;
    price_unit: number;
    value_fiat: number;
}

export interface PortfolioValuationResponse {
    currency: string;
    total_value: number;
    details: PortfolioAssetDetail[];
}

// ============================================================================
// OPERATION TOOLS (Responses for write operations)
// ============================================================================

export interface ProformaResponse {
    proforma_id: string;
    origin_amount: string;
    origin_currency: string;
    destination_amount: string;
    destination_currency: string;
    rate: string;
    fee: string;
    expires_at: string;
}

export interface TransactionConfirmationResponse {
    transaction_id: string;
    status: string;
    message: string;
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
    currency: string;
    balance: string;
    available: string;
    blocked: string;
    name?: string;
    created_at: string;
}

export interface WalletAddressDetailsResponse {
    address: string;
    network: string;
    currency: string;
    tag?: string;
    created_at: string;
}

export interface WalletTransactionDetailsResponse {
    id: string;
    date: string;
    type: string;
    subtype?: string;
    status: string;
    amount: string;
    currency: string;
    origin?: {
        amount: string;
        currency: string;
        class: string;
        rate_applied?: string;
    };
    destination?: {
        amount: string;
        currency: string;
        class: string;
    };
    fee?: {
        amount: string;
        currency: string;
    };
}

// ============================================================================
// ADDITIONAL EARN TOOL RESPONSES
// ============================================================================

export interface EarnWalletDetailsResponse {
    id: string;
    currency: string;
    balance: string;
    strategy: string;
    apy: string;
    status: string;
    created_at: string;
}

export interface EarnTransactionsSummaryResponse {
    type: string;
    total_amount: string;
    total_count: number;
    currency: string;
}

export interface EarnAssetsResponse {
    assets: string[];
}

export interface EarnRewardsConfigResponse {
    distribution_frequency: string;
    minimum_balance: string;
    compounding: boolean;
}

export interface EarnWalletRewardsConfigResponse {
    wallet_id: string;
    currency: string;
    distribution_frequency: string;
    next_distribution: string;
}

export interface EarnWalletRewardsSummaryResponse {
    wallet_id: string;
    currency: string;
    total_rewards: string;
    last_reward: string;
    last_reward_date: string;
}

// ============================================================================
// ADDITIONAL LOAN TOOL RESPONSES
// ============================================================================

export interface LoanTransactionResponse {
    id: string;
    order_id: string;
    type: string;
    amount: string;
    currency: string;
    date: string;
    status: string;
}

export interface LoanOrderDetailsResponse {
    order_id: string;
    status: "active" | "completed" | "expired";
    guarantee_currency: string;
    guarantee_amount: string;
    loan_currency: string;
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

export interface ProTransactionsResponse {
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
    order_id: string;
    status: string;
    message: string;
}

export interface ProCancelAllOrdersResponse {
    cancelled: number;
    message: string;
}

export interface ProDepositResponse {
    transaction_id: string;
    currency: string;
    amount: string;
    status: string;
    message: string;
}

export interface ProWithdrawResponse {
    transaction_id: string;
    currency: string;
    amount: string;
    status: string;
    message: string;
}

export interface EarnCreateTransactionResponse {
    transaction_id: string;
    type: "deposit" | "withdrawal";
    currency: string;
    amount: string;
    status: string;
    message: string;
}

export interface LoanCreateResponse {
    order_id: string;
    guarantee_currency: string;
    guarantee_amount: string;
    loan_currency: string;
    loan_amount: string;
    ltv: string;
    apr: string;
    status: string;
    created_at: string;
}

export interface LoanIncreaseGuaranteeResponse {
    order_id: string;
    new_guarantee_amount: string;
    new_ltv: string;
    status: string;
    message: string;
}

export interface LoanPaybackResponse {
    order_id: string;
    payback_amount: string;
    remaining_amount: string;
    status: string;
    message: string;
}
