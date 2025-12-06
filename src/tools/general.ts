/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest, getMarketPrice } from "../services/bit2me.js";
import { mapAssetsResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { normalizeSymbol, validateSymbol, smartRound } from "../utils/format.js";
import { cache, CacheCategory } from "../utils/cache.js";
import { MIN_DUST_VALUE, PORTFOLIO_REQUEST_TIMEOUT } from "../constants.js";
import { PortfolioValuationArgs } from "../utils/args.js";
import { performHealthCheck } from "../utils/health.js";

export const generalTools: Tool[] = getCategoryTools("general");

/**
 * Handles general tool requests (assets, portfolio, health)
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 */
export async function handleGeneralTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "general_get_assets_config") {
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
            const cacheKey = `general_assets:${JSON.stringify(params)}`;
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

        if (name === "portfolio_get_valuation") {
            const params = args as PortfolioValuationArgs;
            const quote_symbol = normalizeSymbol(params.quote_symbol || "EUR");

            // 1. Parallel call to all balance services
            const results = await Promise.allSettled([
                bit2meRequest("GET", "/v1/wallet/pocket", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 0
                bit2meRequest("GET", "/v1/trading/wallet/balance", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 1
                bit2meRequest("GET", "/v2/earn/wallets", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 2
                bit2meRequest("GET", "/v1/loan/orders", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 3
            ]);

            const wallet: any = results[0].status === "fulfilled" ? results[0].value : [];
            const pro: any = results[1].status === "fulfilled" ? results[1].value : [];
            const earn: any = results[2].status === "fulfilled" ? results[2].value : [];
            const loans: any = results[3].status === "fulfilled" ? results[3].value : {};

            // Errors are logged but not thrown to allow partial portfolio view

            const assets: Record<string, number> = {};

            // Service-level totals for breakdown
            let walletTotal = 0;
            let proTotal = 0;
            let earnTotal = 0;
            let loanGuaranteeTotal = 0;

            // Process Wallet
            if (Array.isArray(wallet))
                wallet.forEach((p: any) => {
                    const val = parseFloat(p.balance || "0");
                    if (val > 0) {
                        assets[p.currency] = (assets[p.currency] || 0) + val;
                    }
                });

            // Process Pro
            if (Array.isArray(pro))
                pro.forEach((w: any) => {
                    const val = parseFloat(w.balance || "0");
                    if (val > 0) {
                        assets[w.currency] = (assets[w.currency] || 0) + val;
                    }
                });

            // Process Earn
            // /v2/earn/wallets returns { total, data: [...] } structure
            const earnPositions = Array.isArray(earn) ? earn : earn?.data || [];
            if (Array.isArray(earnPositions))
                earnPositions.forEach((e: any) => {
                    // Support both totalBalance (legacy/mapped) and balance (raw v2)
                    const val = parseFloat(e.totalBalance || e.balance || "0");
                    if (val > 0) {
                        assets[e.currency] = (assets[e.currency] || 0) + val;
                    }
                });

            // Process Loans
            if (loans?.data && Array.isArray(loans.data))
                loans.data.forEach((l: any) => {
                    const val = parseFloat(l.guaranteeAmount || "0");
                    if (val > 0) {
                        assets[l.guaranteeCurrency] = (assets[l.guaranteeCurrency] || 0) + val;
                    }
                });

            // 2. Valuation
            const uniqueSymbols = Object.keys(assets);
            const prices = await Promise.all(uniqueSymbols.map((s) => getMarketPrice(s, quote_symbol)));

            const breakdown: any[] = [];
            let totalVal = 0;

            uniqueSymbols.forEach((symbol, idx) => {
                const price = prices[idx];
                const amount = assets[symbol];
                const val = amount * price;
                totalVal += val;

                // Filter out dust values and zero amounts
                if (val > MIN_DUST_VALUE && amount > 0) {
                    breakdown.push({
                        symbol: symbol,
                        balance: amount,
                        price_unit: smartRound(price),
                        converted_balance: parseFloat(val.toFixed(2)),
                    });
                }
            });

            breakdown.sort((a, b) => b.converted_balance - a.converted_balance);

            // Calculate service totals from raw data and prices
            const priceMap: Record<string, number> = {};
            uniqueSymbols.forEach((symbol, idx) => {
                priceMap[symbol] = prices[idx];
            });

            if (Array.isArray(wallet))
                wallet.forEach((p: any) => {
                    const val = parseFloat(p.balance || "0");
                    const price = priceMap[p.currency] || 0;
                    if (val > 0) walletTotal += val * price;
                });

            if (Array.isArray(pro))
                pro.forEach((w: any) => {
                    const val = parseFloat(w.balance || "0");
                    const price = priceMap[w.currency] || 0;
                    if (val > 0) proTotal += val * price;
                });

            const earnPositionsForTotal = Array.isArray(earn) ? earn : earn?.data || [];
            if (Array.isArray(earnPositionsForTotal))
                earnPositionsForTotal.forEach((e: any) => {
                    const val = parseFloat(e.totalBalance || e.balance || "0");
                    const price = priceMap[e.currency] || 0;
                    if (val > 0) earnTotal += val * price;
                });

            if (loans?.data && Array.isArray(loans.data))
                loans.data.forEach((l: any) => {
                    const val = parseFloat(l.guaranteeAmount || "0");
                    const price = priceMap[l.guaranteeCurrency] || 0;
                    if (val > 0) loanGuaranteeTotal += val * price;
                });

            const requestContext = {
                quote_symbol: quote_symbol,
            };
            const result = {
                quote_symbol: quote_symbol,
                total_balance: smartRound(totalVal).toString(),
                by_service: {
                    wallet_balance: smartRound(walletTotal).toString(),
                    pro_balance: smartRound(proTotal).toString(),
                    earn_balance: smartRound(earnTotal).toString(),
                    loan_guarantees_balance: smartRound(loanGuaranteeTotal).toString(),
                },
                details: breakdown.map((item) => ({
                    symbol: item.symbol,
                    balance: item.balance.toString(),
                    price_unit: smartRound(item.price_unit).toString(),
                    converted_balance: smartRound(item.converted_balance).toString(),
                })),
            };

            const contextual = buildSimpleContextualResponse(requestContext, result, { wallet, pro, earn, loans });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(contextual, null, 2),
                    },
                ],
            };
        }

        if (name === "general_health") {
            const health = await performHealthCheck();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(health, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown general tool: ${name}`);
    });
}
