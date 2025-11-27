/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapLoanOrdersResponse,
    mapLoanTransactionsResponse,
    mapLoanConfigResponse,
    mapLoanLTVResponse,
    mapLoanOrderDetailsResponse,
    mapLoanCreateResponse,
    mapLoanIncreaseGuaranteeResponse,
    mapLoanPaybackResponse,
} from "../utils/response-mappers.js";

export const loanTools: Tool[] = [
    {
        name: "loan_get_active",
        description:
            "Retrieves all active loan orders for the user. Use this to monitor outstanding loans and their status. Alias for get_loan_orders.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "loan_get_ltv",
        description:
            "Calculates the Loan-To-Value (LTV) ratio and liquidation price for a potential loan. Use this simulator BEFORE creating a loan to understand collateral requirements.",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Currency to be used as collateral (e.g., BTC)" },
                loanCurrency: { type: "string", description: "Currency to be borrowed (e.g., EUR)" },
                userCurrency: { type: "string", description: "User's reference fiat currency (e.g., EUR)" },
                guaranteeAmount: {
                    type: "string",
                    description: "Amount of collateral (optional if loanAmount is given)",
                },
                loanAmount: { type: "string", description: "Amount to borrow (optional if guaranteeAmount is given)" },
            },
            required: ["guaranteeCurrency", "loanCurrency", "userCurrency"],
        },
    },
    {
        name: "loan_get_config",
        description:
            "Gets configuration parameters for the Loan service, including supported currencies, limits, and interest rates.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "loan_get_transactions",
        description: "Fetches history of loan-related transactions (disbursements, repayments, liquidations).",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Filter by specific loan order ID" },
                limit: { type: "number", description: "Number of records to return" },
                offset: { type: "number", description: "Pagination offset" },
            },
        },
    },
    {
        name: "loan_get_orders",
        description: "Lists all loan orders (active, closed, liquidated) associated with the user account.",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of records to return" },
                offset: { type: "number", description: "Pagination offset" },
            },
        },
    },
    {
        name: "loan_get_order_details",
        description:
            "Retrieves full details for a specific loan order, including current LTV, liquidation price, and repayment status.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "loan_create",
        description:
            "Creates a new cryptocurrency-backed loan. Requires specified collateral (guarantee) and loan amounts.",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Currency provided as collateral (e.g., BTC)" },
                guaranteeAmount: { type: "string", description: "Amount of collateral to lock" },
                loanCurrency: { type: "string", description: "Currency to borrow (e.g., EUR)" },
                loanAmount: { type: "string", description: "Amount to borrow" },
            },
            required: ["guaranteeCurrency", "guaranteeAmount", "loanCurrency", "loanAmount"],
        },
    },
    {
        name: "loan_increase_guarantee",
        description: "Adds more collateral to an existing loan to lower the LTV and avoid liquidation.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                guaranteeAmount: { type: "string", description: "Additional amount to add to collateral" },
            },
            required: ["orderId", "guaranteeAmount"],
        },
    },
    {
        name: "loan_payback",
        description:
            "Repays a portion or the entirety of an active loan. Funds will be deducted from the user's wallet.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                paybackAmount: { type: "string", description: "Amount to repay" },
            },
            required: ["orderId", "paybackAmount"],
        },
    },
];

export async function handleLoanTool(name: string, args: any) {
    if (name === "loan_get_active") {
        const data = await bit2meRequest("GET", "/v1/loan/orders");
        const optimized = mapLoanOrdersResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_ltv") {
        const params: Record<string, any> = {
            guaranteeCurrency: args.guaranteeCurrency,
            loanCurrency: args.loanCurrency,
            userCurrency: args.userCurrency,
        };
        if (args.guaranteeAmount) params.guaranteeAmount = args.guaranteeAmount;
        if (args.loanAmount) params.loanAmount = args.loanAmount;

        const data = await bit2meRequest("GET", "/v1/loan/ltv", params);
        const optimized = mapLoanLTVResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_config") {
        const data = await bit2meRequest("GET", "/v1/loan/config");
        const optimized = mapLoanConfigResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_transactions") {
        const params: Record<string, any> = {};
        if (args.orderId) params.orderId = args.orderId;
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;

        const data = await bit2meRequest("GET", "/v1/loan/movements", params);
        const optimized = mapLoanTransactionsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_get_orders") {
        const params: Record<string, any> = {};
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

    if (name === "loan_create") {
        const data = await bit2meRequest("POST", "/v1/loan", {
            guaranteeCurrency: args.guaranteeCurrency,
            guaranteeAmount: args.guaranteeAmount,
            loanCurrency: args.loanCurrency,
            loanAmount: args.loanAmount,
        });
        const optimized = mapLoanCreateResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_increase_guarantee") {
        const data = await bit2meRequest("POST", `/v1/loan/${args.orderId}/guarantee/increase`, {
            guaranteeAmount: args.guaranteeAmount,
        });
        const optimized = mapLoanIncreaseGuaranteeResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_payback") {
        const data = await bit2meRequest("POST", `/v1/loan/${args.orderId}/payback`, {
            paybackAmount: args.paybackAmount,
        });
        const optimized = mapLoanPaybackResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown loan tool: ${name}`);
}
