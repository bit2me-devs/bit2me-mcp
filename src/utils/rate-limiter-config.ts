/**
 * Rate limiter configuration per endpoint
 * Different endpoints may have different rate limits
 */

import { RateLimiter } from "./rate-limiter.js";

export interface EndpointRateLimit {
    requestsPerInterval: number;
    intervalMs: number;
}

/**
 * Rate limit configurations per endpoint pattern
 * Patterns are matched against endpoint paths
 */
const ENDPOINT_RATE_LIMITS: Map<string, EndpointRateLimit> = new Map([
    // Market data endpoints - more lenient (public data)
    ["/v3/currency/ticker", { requestsPerInterval: 10, intervalMs: 1000 }],
    ["/v3/currency/chart", { requestsPerInterval: 10, intervalMs: 1000 }],
    ["/v1/currency/rate", { requestsPerInterval: 10, intervalMs: 1000 }],
    ["/v2/currency/assets", { requestsPerInterval: 5, intervalMs: 1000 }],

    // Wallet endpoints - moderate limits
    ["/v1/wallet/pocket", { requestsPerInterval: 5, intervalMs: 1000 }],
    ["/v2/wallet/transaction", { requestsPerInterval: 5, intervalMs: 1000 }],
    ["/v1/wallet/transaction", { requestsPerInterval: 5, intervalMs: 1000 }],

    // Pro Trading endpoints - stricter limits (more sensitive)
    ["/v1/trading/order", { requestsPerInterval: 3, intervalMs: 1000 }],
    ["/v1/trading/trade", { requestsPerInterval: 5, intervalMs: 1000 }],
    ["/v1/trading/wallet", { requestsPerInterval: 5, intervalMs: 1000 }],

    // Earn endpoints - moderate limits
    ["/v1/earn", { requestsPerInterval: 5, intervalMs: 1000 }],
    ["/v2/earn", { requestsPerInterval: 5, intervalMs: 1000 }],

    // Loan endpoints - moderate limits
    ["/v1/loan", { requestsPerInterval: 5, intervalMs: 1000 }],

    // Account endpoints - lenient (infrequent)
    ["/v1/account", { requestsPerInterval: 10, intervalMs: 1000 }],
]);

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT: EndpointRateLimit = {
    requestsPerInterval: 5,
    intervalMs: 1000,
};

/**
 * Get rate limit configuration for an endpoint
 * @param endpoint - API endpoint path
 * @returns Rate limit configuration
 */
export function getRateLimitForEndpoint(endpoint: string): EndpointRateLimit {
    // Try exact match first
    if (ENDPOINT_RATE_LIMITS.has(endpoint)) {
        return ENDPOINT_RATE_LIMITS.get(endpoint)!;
    }

    // Try pattern matching (check if endpoint starts with any pattern)
    for (const [pattern, config] of ENDPOINT_RATE_LIMITS.entries()) {
        if (endpoint.startsWith(pattern)) {
            return config;
        }
    }

    // Return default
    return DEFAULT_RATE_LIMIT;
}

/**
 * Hard cap on the number of distinct (tenant, endpoint) limiters we
 * keep in memory. Prevents an unbounded set of tenants from leaking
 * memory through this Map. With ~14 endpoint patterns and 2048 tenants
 * the upper bound is ~28k entries (~few MB), well below any concern.
 */
const MAX_LIMITER_ENTRIES = 4096;

/**
 * Rate limiter manager that provides endpoint-specific rate limiters,
 * partitioned by tenant.
 *
 * When `tenantId` is omitted (stdio transport, internal callers) the
 * manager keeps a single bucket per endpoint pattern -- the previous
 * behaviour. When `tenantId` is provided (HTTP multi-tenant transport)
 * each tenant gets its own token bucket so that one noisy tenant
 * cannot starve another's outbound traffic.
 */
export class EndpointRateLimiterManager {
    private limiters: Map<string, RateLimiter> = new Map();

    private patternFor(endpoint: string): string {
        for (const pattern of ENDPOINT_RATE_LIMITS.keys()) {
            if (endpoint.startsWith(pattern)) {
                return pattern;
            }
        }
        return endpoint;
    }

    /**
     * Get or create a rate limiter for an endpoint, optionally scoped
     * to `tenantId`.
     */
    getLimiter(endpoint: string, tenantId?: string): RateLimiter {
        const pattern = this.patternFor(endpoint);
        const limiterKey = tenantId ? `${tenantId}:${pattern}` : pattern;

        let limiter = this.limiters.get(limiterKey);
        if (!limiter) {
            if (this.limiters.size >= MAX_LIMITER_ENTRIES) {
                const firstKey = this.limiters.keys().next().value;
                if (firstKey !== undefined) {
                    this.limiters.delete(firstKey);
                }
            }
            const config = getRateLimitForEndpoint(endpoint);
            limiter = new RateLimiter(config.requestsPerInterval, config.intervalMs);
            this.limiters.set(limiterKey, limiter);
        }
        return limiter;
    }

    /** Wait for token for a specific endpoint, optionally per-tenant. */
    async waitForToken(endpoint: string, tenantId?: string): Promise<void> {
        const limiter = this.getLimiter(endpoint, tenantId);
        await limiter.waitForToken();
    }

    /** Drop all limiters. Useful in tests. */
    reset(): void {
        this.limiters.clear();
    }

    /** Get statistics for all rate limiters. */
    getStats() {
        const stats: Record<string, unknown> = {};
        for (const [endpoint] of this.limiters.entries()) {
            stats[endpoint] = {
                configured: true,
            };
        }
        return stats;
    }
}

// Global endpoint rate limiter manager
export const endpointRateLimiter = new EndpointRateLimiterManager();
