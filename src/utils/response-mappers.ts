/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Response mapping utilities with type guards
 * Maps raw API responses to optimized schemas with validation
 */

import { ValidationError } from "./errors.js";
import { getConfig } from "../config.js";
import { validateResponse, MarketTickerRawSchema } from "./response-validators.js";
import {
    smartRound,
    formatTimestamp,
    normalizeStatus,
    normalizeOrderStatus,
    normalizeMovementStatus,
    normalizeNetwork,
    normalizeMovementType,
    normalizeLoanMovementType,
    normalizePairResponse,
} from "./format.js";
import { DEFAULT_AMOUNT, DEFAULT_STRING, DEFAULT_ARRAY } from "../constants.js";
import type {
    // Market
    MarketTickerResponse,
    MarketAssetResponse,
    ProMarketConfigResponse,
    MarketOrderBookResponse,
    PublicTradeResponse,
    CandleResponse,

    // Wallet
    WalletAddressResponse,
    WalletMovementDetailsResponse,
    WalletPocketResponse,
    WalletPocketDetailsResponse,
    WalletMovementResponse,
    WalletNetworkResponse,
    WalletCardResponse,
    // Account
    AccountInfoResponse,
    // Earn
    EarnSummaryResponse,
    EarnAPYResponse,
    EarnPositionResponse,
    EarnMovementResponse,
    EarnPositionMovementResponse,
    EarnPositionDetailsResponse,
    EarnMovementsSummaryResponse,
    EarnAssetsResponse,
    EarnRewardsConfigResponse,
    EarnPositionRewardsConfigResponse,
    EarnPositionRewardsSummaryResponse,
    // Loan
    LoanOrderResponse,
    LoanMovementResponse,
    LoanConfigResponse,
    GuaranteeCurrencyConfig,
    LoanCurrencyConfig,
    LoanSimulationResponse,
    LoanOrderDetailsResponse,
    // Pro
    ProBalanceResponse,
    ProOrderResponse,
    ProOpenOrdersResponse,
    ProOrderTradesResponse,
    ProTradeResponse,
    // Operations
    ProformaResponse,
    OperationConfirmationResponse,
    EarnOperationResponse,
    ProDepositResponse,
    ProWithdrawResponse,
    ProCancelOrderResponse,
    ProCancelAllOrdersResponse,
    LoanCreateResponse,
    LoanIncreaseGuaranteeResponse,
    LoanPaybackResponse,
    CurrencyRateResponse,
} from "./schemas.js";

// ============================================================================
// RESPONSE WRAPPER
// ============================================================================

/**
 * Wraps a mapped response with optional raw_response field for debugging.
 * Only includes raw_response if BIT2ME_INCLUDE_RAW_RESPONSE=true in config.
 *
 * @param mappedResponse - The mapped/optimized response
 * @param rawResponse - The original raw API response
 * @returns Response with optional raw_response field
 */
export function wrapResponseWithRaw<T>(mappedResponse: T, rawResponse: unknown): T & { raw_response?: unknown } {
    const config = getConfig();
    if (config.INCLUDE_RAW_RESPONSE) {
        return {
            ...mappedResponse,
            raw_response: rawResponse,
        } as T & { raw_response?: unknown };
    }
    return mappedResponse as T & { raw_response?: unknown };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isValidTickerResponse(data: unknown): data is Record<string, any> {
    return typeof data === "object" && data !== null && "price" in data && "time" in data;
}

function isValidAssetRecord(data: unknown): data is Record<string, any> {
    return typeof data === "object" && data !== null;
}

function isValidArray(data: unknown): data is any[] {
    return Array.isArray(data);
}

function isValidObject(data: unknown): data is Record<string, any> {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}

// ============================================================================
// MARKET MAPPERS
// ============================================================================

/**
 * Maps raw ticker response to optimized schema
 * @param raw - Raw API response from Bit2Me ticker endpoint
 * @returns Optimized ticker response with timestamp and date fields
 * @throws ValidationError if response structure is invalid
 */
export function mapTickerResponse(raw: unknown, base_symbol: string, quote_symbol: string): MarketTickerResponse {
    // Validate with Zod schema
    const validated = validateResponse(MarketTickerRawSchema, raw, "ticker response");

    const timeValue =
        validated.time instanceof Date
            ? validated.time.getTime()
            : typeof validated.time === "string"
              ? validated.time
              : validated.time || Date.now();
    const { date } = formatTimestamp(timeValue);
    const priceValue = typeof validated.price === "string" ? parseFloat(validated.price) : validated.price;

    return {
        base_symbol,
        quote_symbol,
        date,
        price: smartRound(priceValue).toString(),
        market_cap: validated.marketCap?.toString() || "0",
        volume_24h: validated.totalVolume?.toString() || "0",
        max_supply: validated.maxSupply?.toString(),
        total_supply: validated.totalSupply?.toString(),
    };
}

/**
 * Maps raw asset object (keyed by symbol) to array of assets
 * @param raw - Raw API response object with assets keyed by symbol
 * @returns Array of optimized asset responses
 * @throws ValidationError if response structure is invalid
 */
export function mapAssetsResponse(raw: unknown): MarketAssetResponse[] {
    if (!isValidAssetRecord(raw)) {
        throw new ValidationError("Invalid assets response structure");
    }
    return Object.entries(raw).map(([symbol, asset]) => {
        // Normalize assetType: "currency" -> "crypto", "fiat" stays as "fiat"
        let normalizedType: "crypto" | "fiat" = "crypto";
        if (asset.assetType === "fiat") {
            normalizedType = "fiat";
        }

        const normalizedSymbol = symbol.toUpperCase();
        const pairsWith = asset.pairsWith || DEFAULT_ARRAY;

        // Build complete pairs: BASE-QUOTE format (e.g., BTC-EUR)
        const pro_trading_pairs = pairsWith
            .map((quoteSymbol: string) => {
                const quote = (quoteSymbol || "").toUpperCase();
                return quote ? `${normalizedSymbol}-${quote}` : "";
            })
            .filter((pair: string) => pair !== "");

        return {
            symbol: normalizedSymbol,
            name: asset.name,
            type: normalizedType,
            network: normalizeNetwork(asset.network),
            enabled: asset.enabled,
            tradeable: asset.ticker || false,
            loanable: asset.loanable || false,
            pro_trading_pairs,
        };
    });
}

/**
 * Maps raw market config response to optimized schema
 * @param raw - Raw API response with market configuration
 * @returns Array of optimized market config responses
 */
export function mapProMarketConfigResponse(raw: unknown): ProMarketConfigResponse[] {
    if (!isValidObject(raw)) {
        return [];
    }

    return Object.entries(raw).map(([pair, config]: [string, any]) => ({
        pair,
        base_precision: config.basePrecision || 0,
        quote_precision: config.quotePrecision || 0,
        min_amount: config.minAmount || DEFAULT_AMOUNT,
        max_amount: config.maxAmount || DEFAULT_AMOUNT,
        status: (normalizeStatus(config.status) || "active") as "active" | "inactive" | "maintenance",
    }));
}

/**
 * Maps raw order book response to optimized schema
 * @param raw - Raw API response from order book endpoint
 * @returns Optimized order book response with timestamp and date fields
 * @throws ValidationError if response structure is invalid
 */
export function mapOrderBookResponse(raw: unknown): MarketOrderBookResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid order book response structure");
    }

    const timestamp = raw.timestamp || Date.now();
    const { date } = formatTimestamp(timestamp);

    return {
        pair: normalizePairResponse(raw.symbol || raw.pair || DEFAULT_STRING),
        bids: (raw.bids || []).map((bid: any) => ({
            price: smartRound(parseFloat(bid.price || bid[0] || DEFAULT_AMOUNT)).toString(),
            amount: bid.amount || bid[1] || DEFAULT_AMOUNT,
        })),
        asks: (raw.asks || []).map((ask: any) => ({
            price: smartRound(parseFloat(ask.price || ask[0] || DEFAULT_AMOUNT)).toString(),
            amount: ask.amount || ask[1] || DEFAULT_AMOUNT,
        })),
        date,
    };
}

