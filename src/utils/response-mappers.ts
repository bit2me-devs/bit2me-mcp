/**
 * Response mapping utilities with type guards
 * Maps raw API responses to optimized schemas with validation
 */

import { ValidationError } from './errors.js';
import type {
    // Market
    MarketTickerResponse,
    MarketAssetResponse,
    MarketConfigResponse,
    MarketOrderBookResponse,
    PublicTradeResponse,
    CandleResponse,
    // Wallet
    WalletAddressResponse,
    WalletTransactionDetailsResponse,
    WalletPocketResponse,
    WalletTransactionResponse,
    // Account
    AccountInfoResponse,
    // Earn
    EarnSummaryResponse,
    EarnAPYResponse,
    EarnWalletResponse,
    EarnTransactionResponse,
    EarnWalletDetailsResponse,
    EarnTransactionsSummaryResponse,
    EarnAssetsResponse,
    EarnRewardsConfigResponse,
    EarnWalletRewardsConfigResponse,
    EarnWalletRewardsSummaryResponse,
    // Loan
    LoanOrderResponse,
    LoanTransactionResponse,
    LoanConfigResponse,
    LoanLTVResponse,
    LoanOrderDetailsResponse,
    // Pro
    ProBalanceResponse,
    ProOrderResponse,
    ProOpenOrdersResponse,
    ProOrderTradesResponse,
    ProTradeResponse,
    // Operations
    ProformaResponse,
    TransactionConfirmationResponse,
    EarnCreateTransactionResponse,
    ProDepositResponse,
    ProWithdrawResponse,
    ProCancelOrderResponse,
    ProCancelAllOrdersResponse,
    LoanCreateResponse,
    LoanIncreaseGuaranteeResponse,
    LoanPaybackResponse,
} from "../types/schemas.js";

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isValidTickerResponse(data: unknown): data is any {
    return typeof data === 'object' &&
        data !== null &&
        'price' in data &&
        'time' in data;
}

function isValidAssetRecord(data: unknown): data is Record<string, any> {
    return typeof data === 'object' && data !== null;
}

function isValidArray(data: unknown): data is any[] {
    return Array.isArray(data);
}

function isValidObject(data: unknown): data is Record<string, any> {
    return typeof data === 'object' && data !== null && !Array.isArray(data);
}

// ============================================================================
// MARKET MAPPERS
// ============================================================================

/**
 * Maps raw ticker response to optimized schema
 */
export function mapTickerResponse(raw: unknown): MarketTickerResponse {
    if (!isValidTickerResponse(raw)) {
        throw new ValidationError('Invalid ticker response structure');
    }
    return {
        time: raw.time,
        price: raw.price,
        market_cap: raw.marketCap,
        volume_24h: raw.totalVolume,
        max_supply: raw.maxSupply,
        total_supply: raw.totalSupply,
    };
}

/**
 * Maps raw asset object (keyed by symbol) to array of assets
 */
export function mapAssetsResponse(raw: unknown): MarketAssetResponse[] {
    if (!isValidAssetRecord(raw)) {
        throw new ValidationError('Invalid assets response structure');
    }
    return Object.entries(raw).map(([symbol, asset]) => ({
        symbol,
        name: asset.name,
        asset_type: asset.assetType,
        network: asset.network,
        enabled: asset.enabled,
        tradeable: asset.ticker || false,
        loanable: asset.loanable || false,
        pairs_with: asset.pairsWith || [],
    }));
}

/**
 * Maps raw market config response to optimized schema
 */
export function mapMarketConfigResponse(raw: unknown): MarketConfigResponse[] {
    if (!isValidObject(raw)) {
        return [];
    }

    return Object.entries(raw).map(([symbol, config]: [string, any]) => ({
        symbol,
        base_precision: config.basePrecision || 0,
        quote_precision: config.quotePrecision || 0,
        min_amount: config.minAmount || "0",
        max_amount: config.maxAmount || "0",
        status: config.status || "unknown",
    }));
}

/**
 * Maps raw order book response to optimized schema
 */
