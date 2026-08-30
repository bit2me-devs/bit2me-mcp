import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import { handleWalletGetPockets, handleWalletGetPocketAddresses, handleWalletGetNetworks } from "./wallet-pockets.js";
import { handleWalletGetMovements } from "./wallet-tx.js";

export const walletTools: Tool[] = getCategoryTools("wallet");

export const walletHandlers = new Map<string, NamedToolHandler>([
    ["wallet_get_pockets", handleWalletGetPockets],
    ["wallet_get_pocket_addresses", handleWalletGetPocketAddresses],
    ["wallet_get_networks", handleWalletGetNetworks],
    ["wallet_get_movements", handleWalletGetMovements],
]);

/**
 * Handles wallet-related tool requests
 */
export async function handleWalletTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(walletHandlers, name, "wallet");
        return handler(args);
    });
}
