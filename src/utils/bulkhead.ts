/**
 * Bulkhead pattern for outbound Bit2Me calls.
 *
 * {@link groupBulkhead} caps simultaneous in-flight requests per
 * `EndpointGroup`. A spike of `/v1/loan/*` cannot starve the socket
 * pool used by `/v3/currency/ticker`.
 *
 * Caps: `BULKHEAD_GROUP_MARKET_DATA`, `BULKHEAD_GROUP_WALLET`, …
 * When the cap is hit callers wait on a FIFO queue.
 */

import { ConcurrencyLimiter, type ConcurrencyLimiterStats } from "./concurrency-limiter.js";
import { allEndpointGroups, type EndpointGroup } from "./endpoint-groups.js";

const DEFAULT_GROUP_CAPS: Record<EndpointGroup, number> = {
    market_data: 8,
    wallet: 4,
    trading: 2,
    earn: 4,
    loan: 2,
    account: 2,
    default: 4,
};

function readGroupCapFromEnv(group: EndpointGroup): number {
    const key = `BULKHEAD_GROUP_${group.toUpperCase()}`;
    const raw = process.env[key];
    if (!raw) return DEFAULT_GROUP_CAPS[group];
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_GROUP_CAPS[group];
    return parsed;
}

export class GroupBulkhead {
    private limiters = new Map<EndpointGroup, ConcurrencyLimiter>();

    private getOrCreate(group: EndpointGroup): ConcurrencyLimiter {
        let limiter = this.limiters.get(group);
        if (!limiter) {
            limiter = new ConcurrencyLimiter(readGroupCapFromEnv(group));
            this.limiters.set(group, limiter);
        }
        return limiter;
    }

    /** Run `fn` under the per-group concurrency cap. */
    run<T>(group: EndpointGroup, fn: () => Promise<T>): Promise<T> {
        return this.getOrCreate(group).run(fn);
    }

    /** Snapshot of every group's in-flight + queued counts. */
    stats(): Record<string, ConcurrencyLimiterStats> {
        const out: Record<string, ConcurrencyLimiterStats> = {};
        for (const group of allEndpointGroups()) {
            // Materialise the limiter so the snapshot is symmetric across
            // groups even when one has not seen traffic yet. This makes
            // dashboards rendering all series stable on cold start.
            out[group] = this.getOrCreate(group).stats();
        }
        return out;
    }

    /** Test helper: drop every limiter so caps can be re-read from env. */
    reset(): void {
        this.limiters.clear();
    }
}

export const groupBulkhead = new GroupBulkhead();
