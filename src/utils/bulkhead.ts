/**
 * Bulkhead pattern for outbound Bit2Me calls.
 *
 * Two independent dimensions of isolation:
 *
 *  - {@link groupBulkhead}: caps the number of simultaneous in-flight
 *    requests per `EndpointGroup`. A spike of `/v1/loan/*` calls cannot
 *    starve the socket pool used by `/v3/currency/ticker`.
 *
 *  - {@link tenantBulkhead}: caps how many concurrent outbound calls a
 *    single tenant can hold across the entire surface. Protects the
 *    multi-tenant HTTP transport from a single noisy tenant fanning
 *    out portfolio aggregations and consuming all permits.
 *
 * Both managers are pure-Node (no external dependencies) and expose
 * `stats()` so the metrics layer can publish in-flight gauges.
 *
 * Defaults are conservative; they can be overridden via env vars without
 * changing application code:
 *
 *   BULKHEAD_GROUP_MARKET_DATA, BULKHEAD_GROUP_WALLET, ... per group
 *   BULKHEAD_TENANT_MAX                                  per tenant
 *
 * Tradeoff: when the cap is hit callers wait on a FIFO queue. Latency
 * grows under contention, but request fairness improves and the upstream
 * never sees more concurrency than configured.
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

const DEFAULT_TENANT_CAP = 8;
const TENANT_CAP_HARD_MIN = 1;
const MAX_TENANT_LIMITERS = 4096;

function readGroupCapFromEnv(group: EndpointGroup): number {
    const key = `BULKHEAD_GROUP_${group.toUpperCase()}`;
    const raw = process.env[key];
    if (!raw) return DEFAULT_GROUP_CAPS[group];
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_GROUP_CAPS[group];
    return parsed;
}

function readTenantCapFromEnv(): number {
    const raw = process.env.BULKHEAD_TENANT_MAX;
    if (!raw) return DEFAULT_TENANT_CAP;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < TENANT_CAP_HARD_MIN) return DEFAULT_TENANT_CAP;
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

export class TenantBulkhead {
    private limiters = new Map<string, ConcurrencyLimiter>();

    private getOrCreate(tenantId: string): ConcurrencyLimiter {
        let limiter = this.limiters.get(tenantId);
        if (!limiter) {
            if (this.limiters.size >= MAX_TENANT_LIMITERS) {
                const firstKey = this.limiters.keys().next().value;
                if (firstKey !== undefined) {
                    this.limiters.delete(firstKey);
                }
            }
            limiter = new ConcurrencyLimiter(readTenantCapFromEnv());
            this.limiters.set(tenantId, limiter);
        }
        return limiter;
    }

    /**
     * Run `fn` under the per-tenant cap. When `tenantId` is undefined
     * the cap does not apply (stdio / single-tenant) and `fn` runs
     * directly.
     */
    run<T>(tenantId: string | undefined, fn: () => Promise<T>): Promise<T> {
        if (!tenantId) return fn();
        return this.getOrCreate(tenantId).run(fn);
    }

    /** Aggregate counts across every active tenant. */
    aggregateStats(): { tenants: number; inFlight: number; queued: number } {
        let inFlight = 0;
        let queued = 0;
        for (const limiter of this.limiters.values()) {
            const s = limiter.stats();
            inFlight += s.inFlight;
            queued += s.queued;
        }
        return {
            tenants: this.limiters.size,
            inFlight,
            queued,
        };
    }

    /** Test helper. */
    reset(): void {
        this.limiters.clear();
    }
}

export const groupBulkhead = new GroupBulkhead();
export const tenantBulkhead = new TenantBulkhead();
