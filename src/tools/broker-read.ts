import { getTicker } from "../services/bit2me.js";
import { cachedGet } from "../services/cached-request.js";
import { CacheCategory } from "../utils/cache.js";
import { mapTickerResponse, mapCurrencyRateResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { MarketTickerArgs } from "../utils/args.js";
import { normalizeSymbol, validateSymbol, validateFiat } from "../utils/format.js";
import { Bit2MeAPIError, NotFoundError, ValidationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { getCorrelationId } from "../utils/context.js";

export async function handleBrokerGetAssetPrice(args: Record<string, unknown>) {
    const params: Record<string, unknown> = {};
    if (args.date) params.time = args.date;

    // Default to EUR as per documentation
    const quote_symbol = normalizeSymbol(typeof args.quote_symbol === "string" ? args.quote_symbol : "EUR");
    const base_symbol = typeof args.base_symbol === "string" ? normalizeSymbol(args.base_symbol) : undefined;
    const requestContext: Record<string, unknown> = {
        quote_symbol,
    };
    if (base_symbol) {
        requestContext.base_symbol = base_symbol;
    }
    if (args.date) {
        requestContext.date = args.date;
    }
    // Cache exchange rates with the MARKET_DATA TTL (30s).
    const data = await cachedGet("/v1/currency/rate", params, CacheCategory.MARKET_DATA);
    const optimized = mapCurrencyRateResponse(data, quote_symbol, base_symbol);
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

export async function handleBrokerGetAssetData(args: Record<string, unknown>) {
    const typedArgs = args as unknown as MarketTickerArgs;
    if (!typedArgs.base_symbol) {
        throw new ValidationError("base_symbol is required", "base_symbol");
    }
    validateSymbol(typedArgs.base_symbol);
    // Default to EUR as requested
    const quote_symbol = normalizeSymbol(typedArgs.quote_symbol || "EUR");
    if (typedArgs.quote_symbol) {
        validateFiat(typedArgs.quote_symbol);
    }
    const base_symbol = normalizeSymbol(typedArgs.base_symbol);

    try {
        const tickerData = await getTicker(base_symbol, quote_symbol);
        if (tickerData) {
            const optimized = mapTickerResponse(tickerData, base_symbol, quote_symbol);
            const requestContext = {
                base_symbol,
                quote_symbol,
            };
            const contextual = buildSimpleContextualResponse(requestContext, optimized, tickerData);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }
        throw new NotFoundError("/v3/currency/ticker", `Ticker for ${base_symbol}/${quote_symbol}`);
    } catch (error: unknown) {
        if (error instanceof Bit2MeAPIError || error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        const internal = error instanceof Error ? error.message : String(error);
        logger.error("broker_get_asset_data processing failed", {
            error: internal,
            correlationId: getCorrelationId(),
        });
        throw new Bit2MeAPIError(500, internal, "/v3/currency/ticker");
    }
}
