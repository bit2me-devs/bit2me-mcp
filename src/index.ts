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
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
export const VERSION = packageJson.version;

import { getConfig, logConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { dispatchTool, getAllTools } from "./tools/registry.js";
import { prompts, handleGetPrompt } from "./prompts/index.js";

// --- STARTUP VALIDATION ---

try {
    // Validate credentials and initialize configuration
    const config = getConfig();

    // Initialize logger with configured level
    initLogger(config.LOG_LEVEL);

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
    console.error("Please check your .env file or environment variables");
    process.exit(1);
}

// --- MCP SERVER DEFINITION ---

const server = new Server(
    { name: "bit2me-mcp-server", version: VERSION },
    { capabilities: { tools: {}, prompts: {} } }
);

// --- TOOL LISTING ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: getAllTools(),
    };
});

// --- PROMPT MANAGEMENT ---

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return handleGetPrompt(request.params.name, request.params.arguments);
});

// --- TOOL IMPLEMENTATION ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        return await dispatchTool(name, (args ?? {}) as Record<string, unknown>);
    } catch (error: any) {
        logger.error(`Error executing tool: ${name}`, { error: error.message });
        return {
            content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
            isError: true,
        };
    }
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
