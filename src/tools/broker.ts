import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import { handleBrokerGetAssetPrice, handleBrokerGetAssetData } from "./broker-read.js";
import { handleBrokerGetAssetChart } from "./broker-chart.js";
import {
    handleBrokerQuoteBuy,
    handleBrokerQuoteSell,
    handleBrokerQuoteSwap,
    handleBrokerConfirmQuote,
} from "./broker-quote.js";
import { handleWalletGetCards } from "./broker-cards.js";

export const brokerTools: Tool[] = getCategoryTools("broker");

export const brokerHandlers = new Map<string, NamedToolHandler>([
    ["broker_get_asset_price", handleBrokerGetAssetPrice],
    ["broker_get_asset_data", handleBrokerGetAssetData],
    ["broker_get_asset_chart", handleBrokerGetAssetChart],
    ["broker_quote_buy", handleBrokerQuoteBuy],
    ["broker_quote_sell", handleBrokerQuoteSell],
    ["broker_quote_swap", handleBrokerQuoteSwap],
    ["broker_confirm_quote", handleBrokerConfirmQuote],
    ["wallet_get_cards", handleWalletGetCards],
]);

/**
 * Handles broker-related tool requests (simple trading and broker prices)
 */
export async function handleBrokerTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(brokerHandlers, name, "broker");
        return handler(args);
    });
}
