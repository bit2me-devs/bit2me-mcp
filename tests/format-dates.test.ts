import { describe, expect, it } from "vitest";
import { validateDateRange, validateISO8601 } from "../src/utils/format.js";
import { ValidationError } from "../src/utils/errors.js";

describe("validateISO8601", () => {
    it("rejects empty or non-string values", () => {
        expect(() => validateISO8601("")).toThrow(ValidationError);
        expect(() => validateISO8601(undefined as unknown as string)).toThrow(ValidationError);
    });
});

describe("validateDateRange", () => {
    it("allows omitted bounds", () => {
        expect(() => validateDateRange(undefined, undefined)).not.toThrow();
        expect(() => validateDateRange("2024-01-01T00:00:00.000Z", undefined)).not.toThrow();
        expect(() => validateDateRange(undefined, "2024-01-01T00:00:00.000Z")).not.toThrow();
    });

    it("rejects an unparseable bound", () => {
        expect(() => validateDateRange("not-a-date", undefined)).toThrow(/start_date is not a valid ISO-8601 date/);
    });

    it("rejects start after end", () => {
        expect(() => validateDateRange("2024-06-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z")).toThrow(
            /start_date must be before or equal to end_date/
        );
    });

    it("rejects a range longer than maxRangeDays", () => {
        expect(() => validateDateRange("2020-01-01T00:00:00.000Z", "2022-01-01T00:00:00.000Z")).toThrow(
            /exceeds the maximum of 366 days/
        );
    });

    it("rejects a bound more than five years in the future", () => {
        const far = new Date(Date.now() + 6 * 365 * 24 * 60 * 60 * 1000).toISOString();
        expect(() => validateDateRange(far, undefined)).toThrow(/start_date is too far in the future/);
    });

    it("accepts an inclusive range within the default year window", () => {
        expect(() => validateDateRange("2024-01-01T00:00:00.000Z", "2024-12-31T23:59:59.000Z")).not.toThrow();
    });
});
