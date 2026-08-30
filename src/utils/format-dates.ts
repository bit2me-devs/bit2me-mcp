import { ValidationError } from "./errors.js";

/**
 * Validates ISO 8601 date format
 * @param date - The date string to validate
 * @throws ValidationError if format is invalid
 */
export function validateISO8601(date: string): void {
    if (!date || typeof date !== "string") {
        throw new ValidationError("Date is required and must be a string", "date", date);
    }
    // eslint-disable-next-line security/detect-unsafe-regex -- Safe: no backtracking, fixed quantifiers
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!iso8601Regex.test(date)) {
        throw new ValidationError(
            `Invalid date format: ${date}. Expected ISO 8601 format (e.g., 2024-11-25T10:30:00.000Z)`,
            "date",
            date
        );
    }
}

/**
 * Validate that two ISO-8601 dates form a sensible inclusive range.
 *
 * Constraints enforced:
 *  - both inputs parse as valid Date instances
 *  - `start <= end`
 *  - the range doesn't exceed `maxRangeDays` (defaults to 366: one year)
 *  - neither date is more than 5 years in the future (sanity check)
 *
 * Either bound may be `undefined`, in which case it's skipped.
 */
export function validateDateRange(
    start: string | undefined,
    end: string | undefined,
    {
        maxRangeDays = 366,
        startName = "start_date",
        endName = "end_date",
    }: { maxRangeDays?: number; startName?: string; endName?: string } = {}
): void {
    const parse = (value: string | undefined, name: string): Date | undefined => {
        if (value === undefined) return undefined;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
            throw new ValidationError(`${name} is not a valid ISO-8601 date`, name, value);
        }
        return d;
    };

    const startDate = parse(start, startName);
    const endDate = parse(end, endName);

    const fiveYearsFromNow = Date.now() + 5 * 365 * 24 * 60 * 60 * 1000;
    if (startDate && startDate.getTime() > fiveYearsFromNow) {
        throw new ValidationError(`${startName} is too far in the future`, startName, start);
    }
    if (endDate && endDate.getTime() > fiveYearsFromNow) {
        throw new ValidationError(`${endName} is too far in the future`, endName, end);
    }

    if (startDate && endDate) {
        if (startDate.getTime() > endDate.getTime()) {
            throw new ValidationError(`${startName} must be before or equal to ${endName}`, startName, { start, end });
        }
        const diffDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
        if (diffDays > maxRangeDays) {
            throw new ValidationError(
                `Date range (${diffDays.toFixed(0)} days) exceeds the maximum of ${maxRangeDays} days`,
                "date_range",
                { start, end }
            );
        }
    }
}
