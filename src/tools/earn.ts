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
            "View summary of accumulated rewards in Staking/Earn. Returns total rewards earned across all Earn wallets, breakdown by currency, and overall performance. Use this to see your total staking rewards.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallets",
        description:
            "List active Earn wallets/strategies with their current APY (Annual Percentage Yield). Returns wallet ID, currency, balance, APY, and status. Use this to see available staking options and their returns before depositing.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_details",
        description:
            "Get detailed information of a specific Earn wallet. Returns balance, APY, total rewards, status, and configuration. Use earn_get_wallets first to get the wallet ID.",
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
            "Get transaction history (movements) of an Earn wallet. Returns deposits, withdrawals, and reward payments with amounts, dates, and status. Optional limit and offset for pagination. Use earn_get_wallets first to get the wallet ID.",
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
        description:
            "Get summary statistics of Earn movements filtered by type (DEPOSIT, WITHDRAWAL, etc.). Returns total count, total amounts, and aggregated data for the specified movement type across all Earn wallets.",
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
        description:
            "Create deposit or withdrawal in Earn (Staking). For deposits, funds move from Simple Wallet pocket to Earn. For withdrawals, funds return from Earn to the specified pocket. Returns transaction details with status. Use earn_get_wallets to see available Earn strategies first.",
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
        description:
            "Get list of assets (cryptocurrencies) supported in Earn/Staking. Returns available currencies with their staking options. Use this to discover which assets can be staked before creating Earn transactions.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_apy",
        description:
            "Get current APY (Annual Percentage Yield) rates for all Earn/Staking options. Returns APY percentages per asset and strategy. Use this to compare returns before choosing where to stake your assets.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_rewards_config",
        description:
            "Get global rewards configuration for Earn/Staking. Returns reward calculation rules, distribution schedules, and general staking parameters. Use this to understand how rewards are calculated.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "earn_get_wallet_rewards_config",
        description:
            "Get rewards configuration for a specific Earn wallet. Returns reward calculation rules, APY details, and wallet-specific staking parameters. Use earn_get_wallets first to get the wallet ID.",
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
        description:
            "Get rewards summary for a specific Earn wallet. Returns total rewards earned, pending rewards, reward history, and performance metrics. Use earn_get_wallets first to get the wallet ID.",
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
