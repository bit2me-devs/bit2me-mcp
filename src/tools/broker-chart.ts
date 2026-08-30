import { bit2meRequest } from "../services/bit2me.js";
import { CacheCategory, cache, cacheKey } from "../utils/cache.js";
import { buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { smartRound, formatTimestamp, normalizePair, validatePair, convertBrokerTimeframe } from "../utils/format.js";
import { Bit2MeAPIError, NotFoundError, ValidationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { getCorrelationId } from "../utils/context.js";

export async function handleBrokerGetAssetChart(args: Record<string, unknown>) {
    if (typeof args.pair !== "string" || !args.pair) {
        throw new ValidationError("pair is required", "pair");
    }
    if (typeof args.timeframe !== "string" || !args.timeframe) {
        throw new ValidationError("timeframe is required", "timeframe");
    }
    validatePair(args.pair);
    try {
        const pair = normalizePair(args.pair);
        // Convert trading notation (1h, 1d, etc.) to API format (one-hour, one-day, etc.)
        const apiTimeframe = convertBrokerTimeframe(args.timeframe);

        // Convert pair format from BTC-EUR to BTC/EUR for API
        const [base_symbol, quote_symbol] = pair.split("-");
        if (!base_symbol || !quote_symbol) {
            throw new ValidationError(
                `Invalid pair format: ${pair}. Expected format: SYMBOL-QUOTE (e.g., BTC-USD, BTC-EUR)`,
                "pair",
                pair
            );
        }
        const apiTicker = `${base_symbol}/${quote_symbol}`;

        // Build query params
        const queryString = `ticker=${encodeURIComponent(apiTicker).replace(/%2F/g, "/")}&temporality=${encodeURIComponent(apiTimeframe)}`;

        // Use bit2meRequest with manually constructed query string in endpoint.
        // The chart endpoint requires the literal "/" character inside
        // `ticker` (e.g. `BTC/EUR`), which `URLSearchParams` would
        // percent-encode, so we cannot route through `cachedGet`. We
        // still apply Cache-Aside manually with a stable key
        // and the MARKET_DATA TTL (30s).
        const chartCacheKey = cacheKey(["/v3/currency/chart", { ticker: apiTicker, temporality: apiTimeframe }]);
        let rawData = cache.get<unknown[]>(chartCacheKey, CacheCategory.MARKET_DATA);
        if (rawData === null) {
            rawData = await bit2meRequest<unknown[]>("GET", `/v3/currency/chart?${queryString}`, undefined);
            cache.set(chartCacheKey, rawData, CacheCategory.MARKET_DATA);
        }

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

        const processedData = data.map((entry) => {
            const row = Array.isArray(entry) ? entry : [];
            const timestamp = row[0];
            const usdPerUnit = Number(row[1]);
            const eurUsdRate = Number(row[2] ?? 1);

            // Calculate price in USD: 1 / usdPerUnit
            const priceUSD = 1 / usdPerUnit;

            // Calculate price in target currency
            let priceFiat = priceUSD;
            if (quote_symbol === "EUR") {
                priceFiat = priceUSD * eurUsdRate;
            }

            const { date } = formatTimestamp(
                typeof timestamp === "number" || typeof timestamp === "string" ? timestamp : undefined
            );

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
    } catch (error: unknown) {
        if (error instanceof Bit2MeAPIError || error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        // Never echo `error.response?.data` (or any upstream payload) back
        // to the caller: it may carry pocket ids, trade ids and other
        // account-specific identifiers. The verbose detail stays in the
        // server log; the client receives the generic public message
        // produced by `Bit2MeAPIError`.
        const internal = error instanceof Error ? error.message : String(error);
        logger.error("broker_get_asset_chart processing failed", {
            error: internal,
            correlationId: getCorrelationId(),
        });
        throw new Bit2MeAPIError(500, internal, "/v3/currency/chart");
    }
}
