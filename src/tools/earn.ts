/* eslint-disable @typescript-eslint/no-explicit-any */
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
        description:
            "Gets a consolidated summary of all accumulated rewards across all Earn (Staking) strategies. Returns total rewards earned by currency.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallets",
        description:
            "Lists all active Earn strategies/wallets for the user. Returns current APY, balance, and status for each strategy. Use this to see where funds are staked.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_details",
        description:
            "Retrieves specific details for a single Earn strategy/wallet identified by its UUID. Includes performance metrics and configuration.",
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
        description:
            "Fetches transaction history (deposits, withdrawals, rewards) for a specific Earn wallet. Useful for auditing movements within a strategy.",
        inputSchema: {
            type: "object",
            properties: {
                walletId: { type: "string", description: "Earn wallet UUID" },
                limit: { type: "string", description: "Number of records to retrieve" },
                offset: { type: "string", description: "Pagination offset" },
            },
            required: ["walletId"],
        },
    },
    {
        name: "earn_get_transactions_summary",
        description: "Gets a summary of Earn transactions grouped by type (e.g., total deposits, total withdrawals).",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Movement type filter (e.g., DEPOSIT, WITHDRAWAL)" },
            },
            required: ["type"],
        },
    },
    {
        name: "earn_create_transaction",
        description:
            "Initiates a deposit or withdrawal operation for an Earn (Staking) strategy. REQUIRES a valid pocketId as source (for deposits) or destination (for withdrawals).",
        inputSchema: {
            type: "object",
            properties: {
                pocketId: {
                    type: "string",
                    description: "Source pocket UUID (for deposit) or destination (for withdrawal)",
                },
                currency: { type: "string", description: "Currency symbol (e.g., BTC, EUR)" },
                amount: { type: "string", description: "Amount to transfer" },
                type: { type: "string", enum: ["deposit", "withdrawal"], description: "Operation type" },
            },
            required: ["pocketId", "currency", "amount", "type"],
        },
    },
    {
        name: "earn_get_assets",
        description:
            "Lists all assets supported by the Earn service. Use this to check which cryptocurrencies can be staked.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_apy",
        description:
            "Retrieves current Annual Percentage Yields (APY) for all supported Earn assets. Use this to compare staking returns.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_rewards_config",
        description: "Gets the global configuration settings for Earn rewards distribution.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_rewards_config",
        description: "Gets specific reward configuration for a single Earn wallet.",
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
        description: "Gets a summary of rewards earned specifically by a single Earn wallet.",
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
        const params: Record<string, any> = {};
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
