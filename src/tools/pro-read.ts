import { bit2meRequest } from "../services/bit2me.js";
import {
    mapProBalanceResponse,
    mapProOrderTradesResponse,
    mapProOrderResponse,
    mapProOpenOrdersResponse,
    mapProTradesResponse,
} from "../utils/response-mappers.js";
import { buildFilteredContextualResponse, buildPaginatedContextualResponse } from "../utils/contextual-response.js";
import { ProTradesArgs, ProOrderTradesArgs, ProOpenOrdersArgs } from "../utils/args.js";
import {
    normalizePair,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validatePair,
    validateISO8601,
} from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleProGetBalance(_args: Record<string, unknown>) {
    const requestContext = {};
    const data = await bit2meRequest("GET", "/v1/trading/wallet/balance");
    const optimized = mapProBalanceResponse(data);
    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProGetTrades(args: Record<string, unknown>) {
    const params = args as unknown as ProTradesArgs;
    // API max limit is 50 per documentation
    const limit = validatePaginationLimit(params.limit, 50, "pro_get_trades");
    const offset = validatePaginationOffset(params.offset);

    if (params.pair) validatePair(params.pair);

    const queryParams: Record<string, unknown> = {
        limit,
        offset,
    };
    if (params.pair) queryParams.symbol = normalizePair(params.pair);
    if (params.sort) {
        const validSorts = ["ASC", "DESC"];
        const normalizedSort = params.sort.toUpperCase();
        if (!validSorts.includes(normalizedSort)) {
            throw new ValidationError(`sort must be one of: ${validSorts.join(", ")}`, "sort", params.sort);
        }
        queryParams.sort = normalizedSort;
    }
    if (params.side) queryParams.side = params.side.toLowerCase();
    if (params.order_type) queryParams.orderType = params.order_type.toLowerCase();
    if (params.start_date) {
        validateISO8601(params.start_date);
        queryParams.startTime = params.start_date;
    }
    if (params.end_date) {
        validateISO8601(params.end_date);
        queryParams.endTime = params.end_date;
    }

    const data = await bit2meRequest("GET", "/v1/trading/trade", queryParams);
    const response = mapProTradesResponse(data);

    const requestContext: Record<string, unknown> = {
        limit,
        offset,
    };
    if (params.pair) requestContext.pair = normalizePair(params.pair);
    if (params.side) requestContext.side = params.side.toLowerCase();
    if (params.order_type) requestContext.order_type = params.order_type.toLowerCase();
    if (params.sort) requestContext.sort = params.sort;
    if (params.start_date) requestContext.start_date = params.start_date;
    if (params.end_date) requestContext.end_date = params.end_date;

    const contextual = buildPaginatedContextualResponse(
        requestContext,
        response.trades,
        {
            total_records: response.count,
            limit,
            offset,
            has_more: response.trades.length === limit,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProGetOrderTrades(args: Record<string, unknown>) {
    const params = args as unknown as ProOrderTradesArgs;
    if (!params.order_id) {
        throw new ValidationError("order_id is required", "order_id");
    }
    validateUUID(params.order_id, "order_id");
    const requestContext = {
        order_id: params.order_id,
    };
    const data = await bit2meRequest("GET", `/v1/trading/order/${encodeURIComponent(params.order_id)}/trades`);
    const optimized = mapProOrderTradesResponse(data);
    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized.trades,
        {
            total_records: optimized.trades.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProGetOpenOrders(args: Record<string, unknown>) {
    const params = args as unknown as ProOpenOrdersArgs;
    const requestContext: Record<string, unknown> = {};

    // If order_id is provided, get details for that specific order
    if (params.order_id) {
        validateUUID(params.order_id, "order_id");
        requestContext.order_id = params.order_id;
        const data = await bit2meRequest("GET", `/v1/trading/order/${encodeURIComponent(params.order_id)}`);
        const optimized = mapProOrderResponse(data);
        // Return as array for consistency
        const contextual = buildFilteredContextualResponse(
            requestContext,
            [optimized],
            {
                total_records: 1,
            },
            data
        );
        return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
    }

    // Otherwise, get all open orders with optional pair filter
    const queryParams: Record<string, unknown> = { status: "open" };
    if (params.pair) {
        validatePair(params.pair);
        const pair = normalizePair(params.pair);
        queryParams.symbol = pair;
        requestContext.pair = pair;
    }
    const data = await bit2meRequest("GET", "/v1/trading/order", queryParams);
    const optimized = mapProOpenOrdersResponse(data);
    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized.orders,
        {
            total_records: optimized.orders.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
