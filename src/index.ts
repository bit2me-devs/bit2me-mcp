#!/usr/bin/env node
// Redirect console.log to console.error to prevent stdout pollution breaking MCP protocol
console.log = console.error;

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { marketTools, handleMarketTool } from "./tools/market/index.js";
import { assetTools, handleAssetTool } from "./tools/assets/index.js";
import { operationTools, handleOperationTool } from "./tools/operations/index.js";
import { aggregationTools, handleAggregationTool } from "./tools/aggregation/index.js";
import { prompts, handleGetPrompt } from "./prompts/index.js";

// --- STARTUP VALIDATION ---

try {
    // Validate credentials and initialize configuration
    const config = getConfig();

    // Initialize logger with configured level
    initLogger(config.LOG_LEVEL);

    logger.info('Bit2Me MCP Server initializing...', {
        version: '1.0.0',
        timeout: config.REQUEST_TIMEOUT,
        maxRetries: config.MAX_RETRIES,
        logLevel: config.LOG_LEVEL,
    });
} catch (error) {
    console.error('❌ Server startup failed - Invalid configuration');
    console.error('Please check your .env file or environment variables');
    process.exit(1);
}

// --- MCP SERVER DEFINITION ---

const server = new Server(
    { name: "bit2me-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {}, prompts: {} } }
);

// --- TOOL LISTING ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            ...marketTools,
            ...assetTools,
            ...operationTools,
            ...aggregationTools
        ]
    };
});

// --- PROMPT MANAGEMENT ---

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return handleGetPrompt(request.params.name);
});

// --- TOOL IMPLEMENTATION ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (marketTools.find(t => t.name === name)) {
            return await handleMarketTool(name, args);
        }
        if (assetTools.find(t => t.name === name)) {
            return await handleAssetTool(name, args);
        }
        if (operationTools.find(t => t.name === name)) {
            return await handleOperationTool(name, args);
        }
        if (aggregationTools.find(t => t.name === name)) {
            return await handleAggregationTool(name, args);
        }

        throw new Error(`Unknown tool: ${name}`);

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