/**
 * Maps raw public trades response to optimized schema
 */
export function mapPublicTradesResponse(raw: unknown): PublicTradeResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((trade) => {
        const timestamp = trade.timestamp || trade.time || Date.now();
        const { date } = formatTimestamp(timestamp);
        return {
            id: trade.id || trade.tradeId || DEFAULT_STRING,
            pair: normalizePairResponse(trade.symbol || trade.pair || DEFAULT_STRING),
            price: smartRound(parseFloat(trade.price || DEFAULT_AMOUNT)).toString(),
            amount: trade.amount || trade.quantity || DEFAULT_AMOUNT,
            side: (trade.side || trade.takerSide || "buy").toLowerCase() as "buy" | "sell",
            date,
        };
    });
}

/**
 * Maps raw candles response to optimized schema
 */
export function mapCandlesResponse(raw: unknown): CandleResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((candle) => {
        const timestamp = candle.timestamp || candle[0] || Date.now();
        const { date } = formatTimestamp(timestamp);
        return {
            date,
            open: smartRound(parseFloat(candle.open || candle[1] || DEFAULT_AMOUNT)).toString(),
            high: smartRound(parseFloat(candle.high || candle[2] || DEFAULT_AMOUNT)).toString(),
            low: smartRound(parseFloat(candle.low || candle[3] || DEFAULT_AMOUNT)).toString(),
            close: smartRound(parseFloat(candle.close || candle[4] || DEFAULT_AMOUNT)).toString(),
            volume: candle.volume || candle[5] || DEFAULT_AMOUNT,
        };
    });
}

// ============================================================================
// WALLET MAPPERS
// ============================================================================

/**
 * Maps raw wallet pockets response to optimized schema
 */
export function mapWalletPocketsResponse(raw: unknown): WalletPocketResponse[] {
    if (!isValidArray(raw)) {
        throw new ValidationError("Invalid wallet pockets response structure");
    }

    return raw.map((p: any) => ({
        id: p.id,
        symbol: (p.currency || "").toUpperCase(),
        balance: p.balance,
        available: p.available,
        name: p.name,
    }));
}

/**
 * Maps raw wallet pocket details response to optimized schema
 * Includes all important fields: id, currency, balance, available, blocked, name, created_at
 */
export function mapWalletPocketDetailsResponse(raw: unknown): WalletPocketDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid wallet pocket details response structure");
    }

    const created_at = raw.createdAt || raw.created_at || "";

    return {
        id: raw.id || "",
        symbol: (raw.currency || "").toUpperCase(),
        balance: raw.balance || "0",
        available: raw.available || "0",
        blocked: raw.blocked || raw.blockedBalance || "0",
        name: raw.name,
        created_at,
    };
}

/**
 * Maps raw wallet addresses response to optimized schema
 * According to Swagger: id, createdAt, address, network, tag are required fields
 */
export function mapWalletAddressesResponse(raw: unknown): WalletAddressResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((addr: any) => {
        const created_at = addr.createdAt || addr.created_at || "";
        return {
            id: addr.id || "",
            address: addr.address || "",
            network: normalizeNetwork(addr.network) || "",
            symbol: addr.currency || undefined,
            tag: addr.tag || "",
            created_at,
        };
    });
}

