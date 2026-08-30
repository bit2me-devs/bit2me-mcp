import { bit2meRequest } from "../services/bit2me.js";
import { mapCandlesResponse, mapProTickerResponse } from "../utils/response-mappers.js";
import { buildFilteredContextualResponse, buildPaginatedContextualResponse } from "../utils/contextual-response.js";
import { ProCandlesArgs, ProTickerArgs } from "../utils/args.js";
import {
    normalizePair,
    validatePaginationLimit,
    validatePair,
    convertProTimeframe,
    toProApiPair,
} from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleProGetCandles(args: Record<string, unknown>) {
    const params = args as unknown as ProCandlesArgs;
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

    if (!Number.isFinite(startTime) || startTime < 0) {
        throw new ValidationError(
            "startTime must be a finite, non-negative epoch in milliseconds",
            "startTime",
            params.startTime
        );
    }
    if (!Number.isFinite(endTime) || endTime < 0) {
        throw new ValidationError(
            "endTime must be a finite, non-negative epoch in milliseconds",
            "endTime",
            params.endTime
        );
    }
    if (startTime > endTime) {
        throw new ValidationError("startTime must be <= endTime", "startTime", params.startTime);
    }

    const queryParams: Record<string, unknown> = {
        symbol: apiSymbol,
        interval: intervalMinutes,
        startTime,
        endTime,
        limit,
    };

    const data = await bit2meRequest("GET", "/v1/trading/candle", queryParams);
    const optimized = mapCandlesResponse(data);

    const requestContext: Record<string, unknown> = {
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

export async function handleProGetTicker(args: Record<string, unknown>) {
    const params = args as unknown as ProTickerArgs;
    const queryParams: Record<string, unknown> = {};
    if (params.pair) {
        validatePair(params.pair);
        queryParams.symbol = toProApiPair(params.pair);
    }

    const data = await bit2meRequest("GET", "/v2/trading/tickers", queryParams);
    const optimized = mapProTickerResponse(data);

    const requestContext: Record<string, unknown> = {};
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
