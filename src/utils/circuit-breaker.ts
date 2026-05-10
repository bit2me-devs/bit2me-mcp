/**
 * Circuit Breaker implementation to prevent cascading failures
 * Opens circuit after N consecutive failures, allows half-open state for recovery
 */

import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";
import { allEndpointGroups, type EndpointGroup } from "./endpoint-groups.js";

export enum CircuitState {
    CLOSED = "closed", // Normal operation
    OPEN = "open", // Circuit is open, requests fail fast
    HALF_OPEN = "half_open", // Testing if service recovered
}

export interface CircuitBreakerOptions {
    failureThreshold: number; // Number of failures before opening circuit
    resetTimeout: number; // Time in ms before attempting half-open
    successThreshold: number; // Number of successes in half-open to close circuit
    timeout: number; // Request timeout in ms
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
    timeout: 30000,
};

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly options: CircuitBreakerOptions;

    constructor(options: Partial<CircuitBreakerOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Check if circuit allows request
     */
    canExecute(): boolean {
        const now = Date.now();

        // If circuit is closed, allow request
        if (this.state === CircuitState.CLOSED) {
            return true;
        }

        // If circuit is open, check if reset timeout has passed
        if (this.state === CircuitState.OPEN) {
            const timeSinceLastFailure = now - this.lastFailureTime;
            if (timeSinceLastFailure >= this.options.resetTimeout) {
                // Transition to half-open
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
                logger.info("Circuit breaker transitioning to HALF_OPEN", {
                    correlationId: getCorrelationId(),
                    timeSinceLastFailure,
                });
                return true;
            }
            return false;
        }

        // If circuit is half-open, allow request (testing recovery)
        if (this.state === CircuitState.HALF_OPEN) {
            return true;
        }

        return false;
    }

    /**
     * Record a successful request
     */
    recordSuccess(): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                // Circuit recovered, close it
                this.state = CircuitState.CLOSED;
                logger.info("Circuit breaker closed after recovery", {
                    correlationId: getCorrelationId(),
                    successCount: this.successCount,
                });
            }
        }
    }

    /**
     * Record a failed request
     */
    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.successCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            // Failed in half-open, open circuit again
            this.state = CircuitState.OPEN;
            logger.warn("Circuit breaker reopened after failure in HALF_OPEN", {
                correlationId: getCorrelationId(),
            });
        } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
            // Too many failures, open circuit
            this.state = CircuitState.OPEN;
            logger.error("Circuit breaker opened due to failures", {
                correlationId: getCorrelationId(),
                failureCount: this.failureCount,
                threshold: this.options.failureThreshold,
            });
        }
    }

    /**
     * Reset circuit breaker (for testing or manual recovery)
     */
    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        logger.info("Circuit breaker manually reset", {
            correlationId: getCorrelationId(),
        });
    }

    /**
     * Get circuit breaker statistics
     */
    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            timeSinceLastFailure: Date.now() - this.lastFailureTime,
        };
    }
}

/**
 * Global circuit breaker instance for Bit2Me API.
 *
 * Used directly by the stdio (single-tenant) transport and as the shared
 * default by the HTTP transport when no tenant id is in scope. For
 * multi-tenant HTTP traffic, prefer `getTenantCircuitBreaker(tenantId)`
 * so that one misbehaving tenant cannot trip the breaker for all
 * tenants on the same process.
 */
export const apiCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
});

const TENANT_BREAKER_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 30000,
};

const tenantBreakers = new Map<string, CircuitBreaker>();

/**
 * Bound on the number of distinct tenant breakers we keep around. With
 * 2048 entries and ~200 bytes per breaker we cap memory at ~400 KB,
 * which is plenty for any realistic tenant population. When the cap is
 * reached we evict the breaker with the oldest last-failure timestamp
 * (or fall back to insertion order via `Map` iteration), which is a
 * good proxy for "least recently active".
 */
const MAX_TENANT_BREAKERS = 2048;

/**
 * Return the circuit breaker that protects outbound calls for `tenantId`.
 * Falls back to the shared `apiCircuitBreaker` when the tenant id is
 * undefined (stdio transport, tests, internal callers).
 */
