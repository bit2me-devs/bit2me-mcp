import { ValidationError } from "../errors.js";
import { validateResponse, MarketTickerRawSchema } from "../response-validators.js";
import { smartRound, formatTimestamp, normalizeNetwork, normalizePairResponse } from "../format.js";
import { DEFAULT_AMOUNT, DEFAULT_STRING, DEFAULT_ARRAY } from "../../constants.js";
import {
    asFiniteNumber,
    asRecord,
    asString,
    asTime,
    firstDefined,
    isValidAssetRecord,
    isValidObject,
} from "./guards.js";
import type { MarketTickerResponse, MarketAssetResponse, MarketOrderBookResponse } from "../schemas.js";

export function mapTickerResponse(raw: unknown, base_symbol: string, quote_symbol: string): MarketTickerResponse {
    const validated = validateResponse(MarketTickerRawSchema, raw, "ticker response");

    const timeValue =
        validated.time instanceof Date
            ? validated.time.getTime()
            : typeof validated.time === "string"
              ? validated.time
              : validated.time || Date.now();
    const { date } = formatTimestamp(timeValue);
    const priceValue = typeof validated.price === "string" ? parseFloat(validated.price) : validated.price;

    const marketCapValue =
        typeof validated.marketCap === "string" ? parseFloat(validated.marketCap) : validated.marketCap;
    const volumeValue =
        typeof validated.totalVolume === "string" ? parseFloat(validated.totalVolume) : validated.totalVolume;

    return {
        base_symbol,
        quote_symbol,
        date,
        price: smartRound(priceValue).toString(),
        market_cap: marketCapValue ? smartRound(marketCapValue).toString() : "0",
        volume_24h: volumeValue ? smartRound(volumeValue).toString() : "0",
        max_supply: validated.maxSupply?.toString(),
        total_supply: validated.totalSupply?.toString(),
    };
}

export function mapAssetsResponse(raw: unknown): MarketAssetResponse[] {
    if (!isValidAssetRecord(raw)) {
        throw new ValidationError("Invalid assets response structure");
    }
    return Object.entries(raw).map(([symbol, assetVal]) => {
        const asset = asRecord(assetVal);
        let normalizedType: "crypto" | "fiat" = "crypto";
        if (asset.assetType === "fiat") {
            normalizedType = "fiat";
        }

        const normalizedSymbol = symbol.toUpperCase();
        const pairsWith = Array.isArray(asset.pairsWith) ? asset.pairsWith : DEFAULT_ARRAY;

        const pro_trading_pairs = pairsWith
            .map((quoteSymbol) => {
                const quote = asString(quoteSymbol).toUpperCase();
                return quote ? `${normalizedSymbol}-${quote}` : "";
            })
            .filter((pair) => pair !== "");

        return {
            symbol: normalizedSymbol,
            name: asString(asset.name),
            type: normalizedType,
            network: normalizeNetwork(asString(asset.network)),
            enabled: Boolean(asset.enabled),
            tradeable: Boolean(asset.ticker),
            loanable: Boolean(asset.loanable),
            pro_trading_pairs,
        };
    });
}

function mapBookLevel(entry: unknown): { price: string; amount: string } {
    if (Array.isArray(entry)) {
        return {
            price: smartRound(asFiniteNumber(entry[0] ?? DEFAULT_AMOUNT)).toString(),
            amount: asString(entry[1], DEFAULT_AMOUNT),
        };
    }
    const level = asRecord(entry);
    return {
        price: smartRound(asFiniteNumber(firstDefined(level, "price") ?? DEFAULT_AMOUNT)).toString(),
        amount: asString(firstDefined(level, "amount"), DEFAULT_AMOUNT),
    };
}

export function mapOrderBookResponse(raw: unknown): MarketOrderBookResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid order book response structure");
    }

    const timestamp = asTime(raw.timestamp) ?? Date.now();
    const { date } = formatTimestamp(timestamp);
    const bids = Array.isArray(raw.bids) ? raw.bids : [];
    const asks = Array.isArray(raw.asks) ? raw.asks : [];

    return {
        pair: normalizePairResponse(asString(firstDefined(raw, "symbol", "pair"), DEFAULT_STRING)),
        bids: bids.map(mapBookLevel),
        asks: asks.map(mapBookLevel),
        date,
    };
}