/**
 * Maps raw wallet movements response to optimized schema
 */
export function mapWalletMovementsResponse(raw: unknown): WalletMovementResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((tx: any, index: number) => {
        return {
            id: tx.id || `tx_${index}`,
            date: tx.date,
            type: tx.type?.toLowerCase(),
            subtype: tx.subtype,
            status: normalizeMovementStatus(tx.status),
            amount: tx.denomination?.amount || "0",
            symbol: tx.denomination?.currency || "",
            origin: tx.origin
                ? {
                      amount: tx.origin.amount,
                      symbol: tx.origin.currency,
                      class: tx.origin.class,
                  }
                : undefined,
            destination: tx.destination
                ? {
                      amount: tx.destination.amount,
                      symbol: tx.destination.currency,
                      class: tx.destination.class,
                  }
                : undefined,
            fee: tx.fee
                ? {
                      amount: tx.fee.mercantile?.amount || tx.fee.network?.amount || "0",
                      symbol: tx.fee.mercantile?.currency || tx.fee.network?.currency || "",
                      class: tx.fee.mercantile?.class || tx.fee.network?.class || "",
                  }
                : undefined,
        };
    });
}

/**
 * Maps raw wallet movement details to optimized schema
 */
export function mapWalletMovementDetailsResponse(raw: unknown): WalletMovementDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid movement details response structure");
    }

    const originRate = raw.origin?.rate?.rate?.value || raw.origin?.rate?.value;

    return {
        id: raw.id,
        date: raw.date,
        type: normalizeMovementType(raw.type) as
            | "deposit"
            | "withdrawal"
            | "swap"
            | "purchase"
            | "transfer"
            | "fee"
            | "other",
        subtype: raw.subtype?.toLowerCase(),
        status: normalizeMovementStatus(raw.status),
        amount: raw.denomination?.amount || "0",
        symbol: raw.denomination?.currency || "",
        origin: raw.origin
            ? {
                  amount: raw.origin.amount,
                  symbol: raw.origin.currency,
                  class: raw.origin.class || "",
                  rate_applied: originRate,
              }
            : undefined,
        destination: raw.destination
            ? {
                  amount: raw.destination.amount,
                  symbol: raw.destination.currency,
                  class: raw.destination.class || "",
              }
            : undefined,
        fee: raw.fee
            ? {
                  amount: raw.fee.mercantile?.amount || raw.fee.network?.amount || "0",
                  symbol: raw.fee.mercantile?.currency || raw.fee.network?.currency || "",
                  class: raw.fee.mercantile?.class || raw.fee.network?.class || "",
              }
            : undefined,
    };
}

/**
 * Maps raw wallet networks response to optimized schema
 */
export function mapWalletNetworksResponse(raw: unknown): WalletNetworkResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((network: any) => ({
        id: normalizeNetwork(network.id) || "",
        name: network.name || "",
        native_symbol: network.nativeCurrencyCode || "",
        fee_symbol: network.feeCurrencyCode || "",
        has_tag: network.hasTag || false,
    }));
}

/**
 * Maps raw wallet cards response to optimized schema
 */
export function mapWalletCardsResponse(raw: unknown): WalletCardResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((card: any) => ({
        card_id: card.cardId || card.card_id || "",
        type: card.type || "",
        brand: card.brand || "",
        country: card.country || "",
        last4: card.last4 || "",
        expire_month: card.expireMonth || card.expire_month || "",
        expire_year: card.expireYear || card.expire_year || "",
        alias: card.alias || "",
        created_at: card.createdAt || card.created_at || "",
    }));
}

/**
 * Maps raw proforma response to optimized schema
 */
export function mapProformaResponse(raw: unknown): ProformaResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid proforma response structure");
    }

    const expires_at = raw.expiresAt || raw.validUntil || "";

    return {
        proforma_id: raw.id || raw.proformaId || "",
        origin_amount: raw.origin?.amount || raw.originAmount || "0",
        origin_symbol: raw.origin?.currency || raw.originCurrency || "",
        destination_amount: raw.destination?.amount || raw.destinationAmount || "0",
        destination_symbol: raw.destination?.currency || raw.destinationCurrency || "",
        rate: raw.rate || raw.exchangeRate || "0",
        fee: raw.fee?.amount || raw.feeAmount || "0",
        expires_at,
    };
}

// ============================================================================
// EARN MAPPERS
// ============================================================================

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extracts array data from various common API response structures:
 * 1. Direct array: [...]
 * 2. Wrapped object: { data: [...] }
 * 3. Wrapped array: [{ data: [...] }]
 * 4. Nested array: [[...]]
 */
function extractArrayData(raw: any): any[] {
    if (!raw) return [];

    // Case 1: Direct array
    if (Array.isArray(raw)) {
        // Case 4: Nested array [[...]] -> return first element if it's an array
        if (raw.length > 0 && Array.isArray(raw[0])) {
            return raw[0];
        }
        // Case 3: Wrapped array [{ data: [...] }] -> return data from first element
        if (raw.length > 0 && raw[0]?.data && Array.isArray(raw[0].data)) {
            return raw[0].data;
        }
        return raw;
    }

    // Case 2: Wrapped object { data: [...] }
    if (typeof raw === "object" && raw.data && Array.isArray(raw.data)) {
        return raw.data;
    }

    return [];
}

// ============================================================================
// EARN MAPPERS
// ============================================================================

/**
 * Maps raw earn summary to optimized schema
 */
/**
 * Maps earn summary response to optimized schema.
 * API returns: [[ { currency, totalBalance, totalRewards } ]] (nested array)
 * All monetary values are returned as strings for precision.
 */
