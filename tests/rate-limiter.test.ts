/**
 * Live-stats contract for the token-bucket rate limiter.
 *
 * Pins the new `RateLimiter.stats()` and
 * `EndpointRateLimiterManager.getStats()` outputs so dashboards and
 * `/health` consumers can rely on a stable schema.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setLevel: vi.fn(),
        addSensitiveKey: vi.fn(),
    },
    initLogger: vi.fn(),
}));

import { RateLimiter } from "../src/utils/rate-limiter.js";
import { EndpointRateLimiterManager } from "../src/utils/rate-limiter-config.js";

describe("RateLimiter.stats()", () => {
    it("reports capacity, tokensAvailable, rps and intervalMs", () => {
        const limiter = new RateLimiter(5, 1000);
        const s = limiter.stats();
        expect(s.capacity).toBe(5);
        expect(s.tokensAvailable).toBeLessThanOrEqual(5);
        expect(s.tokensAvailable).toBeGreaterThanOrEqual(4); // freshly constructed
        expect(s.rps).toBeCloseTo(5, 5);
        expect(s.intervalMs).toBe(1000);
    });

    it("decreases tokensAvailable as tokens are consumed", async () => {
        const limiter = new RateLimiter(3, 1000);
        await limiter.waitForToken();
        await limiter.waitForToken();
        const s = limiter.stats();
        expect(s.tokensAvailable).toBeLessThan(3);
    });
});

describe("EndpointRateLimiterManager.getStats()", () => {
    it("returns a record keyed by pattern with live limiter stats", async () => {
        const mgr = new EndpointRateLimiterManager();
        await mgr.waitForToken("/v3/currency/ticker/BTC");
        await mgr.waitForToken("/v1/wallet/pocket");
        const stats = mgr.getStats();
        const keys = Object.keys(stats);
        expect(keys.length).toBeGreaterThanOrEqual(2);
        for (const k of keys) {
            const entry = stats[k];
            expect(entry).toHaveProperty("capacity");
            expect(entry).toHaveProperty("tokensAvailable");
            expect(entry).toHaveProperty("rps");
            expect(entry).toHaveProperty("intervalMs");
        }
    });

    it("partitions tenant entries with the `tenantId:pattern` key format", async () => {
        const mgr = new EndpointRateLimiterManager();
        await mgr.waitForToken("/v3/currency/ticker/BTC", "tenant-A");
        await mgr.waitForToken("/v3/currency/ticker/BTC", "tenant-B");
        const stats = mgr.getStats();
        const keys = Object.keys(stats);
        expect(keys.some((k) => k.startsWith("tenant-A:"))).toBe(true);
        expect(keys.some((k) => k.startsWith("tenant-B:"))).toBe(true);
    });
});
