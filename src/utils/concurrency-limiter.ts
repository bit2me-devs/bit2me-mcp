/**
 * Lightweight FIFO semaphore used as the building block for the
 * bulkhead pattern (`utils/bulkhead.ts`).
 *
 * Why hand-rolled instead of `p-limit`/`async-sema`:
 *  - Zero new dependencies; the implementation is ~40 lines.
 *  - Deterministic FIFO ordering (some libraries make no such guarantee
 *    once you mix microtasks and timers).
 *  - Exposes `inFlight` so observability code (Prometheus gauges) can
 *    sample it without monkey-patching.
 *
 * The semaphore is non-reentrant. A holder that needs to acquire the
 * same semaphore again should release it first, otherwise a deadlock
 * is possible when the pool is fully occupied.
 */

type Resolver = () => void;

export interface ConcurrencyLimiterStats {
    /** Maximum permits this limiter can hand out concurrently. */
    capacity: number;
    /** Number of permits currently held. Always `<= capacity`. */
    inFlight: number;
    /** Number of callers parked on `acquire()` waiting for a permit. */
    queued: number;
}

export class ConcurrencyLimiter {
    private permits: number;
    private waiters: Resolver[] = [];

    constructor(public readonly capacity: number) {
        if (!Number.isFinite(capacity) || capacity <= 0) {
            throw new Error(`ConcurrencyLimiter capacity must be > 0, got ${capacity}`);
        }
        this.permits = capacity;
    }

    /**
     * Wait until a permit is available, then claim it. The caller MUST
     * call {@link release} exactly once; prefer {@link run} which does
     * this automatically and is exception-safe.
     */
    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits -= 1;
            return;
        }
        await new Promise<void>((resolve) => {
            this.waiters.push(resolve);
        });
    }

    /** Release a permit, handing it to the next waiter if any. */
    release(): void {
        const next = this.waiters.shift();
        if (next) {
            next();
            return;
        }
        if (this.permits < this.capacity) {
            this.permits += 1;
        }
    }

    /** Run `fn` while holding a permit; releases it on success and on throw. */
    async run<T>(fn: () => Promise<T>): Promise<T> {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }

    stats(): ConcurrencyLimiterStats {
        return {
            capacity: this.capacity,
            inFlight: this.capacity - this.permits,
            queued: this.waiters.length,
        };
    }
}
