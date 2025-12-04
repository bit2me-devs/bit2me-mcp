/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapProBalanceResponse,
    mapProOrderTradesResponse,
    mapProOrderResponse,
    mapProOpenOrdersResponse,
    mapProTradesResponse,
    mapProCancelOrderResponse,
    mapProCancelAllOrdersResponse,
    mapProDepositResponse,
    mapProWithdrawResponse,
    mapProMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
    mapCandlesResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import { logger } from "../utils/logger.js";
import {
    ProTradesArgs,
    ProOrderTradesArgs,
    ProOrderDetailsArgs,
    ProOpenOrdersArgs,
    ProCreateOrderArgs,
    ProCancelOrderArgs,
    ProCancelAllOrdersArgs,
    ProDepositArgs,
    ProWithdrawArgs,
    ProMarketConfigArgs,
    ProOrderBookArgs,
    ProPublicTradesArgs,
    ProCandlesArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { cache } from "../utils/cache.js";
import {
    normalizeSymbol,
    normalizePair,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validatePair,
    validateAmount,
    validateISO8601,
} from "../utils/format.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { ValidationError } from "../utils/errors.js";

export const proTools: Tool[] = getCategoryTools("pro");

/**
 * Handles pro trading-related tool requests
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 */
export async function handleProTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "pro_get_balance") {
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

        if (name === "pro_get_trades") {
            const params = args as ProTradesArgs;
            // API max limit is 50 per documentation
            const limit = validatePaginationLimit(params.limit, 50, "pro_get_trades");
            const offset = validatePaginationOffset(params.offset);

            const queryParams: any = {
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
            if (params.start_time) {
                validateISO8601(params.start_time);
                queryParams.startTime = params.start_time;
            }
            if (params.end_time) {
                validateISO8601(params.end_time);
                queryParams.endTime = params.end_time;
            }

            const data = await bit2meRequest("GET", "/v1/trading/trade", queryParams);
            const response = mapProTradesResponse(data);

            const requestContext: any = {
                limit,
                offset,
            };
            if (params.pair) requestContext.pair = normalizePair(params.pair);
            if (params.side) requestContext.side = params.side.toLowerCase();
            if (params.order_type) requestContext.order_type = params.order_type.toLowerCase();
            if (params.sort) requestContext.sort = params.sort;
            if (params.start_time) requestContext.start_time = params.start_time;
            if (params.end_time) requestContext.end_time = params.end_time;

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

        if (name === "pro_get_order_trades") {
            const params = args as ProOrderTradesArgs;
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

        if (name === "pro_get_order_details") {
            const params = args as ProOrderDetailsArgs;
            if (!params.order_id) {
                throw new ValidationError("order_id is required", "order_id");
            }
            validateUUID(params.order_id, "order_id");
            const requestContext = {
                order_id: params.order_id,
            };
            const data = await bit2meRequest("GET", `/v1/trading/order/${encodeURIComponent(params.order_id)}`);
            const optimized = mapProOrderResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_get_open_orders") {
            const params = args as ProOpenOrdersArgs;
            const queryParams: any = { status: "open" };
            const requestContext: any = {};
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

        if (name === "pro_create_order") {
            const params = args as ProCreateOrderArgs;
            if (!params.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            if (!params.side) {
                throw new ValidationError("side is required", "side");
            }
            if (!params.type) {
                throw new ValidationError("type is required", "type");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            // Validate side against allowed values
            const validSides = ["buy", "sell"];
            const normalizedSide = params.side.toLowerCase();
            if (!validSides.includes(normalizedSide)) {
                throw new ValidationError(`side must be one of: ${validSides.join(", ")}`, "side", params.side);
            }
            // Validate type against allowed values
            const validTypes = ["limit", "market", "stop-limit"];
            const normalizedType = params.type.toLowerCase();
            if (!validTypes.includes(normalizedType)) {
                throw new ValidationError(`type must be one of: ${validTypes.join(", ")}`, "type", params.type);
            }
            // Validate price requirements based on order type
            if ((normalizedType === "limit" || normalizedType === "stop-limit") && !params.price) {
                throw new ValidationError("price is required for limit and stop-limit orders", "price");
            }
            if (normalizedType === "stop-limit" && !params.stop_price) {
                throw new ValidationError("stop_price is required for stop-limit orders", "stop_price");
            }
            validatePair(params.pair);
            validateAmount(params.amount, "amount");
            const pair = normalizePair(params.pair);
            const body = {
                symbol: pair,
                side: normalizedSide,
                orderType: normalizedType,
                amount: params.amount,
                price: params.price,
                stopPrice: params.stop_price,
            };
            const requestContext: any = {
                pair,
                side: normalizedSide,
                type: normalizedType,
                amount: params.amount,
            };
            if (params.price) requestContext.price = params.price;
            if (params.stop_price) requestContext.stop_price = params.stop_price;
            const data = await bit2meRequest("POST", "/v1/trading/order", body);
            const optimized = mapProOrderResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_cancel_order") {
            const params = args as ProCancelOrderArgs;
            if (!params.order_id) {
                throw new ValidationError("order_id is required", "order_id");
            }
            validateUUID(params.order_id, "order_id");
            const requestContext = {
                order_id: params.order_id,
            };
            const data = await bit2meRequest("DELETE", `/v1/trading/order/${encodeURIComponent(params.order_id)}`);
            const optimized = mapProCancelOrderResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_cancel_all_orders") {
            const params = args as ProCancelAllOrdersArgs;
            const queryParams: any = {};
            const requestContext: any = {};
            if (params.pair) {
                validatePair(params.pair);
                const pair = normalizePair(params.pair);
                queryParams.symbol = pair;
                requestContext.pair = pair;
            }
            // Endpoint is DELETE /v1/trading/order (singular) with query params
            const data = await bit2meRequest("DELETE", "/v1/trading/order", queryParams);
            const optimized = mapProCancelAllOrdersResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_deposit") {
            const params = args as ProDepositArgs;
            if (!params.symbol) {
                throw new ValidationError("symbol is required", "symbol");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateAmount(params.amount, "amount");
            const symbol = normalizeSymbol(params.symbol);
            const requestContext = {
                symbol,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/trading/wallet/deposit", {
                currency: symbol,
                amount: params.amount,
            });
            const optimized = mapProDepositResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_withdraw") {
            const params = args as ProWithdrawArgs;
            if (!params.symbol) {
                throw new ValidationError("symbol is required", "symbol");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateAmount(params.amount, "amount");
            if (params.to_pocket_id) {
                validateUUID(params.to_pocket_id, "to_pocket_id");
            }
            const symbol = normalizeSymbol(params.symbol);
            const body: any = {
                currency: symbol,
                amount: params.amount,
            };
            if (params.to_pocket_id) {
                body.toPocketId = params.to_pocket_id;
            }

            const requestContext: any = {
                symbol,
                amount: params.amount,
            };
            if (params.to_pocket_id) {
                requestContext.to_pocket_id = params.to_pocket_id;
            }
            const data = await bit2meRequest("POST", "/v1/trading/wallet/withdraw", body);
            const optimized = mapProWithdrawResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_get_market_config") {
            const params = args as ProMarketConfigArgs;
            const queryParams: any = {};
            if (params.pair) queryParams.symbol = normalizePair(params.pair);

            const cacheKey = `market_config:${JSON.stringify(queryParams)}`;
            const cachedData = cache.get(cacheKey);

            let data;
            if (cachedData) {
                data = cachedData;
            } else {
                data = await bit2meRequest("GET", "/v1/trading/market-config", queryParams);
                cache.set(cacheKey, data, 600); // 10 minutes cache
            }

            const requestContext: any = {};
            if (params.pair) {
                requestContext.pair = normalizePair(params.pair);
            }
            const optimized = mapProMarketConfigResponse(data);
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

        if (name === "pro_get_order_book") {
            const params = args as ProOrderBookArgs;
            if (!params.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            validatePair(params.pair);
            const pair = normalizePair(params.pair);
            const requestContext = {
                pair,
            };
            const data = await bit2meRequest("GET", "/v2/trading/order-book", { symbol: pair });
            const optimized = mapOrderBookResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_get_public_trades") {
            const params = args as ProPublicTradesArgs;
            if (!params.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            validatePair(params.pair);
            const pair = normalizePair(params.pair);
            const limit = params.limit ? validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT) : undefined;
            const queryParams: any = { symbol: pair };
            if (limit) queryParams.limit = limit;
            if (params.sort) queryParams.sort = params.sort;
            const data = await bit2meRequest("GET", "/v1/trading/trade/last", queryParams);
            const optimized = mapPublicTradesResponse(data);

            const requestContext: any = {
                pair,
            };
            if (limit) requestContext.limit = limit;
            if (params.sort) requestContext.sort = params.sort;

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.length,
                    limit: limit || 100, // Default max is usually 100 for this endpoint
                    sort: params.sort || "DESC", // Default sort
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_get_candles") {
            const params = args as ProCandlesArgs;
            if (!params.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            if (!params.timeframe) {
                throw new ValidationError("timeframe is required", "timeframe");
            }
            validatePair(params.pair);
            const pair = normalizePair(params.pair);
            const limit = params.limit ? validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT) : undefined;
            const queryParams: any = { symbol: pair, timeframe: params.timeframe };
            if (limit) queryParams.limit = limit;
            const data = await bit2meRequest("GET", "/v1/trading/candle", queryParams);
            const optimized = mapCandlesResponse(data);

            const requestContext: any = {
                pair,
                timeframe: params.timeframe,
            };
            if (limit) requestContext.limit = limit;

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.length,
                    limit: limit || optimized.length,
                    timeframe: params.timeframe,
                    pair: pair,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown pro tool: ${name}`);
    });
}
