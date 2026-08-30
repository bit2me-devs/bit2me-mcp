/**
 * Bit2Me Pro public endpoints (/v2/trading/tickers, …) use BASE/QUOTE.
 * MCP schemas and normalizePair() use BASE-QUOTE for the LLM.
 */
export function toProApiPair(pair: string): string {
    return pair
        .toUpperCase()
        .trim()
        .replace(/[-_\s]+/g, "/");
}
