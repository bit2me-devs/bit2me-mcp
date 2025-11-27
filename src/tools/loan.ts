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
            "View all active loans. Returns list of current loans with guarantee amounts, loan amounts, LTV ratios, currencies, and status. Use this to monitor your active loan positions.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "loan_get_ltv",
        description:
            "Calculate LTV (Loan To Value) ratio for a loan scenario. LTV represents the loan amount as a percentage of the guarantee value. Lower LTV means lower risk. Provide either guaranteeAmount or loanAmount (the other will be calculated). Returns LTV percentage and risk level. Use this before loan_create to plan your loan.",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Guarantee currency (e.g., BTC)" },
                loanCurrency: { type: "string", description: "Loan currency (e.g., EUR)" },
                userCurrency: { type: "string", description: "User's fiat currency (e.g., EUR)" },
                guaranteeAmount: { type: "string", description: "Guarantee amount (optional if loanAmount is given)" },
                loanAmount: { type: "string", description: "Loan amount (optional if guaranteeAmount is given)" },
            },
            required: ["guaranteeCurrency", "loanCurrency", "userCurrency"],
        },
    },
    {
        name: "loan_get_config",
        description:
            "Get currency configuration for loans including supported guarantee currencies, loan currencies, LTV limits, interest rates, and requirements. Use this before creating a loan to understand available options and limits.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "loan_get_transactions",
        description:
            "Get loan transaction history (movements) including payments, interest accruals, and guarantee changes. Optional orderId filter to see movements for a specific loan. Use limit and offset for pagination.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Filter by order ID" },
                limit: { type: "number" },
                offset: { type: "number" },
            },
        },
    },
    {
        name: "loan_get_orders",
        description:
            "Get all loan orders (both active and closed) for the user. Returns loans with guarantee amounts, loan amounts, LTV ratios, currencies, status, and dates. Optional limit and offset for pagination.",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number" },
                offset: { type: "number" },
            },
        },
    },
    {
        name: "loan_get_order_details",
        description:
            "Get detailed information of a specific loan order. Returns guarantee amount, loan amount, LTV, interest rate, status, creation date, and payment history. Use loan_get_active or loan_get_orders first to get the order ID.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Order ID" },
            },
            required: ["orderId"],
        },
    },
    {
        name: "loan_create",
        description:
            "Create a new loan by providing cryptocurrency as guarantee (collateral) to receive fiat currency. The guarantee amount determines the maximum loan amount based on LTV (Loan To Value) ratio. Use loan_get_ltv first to calculate optimal amounts. Returns loan order details with status.",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Guarantee currency (e.g., BTC)" },
                guaranteeAmount: { type: "string", description: "Guarantee amount" },
                loanCurrency: { type: "string", description: "Loan currency (e.g., EUR)" },
                loanAmount: { type: "string", description: "Loan amount" },
            },
            required: ["guaranteeCurrency", "guaranteeAmount", "loanCurrency", "loanAmount"],
        },
    },
    {
        name: "loan_increase_guarantee",
        description:
            "Increase the guarantee (collateral) amount for an existing loan. This improves the LTV ratio and reduces risk. Returns updated loan details. Use loan_get_active first to get the order ID.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                guaranteeAmount: { type: "string", description: "Additional guarantee amount" },
            },
            required: ["orderId", "guaranteeAmount"],
        },
    },
    {
        name: "loan_payback",
        description:
            "Pay back (return) part or all of a loan. Reduces the loan amount and may release guarantee if fully paid. Returns updated loan details. Use loan_get_active first to get the order ID and check current loan amount.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                paybackAmount: { type: "string", description: "Amount to pay back" },
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
