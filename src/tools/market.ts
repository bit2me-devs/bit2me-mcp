/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { BIT2ME_GATEWAY_URL } from "../config.js";
import { getTicker } from "../services/bit2me.js";
import {
    mapTickerResponse,
    mapAssetsResponse,
    mapMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
    mapCandlesResponse,
} from "../utils/response-mappers.js";

const BIT2ME_BASE_URL = BIT2ME_GATEWAY_URL;

export const marketTools: Tool[] = [
    {
        name: "market_get_ticker",
        description: "Gets current price, 24h volume, market highs and lows.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Crypto symbol (e.g., BTC, ETH, DOGE)" },
                currency: { type: "string", description: "Base currency (e.g., EUR, USD)", default: "EUR" },
            },
            required: ["symbol"],
        },
    },
    {
        name: "market_get_chart",
        description: "Gets price history (candles/chart) with timestamp, USD price, and Fiat price.",
        inputSchema: {
            type: "object",
            properties: {
                ticker: { type: "string", description: "Pair (e.g., BTC/EUR)" },
                timeframe: { type: "string", enum: ["one-hour", "one-day", "one-week", "one-month", "one-year"] },
            },
            required: ["ticker", "timeframe"],
        },
    },
    {
        name: "market_get_assets",
        description: "Gets all available assets.",
        inputSchema: {
            type: "object",
            properties: {
                includeTestnet: { type: "boolean", description: "Include testnet assets" },
                showExchange: { type: "boolean", description: "Include exchange property" },
            },
        },
    },
    {
        name: "market_get_asset_details",
        description: "Gets details of a specific asset by its symbol.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Asset symbol (e.g., BTC, ETH)" },
                showExchange: { type: "boolean", description: "Include exchange property" },
            },
            required: ["symbol"],
        },
    },
    {
        name: "market_get_config",
        description: "Gets market configuration (precision, minimums, status).",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by market symbol (e.g., BTC/EUR)" },
            },
        },
    },
    {
        name: "market_get_order_book",
        description: "Gets the order book for a market.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Market symbol (e.g., BTC/EUR)" },
            },
            required: ["symbol"],
        },
    },
    {
        name: "market_get_public_trades",
        description: "Gets the latest public trades for a market.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Market symbol (e.g., BTC/EUR)" },
                limit: { type: "number", description: "Result limit (max 100)" },
                sort: { type: "string", enum: ["ASC", "DESC"], description: "Sort order" },
            },
            required: ["symbol"],
        },
    },
    {
        name: "market_get_candles",
        description: "Gets OHLCV candles for Trading Pro.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Market symbol (e.g., BTC/EUR)" },
                timeframe: {
                    type: "string",
                    enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"],
                    description: "Timeframe",
                },
                limit: { type: "number", description: "Candle limit" },
            },
            required: ["symbol", "timeframe"],
        },
    },
];

export async function handleMarketTool(name: string, args: any) {
    if (name === "market_get_ticker") {
        const currency = (args.currency || "EUR").toUpperCase();
        const symbol = args.symbol.toUpperCase();

        try {
            const tickerData = await getTicker(symbol, currency);
            if (tickerData) {
                const optimized = mapTickerResponse(tickerData);
                return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
            }
            return { content: [{ type: "text", text: "Ticker not found" }] };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error fetching ticker: ${error.message}` }] };
        }
    }

    if (name === "market_get_chart") {
        try {
            const res = await axios.get(`${BIT2ME_BASE_URL}/v3/currency/chart`, {
                params: { ticker: args.ticker, temporality: args.timeframe },
            });

            // Process chart data to make it more readable
            // API Format: [timestamp, usdPerUnit, eurUsdRate]
            // usdPerUnit: how many USD is 1 unit of crypto worth (e.g., 0.00001 = $100,000 per BTC)
            // eurUsdRate: EUR/USD conversion rate (e.g., 0.86 = 1 EUR = 0.86 USD)

            const rawData = Array.isArray(res.data) ? res.data.slice(-30) : [];

            if (rawData.length === 0) {
                return { content: [{ type: "text", text: JSON.stringify({ error: "No data available" }) }] };
            }

            const [, fiat] = args.ticker.split("/");

            const processedData = rawData.map((entry: any[]) => {
                const timestamp = entry[0];
                const usdPerUnit = entry[1];
                const eurUsdRate = entry[2] || 1; // Default to 1 if not provided

                // Calculate price in USD: 1 / usdPerUnit
                const priceUSD = 1 / usdPerUnit;

                // Calculate price in target currency
                let priceFiat = priceUSD;
                if (fiat === "EUR") {
                    priceFiat = priceUSD * eurUsdRate;
                }

                return {
                    timestamp: timestamp,
                    date: new Date(timestamp).toISOString().split("T")[0],
                    price_usd: parseFloat(priceUSD.toFixed(2)),
                    price_fiat: parseFloat(priceFiat.toFixed(2)),
                    currency: fiat,
                };
            });

            return { content: [{ type: "text", text: JSON.stringify(processedData, null, 2) }] };
        } catch (error: any) {
            // If processing fails, return error with more context
            const errorMsg = error.response?.data || error.message;
            throw new Error(`Error in get_crypto_chart: ${JSON.stringify(errorMsg)}`);
        }
    }

    if (name === "market_get_assets") {
        const params: any = {};
        if (args.includeTestnet !== undefined) params.includeTestnet = args.includeTestnet;
        if (args.showExchange !== undefined) params.showExchange = args.showExchange;

        const res = await axios.get(`${BIT2ME_BASE_URL}/v2/currency/assets`, { params });
        const optimized = mapAssetsResponse(res.data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "market_get_asset_details") {
        const params: any = {};
        if (args.showExchange !== undefined) params.showExchange = args.showExchange;

        const res = await axios.get(`${BIT2ME_BASE_URL}/v2/currency/assets/${args.symbol}`, { params });
        // For single asset, wrap in object and extract first item
        const asArray = mapAssetsResponse({ [args.symbol]: res.data });
        return { content: [{ type: "text", text: JSON.stringify(asArray[0], null, 2) }] };
    }

    if (name === "market_get_config") {
        const params: any = {};
        if (args.symbol) params.symbol = args.symbol;
        const res = await axios.get(`${BIT2ME_BASE_URL}/v1/trading/market-config`, { params });
        const optimized = mapMarketConfigResponse(res.data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "market_get_order_book") {
        const res = await axios.get(`${BIT2ME_BASE_URL}/v2/trading/order-book`, { params: { symbol: args.symbol } });
        const optimized = mapOrderBookResponse(res.data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "market_get_public_trades") {
        const params: any = { symbol: args.symbol };
        if (args.limit) params.limit = args.limit;
        if (args.sort) params.sort = args.sort;
        const res = await axios.get(`${BIT2ME_BASE_URL}/v1/trading/trade/last`, { params });
        const optimized = mapPublicTradesResponse(res.data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "market_get_candles") {
        const params: any = { symbol: args.symbol, timeframe: args.timeframe };
        if (args.limit) params.limit = args.limit;
        const res = await axios.get(`${BIT2ME_BASE_URL}/v1/trading/candle`, { params });
        const optimized = mapCandlesResponse(res.data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown market tool: ${name}`);
}
