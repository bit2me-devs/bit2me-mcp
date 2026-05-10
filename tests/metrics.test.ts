/**
 * Prometheus metrics surface tests.
 *
 * Verifies that the resilience-pattern series introduced by F7 are
 * emitted in valid Prometheus exposition format and that the recording
 * helpers feed the corresponding counters/gauges.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { metricsCollector } from "../src/utils/metrics.js";
import { resetGroupCircuitBreakers, getGroupCircuitBreaker, apiCircuitBreaker } from "../src/utils/circuit-breaker.js";
import { cache, CacheCategory } from "../src/utils/cache.js";

describe("metrics — resilience patterns", () => {
    beforeEach(() => {
        metricsCollector.reset();
        resetGroupCircuitBreakers();
        apiCircuitBreaker.reset();
        cache.clear();
    });

    it("records and exposes circuit_failures_total per group", () => {
        metricsCollector.recordCircuitFailure("loan");
        metricsCollector.recordCircuitFailure("loan");
        metricsCollector.recordCircuitFailure("trading");

        const text = metricsCollector.toPrometheus();
        expect(text).toContain('bit2me_circuit_failures_total{group="loan"} 2');
        expect(text).toContain('bit2me_circuit_failures_total{group="trading"} 1');
    });

    it("records and exposes retries_total by reason", () => {
        metricsCollector.recordRetry("rate_limit");
        metricsCollector.recordRetry("server_error");
        metricsCollector.recordRetry("server_error");

        const text = metricsCollector.toPrometheus();
        expect(text).toContain('bit2me_retries_total{reason="rate_limit"} 1');
        expect(text).toContain('bit2me_retries_total{reason="server_error"} 2');
    });

    it("records and exposes cache hits and misses per category", () => {
        // Drive through the public cache API so the recording is
        // exercised end-to-end (including the LRU bookkeeping).
        const k = "metrics-test-key";
        expect(cache.get(k)).toBeNull(); // miss
        cache.set(k, "value", CacheCategory.STATIC, 60);
        expect(cache.get(k)).toBe("value"); // hit

        const text = metricsCollector.toPrometheus();
        expect(text).toContain("bit2me_cache_misses_total{");
        expect(text).toContain('bit2me_cache_hits_total{category="static"} 1');
    });

    it("emits a circuit_state gauge for every active group", () => {
        // Force at least one breaker into the half_open state path so
        // the gauge value is non-zero.
        const loan = getGroupCircuitBreaker("loan");
        for (let i = 0; i < 5; i += 1) loan.recordFailure();
        const text = metricsCollector.toPrometheus();
        expect(text).toMatch(/bit2me_circuit_state\{group="loan"\}\s+\d/);
        expect(text).toContain('bit2me_circuit_state{group="global"}');
    });

    it("emits group bulkhead inflight + queued series", () => {
        const text = metricsCollector.toPrometheus();
        expect(text).toContain("bit2me_inflight{");
        expect(text).toContain("bit2me_bulkhead_queued{");
        expect(text).toContain("bit2me_inflight_tenant_total");
    });
});
