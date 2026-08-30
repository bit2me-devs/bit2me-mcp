import { logger } from "../utils/logger.js";
import { bit2meRequest } from "./bit2me.js";

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function readPrice(ticker: unknown): number {
    const price = asRecord(ticker)?.price;
    if (typeof price === "number" && Number.isFinite(price)) return price;
    if (typeof price === "string") return parseFloat(price) || 0;
    return 0;
}

/**
 * Current market price for portfolio valuation. Same-currency pairs
 * return 1; exotic / LP symbols without a public ticker return 0.
 */
export async function getMarketPrice(cryptoSymbol: string, fiatCurrency: string): Promise<number> {
    if (cryptoSymbol.toUpperCase() === fiatCurrency.toUpperCase()) return 1;

    if (cryptoSymbol.length > 5 && !cryptoSymbol.includes("TEST")) return 0;

    try {
        return readPrice(await getTicker(cryptoSymbol, fiatCurrency));
    } catch (error: unknown) {
        logger.debug(`Failed to get price for ${cryptoSymbol}/${fiatCurrency}`, {
            error: error instanceof Error ? error.message : String(error),
        });
        return 0;
    }
}

/**
 * Full ticker for a pair. Public market data — cached for a short TTL
 * so the portfolio aggregator does not re-fetch every symbol.
 */
export async function getTicker(cryptoSymbol: string, fiatCurrency: string): Promise<unknown> {
    const { cache, CacheCategory } = await import("../utils/cache.js");
    const cacheKey = `ticker:${cryptoSymbol.toUpperCase()}:${fiatCurrency.toUpperCase()}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached !== null) {
        return cached;
    }
    const response = await bit2meRequest("GET", `/v3/currency/ticker/${cryptoSymbol}`, {
        rateCurrency: fiatCurrency,
    });
    // Structure is { "EUR": { "BTC": [ { price: "..." } ] } }
    const pair = asRecord(asRecord(response)?.[fiatCurrency])?.[cryptoSymbol];
    const ticker = Array.isArray(pair) ? pair[0] : undefined;
    if (ticker) {
        cache.set(cacheKey, ticker, CacheCategory.MARKET_DATA);
    }
    return ticker;
}