export function mapOrderBookResponse(raw: unknown): MarketOrderBookResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid order book response structure');
    }

    return {
        symbol: raw.symbol || "",
        bids: (raw.bids || []).map((bid: any) => ({
            price: bid.price || bid[0] || "0",
            amount: bid.amount || bid[1] || "0",
        })),
        asks: (raw.asks || []).map((ask: any) => ({
            price: ask.price || ask[0] || "0",
            amount: ask.amount || ask[1] || "0",
        })),
        timestamp: raw.timestamp || Date.now(),
    };
}

/**
 * Maps raw public trades response to optimized schema
 */
export function mapPublicTradesResponse(raw: unknown): PublicTradeResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((trade) => ({
        id: trade.id || trade.tradeId || "",
        symbol: trade.symbol || "",
        price: trade.price || "0",
        amount: trade.amount || trade.quantity || "0",
        side: trade.side || trade.takerSide || "buy",
        timestamp: trade.timestamp || trade.time || Date.now(),
    }));
}

/**
 * Maps raw candles response to optimized schema
 */
export function mapCandlesResponse(raw: unknown): CandleResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((candle) => ({
        timestamp: candle.timestamp || candle[0] || Date.now(),
        open: candle.open || candle[1] || "0",
        high: candle.high || candle[2] || "0",
        low: candle.low || candle[3] || "0",
        close: candle.close || candle[4] || "0",
        volume: candle.volume || candle[5] || "0",
    }));
}

// ============================================================================
// WALLET MAPPERS
// ============================================================================

/**
 * Maps raw wallet pockets response to optimized schema
 */
export function mapWalletPocketsResponse(raw: unknown): WalletPocketResponse[] {
    if (!isValidArray(raw)) {
        throw new ValidationError('Invalid wallet pockets response structure');
    }

    return raw.map((p: any) => ({
        id: p.id,
        currency: p.currency,
        balance: p.balance,
        available: p.available,
        name: p.name
    }));
}

/**
 * Maps raw wallet addresses response to optimized schema
 */
export function mapWalletAddressesResponse(raw: unknown): WalletAddressResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((addr) => ({
        address: addr.address || "",
        network: addr.network || "",
        currency: addr.currency || "",
        tag: addr.tag || addr.memo || undefined,
    }));
}

/**
 * Maps raw wallet transactions response to optimized schema
 */
export function mapWalletTransactionsResponse(raw: unknown): WalletTransactionResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((tx: any, index: number) => {
        const originRate = tx.origin?.rate?.rate?.value || tx.origin?.rate?.value;

        return {
            id: tx.id || `tx_${index}`,
            date: tx.date,
            type: tx.type,
            subtype: tx.subtype,
            status: tx.status,
            amount: tx.denomination?.amount || "0",
            currency: tx.denomination?.currency || "",
            origin: tx.origin ? {
                amount: tx.origin.amount,
                currency: tx.origin.currency,
                class: tx.origin.class,
            } : undefined,
            destination: tx.destination ? {
                amount: tx.destination.amount,
                currency: tx.destination.currency,
                class: tx.destination.class,
            } : undefined,
            fee: tx.fee ? {
                amount: tx.fee.mercantile?.amount || tx.fee.network?.amount || "0",
                currency: tx.fee.mercantile?.currency || tx.fee.network?.currency || "",
            } : undefined,
        };
    });
}

/**
 * Maps raw wallet transaction details to optimized schema
 */
export function mapWalletTransactionDetailsResponse(raw: unknown): WalletTransactionDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid transaction details response structure');
    }

    const originRate = raw.origin?.rate?.rate?.value || raw.origin?.rate?.value;

    return {
        id: raw.id,
        date: raw.date,
        type: raw.type,
        subtype: raw.subtype,
        status: raw.status,
        amount: raw.denomination?.amount || "0",
        currency: raw.denomination?.currency || "",
        origin: raw.origin ? {
            amount: raw.origin.amount,
            currency: raw.origin.currency,
            class: raw.origin.class,
            rate_applied: originRate,
        } : undefined,
        destination: raw.destination ? {
            amount: raw.destination.amount,
            currency: raw.destination.currency,
            class: raw.destination.class,
        } : undefined,
        fee: raw.fee ? {
            amount: raw.fee.mercantile?.amount || raw.fee.network?.amount || "0",
            currency: raw.fee.mercantile?.currency || raw.fee.network?.currency || "",
        } : undefined,
    };
}

