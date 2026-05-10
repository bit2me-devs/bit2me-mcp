/**
 * Health check utilities for the Bit2Me MCP server.
 *
 * Scope: this server is **not** responsible for monitoring the upstream
 * Bit2Me API. Health reporting is purely local and reflects the state
 * of this process: configuration loaded, uptime, package version and
 * the resilience surface (circuit breakers, rate limiter, cache).
 *
 * Rationale:
 *  - Probing `${gateway}/alive` from the health endpoint amplifies any
 *    public hit into outbound traffic against Bit2Me, which is a small
 *    SSRF/abuse vector.
 *  - Probing `/v1/account` from the health endpoint requires the global
 *    process credentials and converts a public health probe into an
 *    authenticated upstream call. Whether Bit2Me works is the
 *    responsibility of the Bit2Me platform; if it fails, real tool
 *    invocations will detect it through the circuit breaker.
 *
 * The shape exposed here is consumed by:
 *  - The MCP `general_health` tool (returns the full snapshot to the
 *    LLM/client).
 *  - The HTTP transport, which exposes:
 *      * `GET /livez` and `GET /readyz` (public, minimal, no runtime
 *        details).
 *      * `GET /health` (authenticated, full snapshot incl. `runtime`).
 */

import { logger } from "./logger.js";
import { apiCircuitBreaker, CircuitState, getGroupCircuitBreakerStats } from "./circuit-breaker.js";
import { getCorrelationId } from "./context.js";
import { cache } from "./cache.js";
import { endpointRateLimiter } from "./rate-limiter-config.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Resolve the package version once at module load. Reading
 * `process.env.npm_package_version` only works when the binary is
 * launched through pnpm/npm scripts; for globally-installed CLIs we
 * have to walk up to `package.json`.
 */
const PACKAGE_VERSION = (() => {
    if (process.env.npm_package_version) return process.env.npm_package_version;
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        // src/utils/ at runtime becomes build/utils/, so package.json is
        // two levels up either way.
        const pkgPath = join(here, "..", "..", "package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
        return pkg.version ?? "unknown";
    } catch {
        return "unknown";
    }
})();

export type ServiceStatus = "ok" | "degraded";

export interface HealthStatus {
    status: ServiceStatus;
    timestamp: string;
    version: string;
    uptime_seconds: number;
    components: {
        circuit_breaker: {
            state: CircuitState;
        };
    };
    /**
     * Internal runtime stats — only populated on the authenticated
     * `/health` endpoint and on the `general_health` tool. Never
     * exposed on `/livez` or `/readyz`.
     */
    runtime?: {
        cache: ReturnType<typeof cache.getStats>;
        circuit_breaker: ReturnType<typeof apiCircuitBreaker.getStats>;
        circuit_breakers_by_group: ReturnType<typeof getGroupCircuitBreakerStats>;
        rate_limiter: ReturnType<typeof endpointRateLimiter.getStats>;
    };
}

const startTime = Date.now();

/**
 * Compute the local health status of this process.
 *
 * The check is synchronous in nature (no I/O, no network) and runs in
 * O(1) — it only reads in-memory counters from the resilience layer.
 * It is therefore safe to invoke from public liveness/readiness probes
 * at high cadence without a cache.
 *
 * @param opts.includeRuntime - When `true`, attaches the `runtime`
 *   block with cache/circuit breaker/rate limiter stats. Callers
 *   exposing the result to unauthenticated clients (e.g. `/livez`,
 *   `/readyz`) MUST pass `false` to avoid leaking operational data.
 */
export function performHealthCheck(opts: { includeRuntime?: boolean } = {}): HealthStatus {
    const correlationId = getCorrelationId();
    const includeRuntime = opts.includeRuntime ?? true;

    const breakerState = apiCircuitBreaker.getState();
    const status: ServiceStatus = breakerState === CircuitState.OPEN ? "degraded" : "ok";

    const health: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: PACKAGE_VERSION,
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        components: {
            circuit_breaker: {
                state: breakerState,
            },
        },
    };

    if (includeRuntime) {
        health.runtime = {
            cache: cache.getStats(),
            circuit_breaker: apiCircuitBreaker.getStats(),
            circuit_breakers_by_group: getGroupCircuitBreakerStats(),
            rate_limiter: endpointRateLimiter.getStats(),
        };
    }

    logger.debug("Health check computed", {
        correlationId,
        status,
        circuitBreaker: breakerState,
        includeRuntime,
    });

    return health;
}

/**
 * Minimal liveness payload for `GET /livez`.
 *
 * Contract: returns 200 OK as long as the event loop is responsive.
 * It does NOT check the circuit breaker — a degraded readiness state
 * is still a live process — and never exposes `runtime` data.
 */
export function getLivenessStatus(): { status: "ok"; timestamp: string } {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
    };
}

/**
 * Readiness payload for `GET /readyz`.
 *
 * Reports `degraded` when the global circuit breaker is open, which
 * indicates outbound calls to Bit2Me are currently being short-
 * circuited. Operators / load balancers can use this to take the
 * instance out of rotation.
 */
export function getReadinessStatus(): { status: ServiceStatus; timestamp: string } {
    const breakerState = apiCircuitBreaker.getState();
    return {
        status: breakerState === CircuitState.OPEN ? "degraded" : "ok",
        timestamp: new Date().toISOString(),
    };
}
