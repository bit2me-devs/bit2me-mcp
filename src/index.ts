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
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
export const VERSION = packageJson.version;

import { getConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { generalTools, handleGeneralTool } from "./tools/general.js";
import { brokerTools, handleBrokerTool } from "./tools/broker.js";
import { walletTools, handleWalletTool } from "./tools/wallet.js";
import { earnTools, handleEarnTool } from "./tools/earn.js";
import { loanTools, handleLoanTool } from "./tools/loan.js";
import { proTools, handleProTool } from "./tools/pro.js";
import { prompts, handleGetPrompt } from "./prompts/index.js";

// --- STARTUP VALIDATION ---

try {
    // Validate credentials and initialize configuration
    const config = getConfig();

    // Initialize logger with configured level
    initLogger(config.LOG_LEVEL);

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
        tools: [...generalTools, ...brokerTools, ...walletTools, ...earnTools, ...loanTools, ...proTools],
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
        if (generalTools.find((t) => t.name === name)) {
            return await handleGeneralTool(name, args);
        }
        if (brokerTools.find((t) => t.name === name)) {
            return await handleBrokerTool(name, args);
        }
        if (walletTools.find((t) => t.name === name)) {
            return await handleWalletTool(name, args);
        }
        if (earnTools.find((t) => t.name === name)) {
            return await handleEarnTool(name, args);
        }
        if (loanTools.find((t) => t.name === name)) {
            return await handleLoanTool(name, args);
        }
        if (proTools.find((t) => t.name === name)) {
            return await handleProTool(name, args);
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
