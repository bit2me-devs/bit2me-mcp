import { logger } from "./logger.js";
import { getCorrelationId, getTenantId } from "./context.js";
import { metricsCollector } from "./metrics.js";

interface CacheEntry<T> {
    data: T;
    expiry: number;
    category?: CacheCategory;
    hits: number;
    lastAccessed: number;
}

/**
 * Cache categories with different TTL strategies
 */
export enum CacheCategory {
    STATIC = "static", // Asset lists, configs - long TTL (1 hour)
    MARKET_DATA = "market_data", // Prices, tickers - short TTL (30 seconds)
    BALANCE = "balance", // Wallet balances - medium TTL (1 minute)
    TRANSACTION = "transaction", // Transaction history - medium TTL (2 minutes)
    ORDER = "order", // Order data - short TTL (15 seconds)
    USER_DATA = "user_data", // User-specific data - medium TTL (1 minute)
}

/**
 * Default TTLs by category (in seconds)
 */
const DEFAULT_TTLS: Record<CacheCategory, number> = {
    [CacheCategory.STATIC]: 3600, // 1 hour
    [CacheCategory.MARKET_DATA]: 30, // 30 seconds
    [CacheCategory.BALANCE]: 60, // 1 minute
    [CacheCategory.TRANSACTION]: 120, // 2 minutes
    [CacheCategory.ORDER]: 15, // 15 seconds
    [CacheCategory.USER_DATA]: 60, // 1 minute
};

/**
 * Intelligent cache implementation with category-based TTL strategies.
 * Used to store data with appropriate cache durations based on data type.
 */
export class CacheManager {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private static instance: CacheManager;
    private maxSize: number = 1000; // Maximum number of entries

    private constructor() {}

    /**
     * Get the singleton instance of CacheManager
     */
    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * Store a value in the cache with category-based TTL.
     *
     * The implementation relies on the insertion order of the
     * underlying `Map`: each call to `set()` appends the entry at the
     * tail (or moves it to the tail when overwriting), and `evict()`
     * removes the head — the least-recently-touched entry. Together
     * with `get()` (which moves a hit back to the tail) this gives a
     * proper O(1) LRU without scanning or sorting.
     */
    public set<T>(key: string, data: T, category: CacheCategory = CacheCategory.STATIC, ttlSeconds?: number): void {
        // If the key already exists, drop the old entry so the re-insertion
        // below appends a fresh entry at the tail of the iteration order.
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest entries if cache is full.
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const ttl = ttlSeconds ?? DEFAULT_TTLS[category];
        const expiry = Date.now() + ttl * 1000;
        this.cache.set(key, {
            data,
            expiry,
            category,
            hits: 0,
            lastAccessed: Date.now(),
        });
        logger.debug(`Cache set for key: ${key}`, {
            correlationId: getCorrelationId(),
            category,
            ttl,
        });
    }

    /**
     * Retrieve a value from the cache. On a hit the entry is moved to
     * the tail of the iteration order so subsequent eviction prefers
     * truly cold entries.
     */
    public get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            metricsCollector.recordCacheMiss("unknown");
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            metricsCollector.recordCacheMiss(entry.category ?? "unknown");
            logger.debug(`Cache expired for key: ${key}`, {
                correlationId: getCorrelationId(),
                category: entry.category,
            });
            return null;
        }

        // Update access statistics
        entry.hits++;
        entry.lastAccessed = Date.now();

        // Move to the tail: delete + reinsert. This is the single
        // mutation that turns the underlying Map into an LRU index.
        this.cache.delete(key);
        this.cache.set(key, entry);

        metricsCollector.recordCacheHit(entry.category ?? "unknown");
        logger.debug(`Cache hit for key: ${key}`, {
            correlationId: getCorrelationId(),
            category: entry.category,
            hits: entry.hits,
        });
        return entry.data as T;
    }

    /**
     * Clear specific key or entire cache
     * @param key - Optional key to clear. If omitted, clears all cache.
     */
    public clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
            logger.debug(`Cache cleared for key: ${key}`, {
                correlationId: getCorrelationId(),
            });
        } else {
            this.cache.clear();
            logger.debug("Cache cleared completely", {
                correlationId: getCorrelationId(),
            });
        }
    }

    /**
     * Clear cache entries by category
     * @param category - Category to clear
     */
    public clearByCategory(category: CacheCategory): void {
        let cleared = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.category === category) {
                this.cache.delete(key);
                cleared++;
            }
        }
        logger.debug(`Cleared ${cleared} entries for category: ${category}`, {
            correlationId: getCorrelationId(),
        });
    }

    /**
     * Get cache statistics
     */
    public getStats() {
        const stats: Record<string, { count: number; hits: number; size: number }> = {};
        let totalSize = 0;

        for (const entry of this.cache.values()) {
            const cat = entry.category || "unknown";
            if (!stats[cat]) {
                stats[cat] = { count: 0, hits: 0, size: 0 };
            }
            stats[cat].count++;
            stats[cat].hits += entry.hits;
            totalSize += JSON.stringify(entry.data).length;
        }

        return {
            totalEntries: this.cache.size,
            totalSize,
            byCategory: stats,
        };
    }

    /**
     * Evict the oldest entries in O(k) time where k is the number of
     * entries removed (k = 10% of size, minimum 1).
     *
     * `Map` preserves insertion order, and {@link get}/{@link set}
     * always move touched entries to the tail, so the head of the
     * iteration order is the least-recently-used entry by definition.
     * No sorting required.
     */
    private evictOldest(): void {
        const toRemove = Math.max(1, Math.floor(this.cache.size * 0.1));
        let removed = 0;
        const it = this.cache.keys();
        while (removed < toRemove) {
            const next = it.next();
            if (next.done) break;
            this.cache.delete(next.value);
            removed += 1;
        }

        logger.debug(`Evicted ${removed} oldest cache entries`, {
            correlationId: getCorrelationId(),
        });
    }
}

export const cache = CacheManager.getInstance();

/**
 * Build a cache key partitioned by the active tenant id.
 *
 * The shared `CacheManager` lives on the global heap, so any cached
 * value that depends on credentials would otherwise leak across
 * tenants in the multi-tenant HTTP transport. Always feed credentialed
 * payloads through this helper so the key includes a tenant fingerprint
 * and only that tenant ever observes the cached entry.
 *
 * Public market data (tickers, asset directories) are tenant-agnostic
 * by definition and may use the legacy raw-key APIs directly.
 *
 * Stable string serialisation: numeric and boolean parts are coerced via
 * `String()`; objects are JSON.stringified with sorted keys so the same
 * logical request always hashes to the same key.
 */
export function tenantScopedKey(parts: ReadonlyArray<string | number | boolean | object>): string {
    const tenant = getTenantId() ?? "global";
    const serialised = parts.map((part) => {
        if (part === null || part === undefined) return "";
        if (typeof part === "object") return stableStringify(part);
        return String(part);
    });
    return `${tenant}::${serialised.join("::")}`;
}

/**
 * Deterministic JSON stringifier with sorted object keys. Avoids cache
 * misses when the caller passes the same logical params with a
 * different property order.
 */
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}
