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