export function getTenantCircuitBreaker(tenantId: string | undefined): CircuitBreaker {
    if (!tenantId) return apiCircuitBreaker;
    let breaker = tenantBreakers.get(tenantId);
    if (!breaker) {
        if (tenantBreakers.size >= MAX_TENANT_BREAKERS) {
            // Evict the first inserted entry (FIFO). Map preserves
            // insertion order, so the first key is the oldest.
            const firstKey = tenantBreakers.keys().next().value;
            if (firstKey !== undefined) {
                tenantBreakers.delete(firstKey);
            }
        }
        breaker = new CircuitBreaker(TENANT_BREAKER_OPTIONS);
        tenantBreakers.set(tenantId, breaker);
    }
    return breaker;
}

/** Drop all per-tenant breakers. Useful in tests. */
export function resetTenantCircuitBreakers(): void {
    tenantBreakers.clear();
}

// ============================================================================
// PER-GROUP / PER-TENANT-AND-GROUP CIRCUIT BREAKERS
// ============================================================================
//
// A single global breaker is too coarse: a sustained outage of `/v1/loan/*`
// would otherwise trip the breaker for `/v3/currency/ticker` and starve
// every read. We segment by `EndpointGroup` (loan, trading, wallet, ...)
// so a failure in one domain stays inside that domain.
//
// When a tenant id is in scope we also segment by tenant, giving full
// (tenant x group) isolation. The fallback chain is:
//
//   tenantId + group  →  group  →  apiCircuitBreaker
//
// so callers without a tenant share the per-group breaker, and callers
// without a group (which only happens for ad-hoc endpoints classified as
// "default") still benefit from the legacy single-breaker behaviour.

const GROUP_BREAKER_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 30000,
};

const groupBreakers = new Map<EndpointGroup, CircuitBreaker>();
const tenantGroupBreakers = new Map<string, CircuitBreaker>();
const MAX_TENANT_GROUP_BREAKERS = 8192;

/**
 * Return the circuit breaker dedicated to a given endpoint group.
 *
 * When the group is `"default"` (no rule matched in the
 * `endpoint-groups` table) we fall back to the legacy global breaker so
 * historic stdio call sites keep their original behaviour.
 */
export function getGroupCircuitBreaker(group: EndpointGroup): CircuitBreaker {
    if (group === "default") return apiCircuitBreaker;
    let breaker = groupBreakers.get(group);
    if (!breaker) {
        breaker = new CircuitBreaker(GROUP_BREAKER_OPTIONS);
        groupBreakers.set(group, breaker);
    }
    return breaker;
}

/**
 * Resolve the breaker that should protect an outbound call, combining
 * tenant and endpoint-group dimensions when both are available.
 */
export function getCircuitBreaker(group: EndpointGroup, tenantId: string | undefined): CircuitBreaker {
    if (!tenantId) {
        return getGroupCircuitBreaker(group);
    }
    const key = `${tenantId}::${group}`;
    let breaker = tenantGroupBreakers.get(key);
    if (!breaker) {
        if (tenantGroupBreakers.size >= MAX_TENANT_GROUP_BREAKERS) {
            const firstKey = tenantGroupBreakers.keys().next().value;
            if (firstKey !== undefined) {
                tenantGroupBreakers.delete(firstKey);
            }
        }
        breaker = new CircuitBreaker(GROUP_BREAKER_OPTIONS);
        tenantGroupBreakers.set(key, breaker);
    }
    return breaker;
}

/**
 * Aggregate snapshot of every group breaker, plus the legacy global
 * breaker. Consumed by `/health` to expose the resilience surface in a
 * single payload without touching the per-tenant fan-out.
 */
export function getGroupCircuitBreakerStats(): Record<string, ReturnType<CircuitBreaker["getStats"]>> {
    const out: Record<string, ReturnType<CircuitBreaker["getStats"]>> = {};
    out["global"] = apiCircuitBreaker.getStats();
    for (const group of allEndpointGroups()) {
        if (group === "default") continue;
        out[group] = getGroupCircuitBreaker(group).getStats();
    }
    return out;
}

/** Drop every per-group and per-(tenant,group) breaker. Tests only. */
export function resetGroupCircuitBreakers(): void {
    groupBreakers.clear();
    tenantGroupBreakers.clear();
}
