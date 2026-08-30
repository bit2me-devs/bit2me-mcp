import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import { handleGeneralGetAssetsConfig } from "./general-assets.js";
import { handlePortfolioGetValuation } from "./general-portfolio.js";
import { handleGeneralHealth, handleGeneralDescribeTool } from "./general-meta.js";

export const generalTools: Tool[] = getCategoryTools("general");

export const generalHandlers = new Map<string, NamedToolHandler>([
    ["general_get_assets_config", handleGeneralGetAssetsConfig],
    ["portfolio_get_valuation", handlePortfolioGetValuation],
    ["general_health", handleGeneralHealth],
    ["general_describe_tool", handleGeneralDescribeTool],
]);

/**
 * Handles general tool requests (assets, portfolio, health)
 */
export async function handleGeneralTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(generalHandlers, name, "general");
        return handler(args);
    });
}
