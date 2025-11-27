import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnWalletsResponse,
    mapEarnTransactionsResponse,
    mapEarnWalletDetailsResponse,
    mapEarnTransactionsSummaryResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnWalletRewardsConfigResponse,
    mapEarnWalletRewardsSummaryResponse,
    mapEarnCreateTransactionResponse,
} from "../utils/response-mappers.js";

export const earnTools: Tool[] = [
    {
        name: "earn_get_summary",
        description: "View summary of accumulated rewards in Staking/Earn.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallets",
        description: "List active Earn wallets/strategies with their current APY.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_details",
        description: "Details of a specific Earn wallet.",
        inputSchema: {
            type: "object",
            properties: {
                walletId: { type: "string", description: "Earn wallet UUID" },
            },
            required: ["walletId"],
        },
    },
    {
        name: "earn_get_transactions",
        description: "Movements of an Earn wallet.",
        inputSchema: {
            type: "object",
            properties: {
                walletId: { type: "string", description: "Earn wallet UUID" },
                limit: { type: "string", description: "Result limit" },
                offset: { type: "string", description: "Offset" },
            },
            required: ["walletId"],
        },
    },
    {
        name: "earn_get_transactions_summary",
        description: "Summary of movements by type.",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Movement type (e.g., DEPOSIT, WITHDRAWAL)" },
            },
            required: ["type"],
        },
    },
    {
        name: "earn_create_transaction",
        description: "Create deposit or withdrawal in Earn (Staking).",
        inputSchema: {
            type: "object",
            properties: {
                pocketId: {
                    type: "string",
                    description: "Source pocket UUID (for deposit) or destination (for withdrawal)",
                },
                currency: { type: "string", description: "Currency (e.g., BTC, EUR)" },
                amount: { type: "string", description: "Amount" },
                type: { type: "string", enum: ["deposit", "withdrawal"], description: "Operation type" },
            },
            required: ["pocketId", "currency", "amount", "type"],
        },
    },
    {
        name: "earn_get_assets",
        description: "Assets supported in Earn.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_apy",
        description: "Current Earn APYs.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_rewards_config",
        description: "Global rewards configuration.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_rewards_config",
        description: "Rewards configuration for a wallet.",
        inputSchema: {
            type: "object",
            properties: {
                walletId: { type: "string", description: "Earn wallet UUID" },
            },
            required: ["walletId"],
        },
    },
    {
        name: "earn_get_wallet_rewards_summary",
        description: "Rewards summary for a wallet.",
        inputSchema: {
            type: "object",
            properties: {
                walletId: { type: "string", description: "Earn wallet UUID" },
            },
            required: ["walletId"],
        },
    },
];

export async function handleEarnTool(name: string, args: any) {
    if (name === "earn_get_summary") {
        const data = await bit2meRequest("GET", "/v1/earn/summary");
        const optimized = mapEarnSummaryResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_wallets") {
        const data = await bit2meRequest("GET", "/v2/earn/wallets");
        const optimized = mapEarnWalletsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_wallet_details") {
        const data = await bit2meRequest("GET", `/v1/earn/wallets/${args.walletId}`);
        const optimized = mapEarnWalletDetailsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_transactions") {
        const params: any = {};
        if (args.limit) params.limit = args.limit;
        if (args.offset) params.offset = args.offset;
        const data = await bit2meRequest("GET", `/v1/earn/wallets/${args.walletId}/movements`, params);
        const optimized = mapEarnTransactionsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_transactions_summary") {
        const data = await bit2meRequest("GET", `/v2/earn/movements/summary/${args.type}`);
        const optimized = mapEarnTransactionsSummaryResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_create_transaction") {
        const data = await bit2meRequest("POST", `/v1/earn/wallets/${args.pocketId}/movements`, {
            currency: args.currency,
            amount: args.amount,
            type: args.type,
        });
        const optimized = mapEarnCreateTransactionResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_assets") {
        const data = await bit2meRequest("GET", "/v2/earn/assets");
        const optimized = mapEarnAssetsResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_apy") {
        const data = await bit2meRequest("GET", "/v2/earn/apy");
        const optimized = mapEarnAPYResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_rewards_config") {
        const data = await bit2meRequest("GET", "/v2/earn/rewards/config");
        const optimized = mapEarnRewardsConfigResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_wallet_rewards_config") {
        const data = await bit2meRequest("GET", `/v1/earn/wallets/${args.walletId}/rewards/config`);
        const optimized = mapEarnWalletRewardsConfigResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    if (name === "earn_get_wallet_rewards_summary") {
        const data = await bit2meRequest("GET", `/v1/earn/wallets/${args.walletId}/rewards`);
        const optimized = mapEarnWalletRewardsSummaryResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown earn tool: ${name}`);
}
