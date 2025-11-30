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
