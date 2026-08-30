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
    maxLimit: number = 100,
    endpointName?: string
): number {
    if (limit === undefined) return 10; // Default limit
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
