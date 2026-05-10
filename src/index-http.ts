#!/usr/bin/env node
/**
 * Entry point for the HTTP/SSE multi-tenant variant of the server.
 *
 * Boot sequence:
 *   1. Validate fallback env credentials and the HTTP-transport
 *      settings (`MCP_HTTP_*`) through `getConfig()`. The HTTP
 *      transport accepts per-request creds, but a baseline still has
 *      to exist for tools that run without auth such as
 *      `general_health`.
 *   2. Initialise the logger.
 *   3. Validate `AUDIT_LOG_PATH` through `initAudit()` so the boot
 *      aborts on misconfiguration instead of silently downgrading to
 *      logger fallback the first time a write-tool runs.
 *   4. Build & start the Fastify server.
 *
 * TLS is delegated to a reverse proxy. Operators are expected to deploy
 * this binary behind nginx / traefik / caddy with HTTPS termination.
 */

import { getConfig, logConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { initAudit } from "./utils/audit.js";
import { startHttpServer } from "./transport/http.js";

async function bootstrap(): Promise<void> {
    const resolvedConfig = getConfig();
    initLogger(resolvedConfig.LOG_LEVEL);
    initAudit();
    logConfig(resolvedConfig);
    logger.info("Bit2Me MCP HTTP server starting...");

    await startHttpServer({
        host: resolvedConfig.HTTP_HOST,
        port: resolvedConfig.HTTP_PORT,
        authMode: resolvedConfig.HTTP_AUTH_MODE,
        trustProxy: resolvedConfig.HTTP_TRUST_PROXY,
    });
}

bootstrap().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    // The logger may not be initialised if `getConfig()` itself threw;
    // fall back to stderr so the operator always sees the failure.
    try {
        logger.error("Fatal error during HTTP bootstrap", { error: message });
    } catch {
        // ignore secondary failure
    }
    console.error("Server startup failed:", message);
    process.exit(1);
});
