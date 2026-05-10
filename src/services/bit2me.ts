/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { getGatewayUrl, getConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import {
    Bit2MeAPIError,
    RateLimitError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    ValidationError,
} from "../utils/errors.js";
import { MAX_BACKOFF_DELAY } from "../constants.js";

/**
 * Identify outbound traffic with the project's User-Agent. The previous
 * implementation impersonated a Chrome browser — that has TOS and
 * fraud-detection implications and obscures legitimate traffic in
 * upstream telemetry. We instead advertise the package name, version
 * and homepage so Bit2Me can profile the integration accurately.
 */
const USER_AGENT = (() => {
    try {
        const here = path.dirname(url.fileURLToPath(import.meta.url));
        const pkg = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "package.json"), "utf-8")) as {
            version?: string;
        };
        return `bit2me-mcp/${pkg.version ?? "unknown"} (+https://mcp.bit2me.com)`;
    } catch {
        return "bit2me-mcp/unknown (+https://mcp.bit2me.com)";
    }
})();

/**
 * Maximum size (bytes) of a single response from the Bit2Me API. We
 * cap both the response and the outbound body to prevent a malicious
 * or buggy upstream from forcing this process to allocate unbounded
 * memory.
 */
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = 5 * 1024 * 1024;

/**
 * Whitelist of bytes allowed to appear inside the value of a session
 * cookie. JWTs are base64url + dots (`.`); a few extra characters are
 * tolerated to keep the validator forgiving across upstream cookie
 * formats. Anything outside this set (`\r`, `\n`, `;`, spaces, ...)
 * would enable HTTP header injection / smuggling against the gateway.
 */
const COOKIE_VALUE_ALLOWED = /^[A-Za-z0-9._\-+/=]+$/;
const MAX_COOKIE_VALUE_BYTES = 4096;

/**
 * Throw `ValidationError` when a session token cannot be safely
 * embedded in a `Cookie:` header. Called immediately before
 * constructing the outgoing request.
 */
function assertSafeCookieValue(value: string): void {
    if (!value || typeof value !== "string") {
        throw new ValidationError("Session token must be a non-empty string", "sessionToken");
    }
    if (Buffer.byteLength(value, "utf8") > MAX_COOKIE_VALUE_BYTES) {
        throw new ValidationError("Session token is too large", "sessionToken");
    }
    if (!COOKIE_VALUE_ALLOWED.test(value)) {
        throw new ValidationError(
            "Session token contains characters that are not safe inside a Cookie header",
            "sessionToken"
        );
    }
}

/**
 * Convert a free-form params object into a flat `Record<string, string>`
 * suitable for `URLSearchParams`. Rejects nested objects/arrays
 * because they would silently serialise as `[object Object]` and
 * either break the upstream API or, worse, change the signature
 * payload in ways the caller did not intend.
 */
function flattenScalarParams(params: Record<string, unknown>): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (typeof value === "string") {
            flat[key] = value;
            continue;
        }
        if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
            flat[key] = String(value);
            continue;
        }
        throw new ValidationError(
            `Query parameter "${key}" must be a string, number or boolean (got ${typeof value})`,
            key,
            value
        );
    }
    return flat;
}

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
import { getCircuitBreaker } from "../utils/circuit-breaker.js";
import { endpointGroup } from "../utils/endpoint-groups.js";
import { groupBulkhead, tenantBulkhead } from "../utils/bulkhead.js";
import { metricsCollector } from "../utils/metrics.js";
import {
    getCorrelationId,
    getSessionToken,
    getRequestApiKey,
    getRequestApiSecret,
    getTenantId,
} from "../utils/context.js";

// ============================================================================
// API REQUEST HANDLING
// ============================================================================

/**
 * Calculate exponential backoff delay using the AWS "full jitter"
 * recipe: pick a uniformly random value in `[0, cappedDelay]` instead
 * of `cappedDelay + small_jitter`.
 *
 * Full jitter is provably better than additive jitter at preventing
 * thundering-herd retry storms after a synchronous outage recovers
 * (see "Exponential Backoff and Jitter" — AWS Architecture Blog).
 *
 * Trade-off: individual retries can land sooner than `cappedDelay`,
 * but the *expected* delay is `cappedDelay / 2`, which is normally
 * preferable for latency-sensitive workloads.
 */
