import { DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT } from "../constants.js";
import { ValidationError } from "./errors.js";

/**
 * Validates and normalizes pagination limit
 * @param limit - The limit value to validate
 * @param maxLimit - Maximum allowed limit (default: MAX_PAGINATION_LIMIT)
 * @returns Validated limit value
 * @throws ValidationError if limit exceeds maximum
 */
export function validatePaginationLimit(
    limit: number | undefined,
    maxLimit: number = MAX_PAGINATION_LIMIT,
    endpointName?: string
): number {
    if (limit === undefined) return DEFAULT_PAGINATION_LIMIT;
    if (limit > maxLimit) {
        const context = endpointName ? ` for ${endpointName}` : "";
        throw new ValidationError(
            `Limit cannot exceed ${maxLimit}${context}. Requested: ${limit}, Maximum allowed: ${maxLimit}. Use pagination with offset to fetch more records.`,
            "limit",
            limit
        );
    }
    if (limit < 1) {
        throw new ValidationError("Limit must be at least 1", "limit", limit);
    }
    return limit;
}

/**
 * Validates and normalizes pagination offset
 * @param offset - The offset value to validate
 * @returns Validated offset value
 */
export function validatePaginationOffset(offset: number | undefined): number {
    if (!offset || offset < 0) return 0;
    return offset;
}
