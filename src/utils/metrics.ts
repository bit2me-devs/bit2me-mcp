/**
 * Metrics collection for observability
 * Tracks performance, errors, and usage statistics
 */

import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";

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

class MetricsCollector {
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private requestDurations: Map<string, number[]> = new Map();

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

        // Store duration for percentile calculations
        if (!this.requestDurations.has(toolName)) {
            this.requestDurations.set(toolName, []);
        }
        this.requestDurations.get(toolName)!.push(duration);

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