function calculateBackoffDelay(retryAttempt: number, baseDelay: number, maxDelay = MAX_BACKOFF_DELAY): number {
    const exponentialDelay = baseDelay * Math.pow(2, retryAttempt);
    const cappedDelay = Math.min(maxDelay, exponentialDelay);
    return Math.random() * cappedDelay;
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
    const opts: Bit2MeRequestOptions = options ?? {};
    const effectiveSessionToken = sessionToken ?? opts.sessionToken;
    const idempotencyKey = opts.idempotencyKey;
    const attempt = opts.attempt ?? 0;

    // Resolve session token: explicit parameter takes priority, fallback to context
    const resolvedSessionToken = effectiveSessionToken ?? getSessionToken();

    // --- INPUT VALIDATION (fail fast, before any I/O or config load) ---
    //
    // We validate caller-controlled input BEFORE invoking getConfig(),
    // acquiring rate-limit tokens, or touching the circuit breaker, for
    // two reasons:
    //   1. Security: an attacker sending a malformed session token
    //      should not be able to consume rate-limit tokens, flip
    //      breaker state, or otherwise affect shared resilience
    //      counters before being rejected. Bouncing the request at
    //      the earliest stage closes that mini-amplification gap.
    //   2. Determinism in environments without API credentials: tests
    //      and the HTTP transport without fallback creds rely on the
    //      function rejecting a bad session token even when
    //      getConfig() would itself throw. Putting the cookie check
    //      first decouples both error paths.
    if (resolvedSessionToken !== undefined) {
        assertSafeCookieValue(resolvedSessionToken);
    }
    let preflightFlatParams: Record<string, string> | undefined;
    if (method === "GET" && params && Object.keys(params).length > 0) {
        // We flatten here purely to surface ValidationError for nested
        // shapes before any config load. The flattened map is reused
        // below to avoid double work.
        preflightFlatParams = flattenScalarParams(params);
    }

    const appConfig = getConfig();
    const effectiveRetries = retries ?? opts.retries ?? appConfig.MAX_RETRIES;
    const baseDelay = appConfig.RETRY_BASE_DELAY;
    const timeout = timeoutOverride ?? opts.timeoutOverride ?? appConfig.REQUEST_TIMEOUT;

    // Resolve tenant id and endpoint group once and reuse them for the
    // breaker, the outbound rate limiter and the success/failure
    // recording calls. The breaker is segmented along two axes:
    //  - by endpoint group (loan/trading/wallet/...) so a sustained
    //    failure in one domain cannot trip every other domain.
    //  - by tenant when one is in scope, so one noisy tenant cannot
    //    open the breaker for the rest.
    // Stdio callers (no tenant id) share the per-group breaker.
    const tenantId = getTenantId();
    const group = endpointGroup(endpoint);
    const circuitBreaker = getCircuitBreaker(group, tenantId);

    // Circuit Breaker: Check if circuit allows request
    if (!circuitBreaker.canExecute()) {
        const circuitState = circuitBreaker.getState();
        const stats = circuitBreaker.getStats();
        logger.error("Circuit breaker is OPEN, request rejected", {
            correlationId: getCorrelationId(),
            tenantId,
            group,
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

    // Rate Limiting: Wait for token before making request (endpoint-specific,
    // partitioned per tenant when available so that one tenant's burst
    // cannot starve another tenant's outbound traffic).
    try {
        await endpointRateLimiter.waitForToken(endpoint, tenantId);
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

    let baseHeaders: Record<string, string>;
    if (useSessionAuth) {
        // Session mode: authenticate via JWT cookie (web-like). The
        // token has already been validated against CRLF / smuggling
        // characters at the top of the function (pre-flight check); we
        // simply embed it here.
        baseHeaders = {
            Cookie: `${appConfig.SESSION_COOKIE_NAME}=${resolvedSessionToken}`,
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
        };
    } else {
        // API Key mode: authenticate via signature
        baseHeaders = {
            "x-api-key": apiKey,
            "x-nonce": nonce.toString(),
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        };
    }

    if (idempotencyKey) {
        baseHeaders["Idempotency-Key"] = idempotencyKey;
    }

    const requestConfig: AxiosRequestConfig = {
        method,
        timeout,
        headers: baseHeaders,
        // Cap the response body so a misbehaving upstream cannot
        // exhaust the heap. Match the outbound limit so attackers
        // cannot pivot via mirrored payloads either.
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_REQUEST_BYTES,
    };

    let signatureData = undefined; // For body in POST/DELETE

    // 2. PARAMETER MANAGEMENT
    if (method === "GET" && params && Object.keys(params).length > 0) {
        // GET CASE: Convert params to string: "?key=val&key2=val2".
        // Nested values were already rejected by the pre-flight check;
        // reuse the flattened map produced there.
        const flat = preflightFlatParams ?? flattenScalarParams(params);
        const queryString = new URLSearchParams(flat).toString();
        urlToSign = `${endpoint}?${queryString}`;

        // We tell Axios to use the full URL we just built.
        // We do NOT use requestConfig.params to avoid Axios re-encoding differently than us.
        requestConfig.url = `${getBaseUrl()}${urlToSign}`;
    } else if ((method === "POST" || method === "DELETE") && params) {
        // POST/DELETE CASE: Params go in the body. We send the
        // serialised JSON to axios and pass the raw object to
        // `generateSignature`; `generateSignature` re-stringifies
        // internally with the same Node `JSON.stringify` semantics, so
        // the signed payload matches the bytes Bit2Me will see on the
        // wire byte-for-byte.
        requestConfig.url = `${getBaseUrl()}${endpoint}`;
        const jsonBody = JSON.stringify(params);
        requestConfig.data = jsonBody;
        signatureData = params;
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
        // Bulkhead: cap concurrent outbound calls per endpoint group AND
        // per tenant so that one noisy domain or tenant cannot exhaust
        // the socket pool used by the rest of the workload.
        const response = await tenantBulkhead.run(tenantId, () => groupBulkhead.run(group, () => axios(requestConfig)));
        logger.debug(`API Response: ${method} ${urlToSign} - Status ${response.status}`);

        // Record success in circuit breaker (per-tenant when available)
        circuitBreaker.recordSuccess();

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
            circuitBreaker.recordFailure();
            metricsCollector.recordCircuitFailure(group);
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
            remainingRetries > 0 && (isRateLimited || ((isServerError || isConnectionError) && canRetryNonRateLimit));

        if (shouldRetry) {
            const delay = calculateBackoffDelay(attempt, baseDelay);
            const reason = isRateLimited ? "rate limit" : isServerError ? `${status}` : "network";
            const metricReason: "rate_limit" | "server_error" | "network" = isRateLimited
                ? "rate_limit"
                : isServerError
                  ? "server_error"
                  : "network";
            metricsCollector.recordRetry(metricReason);
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
    if (
        args &&
        typeof args === "object" &&
        typeof args.idempotency_key === "string" &&
        args.idempotency_key.length > 0
    ) {
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