export function mapEarnSummaryResponse(raw: unknown): EarnSummaryResponse[] {
    // Handle null/undefined
    if (!raw) return [];

    // Recursively find all objects with currency/totalBalance fields
    const results: EarnSummaryResponse[] = [];

    function extractItems(data: unknown): void {
        if (!data) return;

        if (Array.isArray(data)) {
            for (const item of data) {
                extractItems(item);
            }
        } else if (typeof data === "object") {
            const obj = data as Record<string, unknown>;
            // Check if this looks like a summary item
            if ("currency" in obj || "totalBalance" in obj || "totalRewards" in obj) {
                results.push({
                    symbol: String(obj.currency || ""),
                    total_balance: String(obj.totalBalance ?? obj.total_balance ?? "0"),
                    total_rewards: String(obj.totalRewards ?? obj.rewards_earned ?? "0"),
                });
            }
        }
    }

    extractItems(raw);
    return results;
}

/**
 * Maps raw earn APY response to optimized schema
 */
/**
 * Maps earn APY response to optimized schema.
 * Yield values are decimals where 1.0 = 100%.
 */
export function mapEarnAPYResponse(raw: unknown): Record<string, EarnAPYResponse> {
    if (!isValidObject(raw)) {
        return {};
    }

    const result: Record<string, EarnAPYResponse> = {};

    for (const [symbol, rates] of Object.entries(raw)) {
        if (rates && typeof rates === "object") {
            result[symbol] = {
                symbol,
                rates: {
                    daily_yield_ratio: String(rates.daily ?? 0),
                    weekly_yield_ratio: String(rates.weekly ?? 0),
                    monthly_yield_ratio: String(rates.monthly ?? 0),
                },
            };
        }
    }

    return result;
}

/**
 * Maps raw earn positions response to optimized schema
 * Note: APY is not included in the /v2/earn/wallets endpoint response
 */
export function mapEarnPositionsResponse(raw: unknown): EarnPositionResponse[] {
    const positions = extractArrayData(raw);

    return positions.map((position: any) => {
        const hasLockPeriod = position.lockPeriod && position.lockPeriod.lockPeriodId;
        const strategy = hasLockPeriod ? "fixed" : "flexible";
        const positionId = position.walletId || position.id || "";

        return {
            position_id: positionId,
            symbol: (position.currency || "").toUpperCase(),
            balance: position.totalBalance || position.balance || "0",
            strategy: position.strategy || position.type || strategy,
            lock_period: position.lockPeriod
                ? {
                      lock_period_id: position.lockPeriod.lockPeriodId || "",
                      months: position.lockPeriod.months || 0,
                  }
                : undefined,
            converted_balance: position.convertedBalance
                ? {
                      value: position.convertedBalance.value || "0",
                      symbol: position.convertedBalance.currency || "",
                  }
                : undefined,
            created_at: position.createdAt || position.created_at || "",
            updated_at: position.updatedAt || position.updated_at || "",
            // Keep id and wallet_id for backward compatibility
            id: positionId,
            wallet_id: positionId,
            total_balance: position.totalBalance,
        };
    });
}

/**
 * Maps raw earn position movements response to optimized schema.
 * API: GET /v1/earn/wallets/{walletId}/movements
 * Follows timestamp conventions: `timestamp` (number) + `date` (ISO string).
 */
export function mapEarnPositionMovementsResponse(raw: unknown): {
    total: number;
    movements: EarnPositionMovementResponse[];
} {
    // Handle { total, data } structure from API
    if (isValidObject(raw) && "data" in (raw as any)) {
        const response = raw as { total?: number; data?: any[] };
        const txs = Array.isArray(response.data) ? response.data : [];
        return {
            total: response.total || txs.length,
            movements: txs.map(mapSingleEarnPositionMovement),
        };
    }

    // Fallback: if raw is an array directly
    const txs = extractArrayData(raw);
    return {
        total: txs.length,
        movements: txs.map(mapSingleEarnPositionMovement),
    };
}

/**
 * Maps a single earn position movement
 */
function mapSingleEarnPositionMovement(tx: any): EarnPositionMovementResponse {
    const dateValue = tx.createdAt || tx.created_at || tx.date || "";
    const { date: created_at } = formatTimestamp(dateValue);

    // Handle nested amount object: { value, currency }
    let amountValue: string;
    let symbol: string;
    if (tx.amount && typeof tx.amount === "object") {
        amountValue = String(tx.amount.value || "0");
        symbol = tx.amount.currency || "";
    } else {
        amountValue = String(tx.amount || "0");
        symbol = tx.currency || "";
    }

    const positionId = tx.walletId || tx.wallet_id || "";
    return {
        id: tx.movementId || tx.id || tx.transactionId || "",
        type: (tx.type || "deposit").toLowerCase(),
        symbol,
        amount: amountValue,
        created_at,
        position_id: positionId,
        // Keep wallet_id for backward compatibility
        wallet_id: positionId,
    };
}

/**
 * Maps raw earn movements response (global, all positions) to optimized schema.
 * API: GET /v2/earn/movements
 * Returns: { total: number, data: [{ movementId, type, createdAt, walletId, amount, rate, convertedAmount, source, issuer, ... }] }
 * Follows timestamp conventions: `created_timestamp` (number) + `created_at` (ISO string).
 */
export function mapEarnMovementsResponse(raw: unknown): { total: number; movements: EarnMovementResponse[] } {
    if (!isValidObject(raw)) {
        return { total: 0, movements: [] };
    }

    const response = raw as { total?: number; data?: any[] };
    const movements = Array.isArray(response.data) ? response.data : [];

    return {
        total: response.total ?? movements.length,
        movements: movements.map(mapSingleEarnMovement),
    };
}

/**
 * Maps a single earn movement (global endpoint)
 */
