/**
 * Metrics collection for observability
 * Tracks performance, errors, and usage statistics
 */

import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";
import { CircuitState, getGroupCircuitBreakerStats } from "./circuit-breaker.js";
import { groupBulkhead, tenantBulkhead } from "./bulkhead.js";
import type { EndpointGroup } from "./endpoint-groups.js";

/**
 * Bounded counter table for resilience metrics.
 *
 * Keys are static (group names, retry reasons, cache categories), so
 * cardinality is small and the map never grows beyond a few dozen
 * entries. We use a `Map` instead of an object literal for O(1)
 * insertion ordering on `Object.keys`-style enumerations.
 */
class CounterMap {
    private values = new Map<string, number>();
    inc(label: string, by = 1): void {
        this.values.set(label, (this.values.get(label) ?? 0) + by);
    }
    snapshot(): Record<string, number> {
        const out: Record<string, number> = {};
        for (const [k, v] of this.values) out[k] = v;
        return out;
    }
    reset(): void {
        this.values.clear();
    }
}

/**
 * Encode a circuit state as a numeric value suitable for a Prometheus
 * gauge. Closed=0, half-open=1, open=2.
 */
function circuitStateToGauge(state: CircuitState): number {
    if (state === CircuitState.CLOSED) return 0;
    if (state === CircuitState.HALF_OPEN) return 1;
    return 2;
}

export interface MetricData {
    name: string;
    value: number;
    tags?: Record<string, string>;
    timestamp: number;
}

export interface ToolMetrics {
    name: string;
    callCount: number;
    successCount: number;
    errorCount: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    lastCallTime?: number;
}

/**
 * Maximum number of recent durations kept per tool for percentile
 * computations. Older samples are evicted in FIFO order so the collector's
 * memory footprint stays bounded even on long-running multi-tenant
 * deployments. With 48 tools this caps `requestDurations` at ~96 KB.
 */
const MAX_DURATION_SAMPLES_PER_TOOL = 500;

class MetricsCollector {
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private requestDurations: Map<string, number[]> = new Map();

    // Resilience-pattern counters. Cardinality is bounded by the static
    // group/category enums so unbounded label growth is impossible.
    private circuitFailures = new CounterMap();
    private retries = new CounterMap();
    private cacheHits = new CounterMap();
    private cacheMisses = new CounterMap();

    /**
     * Record a tool execution
     */
    recordToolExecution(toolName: string, duration: number, success: boolean): void {
        const correlationId = getCorrelationId() || "unknown";

        // Initialize metrics if not exists
        if (!this.toolMetrics.has(toolName)) {
            this.toolMetrics.set(toolName, {
                name: toolName,
                callCount: 0,
                successCount: 0,
                errorCount: 0,
                totalDuration: 0,
                averageDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
            });
        }

        const metrics = this.toolMetrics.get(toolName)!;
        metrics.callCount++;
        metrics.totalDuration += duration;
        metrics.lastCallTime = Date.now();

        if (success) {
            metrics.successCount++;
        } else {
            metrics.errorCount++;
        }

        // Update min/max
        if (duration < metrics.minDuration) {
            metrics.minDuration = duration;
        }
        if (duration > metrics.maxDuration) {
            metrics.maxDuration = duration;
        }

        // Calculate average
        metrics.averageDuration = metrics.totalDuration / metrics.callCount;

        // Store duration for percentile calculations using a bounded
        // FIFO ring so the collector can run for weeks without growing
        // unboundedly. We trade exactness for memory safety: percentiles
        // are computed over the most recent MAX_DURATION_SAMPLES_PER_TOOL
        // calls, which is plenty for p50/p95/p99 monitoring.
        if (!this.requestDurations.has(toolName)) {
            this.requestDurations.set(toolName, []);
        }
        const buffer = this.requestDurations.get(toolName)!;
        buffer.push(duration);
        if (buffer.length > MAX_DURATION_SAMPLES_PER_TOOL) {
            buffer.splice(0, buffer.length - MAX_DURATION_SAMPLES_PER_TOOL);
        }

        // Log metric at debug level
        logger.debug("Tool metric recorded", {
            correlationId,
            toolName,
            duration,
            success,
            totalCalls: metrics.callCount,
            successRate: (metrics.successCount / metrics.callCount) * 100,
        });
    }

    /**
     * Get metrics for a specific tool
     */
    getToolMetrics(toolName: string): ToolMetrics | undefined {
        return this.toolMetrics.get(toolName);
    }

    /**
     * Get all tool metrics
     */
    getAllMetrics(): ToolMetrics[] {
        return Array.from(this.toolMetrics.values());
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        const allMetrics = this.getAllMetrics();
        const totalCalls = allMetrics.reduce((sum, m) => sum + m.callCount, 0);
        const totalSuccesses = allMetrics.reduce((sum, m) => sum + m.successCount, 0);
        const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);
        const avgDuration = allMetrics.reduce((sum, m) => sum + m.averageDuration, 0) / (allMetrics.length || 1);

