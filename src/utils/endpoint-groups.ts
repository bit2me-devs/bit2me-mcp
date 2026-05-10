/**
 * Endpoint grouping for resilience primitives.
 *
 * Maps a Bit2Me API path (`/v1/loan/orders`, `/v3/currency/ticker/BTC`, ...) to
 * a coarse-grained `EndpointGroup` such as `loan`, `market_data`, `wallet`.
 * The classification is the single source of truth used by:
 *
 *  - Per-group circuit breakers (`utils/circuit-breaker.ts`).
 *  - Per-group bulkheads / concurrency limiters (`utils/bulkhead.ts`).
 *  - Per-group rate limiters (`utils/rate-limiter-config.ts`).
 *  - Per-group Prometheus metrics (`utils/metrics.ts`).
 *
 * Keeping grouping centralised here ensures the three primitives never
 * disagree about which slice of the API is failing/saturated.
 *
 * Trade-off: a single endpoint can only belong to one group. The mapping
 * is deliberately coarse so that operational dashboards stay readable.
 */

/**
 * Closed enumeration of operational domains. New groups should be added
 * sparingly; prefer reusing an existing group when an endpoint has the
 * same failure-blast-radius semantics as an existing one.
 */
export type EndpointGroup = "market_data" | "wallet" | "trading" | "earn" | "loan" | "account" | "default";

interface PrefixRule {
    readonly prefix: string;
    readonly group: EndpointGroup;
}

/**
 * Ordered list: more specific prefixes MUST appear before broader ones
 * when there is overlap. With the current Bit2Me surface there is no
 * overlap (each prefix is disjoint) but the iteration order is fixed so
 * future additions can rely on first-match semantics.
 */
const RULES: readonly PrefixRule[] = [
    { prefix: "/v3/currency/ticker", group: "market_data" },
    { prefix: "/v3/currency/chart", group: "market_data" },
    { prefix: "/v1/currency/rate", group: "market_data" },
    { prefix: "/v2/currency/assets", group: "market_data" },
    { prefix: "/v1/currency", group: "market_data" },
    { prefix: "/v3/currency", group: "market_data" },

    { prefix: "/v1/wallet", group: "wallet" },
    { prefix: "/v2/wallet", group: "wallet" },

    { prefix: "/v1/trading", group: "trading" },
    { prefix: "/v2/trading", group: "trading" },

    { prefix: "/v1/earn", group: "earn" },
    { prefix: "/v2/earn", group: "earn" },

    { prefix: "/v1/loan", group: "loan" },
    { prefix: "/v2/loan", group: "loan" },

    { prefix: "/v1/account", group: "account" },
    { prefix: "/v2/account", group: "account" },
];

/**
 * Classify a request endpoint into one of the operational groups.
 *
 * Returns `"default"` when no rule matches, which acts as a catch-all
 * bucket that still benefits from circuit breaker / bulkhead protection
 * but does not pollute the per-group dashboards.
 */
export function endpointGroup(endpoint: string): EndpointGroup {
    if (!endpoint) return "default";
    for (const rule of RULES) {
        if (endpoint.startsWith(rule.prefix)) return rule.group;
    }
    return "default";
}

/**
 * Enumerate every group declared in the table. Useful for pre-warming
 * gauges or rendering metric series even when a group has not seen
 * traffic yet.
 */
export function allEndpointGroups(): readonly EndpointGroup[] {
    return ["market_data", "wallet", "trading", "earn", "loan", "account", "default"];
}
