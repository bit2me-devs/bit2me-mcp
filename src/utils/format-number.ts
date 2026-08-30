/**
 * Smartly rounds a number based on its magnitude.
 * Rules:
 * - > 1: 2 decimals
 * - > 0.1: 4 decimals
 * - <= 0.1: 8 decimals
 */
export function smartRound(value: number): number {
    if (value === 0) return 0;
    const absValue = Math.abs(value);

    if (absValue >= 1) {
        return parseFloat(value.toFixed(2));
    }
    if (absValue >= 0.1) {
        return parseFloat(value.toFixed(4));
    }
    return parseFloat(value.toFixed(8));
}

/**
 * Formats a timestamp (number or ISO string) into both timestamp and date fields
 * @param timestamp - Unix timestamp (ms) or ISO 8601 string
 * @returns Object with both timestamp (number) and date (ISO string)
 */
export function formatTimestamp(timestamp: number | string | undefined): { timestamp: number; date: string } {
    if (!timestamp) {
        const now = Date.now();
        return {
            timestamp: now,
            date: new Date(now).toISOString(),
        };
    }

    const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;

    // Handle NaN or negative timestamps (invalid dates)
    if (isNaN(ts) || ts < 0) {
        return {
            timestamp: 0,
            date: "",
        };
    }

    return {
        timestamp: ts,
        date: new Date(ts).toISOString(),
    };
}
