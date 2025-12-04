import { logger } from "./logger.js";

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

    /**
     * @param requestsPerInterval Maximum number of requests allowed in the interval
     * @param intervalMs Interval in milliseconds (default: 1000ms)
     */
    constructor(requestsPerInterval: number, intervalMs: number = 1000) {
        this.maxTokens = requestsPerInterval;
        this.tokens = requestsPerInterval;
        this.lastRefill = Date.now();
        this.interval = intervalMs;
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
     * Wait until a token is available
     */
    public async waitForToken(): Promise<void> {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return;
        }

        // Calculate wait time
        const missingTokens = 1 - this.tokens;
        const waitTime = Math.ceil(missingTokens / this.refillRate);

        if (waitTime > 0) {
            logger.debug(`Rate limit: waiting ${waitTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.waitForToken(); // Recurse to ensure token is secured
        }
    }
}

// Global rate limiter instance
// Bit2Me generic limit: around 10 requests per second is safe for most public endpoints
// We'll be conservative with 5 requests per second to avoid 429s
export const rateLimiter = new RateLimiter(5, 1000);
