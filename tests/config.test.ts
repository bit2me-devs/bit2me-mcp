import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables
const mockEnv = (env: Record<string, string>) => {
    Object.keys(env).forEach((key) => {
        process.env[key] = env[key];
    });
};

const clearEnv = () => {
    delete process.env.BIT2ME_API_KEY;
    delete process.env.BIT2ME_API_SECRET;
    delete process.env.BIT2ME_GATEWAY_URL;
    delete process.env.BIT2ME_REQUEST_TIMEOUT;
    delete process.env.BIT2ME_LOG_LEVEL;
    delete process.env.BIT2ME_MAX_RETRIES;
    delete process.env.BIT2ME_RETRY_BASE_DELAY;
    delete process.env.BIT2ME_INCLUDE_RAW_RESPONSE;
};

// Mock dotenv to prevent loading real .env file
vi.mock("dotenv", () => ({
    default: { config: vi.fn() },
    config: vi.fn(),
}));

// Mock logger
vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

describe("Config - Validation and Defaults", () => {
    beforeEach(() => {
        // Clear config cache by reloading module
        vi.resetModules();
        clearEnv();
        vi.clearAllMocks();
    });

    afterEach(() => {
        clearEnv();
    });

    it("should throw error when credentials are missing", async () => {
        clearEnv();
        vi.resetModules();

        // Re-import modules to get fresh instances
        const { logger } = await import("../src/utils/logger.js");
        const { getConfig } = await import("../src/config.js");

        try {
            getConfig();
            expect.fail("Expected getConfig to throw, but it did not");
        } catch (error: any) {
            expect(error).toBeDefined();
            // Verify logger.error was called on the re-imported instance
            expect(logger.error).toHaveBeenCalled();
        }
    });

    it("should load credentials successfully", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.BIT2ME_API_KEY).toBe("test-key");
        expect(config.BIT2ME_API_SECRET).toBe("test-secret");
    });

    it("should apply default values for optional config", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.REQUEST_TIMEOUT).toBe(30000);
        expect(config.MAX_RETRIES).toBe(3);
        expect(config.RETRY_BASE_DELAY).toBe(1000);
        expect(config.LOG_LEVEL).toBe("info");
    });

    it("should parse custom timeout value", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_REQUEST_TIMEOUT: "60000",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.REQUEST_TIMEOUT).toBe(60000);
    });

    it("should parse custom retry configuration", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_MAX_RETRIES: "5",
            BIT2ME_RETRY_BASE_DELAY: "2000",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.MAX_RETRIES).toBe(5);
        expect(config.RETRY_BASE_DELAY).toBe(2000);
    });

    it("should parse custom log level", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_LOG_LEVEL: "debug",
        });

        const { getConfig } = await import("../src/config.js");
        const config = getConfig();

        expect(config.LOG_LEVEL).toBe("debug");
    });

    it("should cache configuration after first load", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        vi.resetModules();
        const { getConfig } = await import("../src/config.js");
        const { logger } = await import("../src/utils/logger.js");

        const config1 = getConfig();
        const config2 = getConfig();

        expect(config1).toBe(config2); // Same reference

        // Should only log "Configuration validated successfully" once
        const validationLogs = vi
            .mocked(logger.debug)
            .mock.calls.filter((call: any) => call[0] === "Configuration validated successfully");
        expect(validationLogs.length).toBe(1);
    });

    it("should handle non-ZodError exceptions", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        vi.resetModules();
        const { logger } = await import("../src/utils/logger.js");

        // We'll test by mocking parseInt to throw
        const originalParseInt = global.parseInt;
        global.parseInt = (() => {
            throw new Error("Custom parse error");
        }) as any;

        const { getConfig } = await import("../src/config.js");

        try {
            getConfig();
            expect.fail("Expected getConfig to throw");
        } catch (error: any) {
            expect(error.message).toBe("Custom parse error");
            expect(logger.error).toHaveBeenCalledWith(
                "Credential validation failed",
                expect.objectContaining({ error: expect.any(Error) })
            );
        } finally {
            global.parseInt = originalParseInt;
        }
    });

    it("should work with config proxy getter", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        const { config } = await import("../src/config.js");

        expect(config.BIT2ME_API_KEY).toBe("test-key");
        expect(config.REQUEST_TIMEOUT).toBe(30000);
        expect(config.LOG_LEVEL).toBe("info");
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

    it("should log info when using custom gateway", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_GATEWAY_URL: "https://staging.bit2me.com",
        });

        vi.resetModules();
        const { logger } = await import("../src/utils/logger.js");
        const { getConfig } = await import("../src/config.js");

        getConfig();

        expect(logger.info).toHaveBeenCalledWith("Using custom gateway: https://staging.bit2me.com");
    });
});
