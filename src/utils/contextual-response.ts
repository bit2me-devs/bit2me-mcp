/**
 * Contextual Echo: responses are self-explanatory without the original request.
 */

import { wrapResponseWithRaw } from "./mappers/raw.js";

export interface RequestContext {
    [key: string]: unknown;
}

export interface ResponseMetadata {
    total_records?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
    [key: string]: unknown;
}

export interface ContextualResponse<T> {
    request: RequestContext;
    result: T;
    metadata?: ResponseMetadata;
    raw_response?: unknown;
}

interface ContextualResponseOptions<T> {
    request: RequestContext;
    result: T;
    metadata?: ResponseMetadata;
    rawResponse?: unknown;
}

function buildContextualResponse<T>(options: ContextualResponseOptions<T>): ContextualResponse<T> {
    const response: ContextualResponse<T> = {
        request: options.request,
        result: options.result,
    };

    if (options.metadata) {
        response.metadata = options.metadata;
    }

    return wrapResponseWithRaw(response, options.rawResponse);
}

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
