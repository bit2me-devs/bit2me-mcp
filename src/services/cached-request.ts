/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cache-Aside helper for idempotent GETs.
 *
 * The wrapper lives in its own module (instead of being colocated with
 * `bit2meRequest` in `bit2me.ts`) so that test suites mocking
 * `services/bit2me.js` automatically see `cachedGet` flow through their
 * mocked `bit2meRequest`. Defining both functions in the same module
 * would defeat the mock because `cachedGet`'s intra-module reference
 * to `bit2meRequest` would bypass the module-level export replacement.
 */

import { bit2meRequest } from "./bit2me.js";
import { cache, CacheCategory, tenantScopedKey } from "../utils/cache.js";

export interface CachedGetOptions {
    /** Override the default request timeout for this call. */
    timeoutOverride?: number;
    /** Force-attach a JWT session token. */
    sessionToken?: string;
    /** Override the category-default TTL (seconds). */
    ttlSeconds?: number;
}

/**
 * Wraps a `bit2meRequest("GET", ...)` with the shared cache manager and
 * a tenant-scoped key so tenants cannot observe each other's cached
 * payloads (see `tenantScopedKey` for the partitioning contract).
 *
 * Resolution order:
 *  1. Cache hit on `(tenantId, endpoint, params)` → return cached value.
 *  2. Cache miss → call the upstream, store the response with the
 *     category's default TTL, return it.
 *
 * **Contract**: the value returned by this helper is the live cache
 * entry. Callers MUST NOT mutate it; deep-clone first if they need a
 * private copy. See {@link CacheManager.get} for the immutability
 * contract.
 *
 * Use this helper only for endpoints whose response is stable over the
 * cache TTL window. Mutating endpoints (POST/DELETE) and endpoints whose
 * freshness must be sub-second keep going through `bit2meRequest`.
 */
export async function cachedGet<T = any>(
    endpoint: string,
    params: Record<string, unknown> | undefined,
    category: CacheCategory,
    options: CachedGetOptions = {}
): Promise<T> {
    const key = tenantScopedKey([endpoint, params ?? {}]);
    const cached = cache.get<T>(key, category);
    if (cached !== null) {
        return cached;
    }
    // Only forward optional positional arguments when the caller
    // actually supplied them. This keeps the call signature aligned
    // with the historic `bit2meRequest("GET", endpoint[, params])`
    // shape used by every existing tool, so behavioural assertions
    // in the unit tests remain valid.
    let response: T;
    const hasOptions = options.timeoutOverride !== undefined || options.sessionToken !== undefined;
    if (hasOptions) {
        response = await bit2meRequest<T>(
            "GET",
            endpoint,
            params,
            undefined,
            options.timeoutOverride,
            options.sessionToken
        );
    } else if (params !== undefined) {
        response = await bit2meRequest<T>("GET", endpoint, params);
    } else {
        response = await bit2meRequest<T>("GET", endpoint);
    }
    cache.set(key, response, category, options.ttlSeconds);
    return response;
}
