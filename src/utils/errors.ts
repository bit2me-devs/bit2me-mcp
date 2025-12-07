/**
 * Custom error classes for Bit2Me MCP server
 * Provides specific error types for different failure scenarios
 */

/**
 * Base error class for all Bit2Me API errors
 */
export class Bit2MeAPIError extends Error {
    constructor(
        public status: number,
        message: string,
        public endpoint: string
    ) {
        super(`Bit2Me API Error (${status}): ${message}`);
        this.name = "Bit2MeAPIError";
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
 * Error thrown when authentication fails (401)
 */
export class AuthenticationError extends Bit2MeAPIError {
    constructor(
        endpoint: string,
        public authMethod: "api_key" | "jwt" = "api_key"
    ) {
        const message =
            authMethod === "jwt"
                ? "JWT session authentication failed. The token may be invalid, expired, or revoked. Please provide a valid session token."
                : "API Key authentication failed. Please check your BIT2ME_API_KEY and BIT2ME_API_SECRET configuration.";
        super(401, message, endpoint);
        this.name = "AuthenticationError";
    }
}

/**
 * Error thrown when response data validation fails
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
    constructor(endpoint: string, message: string) {
        super(400, message, endpoint);
        this.name = "BadRequestError";
    }
}

/**
 * Error thrown for not found resources (404)
 */
export class NotFoundError extends Bit2MeAPIError {
    constructor(endpoint: string, resource?: string) {
        const message = resource ? `${resource} not found` : "Resource not found";
        super(404, message, endpoint);
        this.name = "NotFoundError";
    }
}