/**
 * Maps raw proforma response to optimized schema
 */
export function mapProformaResponse(raw: unknown): ProformaResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid proforma response structure');
    }

    return {
        proforma_id: raw.id || raw.proformaId || "",
        origin_amount: raw.origin?.amount || raw.originAmount || "0",
        origin_currency: raw.origin?.currency || raw.originCurrency || "",
        destination_amount: raw.destination?.amount || raw.destinationAmount || "0",
        destination_currency: raw.destination?.currency || raw.destinationCurrency || "",
        rate: raw.rate || raw.exchangeRate || "0",
        fee: raw.fee?.amount || raw.feeAmount || "0",
        expires_at: raw.expiresAt || raw.validUntil || "",
    };
}

// ============================================================================
// EARN MAPPERS
// ============================================================================

/**
 * Maps raw earn summary to optimized schema
 */
export function mapEarnSummaryResponse(raw: unknown): EarnSummaryResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item) => ({
        currency: item.currency,
        total_balance: item.totalBalance,
        rewards_earned: item.rewardsEarned || "0",
        apy: item.apy || "0",
    }));
}

/**
 * Maps raw earn APY response to optimized schema
 */
export function mapEarnAPYResponse(raw: unknown): Record<string, EarnAPYResponse> {
    if (!isValidObject(raw)) {
        return {};
    }

    const result: Record<string, EarnAPYResponse> = {};

    for (const [currency, rates] of Object.entries(raw)) {
        result[currency] = {
            currency,
            daily: rates.daily,
            weekly: rates.weekly,
            monthly: rates.monthly,
        };
    }

    return result;
}

/**
 * Maps raw earn wallets response to optimized schema
 */
export function mapEarnWalletsResponse(raw: unknown): EarnWalletResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((wallet: any) => ({
        id: wallet.id || wallet.walletId || "",
        currency: wallet.currency || "",
        balance: wallet.totalBalance || wallet.balance || "0",
        strategy: wallet.strategy || wallet.type || "flexible",
        apy: wallet.apy || wallet.currentApy || "0",
        status: wallet.status || "active",
    }));
}

/**
 * Maps raw earn transactions response to optimized schema
 */
export function mapEarnTransactionsResponse(raw: unknown): EarnTransactionResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((tx: any) => ({
        id: tx.id || tx.transactionId || "",
        type: tx.type || "deposit",
        currency: tx.currency || "",
        amount: tx.amount || "0",
        date: tx.date || tx.createdAt || "",
        status: tx.status || "completed",
    }));
}

// ============================================================================
// LOAN MAPPERS
// ============================================================================

/**
 * Maps raw loan orders response to optimized schema
 */
export function mapLoanOrdersResponse(raw: unknown): LoanOrderResponse[] {
    if (!isValidObject(raw) || !Array.isArray((raw as any).data)) {
        return [];
    }

    return (raw as any).data.map((loan: any) => ({
        order_id: loan.orderId,
        status: loan.status,
        guarantee_currency: loan.guaranteeCurrency,
        guarantee_amount: loan.guaranteeAmount,
        loan_currency: loan.loanCurrency,
        loan_amount: loan.loanAmount,
        remaining_amount: loan.remainingAmount,
        ltv: loan.ltv,
        apr: loan.apr,
        liquidation_price: loan.liquidationPriceReference,
        created_at: loan.createdAt,
        expires_at: loan.expiresAt,
    }));
}

/**
 * Maps raw loan transactions response to optimized schema
 */
export function mapLoanTransactionsResponse(raw: unknown): LoanTransactionResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((tx: any) => ({
        id: tx.id || tx.transactionId || "",
        order_id: tx.orderId || "",
        type: tx.type || "",
        amount: tx.amount || "0",
        currency: tx.currency || "",
        date: tx.date || tx.createdAt || "",
        status: tx.status || "completed",
    }));
}

// ============================================================================
// PRO TRADING MAPPERS
// ============================================================================

/**
 * Maps raw Pro balance array to optimized schema, filtering zero balances
 */
