import { beforeAll, describe } from "vitest";

/**
 * E2E Test Environment Setup
 *
 * These tests run against the REAL Bit2Me API.
 * They require valid API credentials to be set in environment variables.
 */

export const isE2E = process.env.RUN_E2E === "true";

beforeAll(() => {
    if (isE2E) {
        if (!process.env.BIT2ME_API_KEY || !process.env.BIT2ME_API_SECRET) {
            throw new Error(
                "E2E tests require BIT2ME_API_KEY and BIT2ME_API_SECRET environment variables.\n" +
                    "Set them in your .env file or pass them when running tests:\n" +
                    "RUN_E2E=true BIT2ME_API_KEY=xxx BIT2ME_API_SECRET=yyy npm run test:e2e"
            );
        }
        console.log("✓ E2E tests enabled - using real Bit2Me API");
    }
});

/**
 * Helper to skip tests when E2E is not enabled
 */
export const describeE2E = isE2E ? describe : describe.skip;

/**
 * Extended timeout for E2E tests (API calls can be slow)
 */
export const E2E_TIMEOUT = 10000; // 10 seconds
