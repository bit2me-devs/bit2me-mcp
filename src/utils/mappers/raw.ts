import { getConfig } from "../../config.js";

/**
 * Wraps a mapped response with optional raw_response field for debugging.
 * Only includes raw_response if BIT2ME_INCLUDE_RAW_RESPONSE=true in config.
 */
export function wrapResponseWithRaw<T>(mappedResponse: T, rawResponse?: unknown): T & { raw_response?: unknown } {
    if (!getConfig().INCLUDE_RAW_RESPONSE || rawResponse === undefined) {
        return mappedResponse as T & { raw_response?: unknown };
    }
    return {
        ...mappedResponse,
        raw_response: rawResponse,
    };
}
