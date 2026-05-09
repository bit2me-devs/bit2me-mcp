import { logger } from "./logger.js";
import { metricsCollector } from "./metrics.js";
import { contextManager, runWithContext, getContext, type RequestContext } from "./context.js";
import { clearRequestCache } from "./request-cache.js";
import { recordAudit } from "./audit.js";
import { getToolMetadata } from "./tool-metadata.js";

/**
 * Decide whether a tool's invocation must be audited.
 *
 * The single source of truth is `data/tools.json`'s `type` field
 * (READ / WRITE / META). Anything declared `WRITE` is recorded.
 * Falling back to `false` for unknown tools is intentional: an unknown
 * tool will fail to dispatch and we don't want to leak its name into
 * the audit stream.
 */
function isWriteTool(name: string): boolean {
    const meta = getToolMetadata(name);
    return meta?.type === "WRITE";
}

/**
 * Sanitize arguments for logging by removing sensitive data
 * @param args - The original arguments
 * @returns Sanitized arguments safe for logging
 */
function sanitizeArgsForLogging(args: Record<string, unknown>): Record<string, unknown> {
    if (!args || typeof args !== "object") return args;

    const sanitized = { ...args };
    if ("jwt" in sanitized) {
        sanitized.jwt = "[REDACTED]";
    }
    return sanitized;
}

/**
 * Wrapper for tool execution that handles standard logging, error tracking, metrics, and correlation IDs.
 *
 * The execution runs inside an `AsyncLocalStorage` boundary (see
 * `runWithContext`), so concurrent invocations cannot leak credentials or
 * correlation IDs into each other.
 *
 * Also extracts and propagates the session token (`jwt` argument) for
 * web-like authentication.
 *
 * @param name - The name of the tool being executed
 * @param args - The arguments passed to the tool
 * @param executor - The function containing the tool's core logic
 * @returns The result of the executor function
 */
export async function executeTool<T>(
    name: string,
    args: Record<string, unknown>,
    executor: () => Promise<T>
): Promise<T> {
    const baseContext = contextManager.createContext(name);
    const sessionToken = typeof args?.jwt === "string" ? args.jwt : undefined;

    // If we're already inside a parent context (HTTP transport set it
    // up before dispatching), inherit the per-request API credentials
    // so this tool execution targets the right tenant.
    const parent = getContext();

    const ctx: RequestContext = {
        correlationId: baseContext.correlationId,
        toolName: baseContext.toolName,
        startTime: baseContext.startTime,
        sessionToken: sessionToken ?? parent?.sessionToken,
        apiKey: parent?.apiKey,
        apiSecret: parent?.apiSecret,
    };

    return runWithContext(ctx, async () => {
        logger.debug(`Executing tool: ${name}`, {
            args: sanitizeArgsForLogging(args),
            correlationId: ctx.correlationId,
            hasSession: !!sessionToken,
        });
        const startTime = Date.now();

        try {
            const result = await executor();
            const duration = Date.now() - startTime;

            metricsCollector.recordToolExecution(name, duration, true);
            logger.debug(`Tool ${name} completed successfully`, {
                duration,
                correlationId: ctx.correlationId,
            });

            if (isWriteTool(name)) {
                const idempotency = typeof args?.idempotency_key === "string" ? args.idempotency_key : undefined;
                recordAudit({
                    tool: name,
                    outcome: "success",
                    args: sanitizeArgsForLogging(args),
                    ...(idempotency ? { idempotencyKey: idempotency } : {}),
                });
            }

            return result;
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            metricsCollector.recordToolExecution(name, duration, false);
            logger.error(`Tool ${name} failed`, {
                duration,
                error: errorMessage,
                correlationId: ctx.correlationId,
            });

            if (isWriteTool(name)) {
                const idempotency = typeof args?.idempotency_key === "string" ? args.idempotency_key : undefined;
                recordAudit({
                    tool: name,
                    outcome: "error",
                    args: sanitizeArgsForLogging(args),
                    error: errorMessage,
                    ...(idempotency ? { idempotencyKey: idempotency } : {}),
                });
            }

            throw error;
        } finally {
            contextManager.clearContext(ctx.correlationId);
            clearRequestCache(ctx.correlationId);
        }
    });
}
