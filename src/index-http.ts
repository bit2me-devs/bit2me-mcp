#!/usr/bin/env node
/**
 * Entry point for the HTTP/SSE binary (`bit2me-mcp-http`).
 *
 * Local one-user proxy (ADR 0003): bind defaults to loopback. Each
 * request may carry credentials (API-key headers or Bearer JWT).
 * Bit2Me’s gateway authenticates keys. This is not a hosted product.
 *
 * Boot sequence:
 *   1. Validate env credentials and `MCP_HTTP_*` through `getConfig()`.
 *      Per-request headers can override env; env is still required so
 *      tools like `general_health` can boot.
 *   2. Initialise the logger.
 *   3. Validate `AUDIT_LOG_PATH` through `initAudit()` so the boot
 *      aborts on misconfiguration instead of silently downgrading to
 *      logger fallback the first time a write-tool runs.
 *   4. Build & start the Fastify server.
 *
 * Plain HTTP on 127.0.0.1 is the usual case. Put TLS in front only if
 * you bind a non-loopback interface.
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
