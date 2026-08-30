/**
 * Translate an internal error into a safe JSON-RPC 2.0 error payload.
 *
 * Client-induced errors (validation, auth, rate limit, not found, bad
 * request) are echoed back verbatim because they carry actionable
 * information for the caller. Every other error category collapses to
 * a generic "Internal error" — the full message is still logged on the
 * server so operators can correlate by `correlationId`,
 * but it never leaves the process.
 */

import {
    ValidationError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    BadRequestError,
    Bit2MeAPIError,
} from "../utils/errors.js";

export function mapErrorToJsonRpc(err: unknown): { code: number; message: string } {
    if (err instanceof ValidationError) {
        return { code: -32602, message: err.message };
    }
    if (err instanceof AuthenticationError) {
        return { code: -32001, message: "Authentication failed" };
    }
    if (err instanceof RateLimitError) {
        return { code: -32029, message: "Rate limit exceeded" };
    }
    if (err instanceof NotFoundError) {
        return { code: -32004, message: "Resource not found" };
    }
    if (err instanceof BadRequestError) {
        return { code: -32602, message: err.message };
    }
    if (err instanceof Bit2MeAPIError) {
        return { code: -32000, message: "Upstream API error" };
    }
    return { code: -32000, message: "Internal error" };
}
