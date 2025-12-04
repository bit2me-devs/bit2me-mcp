/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest, getTicker } from "../services/bit2me.js";
import { mapTickerResponse, mapAssetsResponse, mapCurrencyRateResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { MarketTickerArgs } from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { cache } from "../utils/cache.js";
import {
    smartRound,
    formatTimestamp,
    normalizeSymbol,
    normalizePair,
    validatePair,
    validateSymbol,
    validateFiat,
} from "../utils/format.js";
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
        if (name === "market_get_data") {
            const typedArgs = args as MarketTickerArgs; // This type is still correct for market_get_data
            if (!typedArgs.base_symbol) {
                throw new ValidationError("base_symbol is required", "base_symbol");
            }
            validateSymbol(args.base_symbol);
            const quote_symbol = normalizeSymbol(args.quote_symbol || "EUR");
            if (args.quote_symbol) {
                validateFiat(args.quote_symbol);
            }
            const base_symbol = normalizeSymbol(args.base_symbol);

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
            } catch (error: any) {
                if (error instanceof NotFoundError) {
                    throw error;
                }
                throw new Error(`Error fetching ticker: ${error.message}`);
            }
        }

        if (name === "market_get_chart") {
            if (!args.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            if (!args.timeframe) {
                throw new ValidationError("timeframe is required", "timeframe");
            }
            validatePair(args.pair);
            try {
                const pair = normalizePair(args.pair);
                const rawData = await bit2meRequest<any[]>("GET", "/v3/currency/chart", {
                    ticker: pair,
                    temporality: args.timeframe,
                });

                // Process chart data to make it more readable
                // API Format: [timestamp, usdPerUnit, eurUsdRate]
                // usdPerUnit: how many USD is 1 unit of crypto worth (e.g., 0.00001 = $100,000 per BTC)
                // eurUsdRate: EUR/USD conversion rate (e.g., 0.86 = 1 EUR = 0.86 USD)

                const data = Array.isArray(rawData) ? rawData : [];
                const [, quote_symbol] = pair.split("/");
                const requestContext = {
                    pair,
                    timeframe: args.timeframe,
                };

                // Return empty array instead of error when no data
                if (data.length === 0) {
                    const contextual = buildFilteredContextualResponse(
                        requestContext,
                        [],
                        {
                            total_records: 0,
                        },
                        rawData
                    );
                    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
                }

                const processedData = data.map((entry: any[]) => {
                    const timestamp = entry[0];
                    const usdPerUnit = entry[1];
                    const eurUsdRate = entry[2] || 1; // Default to 1 if not provided

                    // Calculate price in USD: 1 / usdPerUnit
                    const priceUSD = 1 / usdPerUnit;

                    // Calculate price in target currency
                    let priceFiat = priceUSD;
                    if (quote_symbol === "EUR") {
                        priceFiat = priceUSD * eurUsdRate;
                    }

                    const { date } = formatTimestamp(timestamp);

                    // Use the fiat price as the main price
                    // Remove quote_symbol from individual items since it's in request context
                    return {
                        date,
                        price: smartRound(priceFiat).toString(),
                    };
                });

                const contextual = buildFilteredContextualResponse(
                    requestContext,
                    processedData,
                    {
                        total_records: processedData.length,
                    },
                    rawData
                );
                return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
            } catch (error: any) {
                // If processing fails, return error with more context
                const errorMsg = error.response?.data || error.message;
                throw new Error(`Error in get_crypto_chart: ${JSON.stringify(errorMsg)}`);
            }
        }

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
                cache.set(cacheKey, data, 3600); // 1 hour cache
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

        if (name === "market_get_ticker") {
            const params: any = {};
            if (args.date) params.time = args.date;

            const quote_symbol = normalizeSymbol(args.quote_symbol || "USD");
            const base_symbol = args.base_symbol ? normalizeSymbol(args.base_symbol) : undefined;
            const requestContext: any = {
                quote_symbol,
            };
            if (base_symbol) {
                requestContext.base_symbol = base_symbol;
            }
            if (args.date) {
                requestContext.date = args.date;
            }
            const data = await bit2meRequest("GET", "/v1/currency/rate", params);
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

        throw new Error(`Unknown market tool: ${name}`);
    });
}
