/**
 * Interfaces for Tool Arguments
 * Provides type safety for tool handlers instead of using 'any'
 */

// ============================================================================
// MARKET TOOLS ARGS
// ============================================================================

export interface MarketTickerArgs {
    base_symbol: string;
    quote_symbol?: string;
}

export interface MarketChartArgs {
    pair: string;
    timeframe: string;
}

export interface MarketAssetsDetailsArgs {
    symbol?: string;
    include_testnet?: boolean;
    show_exchange?: boolean;
}

export interface MarketCurrencyRateArgs {
    base_symbol?: string;
    quote_symbol?: string;
    date?: string;
}

// ============================================================================
// WALLET TOOLS ARGS
// ============================================================================

export interface WalletGetPocketsArgs {
    symbol?: string;
}

export interface WalletPocketDetailsArgs {
    pocket_id: string;
}

export interface WalletPocketAddressesArgs {
    pocket_id: string;
    network: string;
}

export interface WalletNetworksArgs {
    symbol: string;
}

export interface WalletCardsArgs {
    card_id?: string;
    limit?: number;
    offset?: number;
}

export interface WalletMovementsArgs {
    symbol?: string;
    limit?: number;
    offset?: number;
}

export interface WalletMovementDetailsArgs {
    movement_id: string;
}

export interface WalletBuyCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletSellCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletSwapCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletBuyCryptoWithCardArgs {
    card_id: string;
    destination_pocket_id: string;
    amount: string;
    currency: string;
}

export interface WalletConfirmOperationArgs {
    proforma_id: string;
}

// ============================================================================
// EARN TOOLS ARGS
// ============================================================================

export interface EarnWalletDetailsArgs {
    wallet_id: string;
}

/** Args for earn_get_movements - all movements across all wallets */
export interface EarnMovementsArgs {
    user_symbol?: string;
    symbol?: string;
    related_symbol?: string;
    wallet_id?: string;
    from?: string;
    to?: string;
    type?: "deposit" | "reward" | "withdrawal" | "discount-funds" | "discount-rewards";
    limit?: number;
    offset?: number;
    sort_by?: "createdAt";
}

/** Args for earn_get_wallet_movements - movements for a specific wallet */
export interface EarnWalletMovementsArgs {
    wallet_id: string;
    limit?: number;
    offset?: number;
}

export interface EarnMovementsSummaryArgs {
    type: string;
}

export interface EarnDepositArgs {
    pocket_id: string;
    symbol: string;
    amount: string;
}

export interface EarnWithdrawArgs {
    pocket_id: string;
    symbol: string;
    amount: string;
}

export interface EarnWalletRewardsConfigArgs {
    wallet_id: string;
}

export interface EarnWalletRewardsSummaryArgs {
    wallet_id: string;
    user_currency?: string;
}

export interface EarnAPYArgs {
    symbol?: string;
}

// ============================================================================
// LOAN TOOLS ARGS
// ============================================================================

export interface LoanSimulationArgs {
    guarantee_symbol: string;
    loan_symbol: string;
    user_symbol: string;
    guarantee_amount?: string;
    loan_amount?: string;
}

export interface LoanMovementsArgs {
    order_id?: string;
    limit?: number;
    offset?: number;
}

export interface LoanOrdersArgs {
    limit?: number;
    offset?: number;
}

export interface LoanOrderDetailsArgs {
    order_id: string;
}

export interface LoanCreateArgs {
    guarantee_symbol: string;
    guarantee_amount: string;
    loan_symbol: string;
    loan_amount: string;
}

export interface LoanIncreaseGuaranteeArgs {
    order_id: string;
    guarantee_amount: string;
}

export interface LoanPaybackArgs {
    order_id: string;
    payback_amount: string;
}

// ============================================================================
// PRO TOOLS ARGS
// ============================================================================

export interface ProTradesArgs {
    pair?: string;
    side?: "buy" | "sell";
    order_type?: "limit" | "stop-limit" | "market";
    limit?: number;
    offset?: number;
    sort?: "ASC" | "DESC";
    start_time?: string;
    end_time?: string;
}

export interface ProOrderTradesArgs {
    order_id: string;
}

export interface ProOrderDetailsArgs {
    order_id: string;
}

export interface ProOpenOrdersArgs {
    pair?: string;
}

export interface ProCreateOrderArgs {
    pair: string;
    side: "buy" | "sell";
    type: "limit" | "market" | "stop-limit";
    amount: string;
    price?: string;
    stop_price?: string;
}

export interface ProCancelOrderArgs {
    order_id: string;
}

export interface ProCancelAllOrdersArgs {
    pair?: string;
}

export interface ProDepositArgs {
    symbol: string;
    amount: string;
}

export interface ProWithdrawArgs {
    symbol: string;
    amount: string;
    to_pocket_id?: string;
}

export interface ProMarketConfigArgs {
    pair?: string;
}

export interface ProOrderBookArgs {
    pair: string;
}

export interface ProPublicTradesArgs {
    pair: string;
    limit?: number;
    sort?: "ASC" | "DESC";
}

export interface ProCandlesArgs {
    pair: string;
    timeframe: string;
    limit?: number;
}

// ============================================================================
// AGGREGATION TOOLS ARGS
// ============================================================================

export interface PortfolioValuationArgs {
    quote_symbol?: string;
}
