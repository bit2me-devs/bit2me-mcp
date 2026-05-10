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
 *   3. Build & start the Fastify server.
 *
 * TLS is delegated to a reverse proxy. Operators are expected to deploy
 * this binary behind nginx / traefik / caddy with HTTPS termination.
 */

import { getConfig, logConfig } from "./config.js";
import { initLogger, logger } from "./utils/logger.js";
import { startHttpServer } from "./transport/http.js";

let resolvedConfig: ReturnType<typeof getConfig>;
try {
    resolvedConfig = getConfig();
    initLogger(resolvedConfig.LOG_LEVEL);
    logConfig(resolvedConfig);
    logger.info("Bit2Me MCP HTTP server starting...");
} catch {
    console.error("Server startup failed - invalid configuration");
    process.exit(1);
}

startHttpServer({
    host: resolvedConfig.HTTP_HOST,
    port: resolvedConfig.HTTP_PORT,
    authMode: resolvedConfig.HTTP_AUTH_MODE,
    trustProxy: resolvedConfig.HTTP_TRUST_PROXY,
}).catch((err: unknown) => {
    logger.error("Fatal error starting HTTP server", {
        error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});
