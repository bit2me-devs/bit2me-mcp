import { ValidationError } from "./errors.js";

/**
 * Converts trading notation timeframe to API format for broker chart endpoint
 * Trading notation: "1h", "1d", "1w", "1M", "1y"
 * API format: "one-hour", "one-day", "one-week", "one-month", "one-year"
 * @param timeframe - Trading notation timeframe (e.g., "1h", "1d")
 * @returns API format timeframe (e.g., "one-hour", "one-day")
 * @throws ValidationError if timeframe is not supported
 */
export function convertBrokerTimeframe(timeframe: string): string {
    const timeframeMap: Record<string, string> = {
        "1h": "one-hour",
        "1d": "one-day",
        "1w": "one-week",
        "1M": "one-month",
        "1y": "one-year",
    };

    const normalized = timeframe.trim();
    const apiFormat = timeframeMap[normalized];

    if (!apiFormat) {
        throw new ValidationError(
            `Invalid timeframe: ${timeframe}. Supported values: 1h, 1d, 1w, 1M, 1y`,
            "timeframe",
            timeframe
        );
    }

    return apiFormat;
}

/**
 * Converts trading notation timeframe to Pro Trading API format
 * Trading notation: "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"
 * API format: "1", "5", "15", "30", "60", "240", "1440", "1D"
 * @param timeframe - Trading notation timeframe (e.g., "1h", "1d")
 * @returns API format timeframe (e.g., "60", "1D")
 * @throws ValidationError if timeframe is not supported
 */
export function convertProTimeframe(timeframe: string): string {
    const timeframeMap: Record<string, string> = {
        "1m": "1",
        "5m": "5",
        "15m": "15",
        "30m": "30",
        "1h": "60",
        "4h": "240",
        "1d": "1440", // 24 hours * 60 minutes
        "1w": "10080", // 7 days * 24 hours * 60 minutes
        "1M": "43200", // 30 days * 24 hours * 60 minutes
    };

    const normalized = timeframe.trim();
    const apiFormat = timeframeMap[normalized];

    if (!apiFormat) {
        throw new ValidationError(
            `Invalid timeframe: ${timeframe}. Supported values: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M`,
            "timeframe",
            timeframe
        );
    }

    return apiFormat;
}
