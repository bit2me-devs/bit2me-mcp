import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockEnv, clearEnv } from "./config-env.js";

vi.mock("dotenv", () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        addSensitiveKey: vi.fn(),
        setLevel: vi.fn(),
        setValueTruncateAt: vi.fn(),
    },
    initLogger: vi.fn(),
}));

describe("Config - HTTP, gateway and trust-proxy", () => {
    beforeEach(() => {
        vi.resetModules();
        clearEnv();
        vi.clearAllMocks();
    });

    afterEach(() => {
        clearEnv();
    });

    it("should use default gateway URL when not specified", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        const { getConfig, getGatewayUrl } = await import("../src/config.js");
        const config = getConfig();

        expect(config.GATEWAY_URL).toBe("https://gateway.bit2me.com");
        expect(getGatewayUrl()).toBe("https://gateway.bit2me.com");
    });

    it("should use custom gateway URL when specified", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_GATEWAY_URL: "https://qa-gateway.bit2me.com",
        });

        const { getConfig, getGatewayUrl } = await import("../src/config.js");
        const config = getConfig();

        expect(config.GATEWAY_URL).toBe("https://qa-gateway.bit2me.com");
        expect(getGatewayUrl()).toBe("https://qa-gateway.bit2me.com");
    });

    it("should remove trailing slash from gateway URL", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_GATEWAY_URL: "https://qa-gateway.bit2me.com/",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.GATEWAY_URL).toBe("https://qa-gateway.bit2me.com");
    });

    it("defaults HTTP transport settings to safe values", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.HTTP_HOST).toBe("127.0.0.1");
        expect(config.HTTP_PORT).toBe(3000);
        expect(config.HTTP_AUTH_MODE).toBe("api_key");
        expect(config.HTTP_TRUST_PROXY).toBe(false);
    });

    it("rejects an invalid MCP_HTTP_AUTH_MODE", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            MCP_HTTP_AUTH_MODE: "anything",
        });

        const { getConfig } = await import("../src/config.js");
        expect(() => getConfig()).toThrow();
    });

    it("rejects an invalid MCP_HTTP_PORT", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            MCP_HTTP_PORT: "not-a-port",
        });

        const { getConfig } = await import("../src/config.js");
        expect(() => getConfig()).toThrow();
    });

    it("rejects an invalid BIT2ME_SESSION_COOKIE_NAME", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_SESSION_COOKIE_NAME: "not\rsafe",
        });

        const { getConfig } = await import("../src/config.js");
        expect(() => getConfig()).toThrow();
    });

    it("parses MCP_HTTP_TRUST_PROXY into structured values", async () => {
        const cases: Array<[string | undefined, boolean | string | string[]]> = [
            [undefined, false],
            ["false", false],
            ["off", false],
            ["0", false],
            ["true", true],
            ["loopback", "loopback"],
            ["10.0.0.0/8,192.168.0.0/16", ["10.0.0.0/8", "192.168.0.0/16"]],
        ];

        for (const [raw, expected] of cases) {
            vi.resetModules();
            clearEnv();
            mockEnv({
                BIT2ME_API_KEY: "test-key",
                BIT2ME_API_SECRET: "test-secret",
                ...(raw !== undefined ? { MCP_HTTP_TRUST_PROXY: raw } : {}),
            });
            const { getConfig } = await import("../src/config.js");
            const cfg = getConfig();
            expect(cfg.HTTP_TRUST_PROXY).toEqual(expected);
        }
    });

    it("should log info when using custom gateway", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_GATEWAY_URL: "https://staging.bit2me.com",
        });

        vi.resetModules();
        const { logger } = await import("../src/utils/logger.js");
        const { getConfig, logConfig } = await import("../src/config.js");

        const config = getConfig();
        logConfig(config);

        expect(logger.info).toHaveBeenCalledWith("Using custom gateway: https://staging.bit2me.com");
    });

    it("warns when INCLUDE_RAW_RESPONSE is enabled", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_INCLUDE_RAW_RESPONSE: "true",
        });

        vi.resetModules();
        const { logger } = await import("../src/utils/logger.js");
        const { getConfig, logConfig } = await import("../src/config.js");

        logConfig(getConfig());

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("BIT2ME_INCLUDE_RAW_RESPONSE=true"));
    });
});
