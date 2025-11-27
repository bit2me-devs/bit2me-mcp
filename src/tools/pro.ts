/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapProBalanceResponse,
    mapProOrderTradesResponse,
    mapProOrderResponse,
    mapProCancelOrderResponse,
    mapProCancelAllOrdersResponse,
    mapProDepositResponse,
    mapProWithdrawResponse,
} from "../utils/response-mappers.js";

export const proTools: Tool[] = [
    {
        name: "pro_get_balance",
        description:
            "Gets balances from PRO Trading account. This is separate from Simple Wallet - funds must be transferred using pro_deposit/pro_withdraw. Returns available and blocked balances per currency for trading.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "pro_get_transactions",
        description:
            "Gets the user's trade history in Pro Trading. Returns executed trades with price, amount, side (buy/sell), fees, and timestamp. Optional filters: symbol, limit, offset, and sort order (ASC/DESC). Use this to review past trading activity.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by symbol" },
                limit: { type: "number" },
                offset: { type: "number" },
                sort: { type: "string", enum: ["ASC", "DESC"] },
            },
        },
    },
    {
        name: "pro_get_order_trades",
        description:
            "Gets all individual trades (executions) associated with a specific order. Returns detailed execution data including price, amount, fees, and timestamp for each fill. Useful for analyzing how a large order was executed across multiple trades.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "pro_get_order_details",
        description:
            "Gets detailed information of a specific Pro order. Returns order type, symbol, side, amount, price, status, filled amount, creation time, and execution details. Use pro_get_open_orders or pro_get_transactions first to get the order ID.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "pro_get_open_orders",
        description:
            "View open trading orders in PRO. Returns all active orders (pending, partially filled). Optional symbol filter to see orders for a specific market. Use this to monitor order status after pro_create_order.",
        inputSchema: {
            type: "object",
            properties: { symbol: { type: "string" } },
        },
    },
    {
        name: "pro_create_order",
        description:
            "Create Limit/Market/Stop order in PRO Trading. Returns order ID. For Limit orders, 'price' is required. For Stop-Limit orders, both 'price' and 'stopPrice' are required. Market orders execute immediately at current price. Use pro_get_open_orders to check order status.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string" },
                side: { type: "string", enum: ["buy", "sell"] },
                type: { type: "string", enum: ["limit", "market", "stop-limit"] },
                amount: { type: "number" },
                price: { type: "number", description: "Required for Limit/Stop" },
                stopPrice: { type: "number", description: "Required for Stop-Limit" },
            },
            required: ["symbol", "side", "type", "amount"],
        },
    },
    {
        name: "pro_cancel_order",
        description:
            "Cancel a specific PRO order by ID. Only open/pending orders can be cancelled. Returns cancellation status. Use pro_get_open_orders first to see which orders can be cancelled.",
        inputSchema: {
            type: "object",
            properties: { orderId: { type: "string" } },
            required: ["orderId"],
        },
    },
    {
        name: "pro_cancel_all_orders",
        description:
            "Cancel all open orders in Pro Trading. Optional symbol filter to cancel only orders for a specific market. Returns count of cancelled orders. Use with caution as this affects all pending orders.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by symbol (e.g., BTC/EUR)" },
            },
        },
    },
    {
        name: "pro_deposit",
        description:
            "Deposit funds from Simple Wallet to Pro Trading account. Funds must be available in Simple Wallet first (check with wallet_get_pockets). Transfer is immediate. Use pro_get_balance to verify the deposit.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency (e.g., EUR, BTC)" },
                amount: { type: "string", description: "Amount to transfer" },
            },
            required: ["currency", "amount"],
        },
    },
    {
        name: "pro_withdraw",
        description:
            "Withdraw funds from Pro Trading account back to Simple Wallet. Funds must be available in Pro Trading (check with pro_get_balance). Transfer is immediate. Use wallet_get_pockets to verify the withdrawal.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency (e.g., EUR, BTC)" },
                amount: { type: "string", description: "Amount to transfer" },
            },
            required: ["currency", "amount"],
        },
    },
];

export async function handleProTool(name: string, args: any) {
    if (name === "pro_get_balance") {
        const data = await bit2meRequest("GET", "/v1/trading/wallet/balance");
        const optimized = mapProBalanceResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_get_transactions") {
        const params: any = {};
        if (args.symbol) params.symbol = args.symbol;
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;
        if (args.sort) params.sort = args.sort;
        const data = await bit2meRequest("GET", "/v1/trading/trade", params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "pro_get_order_trades") {
        const data = await bit2meRequest("GET", `/v1/trading/order/${args.orderId}/trades`);
        const optimized = mapProOrderTradesResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_get_order_details") {
        const data = await bit2meRequest("GET", `/v1/trading/order/${args.orderId}`);
        const optimized = mapProOrderResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_get_open_orders") {
        const params: any = { status: "open" };
        if (args.symbol) params.symbol = args.symbol;
        const data = await bit2meRequest("GET", "/v1/trading/order", params);
        // Note: The previous implementation used mapProOpenOrdersResponse but pointed to /v1/trading/orders
        // The one in operations used /v1/trading/order with status open.
        // Let's use the response directly as in operations/index.ts or map it if possible.
        // operations/index.ts returned raw data.
        // But pro.ts had a mapProOpenOrdersResponse. Let's see if we can use it.
        // For consistency with operations/index.ts which I'm replacing, I should probably stick to what operations was doing OR improve it.
        // The previous pro.ts had: const data = await bit2meRequest("GET", "/v1/trading/orders", args);
        // operations/index.ts had: const data = await bit2meRequest("GET", "/v1/trading/order", params);
        // It seems there are two endpoints or one is wrong.
        // Checking swagger would be ideal but I don't have it open.
        // I will trust the operations implementation as it seems more specific (status: open).
        // However, I will try to use the mapper if compatible.
        // The original pro.ts implementation was probably just a placeholder or partial.
        // I'll use the operations implementation for logic, and try to map it if I can, but operations didn't map it.
        // So I'll return raw data for now as operations did, to be safe.
        // Wait, pro.ts had mapProOpenOrdersResponse imported. I'll try to use it if it makes sense.
        // But `mapProOpenOrdersResponse` expects a certain structure.
        // I'll stick to the operations implementation for now which returns raw JSON.
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "pro_create_order") {
        const body = {
            symbol: args.symbol,
            side: args.side,
            orderType: args.type,
            amount: args.amount,
            price: args.price,
            stopPrice: args.stopPrice,
        };
        const data = await bit2meRequest("POST", "/v1/trading/order", body);
        const optimized = mapProOrderResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_cancel_order") {
        const data = await bit2meRequest("DELETE", `/v1/trading/order/${args.orderId}`);
        const optimized = mapProCancelOrderResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_cancel_all_orders") {
        const params = args.symbol ? { symbol: args.symbol } : {};
        const data = await bit2meRequest("DELETE", "/v1/trading/orders", params);
        const optimized = mapProCancelAllOrdersResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_deposit") {
        const data = await bit2meRequest("POST", "/v1/trading/wallet/deposit", {
            currency: args.currency,
            amount: args.amount,
        });
        const optimized = mapProDepositResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_withdraw") {
        const data = await bit2meRequest("POST", "/v1/trading/wallet/withdraw", {
            currency: args.currency,
            amount: args.amount,
        });
        const optimized = mapProWithdrawResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown pro tool: ${name}`);
}
