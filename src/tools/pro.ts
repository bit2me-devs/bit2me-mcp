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
    mapProTickerResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import {
    ProTradesArgs,
    ProOrderTradesArgs,
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
    ProTickerArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import {
    normalizeSymbol,
    normalizePair,
    normalizePairResponse,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validatePair,
    validateAmount,
    validateISO8601,
    convertProTimeframe,
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

            const requestContext: any = {
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

        if (name === "pro_get_open_orders") {
            const params = args as ProOpenOrdersArgs;
            const requestContext: any = {};

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
            const queryParams: any = { status: "open" };
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

            const data = await bit2meRequest("GET", "/v1/trading/market-config", queryParams);

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

            // Convert pair format from BTC-EUR to BTC/EUR for API
            const [base_symbol, quote_symbol] = pair.split("-");
            const apiSymbol = `${base_symbol}/${quote_symbol}`;

            const requestContext = {
                pair,
            };
            const data = await bit2meRequest("GET", "/v2/trading/order-book", { symbol: apiSymbol });
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
            // API limit is 50 according to documentation
            const limit = params.limit ? validatePaginationLimit(params.limit, 50) : undefined;
            const queryParams: any = { symbol: pair };
            if (limit) queryParams.limit = limit;
            if (params.sort) queryParams.sort = params.sort;
            const data = await bit2meRequest("GET", "/v1/trading/trade/last", queryParams);
            const optimized = mapPublicTradesResponse(data);

            // Set pair for each trade (API doesn't include it in each trade array)
            const tradesWithPair = optimized.map((trade) => ({
                ...trade,
                pair: normalizePairResponse(pair),
            }));

            const requestContext: any = {
                pair,
            };
            if (limit) requestContext.limit = limit;
            if (params.sort) requestContext.sort = params.sort;

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                tradesWithPair,
                {
                    total_records: tradesWithPair.length,
                    limit: limit || 50, // API default is 50
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
            // Convert pair format from BTC-EUR to BTC/EUR for API
            const pair = normalizePair(params.pair);
            const [base_symbol, quote_symbol] = pair.split("-");
            if (!base_symbol || !quote_symbol) {
                throw new ValidationError(
                    `Invalid pair format: ${pair}. Expected format: SYMBOL-QUOTE (e.g., BTC-USD, BTC-EUR)`,
                    "pair",
                    pair
                );
            }
            const apiSymbol = `${base_symbol}/${quote_symbol}`;

            // Convert trading notation (1h, 1d, etc.) to API format (60, 1440, etc.) - must be in minutes
            const apiInterval = convertProTimeframe(params.timeframe);
            // Validate interval is in minutes format (not 1D, etc.)
            const intervalMinutes = parseInt(apiInterval);
            if (isNaN(intervalMinutes)) {
                throw new ValidationError(
                    `Invalid timeframe: ${params.timeframe}. API requires interval in minutes.`,
                    "timeframe",
                    params.timeframe
                );
            }

            const limit = params.limit ? validatePaginationLimit(params.limit, 1000, "pro_get_candles") : 1000;

            // Calculate startTime and endTime if not provided (default: last 24 hours)
            const endTime = params.endTime || Date.now();
            const startTime = params.startTime || endTime - 24 * 60 * 60 * 1000; // 24 hours ago

            const queryParams: any = {
                symbol: apiSymbol,
                interval: intervalMinutes,
                startTime,
                endTime,
                limit,
            };

            const data = await bit2meRequest("GET", "/v1/trading/candle", queryParams);
            const optimized = mapCandlesResponse(data);

            const requestContext: any = {
                pair,
                timeframe: params.timeframe,
                startTime,
                endTime,
                limit,
            };

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.length,
                    limit,
                    timeframe: params.timeframe,
                    pair: pair,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "pro_get_ticker") {
            const params = args as ProTickerArgs;
            const queryParams: any = {};
            if (params.pair) {
                validatePair(params.pair);
                queryParams.symbol = normalizePair(params.pair);
            }

            const data = await bit2meRequest("GET", "/v2/trading/tickers", queryParams);
            const optimized = mapProTickerResponse(data);

            const requestContext: any = {};
            if (params.pair) {
                requestContext.pair = normalizePair(params.pair);
            }

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

        throw new Error(`Unknown pro tool: ${name}`);
    });
}
