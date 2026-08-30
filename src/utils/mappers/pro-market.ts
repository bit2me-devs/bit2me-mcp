import { smartRound, formatTimestamp } from "../format.js";
import { DEFAULT_AMOUNT, DEFAULT_STRING } from "../../constants.js";
import { asFiniteNumber, asRecord, asString, asTime, firstDefined, isValidArray, isValidObject } from "./guards.js";
import type { ProMarketConfigResponse, ProTickerResponse } from "../schemas.js";

function mapMarketStatus(marketEnabled: unknown): "active" | "inactive" {
    return marketEnabled === "enabled" ? "active" : "inactive";
}

function mapSingleMarketConfig(item: unknown, fallbackPair?: string): ProMarketConfigResponse {
    const config = asRecord(item);
    const rawPair = asString(firstDefined(config, "pair", "symbol"), fallbackPair ?? "UNKNOWN");
    const pair = rawPair.replace("/", "-");

    return {
        id: asString(config.id),
        pair,
        base_precision: asString(firstDefined(config, "amountPrecision", "basePrecision"), "0"),
        quote_precision: asString(firstDefined(config, "pricePrecision", "quotePrecision"), "0"),
        min_amount: asString(config.minAmount, DEFAULT_AMOUNT),
        max_amount: asString(config.maxAmount, DEFAULT_AMOUNT),
        min_price: asString(config.minPrice, DEFAULT_AMOUNT),
        max_price: asString(config.maxPrice, DEFAULT_AMOUNT),
        min_order_size: asString(config.minOrderSize, DEFAULT_AMOUNT),
        tick_size: asString(config.tickSize, DEFAULT_AMOUNT),
        fee_maker: asString(config.feeMakerPercentage, "0"),
        fee_taker: asString(config.feeTakerPercentage, "0"),
        status: mapMarketStatus(config.marketEnabled),
    };
}

export function mapProMarketConfigResponse(raw: unknown): ProMarketConfigResponse[] {
    if (Array.isArray(raw)) {
        return raw.map((config) => mapSingleMarketConfig(config));
    }

    if (isValidObject(raw)) {
        return Object.entries(raw).map(([pair, config]) => mapSingleMarketConfig(config, pair));
    }

    return [];
}

export function mapProTickerResponse(raw: unknown): ProTickerResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const ticker = asRecord(item);
        const timestamp = asTime(ticker.timestamp) ?? Date.now();
        const { date } = formatTimestamp(timestamp);
        return {
            symbol: asString(ticker.symbol, DEFAULT_STRING),
            open: smartRound(asFiniteNumber(ticker.open)).toString(),
            close: smartRound(asFiniteNumber(ticker.close)).toString(),
            bid: smartRound(asFiniteNumber(ticker.bid)).toString(),
            ask: smartRound(asFiniteNumber(ticker.ask)).toString(),
            high: smartRound(asFiniteNumber(ticker.high)).toString(),
            low: smartRound(asFiniteNumber(ticker.low)).toString(),
            baseVolume: smartRound(asFiniteNumber(ticker.baseVolume)).toString(),
            percentage: smartRound(asFiniteNumber(ticker.percentage)).toString(),
            quoteVolume: smartRound(asFiniteNumber(ticker.quoteVolume)).toString(),
            date,
        };
    });
}