function mapSingleEarnMovement(tx: any): EarnMovementResponse {
    const dateValue = tx.createdAt || tx.created_at || "";
    const { date } = formatTimestamp(dateValue);
    const positionId = tx.walletId || tx.wallet_id || "";

    const movement: EarnMovementResponse = {
        id: tx.movementId || tx.id || "",
        type: (tx.type || "deposit").toLowerCase(),
        created_at: date,
        position_id: positionId,
        amount: {
            value: tx.amount?.value || "0",
            symbol: tx.amount?.currency || "",
        },
        // Keep wallet_id for backward compatibility
        wallet_id: positionId,
    };

    // Optional fields
    if (tx.rate) {
        movement.rate = {
            amount: {
                value: tx.rate.amount?.value || "0",
                symbol: tx.rate.amount?.currency || "",
            },
            pair: normalizePairResponse(tx.rate.pair || ""),
        };
    }

    if (tx.convertedAmount) {
        movement.converted_amount = {
            value: tx.convertedAmount.value || "0",
            symbol: tx.convertedAmount.currency || "",
        };
    }

    if (tx.source) {
        const sourcePocketId =
            tx.source.walletId || tx.source.wallet_id || tx.source.pocketId || tx.source.pocket_id || "";
        movement.source = {
            pocket_id: sourcePocketId,
            symbol: tx.source.currency || "",
        };
    }

    if (tx.issuer) {
        movement.issuer = {
            id: tx.issuer.id || "",
            name: tx.issuer.name || "",
            integrator: tx.issuer.integrator || "",
        };
    }

    return movement;
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

    return (raw as any).data.map((loan: any) => {
        const created_at = loan.createdAt || "";
        return {
            id: loan.orderId,
            status: normalizeStatus(loan.status) as "active" | "completed" | "expired",
            guarantee_symbol: loan.guaranteeCurrency,
            guarantee_amount: loan.guaranteeAmount,
            loan_symbol: loan.loanCurrency,
            loan_amount: loan.loanAmount,
            created_at,
        };
    });
}

/**
 * Maps raw loan movements response to optimized schema
 */
export function mapLoanMovementsResponse(raw: unknown): LoanMovementResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((tx: any) => {
        const date = tx.date || tx.createdAt || "";
        return {
            id: tx.id || tx.transactionId || "",
            order_id: tx.orderId || "",
            type: normalizeLoanMovementType(tx.type) as
                | "payment"
                | "interest"
                | "guarantee_change"
                | "liquidation"
                | "other",
            amount: tx.amount || "0",
            symbol: (tx.currency || "").toUpperCase(),
            date,
            status: normalizeMovementStatus(tx.status),
        };
    });
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
            symbol: b.currency,
            balance: (b.balance || 0).toString(),
            blocked_balance: (b.blockedBalance || 0).toString(),
            available: ((b.balance || 0) - (b.blockedBalance || 0)).toString(),
        }));
}

/**
 * Maps raw Pro order response to optimized schema
 */
export function mapProOrderResponse(raw: unknown): ProOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro order response structure");
    }

    const created_at = raw.createdAt || raw.created_at || "";

    return {
        id: raw.id || raw.orderId || "",
        pair: normalizePairResponse(raw.symbol || raw.pair || DEFAULT_STRING),
        side: (raw.side || "buy").toLowerCase() as "buy" | "sell",
        type: (raw.type || raw.orderType || "limit").toLowerCase() as "limit" | "market" | "stop-limit",
        status: normalizeOrderStatus(raw.status),
        price: raw.price,
        amount: raw.amount || "0",
        filled: raw.filled || raw.filledAmount || "0",
        remaining: raw.remaining || raw.remainingAmount || "0",
        created_at,
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
        throw new ValidationError("Invalid account info response structure");
    }

    const created_at = raw.createdAt || raw.created_at || "";

    return {
        user_id: raw.userId || raw.id || "",
        email: raw.email || "",
        level: raw.level || raw.userLevel || "",
        kyc_status: raw.kycStatus || raw.kyc || "unknown",
        created_at,
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
 * Maps raw earn position details to optimized schema
 */
export function mapEarnPositionDetailsResponse(raw: unknown): EarnPositionDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn position details response structure");
    }

    const position = raw as any;
    const hasLockPeriod = position.lockPeriod && position.lockPeriod.lockPeriodId;
    const strategy = hasLockPeriod ? "fixed" : "flexible";
    const positionId = position.walletId || position.id || "";

    return {
        position_id: positionId,
        symbol: (position.currency || "").toUpperCase(),
        balance: position.totalBalance || position.balance || "0",
        strategy: position.strategy || position.type || strategy,
        lock_period: position.lockPeriod
            ? {
                  lock_period_id: position.lockPeriod.lockPeriodId || "",
                  months: position.lockPeriod.months || 0,
              }
            : undefined,
        converted_balance: position.convertedBalance
            ? {
                  value: position.convertedBalance.value || "0",
                  symbol: position.convertedBalance.currency || "",
              }
            : undefined,
        created_at: position.createdAt || position.created_at || "",
        updated_at: position.updatedAt || position.updated_at || "",
        // Keep id and wallet_id for backward compatibility
        id: positionId,
        wallet_id: positionId,
        total_balance: position.totalBalance,
    };
}

/**
 * Maps raw earn movements summary to optimized schema
 */
export function mapEarnMovementsSummaryResponse(raw: unknown): EarnMovementsSummaryResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn movements summary response structure");
    }

    return {
        type: (raw.type || "").toLowerCase(),
        total_amount: raw.totalAmount || raw.total || "0",
        total_count: raw.totalCount || raw.count || 0,
        symbol: (raw.currency || "").toUpperCase(),
    };
}

/**
 * Maps raw earn assets response to optimized schema
 */
