import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePaginationLimit, validateISO8601, validatePair, validateAmount } from "../src/utils/format.js";
import { ValidationError } from "../src/utils/errors.js";
import { bit2meRequest } from "../src/services/bit2me.js";
import axios from "axios";

// Mock config
vi.mock("../src/config.js", () => {
    const mockConfig = {
        BIT2ME_API_KEY: "test-api-key",
        BIT2ME_API_SECRET: "test-api-secret",
        REQUEST_TIMEOUT: 30000,
        LOG_LEVEL: "info",
        MAX_RETRIES: 3,
        RETRY_BASE_DELAY: 1000,
        INCLUDE_RAW_RESPONSE: false,
        GATEWAY_URL: "https://gateway.bit2me.com",
    };
    return {
        config: new Proxy(
            {},
            {
                get: (_target: unknown, prop: string) => mockConfig[prop as keyof typeof mockConfig],
            }
        ),
        BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
        getGatewayUrl: () => "https://gateway.bit2me.com",
        getConfig: () => mockConfig,
    };
});

// Mock axios
vi.mock("axios");

describe("Edge Cases", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("Pagination Validation", () => {
        it("should accept valid limits", () => {
            expect(validatePaginationLimit(10)).toBe(10);
            expect(validatePaginationLimit(100)).toBe(100);
        });

        it("should throw error for limit > max", () => {
            expect(() => validatePaginationLimit(101, 100)).toThrow(ValidationError);
        });

        it("should throw error for limit < 1", () => {
            expect(() => validatePaginationLimit(0)).toThrow(ValidationError);
            expect(() => validatePaginationLimit(-5)).toThrow(ValidationError);
        });

        it("should use default limit if undefined", () => {
            expect(validatePaginationLimit(undefined)).toBe(10);
        });
    });

    describe("Date Format Validation", () => {
        it("should accept valid ISO 8601 dates", () => {
            expect(() => validateISO8601("2023-01-01T12:00:00Z")).not.toThrow();
            expect(() => validateISO8601("2023-01-01T12:00:00.000Z")).not.toThrow();
        });

        it("should throw for invalid date formats", () => {
            expect(() => validateISO8601("2023-01-01")).toThrow(ValidationError);
            expect(() => validateISO8601("01/01/2023")).toThrow(ValidationError);
            expect(() => validateISO8601("invalid")).toThrow(ValidationError);
        });
    });

    describe("Pair Format Validation", () => {
        it("should accept valid pairs", () => {
            expect(() => validatePair("BTC-USD")).not.toThrow();
            expect(() => validatePair("ETH-EUR")).not.toThrow();
        });

        it("should accept pairs that need normalization", () => {
            expect(() => validatePair("btc-usd")).not.toThrow(); // normalizePair handles case
        });

        it("should throw for invalid pair formats", () => {
            expect(() => validatePair("BTCUSD")).toThrow(ValidationError);
            // BTC/EUR and BTC_EUR are now normalized to BTC-USD, so they should NOT throw
            expect(() => validatePair("BTC/EUR")).not.toThrow();
            expect(() => validatePair("BTC_EUR")).not.toThrow();
        });
    });

    describe("Amount Validation", () => {
        it("should accept valid amounts string", () => {
            expect(() => validateAmount("10.5")).not.toThrow();
            expect(() => validateAmount("0.00000001")).not.toThrow();
        });

        it("should accept valid amounts number", () => {
            expect(() => validateAmount(100)).not.toThrow();
        });

        it("should throw for invalid amounts", () => {
            expect(() => validateAmount("-5")).toThrow(ValidationError);
            expect(() => validateAmount("abc")).toThrow(ValidationError);
            expect(() => validateAmount("")).toThrow(ValidationError);
        });
    });

    describe("API Error Handling", () => {
        it("should handle empty response body gracefully", async () => {
            vi.mocked(axios).mockResolvedValueOnce({
                status: 200,
                data: null,
            });

            const result = await bit2meRequest("GET", "/test");
            expect(result).toBeNull();
        });

        it("should propagate API errors correctly", async () => {
            const apiError = {
                response: {
                    status: 400,
                    data: { message: "Invalid parameter" },
                },
            };
            vi.mocked(axios).mockRejectedValueOnce(apiError);

            await expect(bit2meRequest("GET", "/test")).rejects.toThrow("Invalid parameter");
        });
    });
});
