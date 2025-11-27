import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Mocks must be hoisted or defined before imports
const mockSetRequestHandler = vi.fn();
const mockConnect = vi.fn();
const mockConstructor = vi.fn();

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
    Server: class {
        constructor(...args: any[]) {
            mockConstructor(...args);
        }
        setRequestHandler = mockSetRequestHandler;
        connect = mockConnect;
    },
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
    StdioServerTransport: vi.fn(),
}));

vi.mock("../src/config.js", () => ({
    getConfig: vi.fn(() => ({
        BIT2ME_API_KEY: "test-key",
        BIT2ME_API_SECRET: "test-secret",
        LOG_LEVEL: "info",
        REQUEST_TIMEOUT: 5000,
        MAX_RETRIES: 3,
    })),
}));

vi.mock("../src/utils/logger.js", () => ({
    initLogger: vi.fn(),
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock all tool modules
vi.mock("../src/tools/market.js", () => ({
    marketTools: [{ name: "market_get_ticker" }],
    handleMarketTool: vi.fn(),
}));
vi.mock("../src/tools/aggregation.js", () => ({ aggregationTools: [], handleAggregationTool: vi.fn() }));
vi.mock("../src/tools/wallet.js", () => ({ walletTools: [], handleWalletTool: vi.fn() }));
vi.mock("../src/tools/earn.js", () => ({ earnTools: [], handleEarnTool: vi.fn() }));
vi.mock("../src/tools/loan.js", () => ({ loanTools: [], handleLoanTool: vi.fn() }));
vi.mock("../src/tools/pro.js", () => ({ proTools: [], handleProTool: vi.fn() }));
vi.mock("../src/tools/account.js", () => ({ accountTools: [], handleAccountTool: vi.fn() }));
vi.mock("../src/prompts/index.js", () => ({ prompts: {}, handleGetPrompt: vi.fn() }));

describe("Server Entry Point", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset modules to ensure fresh execution of index.ts
        vi.resetModules();
    });

    it("should initialize server and connect", async () => {
        // Import index.ts to trigger execution
        await import("../src/index.js");

        // Verify Server construction
        expect(mockConstructor).toHaveBeenCalledWith(
            { name: "bit2me-mcp-server", version: "1.1.1" },
            { capabilities: { tools: {}, prompts: {} } }
        );

        // Verify handlers are set
        expect(mockSetRequestHandler).toHaveBeenCalledTimes(4); // ListTools, ListPrompts, GetPrompt, CallTool

        // Verify connection
        expect(mockConnect).toHaveBeenCalled();
    });

    it("should handle ListTools request", async () => {
        await import("../src/index.js");
        const listToolsHandler = mockSetRequestHandler.mock.calls.find(
            (call) =>
                call[0]?.name === "ListToolsRequestSchema" ||
                call[0] === require("@modelcontextprotocol/sdk/types.js").ListToolsRequestSchema
        )?.[1];

        // In the mock, we might not be able to easily identify the schema by object identity if modules are reset.
        // But we know the order: ListTools is the first setRequestHandler call.
        const handler = mockSetRequestHandler.mock.calls[0][1];
        const result = await handler();
        expect(result.tools).toBeDefined();
        expect(result.tools).toContainEqual({ name: "market_get_ticker" });
    });

    it("should handle ListPrompts request", async () => {
        await import("../src/index.js");
        const handler = mockSetRequestHandler.mock.calls[1][1]; // ListPrompts is second
        const result = await handler();
        expect(result.prompts).toBeDefined();
    });

    it("should handle GetPrompt request", async () => {
        await import("../src/index.js");
        const handler = mockSetRequestHandler.mock.calls[2][1]; // GetPrompt is third
        const { handleGetPrompt } = await import("../src/prompts/index.js");
        vi.mocked(handleGetPrompt).mockResolvedValue({ description: "test" } as any);

        await handler({ params: { name: "test_prompt" } });
        expect(handleGetPrompt).toHaveBeenCalledWith("test_prompt");
    });

    it("should handle tool execution requests for all tools", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];

        // Mock all tool handlers
        const { handleAggregationTool } = await import("../src/tools/aggregation.js");
        const { handleWalletTool } = await import("../src/tools/wallet.js");
        const { handleEarnTool } = await import("../src/tools/earn.js");
        const { handleLoanTool } = await import("../src/tools/loan.js");
        const { handleProTool } = await import("../src/tools/pro.js");
        const { handleAccountTool } = await import("../src/tools/account.js");

        // Update mocks to have tools in the lists so find() works
        vi.mocked(await import("../src/tools/aggregation.js")).aggregationTools = [{ name: "agg_tool" } as any];
        vi.mocked(await import("../src/tools/wallet.js")).walletTools = [{ name: "wallet_tool" } as any];
        vi.mocked(await import("../src/tools/earn.js")).earnTools = [{ name: "earn_tool" } as any];
        vi.mocked(await import("../src/tools/loan.js")).loanTools = [{ name: "loan_tool" } as any];
        vi.mocked(await import("../src/tools/pro.js")).proTools = [{ name: "pro_tool" } as any];
        vi.mocked(await import("../src/tools/account.js")).accountTools = [{ name: "account_tool" } as any];

        // Test Aggregation
        await callToolHandler({ params: { name: "agg_tool", arguments: {} } });
        expect(handleAggregationTool).toHaveBeenCalledWith("agg_tool", {});

        // Test Wallet
        await callToolHandler({ params: { name: "wallet_tool", arguments: {} } });
        expect(handleWalletTool).toHaveBeenCalledWith("wallet_tool", {});

        // Test Earn
        await callToolHandler({ params: { name: "earn_tool", arguments: {} } });
        expect(handleEarnTool).toHaveBeenCalledWith("earn_tool", {});

        // Test Loan
        await callToolHandler({ params: { name: "loan_tool", arguments: {} } });
        expect(handleLoanTool).toHaveBeenCalledWith("loan_tool", {});

        // Test Pro
        await callToolHandler({ params: { name: "pro_tool", arguments: {} } });
        expect(handleProTool).toHaveBeenCalledWith("pro_tool", {});

        // Test Account
        await callToolHandler({ params: { name: "account_tool", arguments: {} } });
        expect(handleAccountTool).toHaveBeenCalledWith("account_tool", {});
    });

    it("should handle tool execution requests", async () => {
        await import("../src/index.js");

        // Get the CallToolRequestSchema handler
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();

        if (!callToolHandler) return;

        // Mock tool handlers
        const { handleMarketTool } = await import("../src/tools/market.js");
        vi.mocked(handleMarketTool).mockResolvedValue({ content: [{ type: "text", text: "success" }] });

        // Test successful tool call
        const result = await callToolHandler({
            params: {
                name: "market_get_ticker",
                arguments: { symbol: "BTC" },
            },
        });

        expect(handleMarketTool).toHaveBeenCalledWith("market_get_ticker", { symbol: "BTC" });
        expect(result).toEqual({ content: [{ type: "text", text: "success" }] });
    });

    it("should handle unknown tool requests", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();

        if (!callToolHandler) return;

        const result = await callToolHandler({
            params: {
                name: "unknown_tool",
                arguments: {},
            },
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown tool: unknown_tool");
    });

    it("should handle tool execution errors", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();

        if (!callToolHandler) return;

        const { handleMarketTool } = await import("../src/tools/market.js");
        vi.mocked(handleMarketTool).mockRejectedValue(new Error("Tool failed"));

        const result = await callToolHandler({
            params: {
                name: "market_get_ticker",
                arguments: {},
            },
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Error executing market_get_ticker: Tool failed");
    });

    it("should handle startup errors gracefully", async () => {
        // Mock getConfig to throw
        vi.mocked(await import("../src/config.js")).getConfig.mockImplementationOnce(() => {
            throw new Error("Config error");
        });

        const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            await import("../src/index.js");
        } catch (e) {
            // Ignore import error if any
        }

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Server startup failed"));
    });
});
