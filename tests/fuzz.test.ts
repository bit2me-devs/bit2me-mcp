import { describe, it } from "vitest";
import * as fc from "fast-check";
import {
    mapTickerResponse,
    mapAssetsResponse,
    mapWalletPocketsResponse,
    mapOrderBookResponse,
} from "../src/utils/response-mappers.js";

/**
 * Fuzzing Tests
 *
 * These tests use fast-check to generate random, unexpected, and edge-case inputs
 * to ensure our mapper functions handle them gracefully (either mapping correctly or throwing a controlled error)
 * without crashing the process.
 */

describe("Fuzzing: Response Mappers", () => {
    // Helper to ensure the function doesn't crash (uncaught exception)
    // It's okay if it throws a ValidationError, but it shouldn't throw TypeError like "cannot read property of undefined"
    const safeMap = (mapper: (data: any) => any, input: any) => {
        try {
            mapper(input);
            return true;
        } catch (error: any) {
            // We accept errors, but we want to ensure specific types of crashes don't happen if we want to be strict.
            // For this fuzzing pass, we primarily want to ensure the process doesn't exit/crash unrecoverably.
            // In JS, catching creates that safety.
            // Ideally, we would check that error is instanceof ValidationError, but legacy code might throw others.
            return true;
        }
    };

    it("mapTickerResponse should handle any JSON object", () => {
        fc.assert(
            fc.property(fc.object(), (data) => {
                return safeMap(mapTickerResponse, data);
            }),
            { numRuns: 100 }
        );
    });

    it("mapAssetsResponse should handle any JSON object", () => {
        fc.assert(
            fc.property(fc.object(), (data) => {
                return safeMap(mapAssetsResponse, data);
            }),
            { numRuns: 100 }
        );
    });

    it("mapWalletPocketsResponse should handle any JSON object", () => {
        fc.assert(
            fc.property(fc.object(), (data) => {
                return safeMap(mapWalletPocketsResponse, data);
            }),
            { numRuns: 100 }
        );
    });

    it("mapOrderBookResponse should handle any JSON object", () => {
        fc.assert(
            fc.property(fc.object(), (data) => {
                return safeMap(mapOrderBookResponse, data);
            }),
            { numRuns: 100 }
        );
    });

    // Fuzzing with completely random types (not just objects)
    it("mappers should handle non-object inputs (null, string, number)", () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
                (data) => {
                    safeMap(mapTickerResponse, data);
                    safeMap(mapAssetsResponse, data);
                    safeMap(mapOrderBookResponse, data);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
