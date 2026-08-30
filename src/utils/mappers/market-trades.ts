import { ValidationError } from "../errors.js";
import { smartRound, formatTimestamp, normalizePairResponse } from "../format.js";
import { DEFAULT_AMOUNT, DEFAULT_STRING } from "../../constants.js";
import { asFiniteNumber, asRecord, asString, asTime, firstDefined, isValidArray, isValidObject } from "./guards.js";
import type { PublicTradeResponse, CandleResponse, CurrencyRateResponse } from "../schemas.js";

export function mapPublicTradesResponse(raw: unknown): PublicTradeResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((trade, index) => {
        if (Array.isArray(trade)) {
            const side = asString(trade[0], "buy").toLowerCase() as "buy" | "sell";
            const price = trade[1] || 0;
            const amount = trade[2] || 0;
            const timestamp = asTime(trade[3]) ?? Date.now();
            const { date } = formatTimestamp(timestamp);

            return {
                id: `trade-${index}-${timestamp}`,
                pair: DEFAULT_STRING,
                price: smartRound(asFiniteNumber(price)).toString(),
                amount: smartRound(asFiniteNumber(amount)).toString(),
                side,
                date,
            };
        }

        const row = asRecord(trade);
        const timestamp = asTime(firstDefined(row, "timestamp", "time")) ?? Date.now();
        const { date } = formatTimestamp(timestamp);
        return {
            id: asString(firstDefined(row, "id", "tradeId"), `trade-${index}`),
            pair: normalizePairResponse(asString(firstDefined(row, "symbol", "pair"), DEFAULT_STRING)),
            price: smartRound(asFiniteNumber(row.price)).toString(),
            amount: smartRound(asFiniteNumber(firstDefined(row, "amount", "quantity"))).toString(),
            side: asString(firstDefined(row, "side", "takerSide"), "buy").toLowerCase() as "buy" | "sell",
            date,
        };
    });
}

function candleField(candle: unknown, key: string, index: number): unknown {
    if (Array.isArray(candle)) return candle[index];
    return asRecord(candle)[key];
}

export function mapCandlesResponse(raw: unknown): CandleResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((candle) => {
        const timestamp = asTime(candleField(candle, "timestamp", 0)) ?? Date.now();
        const { date } = formatTimestamp(timestamp);
        return {
            date,
            open: smartRound(asFiniteNumber(candleField(candle, "open", 1) ?? DEFAULT_AMOUNT)).toString(),
            high: smartRound(asFiniteNumber(candleField(candle, "high", 2) ?? DEFAULT_AMOUNT)).toString(),
            low: smartRound(asFiniteNumber(candleField(candle, "low", 3) ?? DEFAULT_AMOUNT)).toString(),
            close: smartRound(asFiniteNumber(candleField(candle, "close", 4) ?? DEFAULT_AMOUNT)).toString(),
            volume: (candleField(candle, "volume", 5) ?? DEFAULT_AMOUNT) as string | number,
        };
    });
}

export function mapCurrencyRateResponse(
    raw: unknown,
    quote_symbol: string = "EUR",
    base_symbol?: string
): CurrencyRateResponse[] {
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new ValidationError("Invalid currency rate response structure");
    }

    const data = asRecord(raw[0]);
    if (!data.crypto || !isValidObject(data.crypto)) {
        throw new ValidationError("Invalid currency rate response structure");
    }

    const cryptoRates = asRecord(data.crypto);
    const fiatRates = asRecord(data.fiat);
    const fiatRate = asFiniteNumber(fiatRates[quote_symbol], 1);

    const results: CurrencyRateResponse[] = [];

    const processSymbol = (base_sym: string, cryptoRate: number) => {
        if (!cryptoRate) return;

        const price = fiatRate / cryptoRate;
        const { date } = formatTimestamp(Date.now());
        results.push({
            base_symbol: base_sym,
            price: smartRound(price).toString(),
            quote_symbol: quote_symbol,
            date,
        });
    };

    if (base_symbol) {
        const rate = asFiniteNumber(cryptoRates[base_symbol]);
        if (rate) processSymbol(base_symbol, rate);
    } else {
        for (const [base_sym, rate] of Object.entries(cryptoRates)) {
            processSymbol(base_sym, asFiniteNumber(rate));
        }
    }

    return results;
}
