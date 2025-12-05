import { logger } from "./logger.js";
import { getCorrelationId } from "./context.js";

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
    private cache: Map<string, CacheEntry<any>> = new Map();
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
     * Store a value in the cache with category-based TTL
     * @param key - Unique cache key
     * @param data - Data to store
     * @param category - Cache category (determines TTL)
     * @param ttlSeconds - Optional custom TTL override
     */
    public set<T>(
        key: string,
        data: T,
        category: CacheCategory = CacheCategory.STATIC,
        ttlSeconds?: number
    ): void {
        // Evict oldest entries if cache is full
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
     * Retrieve a value from the cache
     * @param key - Cache key to retrieve
     * @returns The cached data or null if not found/expired
     */
    public get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            logger.debug(`Cache expired for key: ${key}`, {
                correlationId: getCorrelationId(),
                category: entry.category,
            });
            return null;
        }

        // Update access statistics
        entry.hits++;
        entry.lastAccessed = Date.now();

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
     * Evict oldest entries (LRU-like eviction)
     */
    private evictOldest(): void {
        const entries = Array.from(this.cache.entries());
        // Sort by last accessed time, oldest first
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        // Remove 10% of oldest entries
        const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        
        logger.debug(`Evicted ${toRemove} oldest cache entries`, {
            correlationId: getCorrelationId(),
        });
    }
}

export const cache = CacheManager.getInstance();