export function mapProBalanceResponse(raw: unknown): ProBalanceResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw
        .filter((b: any) => b.balance > 0 || b.blockedBalance > 0)
        .map((b: any) => ({
            currency: b.currency,
            balance: b.balance,
            blocked_balance: b.blockedBalance,
            available: b.balance - b.blockedBalance,
        }));
}

/**
 * Maps raw Pro order response to optimized schema
 */
export function mapProOrderResponse(raw: unknown): ProOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid Pro order response structure');
    }

    return {
        id: raw.id || raw.orderId || "",
        symbol: raw.symbol || "",
        side: raw.side || "buy",
        type: raw.type || raw.orderType || "limit",
        status: raw.status || "pending",
        price: raw.price,
        amount: raw.amount || "0",
        filled: raw.filled || raw.filledAmount || "0",
        remaining: raw.remaining || raw.remainingAmount || "0",
        created_at: raw.createdAt || raw.created_at || "",
    };
}

// ============================================================================
// ACCOUNT MAPPERS
// ============================================================================

/**
 * Maps raw account info response to optimized schema
 */
export function mapAccountInfoResponse(raw: unknown): AccountInfoResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid account info response structure');
    }

    return {
        user_id: raw.userId || raw.id || "",
        email: raw.email || "",
        level: raw.level || raw.userLevel || "",
        kyc_status: raw.kycStatus || raw.kyc || "unknown",
        created_at: raw.createdAt || raw.created_at || "",
        features: {
            trading: raw.features?.trading ?? true,
            earn: raw.features?.earn ?? true,
            loans: raw.features?.loans ?? true,
        },
    };
}

// ============================================================================
// ADDITIONAL EARN MAPPERS
// ============================================================================

/**
 * Maps raw earn wallet details to optimized schema
 */
export function mapEarnWalletDetailsResponse(raw: unknown): EarnWalletDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn wallet details response structure');
    }

    return {
        id: raw.id || raw.walletId || "",
        currency: raw.currency || "",
        balance: raw.totalBalance || raw.balance || "0",
        strategy: raw.strategy || raw.type || "flexible",
        apy: raw.apy || raw.currentApy || "0",
        status: raw.status || "active",
        created_at: raw.createdAt || raw.created_at || "",
    };
}

/**
 * Maps raw earn transactions summary to optimized schema
 */
export function mapEarnTransactionsSummaryResponse(raw: unknown): EarnTransactionsSummaryResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn transactions summary response structure');
    }

    return {
        type: raw.type || "",
        total_amount: raw.totalAmount || raw.total || "0",
        total_count: raw.totalCount || raw.count || 0,
        currency: raw.currency || "",
    };
}

/**
 * Maps raw earn assets response to optimized schema
 */
export function mapEarnAssetsResponse(raw: unknown): EarnAssetsResponse {
    if (!isValidObject(raw)) {
        return { assets: [] };
    }

    const assets = raw.assets || raw.currencies || [];
    return {
        assets: Array.isArray(assets) ? assets : [],
    };
}

/**
 * Maps raw earn rewards config to optimized schema
 */
export function mapEarnRewardsConfigResponse(raw: unknown): EarnRewardsConfigResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn rewards config response structure');
    }

    return {
        distribution_frequency: raw.distributionFrequency || raw.frequency || "daily",
        minimum_balance: raw.minimumBalance || raw.minBalance || "0",
        compounding: raw.compounding ?? true,
    };
}

/**
 * Maps raw earn wallet rewards config to optimized schema
 */
export function mapEarnWalletRewardsConfigResponse(raw: unknown): EarnWalletRewardsConfigResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn wallet rewards config response structure');
    }

    return {
        wallet_id: raw.walletId || raw.id || "",
        currency: raw.currency || "",
        distribution_frequency: raw.distributionFrequency || raw.frequency || "daily",
        next_distribution: raw.nextDistribution || raw.next || "",
    };
}

/**
 * Maps raw earn wallet rewards summary to optimized schema
 */
export function mapEarnWalletRewardsSummaryResponse(raw: unknown): EarnWalletRewardsSummaryResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn wallet rewards summary response structure');
    }

    return {
        wallet_id: raw.walletId || raw.id || "",
        currency: raw.currency || "",
        total_rewards: raw.totalRewards || raw.total || "0",
        last_reward: raw.lastReward || raw.last || "0",
        last_reward_date: raw.lastRewardDate || raw.lastDate || "",
    };
}

