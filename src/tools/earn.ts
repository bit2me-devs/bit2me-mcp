import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import { handleEarnGetSummary, handleEarnGetPositions } from "./earn-read.js";
import {
    handleEarnGetPositionMovements,
    handleEarnGetMovements,
    handleEarnGetMovementsSummary,
} from "./earn-movements.js";
import { handleEarnDeposit, handleEarnWithdraw } from "./earn-write.js";
import {
    handleEarnGetAssets,
    handleEarnGetRewardsConfig,
    handleEarnGetPositionRewardsConfig,
    handleEarnGetPositionRewardsSummary,
} from "./earn-rewards.js";

export const earnTools: Tool[] = getCategoryTools("earn");

export const earnHandlers = new Map<string, NamedToolHandler>([
    ["earn_get_summary", handleEarnGetSummary],
    ["earn_get_positions", handleEarnGetPositions],
    ["earn_get_position_movements", handleEarnGetPositionMovements],
    ["earn_get_movements", handleEarnGetMovements],
    ["earn_get_movements_summary", handleEarnGetMovementsSummary],
    ["earn_deposit", handleEarnDeposit],
    ["earn_withdraw", handleEarnWithdraw],
    ["earn_get_assets", handleEarnGetAssets],
    ["earn_get_rewards_config", handleEarnGetRewardsConfig],
    ["earn_get_position_rewards_config", handleEarnGetPositionRewardsConfig],
    ["earn_get_position_rewards_summary", handleEarnGetPositionRewardsSummary],
]);

/**
 * Handles earn/staking-related tool requests
 */
export async function handleEarnTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(earnHandlers, name, "earn");
        return handler(args);
    });
}
