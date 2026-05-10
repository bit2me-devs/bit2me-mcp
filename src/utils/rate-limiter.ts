import { logger } from "./logger.js";

/**
 * Snapshot of a single {@link RateLimiter}'s live state. Consumed by the
 * health endpoint and by Prometheus exposition logic.
 */
export interface RateLimiterStats {
    /** Maximum tokens in the bucket. */
    capacity: number;
    /** Tokens currently available (may be fractional after a partial refill). */
    tokensAvailable: number;
    /** Configured requests per second. */
    rps: number;
    /** Refill window in milliseconds. */
    intervalMs: number;
}

/**
 * Token Bucket Rate Limiter
 * Controls the rate of outgoing requests to avoid hitting API limits.
 */
export class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly maxTokens: number;
    private readonly refillRate: number; // tokens per millisecond
    private readonly interval: number;
    private readonly requestsPerInterval: number;

    /**
     * @param requestsPerInterval Maximum number of requests allowed in the interval
     * @param intervalMs Interval in milliseconds (default: 1000ms)
     */
    constructor(requestsPerInterval: number, intervalMs: number = 1000) {
        this.maxTokens = requestsPerInterval;
        this.tokens = requestsPerInterval;
        this.lastRefill = Date.now();
        this.interval = intervalMs;
        this.requestsPerInterval = requestsPerInterval;
        this.refillRate = requestsPerInterval / intervalMs;
    }

    private refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const newTokens = timePassed * this.refillRate;

        if (newTokens > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
            this.lastRefill = now;
        }
    }

    /**
     * Wait until a token is available.
     *
     * Implementation note: previously this method recursed after each
     * sleep; the loop form below avoids deep async chains under
     * sustained contention while preserving the exact same semantics
     * (no spin: each iteration sleeps the precise refill window
     * required to accumulate the missing token).
     */
    public async waitForToken(): Promise<void> {
        // Bound the iteration count defensively. Under normal operation
        // the loop exits in 1–2 iterations; the cap is a tripwire
        // against pathological clock skew that would otherwise spin
        // silently.
        for (let i = 0; i < 1024; i += 1) {
            this.refill();
            if (this.tokens >= 1) {
                this.tokens -= 1;
                return;
            }
            const missingTokens = 1 - this.tokens;
            const waitTime = Math.max(1, Math.ceil(missingTokens / this.refillRate));
            logger.debug(`Rate limit: waiting ${waitTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        // We exhausted the iteration cap without securing a token. Log
        // and fall through so the caller can fail fast instead of
        // dead-locking.
        logger.warn("Rate limiter could not secure a token within iteration cap; releasing caller without permit");
    }

    /**
     * Snapshot of live state. The {@code tokensAvailable} value is
     * computed from the latest refill so dashboards see the bucket as
     * the next caller would.
     */
    public stats(): RateLimiterStats {
        // Refill computes the current bucket state without consuming a
        // token, so the snapshot reflects "what the next caller would
        // observe right now".
        this.refill();
        return {
            capacity: this.maxTokens,
            tokensAvailable: this.tokens,
            rps: (this.requestsPerInterval / this.interval) * 1000,
            intervalMs: this.interval,
        };
    }
}

// Global rate limiter instance
// Bit2Me generic limit: around 10 requests per second is safe for most public endpoints
// We'll be conservative with 5 requests per second to avoid 429s
export const rateLimiter = new RateLimiter(5, 1000);
