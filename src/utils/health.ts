/**
 * Health check utilities for monitoring server status
 */

import { logger } from "./logger.js";
import { getGatewayUrl } from "../config.js";
import { apiCircuitBreaker, CircuitState } from "./circuit-breaker.js";
import { bit2meRequest } from "../services/bit2me.js";
import { getCorrelationId } from "./context.js";
import { cache } from "./cache.js";
import { endpointRateLimiter } from "./rate-limiter-config.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import axios from "axios";

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

export type ServiceStatus = "online" | "degraded" | "offline";

export interface HealthStatus {
    status: ServiceStatus;
    timestamp: string;
    version: string;
    uptime_seconds: number;
    components: {
        bit2me_server: {
            status: "online" | "offline";
            response_time_ms: number;
        };
        mcp_server: {
            status: "online" | "offline";
            response_time_ms?: number | undefined;
            details?: string | undefined;
        };
    };
    /**
     * Internal runtime stats — useful for ops dashboards but never
     * surfaced to the LLM (the tools layer strips these).
     */
    runtime?: {
        cache: ReturnType<typeof cache.getStats>;
        circuit_breaker: ReturnType<typeof apiCircuitBreaker.getStats>;
        rate_limiter: ReturnType<typeof endpointRateLimiter.getStats>;
    };
}

const startTime = Date.now();

// Cached health snapshot — stops hammering the upstream `/alive` and
// `/v1/account` endpoints when health is polled by Kubernetes liveness
// probes / load balancers / monitoring agents at high cadence.
const HEALTH_CACHE_TTL_MS = 30_000;
let cachedHealth: { snapshot: HealthStatus; expiresAt: number } | null = null;

/**
 * Perform health check on the server
 * @returns Health status object
 */
export async function performHealthCheck(opts: { force?: boolean } = {}): Promise<HealthStatus> {
    const correlationId = getCorrelationId();
    logger.debug("Performing health check", { correlationId });

    if (!opts.force && cachedHealth && cachedHealth.expiresAt > Date.now()) {
        return cachedHealth.snapshot;
    }

    // 1. Check Bit2Me Server (Public Liveness)
    const platformCheck = await checkBit2MePlatform();

    // 2. Check MCP Server (Authenticated API + Circuit Breaker)
    const integrationCheck = await checkMcpIntegration();

    // 3. Determine Global Status
    // "online" if both are online
    // "degraded" if only one is online
    // "offline" if both are offline
    let globalStatus: ServiceStatus;

    if (platformCheck.status === "online" && integrationCheck.status === "online") {
        globalStatus = "online";
    } else if (platformCheck.status === "online" || integrationCheck.status === "online") {
        globalStatus = "degraded";
    } else {
        globalStatus = "offline";
    }

    const health: HealthStatus = {
        status: globalStatus,
        timestamp: new Date().toISOString(),
        version: PACKAGE_VERSION,
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        components: {
            bit2me_server: {
                status: platformCheck.status,
                response_time_ms: platformCheck.responseTime,
            },
            mcp_server: {
                status: integrationCheck.status,
                response_time_ms: integrationCheck.responseTime,
                details: integrationCheck.error,
            },
        },
        runtime: {
            cache: cache.getStats(),
            circuit_breaker: apiCircuitBreaker.getStats(),
            rate_limiter: endpointRateLimiter.getStats(),
        },
    };

    cachedHealth = { snapshot: health, expiresAt: Date.now() + HEALTH_CACHE_TTL_MS };

    logger.info("Health check completed", {
        correlationId,
        status: globalStatus,
        platform: platformCheck.status,
        integration: integrationCheck.status,
    });

    return health;
}

/**
 * Check Bit2Me Platform Liveness (Public /alive)
 */
async function checkBit2MePlatform(): Promise<{ status: "online" | "offline"; responseTime: number }> {
    const startTime = Date.now();
    try {
        const response = await axios.get(`${getGatewayUrl()}/alive`, {
            timeout: 5000,
            validateStatus: () => true,
        });

        const responseTime = Date.now() - startTime;

        if (response.status === 200) {
            return { status: "online", responseTime };
        }

        return { status: "offline", responseTime };
    } catch {
        return {
            status: "offline",
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check MCP Integration (Authenticated /account + Circuit Breaker)
 */
async function checkMcpIntegration(): Promise<{ status: "online" | "offline"; responseTime?: number | undefined; error?: string | undefined }> {
    // Check Circuit Breaker first
    const cbState = apiCircuitBreaker.getState();
    if (cbState === CircuitState.OPEN) {
        return {
            status: "offline",
            error: "Integration suspended for safety (Circuit Breaker Open)",
        };
    }

    const startTime = Date.now();
    try {
        // Try a lightweight authenticated endpoint
        await bit2meRequest("GET", "/v1/account", undefined, 0, 5000);
        const responseTime = Date.now() - startTime;

        return {
            status: "online",
            responseTime,
        };
    } catch (error: unknown) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn("Integration health check failed", {
            correlationId: getCorrelationId(),
            error: errorMessage,
            responseTime,
        });
        return {
            status: "offline",
            responseTime,
            error: errorMessage,
        };
    }
}

/**
 * Get a simple health status (for quick checks)
 */
export async function getSimpleHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
        const health = await performHealthCheck();
        return {
            status: health.status,
            timestamp: health.timestamp,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Health check failed", {
            correlationId: getCorrelationId(),
            error: errorMessage,
        });
        return {
            status: "offline",
            timestamp: new Date().toISOString(),
        };
    }
}
