import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../../services/bit2me.js";
import {
    mapProformaResponse,
    mapProOrderResponse,
    mapTransactionConfirmationResponse,
    mapEarnCreateTransactionResponse,
    mapProDepositResponse,
    mapProWithdrawResponse,
    mapProCancelOrderResponse,
    mapProCancelAllOrdersResponse,
    mapLoanCreateResponse,
    mapLoanIncreaseGuaranteeResponse,
    mapLoanPaybackResponse
} from "../../utils/response-mappers.js";

export const operationTools: Tool[] = [
    {
        name: "wallet_create_proforma",
        description: "STEP 1: Simulates/Quotes an operation in Simple Wallet. Returns Proforma ID and cost. REQUIRES subsequent confirmation.",
        inputSchema: {
            type: "object",
            properties: {
                origin_pocket_id: { type: "string" },
                destination_pocket_id: { type: "string" },
                amount: { type: "string" },
                currency: { type: "string" }
            },
            required: ["origin_pocket_id", "destination_pocket_id", "amount", "currency"]
        }
    },
    {
        name: "wallet_confirm_transaction",
        description: "STEP 2: Executes the operation using the Proforma ID. Final action.",
        inputSchema: {
            type: "object",
            properties: { proforma_id: { type: "string" } },
            required: ["proforma_id"]
        }
    },
    {
        name: "pro_get_open_orders",
        description: "View open trading orders in PRO.",
        inputSchema: {
            type: "object",
            properties: { symbol: { type: "string" } }
        }
    },
    {
        name: "pro_create_order",
        description: "Create Limit/Market/Stop order in PRO Trading.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string" },
                side: { type: "string", enum: ["buy", "sell"] },
                type: { type: "string", enum: ["limit", "market", "stop-limit"] },
                amount: { type: "number" },
                price: { type: "number", description: "Required for Limit/Stop" },
                stopPrice: { type: "number", description: "Required for Stop-Limit" }
            },
            required: ["symbol", "side", "type", "amount"]
        }
    },
    {
        name: "pro_cancel_order",
        description: "Cancel a PRO order by ID.",
        inputSchema: {
            type: "object",
            properties: { orderId: { type: "string" } },
            required: ["orderId"]
        }
    },
    {
        name: "earn_create_transaction",
        description: "Create deposit or withdrawal in Earn (Staking).",
        inputSchema: {
            type: "object",
            properties: {
                pocketId: { type: "string", description: "Source pocket UUID (for deposit) or destination (for withdrawal)" },
                currency: { type: "string", description: "Currency (e.g., BTC, EUR)" },
                amount: { type: "string", description: "Amount" },
                type: { type: "string", enum: ["deposit", "withdrawal"], description: "Operation type" }
            },
            required: ["pocketId", "currency", "amount", "type"]
        }
    },
    {
        name: "loan_create",
        description: "Create a new loan.",
        inputSchema: {
            type: "object",
            properties: {
                guaranteeCurrency: { type: "string", description: "Guarantee currency (e.g., BTC)" },
                guaranteeAmount: { type: "string", description: "Guarantee amount" },
                loanCurrency: { type: "string", description: "Loan currency (e.g., EUR)" },
                loanAmount: { type: "string", description: "Loan amount" }
            },
            required: ["guaranteeCurrency", "guaranteeAmount", "loanCurrency", "loanAmount"]
        }
    },
    {
        name: "loan_increase_guarantee",
        description: "Increase guarantee for an existing loan.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                guaranteeAmount: { type: "string", description: "Additional guarantee amount" }
            },
            required: ["orderId", "guaranteeAmount"]
        }
    },
    {
        name: "loan_payback",
        description: "Pay back (return) part or all of a loan.",
        inputSchema: {
            type: "object",
            properties: {
                orderId: { type: "string", description: "Loan order ID" },
                paybackAmount: { type: "string", description: "Amount to pay back" }
            },
            required: ["orderId", "paybackAmount"]
        }
    },
    {
        name: "pro_cancel_all_orders",
        description: "Cancel all open orders in Pro (optionally filtering by symbol).",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Filter by symbol (e.g., BTC/EUR)" }
            }
        }
    },
    {
        name: "pro_deposit",
        description: "Deposit funds from main Wallet to Pro Trading.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency (e.g., EUR, BTC)" },
                amount: { type: "string", description: "Amount to transfer" }
            },
            required: ["currency", "amount"]
        }
    },
    {
        name: "pro_withdraw",
        description: "Withdraw funds from Pro Trading to main Wallet.",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string", description: "Currency (e.g., EUR, BTC)" },
                amount: { type: "string", description: "Amount to transfer" }
            },
            required: ["currency", "amount"]
        }
    }
];

export async function handleOperationTool(name: string, args: any) {
    if (name === "wallet_create_proforma") {
        const body = {
            pocket: args.origin_pocket_id,
            destination: { pocket: args.destination_pocket_id },
            amount: args.amount,
            currency: args.currency
        };
        const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
        const optimized = mapProformaResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_create_transaction") {
        const data = await bit2meRequest("POST", `/v1/earn/wallets/${args.pocketId}/movements`, {
            currency: args.currency,
            amount: args.amount,
            type: args.type
        });
        const optimized = mapEarnCreateTransactionResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_create") {
        const data = await bit2meRequest("POST", "/v1/loan", {
            guaranteeCurrency: args.guaranteeCurrency,
            guaranteeAmount: args.guaranteeAmount,
            loanCurrency: args.loanCurrency,
            loanAmount: args.loanAmount
        });
        const optimized = mapLoanCreateResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_increase_guarantee") {
        const data = await bit2meRequest("POST", `/v1/loan/${args.orderId}/guarantee/increase`, {
            guaranteeAmount: args.guaranteeAmount
        });
        const optimized = mapLoanIncreaseGuaranteeResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "loan_payback") {
        const data = await bit2meRequest("POST", `/v1/loan/${args.orderId}/payback`, {
            paybackAmount: args.paybackAmount
        });
        const optimized = mapLoanPaybackResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "wallet_confirm_transaction") {
        const data = await bit2meRequest("POST", `/v2/wallet/transaction/${args.proforma_id}/confirm`);
        const optimized = mapTransactionConfirmationResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_get_open_orders") {
        const params: any = { status: "open" };
        if (args.symbol) params.symbol = args.symbol;
        const data = await bit2meRequest("GET", "/v1/trading/order", params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "pro_create_order") {
        const body = {
            symbol: args.symbol,
            side: args.side,
            orderType: args.type,
            amount: args.amount,
            price: args.price,
            stopPrice: args.stopPrice
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
            amount: args.amount
        });
        const optimized = mapProDepositResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "pro_withdraw") {
        const data = await bit2meRequest("POST", "/v1/trading/wallet/withdraw", {
            currency: args.currency,
            amount: args.amount
        });
        const optimized = mapProWithdrawResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown operation tool: ${name}`);
}