export function mapEarnAssetsResponse(raw: unknown): EarnAssetsResponse {
    // Check if it's the standard object with assets/currencies array
    if (isValidObject(raw) && (raw.assets || raw.currencies)) {
        const assets = raw.assets || raw.currencies || [];
        return {
            symbols: Array.isArray(assets) ? assets : [],
        };
    }

    // Check if it's a direct array or wrapped array using helper
    const extracted = extractArrayData(raw);
    if (extracted.length > 0) {
        // Assuming extracted items are strings or objects with symbol
        return {
            symbols: extracted.map((item: any) =>
                typeof item === "string" ? item : item.symbol || item.currency || JSON.stringify(item)
            ),
        };
    }

    return { symbols: [] };
}

/**
 * Maps raw earn rewards config to optimized schema
 */
export function mapEarnRewardsConfigResponse(raw: unknown): EarnRewardsConfigResponse | EarnRewardsConfigResponse[] {
    // If it's an array (or wrapped array), map each item
    const asArray = extractArrayData(raw);
    if (asArray.length > 0) {
        return asArray.map((item) => {
            const positionId = item.walletId || item.wallet_id || "";
            return {
                position_id: positionId,
                user_id: item.userId || item.user_id || "",
                symbol: (item.currency || "").toUpperCase(),
                lock_period_id: item.lockPeriodId || item.lock_period_id || null,
                reward_symbol: (item.rewardCurrency || item.reward_currency || item.currency || "").toUpperCase(),
                created_at: item.createdAt || item.created_at || "",
                updated_at: item.updatedAt || item.updated_at || "",
                // Keep wallet_id for backward compatibility
                wallet_id: positionId,
            };
        });
    }

    // Fallback to single object if valid
    if (isValidObject(raw)) {
        const positionId = raw.walletId || raw.wallet_id || "";
        return {
            position_id: positionId,
            user_id: raw.userId || raw.user_id || "",
            symbol: (raw.currency || "").toUpperCase(),
            lock_period_id: raw.lockPeriodId || raw.lock_period_id || null,
            reward_symbol: (raw.rewardCurrency || raw.reward_currency || raw.currency || "").toUpperCase(),
            created_at: raw.createdAt || raw.created_at || "",
            updated_at: raw.updatedAt || raw.updated_at || "",
            // Keep wallet_id for backward compatibility
            wallet_id: positionId,
        };
    }

    throw new ValidationError("Invalid earn rewards config response structure");
}

/**
 * Maps raw earn position rewards config to optimized schema.
 * API: GET /v1/earn/wallets/{walletId}/rewards/config
 */
export function mapEarnPositionRewardsConfigResponse(raw: unknown): EarnPositionRewardsConfigResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn position rewards config response structure");
    }

    const positionId = raw.walletId || raw.wallet_id || "";
    return {
        position_id: positionId,
        user_id: raw.userId || raw.user_id || "",
        symbol: (raw.currency || "").toUpperCase(),
        lock_period_id: raw.lockPeriodId || raw.lock_period_id || null,
        reward_symbol: (raw.rewardCurrency || raw.reward_currency || raw.currency || "").toUpperCase(),
        created_at: raw.createdAt || raw.created_at || "",
        updated_at: raw.updatedAt || raw.updated_at || "",
        // Keep wallet_id for backward compatibility
        wallet_id: positionId,
    };
}

/**
 * Maps raw earn position rewards summary to optimized schema.
 * API: GET /v1/earn/wallets/{walletId}/rewards/summary
 */
export function mapEarnPositionRewardsSummaryResponse(raw: unknown): EarnPositionRewardsSummaryResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn position rewards summary response structure");
    }

    // Extract accumulatedRewards array (first element)
    const accumulatedRewards = raw.accumulatedRewards || [];
    const firstReward = Array.isArray(accumulatedRewards) && accumulatedRewards.length > 0 ? accumulatedRewards[0] : {};

    // Extract totalConvertedReward object
    const totalConvertedReward = raw.totalConvertedReward || {};

    return {
        reward_symbol: (firstReward.currency || "").toUpperCase(),
        reward_amount: firstReward.amount || "0",
        reward_converted_symbol: (totalConvertedReward.currency || "").toUpperCase(),
        reward_converted_amount: totalConvertedReward.amount || "0",
    };
}

// ============================================================================
// ADDITIONAL LOAN MAPPERS
// ============================================================================

/**
 * Maps raw loan config response to optimized schema
 * Returns guarantee currencies (collateral) and loan currencies (borrowing) as separate arrays
 */
export function mapLoanConfigResponse(raw: unknown): LoanConfigResponse {
    if (!isValidObject(raw)) {
        return {
            guarantee_currencies: [],
            loan_currencies: [],
        };
    }

    const loanCurrencies = Array.isArray(raw.loanCurrencies) ? raw.loanCurrencies : [];
    const guaranteeCurrencies = Array.isArray(raw.guaranteeCurrencies) ? raw.guaranteeCurrencies : [];

    return {
        guarantee_currencies: guaranteeCurrencies
            .map((item: any) => {
                const symbol = (item.currency || "").toUpperCase();
                if (!symbol) return null;
                return {
                    symbol,
                    enabled: item.enabled ?? true,
                    liquidation_ltv: String(item.liquidationLtv ?? item.liquidation_ltv ?? "0"),
                    initial_ltv: String(item.initialLtv ?? item.initial_ltv ?? "0"),
                    created_at: item.createdAt || item.created_at || "",
                    updated_at: item.updatedAt || item.updated_at || "",
                };
            })
            .filter((item): item is GuaranteeCurrencyConfig => item !== null),
        loan_currencies: loanCurrencies
            .map((item: any) => {
                const symbol = (item.currency || "").toUpperCase();
                if (!symbol) return null;
                return {
                    symbol,
                    enabled: item.enabled ?? true,
                    liquidity: String(item.liquidity ?? "0"),
                    liquidity_status: item.liquidityStatus || item.liquidity_status || "",
                    apr: String(item.apr ?? "0"),
                    minimum_amount: String(item.minimumAmount ?? item.minimum_amount ?? "0"),
                    maximum_amount: String(item.maximumAmount ?? item.maximum_amount ?? "0"),
                    created_at: item.createdAt || item.created_at || "",
                    updated_at: item.updatedAt || item.updated_at || "",
                };
            })
            .filter((item): item is LoanCurrencyConfig => item !== null),
    };
}

