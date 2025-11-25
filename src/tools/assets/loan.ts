import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../../services/bit2me.js";
import { mapLoanOrdersResponse, mapLoanTransactionsResponse, mapLoanConfigResponse, mapLoanLTVResponse, mapLoanOrderDetailsResponse } from "../../utils/response-mappers.js";

export const loanTools: Tool[] = [
    {
        name: "loan_get_active",
        description: "View active loans (Simple alias for get_loan_orders).",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "loan_get_ltv",
        description: "Calculate LTV (Loan To Value).",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Guarantee currency (e.g., BTC)" },
                loanCurrency: { type: "string", description: "Loan currency (e.g., EUR)" },
                userCurrency: { type: "string", description: "User's fiat currency (e.g., EUR)" },
                guaranteeAmount: { type: "string", description: "Guarantee amount (optional if loanAmount is given)" },
                loanAmount: { type: "string", description: "Loan amount (optional if guaranteeAmount is given)" }
            },
            required: ["guaranteeCurrency", "loanCurrency", "userCurrency"]
        }
    },
    {
        name: "loan_get_config",
        description: "Get currency configuration for loans.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "loan_get_transactions",
        description: "Get loan movements.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Filter by order ID" },
                limit: { type: "number" },
                offset: { type: "number" }
            }
        }
    },
    {
        name: "loan_get_orders",
        description: "Get user's loan orders.",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number" },
                offset: { type: "number" }
            }
        }
    },
    {
        name: "loan_get_order_details",
        description: "Get details of a specific loan order.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" }
            },
            required: ["orderId"]
        }
    }
];

export async function handleLoanTool(name: string, args: any) {
    if (name === "loan_get_active") {
        const data = await bit2meRequest("GET", "/v1/loan/orders");
        const optimized = mapLoanOrdersResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_ltv") {
        const params: any = {
            guaranteeCurrency: args.guaranteeCurrency,
            loanCurrency: args.loanCurrency,
            userCurrency: args.userCurrency
        };
        if (args.guaranteeAmount) params.guaranteeAmount = args.guaranteeAmount;
        if (args.loanAmount) params.loanAmount = args.loanAmount;

        const data = await bit2meRequest("GET", "/v1/loan/ltv", params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "loan_get_config") {
        const data = await bit2meRequest("GET", "/v1/loan/config");
        const optimized = mapLoanConfigResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_transactions") {
        const params: any = {};
        if (args.orderId) params.orderId = args.orderId;
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;

        const data = await bit2meRequest("GET", "/v1/loan/movements", params);
        const optimized = mapLoanTransactionsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_orders") {
        const params: any = {};
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;

        const data = await bit2meRequest("GET", "/v1/loan/orders", params);
        const optimized = mapLoanOrdersResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_order_details") {
        const data = await bit2meRequest("GET", `/v1/loan/order/${args.orderId}`);
        const optimized = mapLoanOrderDetailsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    return null;
}
