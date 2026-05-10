/**
 * Tests for the bulkhead pattern primitives:
 *
 *  - {@link ConcurrencyLimiter}: FIFO semaphore with bounded permits.
 *  - {@link GroupBulkhead}: per-EndpointGroup concurrency cap.
 *  - {@link TenantBulkhead}: per-tenant concurrency cap with stdio
 *    bypass when no tenant id is in scope.
 *
 * The assertions verify the *temporal contract* (max in-flight is bounded
 * by `capacity`) without depending on wall clock timing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ConcurrencyLimiter } from "../src/utils/concurrency-limiter.js";
import { GroupBulkhead, TenantBulkhead } from "../src/utils/bulkhead.js";

/**
 * Build a deferred future that the test can resolve manually. Used to
 * keep tasks "in flight" deterministically.
 */
function deferred<T = void>() {
    let resolve!: (v: T | PromiseLike<T>) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("ConcurrencyLimiter", () => {
    it("rejects non-positive capacity", () => {
        expect(() => new ConcurrencyLimiter(0)).toThrow();
        expect(() => new ConcurrencyLimiter(-1)).toThrow();
        expect(() => new ConcurrencyLimiter(Number.NaN)).toThrow();
    });

    it("limits concurrent runners to `capacity`", async () => {
        const limiter = new ConcurrencyLimiter(2);
        let active = 0;
        let peak = 0;
        const gates = Array.from({ length: 5 }, () => deferred<void>());

        const tasks = gates.map((gate, idx) =>
            limiter.run(async () => {
                active += 1;
                peak = Math.max(peak, active);
                await gate.promise;
                active -= 1;
                return idx;
            })
        );

        // Yield so queued tasks reach the limiter.
        await new Promise((r) => setImmediate(r));
        expect(active).toBeLessThanOrEqual(2);

        // Drain the gates one by one. Each release lets the next waiter run.
        for (const gate of gates) {
            gate.resolve();
            await new Promise((r) => setImmediate(r));
        }

        await Promise.all(tasks);
        expect(peak).toBe(2);
        expect(limiter.stats()).toEqual({ capacity: 2, inFlight: 0, queued: 0 });
    });

    it("releases the permit even when the body throws", async () => {
        const limiter = new ConcurrencyLimiter(1);
        await expect(
            limiter.run(async () => {
                throw new Error("boom");
            })
        ).rejects.toThrow("boom");
        // The next call must not deadlock — the permit was released.
        await expect(limiter.run(async () => 42)).resolves.toBe(42);
    });

    it("reports inFlight and queued in stats", async () => {
        const limiter = new ConcurrencyLimiter(1);
        const gate = deferred<void>();
        const first = limiter.run(async () => {
            await gate.promise;
        });
        // Yield once so `first` enters the critical section.
        await new Promise((r) => setImmediate(r));
        const second = limiter.run(async () => undefined);
        await new Promise((r) => setImmediate(r));
        expect(limiter.stats().inFlight).toBe(1);
        expect(limiter.stats().queued).toBe(1);
        gate.resolve();
        await Promise.all([first, second]);
    });
});

describe("GroupBulkhead", () => {
    let bulkhead: GroupBulkhead;

    beforeEach(() => {
        delete process.env.BULKHEAD_GROUP_LOAN;
        bulkhead = new GroupBulkhead();
    });

    it("respects the per-group concurrency cap", async () => {
        process.env.BULKHEAD_GROUP_LOAN = "2";
        bulkhead = new GroupBulkhead();
        const gates = Array.from({ length: 4 }, () => deferred<void>());
        let active = 0;
        let peak = 0;

        const tasks = gates.map((gate) =>
            bulkhead.run("loan", async () => {
                active += 1;
                peak = Math.max(peak, active);
                await gate.promise;
                active -= 1;
            })
        );

        await new Promise((r) => setImmediate(r));
        for (const gate of gates) {
            gate.resolve();
            await new Promise((r) => setImmediate(r));
        }

        await Promise.all(tasks);
        expect(peak).toBe(2);
    });

    it("isolates groups: trading saturation does not stall market_data", async () => {
        process.env.BULKHEAD_GROUP_TRADING = "1";
        bulkhead = new GroupBulkhead();

        const tradingGate = deferred<void>();
        const tradingTask = bulkhead.run("trading", async () => {
            await tradingGate.promise;
        });

        // While trading is full, market_data must run unimpeded.
        await expect(bulkhead.run("market_data", async () => "ok")).resolves.toBe("ok");

        tradingGate.resolve();
        await tradingTask;
    });

    it("stats() includes every declared group", () => {
        const snapshot = bulkhead.stats();
        for (const group of ["market_data", "wallet", "trading", "earn", "loan", "account", "default"]) {
            expect(snapshot).toHaveProperty(group);
        }
    });
});

describe("TenantBulkhead", () => {
    beforeEach(() => {
        delete process.env.BULKHEAD_TENANT_MAX;
    });

    it("does not enforce any cap when tenantId is undefined", async () => {
        const bulkhead = new TenantBulkhead();
        const result = await bulkhead.run(undefined, async () => "passthrough");
        expect(result).toBe("passthrough");
    });

    it("isolates tenants: tenant A saturation does not stall tenant B", async () => {
        process.env.BULKHEAD_TENANT_MAX = "1";
        const bulkhead = new TenantBulkhead();

        const aGate = deferred<void>();
        const aTask = bulkhead.run("tenant-a", async () => {
            await aGate.promise;
        });

        await expect(bulkhead.run("tenant-b", async () => "ok")).resolves.toBe("ok");

        aGate.resolve();
        await aTask;
    });

    it("aggregateStats counts all active tenants", async () => {
        process.env.BULKHEAD_TENANT_MAX = "1";
        const bulkhead = new TenantBulkhead();

        const aGate = deferred<void>();
        const bGate = deferred<void>();
        const a = bulkhead.run("tenant-a", async () => {
            await aGate.promise;
        });
        const b = bulkhead.run("tenant-b", async () => {
            await bGate.promise;
        });
        await new Promise((r) => setImmediate(r));

        const stats = bulkhead.aggregateStats();
        expect(stats.tenants).toBe(2);
        expect(stats.inFlight).toBe(2);

        aGate.resolve();
        bGate.resolve();
        await Promise.all([a, b]);
    });
});
