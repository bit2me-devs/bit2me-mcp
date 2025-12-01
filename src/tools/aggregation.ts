/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest, getMarketPrice } from "../services/bit2me.js";
import { MIN_DUST_VALUE } from "../constants.js";
import { smartRound } from "../utils/format.js";

export const aggregationTools: Tool[] = [
    {
        name: "portfolio_get_valuation",
        description:
            "Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat currency (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations. Filters out dust amounts below minimum threshold.",
        inputSchema: {
            type: "object",
            properties: {
                fiat_currency: { type: "string", description: "Base currency (e.g., EUR, USD)", default: "EUR" },
            },
        },
    },
];

export async function handleAggregationTool(name: string, args: any) {
    if (name === "portfolio_get_valuation") {
        const fiat = args.fiat_currency || "EUR";

        // 1. Parallel call to all balance services
        const results = await Promise.allSettled([
            bit2meRequest("GET", "/v1/wallet/pocket"), // 0
            bit2meRequest("GET", "/v1/trading/wallet/balance"), // 1
            bit2meRequest("GET", "/v1/earn/summary"), // 2
            bit2meRequest("GET", "/v1/loan/orders"), // 3
        ]);

        const wallet: any = results[0].status === "fulfilled" ? results[0].value : [];
        const pro: any = results[1].status === "fulfilled" ? results[1].value : [];
        const earn: any = results[2].status === "fulfilled" ? results[2].value : [];
        const loans: any = results[3].status === "fulfilled" ? results[3].value : {};

        // Errors are logged but not thrown to allow partial portfolio view

        const assets: Record<string, number> = {};

        // Process Wallet
        if (Array.isArray(wallet))
            wallet.forEach((p: any) => {
                const val = parseFloat(p.balance || "0");
                if (val > 0) assets[p.currency] = (assets[p.currency] || 0) + val;
            });

        // Process Pro
        if (Array.isArray(pro))
            pro.forEach((w: any) => {
                const val = parseFloat(w.balance || "0") + parseFloat(w.blockedBalance || "0");
                if (val > 0) assets[w.currency] = (assets[w.currency] || 0) + val;
            });

        // Process Earn
        if (Array.isArray(earn))
            earn.forEach((e: any) => {
                const val = parseFloat(e.totalBalance || "0");
                if (val > 0) assets[e.currency] = (assets[e.currency] || 0) + val;
            });

        // Process Loans
        if (loans?.data && Array.isArray(loans.data))
            loans.data.forEach((l: any) => {
                const val = parseFloat(l.guaranteeAmount || "0");
                if (val > 0) assets[l.guaranteeCurrency] = (assets[l.guaranteeCurrency] || 0) + val;
            });

        // 2. Valuation
        const uniqueSymbols = Object.keys(assets);
        const prices = await Promise.all(uniqueSymbols.map((s) => getMarketPrice(s, fiat)));

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
                    asset: symbol,
                    amount: amount,
                    price_unit: smartRound(price),
                    value_fiat: parseFloat(val.toFixed(2)),
                });
            }
        });

        breakdown.sort((a, b) => b.value_fiat - a.value_fiat);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            currency: fiat,
                            total_value: parseFloat(totalVal.toFixed(2)),
                            details: breakdown,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    throw new Error(`Unknown aggregation tool: ${name}`);
}
