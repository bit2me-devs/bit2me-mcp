/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Contextual Echo Response Utilities
 *
 * Implements the "Contextual Echoing" pattern: responses must be self-explanatory.
 * The model should not need to look back at the request to understand response data.
 *
 * This ensures:
 * 1. Robustness against defaults: explicit values for optional parameters
 * 2. Prevention of hallucinations in parallel calls: clear identifiers in responses
 * 3. Ease of reasoning: self-contained data for chain-of-thought
 */

import { getConfig } from "../config.js";

/**
 * Request context that will be echoed in the response
 */
export interface RequestContext {
    [key: string]: any;
}

/**
 * Metadata for paginated or filtered responses
 */
export interface ResponseMetadata {
    total_records?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
    [key: string]: any; // Allow additional metadata fields
}

/**
 * Contextual response structure
 */
export interface ContextualResponse<T> {
    request: RequestContext;
    result: T;
    metadata?: ResponseMetadata;
    raw_response?: unknown; // Only if INCLUDE_RAW_RESPONSE=true
}

/**
 * Options for building a contextual response
 */
export interface ContextualResponseOptions {
    request: RequestContext;
    result: any;
    metadata?: ResponseMetadata;
    rawResponse?: unknown;
}

/**
 * Builds a contextual response that echoes the request parameters.
 * This ensures responses are self-explanatory without needing to reference the original request.
 *
 * @param options - Response options including request context, result, optional metadata and raw response
 * @returns Contextual response with request echo, result, and optional metadata
 */
export function buildContextualResponse<T>(options: ContextualResponseOptions): ContextualResponse<T> {
    const config = getConfig();

    const response: ContextualResponse<T> = {
        request: options.request,
        result: options.result,
    };

    // Add metadata if provided
    if (options.metadata) {
        response.metadata = options.metadata;
    }

    // Add raw response only if configured
    if (config.INCLUDE_RAW_RESPONSE && options.rawResponse !== undefined) {
        response.raw_response = options.rawResponse;
    }

    return response;
}

/**
 * Builds a contextual response for simple (non-paginated) responses.
 *
 * @param request - Request context (normalized parameters)
 * @param result - Optimized result data
 * @param rawResponse - Optional raw API response
 * @returns Contextual response
 */
export function buildSimpleContextualResponse<T>(
    request: RequestContext,
    result: T,
    rawResponse?: unknown
): ContextualResponse<T> {
    return buildContextualResponse({
        request,
        result,
        rawResponse,
    });
}

/**
 * Builds a contextual response for paginated responses.
 *
 * @param request - Request context including pagination params
 * @param result - Array of results
 * @param metadata - Pagination metadata
 * @param rawResponse - Optional raw API response
 * @returns Contextual response with metadata
 */
export function buildPaginatedContextualResponse<T>(
    request: RequestContext,
    result: T[],
    metadata: ResponseMetadata,
    rawResponse?: unknown
): ContextualResponse<T[]> {
    return buildContextualResponse({
        request,
        result,
        metadata,
        rawResponse,
    });
}

/**
 * Builds a contextual response for filtered responses (with filter metadata).
 *
 * @param request - Request context including filters
 * @param result - Filtered results
 * @param metadata - Filter and pagination metadata
 * @param rawResponse - Optional raw API response
 * @returns Contextual response with filter metadata
 */
export function buildFilteredContextualResponse<T>(
    request: RequestContext,
    result: T | T[],
    metadata: ResponseMetadata,
    rawResponse?: unknown
): ContextualResponse<T | T[]> {
    return buildContextualResponse({
        request,
        result,
        metadata,
        rawResponse,
    });
}
