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
import { Decimal } from "decimal.js";

/**
 * Parse a possibly-undefined string/number into a non-negative Decimal.
 * Returns Decimal(0) for invalid / negative / NaN input so the aggregator
 * stays defensive against malformed upstream rows.
 */
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
            if (params.quote_symbol) {
                validateSymbol(params.quote_symbol);
            }
            const quote_symbol = normalizeSymbol(params.quote_symbol || "EUR");

            // 1. Parallel call to all balance services
            const results = await Promise.allSettled([
                bit2meRequest("GET", "/v1/wallet/pocket", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 0
                bit2meRequest("GET", "/v1/trading/wallet/balance", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 1
                bit2meRequest("GET", "/v2/earn/wallets", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 2
                bit2meRequest("GET", "/v1/loan/orders", undefined, undefined, PORTFOLIO_REQUEST_TIMEOUT), // 3
            ]);

            // Check if any call failed due to authentication (401)
            const authErrors = results.filter(
                (r) => r.status === "rejected" && r.reason?.name === "AuthenticationError"
            );
            if (authErrors.length > 0) {
                // If any auth error, throw it - likely JWT/API key issue
                throw (authErrors[0] as PromiseRejectedResult).reason;
            }

            // Check if ALL calls failed - this strongly indicates an authentication/credentials issue
            // Some Bit2Me endpoints return 404 instead of 401 for invalid credentials
            const allFailed = results.every((r) => r.status === "rejected");
            if (allFailed) {
                const firstError = (results[0] as PromiseRejectedResult).reason;
                // If all calls fail, it's almost certainly a credentials problem
                // Override error message to be more helpful
                const credentialsHint =
                    "All API calls failed. This usually indicates invalid or missing API credentials. " +
                    "Please verify your BIT2ME_API_KEY and BIT2ME_API_SECRET (or jwt parameter) are correct.";
                throw new Error(credentialsHint + ` Original error: ${firstError?.message || "Unknown"}`);
            }

            const wallet: any = results[0].status === "fulfilled" ? results[0].value : [];
            const pro: any = results[1].status === "fulfilled" ? results[1].value : [];
            const earn: any = results[2].status === "fulfilled" ? results[2].value : [];
            const loans: any = results[3].status === "fulfilled" ? results[3].value : {};

            // Partial failures are logged but not thrown to allow partial portfolio view.
            //
            // We aggregate balances using arbitrary-precision `Decimal` instead
            // of native floats. Account balances often have many decimals
            // (e.g. 0.00000001 BTC) and accumulating them with `parseFloat` +
            // `+` produces non-deterministic rounding errors that surface as
            // "missing satoshis" in the response.

            const assets: Record<string, Decimal> = {};

            // Process Wallet
            if (Array.isArray(wallet))
                wallet.forEach((p: any) => {
                    const val = toDecimal(p.balance);
                    if (val.gt(0)) {
                        assets[p.currency] = (assets[p.currency] ?? new Decimal(0)).plus(val);
                    }
                });

            // Process Pro
            if (Array.isArray(pro))
                pro.forEach((w: any) => {
                    const val = toDecimal(w.balance);
                    if (val.gt(0)) {
                        assets[w.currency] = (assets[w.currency] ?? new Decimal(0)).plus(val);
                    }
                });

            // Process Earn
            // /v2/earn/wallets returns { total, data: [...] } structure
            const earnPositions = Array.isArray(earn) ? earn : earn?.data || [];
            if (Array.isArray(earnPositions))
                earnPositions.forEach((e: any) => {
                    // Support both totalBalance (legacy/mapped) and balance (raw v2)
                    const val = toDecimal(e.totalBalance ?? e.balance);
                    if (val.gt(0)) {
                        assets[e.currency] = (assets[e.currency] ?? new Decimal(0)).plus(val);
                    }
                });

            // Process Loans
            if (loans?.data && Array.isArray(loans.data))
                loans.data.forEach((l: any) => {
                    const val = toDecimal(l.guaranteeAmount);
                    if (val.gt(0)) {
                        assets[l.guaranteeCurrency] = (assets[l.guaranteeCurrency] ?? new Decimal(0)).plus(val);
                    }
                });

            // 2. Valuation
            const uniqueSymbols = Object.keys(assets);
            const prices = await Promise.all(uniqueSymbols.map((s) => getMarketPrice(s, quote_symbol)));
            const priceMap: Record<string, Decimal> = {};
            uniqueSymbols.forEach((symbol, idx) => {
                priceMap[symbol] = toDecimal(prices[idx]);
            });

            type BreakdownEntry = {
                symbol: string;
                balance: Decimal;
                priceUnit: Decimal;
                convertedBalance: Decimal;
            };
            const breakdown: BreakdownEntry[] = [];
            let totalVal = new Decimal(0);

            uniqueSymbols.forEach((symbol) => {
                const price = priceMap[symbol] ?? new Decimal(0);
                const amount = assets[symbol] ?? new Decimal(0);
                const val = amount.mul(price);
                totalVal = totalVal.plus(val);

                if (val.gt(MIN_DUST_VALUE) && amount.gt(0)) {
                    breakdown.push({
                        symbol,
                        balance: amount,
                        priceUnit: price,
                        // Mirror legacy 2-decimal rounding for the displayed value.
                        convertedBalance: val.toDecimalPlaces(2),
                    });
                }
            });

            breakdown.sort((a, b) => b.convertedBalance.comparedTo(a.convertedBalance));

            // Service-level totals computed with Decimal precision.
            let walletTotal = new Decimal(0);
            let proTotal = new Decimal(0);
            let earnTotal = new Decimal(0);
            let loanGuaranteeTotal = new Decimal(0);

            if (Array.isArray(wallet))
                wallet.forEach((p: any) => {
                    const val = toDecimal(p.balance);
                    const price = priceMap[p.currency] ?? new Decimal(0);
                    if (val.gt(0)) walletTotal = walletTotal.plus(val.mul(price));
                });

            if (Array.isArray(pro))
                pro.forEach((w: any) => {
                    const val = toDecimal(w.balance);
                    const price = priceMap[w.currency] ?? new Decimal(0);
                    if (val.gt(0)) proTotal = proTotal.plus(val.mul(price));
                });

            const earnPositionsForTotal = Array.isArray(earn) ? earn : earn?.data || [];
            if (Array.isArray(earnPositionsForTotal))
                earnPositionsForTotal.forEach((e: any) => {
                    const val = toDecimal(e.totalBalance ?? e.balance);
                    const price = priceMap[e.currency] ?? new Decimal(0);
                    if (val.gt(0)) earnTotal = earnTotal.plus(val.mul(price));
                });

            if (loans?.data && Array.isArray(loans.data))
                loans.data.forEach((l: any) => {
                    const val = toDecimal(l.guaranteeAmount);
                    const price = priceMap[l.guaranteeCurrency] ?? new Decimal(0);
                    if (val.gt(0)) loanGuaranteeTotal = loanGuaranteeTotal.plus(val.mul(price));
                });

            const requestContext = {
                quote_symbol: quote_symbol,
            };
            // `smartRound` operates on number; we go through `toNumber()` only
            // for the final string conversions.
            const result = {
                quote_symbol: quote_symbol,
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

        if (name === "general_describe_tool") {
            const targetName = typeof args.tool_name === "string" ? args.tool_name : undefined;
            if (!targetName) {
                throw new Error("tool_name is required");
            }
            const { getToolMetadata } = await import("../utils/tool-metadata.js");
            const meta = getToolMetadata(targetName);
            if (!meta) {
                throw new Error(`Unknown tool: ${targetName}`);
            }
            const result = {
                name: meta.name,
                description: meta.description,
                type: meta.type,
                attributes: meta.attributes,
                inputSchema: meta.inputSchema,
                exampleArgs: meta.exampleArgs,
                exampleResponse: meta.exampleResponse,
            };
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }

        throw new Error(`Unknown general tool: ${name}`);
    });
}