/**
 * Maps raw loan LTV calculation response to optimized schema
 */
/**
 * Maps loan simulation response.
 * LTV is a ratio where 1.0 = 100%.
 */
export function mapLoanSimulationResponse(raw: unknown): LoanSimulationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan simulation response structure");
    }

    return {
        guarantee_symbol: (raw.guaranteeCurrency || "").toUpperCase(),
        guarantee_amount: raw.guaranteeAmount || "0",
        guarantee_amount_converted: raw.guaranteeAmountConverted || "0",
        loan_symbol: (raw.loanCurrency || "").toUpperCase(),
        loan_amount: raw.loanAmount || "0",
        loan_amount_converted: raw.loanAmountConverted || "0",
        user_symbol: (raw.userCurrency || "").toUpperCase(),
        ltv: raw.ltv || "0",
        apr: raw.apr || "0",
    };
}

/**
 * Maps raw loan order details to optimized schema
 */
export function mapLoanOrderDetailsResponse(raw: unknown): LoanOrderDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan order details response structure");
    }

    const created_at = raw.createdAt || raw.created_at || "";
    const expires_at = raw.expiresAt || raw.expires_at || "";

    return {
        id: raw.orderId || raw.id || "",
        status: (normalizeStatus(raw.status) || "active") as "active" | "completed" | "expired",
        guarantee_symbol: raw.guaranteeCurrency || "",
        guarantee_amount: raw.guaranteeAmount || "0",
        loan_symbol: raw.loanCurrency || "",
        loan_amount: raw.loanAmount || "0",
        remaining_amount: raw.remainingAmount || raw.remaining || "0",
        ltv: raw.ltv || "0",
        apr: raw.apr || "0",
        liquidation_price: raw.liquidationPriceReference || raw.liquidationPrice || "0",
        created_at,
        expires_at,
        apr_details: raw.aprDetails
            ? {
                  base_apr: raw.aprDetails.baseApr || "0",
                  final_apr: raw.aprDetails.finalApr || "0",
                  user_discount: raw.aprDetails.userDiscount || "0",
                  total_discount: raw.aprDetails.totalDiscount || "0",
              }
            : undefined,
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
        orders: orders.map((order: any) => {
            const created_at = order.createdAt || order.created_at || "";
            return {
                id: order.id || order.orderId || "",
                pair: normalizePairResponse(order.symbol || order.pair || ""),
                side: order.side || "buy",
                type: order.type || order.orderType || "limit",
                status: normalizeOrderStatus(order.status),
                price: order.price,
                amount: order.amount || "0",
                filled: order.filled || order.filledAmount || "0",
                remaining: order.remaining || order.remainingAmount || "0",
                created_at,
            };
        }),
    };
}

/**
 * Maps pro trades response.
 * API returns: { count: number, data: [...trades] }
 * @returns Object with count and mapped trades array
 */
export function mapProTradesResponse(raw: unknown): { count: number; trades: ProTradeResponse[] } {
    // Handle { count, data } structure from API
    if (isValidObject(raw) && "data" in (raw as any)) {
        const response = raw as { count?: number; data?: any[] };
        const trades = Array.isArray(response.data) ? response.data : [];
        return {
            count: response.count || trades.length,
            trades: trades.map(mapSingleTrade),
        };
    }

    // Fallback: if raw is an array directly
    if (isValidArray(raw)) {
        return {
            count: raw.length,
            trades: raw.map(mapSingleTrade),
        };
    }

    return { count: 0, trades: [] };
}

/**
 * Maps a single trade object
 */
function mapSingleTrade(trade: any): ProTradeResponse {
    const timestamp = trade.createdAt || trade.timestamp || trade.time || Date.now();
    const { date } = formatTimestamp(timestamp);
    return {
        id: trade.id || trade.tradeId || "",
        order_id: trade.orderId || "",
        pair: normalizePairResponse(trade.symbol || trade.pair || ""),
        side: (trade.side || "buy").toLowerCase() as "buy" | "sell",
        order_type: (trade.orderType || "limit").toLowerCase() as "limit" | "market" | "stop-limit",
        price: String(trade.price || "0"),
        amount: String(trade.amount || trade.quantity || "0"),
        cost: String(trade.cost || "0"),
        fee: String(trade.feeAmount || trade.fee || "0"),
        fee_symbol: (trade.feeCurrency || "").toUpperCase(),
        is_maker: trade.isMaker || false,
        date,
    };
}

export function mapProOrderTradesResponse(raw: unknown): ProOrderTradesResponse {
    if (!isValidObject(raw)) {
        return { order_id: "", trades: [] };
    }

    const trades = (raw as any).trades || (raw as any).data || [];

    return {
        order_id: (raw as any).orderId || (raw as any).id || "",
        trades: trades.map((trade: any) => {
            const timestamp = trade.timestamp || trade.time || Date.now();
            const { date } = formatTimestamp(timestamp);
            return {
                id: trade.id || trade.tradeId || "",
                order_id: trade.orderId || "",
                pair: normalizePairResponse(trade.symbol || trade.pair || ""),
                side: (trade.side || "buy").toLowerCase() as "buy" | "sell",
                price: trade.price || "0",
                amount: trade.amount || trade.quantity || "0",
                fee: trade.fee || trade.feeAmount || "0",
                date,
            };
        }),
    };
}

