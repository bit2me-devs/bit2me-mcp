/**
 * Tool registry — single declarative source of truth for which category
 * owns each tool name.
 *
 * Phase 2 of the hardening plan. The previous dispatcher in `src/index.ts`
 * walked an `if (xxxTools.find((t) => t.name === name))` chain for every
 * incoming `CallToolRequest`, which is O(N) per call. The registry below
 * builds an O(1) `Map<string, Handler>` once at module load and exposes a
 * single `dispatchTool()` entry point.
 *
 * Backwards compatibility is preserved: each `handleXxxTool()` keeps its
 * own internal `if (name === ...)` branches; the registry only replaces
 * the *outer* dispatch chain.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { generalTools, handleGeneralTool } from "./general.js";
import { brokerTools, handleBrokerTool } from "./broker.js";
import { walletTools, handleWalletTool } from "./wallet.js";
import { earnTools, handleEarnTool } from "./earn.js";
import { loanTools, handleLoanTool } from "./loan.js";
import { proTools, handleProTool } from "./pro.js";

export type ToolHandler = (name: string, args: Record<string, unknown>) => Promise<CallToolResult>;

interface ToolRegistration {
    category: string;
    handler: ToolHandler;
    tool: Tool;
}

const registry = new Map<string, ToolRegistration>();

function registerCategory(category: string, tools: readonly Tool[], handler: ToolHandler): void {
    for (const tool of tools) {
        if (registry.has(tool.name)) {
            // Defensive: two categories should never claim the same tool name.
            throw new Error(
                `Tool name collision: "${tool.name}" registered by both ` +
                    `"${registry.get(tool.name)?.category}" and "${category}"`
            );
        }
        registry.set(tool.name, { category, handler: handler as ToolHandler, tool });
    }
}

registerCategory("general", generalTools, handleGeneralTool as ToolHandler);
registerCategory("broker", brokerTools, handleBrokerTool as ToolHandler);
registerCategory("wallet", walletTools, handleWalletTool as ToolHandler);
registerCategory("earn", earnTools, handleEarnTool as ToolHandler);
registerCategory("loan", loanTools, handleLoanTool as ToolHandler);
registerCategory("pro", proTools, handleProTool as ToolHandler);

/** Return the merged list of every registered tool. Order matches insertion. */
export function getAllTools(): Tool[] {
    return Array.from(registry.values(), (r) => r.tool);
}

/** Resolve a tool name to its category, or undefined. */
export function getToolCategory(name: string): string | undefined {
    return registry.get(name)?.category;
}

/**
 * Dispatch a tool call to its registered handler.
 * Throws if the tool is unknown.
 */
export async function dispatchTool(
    name: string,
    args: Record<string, unknown>
): Promise<CallToolResult> {
    const entry = registry.get(name);
    if (!entry) {
        throw new Error(`Unknown tool: ${name}`);
    }
    return entry.handler(name, args);
}
