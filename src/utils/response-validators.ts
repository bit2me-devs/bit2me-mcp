/**
 * Zod schemas for validating API responses
 * These schemas validate raw API responses before mapping
 */

import { z } from "zod";
import { ValidationError } from "./errors.js";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

const timestampSchema = z.union([z.string(), z.number(), z.date()]);

const amountSchema = z.union([z.string(), z.number()]);

const statusSchema = z.enum([
    "pending",
    "completed",
    "failed",
    "cancelled",
    "active",
    "inactive",
    "maintenance",
    "partial",
    "expired",
    "unknown",
]);

// ============================================================================
// MARKET RESPONSE SCHEMAS
// ============================================================================

export const MarketTickerRawSchema = z.object({
    price: z.union([z.string(), z.number()]),
    time: timestampSchema.optional(),
    marketCap: z.union([z.string(), z.number()]).optional(),
    totalVolume: z.union([z.string(), z.number()]).optional(),
    maxSupply: z.union([z.string(), z.number()]).optional(),
    totalSupply: z.union([z.string(), z.number()]).optional(),
});

export const MarketAssetRawSchema = z.object({
    symbol: z.string(),
    name: z.string(),
    type: z.enum(["crypto", "fiat", "currency"]),
    network: z.string().optional(),
    enabled: z.boolean().optional(),
    tradeable: z.boolean().optional(),
    loanable: z.boolean().optional(),
    pro_trading_pairs: z.array(z.string()).optional(),
});

export const ProMarketConfigRawSchema = z.object({
    pair: z.string().optional(),
    symbol: z.string().optional(),
    basePrecision: z.number().optional(),
    quotePrecision: z.number().optional(),
    minAmount: z.union([z.string(), z.number()]).optional(),
    maxAmount: z.union([z.string(), z.number()]).optional(),
    status: statusSchema.optional(),
});

export const OrderBookEntryRawSchema = z.object({
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
});

export const MarketOrderBookRawSchema = z.object({
    bids: z.array(OrderBookEntryRawSchema).optional(),
    asks: z.array(OrderBookEntryRawSchema).optional(),
    date: timestampSchema.optional(),
});

export const PublicTradeRawSchema = z.object({
    id: z.union([z.string(), z.number()]),
    pair: z.string().optional(),
    symbol: z.string().optional(),
    price: z.union([z.string(), z.number()]),
    amount: z.union([z.string(), z.number()]),
    side: z.enum(["buy", "sell"]).optional(),
    date: timestampSchema.optional(),
    createdAt: timestampSchema.optional(),
});

export const CandleRawSchema = z.object({
    date: timestampSchema,
    open: z.union([z.string(), z.number()]),
    high: z.union([z.string(), z.number()]),
    low: z.union([z.string(), z.number()]),
    close: z.union([z.string(), z.number()]),
    volume: z.union([z.string(), z.number()]).optional(),
});

// ============================================================================
// WALLET RESPONSE SCHEMAS
// ============================================================================

export const WalletPocketRawSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    balance: amountSchema,
    available: amountSchema,
    blocked: amountSchema.optional(),
    name: z.string().optional(),
});

export const WalletMovementRawSchema = z.object({
    id: z.string().optional(),
    transactionId: z.string().optional(),
    type: z.string(),
    status: z.string().optional(),
    amount: amountSchema,
    currency: z.string().optional(),
    symbol: z.string().optional(),
    date: timestampSchema.optional(),
    createdAt: timestampSchema.optional(),
});

// ============================================================================
// PRO TRADING RESPONSE SCHEMAS
// ============================================================================

export const ProOrderRawSchema = z.object({
    id: z.string(),
    orderId: z.string().optional(),
    pair: z.string().optional(),
    symbol: z.string().optional(),
    side: z.enum(["buy", "sell"]),
    type: z.enum(["limit", "market", "stop-limit"]).optional(),
    status: z.string().optional(),
    price: amountSchema.optional(),
    amount: amountSchema,
    filled: amountSchema.optional(),
    filledAmount: amountSchema.optional(),
    remaining: amountSchema.optional(),
    remainingAmount: amountSchema.optional(),
    createdAt: timestampSchema.optional(),
    created_at: timestampSchema.optional(),
});

export const ProTradeRawSchema = z.object({
    id: z.string().optional(),
    tradeId: z.string().optional(),
    orderId: z.string().optional(),
    pair: z.string().optional(),
    symbol: z.string().optional(),
    price: amountSchema,
    amount: amountSchema,
    side: z.enum(["buy", "sell"]).optional(),
    fee: amountSchema.optional(),
    createdAt: timestampSchema.optional(),
    timestamp: timestampSchema.optional(),
    date: timestampSchema.optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates raw API response against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Raw API response data
 * @param context - Context for error messages
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
            throw new ValidationError(
                `Response validation failed${context ? ` (${context})` : ""}: ${issues}`,
                undefined,
                data
            );
        }
        throw error;
    }
}

/**
 * Safely validates response, returns null if validation fails
 * Useful for optional or partial responses
 */
export function safeValidateResponse<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T | null {
    try {
        return validateResponse(schema, data, context);
    } catch (error) {
        if (error instanceof ValidationError) {
            return null;
        }
        throw error;
    }
}
