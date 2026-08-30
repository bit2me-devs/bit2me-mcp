import { getGroupCircuitBreakerStats } from "./circuit-breaker.js";
import { groupBulkhead } from "./bulkhead.js";
import { circuitStateToGauge, type ToolMetrics } from "./metrics-types.js";

export function renderPrometheus(input: {
    tools: ToolMetrics[];
    circuitFailures: Record<string, number>;
    retries: Record<string, number>;
    cacheHits: Record<string, number>;
    cacheMisses: Record<string, number>;
}): string {
    const lines: string[] = [];
    lines.push("# HELP bit2me_mcp_tool_calls_total Total number of tool invocations");
    lines.push("# TYPE bit2me_mcp_tool_calls_total counter");
    for (const m of input.tools) {
        lines.push(`bit2me_mcp_tool_calls_total{tool="${m.name}"} ${m.callCount}`);
    }
    lines.push("# HELP bit2me_mcp_tool_errors_total Total number of failed tool invocations");
    lines.push("# TYPE bit2me_mcp_tool_errors_total counter");
    for (const m of input.tools) {
        lines.push(`bit2me_mcp_tool_errors_total{tool="${m.name}"} ${m.errorCount}`);
    }
    lines.push("# HELP bit2me_mcp_tool_duration_avg_ms Rolling average duration in milliseconds");
    lines.push("# TYPE bit2me_mcp_tool_duration_avg_ms gauge");
    for (const m of input.tools) {
        lines.push(`bit2me_mcp_tool_duration_avg_ms{tool="${m.name}"} ${m.averageDuration.toFixed(2)}`);
    }

    lines.push("# HELP bit2me_circuit_state Current state (0=closed,1=half_open,2=open)");
    lines.push("# TYPE bit2me_circuit_state gauge");
    for (const [group, snap] of Object.entries(getGroupCircuitBreakerStats())) {
        lines.push(`bit2me_circuit_state{group="${group}"} ${circuitStateToGauge(snap.state)}`);
    }

    lines.push("# HELP bit2me_circuit_failures_total Failures recorded by per-group circuit breakers");
    lines.push("# TYPE bit2me_circuit_failures_total counter");
    for (const [group, count] of Object.entries(input.circuitFailures)) {
        lines.push(`bit2me_circuit_failures_total{group="${group}"} ${count}`);
    }
    lines.push("# HELP bit2me_retries_total Outbound retries by reason");
    lines.push("# TYPE bit2me_retries_total counter");
    for (const [reason, count] of Object.entries(input.retries)) {
        lines.push(`bit2me_retries_total{reason="${reason}"} ${count}`);
    }
    lines.push("# HELP bit2me_cache_hits_total Cache hits per category");
    lines.push("# TYPE bit2me_cache_hits_total counter");
    for (const [category, count] of Object.entries(input.cacheHits)) {
        lines.push(`bit2me_cache_hits_total{category="${category}"} ${count}`);
    }
    lines.push("# HELP bit2me_cache_misses_total Cache misses per category");
    lines.push("# TYPE bit2me_cache_misses_total counter");
    for (const [category, count] of Object.entries(input.cacheMisses)) {
        lines.push(`bit2me_cache_misses_total{category="${category}"} ${count}`);
    }

    const bhStats = groupBulkhead.stats();
    lines.push("# HELP bit2me_inflight Outbound calls currently held by the per-group bulkhead");
    lines.push("# TYPE bit2me_inflight gauge");
    for (const [group, snap] of Object.entries(bhStats)) {
        lines.push(`bit2me_inflight{group="${group}"} ${snap.inFlight}`);
    }
    lines.push("# HELP bit2me_bulkhead_queued Outbound calls queued waiting for a bulkhead permit");
    lines.push("# TYPE bit2me_bulkhead_queued gauge");
    for (const [group, snap] of Object.entries(bhStats)) {
        lines.push(`bit2me_bulkhead_queued{group="${group}"} ${snap.queued}`);
    }
    return lines.join("\n") + "\n";
}
