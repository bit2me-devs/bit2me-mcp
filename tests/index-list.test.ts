import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version: PACKAGE_VERSION } = require("../package.json");

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
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
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

describe("Server Entry Point", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("should initialize server and connect", async () => {
        await import("../src/index.js");

        expect(mockConstructor).toHaveBeenCalledWith(
            { name: "bit2me-mcp-server", version: PACKAGE_VERSION },
            { capabilities: { tools: {}, prompts: {}, resources: {} } }
        );

        expect(mockSetRequestHandler).toHaveBeenCalledTimes(6);

        expect(mockConnect).toHaveBeenCalled();
    });

    it("should handle ListTools request", async () => {
        await import("../src/index.js");
        const { ListToolsRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");
        const listToolsHandler = mockSetRequestHandler.mock.calls.find(
            (call) => call[0]?.name === "ListToolsRequestSchema" || call[0] === ListToolsRequestSchema
        )?.[1];

        const handler = listToolsHandler || mockSetRequestHandler.mock.calls[0][1];
        const result = await handler();
        expect(result.tools).toBeDefined();
        expect(result.tools).toContainEqual({ name: "general_get_assets_config" });
        expect(result.tools).toContainEqual({ name: "portfolio_get_valuation" });
        expect(result.tools).toContainEqual({ name: "broker_get_asset_price" });
        expect(result.tools).toContainEqual({ name: "broker_get_asset_data" });
    });

    it("should handle ListPrompts request", async () => {
        await import("../src/index.js");
        const handler = mockSetRequestHandler.mock.calls[1][1];
        const result = await handler();
        expect(result.prompts).toBeDefined();
    });

    it("should handle GetPrompt request", async () => {
        await import("../src/index.js");
        const handler = mockSetRequestHandler.mock.calls[2][1];
        const { handleGetPrompt } = await import("../src/prompts/index.js");
        vi.mocked(handleGetPrompt).mockReturnValue({
            messages: [{ role: "user", content: { type: "text", text: "test" } }],
        });

        await handler({ params: { name: "test_prompt" } });
        expect(handleGetPrompt).toHaveBeenCalledWith("test_prompt", undefined);
    });

    it("should handle startup errors gracefully", async () => {
        vi.mocked(await import("../src/config.js")).getConfig.mockImplementationOnce(() => {
            throw new Error("Config error");
        });

        const mockExit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit);
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            await import("../src/index.js");
        } catch {
            // Ignore import error if any
        }

        expect(mockExit).toHaveBeenCalledWith(1);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Server startup failed"));
    });
});