        return {
            totalTools: allMetrics.length,
            totalCalls,
            totalSuccesses,
            totalErrors,
            successRate: totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 0,
            averageDuration: avgDuration,
            tools: allMetrics,
        };
    }

    /**
     * Reset all metrics (useful for testing)
     */
    reset(): void {
        this.toolMetrics.clear();
        this.requestDurations.clear();
        this.circuitFailures.reset();
        this.retries.reset();
        this.cacheHits.reset();
        this.cacheMisses.reset();
    }

    /**
     * Record a failure observed by the per-group circuit breaker.
     * `group` is the {@link EndpointGroup} the failed call belonged to.
     */
    recordCircuitFailure(group: EndpointGroup): void {
        this.circuitFailures.inc(group);
    }

    /**
     * Record an outbound retry. `reason` is one of the discrete causes
     * the retry loop in `bit2meRequest` may use.
     */
    recordRetry(reason: "rate_limit" | "server_error" | "network"): void {
        this.retries.inc(reason);
    }

    /** Record a Cache-Aside hit/miss for the given category. */
    recordCacheHit(category: string): void {
        this.cacheHits.inc(category);
    }
    recordCacheMiss(category: string): void {
        this.cacheMisses.inc(category);
    }

    /**
     * Render the in-memory metrics in Prometheus text exposition format.
     *
     * The output is intentionally minimal — three counters and a gauge
     * per tool — but it's enough to plug straight into a Prometheus
     * scrape endpoint or a Datadog / Grafana Agent collector.
     */
    toPrometheus(): string {
        const lines: string[] = [];
        lines.push("# HELP bit2me_mcp_tool_calls_total Total number of tool invocations");
        lines.push("# TYPE bit2me_mcp_tool_calls_total counter");
        for (const m of this.getAllMetrics()) {
            const labels = `tool="${m.name}"`;
            lines.push(`bit2me_mcp_tool_calls_total{${labels}} ${m.callCount}`);
        }
        lines.push("# HELP bit2me_mcp_tool_errors_total Total number of failed tool invocations");
        lines.push("# TYPE bit2me_mcp_tool_errors_total counter");
        for (const m of this.getAllMetrics()) {
            const labels = `tool="${m.name}"`;
            lines.push(`bit2me_mcp_tool_errors_total{${labels}} ${m.errorCount}`);
        }
        lines.push("# HELP bit2me_mcp_tool_duration_avg_ms Rolling average duration in milliseconds");
        lines.push("# TYPE bit2me_mcp_tool_duration_avg_ms gauge");
        for (const m of this.getAllMetrics()) {
            const labels = `tool="${m.name}"`;
            lines.push(`bit2me_mcp_tool_duration_avg_ms{${labels}} ${m.averageDuration.toFixed(2)}`);
        }

        // ── Resilience-pattern series. The dependency direction is
        // metrics → circuit-breaker / bulkhead, never the reverse, so
        // these imports do not create a cycle.
        lines.push(
            "# HELP bit2me_circuit_state Current state of the per-group circuit breaker (0=closed,1=half_open,2=open)"
        );
        lines.push("# TYPE bit2me_circuit_state gauge");
        const cbStats = getGroupCircuitBreakerStats();
        for (const [group, snap] of Object.entries(cbStats)) {
            lines.push(`bit2me_circuit_state{group="${group}"} ${circuitStateToGauge(snap.state)}`);
        }

        lines.push("# HELP bit2me_circuit_failures_total Failures recorded by per-group circuit breakers");
        lines.push("# TYPE bit2me_circuit_failures_total counter");
        for (const [group, count] of Object.entries(this.circuitFailures.snapshot())) {
            lines.push(`bit2me_circuit_failures_total{group="${group}"} ${count}`);
        }

        lines.push("# HELP bit2me_retries_total Outbound retries by reason");
        lines.push("# TYPE bit2me_retries_total counter");
        for (const [reason, count] of Object.entries(this.retries.snapshot())) {
            lines.push(`bit2me_retries_total{reason="${reason}"} ${count}`);
        }

        lines.push("# HELP bit2me_cache_hits_total Cache hits per category");
        lines.push("# TYPE bit2me_cache_hits_total counter");
        for (const [category, count] of Object.entries(this.cacheHits.snapshot())) {
            lines.push(`bit2me_cache_hits_total{category="${category}"} ${count}`);
        }

        lines.push("# HELP bit2me_cache_misses_total Cache misses per category");
        lines.push("# TYPE bit2me_cache_misses_total counter");
        for (const [category, count] of Object.entries(this.cacheMisses.snapshot())) {
            lines.push(`bit2me_cache_misses_total{category="${category}"} ${count}`);
        }

        lines.push("# HELP bit2me_inflight Outbound calls currently held by the per-group bulkhead");
        lines.push("# TYPE bit2me_inflight gauge");
        const bhStats = groupBulkhead.stats();
        for (const [group, snap] of Object.entries(bhStats)) {
            lines.push(`bit2me_inflight{group="${group}"} ${snap.inFlight}`);
        }
        lines.push("# HELP bit2me_bulkhead_queued Outbound calls queued waiting for a bulkhead permit");
        lines.push("# TYPE bit2me_bulkhead_queued gauge");
        for (const [group, snap] of Object.entries(bhStats)) {
            lines.push(`bit2me_bulkhead_queued{group="${group}"} ${snap.queued}`);
        }
        const tenantSnap = tenantBulkhead.aggregateStats();
        lines.push("# HELP bit2me_inflight_tenant_total Outbound calls in flight aggregated across all tenants");
        lines.push("# TYPE bit2me_inflight_tenant_total gauge");
        lines.push(`bit2me_inflight_tenant_total ${tenantSnap.inFlight}`);
        lines.push("# HELP bit2me_bulkhead_tenant_queued_total Tenant bulkhead waiters aggregated across all tenants");
        lines.push("# TYPE bit2me_bulkhead_tenant_queued_total gauge");
        lines.push(`bit2me_bulkhead_tenant_queued_total ${tenantSnap.queued}`);

        return lines.join("\n") + "\n";
    }

    /**
     * Calculate percentile from durations
     */
    calculatePercentile(toolName: string, percentile: number): number {
        const durations = this.requestDurations.get(toolName);
        if (!durations || durations.length === 0) {
            return 0;
        }

        const sorted = [...durations].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)] || 0;
    }
}

export const metricsCollector = new MetricsCollector();
