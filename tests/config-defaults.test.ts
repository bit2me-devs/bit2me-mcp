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

describe("Config - Validation and Defaults", () => {
    beforeEach(() => {
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

        const { logger } = await import("../src/utils/logger.js");
        const { getConfig } = await import("../src/config.js");

        try {
            getConfig();
            expect.fail("Expected getConfig to throw, but it did not");
        } catch (error: unknown) {
            expect(error).toBeDefined();
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

        expect(config1).toBe(config2);

        const validationLogs = vi
            .mocked(logger.debug)
            .mock.calls.filter((call) => call[0] === "Configuration validated successfully");
        expect(validationLogs.length).toBe(1);
    });

    it("should handle non-ZodError exceptions", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
        });

        vi.resetModules();
        const { logger } = await import("../src/utils/logger.js");

        const originalParseInt = global.parseInt;
        global.parseInt = (() => {
            throw new Error("Custom parse error");
        }) as typeof parseInt;

        const { getConfig } = await import("../src/config.js");

        try {
            getConfig();
            expect.fail("Expected getConfig to throw");
        } catch (error: unknown) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe("Custom parse error");
            expect(logger.error).toHaveBeenCalledWith(
                "Credential validation failed",
                expect.objectContaining({ error: expect.any(Error) })
            );
        } finally {
            global.parseInt = originalParseInt;
        }
    });

    it("rejects an unknown BIT2ME_ENABLED_CATEGORIES id at parse", async () => {
        mockEnv({
            BIT2ME_API_KEY: "test-key",
            BIT2ME_API_SECRET: "test-secret",
            BIT2ME_ENABLED_CATEGORIES: "trading",
        });
        const { getConfig } = await import("../src/config.js");
        expect(() => getConfig()).toThrow(/Unknown category "trading"/);
    });
});
