/**
 * Health check tool for monitoring server status
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { performHealthCheck } from "../utils/health.js";
import { executeTool } from "../utils/tool-wrapper.js";

export const healthTools: Tool[] = [
    {
        name: "server_health_check",
        description:
            "Check the system health. Returns global status (online/degraded/offline), Bit2Me server reachability, and MCP server status.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];

/**
 * Handle health check tool requests
 */
export async function handleHealthTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "server_health_check") {
            const health = await performHealthCheck();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(health, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown health tool: ${name}`);
    });
}
