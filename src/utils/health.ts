/**
 * Health check utilities for monitoring server status
 */

import { logger } from "./logger.js";
import { getConfig } from "../config.js";
import { apiCircuitBreaker, CircuitState } from "./circuit-breaker.js";
import { metricsCollector } from "./metrics.js";
import { cache } from "./cache.js";
import { bit2meRequest } from "../services/bit2me.js";
import { getCorrelationId } from "./context.js";

export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        api: ApiHealthCheck;
        circuitBreaker: CircuitBreakerHealthCheck;
        cache: CacheHealthCheck;
        metrics: MetricsHealthCheck;
    };
}

export interface ApiHealthCheck {
    status: "ok" | "error";
    responseTime?: number;
    error?: string;
}

export interface CircuitBreakerHealthCheck {
    status: "closed" | "open" | "half_open";
    state: CircuitState;
    failureCount: number;
    lastFailureTime?: number;
}

export interface CacheHealthCheck {
    status: "ok";
    entries: number;
    stats: ReturnType<typeof cache.getStats>;
}

export interface MetricsHealthCheck {
    status: "ok";
    summary: ReturnType<typeof metricsCollector.getSummary>;
}

const startTime = Date.now();

/**
 * Perform health check on the server
 * @returns Health status object
 */
export async function performHealthCheck(): Promise<HealthStatus> {
    const correlationId = getCorrelationId();
    logger.debug("Performing health check", { correlationId });

    // Check API connectivity
    const apiCheck = await checkApiHealth();

    // Check circuit breaker
    const circuitBreakerCheck = checkCircuitBreakerHealth();

    // Check cache
    const cacheCheck = checkCacheHealth();

    // Check metrics
    const metricsCheck = checkMetricsHealth();

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (apiCheck.status === "error" || circuitBreakerCheck.status === "open") {
        overallStatus = "unhealthy";
    } else if (circuitBreakerCheck.status === "half_open") {
        overallStatus = "degraded";
    }

    const health: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
        uptime: Date.now() - startTime,
        checks: {
            api: apiCheck,
            circuitBreaker: circuitBreakerCheck,
            cache: cacheCheck,
            metrics: metricsCheck,
        },
    };

    logger.info("Health check completed", {
        correlationId,
        status: overallStatus,
        apiStatus: apiCheck.status,
        circuitBreakerStatus: circuitBreakerCheck.status,
    });

    return health;
}

/**
 * Check API health by making a lightweight request
 */
async function checkApiHealth(): Promise<ApiHealthCheck> {
    const startTime = Date.now();
    try {
        // Try a lightweight endpoint (account info is usually fast)
        await bit2meRequest("GET", "/v1/account", undefined, 0, 5000); // 5 second timeout for health check
        const responseTime = Date.now() - startTime;
        return {
            status: "ok",
            responseTime,
        };
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        logger.warn("API health check failed", {
            correlationId: getCorrelationId(),
            error: error.message,
            responseTime,
        });
        return {
            status: "error",
            responseTime,
            error: error.message,
        };
    }
}

/**
 * Check circuit breaker health
 */
function checkCircuitBreakerHealth(): CircuitBreakerHealthCheck {
    const stats = apiCircuitBreaker.getStats();
    return {
        status:
            stats.state === CircuitState.CLOSED
                ? "closed"
                : stats.state === CircuitState.HALF_OPEN
                  ? "half_open"
                  : "open",
        state: stats.state,
        failureCount: stats.failureCount,
        lastFailureTime: stats.lastFailureTime > 0 ? stats.lastFailureTime : undefined,
    };
}

/**
 * Check cache health
 */
function checkCacheHealth(): CacheHealthCheck {
    const stats = cache.getStats();
    return {
        status: "ok",
        entries: stats.totalEntries,
        stats,
    };
}

/**
 * Check metrics health
 */
function checkMetricsHealth(): MetricsHealthCheck {
    const summary = metricsCollector.getSummary();
    return {
        status: "ok",
        summary,
    };
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
    } catch (error: any) {
        logger.error("Health check failed", {
            correlationId: getCorrelationId(),
            error: error.message,
        });
        return {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
        };
    }
}
