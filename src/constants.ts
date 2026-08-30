/**
 * Shared constants for the Bit2Me MCP server.
 */

/** Default limit for paginated responses */
export const DEFAULT_PAGINATION_LIMIT = 10;

/** Maximum limit for paginated responses */
export const MAX_PAGINATION_LIMIT = 100;

/** Minimum portfolio value to display (dust filter) */
export const MIN_DUST_VALUE = 0.01;

/** Default request timeout in milliseconds */
export const DEFAULT_REQUEST_TIMEOUT = 30000;

/** Default maximum retries for failed requests */
export const DEFAULT_MAX_RETRIES = 3;

/** Base delay for exponential backoff in milliseconds */
export const DEFAULT_RETRY_BASE_DELAY = 1000;

/** Maximum delay for exponential backoff in milliseconds */
export const MAX_BACKOFF_DELAY = 10000;

/** Timeout for heavy aggregation operations (60s) */
export const PORTFOLIO_REQUEST_TIMEOUT = 60000;

/** Default amount string for monetary values */
export const DEFAULT_AMOUNT = "0";

/** Default empty string */
export const DEFAULT_STRING = "";

/** Default empty array */
export const DEFAULT_ARRAY: never[] = [];
