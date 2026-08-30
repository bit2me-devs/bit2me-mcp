import { cachedGet } from "../services/cached-request.js";
import { mapAssetsResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { normalizeSymbol, validateSymbol } from "../utils/format.js";
import { CacheCategory } from "../utils/cache.js";

export async function handleGeneralGetAssetsConfig(args: Record<string, unknown>) {
    const params: Record<string, unknown> = {};
    if (args.include_testnet !== undefined) params.includeTestnet = args.include_testnet;
    if (args.show_exchange !== undefined) params.showExchange = args.show_exchange;

    const requestContext: Record<string, unknown> = {
        include_testnet: args.include_testnet ?? false,
        show_exchange: args.show_exchange ?? false,
    };

    // If symbol is provided, get specific asset details. Catalog
    // data is cached under a stable key with the STATIC TTL (1 hour).
    if (typeof args.symbol === "string" && args.symbol) {
        validateSymbol(args.symbol);
        const symbol = normalizeSymbol(args.symbol);
        requestContext.symbol = symbol;
        const data = await cachedGet(`/v2/currency/assets/${encodeURIComponent(symbol)}`, params, CacheCategory.STATIC);
        // For single asset, wrap in object and extract first item
        const asArray = mapAssetsResponse({ [symbol]: data });
        const contextual = buildSimpleContextualResponse(requestContext, asArray[0], data);
        return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
    }

    // Full directory listing — cached for 1h (STATIC).
    const data = await cachedGet("/v2/currency/assets", params, CacheCategory.STATIC);

    const optimized = mapAssetsResponse(data);
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
