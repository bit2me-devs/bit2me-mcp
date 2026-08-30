import { describe, it, expect, vi, beforeEach } from "vitest";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const mockSetRequestHandler = vi.fn();
const mockConnect = vi.fn();
const mockConstructor = vi.fn();

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
    Server: class {
        constructor(...args: unknown[]) {
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
        GATEWAY_URL: "https://gateway.bit2me.com",
        SESSION_COOKIE_NAME: "b2m-atoken",
    })),
    logConfig: vi.fn(),
}));

vi.mock("../src/utils/logger.js", () => ({
    initLogger: vi.fn(),
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../src/tools/general.js", () => ({
    generalTools: [{ name: "general_get_assets_config" }, { name: "portfolio_get_valuation" }],
    handleGeneralTool: vi.fn(),
}));
vi.mock("../src/tools/broker.js", () => ({
    brokerTools: [{ name: "broker_get_asset_price" }, { name: "broker_get_asset_data" }],
    handleBrokerTool: vi.fn(),
}));
vi.mock("../src/tools/wallet.js", () => ({ walletTools: [], handleWalletTool: vi.fn() }));
vi.mock("../src/tools/earn.js", () => ({ earnTools: [], handleEarnTool: vi.fn() }));
vi.mock("../src/tools/loan.js", () => ({ loanTools: [], handleLoanTool: vi.fn() }));
vi.mock("../src/tools/pro.js", () => ({ proTools: [], handleProTool: vi.fn() }));
vi.mock("../src/tools/account.js", () => ({ accountTools: [], handleAccountTool: vi.fn() }));
vi.mock("../src/prompts/index.js", () => ({
    prompts: {},
    handleGetPrompt: vi.fn(),
}));
vi.mock("../src/prompts/visible.js", () => ({
    getPrompts: vi.fn(() => [{ name: "test_prompt" }]),
}));

describe("Server Entry Point — tools/call", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("should handle tool execution requests for all tools", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        const { handleGeneralTool } = await import("../src/tools/general.js");
        const { handleBrokerTool } = await import("../src/tools/broker.js");

        await callToolHandler({ params: { name: "general_get_assets_config", arguments: {} } });
        expect(handleGeneralTool).toHaveBeenCalledWith("general_get_assets_config", {});

        await callToolHandler({ params: { name: "broker_get_asset_data", arguments: {} } });
        expect(handleBrokerTool).toHaveBeenCalledWith("broker_get_asset_data", {});
    });

    it("should handle tool execution requests", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();
        if (!callToolHandler) return;

        const { handleBrokerTool } = await import("../src/tools/broker.js");
        vi.mocked(handleBrokerTool).mockResolvedValue({ content: [{ type: "text", text: "success" }] });

        const result = await callToolHandler({
            params: { name: "broker_get_asset_data", arguments: { base_symbol: "BTC" } },
        });

        expect(handleBrokerTool).toHaveBeenCalledWith("broker_get_asset_data", { base_symbol: "BTC" });
        expect(result).toEqual({ content: [{ type: "text", text: "success" }] });
    });

    it("should handle unknown tool requests", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();
        if (!callToolHandler) return;

        const result = await callToolHandler({
            params: { name: "unknown_tool", arguments: {} },
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unknown tool: unknown_tool");
    });

    it("should handle tool execution errors", async () => {
        await import("../src/index.js");
        const callToolHandler = mockSetRequestHandler.mock.calls.find((call) => call[0] === CallToolRequestSchema)?.[1];
        expect(callToolHandler).toBeDefined();
        if (!callToolHandler) return;

        const { handleBrokerTool } = await import("../src/tools/broker.js");
        vi.mocked(handleBrokerTool).mockRejectedValue(new Error("Tool failed"));

        const result = await callToolHandler({
            params: { name: "broker_get_asset_data", arguments: {} },
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Error executing broker_get_asset_data: Tool failed");
    });
});
