/**
 * Unit tests for the endpoint grouping helper. The helper is the single
 * source of truth used by the per-group circuit breaker, bulkhead and
 * metrics primitives, so any drift here would silently break dashboards
 * and the resilience boundaries they protect.
 */

import { describe, it, expect } from "vitest";
import { allEndpointGroups, endpointGroup } from "../src/utils/endpoint-groups.js";

describe("endpointGroup", () => {
    it.each([
        ["/v3/currency/ticker/BTC", "market_data"],
        ["/v3/currency/chart/ETH", "market_data"],
        ["/v1/currency/rate", "market_data"],
        ["/v2/currency/assets", "market_data"],
        ["/v2/currency/assets/BTC", "market_data"],
        ["/v1/wallet/pocket", "wallet"],
        ["/v2/wallet/transaction", "wallet"],
        ["/v1/wallet/transaction/abc", "wallet"],
        ["/v1/trading/order", "trading"],
        ["/v1/trading/wallet/balance", "trading"],
        ["/v1/earn", "earn"],
        ["/v1/earn/wallets", "earn"],
        ["/v2/earn/wallets", "earn"],
        ["/v1/loan", "loan"],
        ["/v1/loan/orders", "loan"],
        ["/v1/account", "account"],
        ["/v2/account", "account"],
    ] as const)("classifies %s as %s", (endpoint, expected) => {
        expect(endpointGroup(endpoint)).toBe(expected);
    });

    it("falls back to default for unknown endpoints", () => {
        expect(endpointGroup("/v9/unknown/path")).toBe("default");
        expect(endpointGroup("/healthz")).toBe("default");
    });

    it("handles empty input gracefully", () => {
        expect(endpointGroup("")).toBe("default");
    });

    it("first-match semantics: more specific prefixes win when listed first", () => {
        // The table puts /v3/currency/ticker before the broad /v3/currency
        // catch-all so explicit market_data classifications cannot regress.
        expect(endpointGroup("/v3/currency/ticker/BTC")).toBe("market_data");
        expect(endpointGroup("/v3/currency/anything-else")).toBe("market_data");
    });

    it("allEndpointGroups exposes every declared group exactly once", () => {
        const groups = allEndpointGroups();
        expect(new Set(groups).size).toBe(groups.length);
        expect(groups).toContain("default");
        expect(groups).toContain("market_data");
        expect(groups).toContain("trading");
    });
});
