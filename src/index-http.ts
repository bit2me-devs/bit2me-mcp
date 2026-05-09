#!/usr/bin/env node
/**
 * Entry point for the HTTP/SSE multi-tenant variant of the server.
 *
 * Boot sequence:
 *   1. Validate fallback env credentials (the HTTP transport accepts
 *      per-request creds, but a baseline must still exist for tools that
 *      run without auth such as `general_health`).
 *   2. Initialise the logger.
 *   3. Build & start the Fastify server.
 *
 * TLS is delegated to a reverse proxy. Operators are expected to deploy
 * this binary behind nginx / traefik / caddy with HTTPS termination.
 */

import { getConfig, logConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { startHttpServer } from "./transport/http.js";

try {
    const config = getConfig();
    initLogger(config.LOG_LEVEL);
    logConfig(config);
    logger.info("Bit2Me MCP HTTP server starting...");
} catch {
    // eslint-disable-next-line no-console
    console.error("Server startup failed - invalid configuration");
    process.exit(1);
}

const authMode = (process.env.MCP_HTTP_AUTH_MODE ?? "api_key") as "api_key" | "jwt" | "both";
const port = Number(process.env.MCP_HTTP_PORT ?? 3000);
const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";

startHttpServer({ host, port, authMode }).catch((err: unknown) => {
    logger.error("Fatal error starting HTTP server", {
        error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});
