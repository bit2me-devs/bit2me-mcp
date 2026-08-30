import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";
import type { EndpointGroup } from "./endpoint-groups.js";
import { CounterMap, type ToolMetrics } from "./metrics-types.js";
import { renderPrometheus } from "./metrics-prometheus.js";

export type { MetricData, ToolMetrics } from "./metrics-types.js";

const MAX_DURATION_SAMPLES_PER_TOOL = 500;

class MetricsCollector {
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private requestDurations: Map<string, number[]> = new Map();
    private circuitFailures = new CounterMap();
    private retries = new CounterMap();
    private cacheHits = new CounterMap();
    private cacheMisses = new CounterMap();

    recordToolExecution(toolName: string, duration: number, success: boolean): void {
        const correlationId = getCorrelationId() || "unknown";
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
        if (success) metrics.successCount++;
        else metrics.errorCount++;
        if (duration < metrics.minDuration) metrics.minDuration = duration;
        if (duration > metrics.maxDuration) metrics.maxDuration = duration;
        metrics.averageDuration = metrics.totalDuration / metrics.callCount;
        if (!this.requestDurations.has(toolName)) this.requestDurations.set(toolName, []);
        const buffer = this.requestDurations.get(toolName)!;
        buffer.push(duration);
        if (buffer.length > MAX_DURATION_SAMPLES_PER_TOOL) {
            buffer.splice(0, buffer.length - MAX_DURATION_SAMPLES_PER_TOOL);
        }
        logger.debug("Tool metric recorded", {
            correlationId,
            toolName,
            duration,
            success,
            totalCalls: metrics.callCount,
            successRate: (metrics.successCount / metrics.callCount) * 100,
        });
    }

    getToolMetrics(toolName: string): ToolMetrics | undefined {
        return this.toolMetrics.get(toolName);
    }

    getAllMetrics(): ToolMetrics[] {
        return Array.from(this.toolMetrics.values());
    }

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

    reset(): void {
        this.toolMetrics.clear();
        this.requestDurations.clear();
        this.circuitFailures.reset();
        this.retries.reset();
        this.cacheHits.reset();
        this.cacheMisses.reset();
    }

    recordCircuitFailure(group: EndpointGroup): void {
        this.circuitFailures.inc(group);
    }

    recordRetry(reason: "rate_limit" | "server_error" | "network"): void {
        this.retries.inc(reason);
    }

    recordCacheHit(category: string): void {
        this.cacheHits.inc(category);
    }

    recordCacheMiss(category: string): void {
        this.cacheMisses.inc(category);
    }

    toPrometheus(): string {
        return renderPrometheus({
            tools: this.getAllMetrics(),
            circuitFailures: this.circuitFailures.snapshot(),
            retries: this.retries.snapshot(),
            cacheHits: this.cacheHits.snapshot(),
            cacheMisses: this.cacheMisses.snapshot(),
        });
    }

    calculatePercentile(toolName: string, percentile: number): number {
        const durations = this.requestDurations.get(toolName);
        if (!durations || durations.length === 0) return 0;
        const sorted = [...durations].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)] || 0;
    }
}

export const metricsCollector = new MetricsCollector();
