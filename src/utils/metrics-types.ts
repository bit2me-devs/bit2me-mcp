import { CircuitState } from "./circuit-breaker.js";

export class CounterMap {
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

export function circuitStateToGauge(state: CircuitState): number {
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
