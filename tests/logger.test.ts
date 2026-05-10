import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, initLogger } from "../src/utils/logger.js";

describe("Logger - Structured Logging", () => {
    let stderrSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    });

    afterEach(() => {
        stderrSpy.mockRestore();
    });

    function getCall(index: number): string {
        const call = stderrSpy.mock.calls[index]?.[0];
        return typeof call === "string" ? call : String(call);
    }

    it("should log messages at info level by default", () => {
        initLogger("info");
        logger.info("Test message");

        expect(stderrSpy).toHaveBeenCalledTimes(2); // initLogger + info message
        const lastCall = getCall(1);
        expect(lastCall).toContain("INFO");
        expect(lastCall).toContain("Test message");
    });

    it("should filter out debug messages when level is info", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.debug("Debug message");
        logger.info("Info message");

        expect(stderrSpy).toHaveBeenCalledTimes(1);
        expect(getCall(0)).toContain("INFO");
        expect(getCall(0)).toContain("Info message");
    });

    it("should show debug messages when level is debug", () => {
        initLogger("debug");
        stderrSpy.mockClear();

        logger.debug("Debug message");
        logger.info("Info message");

        expect(stderrSpy).toHaveBeenCalledTimes(2);
        expect(getCall(0)).toContain("DEBUG");
        expect(getCall(1)).toContain("INFO");
    });

    it("should sanitize sensitive data in context objects", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.info("API Request", {
            headers: {
                "x-api-key": "secret-key-123",
                "api-signature": "secret-signature",
                "content-type": "application/json",
            },
        });

        expect(stderrSpy).toHaveBeenCalled();
        const logOutput = getCall(0);

        // Sensitive data should be redacted
        expect(logOutput).toContain("***REDACTED***");
        expect(logOutput).not.toContain("secret-key-123");
        expect(logOutput).not.toContain("secret-signature");

        // Non-sensitive data should remain
        expect(logOutput).toContain("application/json");
    });

    it("should sanitize nested objects", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.error("Error details", {
            response: {
                headers: {
                    Authorization: "Bearer token123",
                },
                data: {
                    message: "Error occurred",
                },
            },
        });

        const logOutput = getCall(0);

        expect(logOutput).toContain("***REDACTED***");
        expect(logOutput).not.toContain("token123");
        expect(logOutput).toContain("Error occurred");
    });

    it("should include timestamps in log entries", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.info("Test message");

        const logOutput = getCall(0);

        // Should contain ISO timestamp format
        expect(logOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it("should handle all log levels correctly", () => {
        initLogger("debug");
        stderrSpy.mockClear();

        logger.debug("Debug message");
        logger.info("Info message");
        logger.warn("Warning message");
        logger.error("Error message");

        expect(stderrSpy).toHaveBeenCalledTimes(4);
        expect(getCall(0)).toContain("DEBUG");
        expect(getCall(1)).toContain("INFO");
        expect(getCall(2)).toContain("WARN");
        expect(getCall(3)).toContain("ERROR");
    });

    it("should default to info level on invalid level", () => {
        initLogger("invalid-level");
        stderrSpy.mockClear();

        logger.debug("Debug message");
        logger.info("Info message");

        // Debug should be filtered, info should pass
        expect(stderrSpy).toHaveBeenCalledTimes(1);
        expect(getCall(0)).toContain("INFO");
    });

    it("should redact x-bit2me-api-key and x-bit2me-api-secret headers (ADR 0001)", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.info("Incoming request", {
            headers: {
                "x-bit2me-api-key": "pub-12345",
                "x-bit2me-api-secret": "priv-abcdef-ghijkl",
                "content-type": "application/json",
            },
        });

        const logOutput = getCall(0);

        expect(logOutput).toContain("***REDACTED***");
        expect(logOutput).not.toContain("pub-12345");
        expect(logOutput).not.toContain("priv-abcdef-ghijkl");
        expect(logOutput).toContain("application/json");
    });

    it("should redact dashed api-key / api-secret variants", () => {
        initLogger("info");
        stderrSpy.mockClear();

        logger.info("Outbound call", {
            headers: {
                "api-key": "kkk",
                "api-secret": "sss",
            },
        });

        const logOutput = getCall(0);

        expect(logOutput).toContain("***REDACTED***");
        expect(logOutput).not.toContain('"kkk"');
        expect(logOutput).not.toContain('"sss"');
    });
});
