import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../../services/bit2me.js";
import { mapProBalanceResponse, mapProOpenOrdersResponse, mapProOrderTradesResponse, mapProOrderResponse } from "../../utils/response-mappers.js";

export const proTools: Tool[] = [
    {
        name: "pro_get_balance",
        description: "Gets specific balances from PRO Trading account (separate from Simple Wallet).",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "pro_get_transactions",
        description: "Gets the user's trade history in Pro.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by symbol" },
                limit: { type: "number" },
                offset: { type: "number" },
                sort: { type: "string", enum: ["ASC", "DESC"] }
            }
        }
    },
    {
        name: "pro_get_order_trades",
        description: "Gets trades associated with a specific order.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" }
            },
            required: ["orderId"]
        }
    },
    {
        name: "pro_get_order_details",
        description: "Gets details of a specific Pro order.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" }
            },
            required: ["orderId"]
        }
    }
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
        const data = await bit2meRequest("GET", "/v1/trading/orders", args);
        const optimized = mapProOpenOrdersResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    return null;
}
