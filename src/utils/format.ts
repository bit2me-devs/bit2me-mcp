import { ValidationError } from "./errors.js";

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
 * Normalizes symbol, pair, currency, or fiat parameter to uppercase
 * @param value - The value to normalize
 * @returns Uppercase trimmed value
 */
export function normalizeSymbol(value: string | undefined): string {
    if (!value) return "";
    return value.toUpperCase().trim();
}

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

/**
 * Normalizes pair format by replacing common separators with -
 * @param pair - The pair to normalize (e.g., "BTC/EUR", "BTC_EUR", "BTC-EUR")
 * @returns Normalized pair with - separator (e.g., "BTC-USD")
 */
export function normalizePair(pair: string): string {
    if (!pair) return "";
    return pair
        .toUpperCase()
        .trim()
        .replace(/[/_\s]+/g, "-");
}

/**
 * Normalizes pair format in responses (same as normalizePair but for response mapping)
 * @param pair - The pair to normalize
 * @returns Normalized pair with - separator in uppercase (e.g., "BTC-USD")
 */
export function normalizePairResponse(pair: string): string {
    if (!pair) return "";
    return pair
        .toUpperCase()
        .trim()
        .replace(/[/_\s]+/g, "-");
}

/**
 * Validates pair format (SYMBOL-QUOTE)
 * @param pair - The pair to validate (e.g., "BTC-USD", "BTC/EUR", "BTC_EUR")
 * @throws ValidationError if format is invalid
 */
export function validatePair(pair: string): void {
    if (!pair || typeof pair !== "string") {
        throw new ValidationError("Pair is required and must be a string", "pair", pair);
    }
    const normalized = normalizePair(pair);
    if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(normalized)) {
        throw new ValidationError(
            `Invalid pair format: ${pair}. Expected format: SYMBOL-QUOTE (e.g., BTC-USD, BTC-EUR)`,
            "pair",
            pair
        );
    }
}

/**
 * Validates UUID format
 * @param id - The UUID to validate
 * @param name - Name of the parameter for error messages
 * @throws ValidationError if format is invalid
 */
export function validateUUID(id: string, name: string = "id"): void {
    if (!id || typeof id !== "string") {
        throw new ValidationError(`${name} is required and must be a string`, name, id);
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new ValidationError(
            `Invalid ${name} format: ${id}. Expected UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)`,
            name,
            id
        );
    }
}

/**
 * Validates ISO 8601 date format
 * @param date - The date string to validate
 * @throws ValidationError if format is invalid
 */