// ============================================================================
// ADDITIONAL LOAN MAPPERS
// ============================================================================

/**
 * Maps raw loan config response to optimized schema
 */
export function mapLoanConfigResponse(raw: unknown): LoanConfigResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((config: any) => ({
        currency: config.currency || "",
        min_guarantee: config.minGuarantee || config.min || "0",
        max_ltv: config.maxLtv || config.ltv || "0",
        apr: config.apr || config.rate || "0",
        available_as_guarantee: config.availableAsGuarantee ?? true,
        available_as_loan: config.availableAsLoan ?? true,
    }));
}

/**
 * Maps raw loan LTV calculation response to optimized schema
 */
export function mapLoanLTVResponse(raw: unknown): LoanLTVResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid loan LTV response structure');
    }

    return {
        ltv: raw.ltv || raw.loanToValue || "0",
        max_loan_amount: raw.maxLoanAmount || raw.maxLoan || "0",
        liquidation_price: raw.liquidationPrice || raw.liquidationPriceReference || "0",
        health_factor: raw.healthFactor || raw.health || "1",
    };
}

/**
 * Maps raw loan order details to optimized schema
 */
export function mapLoanOrderDetailsResponse(raw: unknown): LoanOrderDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid loan order details response structure');
    }

    return {
        order_id: raw.orderId || raw.id || "",
        status: raw.status || "active",
        guarantee_currency: raw.guaranteeCurrency || "",
        guarantee_amount: raw.guaranteeAmount || "0",
        loan_currency: raw.loanCurrency || "",
        loan_amount: raw.loanAmount || "0",
        remaining_amount: raw.remainingAmount || raw.remaining || "0",
        ltv: raw.ltv || "0",
        apr: raw.apr || "0",
        liquidation_price: raw.liquidationPriceReference || raw.liquidationPrice || "0",
        created_at: raw.createdAt || raw.created_at || "",
        expires_at: raw.expiresAt || raw.expires_at || "",
        apr_details: raw.aprDetails ? {
            base_apr: raw.aprDetails.baseApr || "0",
            final_apr: raw.aprDetails.finalApr || "0",
            user_discount: raw.aprDetails.userDiscount || "0",
            total_discount: raw.aprDetails.totalDiscount || "0",
        } : undefined,
    };
}

// ============================================================================
// ADDITIONAL PRO MAPPERS
// ============================================================================

/**
 * Maps raw Pro open orders response to optimized schema
 */
export function mapProOpenOrdersResponse(raw: unknown): ProOpenOrdersResponse {
    if (!isValidObject(raw) && !isValidArray(raw)) {
        return { orders: [] };
    }

    const orders = isValidArray(raw) ? raw : (raw as any).orders || [];

    return {
        orders: orders.map((order: any) => ({
            id: order.id || order.orderId || "",
            symbol: order.symbol || "",
            side: order.side || "buy",
            type: order.type || order.orderType || "limit",
            status: order.status || "open",
            price: order.price,
            amount: order.amount || "0",
            filled: order.filled || order.filledAmount || "0",
            remaining: order.remaining || order.remainingAmount || "0",
            created_at: order.createdAt || order.created_at || "",
        })),
    };
}

/**
 * Maps raw Pro order trades response to optimized schema
 */
export function mapProOrderTradesResponse(raw: unknown): ProOrderTradesResponse {
    if (!isValidObject(raw)) {
        return { order_id: "", trades: [] };
    }

    const trades = (raw as any).trades || (raw as any).data || [];

    return {
        order_id: (raw as any).orderId || (raw as any).id || "",
        trades: trades.map((trade: any) => ({
            id: trade.id || trade.tradeId || "",
            order_id: trade.orderId || "",
            symbol: trade.symbol || "",
            side: trade.side || "buy",
            price: trade.price || "0",
            amount: trade.amount || trade.quantity || "0",
            fee: trade.fee || trade.feeAmount || "0",
            timestamp: trade.timestamp || trade.time || Date.now(),
        })),
    };
}

