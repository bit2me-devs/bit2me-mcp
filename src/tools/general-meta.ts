import { isToolEnabled } from "../utils/enabled-categories.js";
import { performHealthCheck } from "../utils/health.js";
import { getToolMetadata } from "../utils/tool-metadata.js";

export async function handleGeneralHealth(_args: Record<string, unknown>) {
    const health = performHealthCheck();

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(health, null, 2),
            },
        ],
    };
}

export async function handleGeneralDescribeTool(args: Record<string, unknown>) {
    const targetName = typeof args.tool_name === "string" ? args.tool_name : undefined;
    if (!targetName) {
        throw new Error("tool_name is required");
    }
    const meta = getToolMetadata(targetName);
    if (!meta || !isToolEnabled(targetName)) {
        throw new Error(`Unknown tool: ${targetName}`);
    }
    const result = {
        name: meta.name,
        description: meta.description,
        type: meta.type,
        attributes: meta.attributes,
        inputSchema: meta.inputSchema,
        exampleArgs: meta.exampleArgs,
        exampleResponse: meta.exampleResponse,
    };
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
}
