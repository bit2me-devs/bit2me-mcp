import crypto from "crypto";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { config, BIT2ME_GATEWAY_URL, getConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import {
    Bit2MeAPIError,
    RateLimitError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
} from "../utils/errors.js";
import { MAX_BACKOFF_DELAY, BACKOFF_JITTER_MS } from "../constants.js";

const BIT2ME_BASE_URL = BIT2ME_GATEWAY_URL;

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
 * Centralized wrapper for API calls.
 * Handles headers, signature, nonce, timeouts, retry logic with exponential backoff, and errors.
 */
export async function bit2meRequest(
    method: "GET" | "POST" | "DELETE",
    endpoint: string,
    params?: any,
    retries?: number
): Promise<any> {
    const appConfig = getConfig();
    const maxRetries = retries ?? appConfig.MAX_RETRIES;
    const baseDelay = appConfig.RETRY_BASE_DELAY;
    const timeout = appConfig.REQUEST_TIMEOUT;

    const apiKey = config.BIT2ME_API_KEY;
    const apiSecret = config.BIT2ME_API_SECRET;

    const nonce = Date.now();

    // 1. PREPARE URL TO SIGN (Endpoint + Query Params)
    let urlToSign = endpoint;

    const requestConfig: AxiosRequestConfig = {
        method,
        timeout,
        headers: {
            "x-api-key": apiKey,
            "x-nonce": nonce.toString(),
            "Content-Type": "application/json",
        },
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
        requestConfig.url = `${BIT2ME_BASE_URL}${urlToSign}`;
    } else if ((method === "POST" || method === "DELETE") && params) {
        // POST/DELETE CASE: Params go in the body
        requestConfig.url = `${BIT2ME_BASE_URL}${endpoint}`;

        // Stringify to ensure consistency in signature and sending
        const jsonBody = JSON.stringify(params);
        requestConfig.data = jsonBody;
        signatureData = params; // Pass original object or string depending on what generateSignature expects

        // Note: Your current generateSignature does JSON.stringify internally if it receives an object.
        // Ensure that if you pass 'params' (object), generateSignature stringifies it exactly as here.
    } else {
        // CASE WITHOUT PARAMETERS
        requestConfig.url = `${BIT2ME_BASE_URL}${endpoint}`;
    }

    // 3. GENERATE SIGNATURE
    // IMPORTANT: We pass 'urlToSign' which now includes the query string if it is a GET
    const signature = generateSignature(nonce, urlToSign, signatureData, apiSecret);

    if (requestConfig.headers) {
        requestConfig.headers["api-signature"] = signature;
    }

    try {
        logger.debug(`API Request: ${method} ${urlToSign}`);
        const response = await axios(requestConfig);
        logger.debug(`API Response: ${method} ${urlToSign} - Status ${response.status}`);
        return response.data;
    } catch (error: any) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const data: any = axiosError.response?.data;

        // Better error handling to see what Bit2Me actually returns
        const errorMsg = data?.message || JSON.stringify(data) || axiosError.message;

        // Log error with sanitized context
        logger.error(`Bit2Me API Error: ${method} ${urlToSign}`, {
            status,
            message: errorMsg,
            endpoint: urlToSign,
        });

        // Implement exponential backoff for rate limiting
        if (status === 429 && maxRetries > 0) {
            const retryAttempt = (retries ?? appConfig.MAX_RETRIES) - maxRetries;
            const delay = calculateBackoffDelay(retryAttempt, baseDelay);

            logger.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (${maxRetries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return bit2meRequest(method, endpoint, params, maxRetries - 1);
        }

        // Throw specific error types based on status code
        if (status === 429) {
            throw new RateLimitError(urlToSign);
        } else if (status === 401) {
            throw new AuthenticationError(urlToSign);
        } else if (status === 400) {
            throw new BadRequestError(urlToSign, errorMsg);
        } else if (status === 404) {
            throw new NotFoundError(urlToSign);
        } else {
            throw new Bit2MeAPIError(status || 500, errorMsg, urlToSign);
        }
    }
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
    } catch (e) {
        // Silent to avoid saturating logs if an exotic coin fails
        return 0;
    }
}

/**
 * Gets the full ticker for a pair.
 */
export async function getTicker(cryptoSymbol: string, fiatCurrency: string): Promise<any> {
    const response = await axios.get(`${BIT2ME_BASE_URL}/v3/currency/ticker/${cryptoSymbol}`, {
        params: { rateCurrency: fiatCurrency },
    });
    // Structure is { "EUR": { "BTC": [ { price: "..." } ] } }
    return response.data?.[fiatCurrency]?.[cryptoSymbol]?.[0];
}
