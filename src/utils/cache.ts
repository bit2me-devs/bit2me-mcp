import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";
import { metricsCollector } from "./metrics.js";
import { CacheCategory, DEFAULT_TTLS } from "./cache-category.js";

export { CacheCategory } from "./cache-category.js";
export { cacheKey } from "./cache-key.js";

interface CacheEntry<T> {
    data: T;
    expiry: number;
    category?: CacheCategory;
    hits: number;
    lastAccessed: number;
}

/** LRU cache (Map insertion order). Values are live references — do not mutate. */
export class CacheManager {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private static instance: CacheManager;
    private maxSize: number = 1000;

    private constructor() {}

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public set<T>(key: string, data: T, category: CacheCategory = CacheCategory.STATIC, ttlSeconds?: number): void {
        if (data === null || data === undefined) {
            logger.debug(`Cache set ignored: nullish value for key ${key}`, {
                correlationId: getCorrelationId(),
                category,
            });
            return;
        }
        if (this.cache.has(key)) this.cache.delete(key);
        if (this.cache.size >= this.maxSize) this.evictOldest();
        const ttl = ttlSeconds ?? DEFAULT_TTLS[category];
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl * 1000,
            category,
            hits: 0,
            lastAccessed: Date.now(),
        });
        logger.debug(`Cache set for key: ${key}`, { correlationId: getCorrelationId(), category, ttl });
    }

    public get<T>(key: string, category?: CacheCategory): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            metricsCollector.recordCacheMiss(category ?? "unknown");
            return null;
        }
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            metricsCollector.recordCacheMiss(entry.category ?? category ?? "unknown");
            logger.debug(`Cache expired for key: ${key}`, {
                correlationId: getCorrelationId(),
                category: entry.category,
            });
            return null;
        }
        entry.hits++;
        entry.lastAccessed = Date.now();
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

    public clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
            logger.debug(`Cache cleared for key: ${key}`, { correlationId: getCorrelationId() });
        } else {
            this.cache.clear();
            logger.debug("Cache cleared completely", { correlationId: getCorrelationId() });
        }
    }

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

    public getStats() {
        const stats: Record<string, { count: number; hits: number; size: number }> = {};
        let totalSize = 0;
        for (const entry of this.cache.values()) {
            const cat = entry.category || "unknown";
            if (!stats[cat]) stats[cat] = { count: 0, hits: 0, size: 0 };
            stats[cat].count++;
            stats[cat].hits += entry.hits;
            totalSize += JSON.stringify(entry.data).length;
        }
        return { totalEntries: this.cache.size, totalSize, byCategory: stats };
    }

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
        logger.debug(`Evicted ${removed} oldest cache entries`, { correlationId: getCorrelationId() });
    }
}

export const cache = CacheManager.getInstance();
