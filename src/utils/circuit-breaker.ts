/**
 * Circuit Breaker implementation to prevent cascading failures
 * Opens circuit after N consecutive failures, allows half-open state for recovery
 */

import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";

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
 * Global circuit breaker instance for Bit2Me API
 */
export const apiCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
});
