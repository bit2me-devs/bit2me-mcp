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
 * Rate limiter manager that provides endpoint-specific rate limiters
 */
export class EndpointRateLimiterManager {
    private limiters: Map<string, RateLimiter> = new Map();

    /**
     * Get or create a rate limiter for an endpoint
     * @param endpoint - API endpoint path
     * @returns Rate limiter instance for the endpoint
     */
    getLimiter(endpoint: string): RateLimiter {
        // Use pattern matching to find appropriate limiter
        let limiterKey = endpoint;
        for (const pattern of ENDPOINT_RATE_LIMITS.keys()) {
            if (endpoint.startsWith(pattern)) {
                limiterKey = pattern;
                break;
            }
        }

        if (!this.limiters.has(limiterKey)) {
            const config = getRateLimitForEndpoint(endpoint);
            const limiter = new RateLimiter(config.requestsPerInterval, config.intervalMs);
            this.limiters.set(limiterKey, limiter);
        }

        return this.limiters.get(limiterKey)!;
    }

    /**
     * Wait for token for a specific endpoint
     * @param endpoint - API endpoint path
     */
    async waitForToken(endpoint: string): Promise<void> {
        const limiter = this.getLimiter(endpoint);
        await limiter.waitForToken();
    }

    /**
     * Get statistics for all rate limiters
     */
    getStats() {
        const stats: Record<string, unknown> = {};
        for (const [endpoint] of this.limiters.entries()) {
            stats[endpoint] = {
                // RateLimiter doesn't expose stats yet, but we can add that if needed
                configured: true,
            };
        }
        return stats;
    }
}

// Global endpoint rate limiter manager
export const endpointRateLimiter = new EndpointRateLimiterManager();