// ============================================================================
// ADDITIONAL OPERATION MAPPERS
// ============================================================================

/**
 * Maps raw operation confirmation to optimized schema
 */
export function mapOperationConfirmationResponse(raw: unknown): OperationConfirmationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid operation confirmation response structure");
    }

    return {
        id: raw.id || raw.transactionId || raw.movementId || "",
        status: normalizeStatus(raw.status) || "confirmed",
    };
}

/**
 * Maps raw earn deposit/withdraw response to optimized schema
 */
export function mapEarnOperationResponse(raw: unknown): EarnOperationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn operation response structure");
    }

    const opType = (raw.type as "deposit" | "withdrawal") || "deposit";

    return {
        id: raw.id || raw.transactionId || raw.movementId || "",
        type: opType,
        symbol: (raw.currency || "").toUpperCase(),
        amount: raw.amount || "0",
        status: normalizeMovementStatus(raw.status),
        message: raw.message || "Operation created",
    };
}

/**
 * Maps raw Pro deposit response to optimized schema
 */
export function mapProDepositResponse(raw: unknown): ProDepositResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro deposit response structure");
    }

    return {
        id: raw.id || raw.transactionId || "",
        symbol: (raw.currency || "").toUpperCase(),
        amount: raw.amount || "0",
        status: normalizeMovementStatus(raw.status),
        message: raw.message || "Deposit successful",
    };
}

/**
 * Maps raw Pro withdraw response to optimized schema
 */
export function mapProWithdrawResponse(raw: unknown): ProWithdrawResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro withdraw response structure");
    }

    return {
        id: raw.id || raw.transactionId || "",
        symbol: (raw.currency || "").toUpperCase(),
        amount: raw.amount || "0",
        status: normalizeMovementStatus(raw.status),
        message: raw.message || "Withdrawal successful",
    };
}

/**
 * Maps raw Pro cancel order response to optimized schema
 */
export function mapProCancelOrderResponse(raw: unknown): ProCancelOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro cancel order response structure");
    }

    return {
        id: raw.id || raw.orderId || "",
        status: normalizeStatus(raw.status) || "cancelled",
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
        throw new ValidationError("Invalid loan create response structure");
    }

    const created_at = raw.createdAt || raw.created_at || "";

    return {
        id: raw.orderId || raw.id || "",
        guarantee_symbol: raw.guaranteeCurrency || "",
        guarantee_amount: raw.guaranteeAmount || "0",
        loan_symbol: raw.loanCurrency || "",
        loan_amount: raw.loanAmount || "0",
        ltv: raw.ltv || "0",
        apr: raw.apr || "0",
        status: normalizeStatus(raw.status) || "active",
        created_at,
    };
}

/**
 * Maps raw loan increase guarantee response to optimized schema
 */
export function mapLoanIncreaseGuaranteeResponse(raw: unknown): LoanIncreaseGuaranteeResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan increase guarantee response structure");
    }

    return {
        id: raw.orderId || raw.id || "",
        new_guarantee_amount: raw.newGuaranteeAmount || raw.guaranteeAmount || "0",
        new_ltv: raw.newLtv || raw.ltv || "0",
        status: normalizeStatus(raw.status) || "updated",
        message: raw.message || "Guarantee increased",
    };
}

/**
 * Maps raw loan payback response to optimized schema
 */
export function mapLoanPaybackResponse(raw: unknown): LoanPaybackResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan payback response structure");
    }

    return {
        id: raw.orderId || raw.id || "",
        payback_amount: raw.paybackAmount || raw.amount || "0",
        remaining_amount: raw.remainingAmount || raw.remaining || "0",
        status: normalizeStatus(raw.status) || "updated",
        message: raw.message || "Payment processed",
    };
}

export function mapCurrencyRateResponse(
    raw: unknown,
    quote_symbol: string = "USD",
    base_symbol?: string
): CurrencyRateResponse[] {
    // API returns an array with an object containing { fiat: {...}, crypto: {...} }
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new ValidationError("Invalid currency rate response structure");
    }

    const data = raw[0];
    if (!data || typeof data !== "object" || !data.crypto) {
        throw new ValidationError("Invalid currency rate response structure");
    }

    const cryptoRates = data.crypto as Record<string, number>;
    const fiatRates = data.fiat as Record<string, number>;

    // Get the fiat rate (how many units of fiat per 1 USD)
    const fiatRate = fiatRates[quote_symbol] || 1;

    const results: CurrencyRateResponse[] = [];

    // Helper to process a single symbol
    const processSymbol = (base_sym: string, cryptoRate: number) => {
        if (!cryptoRate || cryptoRate === 0) return;

        // cryptoRate is how many units of crypto per 1 USD
        // We want: how many units of fiat per 1 crypto
        // Formula: (fiatRate / cryptoRate)
        const price = fiatRate / cryptoRate;

        const { date } = formatTimestamp(Date.now());
        results.push({
            base_symbol: base_sym,
            price: smartRound(price).toString(),
            quote_symbol: quote_symbol,
            date,
        });
    };

    if (base_symbol) {
        if (cryptoRates[base_symbol]) {
            processSymbol(base_symbol, cryptoRates[base_symbol]);
        }
    } else {
        Object.entries(cryptoRates).forEach(([base_sym, rate]) => {
            processSymbol(base_sym, rate);
        });
    }

    return results;
}
