/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import { mapAssetsResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { cache, CacheCategory } from "../utils/cache.js";
import { normalizeSymbol, validateSymbol } from "../utils/format.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const marketTools: Tool[] = getCategoryTools("market");

/**
 * Handles market-related tool requests
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 * @throws NotFoundError if requested resource is not found
 */
export async function handleMarketTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "market_get_assets_details") {
            const params: any = {};
            if (args.include_testnet !== undefined) params.includeTestnet = args.include_testnet;
            if (args.show_exchange !== undefined) params.showExchange = args.show_exchange;

            const requestContext: any = {
                include_testnet: args.include_testnet ?? false,
                show_exchange: args.show_exchange ?? false,
            };

            // If symbol is provided, get specific asset details
            if (args.symbol) {
                validateSymbol(args.symbol);
                const symbol = normalizeSymbol(args.symbol);
                requestContext.symbol = symbol;
                const data = await bit2meRequest("GET", `/v2/currency/assets/${encodeURIComponent(symbol)}`, params);
                // For single asset, wrap in object and extract first item
                const asArray = mapAssetsResponse({ [symbol]: data });
                const contextual = buildSimpleContextualResponse(requestContext, asArray[0], data);
                return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
            }

            // If no symbol, get all assets
            const cacheKey = `market_assets:${JSON.stringify(params)}`;
            const cachedData = cache.get(cacheKey);

            let data;
            if (cachedData) {
                data = cachedData;
            } else {
                data = await bit2meRequest("GET", "/v2/currency/assets", params);
                cache.set(cacheKey, data, CacheCategory.STATIC); // 1 hour cache
            }

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

        throw new Error(`Unknown market tool: ${name}`);
    });
}