// ============================================================================
// ADDITIONAL OPERATION MAPPERS
// ============================================================================

/**
 * Maps raw transaction confirmation to optimized schema
 */
export function mapTransactionConfirmationResponse(raw: unknown): TransactionConfirmationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid transaction confirmation response structure');
    }

    return {
        transaction_id: raw.id || raw.transactionId || "",
        status: raw.status || "confirmed",
        message: raw.message || "Transaction confirmed",
    };
}

/**
 * Maps raw earn create transaction response to optimized schema
 */
export function mapEarnCreateTransactionResponse(raw: unknown): EarnCreateTransactionResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid earn transaction response structure');
    }

    return {
        transaction_id: raw.id || raw.transactionId || "",
        type: raw.type || "deposit",
        currency: raw.currency || "",
        amount: raw.amount || "0",
        status: raw.status || "pending",
        message: raw.message || "Transaction created",
    };
}

/**
 * Maps raw Pro deposit response to optimized schema
 */
export function mapProDepositResponse(raw: unknown): ProDepositResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid Pro deposit response structure');
    }

    return {
        transaction_id: raw.id || raw.transactionId || "",
        currency: raw.currency || "",
        amount: raw.amount || "0",
        status: raw.status || "completed",
        message: raw.message || "Deposit successful",
    };
}

/**
 * Maps raw Pro withdraw response to optimized schema
 */
export function mapProWithdrawResponse(raw: unknown): ProWithdrawResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid Pro withdraw response structure');
    }

    return {
        transaction_id: raw.id || raw.transactionId || "",
        currency: raw.currency || "",
        amount: raw.amount || "0",
        status: raw.status || "completed",
        message: raw.message || "Withdrawal successful",
    };
}

/**
 * Maps raw Pro cancel order response to optimized schema
 */
export function mapProCancelOrderResponse(raw: unknown): ProCancelOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid Pro cancel order response structure');
    }

    return {
        order_id: raw.id || raw.orderId || "",
        status: raw.status || "cancelled",
        message: raw.message || "Order cancelled",
    };
}

/**
 * Maps raw Pro cancel all orders response to optimized schema
 */
export function mapProCancelAllOrdersResponse(raw: unknown): ProCancelAllOrdersResponse {
    if (!isValidObject(raw)) {
        return { cancelled: 0, message: "No orders cancelled" };
    }

    return {
        cancelled: raw.cancelled || raw.count || 0,
        message: raw.message || `${raw.cancelled || 0} orders cancelled`,
    };
}

/**
 * Maps raw loan create response to optimized schema
 */
export function mapLoanCreateResponse(raw: unknown): LoanCreateResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid loan create response structure');
    }

    return {
        order_id: raw.orderId || raw.id || "",
        guarantee_currency: raw.guaranteeCurrency || "",
        guarantee_amount: raw.guaranteeAmount || "0",
        loan_currency: raw.loanCurrency || "",
        loan_amount: raw.loanAmount || "0",
        ltv: raw.ltv || "0",
        apr: raw.apr || "0",
        status: raw.status || "active",
        created_at: raw.createdAt || raw.created_at || "",
    };
}

/**
 * Maps raw loan increase guarantee response to optimized schema
 */
export function mapLoanIncreaseGuaranteeResponse(raw: unknown): LoanIncreaseGuaranteeResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid loan increase guarantee response structure');
    }

    return {
        order_id: raw.orderId || raw.id || "",
        new_guarantee_amount: raw.newGuaranteeAmount || raw.guaranteeAmount || "0",
        new_ltv: raw.newLtv || raw.ltv || "0",
        status: raw.status || "updated",
        message: raw.message || "Guarantee increased",
    };
}

/**
 * Maps raw loan payback response to optimized schema
 */
export function mapLoanPaybackResponse(raw: unknown): LoanPaybackResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError('Invalid loan payback response structure');
    }

    return {
        order_id: raw.orderId || raw.id || "",
        payback_amount: raw.paybackAmount || raw.amount || "0",
        remaining_amount: raw.remainingAmount || raw.remaining || "0",
        status: raw.status || "updated",
        message: raw.message || "Payment processed",
    };
}
