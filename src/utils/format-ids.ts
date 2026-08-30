import { ValidationError } from "./errors.js";

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
export { toProApiPair } from "./pair-api.js";

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
