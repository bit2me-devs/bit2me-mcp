import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapWalletAddressesResponse,
    mapWalletTransactionDetailsResponse,
    mapWalletPocketsResponse,
    mapWalletTransactionsResponse,
    mapProformaResponse,
    mapTransactionConfirmationResponse
} from "../utils/response-mappers.js";

export const walletTools: Tool[] = [
    {
        name: "wallet_get_pockets",
        description: "Gets balances, UUIDs, and available funds from Simple Wallet (Broker). Does not include Pro/Earn balance.",
        inputSchema: {
            type: "object",
            properties: { currency: { type: "string" } }
        }
    },
    {
        name: "wallet_get_pocket_details",
        description: "Gets details of a specific wallet (Pocket) by its ID.",
        inputSchema: {
            type: "object",
            properties: {
                pocketId: { type: "string", description: "Pocket UUID" }
            },
            required: ["pocketId"]
        }
    },
    {
        name: "wallet_get_pocket_addresses",
        description: "Lists deposit addresses for a wallet on a specific network.",
        inputSchema: {
            type: "object",
            properties: {
                pocketId: { type: "string", description: "Pocket UUID" },
                network: { type: "string", description: "Address network (e.g., bitcoin, ethereum, bsc)" }
            },
            required: ["pocketId", "network"]
        }
    },
    {
        name: "wallet_get_transactions",
        description: "History of past Wallet operations (deposits, withdrawals, swaps, purchases).",
        inputSchema: {
            type: "object",
            properties: {
                currency: { type: "string" },
                limit: { type: "string", description: "Amount to show (default: 10)" },
                offset: { type: "string", description: "Offset for pagination (default: 0)" }
            }
        }
    },
    {
        name: "wallet_get_transaction_details",
        description: "Gets details of a specific transaction by its ID.",
        inputSchema: {
            type: "object",
            properties: {
                transactionId: { type: "string", description: "Transaction UUID" }
            },
            required: ["transactionId"]
        }
    },
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
    }
];

export async function handleWalletTool(name: string, args: any) {
    if (name === "wallet_get_pockets") {
        const params: any = {};
        if (args.currency) params.currency = args.currency;
        const data = await bit2meRequest("GET", "/v1/wallet/pocket", params);
        const optimized = mapWalletPocketsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "wallet_get_pocket_details") {
        const data = await bit2meRequest("GET", "/v1/wallet/pocket", { id: args.pocketId });
        const pocket = Array.isArray(data) ? data[0] : data;

        if (!pocket) {
            return { content: [{ type: "text", text: "Pocket not found." }] };
        }

        return { content: [{ type: "text", text: JSON.stringify(pocket, null, 2) }] };
    }

    if (name === "wallet_get_pocket_addresses") {
        const { pocketId, network } = args;
        const data = await bit2meRequest("GET", `/v2/wallet/pocket/${pocketId}/${network}/address`);
        const optimized = mapWalletAddressesResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "wallet_get_transactions") {
        const params: any = {};
        if (args.currency) params.currency = args.currency;
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;

        const data = await bit2meRequest("GET", "/v1/wallet/transaction", params);
        const optimized = mapWalletTransactionsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "wallet_get_transaction_details") {
        const data = await bit2meRequest("GET", `/v1/wallet/transaction/${args.transactionId}`);
        const optimized = mapWalletTransactionDetailsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

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

    if (name === "wallet_confirm_transaction") {
        const data = await bit2meRequest("POST", `/v2/wallet/transaction/${args.proforma_id}/confirm`);
        const optimized = mapTransactionConfirmationResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    return null;
}

