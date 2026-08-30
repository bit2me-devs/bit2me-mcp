import axios from "axios";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import { Bit2MeAPIError } from "../utils/errors.js";
import { rateLimiter } from "../utils/rate-limiter.js";
import { endpointRateLimiter } from "../utils/rate-limiter-config.js";
import { getGroupCircuitBreaker } from "../utils/circuit-breaker.js";
import { endpointGroup } from "../utils/endpoint-groups.js";
import { groupBulkhead } from "../utils/bulkhead.js";
import { getCorrelationId, getSessionToken, getRequestApiKey, getRequestApiSecret } from "../utils/context.js";
import { assertSafeCookieValue, assertSafeEndpoint, flattenScalarParams } from "./bit2me-sign.js";
import { buildBit2MeAxiosConfig } from "./bit2me-build.js";
import { handleBit2MeAxiosError } from "./bit2me-errors.js";

export { generateSignature, nextNonce } from "./bit2me-sign.js";
export { resolveIdempotencyKey } from "../utils/write-guards.js";
export { getMarketPrice, getTicker } from "./bit2me-market.js";

/**
 * Optional, advanced parameters for `bit2meRequest`.
 *
 * Kept as a single object so callers don't have to thread positional
 * arguments. All fields are optional and default to safe values.
 */
export interface Bit2MeRequestOptions {
    /** Override the configured number of retries for this call. */
    retries?: number;
    /** Override the configured request timeout (ms) for this call. */
    timeoutOverride?: number;
    /**
     * Force-attach a session token to this call. When omitted the token is
     * read from the active `runWithContext()` store.
     */
    sessionToken?: string;
    /**
     * Idempotency key forwarded as `Idempotency-Key` header. Strongly
     * recommended for mutating operations (POST/DELETE) to ensure that
     * retries cannot create duplicate orders/transfers/etc.
     */
    idempotencyKey?: string;
    /**
     * Internal counter used by the retry loop. Callers should not set this.
     */
    attempt?: number;
}

/**
 * Centralized wrapper for API calls.
 * Handles headers, signature, nonce, timeouts, retry with exponential backoff.
 *
 * Version-agnostic: the caller must provide the full path including version
 * (e.g. "/v3/currency/ticker"). Auth is API key + signature, or JWT cookie
 * when a session token is provided.
 *
 * RETRY POLICY:
 * - 429 (rate limit): retried with exponential backoff up to MAX_RETRIES.
 * - 5xx and connection errors: retried with exponential backoff for GETs;
 *   for POST/DELETE, only retried when an `idempotencyKey` was provided.
 */
export async function bit2meRequest<T = unknown>(
    method: "GET" | "POST" | "DELETE",
    endpoint: string,
    params?: Record<string, unknown>,
    retries?: number,
    timeoutOverride?: number,
    sessionToken?: string,
    options?: Bit2MeRequestOptions
): Promise<T> {
    const opts: Bit2MeRequestOptions = options ?? {};
    const attempt = opts.attempt ?? 0;
    const resolvedSessionToken = sessionToken ?? opts.sessionToken ?? getSessionToken();

    // Validate caller-controlled input BEFORE getConfig(), rate-limit
    // tokens, or the breaker (security + tests without credentials).
    assertSafeEndpoint(endpoint);
    if (resolvedSessionToken !== undefined) {
        assertSafeCookieValue(resolvedSessionToken);
    }
    let preflightFlatParams: Record<string, string> | undefined;
    if (method === "GET" && params && Object.keys(params).length > 0) {
        preflightFlatParams = flattenScalarParams(params);
    }

    const appConfig = getConfig();
    const effectiveRetries = retries ?? opts.retries ?? appConfig.MAX_RETRIES;
    const timeout = timeoutOverride ?? opts.timeoutOverride ?? appConfig.REQUEST_TIMEOUT;

    // Segment the breaker by endpoint group (loan/trading/wallet/...)
    // so a sustained failure in one domain cannot trip every other
    // domain. One process, one operator (ADR 0003).
    const group = endpointGroup(endpoint);
    const circuitBreaker = getGroupCircuitBreaker(group);

    if (!circuitBreaker.canExecute()) {
        const circuitState = circuitBreaker.getState();
        logger.error("Circuit breaker is OPEN, request rejected", {
            correlationId: getCorrelationId(),
            group,
            endpoint,
            circuitState,
            stats: circuitBreaker.getStats(),
        });
        throw new Bit2MeAPIError(
            503,
            `Service temporarily unavailable. Circuit breaker is ${circuitState}. Please try again later.`,
            endpoint
        );
    }

    try {
        await endpointRateLimiter.waitForToken(endpoint);
    } catch {
        await rateLimiter.waitForToken();
    }

    const built = buildBit2MeAxiosConfig({
        method,
        endpoint,
        params,
        timeout,
        apiKey: getRequestApiKey() ?? appConfig.BIT2ME_API_KEY,
        apiSecret: getRequestApiSecret() ?? appConfig.BIT2ME_API_SECRET,
        resolvedSessionToken,
        idempotencyKey: opts.idempotencyKey,
        sessionCookieName: appConfig.SESSION_COOKIE_NAME,
        preflightFlatParams,
    });

    try {
        logger.debug(`API Request: ${method} ${built.urlToSign}`);
        const response = await groupBulkhead.run(group, () => axios(built.requestConfig));
        logger.debug(`API Response: ${method} ${built.urlToSign} - Status ${response.status}`);
        circuitBreaker.recordSuccess();
        return response.data;
    } catch (error: unknown) {
        return handleBit2MeAxiosError(
            error,
            {
                method,
                urlToSign: built.urlToSign,
                group,
                circuitBreaker,
                effectiveRetries,
                attempt,
                baseDelay: appConfig.RETRY_BASE_DELAY,
                useSessionAuth: built.useSessionAuth,
                idempotencyKey: opts.idempotencyKey,
            },
            () =>
                bit2meRequest(method, endpoint, params, retries, timeoutOverride, sessionToken, {
                    ...opts,
                    attempt: attempt + 1,
                })
        );
    }
}
