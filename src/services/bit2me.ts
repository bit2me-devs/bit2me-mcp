/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { getGatewayUrl, getConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import {
    Bit2MeAPIError,
    RateLimitError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
} from "../utils/errors.js";
import { MAX_BACKOFF_DELAY, BACKOFF_JITTER_MS } from "../constants.js";

// Gateway URL is resolved lazily to support runtime configuration
const getBaseUrl = () => getGatewayUrl();

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Generates signature for Bit2Me API following the official standard.
 * Message format: nonce:url:body (if exists) or nonce:url
 * Algorithm: HMAC-SHA512(SHA256(message))
 */
export function generateSignature(nonce: number, endpoint: string, data: any, secret: string): string {
    // 1. Build the message to sign
    const hasBody = !!data && Object.keys(data).length > 0;

    // The body must be stringified if it exists (if not already a string)
    const bodyString = hasBody ? (typeof data === "string" ? data : JSON.stringify(data)) : "";

    const message = hasBody ? `${nonce}:${endpoint}:${bodyString}` : `${nonce}:${endpoint}`;

    // 2. Double hash algorithm: SHA256 (binary) -> HMAC-SHA512 (base64)
    const hash = crypto.createHash("sha256").update(message).digest("binary");
    return crypto.createHmac("sha512", secret).update(hash, "binary").digest("base64");
}

import { rateLimiter } from "../utils/rate-limiter.js";
import { endpointRateLimiter } from "../utils/rate-limiter-config.js";
import { apiCircuitBreaker } from "../utils/circuit-breaker.js";
import { getCorrelationId, getSessionToken, getRequestApiKey, getRequestApiSecret } from "../utils/context.js";

// ============================================================================
// API REQUEST HANDLING
// ============================================================================

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(retryAttempt: number, baseDelay: number, maxDelay = MAX_BACKOFF_DELAY): number {
    const exponentialDelay = baseDelay * Math.pow(2, retryAttempt);
    const cappedDelay = Math.min(maxDelay, exponentialDelay);
    const jitter = Math.random() * BACKOFF_JITTER_MS;
    return cappedDelay + jitter;
}

/**
 * Monotonic nonce generator.
 *
 * Bit2Me requires the `x-nonce` header to be strictly increasing per API key.
 * Using `Date.now()` directly is not safe under burst load (e.g. the
 * portfolio aggregator launches 4 requests with `Promise.allSettled`); two
 * `Date.now()` calls in the same millisecond would emit the same nonce and
 * cause sporadic 401s. The counter below increments by 1 ms whenever the
 * wall clock has not advanced, guaranteeing strict monotony while staying
 * close to the real time.
 */
let lastNonce = 0;
export function nextNonce(): number {
    const now = Date.now();
    lastNonce = now > lastNonce ? now : lastNonce + 1;
    return lastNonce;
}

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
 * Handles headers, signature, nonce, timeouts, retry logic with exponential backoff, and errors.
 *
 * API VERSIONING NOTE:
 * Bit2Me API endpoints use different version prefixes (/v1, /v2, /v3).
 * There is no global API version. Each service/endpoint has its own version lifecycle.
 * - Wallet/Earn/Loan typically use v1 or v2
 * - Market data often uses v3
 * This wrapper is version-agnostic; the caller must provide the full path including version (e.g. "/v3/currency/ticker").
 *
 * AUTHENTICATION MODES:
 * - API Key mode (default): Uses x-api-key + signature headers
 * - Session mode: Uses JWT cookie for web-like authentication (when sessionToken is provided)
 *
 * RETRY POLICY:
 * - 429 (rate limit): retried with exponential backoff up to MAX_RETRIES.
 * - 5xx and connection errors: retried with exponential backoff for GETs;
 *   for POST/DELETE, only retried when an `idempotencyKey` was provided.
 */
export async function bit2meRequest<T = any>(
    method: "GET" | "POST" | "DELETE",
    endpoint: string,
    params?: any,
    retries?: number,
    timeoutOverride?: number,
    sessionToken?: string,
    options?: Bit2MeRequestOptions
): Promise<T> {
    const appConfig = getConfig();
    const opts: Bit2MeRequestOptions = options ?? {};

    const effectiveRetries = retries ?? opts.retries ?? appConfig.MAX_RETRIES;
    const baseDelay = appConfig.RETRY_BASE_DELAY;
    const timeout = timeoutOverride ?? opts.timeoutOverride ?? appConfig.REQUEST_TIMEOUT;
    const effectiveSessionToken = sessionToken ?? opts.sessionToken;
    const idempotencyKey = opts.idempotencyKey;
    const attempt = opts.attempt ?? 0;

    // Resolve session token: explicit parameter takes priority, fallback to context
    const resolvedSessionToken = effectiveSessionToken ?? getSessionToken();

    // Circuit Breaker: Check if circuit allows request
    if (!apiCircuitBreaker.canExecute()) {
        const circuitState = apiCircuitBreaker.getState();
        const stats = apiCircuitBreaker.getStats();
        logger.error("Circuit breaker is OPEN, request rejected", {
            correlationId: getCorrelationId(),
            endpoint,
            circuitState,
            stats,
        });
        throw new Bit2MeAPIError(
            503,
            `Service temporarily unavailable. Circuit breaker is ${circuitState}. Please try again later.`,
            endpoint
        );
    }

    // Rate Limiting: Wait for token before making request (endpoint-specific)
    // Use endpoint-specific rate limiter if available, fallback to global
    try {
        await endpointRateLimiter.waitForToken(endpoint);
    } catch {
        // Fallback to global rate limiter if endpoint-specific fails
        await rateLimiter.waitForToken();
    }

    // Per-request API credentials (HTTP multi-tenant transport) take
    // precedence over the global env-loaded keys (stdio single-tenant).
    const apiKey = getRequestApiKey() ?? appConfig.BIT2ME_API_KEY;
    const apiSecret = getRequestApiSecret() ?? appConfig.BIT2ME_API_SECRET;

    const nonce = nextNonce();

    // 1. PREPARE URL TO SIGN (Endpoint + Query Params)
    let urlToSign = endpoint;

    // Determine authentication mode: Session (cookie) or API Key (signature)
    const useSessionAuth = !!resolvedSessionToken;

    const baseHeaders: Record<string, string> = useSessionAuth
        ? {
              // Session mode: authenticate via JWT cookie (web-like)
              Cookie: `${getConfig().SESSION_COOKIE_NAME}=${resolvedSessionToken}`,
              "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Content-Type": "application/json",
          }
        : {
              // API Key mode: authenticate via signature
              "x-api-key": apiKey,
              "x-nonce": nonce.toString(),
              "Content-Type": "application/json",
          };

    if (idempotencyKey) {
        baseHeaders["Idempotency-Key"] = idempotencyKey;
    }

    const requestConfig: AxiosRequestConfig = {
        method,
        timeout,
        headers: baseHeaders,
    };

    let signatureData = undefined; // For body in POST/DELETE

    // 2. PARAMETER MANAGEMENT
    if (method === "GET" && params && Object.keys(params).length > 0) {
        // GET CASE: Convert params to string: "?key=val&key2=val2"
        // Use URLSearchParams to ensure standard order and encoding
        const queryString = new URLSearchParams(params).toString();
        urlToSign = `${endpoint}?${queryString}`;

        // We tell Axios to use the full URL we just built.
        // We do NOT use requestConfig.params to avoid Axios re-encoding differently than us.
        requestConfig.url = `${getBaseUrl()}${urlToSign}`;
    } else if ((method === "POST" || method === "DELETE") && params) {
        // POST/DELETE CASE: Params go in the body
        requestConfig.url = `${getBaseUrl()}${endpoint}`;

        // Stringify to ensure consistency in signature and sending
        const jsonBody = JSON.stringify(params);
        requestConfig.data = jsonBody;
        signatureData = params; // Pass original object or string depending on what generateSignature expects

        // Note: Your current generateSignature does JSON.stringify internally if it receives an object.
        // Ensure that if you pass 'params' (object), generateSignature stringifies it exactly as here.
    } else {
        // CASE WITHOUT PARAMETERS
        requestConfig.url = `${getBaseUrl()}${endpoint}`;
    }

    // 3. GENERATE SIGNATURE (only for API Key mode)
    // IMPORTANT: We pass 'urlToSign' which now includes the query string if it is a GET
    if (!useSessionAuth) {
        const signature = generateSignature(nonce, urlToSign, signatureData, apiSecret);
        if (requestConfig.headers) {
            requestConfig.headers["api-signature"] = signature;
        }
    }

    try {
        logger.debug(`API Request: ${method} ${urlToSign}`, {
            body: signatureData,
        });
        const response = await axios(requestConfig);
        logger.debug(`API Response: ${method} ${urlToSign} - Status ${response.status}`);

        // Record success in circuit breaker
        apiCircuitBreaker.recordSuccess();

        return response.data;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const data = axiosError.response?.data as any;

        // Better error handling to see what Bit2Me actually returns
        const errorMsg = data?.message || JSON.stringify(data) || axiosError.message;

        // Log error with minimal context - PII / response bodies stay at debug.
        logger.error(`Bit2Me API Error: ${method} ${urlToSign}`, {
            status,
            message: errorMsg,
            endpoint: urlToSign,
        });
        logger.debug(`Bit2Me API Error (full payload): ${method} ${urlToSign}`, {
            status,
            requestBody: signatureData,
            responseData: data,
        });

        // Record failure in circuit breaker ONLY for server errors (5xx) and connection failures
        // Client errors (4xx) are user mistakes, not service failures:
        // - 400: Bad request (invalid parameters)
        // - 401: Authentication failed (invalid API key or JWT)
        // - 403: Forbidden (insufficient permissions)
        // - 404: Not found (resource doesn't exist)
        // - 429: Rate limit (handled separately with retry)
        const isServerError = !!status && status >= 500;
        const isConnectionError = !status; // No status = connection/timeout error
        if (isServerError || isConnectionError) {
            apiCircuitBreaker.recordFailure();
        }

        const remainingRetries = effectiveRetries - attempt;

        const isRateLimited = status === 429;
        const isTransient = isRateLimited || isServerError || isConnectionError;

        // For POST/DELETE we only retry on 5xx/network when the caller passed
        // an Idempotency-Key. Otherwise the retry could create a duplicate
        // mutation server-side. 429 is always safe to retry (not yet executed).
        const isMutating = method === "POST" || method === "DELETE";
        const canRetryNonRateLimit = !isMutating || !!idempotencyKey;
        const shouldRetry =
            remainingRetries > 0 &&
            (isRateLimited || ((isServerError || isConnectionError) && canRetryNonRateLimit));

        if (shouldRetry) {
            const delay = calculateBackoffDelay(attempt, baseDelay);
            const reason = isRateLimited ? "rate limit" : isServerError ? `${status}` : "network";
            logger.warn(
                `Bit2Me request transient failure (${reason}). Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${effectiveRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return bit2meRequest(method, endpoint, params, retries, timeoutOverride, sessionToken, {
                ...opts,
                attempt: attempt + 1,
            });
        }

        if (isTransient && !shouldRetry && isMutating && !idempotencyKey) {
            logger.warn(
                `Bit2Me ${method} ${urlToSign} failed transiently (${status ?? "network"}) but was not retried because no Idempotency-Key was provided`
            );
        }

        // Throw specific error types based on status code
        if (status === 429) {
            throw new RateLimitError(urlToSign);
        } else if (status === 401) {
            // Provide specific error message based on authentication method used
            throw new AuthenticationError(urlToSign, useSessionAuth ? "jwt" : "api_key");
        } else if (status === 400) {
            throw new BadRequestError(urlToSign, errorMsg);
        } else if (status === 404) {
            throw new NotFoundError(urlToSign);
        } else {
            throw new Bit2MeAPIError(status || 500, errorMsg, urlToSign);
        }
    }
}

/**
 * Generate or extract an idempotency key for a write operation.
 *
 * Tools that mutate state (orders, withdrawals, transfers, ...) must call
 * this and pass the result down to `bit2meRequest({ idempotencyKey })` so
 * that an accidental retry of the same operation cannot result in a
 * duplicate execution upstream.
 *
 * If the caller supplied `idempotency_key` in the args we honour it (the
 * MCP client is expected to keep that value stable across retries of the
 * same logical action). Otherwise we synthesise a fresh UUID per call.
 */
export function resolveIdempotencyKey(args: { idempotency_key?: unknown } | undefined | null): string {
    if (args && typeof args === "object" && typeof args.idempotency_key === "string" && args.idempotency_key.length > 0) {
        return args.idempotency_key;
    }
    return crypto.randomUUID();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to get current market price (Ticker)
 * Used in portfolio valuation.
 */
export async function getMarketPrice(cryptoSymbol: string, fiatCurrency: string): Promise<number> {
    if (cryptoSymbol.toUpperCase() === fiatCurrency.toUpperCase()) return 1;

    // Filter strange symbols or 'LP' tokens that don't have a public ticker
    if (cryptoSymbol.length > 5 && !cryptoSymbol.includes("TEST")) return 0;

    try {
        const tickerData = await getTicker(cryptoSymbol, fiatCurrency);
        const priceData = tickerData?.price || 0;
        return parseFloat(priceData) || 0;
    } catch (error: any) {
        // Log error but don't throw to avoid saturating logs if an exotic coin fails
        logger.debug(`Failed to get price for ${cryptoSymbol}/${fiatCurrency}`, { error: error.message });
        return 0;
    }
}

/**
 * Gets the full ticker for a pair.
 *
 * Tickers are public market data, identical for every authenticated and
 * non-authenticated caller, so we cache the result for a short TTL to avoid
 * re-fetching prices when the portfolio aggregator computes valuations for
 * many symbols.
 */
export async function getTicker(cryptoSymbol: string, fiatCurrency: string): Promise<any> {
    const { cache, CacheCategory } = await import("../utils/cache.js");
    const cacheKey = `ticker:${cryptoSymbol.toUpperCase()}:${fiatCurrency.toUpperCase()}`;
    const cached = cache.get<any>(cacheKey);
    if (cached !== null) {
        return cached;
    }
    const response = await bit2meRequest("GET", `/v3/currency/ticker/${cryptoSymbol}`, {
        rateCurrency: fiatCurrency,
    });
    // Structure is { "EUR": { "BTC": [ { price: "..." } ] } }
    const ticker = response?.[fiatCurrency]?.[cryptoSymbol]?.[0];
    if (ticker) {
        cache.set(cacheKey, ticker, CacheCategory.MARKET_DATA);
    }
    return ticker;
}
