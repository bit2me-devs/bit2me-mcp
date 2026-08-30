#!/usr/bin/env node
// All diagnostic output must go to stderr; stdout is reserved for the MCP
// JSON-RPC framing and any rogue write to it (`console.log`, third-party
// `process.stdout.write`, etc.) can desync the client. The logger writes
// directly to stderr (see src/utils/logger.ts), so we no longer need the
// legacy `console.log = console.error` hack.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getConfig, logConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { initAudit } from "./utils/audit.js";
import { dispatchTool, getAllTools } from "./tools/registry.js";
import { handleGetPrompt } from "./prompts/index.js";
import { getPrompts } from "./prompts/visible.js";
import { listResources, readResource } from "./resources/index.js";
import { ValidationError } from "./utils/errors.js";
import { PACKAGE_VERSION } from "./package-version.js";

export const VERSION = PACKAGE_VERSION;

// --- STARTUP VALIDATION ---

try {
    // Validate credentials and initialize configuration
    const config = getConfig();

    // Initialize logger with configured level
    initLogger(config.LOG_LEVEL);

    // Validate the audit log destination (if configured) before any tool
    // dispatch can attempt to write to it. Failing here is preferable to
    // silently downgrading to logger fallback when the operator expected
    // a persistent file.
    initAudit();

    // Emit informational config logs explicitly (previously a side-effect
    // of `getConfig()` itself). Doing it here avoids logging unrelated
    // module imports / tests.
    logConfig(config);

    logger.info("Bit2Me MCP Server initializing...", {
        version: VERSION,
        timeout: config.REQUEST_TIMEOUT,
        maxRetries: config.MAX_RETRIES,
        logLevel: config.LOG_LEVEL,
    });
} catch (error) {
    // Use console.error here because logger may not be initialized yet
    console.error("❌ Server startup failed - Invalid configuration");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}

// --- MCP SERVER DEFINITION ---

const server = new Server(
    { name: "bit2me-mcp-server", version: VERSION },
    { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// --- TOOL LISTING ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: getAllTools(),
    };
});

// --- PROMPT MANAGEMENT ---

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: getPrompts() };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    if (!getPrompts().some((prompt) => prompt.name === name)) {
        throw new ValidationError(`Prompt not found: ${name}`, "name", name);
    }
    try {
        return handleGetPrompt(name, request.params.arguments);
    } catch (error) {
        if (error instanceof RangeError) {
            throw new ValidationError(error.message, "arguments");
        }
        throw error;
    }
});

// --- TOOL IMPLEMENTATION ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        return await dispatchTool(name, (args ?? {}) as Record<string, unknown>);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error executing tool: ${name}`, { error: message });
        return {
            content: [{ type: "text", text: `Error executing ${name}: ${message}` }],
            isError: true,
        };
    }
});

// --- RESOURCES (stdio + HTTP JSON-RPC resources/*) ---

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return listResources();
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return readResource(request.params.uri);
});

// --- START SERVER ---
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("Bit2Me MCP Server running on stdio");
}

run().catch((error) => {
    logger.error("Fatal error starting server", { error: error.message });
    process.exit(1);
});
