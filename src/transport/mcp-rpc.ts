import { LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";
import { handleGetPrompt } from "../prompts/index.js";
import { getPrompts } from "../prompts/visible.js";
import { listResources, readResource, SERVER_NAME, SERVER_VERSION } from "../resources/index.js";
import { dispatchTool, getAllTools } from "../tools/registry.js";
import { ValidationError } from "../utils/errors.js";

export type JsonRpcId = string | number | null;

export function jsonRpcResult(id: JsonRpcId, result: unknown) {
    return { jsonrpc: "2.0" as const, id, result };
}

export function jsonRpcError(id: JsonRpcId, code: number, message: string) {
    return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

function stringRecord(value: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, item] of Object.entries(value)) {
        if (typeof item !== "string") {
            throw new ValidationError(`Invalid params: arguments.${key} must be a string`, "arguments", item);
        }
        out[key] = item;
    }
    return out;
}

function negotiatedProtocolVersion(requested: unknown): string {
    if (typeof requested === "string" && (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)) {
        return requested;
    }
    return LATEST_PROTOCOL_VERSION;
}

/** MCP `arguments` must be a JSON object (or omitted). Arrays/scalars are invalid. */
function asToolArgs(value: unknown): Record<string, unknown> | undefined {
    if (value === undefined || value === null) return {};
    if (typeof value !== "object" || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
}

function promptGet(params: Record<string, unknown> | undefined, id: JsonRpcId) {
    const name = params?.name;
    if (typeof name !== "string") {
        return jsonRpcError(id, -32602, "Invalid params: missing prompt name");
    }
    if (!getPrompts().some((prompt) => prompt.name === name)) {
        throw new ValidationError(`Prompt not found: ${name}`, "name", name);
    }
    const args = asToolArgs(params?.arguments);
    if (args === undefined) {
        return jsonRpcError(id, -32602, "Invalid params: arguments must be an object");
    }
    try {
        return jsonRpcResult(id, handleGetPrompt(name, stringRecord(args)));
    } catch (error) {
        if (error instanceof RangeError) {
            throw new ValidationError(error.message, "arguments");
        }
        throw error;
    }
}

/**
 * JSON-RPC methods shared by HTTP `POST /mcp`. Same catalogue as stdio:
 * tools, prompts, resources, plus initialize/ping for MCP clients.
 */
export async function handleMcpRpc(method: string, params: Record<string, unknown> | undefined, id: JsonRpcId) {
    switch (method) {
        case "initialize":
            return jsonRpcResult(id, {
                protocolVersion: negotiatedProtocolVersion(params?.protocolVersion),
                capabilities: { tools: {}, prompts: {}, resources: {} },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            });
        case "ping":
            return jsonRpcResult(id, {});
        case "notifications/initialized":
            // HTTP omits the body when `id` is absent (202). A client that
            // sent an id still gets an empty result.
            return jsonRpcResult(id, {});
        case "tools/list":
            return jsonRpcResult(id, { tools: getAllTools() });
        case "tools/call": {
            const name = params?.name;
            if (typeof name !== "string") {
                return jsonRpcError(id, -32602, "Invalid params: missing tool name");
            }
            const args = asToolArgs(params?.arguments);
            if (args === undefined) {
                return jsonRpcError(id, -32602, "Invalid params: arguments must be an object");
            }
            return jsonRpcResult(id, await dispatchTool(name, args));
        }
        case "prompts/list":
            return jsonRpcResult(id, { prompts: getPrompts() });
        case "prompts/get":
            return promptGet(params, id);
        case "resources/list":
            return jsonRpcResult(id, listResources());
        case "resources/read": {
            const uri = params?.uri;
            if (typeof uri !== "string") {
                return jsonRpcError(id, -32602, "Invalid params: missing uri");
            }
            return jsonRpcResult(id, readResource(uri));
        }
        default:
            return jsonRpcError(id, -32601, "Method not found");
    }
}
