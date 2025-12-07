import { describe, it, expect } from "vitest";
import { generateSignature } from "../src/services/bit2me.js";
import crypto from "crypto";

describe("Security - HMAC Signatures", () => {
    it("should generate a valid signature according to Bit2Me specification", () => {
        // Known test data
        const nonce = 1234567890;
        const endpoint = "/v1/wallet/pocket";
        const secret = "test_secret_key_for_testing";

        // Execute
        const signature = generateSignature(nonce, endpoint, undefined, secret);

        // Manual verification of expected hash
        const message = `${nonce}:${endpoint}`;
        const hash = crypto.createHash("sha256").update(message).digest("binary");
        const expectedSignature = crypto.createHmac("sha512", secret).update(hash, "binary").digest("base64");

        expect(signature).toBe(expectedSignature);
    });

    it("should generate a valid signature with body for POST requests", () => {
        const nonce = 1234567890;
        const endpoint = "/v1/trading/order";
        const body = { pair: "BTC-EUR", amount: "0.1", type: "BUY" };
        const secret = "test_secret_key_for_testing";

        // Execute
        const signature = generateSignature(nonce, endpoint, body, secret);

        // Manual verification
        const bodyString = JSON.stringify(body);
        const message = `${nonce}:${endpoint}:${bodyString}`;
        const hash = crypto.createHash("sha256").update(message).digest("binary");
        const expectedSignature = crypto.createHmac("sha512", secret).update(hash, "binary").digest("base64");

        expect(signature).toBe(expectedSignature);
    });

    it("should handle pre-stringified body correctly", () => {
        const nonce = 1234567890;
        const endpoint = "/v1/trading/order";
        const bodyString = '{"pair":"BTC-EUR","amount":"0.1","type":"BUY"}';
        const secret = "test_secret_key_for_testing";

        // Execute with pre-stringified body
        const signature = generateSignature(nonce, endpoint, bodyString, secret);

        // Manual verification
        const message = `${nonce}:${endpoint}:${bodyString}`;
        const hash = crypto.createHash("sha256").update(message).digest("binary");
        const expectedSignature = crypto.createHmac("sha512", secret).update(hash, "binary").digest("base64");

        expect(signature).toBe(expectedSignature);
    });

    it("should produce different signatures for different nonces", () => {
        const endpoint = "/v1/wallet/pocket";
        const secret = "test_secret_key_for_testing";

        const signature1 = generateSignature(1000, endpoint, undefined, secret);
        const signature2 = generateSignature(2000, endpoint, undefined, secret);

        expect(signature1).not.toBe(signature2);
    });

    it("should produce different signatures for different endpoints", () => {
        const nonce = 1234567890;
        const secret = "test_secret_key_for_testing";

        const signature1 = generateSignature(nonce, "/v1/wallet/pocket", undefined, secret);
        const signature2 = generateSignature(nonce, "/v1/trading/wallet", undefined, secret);

        expect(signature1).not.toBe(signature2);
    });
});

describe("Session Authentication - JWT Parameter", () => {
    it("should inject 'jwt' parameter into all tools", async () => {
        const { getCategoryTools } = await import("../src/utils/tool-metadata.js");

        // Test all categories
        const categories = ["general", "broker", "wallet", "earn", "loan", "pro"];

        for (const category of categories) {
            const tools = getCategoryTools(category);
            for (const tool of tools) {
                expect(tool.inputSchema?.properties).toBeDefined();
                expect(tool.inputSchema?.properties?.jwt).toBeDefined();
                expect(tool.inputSchema?.properties?.jwt?.type).toBe("string");
            }
        }
    });

    it("should set session token in context when 'jwt' is provided", async () => {
        const { setSessionToken, getSessionToken, clearSessionToken } = await import("../src/utils/context.js");

        // Initially no session
        clearSessionToken();
        expect(getSessionToken()).toBeUndefined();

        // Set session
        setSessionToken("test-jwt-token");
        expect(getSessionToken()).toBe("test-jwt-token");

        // Clear session
        clearSessionToken();
        expect(getSessionToken()).toBeUndefined();
    });

    it("should redact jwt parameter in logs", async () => {
        const { logger } = await import("../src/utils/logger.js");

        // Create a mock to capture log output
        const logOutput: string[] = [];
        const originalError = console.error;
        console.error = (msg: string) => logOutput.push(msg);

        // Log with sensitive 'jwt' parameter
        logger.setLevel("debug");
        logger.debug("Test message", { jwt: "secret-jwt-token", other: "visible" });

        console.error = originalError;

        // Verify 'jwt' is redacted
        const lastLog = logOutput[logOutput.length - 1];
        expect(lastLog).toContain("***REDACTED***");
        expect(lastLog).not.toContain("secret-jwt-token");
        expect(lastLog).toContain("visible");
    });

    it("should provide specific error message for JWT authentication failure", async () => {
        const { AuthenticationError } = await import("../src/utils/errors.js");

        const jwtError = new AuthenticationError("/test", "jwt");
        expect(jwtError.message).toContain("JWT session authentication failed");
        expect(jwtError.message).toContain("invalid, expired, or revoked");
        expect(jwtError.authMethod).toBe("jwt");

        const apiKeyError = new AuthenticationError("/test", "api_key");
        expect(apiKeyError.message).toContain("API Key authentication failed");
        expect(apiKeyError.message).toContain("BIT2ME_API_KEY");
        expect(apiKeyError.authMethod).toBe("api_key");
    });
});
