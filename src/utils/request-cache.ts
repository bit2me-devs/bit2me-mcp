/**
 * Request-scoped memoization.
 *
 * Different tools sometimes need the same upstream resource multiple times
 * inside a single MCP request (for example, the broker quote tools all
 * fetch `/v1/wallet/pocket` once to look up the origin currency). When all
 * three tools are invoked back-to-back the same payload would be downloaded
 * three times.
 *
 * `memoizePerRequest()` deduplicates these calls without leaking results
 * across requests. The cache key is `(correlationId, key)`, so two
 * concurrent tool invocations cannot see each other's data.
 *
 * Entries live until they are explicitly evicted by the caller (typically
 * the `finally` of `executeTool`) or until a 5-minute TTL expires as a
 * safety net.
 */

import { getCorrelationId } from "./context.js";

interface Entry {
    expiresAt: number;
    value: unknown;
}

const TTL_MS = 5 * 60 * 1000; // 5 min safety TTL
const store = new Map<string, Entry>();

function makeKey(correlationId: string, key: string): string {
    return `${correlationId}::${key}`;
}

/**
 * Get or compute a value scoped to the current correlation ID.
 *
 * If no correlation ID is active (e.g. a one-off CLI call outside the MCP
 * lifecycle), the loader is invoked directly without caching to avoid
 * accidentally sharing state across unrelated calls.
 */
export async function memoizePerRequest<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const correlationId = getCorrelationId();
    if (!correlationId) {
        return loader();
    }

    const cacheKey = makeKey(correlationId, key);
    const now = Date.now();
    const existing = store.get(cacheKey);
    if (existing && existing.expiresAt > now) {
        return existing.value as T;
    }

    const value = await loader();
    store.set(cacheKey, { value, expiresAt: now + TTL_MS });
    return value;
}

/**
 * Drop every entry that belongs to a given correlation ID. Should be called
 * once the request is finished to prevent unbounded growth.
 */
export function clearRequestCache(correlationId: string | undefined): void {
    if (!correlationId) return;
    const prefix = `${correlationId}::`;
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}

/**
 * Test-only helper that wipes the entire store.
 */
export function _resetRequestCacheForTests(): void {
    store.clear();
}
