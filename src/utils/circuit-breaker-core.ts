import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";

export enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open",
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    successThreshold: number;
    timeout: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 30000,
};

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly options: CircuitBreakerOptions;

    constructor(options: Partial<CircuitBreakerOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    getState(): CircuitState {
        return this.state;
    }

    canExecute(): boolean {
        const now = Date.now();
        if (this.state === CircuitState.CLOSED) {
            return true;
        }
        if (this.state === CircuitState.OPEN) {
            const timeSinceLastFailure = now - this.lastFailureTime;
            if (timeSinceLastFailure >= this.options.resetTimeout) {
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
        return this.state === CircuitState.HALF_OPEN;
    }

    recordSuccess(): void {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                logger.info("Circuit breaker closed after recovery", {
                    correlationId: getCorrelationId(),
                    successCount: this.successCount,
                });
            }
        }
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.successCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            logger.warn("Circuit breaker reopened after failure in HALF_OPEN", {
                correlationId: getCorrelationId(),
            });
        } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            logger.error("Circuit breaker opened due to failures", {
                correlationId: getCorrelationId(),
                failureCount: this.failureCount,
                threshold: this.options.failureThreshold,
            });
        }
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        logger.info("Circuit breaker manually reset", {
            correlationId: getCorrelationId(),
        });
    }

    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime || null,
            timeSinceLastFailure: this.lastFailureTime === 0 ? null : Date.now() - this.lastFailureTime,
        };
    }
}

export const apiCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
});
