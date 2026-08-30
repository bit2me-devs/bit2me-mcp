/**
 * Per-group resilience isolation.
 *
 * A failure in one endpoint group must not open the breaker for another
 * group. Rate-limit buckets are per endpoint pattern in this process
 * (one operator, ADR 0003).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    apiCircuitBreaker,
    getGroupCircuitBreaker,
    getGroupCircuitBreakerStats,
    resetGroupCircuitBreakers,
    CircuitState,
} from "../src/utils/circuit-breaker.js";
import { EndpointRateLimiterManager } from "../src/utils/rate-limiter-config.js";

describe("Per-group circuit breaker isolation", () => {
    beforeEach(() => {
        apiCircuitBreaker.reset();
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

    it("reuses the same breaker instance for a group", () => {
        expect(getGroupCircuitBreaker("wallet")).toBe(getGroupCircuitBreaker("wallet"));
    });

    it("getGroupCircuitBreakerStats exposes one entry per declared group plus global", () => {
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

describe("Endpoint rate limiter", () => {
    it("reuses the same bucket for the same endpoint pattern", () => {
        const mgr = new EndpointRateLimiterManager();
        const first = mgr.getLimiter("/v1/wallet/pocket");
        const again = mgr.getLimiter("/v1/wallet/pocket");
        expect(first).toBe(again);
    });
});
