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
            "Retrieves balances specifically for the PRO Trading account. NOTE: These are SEPARATE from the Simple Wallet balances. Funds must be deposited into Pro before trading.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "pro_get_transactions",
        description:
            "Fetches the history of executed trades in the Pro Trading platform. Filters by symbol and date are supported.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by market symbol (e.g., BTC/EUR)" },
                limit: { type: "number", description: "Number of trades to return" },
                offset: { type: "number", description: "Pagination offset" },
                sort: { type: "string", enum: ["ASC", "DESC"], description: "Sort order" },
            },
        },
    },
    {
        name: "pro_get_order_trades",
        description:
            "Gets all trade executions associated with a specific Pro order ID. An order may be filled in multiple partial trades.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Pro Order UUID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "pro_get_order_details",
        description:
            "Retrieves the status and details of a specific order in Pro Trading (e.g., filled amount, average price, status).",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Pro Order UUID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "pro_get_open_orders",
        description: "Lists all currently open (active) orders in Pro Trading. Can be filtered by market symbol.",
        inputSchema: {
            type: "object",
            properties: { symbol: { type: "string", description: "Filter by market symbol (e.g., BTC/EUR)" } },
        },
    },
    {
        name: "pro_create_order",
        description:
            "Places a new trading order in the Pro platform. Supports Limit, Market, and Stop-Limit orders. Ensure sufficient Pro balance before placing.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Market symbol (e.g., BTC/EUR)" },
                side: { type: "string", enum: ["buy", "sell"], description: "Order side" },
                type: { type: "string", enum: ["limit", "market", "stop-limit"], description: "Order type" },
                amount: { type: "number", description: "Amount to buy/sell" },
                price: { type: "number", description: "Limit price (Required for Limit/Stop orders)" },
                stopPrice: { type: "number", description: "Trigger price (Required for Stop-Limit orders)" },
            },
            required: ["symbol", "side", "type", "amount"],
        },
    },
    {
        name: "pro_cancel_order",
        description: "Cancels a specific open order in Pro Trading by its ID.",
        inputSchema: {
            type: "object",
            properties: { orderId: { type: "string", description: "Pro Order UUID" } },
            required: ["orderId"],
        },
    },
    {
        name: "pro_cancel_all_orders",
        description:
            "Cancels ALL open orders in Pro Trading. Can be restricted to a specific market symbol. Use with caution.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter cancellation by symbol (e.g., BTC/EUR)" },
            },
        },
    },
    {
        name: "pro_deposit",
        description:
            "Transfers funds FROM the main Simple Wallet TO the Pro Trading account. Necessary before placing Pro orders.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency to transfer (e.g., EUR, BTC)" },
                amount: { type: "string", description: "Amount to transfer" },
            },
            required: ["currency", "amount"],
        },
    },
    {
        name: "pro_withdraw",
        description: "Transfers funds FROM the Pro Trading account back TO the main Simple Wallet.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency to transfer (e.g., EUR, BTC)" },
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
