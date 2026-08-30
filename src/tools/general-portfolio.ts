import { Decimal } from "decimal.js";
import { bit2meRequest, getMarketPrice } from "../services/bit2me.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { normalizeSymbol, validateSymbol, smartRound } from "../utils/format.js";
import { CacheCategory, cache, cacheKey } from "../utils/cache.js";
import { MIN_DUST_VALUE, PORTFOLIO_REQUEST_TIMEOUT } from "../constants.js";
import { PortfolioValuationArgs } from "../utils/args.js";

function toDecimal(value: unknown): Decimal {
    if (value === undefined || value === null) return new Decimal(0);
    try {
        const d = new Decimal(typeof value === "string" ? value : String(value));
        if (!d.isFinite() || d.isNegative()) return new Decimal(0);
        return d;
    } catch {
        return new Decimal(0);
    }
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    const nested = asRecord(value).data;
    return Array.isArray(nested) ? nested : [];
}

function errorName(reason: unknown): string | undefined {
    const name = asRecord(reason).name;
    return typeof name === "string" ? name : undefined;
}

function errorMessage(reason: unknown): string {
    const message = asRecord(reason).message;
    return typeof message === "string" ? message : "Unknown";
}

function addBalance(assets: Record<string, Decimal>, symbol: unknown, amount: unknown): void {
    if (typeof symbol !== "string" || !symbol) return;
    const val = toDecimal(amount);
    if (val.gt(0)) {
        assets[symbol] = (assets[symbol] ?? new Decimal(0)).plus(val);
    }
}

function serviceTotal(
    items: unknown[],
    amountOf: (row: Record<string, unknown>) => unknown,
    prices: Record<string, Decimal>
): Decimal {
    let total = new Decimal(0);
    for (const item of items) {
        const row = asRecord(item);
        const val = toDecimal(amountOf(row));
        const symbol = row.currency ?? row.guaranteeCurrency;
        const price = typeof symbol === "string" ? (prices[symbol] ?? new Decimal(0)) : new Decimal(0);
        if (val.gt(0)) total = total.plus(val.mul(price));
    }
    return total;
}

function resolveQuoteSymbol(args: PortfolioValuationArgs): string {
    const raw =
        typeof args.quote_symbol === "string" && args.quote_symbol
            ? args.quote_symbol
            : typeof args.fiat_symbol === "string" && args.fiat_symbol
              ? args.fiat_symbol
              : "EUR";
    validateSymbol(raw);
    return normalizeSymbol(raw);
}

export async function handlePortfolioGetValuation(args: Record<string, unknown>) {
    const params = args as unknown as PortfolioValuationArgs;
    const quote_symbol = resolveQuoteSymbol(params);
    const forceRefresh = params.force_refresh === true;
    const portfolioCacheKey = cacheKey(["portfolio_get_valuation", { quote_symbol }]);
    if (!forceRefresh) {
        const cached = cache.get<{ content: Array<{ type: string; text: string }> }>(
            portfolioCacheKey,
            CacheCategory.BALANCE
        );
        if (cached) {
            return cached;
        }
    }

    const results = await Promise.allSettled([
        bit2meRequest("GET", "/v1/wallet/pocket", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT),
        bit2meRequest("GET", "/v1/trading/wallet/balance", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT),
        bit2meRequest("GET", "/v2/earn/wallets", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT),
        bit2meRequest("GET", "/v1/loan/orders", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT),
    ]);

    const authErrors = results.filter((r) => r.status === "rejected" && errorName(r.reason) === "AuthenticationError");
    if (authErrors.length > 0) {
        throw (authErrors[0] as PromiseRejectedResult).reason;
    }

    if (results.every((r) => r.status === "rejected")) {
        const firstError = (results[0] as PromiseRejectedResult).reason;
        throw new Error(
            "All API calls failed. This usually indicates invalid or missing API credentials. " +
                "Please verify your BIT2ME_API_KEY and BIT2ME_API_SECRET (or jwt parameter) are correct." +
                ` Original error: ${errorMessage(firstError)}`
        );
    }

    const wallet = results[0].status === "fulfilled" ? results[0].value : [];
    const pro = results[1].status === "fulfilled" ? results[1].value : [];
    const earn = results[2].status === "fulfilled" ? results[2].value : [];
    const loans = results[3].status === "fulfilled" ? results[3].value : {};

    const assets: Record<string, Decimal> = {};
    for (const p of asList(wallet)) {
        const row = asRecord(p);
        addBalance(assets, row.currency, row.balance);
    }
    for (const w of asList(pro)) {
        const row = asRecord(w);
        addBalance(assets, row.currency, row.balance);
    }
    for (const e of asList(earn)) {
        const row = asRecord(e);
        addBalance(assets, row.currency, row.totalBalance ?? row.balance);
    }
    for (const l of asList(loans)) {
        const row = asRecord(l);
        addBalance(assets, row.guaranteeCurrency, row.guaranteeAmount);
    }

    const uniqueSymbols = Object.keys(assets);
    const prices = await Promise.all(uniqueSymbols.map((s) => getMarketPrice(s, quote_symbol)));
    const priceMap: Record<string, Decimal> = {};
    uniqueSymbols.forEach((symbol, idx) => {
        priceMap[symbol] = toDecimal(prices[idx]);
    });

    const breakdown: { symbol: string; balance: Decimal; priceUnit: Decimal; convertedBalance: Decimal }[] = [];
    let totalVal = new Decimal(0);
    uniqueSymbols.forEach((symbol) => {
        const price = priceMap[symbol] ?? new Decimal(0);
        const amount = assets[symbol] ?? new Decimal(0);
        const val = amount.mul(price);
        totalVal = totalVal.plus(val);
        if (val.gt(MIN_DUST_VALUE) && amount.gt(0)) {
            breakdown.push({ symbol, balance: amount, priceUnit: price, convertedBalance: val.toDecimalPlaces(2) });
        }
    });
    breakdown.sort((a, b) => b.convertedBalance.comparedTo(a.convertedBalance));

    const walletTotal = serviceTotal(asList(wallet), (r) => r.balance, priceMap);
    const proTotal = serviceTotal(asList(pro), (r) => r.balance, priceMap);
    const earnTotal = serviceTotal(asList(earn), (r) => r.totalBalance ?? r.balance, priceMap);
    const loanGuaranteeTotal = serviceTotal(asList(loans), (r) => r.guaranteeAmount, priceMap);

    const result = {
        quote_symbol,
        total_balance: smartRound(totalVal.toNumber()).toString(),
        by_service: {
            wallet_balance: smartRound(walletTotal.toNumber()).toString(),
            pro_balance: smartRound(proTotal.toNumber()).toString(),
            earn_balance: smartRound(earnTotal.toNumber()).toString(),
            loan_guarantees_balance: smartRound(loanGuaranteeTotal.toNumber()).toString(),
        },
        details: breakdown.map((item) => ({
            symbol: item.symbol,
            balance: item.balance.toString(),
            price_unit: smartRound(item.priceUnit.toNumber()).toString(),
            converted_balance: smartRound(item.convertedBalance.toNumber()).toString(),
        })),
    };

    const contextual = buildSimpleContextualResponse({ quote_symbol }, result, { wallet, pro, earn, loans });
    const response = { content: [{ type: "text" as const, text: JSON.stringify(contextual, null, 2) }] };
    cache.set(portfolioCacheKey, response, CacheCategory.BALANCE);
    return response;
}
