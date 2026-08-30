import { ValidationError } from "../errors.js";
import { smartRound, formatTimestamp, normalizePairResponse, normalizeOrderStatus } from "../format.js";
import { DEFAULT_STRING } from "../../constants.js";
import { asFiniteNumber, asRecord, asString, asTime, firstDefined, isValidArray, isValidObject } from "./guards.js";
import type {
    ProBalanceResponse,
    ProOrderResponse,
    ProOpenOrdersResponse,
    ProTradeResponse,
    ProTradesResponse,
    ProOrderTradesResponse,
} from "../schemas.js";

export function mapProBalanceResponse(raw: unknown): ProBalanceResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw
        .map(asRecord)
        .filter((b) => asFiniteNumber(b.balance) > 0 || asFiniteNumber(b.blockedBalance) > 0)
        .map((b) => {
            const balance = asFiniteNumber(b.balance);
            const blocked = asFiniteNumber(b.blockedBalance);
            return {
                symbol: asString(b.currency),
                balance: balance.toString(),
                blocked: blocked.toString(),
                available: (balance - blocked).toString(),
            };
        });
}

export function mapProOrderResponse(raw: unknown): ProOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro order response structure");
    }
    return mapOrderFields(raw);
}

function mapOrderFields(order: ReturnType<typeof asRecord>): ProOrderResponse {
    const filled = firstDefined(order, "filled", "filledAmount");
    const remaining = firstDefined(order, "remaining", "remainingAmount");
    return {
        id: asString(firstDefined(order, "id", "orderId")),
        pair: normalizePairResponse(asString(firstDefined(order, "symbol", "pair"), DEFAULT_STRING)),
        side: asString(order.side, "buy").toLowerCase() as "buy" | "sell",
        type: asString(firstDefined(order, "type", "orderType"), "limit").toLowerCase() as
            "limit" | "market" | "stop-limit",
        status: normalizeOrderStatus(asString(order.status)),
        price: order.price ? smartRound(asFiniteNumber(order.price)).toString() : undefined,
        amount: order.amount ? smartRound(asFiniteNumber(order.amount)).toString() : "0",
        filled: filled ? smartRound(asFiniteNumber(filled)).toString() : "0",
        remaining: remaining ? smartRound(asFiniteNumber(remaining)).toString() : "0",
        created_at: asString(firstDefined(order, "createdAt", "created_at")),
    };
}

export function mapProOpenOrdersResponse(raw: unknown): ProOpenOrdersResponse {
    if (!isValidObject(raw) && !isValidArray(raw)) {
        return { orders: [] };
    }

    const orders = isValidArray(raw)
        ? raw
        : Array.isArray(asRecord(raw).orders)
          ? (asRecord(raw).orders as unknown[])
          : [];

    return {
        orders: orders.map((item) => mapOrderFields(asRecord(item))),
    };
}

export function mapProTradesResponse(raw: unknown): ProTradesResponse {
    if (isValidObject(raw) && Array.isArray(raw.data)) {
        return {
            count: asFiniteNumber(raw.count) || raw.data.length,
            trades: raw.data.map(mapSingleTrade),
        };
    }

    if (isValidArray(raw)) {
        return {
            count: raw.length,
            trades: raw.map(mapSingleTrade),
        };
    }

    return { count: 0, trades: [] };
}

function mapSingleTrade(item: unknown): ProTradeResponse {
    const trade = asRecord(item);
    const timestamp = asTime(firstDefined(trade, "createdAt", "timestamp", "time")) ?? Date.now();
    const { date } = formatTimestamp(timestamp);
    return {
        id: asString(firstDefined(trade, "id", "tradeId")),
        order_id: asString(trade.orderId),
        pair: normalizePairResponse(asString(firstDefined(trade, "symbol", "pair"))),
        side: asString(trade.side, "buy").toLowerCase() as "buy" | "sell",
        order_type: asString(trade.orderType, "limit").toLowerCase() as "limit" | "market" | "stop-limit",
        price: asString(trade.price, "0"),
        amount: asString(firstDefined(trade, "amount", "quantity"), "0"),
        cost: asString(trade.cost, "0"),
        fee: asString(firstDefined(trade, "feeAmount", "fee"), "0"),
        fee_symbol: asString(trade.feeCurrency).toUpperCase(),
        is_maker: Boolean(trade.isMaker),
        date,
    };
}

export function mapProOrderTradesResponse(raw: unknown): ProOrderTradesResponse {
    if (!isValidObject(raw)) {
        return { order_id: "", trades: [] };
    }

    const trades = Array.isArray(raw.trades) ? raw.trades : Array.isArray(raw.data) ? raw.data : [];

    return {
        order_id: asString(firstDefined(raw, "orderId", "id")),
        trades: trades.map(mapSingleTrade),
    };
}
