import crypto from "crypto";
import { ValidationError } from "../utils/errors.js";

/**
 * Whitelist of bytes allowed inside a session cookie value. JWTs are
 * base64url + dots (`.`); extra characters are tolerated across upstream
 * cookie formats. Anything outside this set (`\r`, `\n`, `;`, spaces, ...)
 * would enable HTTP header injection / smuggling against the gateway.
 */
const COOKIE_VALUE_ALLOWED = /^[A-Za-z0-9._\-+/=]+$/;
const MAX_COOKIE_VALUE_BYTES = 4096;
const ENDPOINT_ALLOWED = /^\/[A-Za-z0-9._~/%+-]+$/;
const MAX_ENDPOINT_CHARS = 512;

/**
 * Throw `ValidationError` when a session token cannot be safely
 * embedded in a `Cookie:` header. Called immediately before I/O.
 */
export function assertSafeCookieValue(value: string): void {
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
 * Flatten params into `Record<string, string>` for `URLSearchParams`.
 * Rejects nested objects/arrays — they would serialise as `[object Object]`
 * and change the signature payload in ways the caller did not intend.
 */
/**
 * Path only (`/v1/wallet/pocket`). Rejects absolute URLs, query strings
 * and header-breaking bytes so `getGatewayUrl() + endpoint` cannot leave
 * the configured gateway.
 */
export function assertSafeEndpoint(endpoint: string): void {
    if (!endpoint || typeof endpoint !== "string") {
        throw new ValidationError("API endpoint must be a non-empty path", "endpoint");
    }
    if (endpoint.length > MAX_ENDPOINT_CHARS) {
        throw new ValidationError("API endpoint is too long", "endpoint");
    }
    if (!ENDPOINT_ALLOWED.test(endpoint)) {
        throw new ValidationError(
            "API endpoint must be a relative path starting with / (no URL, query or control bytes)",
            "endpoint"
        );
    }
}

export function flattenScalarParams(params: Record<string, unknown>): Record<string, string> {
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

/**
 * Bit2Me HMAC-SHA512(SHA256(message)). Message: nonce:url[:body].
 */
export function generateSignature(nonce: number, endpoint: string, data: unknown, secret: string): string {
    let bodyString = "";
    if (typeof data === "string") {
        bodyString = data;
    } else if (data && typeof data === "object") {
        bodyString = Object.keys(data).length > 0 ? JSON.stringify(data) : "";
    }
    const hasBody = bodyString.length > 0;
    const message = hasBody ? `${nonce}:${endpoint}:${bodyString}` : `${nonce}:${endpoint}`;
    const hash = crypto.createHash("sha256").update(message).digest("binary");
    return crypto.createHmac("sha512", secret).update(hash, "binary").digest("base64");
}

/**
 * Monotonic nonce for `x-nonce`. `Date.now()` is not safe under burst
 * load (same millisecond → 401). Increment by 1 ms when the clock has
 * not advanced.
 */
let lastNonce = 0;
export function nextNonce(): number {
    const now = Date.now();
    lastNonce = now > lastNonce ? now : lastNonce + 1;
    return lastNonce;
}
