/**
 * Custom error classes for the Bit2Me MCP server.
 *
 * The base `Bit2MeAPIError` distinguishes between the *internal* message
 * (full upstream detail, used in server logs) and the *public* one
 * (returned to the LLM/HTTP client). Public messages are deliberately
 * generic so we never leak upstream stack traces, response bodies, or
 * full URLs containing query parameters.
 */

/**
 * Strip the query string from an endpoint path. The query may carry
 * pocket ids, trade ids and other tenant-specific identifiers we do
 * not want surfaced through error messages.
 */
function redactEndpoint(endpoint: string): string {
    const idx = endpoint.indexOf("?");
    return idx >= 0 ? endpoint.slice(0, idx) : endpoint;
}

/**
 * Map a Bit2Me HTTP status code to a generic, client-safe message.
 * Tools / HTTP error mappers should always prefer this over the raw
 * upstream payload.
 */
function publicMessageFor(status: number): string {
    if (status === 400) return "Bad request";
    if (status === 401) return "Authentication failed";
    if (status === 403) return "Forbidden";
    if (status === 404) return "Resource not found";
    if (status === 429) return "Rate limited";
    if (status >= 500) return "Upstream temporarily unavailable";
    return "Upstream API error";
}

/**
 * Base error class for all Bit2Me API errors.
 *
 * The publicly-facing `message` (the one carried by `Error.prototype.
 * message` and visible to MCP clients) is always a generic short
 * description. The verbose upstream context is captured separately in
 * `internalMessage` and is intended only for server-side logs.
 */
export class Bit2MeAPIError extends Error {
    /** Path of the failing endpoint, with the query string stripped. */
    public readonly endpoint: string;
    /**
     * Verbose message containing the upstream detail. **Never** echo
     * this back to the LLM/HTTP client; use the regular `message`
     * field instead. Useful for server logs and `correlationId`
     * troubleshooting.
     */
    public readonly internalMessage: string;

    constructor(
        public status: number,
        internalMessage: string,
        endpoint: string
    ) {
        super(`Bit2Me API Error (${status}): ${publicMessageFor(status)}`);
        this.name = "Bit2MeAPIError";
        this.endpoint = redactEndpoint(endpoint);
        this.internalMessage = internalMessage;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error thrown when rate limit is exceeded (429)
 */
export class RateLimitError extends Bit2MeAPIError {
    constructor(
        endpoint: string,
        public retryAfter?: number
    ) {
        super(429, "Rate limit exceeded", endpoint);
        this.name = "RateLimitError";
    }
}

/**
 * Error thrown when authentication fails (401).
 *
 * The auth method that failed is preserved in `authMethod` for the
 * caller's diagnostics, but the exposed `message` stays generic
 * (`"Authentication failed"`) so a probing client cannot tell which
 * credential type was rejected.
 */
export class AuthenticationError extends Bit2MeAPIError {
    constructor(
        endpoint: string,
        public authMethod: "api_key" | "jwt" = "api_key"
    ) {
        const internal =
            authMethod === "jwt"
                ? "JWT session authentication failed. The token may be invalid, expired, or revoked."
                : "API Key authentication failed. Check BIT2ME_API_KEY / BIT2ME_API_SECRET.";
        super(401, internal, endpoint);
        this.name = "AuthenticationError";
    }
}

/**
 * Error thrown when response data validation fails.
 *
 * `ValidationError` originates inside this server (input validation,
 * shape checks) — it is *not* an upstream Bit2Me failure, so the
 * `message` here is allowed to be specific because the offending
 * value came from the caller in the first place.
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string,
        public receivedValue?: unknown
    ) {
        super(field ? `${message} (field: ${field})` : message);
        this.name = "ValidationError";
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error thrown for bad requests (400)
 */
export class BadRequestError extends Bit2MeAPIError {
    constructor(endpoint: string, internalMessage: string) {
        super(400, internalMessage, endpoint);
        this.name = "BadRequestError";
    }
}

/**
 * Error thrown for not found resources (404)
 * Note: Some Bit2Me endpoints return 404 instead of 401 for invalid credentials.
 */
export class NotFoundError extends Bit2MeAPIError {
    constructor(endpoint: string, resource?: string) {
        const baseMessage = resource ? `${resource} not found` : "Resource not found";
        const internal = `${baseMessage}. If unexpected, verify API credentials.`;
        super(404, internal, endpoint);
        this.name = "NotFoundError";
    }
}
