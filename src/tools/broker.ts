/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest, getTicker } from "../services/bit2me.js";
import {
    mapTickerResponse,
    mapCurrencyRateResponse,
    mapProformaResponse,
    mapOperationConfirmationResponse,
    mapWalletCardsResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import {
    MarketTickerArgs,
    WalletBuyCryptoArgs,
    WalletSellCryptoArgs,
    WalletSwapCryptoArgs,
    WalletConfirmOperationArgs,
    WalletCardsArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import {
    smartRound,
    formatTimestamp,
    normalizeSymbol,
    normalizePair,
    validatePair,
    validateSymbol,
    validateFiat,
    validateUUID,
    convertBrokerTimeframe,
    validatePaginationLimit,
    validatePaginationOffset,
} from "../utils/format.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const brokerTools: Tool[] = getCategoryTools("broker");

/**
 * Handles broker-related tool requests (simple trading and broker prices)
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 * @throws NotFoundError if requested resource is not found
 */
export async function handleBrokerTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "broker_get_price") {
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

        if (name === "broker_get_info") {
            const typedArgs = args as MarketTickerArgs;
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

        if (name === "broker_get_chart") {
            if (!args.pair) {
                throw new ValidationError("pair is required", "pair");
            }
            if (!args.timeframe) {
                throw new ValidationError("timeframe is required", "timeframe");
            }
            validatePair(args.pair);
            try {
                const pair = normalizePair(args.pair);
                // Convert trading notation (1h, 1d, etc.) to API format (one-hour, one-day, etc.)
                const apiTimeframe = convertBrokerTimeframe(args.timeframe);

                // Convert pair format from BTC-EUR to BTC[EUR] for API
                const [base_symbol, quote_symbol] = pair.split("-");
                if (!base_symbol || !quote_symbol) {
                    throw new ValidationError(
                        `Invalid pair format: ${pair}. Expected format: SYMBOL-QUOTE (e.g., BTC-USD, BTC-EUR)`,
                        "pair",
                        pair
                    );
                }
                const apiTicker = `${base_symbol}[${quote_symbol}]`;

                // Build query params manually to avoid URLSearchParams encoding brackets
                // The API expects ticker=BTC[EUR] not ticker=BTC%5BEUR%5D
                // We need to manually construct the query string to preserve brackets
                const queryString = `ticker=${encodeURIComponent(apiTicker).replace(/%5B/g, "[").replace(/%5D/g, "]")}&temporality=${encodeURIComponent(apiTimeframe)}`;

                // Use bit2meRequest with manually constructed query string in endpoint
                const rawData = await bit2meRequest<any[]>("GET", `/v3/currency/chart?${queryString}`, undefined);

                // Process chart data to make it more readable
                // API Format: [timestamp, usdPerUnit, eurUsdRate]
                // usdPerUnit: how many USD is 1 unit of crypto worth (e.g., 0.00001 = $100,000 per BTC)
                // eurUsdRate: EUR/USD conversion rate (e.g., 0.86 = 1 EUR = 0.86 USD)

                const data = Array.isArray(rawData) ? rawData : [];
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
                throw new Error(`Error in broker_get_chart: ${JSON.stringify(errorMsg)}`);
            }
        }

        if (name === "broker_quote_buy") {
            const params = args as WalletBuyCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "buy",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "broker_quote_sell") {
            const params = args as WalletSellCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "sell",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "broker_quote_swap") {
            const params = args as WalletSwapCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "purchase",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "broker_confirm_quote") {
            const params = args as WalletConfirmOperationArgs;
            const requestContext = {
                proforma_id: params.proforma_id,
            };
            const body = { proforma: params.proforma_id };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction", body);
            const optimized = mapOperationConfirmationResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_get_cards") {
            const params = args as WalletCardsArgs;
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {};
            if (params.card_id) {
                validateUUID(params.card_id, "card_id");
                queryParams.id = params.card_id;
            }
            queryParams.limit = limit;
            queryParams.offset = offset;

            const data = await bit2meRequest("GET", "/v1/teller/card", queryParams);
            const optimized = mapWalletCardsResponse(data);

            // Extract total from response if available, otherwise use array length
            const rawData = data as any;
            const totalRecords = rawData.total || rawData.metadata?.total || optimized.length;

            const requestContext: any = {
                limit,
                offset,
            };
            if (params.card_id) {
                requestContext.card_id = params.card_id;
            }

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: totalRecords,
                    limit,
                    offset,
                    has_more: offset + limit < totalRecords,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown broker tool: ${name}`);
    });
}
