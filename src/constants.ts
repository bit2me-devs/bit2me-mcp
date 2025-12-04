/**
 * Shared constants for the Bit2Me MCP server
 * Centralizes magic numbers and configuration values
 */

// ============================================================================
// CACHE SETTINGS
// ============================================================================

/** Time-to-live for price cache in milliseconds (1 minute) */
export const PRICE_CACHE_TTL_MS = 60000;

// ============================================================================
// PAGINATION
// ============================================================================

/** Default limit for paginated responses */
export const DEFAULT_PAGINATION_LIMIT = 10;

/** Default offset for paginated responses */
export const DEFAULT_PAGINATION_OFFSET = 0;

/** Maximum limit for paginated responses */
export const MAX_PAGINATION_LIMIT = 100;

// ============================================================================
// PORTFOLIO
// ============================================================================

/** Minimum portfolio value to display (dust filter) */
export const MIN_DUST_VALUE = 0.01;

/** Minimum balance to consider a pocket non-empty */
export const MIN_POCKET_BALANCE = 0;

// ============================================================================
// API
// ============================================================================

/** Default request timeout in milliseconds */
export const DEFAULT_REQUEST_TIMEOUT = 30000;

/** Default maximum retries for failed requests */
export const DEFAULT_MAX_RETRIES = 3;

/** Base delay for exponential backoff in milliseconds */
export const DEFAULT_RETRY_BASE_DELAY = 1000;

/** Maximum delay for exponential backoff in milliseconds */
export const MAX_BACKOFF_DELAY = 10000;

/** Random jitter range for backoff in milliseconds */
export const BACKOFF_JITTER_MS = 100;

/** Timeout for heavy aggregation operations (60s) */
export const PORTFOLIO_REQUEST_TIMEOUT = 60000;

/** Timeout for standard market operations (10s) */
export const MARKET_REQUEST_TIMEOUT = 10000;

// ============================================================================
// VALIDATION
// ============================================================================

/** Maximum symbol length for filtering exotic coins */
export const MAX_SYMBOL_LENGTH = 5;

/** Testnet symbol marker */
export const TESTNET_MARKER = "TEST";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/** Default amount string for monetary values */
export const DEFAULT_AMOUNT = "0";

/** Default empty string */
export const DEFAULT_STRING = "";

/** Default empty array */
export const DEFAULT_ARRAY: never[] = [];
