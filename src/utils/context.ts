/**
 * Request context management with correlation IDs and session tokens.
 *
 * Implementation: backed by `AsyncLocalStorage` so that concurrent requests
 * never share state. Setting a session token in one in-flight request can no
 * longer leak into another in-flight request, which is critical when the
 * server is used in a multi-tenant scenario (HTTP transport with per-request
 * JWTs).
 *
 * Legacy global setters are kept as a fallback for callers that run outside
 * an `runWithContext()` boundary (mostly older tests). They are marked as
 * deprecated and should not be used in new code.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/**
 * Mutable per-request store. We use a mutable object on purpose so that
 * helpers like `setSessionToken()` can attach a value after the context has
 * been entered (e.g. an inbound auth hook updating the store).
 */
export interface RequestContext {
    correlationId: string;
    toolName?: string | undefined;
    startTime: number;
    sessionToken?: string | undefined;
    /**
     * Per-request API credentials. When present, take precedence over the
     * global `BIT2ME_API_KEY` / `BIT2ME_API_SECRET` environment variables.
     * This is what enables the HTTP transport to be genuinely multi-tenant:
     * each incoming request carries its own credentials in headers, and
     * `bit2meRequest()` reads them from here instead of the process env.
     */
    apiKey?: string | undefined;
    apiSecret?: string | undefined;
    /**
     * Stable, opaque identifier for the calling tenant. Set by the HTTP
     * transport (HMAC-SHA256 of the credential, never the credential
     * itself). Consumers use it as the partitioning key for per-tenant
     * resilience primitives (rate limiter, circuit breaker, cache
     * namespaces) so that one tenant's traffic cannot starve or trip
     * another's. Undefined for the stdio (single-tenant) transport.
     */
    tenantId?: string | undefined;
}

/** Read the per-request API key, if the call site is inside a context. */
export function getRequestApiKey(): string | undefined {
    return als.getStore()?.apiKey;
}

/** Read the per-request API secret, if the call site is inside a context. */
export function getRequestApiSecret(): string | undefined {
    return als.getStore()?.apiSecret;
}

/** Read the per-request tenant id, if the call site is inside a context. */
export function getTenantId(): string | undefined {
    return als.getStore()?.tenantId;
}

const als = new AsyncLocalStorage<RequestContext>();

/**
 * Fallback storage for callers that read/write context outside of any
 * `runWithContext()` boundary. Concurrent requests that rely on this fallback
 * are still vulnerable to cross-talk; production code paths must use
 * `runWithContext()`.
 */
const fallback: { correlationId?: string | undefined; sessionToken?: string | undefined } = {};

/**
 * Run `fn` with the given request context attached to the async call chain.
 * All `getCorrelationId()` / `getSessionToken()` calls made (transitively)
 * inside `fn` will read from this context, regardless of how many concurrent
 * `runWithContext` calls overlap in time.
 */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
    return als.run(ctx, fn);
}

/**
 * Get the current request context (if any).
 */
export function getContext(): RequestContext | undefined {
    return als.getStore();
}

/**
 * ContextManager kept for backwards-compatibility. The `contexts` map is no
 * longer used internally (state lives in AsyncLocalStorage), but tests still
 * import the singleton.
 */
class ContextManager {
    /** @deprecated kept for tests only */
    private contexts: Map<string, RequestContext> = new Map();

    generateCorrelationId(): string {
        return randomUUID();
    }

    createContext(toolName?: string): RequestContext {
        const correlationId = this.generateCorrelationId();
        const context: RequestContext = {
            correlationId,
            toolName,
            startTime: Date.now(),
        };
        this.contexts.set(correlationId, context);
        return context;
    }

    getContext(correlationId: string): RequestContext | undefined {
        return this.contexts.get(correlationId);
    }

    clearContext(correlationId: string): void {
        this.contexts.delete(correlationId);
    }

    getActiveContexts(): RequestContext[] {
        return Array.from(this.contexts.values());
    }
}

export const contextManager = new ContextManager();

// ============================================================================
// CORRELATION ID
// ============================================================================

/**
 * Get the correlation ID for the current request, or undefined.
 */
export function getCorrelationId(): string | undefined {
    const store = als.getStore();
    if (store) return store.correlationId;
    return fallback.correlationId;
}

/**
 * @deprecated Use `runWithContext()` instead. Kept for tests.
 *
 * If called inside an `runWithContext` boundary, mutates the active store.
 * Otherwise stores into a process-wide fallback (NOT safe under concurrency).
 */
export function setCorrelationId(correlationId: string): void {
    const store = als.getStore();
    if (store) {
        store.correlationId = correlationId;
        return;
    }
    fallback.correlationId = correlationId;
}

/**
 * @deprecated kept for tests.
 */
export function clearCorrelationId(): void {
    const store = als.getStore();
    if (store) {
        // We cannot truly delete a required field from the active store; the
        // store will be discarded automatically once `runWithContext` exits.
        // Best-effort: blank it out.
        store.correlationId = "";
        return;
    }
    fallback.correlationId = undefined;
}

// ============================================================================
// SESSION TOKEN MANAGEMENT (for web-like authentication)
// ============================================================================

/**
 * Get the JWT session token for the current request, or undefined.
 */
export function getSessionToken(): string | undefined {
    const store = als.getStore();
    if (store) return store.sessionToken;
    return fallback.sessionToken;
}

/**
 * @deprecated Use `runWithContext()` instead. Kept for tests.
 */
export function setSessionToken(sessionToken: string | undefined): void {
    const store = als.getStore();
    if (store) {
        store.sessionToken = sessionToken;
        return;
    }
    if (sessionToken) {
        fallback.sessionToken = sessionToken;
    } else {
        fallback.sessionToken = undefined;
    }
}

/**
 * @deprecated kept for tests.
 */
export function clearSessionToken(): void {
    const store = als.getStore();
    if (store) {
        store.sessionToken = undefined;
        return;
    }
    fallback.sessionToken = undefined;
}
