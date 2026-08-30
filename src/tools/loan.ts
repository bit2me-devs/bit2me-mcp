import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import {
    handleLoanGetSimulation,
    handleLoanGetConfig,
    handleLoanGetMovements,
    handleLoanGetOrders,
} from "./loan-read.js";
import { handleLoanCreate, handleLoanIncreaseGuarantee, handleLoanPayback } from "./loan-write.js";

export const loanTools: Tool[] = getCategoryTools("loan");

export const loanHandlers = new Map<string, NamedToolHandler>([
    ["loan_get_simulation", handleLoanGetSimulation],
    ["loan_get_config", handleLoanGetConfig],
    ["loan_get_movements", handleLoanGetMovements],
    ["loan_get_orders", handleLoanGetOrders],
    ["loan_create", handleLoanCreate],
    ["loan_increase_guarantee", handleLoanIncreaseGuarantee],
    ["loan_payback", handleLoanPayback],
]);

/**
 * Handles loan-related tool requests
 */
export async function handleLoanTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(loanHandlers, name, "loan");
        return handler(args);
    });
}
