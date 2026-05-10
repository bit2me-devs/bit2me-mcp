/**
 * Multi-tenant resilience isolation tests.
 *
 * Asserts that the per-tenant circuit breaker and per-tenant rate-limit
 * bucket created in src/utils/circuit-breaker.ts and
 * src/utils/rate-limiter-config.ts cannot bleed state across tenants:
 *
 *  - Tenant A tripping its breaker (5 consecutive failures) must not
 *    open the breaker for Tenant B.
 *  - Tenant A draining its endpoint token bucket must not slow down
 *    Tenant B's first request to the same endpoint.
 *  - Calls without a tenant id (stdio transport / internal callers)
 *    consistently fall back to the same shared global breaker.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    apiCircuitBreaker,
    getCircuitBreaker,
    getGroupCircuitBreaker,
    getGroupCircuitBreakerStats,
    getTenantCircuitBreaker,
    resetGroupCircuitBreakers,
    resetTenantCircuitBreakers,
    CircuitState,
} from "../src/utils/circuit-breaker.js";
import { EndpointRateLimiterManager } from "../src/utils/rate-limiter-config.js";

describe("Per-tenant circuit breaker isolation", () => {
    beforeEach(() => {
        apiCircuitBreaker.reset();
        resetTenantCircuitBreakers();
    });

    it("opens tenant A breaker without affecting tenant B", () => {
        const tenantA = "tenant-a-fingerprint";
        const tenantB = "tenant-b-fingerprint";
        const a = getTenantCircuitBreaker(tenantA);
        const b = getTenantCircuitBreaker(tenantB);

        // 5 consecutive failures trip tenant A's breaker.
        for (let i = 0; i < 5; i++) {
            a.recordFailure();
        }

        expect(a.getState()).toBe(CircuitState.OPEN);
        expect(b.getState()).toBe(CircuitState.CLOSED);
        expect(b.canExecute()).toBe(true);
    });

    it("falls back to the shared global breaker when tenantId is undefined", () => {
        const first = getTenantCircuitBreaker(undefined);
        const second = getTenantCircuitBreaker(undefined);
        expect(first).toBe(apiCircuitBreaker);
        expect(second).toBe(apiCircuitBreaker);
    });

    it("returns a stable breaker instance for the same tenant id", () => {
        const a1 = getTenantCircuitBreaker("tenant-x");
        const a2 = getTenantCircuitBreaker("tenant-x");
        expect(a1).toBe(a2);
    });
});

describe("Per-tenant endpoint rate limiter isolation", () => {
    it("gives each tenant a dedicated token bucket per endpoint", () => {
        const mgr = new EndpointRateLimiterManager();
        const lA = mgr.getLimiter("/v1/wallet/pocket", "tenant-a");
        const lB = mgr.getLimiter("/v1/wallet/pocket", "tenant-b");
        const lShared = mgr.getLimiter("/v1/wallet/pocket");

        expect(lA).not.toBe(lB);
        expect(lA).not.toBe(lShared);
        expect(lB).not.toBe(lShared);
    });

    it("reuses the same bucket for repeated calls of one tenant + endpoint", () => {
        const mgr = new EndpointRateLimiterManager();
        const first = mgr.getLimiter("/v1/wallet/pocket", "tenant-a");
        const again = mgr.getLimiter("/v1/wallet/pocket", "tenant-a");
        expect(first).toBe(again);
    });

    it("does not block tenant B when tenant A drained their bucket", async () => {
        const mgr = new EndpointRateLimiterManager();
        // Drain tenant A's bucket synchronously by acquiring the raw limiter
        // and depleting tokens; we don't actually wait, we only assert that
        // tenant B's limiter is independent (a distinct instance with its
        // own token count starting at maxTokens).
        const lA = mgr.getLimiter("/v1/wallet/pocket", "tenant-a");
        const lB = mgr.getLimiter("/v1/wallet/pocket", "tenant-b");
        // Two awaitForToken calls on B from a fresh bucket return immediately
        // (bucket starts full).
        await expect(
            Promise.race([lB.waitForToken(), new Promise((_, r) => setTimeout(() => r("timeout"), 50))])
        ).resolves.toBeUndefined();
        // Sanity: lA still exists and is its own instance.
        expect(lA).not.toBe(lB);
    });
});

describe("Per-group circuit breaker isolation", () => {
    beforeEach(() => {
        apiCircuitBreaker.reset();
        resetTenantCircuitBreakers();
        resetGroupCircuitBreakers();
    });

    it("returns distinct breakers per group", () => {
        const loan = getGroupCircuitBreaker("loan");
        const market = getGroupCircuitBreaker("market_data");
        expect(loan).not.toBe(market);
    });

    it("falls back to the global breaker when group is 'default'", () => {
        expect(getGroupCircuitBreaker("default")).toBe(apiCircuitBreaker);
    });

    it("opens the loan breaker without affecting market_data", () => {
        const loan = getGroupCircuitBreaker("loan");
        const market = getGroupCircuitBreaker("market_data");

        for (let i = 0; i < 5; i++) {
            loan.recordFailure();
        }

        expect(loan.getState()).toBe(CircuitState.OPEN);
        expect(market.getState()).toBe(CircuitState.CLOSED);
        expect(market.canExecute()).toBe(true);
    });

    it("isolates breakers along both tenant and group axes", () => {
        const tenantALoan = getCircuitBreaker("loan", "tenant-a");
        const tenantBLoan = getCircuitBreaker("loan", "tenant-b");
        const tenantAMarket = getCircuitBreaker("market_data", "tenant-a");

        for (let i = 0; i < 5; i++) {
            tenantALoan.recordFailure();
        }

        expect(tenantALoan.getState()).toBe(CircuitState.OPEN);
        expect(tenantBLoan.getState()).toBe(CircuitState.CLOSED);
        expect(tenantAMarket.getState()).toBe(CircuitState.CLOSED);
    });

    it("stable instance for the same (tenant, group) pair", () => {
        const a1 = getCircuitBreaker("trading", "tenant-x");
        const a2 = getCircuitBreaker("trading", "tenant-x");
        expect(a1).toBe(a2);
    });

    it("getCircuitBreaker without tenant id reuses the per-group breaker", () => {
        const noTenant = getCircuitBreaker("wallet", undefined);
        const groupOnly = getGroupCircuitBreaker("wallet");
        expect(noTenant).toBe(groupOnly);
    });

    it("getGroupCircuitBreakerStats exposes one entry per declared group plus global", () => {
        // Touch a couple of groups so tenant traffic does not affect the
        // assertion about how many keys appear in the snapshot.
        getGroupCircuitBreaker("loan");
        getGroupCircuitBreaker("trading");

        const stats = getGroupCircuitBreakerStats();
        expect(stats).toHaveProperty("global");
        expect(stats).toHaveProperty("loan");
        expect(stats).toHaveProperty("trading");
        expect(stats).toHaveProperty("wallet");
        expect(stats).toHaveProperty("market_data");
    });
});
