import { bit2meRequest } from "../services/bit2me.js";
import {
    mapProMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import { ProMarketConfigArgs, ProOrderBookArgs, ProPublicTradesArgs } from "../utils/args.js";
import { normalizePair, normalizePairResponse, validatePaginationLimit, validatePair } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";
import { cache, CacheCategory } from "../utils/cache.js";

export async function handleProGetMarketConfig(args: Record<string, unknown>) {
    const params = args as unknown as ProMarketConfigArgs;
    if (params.pair) validatePair(params.pair);
    const queryParams: Record<string, unknown> = {};
    if (params.pair) queryParams.symbol = normalizePair(params.pair);

    const cacheKey = `pro_market_config:${params.pair ? normalizePair(params.pair) : "ALL"}`;
    let data = cache.get<unknown>(cacheKey);
    if (!data) {
        data = await bit2meRequest("GET", "/v1/trading/market-config", queryParams);
        cache.set(cacheKey, data, CacheCategory.STATIC);
    }

    const requestContext: Record<string, unknown> = {};
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

export async function handleProGetOrderBook(args: Record<string, unknown>) {
    const params = args as unknown as ProOrderBookArgs;
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

export async function handleProGetPublicTrades(args: Record<string, unknown>) {
    const params = args as unknown as ProPublicTradesArgs;
    if (!params.pair) {
        throw new ValidationError("pair is required", "pair");
    }
    validatePair(params.pair);
    const pair = normalizePair(params.pair);
    // API limit is 50 according to documentation
    const limit = params.limit ? validatePaginationLimit(params.limit, 50) : undefined;

    // Convert pair format from BTC-EUR to BTC/EUR for API
    const [base_symbol, quote_symbol] = pair.split("-");
    const apiSymbol = `${base_symbol}/${quote_symbol}`;

    const queryParams: Record<string, unknown> = { symbol: apiSymbol };
    if (limit) queryParams.limit = limit;
    if (params.sort) {
        const validSorts = ["ASC", "DESC"];
        const normalizedSort = params.sort.toUpperCase();
        if (!validSorts.includes(normalizedSort)) {
            throw new ValidationError(`sort must be one of: ${validSorts.join(", ")}`, "sort", params.sort);
        }
        queryParams.sort = normalizedSort;
    }
    const data = await bit2meRequest("GET", "/v1/trading/trade/last", queryParams);
    const optimized = mapPublicTradesResponse(data);

    // Set pair for each trade (API doesn't include it in each trade array)
    const tradesWithPair = optimized.map((trade) => ({
        ...trade,
        pair: normalizePairResponse(pair),
    }));

    const requestContext: Record<string, unknown> = {
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
