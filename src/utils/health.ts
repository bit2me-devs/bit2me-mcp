/**
 * Health check utilities for monitoring server status
 */

import { logger } from "./logger.js";
import { getGatewayUrl } from "../config.js";
import { apiCircuitBreaker, CircuitState } from "./circuit-breaker.js";
import { bit2meRequest } from "../services/bit2me.js";
import { getCorrelationId } from "./context.js";
import axios from "axios";

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
            response_time_ms?: number;
            details?: string;
        };
    };
}

const startTime = Date.now();

/**
 * Perform health check on the server
 * @returns Health status object
 */
export async function performHealthCheck(): Promise<HealthStatus> {
    const correlationId = getCorrelationId();
    logger.debug("Performing health check", { correlationId });

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
        version: process.env.npm_package_version || "unknown",
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
    };

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
    } catch (error) {
        return {
            status: "offline",
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check MCP Integration (Authenticated /account + Circuit Breaker)
 */
async function checkMcpIntegration(): Promise<{ status: "online" | "offline"; responseTime?: number; error?: string }> {
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
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        logger.warn("Integration health check failed", {
            correlationId: getCorrelationId(),
            error: error.message,
            responseTime,
        });
        return {
            status: "offline",
            responseTime,
            error: error.message,
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
    } catch (error: any) {
        logger.error("Health check failed", {
            correlationId: getCorrelationId(),
            error: error.message,
        });
        return {
            status: "offline",
            timestamp: new Date().toISOString(),
        };
    }
}