export function validateISO8601(date: string): void {
    if (!date || typeof date !== "string") {
        throw new ValidationError("Date is required and must be a string", "date", date);
    }
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
 * Validates symbol format (cryptocurrency code)
 * @param symbol - The symbol to validate (e.g., "BTC", "ETH")
 * @throws ValidationError if format is invalid
 */
export function validateSymbol(symbol: string): void {
    if (!symbol || typeof symbol !== "string") {
        throw new ValidationError("Symbol is required and must be a string", "symbol", symbol);
    }
    const normalized = normalizeSymbol(symbol);
    if (!/^[A-Z0-9]{1,10}$/.test(normalized)) {
        throw new ValidationError(
            `Invalid symbol format: ${symbol}. Expected 1-10 alphanumeric characters (e.g., BTC, ETH)`,
            "symbol",
            symbol
        );
    }
}

/**
 * Validates fiat currency format
 * @param fiat - The fiat currency to validate (e.g., "EUR", "USD")
 * @throws ValidationError if format is invalid
 */
export function validateFiat(fiat: string): void {
    if (!fiat || typeof fiat !== "string") {
        throw new ValidationError("Fiat currency is required and must be a string", "fiat", fiat);
    }
    const normalized = normalizeSymbol(fiat);
    const validFiats = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY", "SEK", "NOK", "DKK", "PLN", "BRL"];
    if (!validFiats.includes(normalized)) {
        throw new ValidationError(
            `Invalid fiat currency: ${fiat}. Expected one of: ${validFiats.join(", ")}`,
            "fiat",
            fiat
        );
    }
}

/**
 * Validates amount format (positive number as string)
 * @param amount - The amount to validate
 * @param name - Name of the parameter for error messages
 * @throws ValidationError if format is invalid
 */
export function validateAmount(amount: string | number, name: string = "amount"): void {
    if (amount === undefined || amount === null) {
        throw new ValidationError(`${name} is required`, name, amount);
    }
    const amountStr = typeof amount === "number" ? amount.toString() : amount;
    if (typeof amountStr !== "string" || amountStr.trim() === "") {
        throw new ValidationError(`${name} must be a non-empty string`, name, amount);
    }
    const numValue = parseFloat(amountStr);
    if (isNaN(numValue) || numValue < 0) {
        throw new ValidationError(`${name} must be a valid positive number`, name, amount);
    }
}

/**
 * Normalizes status values to a controlled vocabulary
 * @param status - Raw status string from API
 * @returns Normalized lowercase status
 */
export function normalizeStatus(status: string | undefined): string {
    if (!status) return "unknown";

    const normalized = status.toLowerCase().trim();

    // Map common variations to standard values
    const statusMap: Record<string, string> = {
        // Active states
        active: "active",
        enabled: "active",
        open: "active",
        // Pending states
        pending: "pending",
        processing: "pending",
        waiting: "pending",
        in_progress: "pending",
        inprogress: "pending",
        // Completed states
        completed: "completed",
        complete: "completed",
        done: "completed",
        success: "completed",
        successful: "completed",
        filled: "completed",
        executed: "completed",
        // Failed states
        failed: "failed",
        failure: "failed",
        error: "failed",
        rejected: "failed",
        // Cancelled states
        cancelled: "cancelled",
        canceled: "cancelled",
        cancel: "cancelled",
        // Expired states
        expired: "expired",
        // Closed states
        closed: "closed",
        // Partial states
        partial: "partial",
        partially_filled: "partial",
    };

    return statusMap[normalized] || normalized;
}

/**
 * Normalizes network identifiers to lowercase snake_case
 * @param network - Raw network string from API
 * @returns Normalized network identifier
 */
export function normalizeNetwork(network: string | undefined): string {
    if (!network) return "";

    // Convert to lowercase and replace spaces/hyphens with underscores
    return network
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_");
}

/**
 * Normalizes movement type to controlled vocabulary
 * @param type - Raw type string from API
 * @returns Normalized movement type
 */
export function normalizeMovementType(type: string | undefined): string {
    if (!type) return "other";

    const normalized = type.toLowerCase().trim();

    const typeMap: Record<string, string> = {
        deposit: "deposit",
        deposits: "deposit",
        withdrawal: "withdrawal",
        withdraw: "withdrawal",
        withdrawals: "withdrawal",
        swap: "swap",
        exchange: "swap",
        convert: "swap",
        purchase: "purchase",
        buy: "purchase",
        transfer: "transfer",
        send: "transfer",
        receive: "transfer",
        fee: "fee",
        commission: "fee",
        reward: "reward",
        interest: "interest",
        payment: "payment",
        guarantee_change: "guarantee_change",
        liquidation: "liquidation",
        "discount-funds": "discount-funds",
        "discount-rewards": "discount-rewards",
    };

    return typeMap[normalized] || "other";
}

/**
 * Normalizes loan movement type to controlled vocabulary
 * @param type - Raw type string from API
 * @returns Normalized loan movement type
 */
export function normalizeLoanMovementType(type: string | undefined): string {
    if (!type) return "other";

    const normalized = type.toLowerCase().trim();

    const typeMap: Record<string, string> = {
        payment: "payment",
        repayment: "payment",
        payback: "payment",
        interest: "interest",
        interest_charge: "interest",
        guarantee_change: "guarantee_change",
        collateral_change: "guarantee_change",
        liquidation: "liquidation",
        margin_call: "liquidation",
    };

    return typeMap[normalized] || "other";
}
