import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import { mapAccountInfoResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const accountTools: Tool[] = getCategoryTools("account");

/**
 * Handles account-related tool requests
 * @param name - Name of the tool to execute
 * @param _args - Tool arguments (unused for account tools)
 * @returns Tool response with optimized account data
 */
export async function handleAccountTool(name: string, _args: unknown) {
    return executeTool(name, _args, async () => {
        if (name === "account_get_info") {
            const requestContext = {};
            const data = await bit2meRequest("GET", "/v1/account");
            const optimized = mapAccountInfoResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown account tool: ${name}`);
    });
}
