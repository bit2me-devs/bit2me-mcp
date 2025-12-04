import { logger } from "./logger.js";

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

/**
 * Simple in-memory cache implementation.
 * Used to store static or infrequently changing data (e.g. asset lists, config)
 * to reduce API calls and improve performance.
 */
export class CacheManager {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private static instance: CacheManager;

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
     * Store a value in the cache with a time-to-live (TTL)
     * @param key - Unique cache key
     * @param data - Data to store
     * @param ttlSeconds - Time to live in seconds
     */
    public set<T>(key: string, data: T, ttlSeconds: number): void {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiry });
        logger.debug(`Cache set for key: ${key}, TTL: ${ttlSeconds}s`);
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
            logger.debug(`Cache expired for key: ${key}`);
            return null;
        }

        logger.debug(`Cache hit for key: ${key}`);
        return entry.data as T;
    }

    /**
     * Clear specific key or entire cache
     * @param key - Optional key to clear. If omitted, clears all cache.
     */
    public clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
            logger.debug(`Cache cleared for key: ${key}`);
        } else {
            this.cache.clear();
            logger.debug("Cache cleared completely");
        }
    }
}

export const cache = CacheManager.getInstance();
