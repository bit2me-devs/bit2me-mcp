/**
 * Health check tool for monitoring server status
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { performHealthCheck } from "../utils/health.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const healthTools: Tool[] = [
    {
        name: "server_health_check",
        description:
            "Check the health status of the MCP server. Returns server status, API connectivity, circuit breaker state, cache statistics, and metrics summary. Useful for monitoring and debugging.",
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
