import { logger } from "./logger.js";
import { metricsCollector } from "./metrics.js";
import { setCorrelationId, contextManager, clearCorrelationId, setSessionToken, clearSessionToken } from "./context.js";

/**
 * Sanitize arguments for logging by removing sensitive data
 * @param args - The original arguments
 * @returns Sanitized arguments safe for logging
 */
function sanitizeArgsForLogging(args: Record<string, unknown>): Record<string, unknown> {
    if (!args || typeof args !== "object") return args;

    const sanitized = { ...args };
    // Remove session token from logs (parameter 'jwt')
    if ("jwt" in sanitized) {
        sanitized.jwt = "[REDACTED]";
    }
    return sanitized;
}

/**
 * Wrapper for tool execution that handles standard logging, error tracking, metrics, and correlation IDs.
 * Also extracts and propagates the session token ('s' parameter) for web-like authentication.
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
    // Create context for this request
    const context = contextManager.createContext(name);
    setCorrelationId(context.correlationId);

    // Extract session token from args ('jwt' parameter) and set in context
    // This enables web-like authentication for all API calls within this execution
    const sessionToken = typeof args?.jwt === "string" ? args.jwt : undefined;
    if (sessionToken) {
        setSessionToken(sessionToken);
        context.sessionToken = sessionToken;
    }

    // Log with sanitized args (no sensitive data)
    logger.debug(`Executing tool: ${name}`, {
        args: sanitizeArgsForLogging(args),
        correlationId: context.correlationId,
        hasSession: !!sessionToken,
    });
    const startTime = Date.now();

    try {
        const result = await executor();
        const duration = Date.now() - startTime;

        // Record successful execution
        metricsCollector.recordToolExecution(name, duration, true);
        logger.debug(`Tool ${name} completed successfully`, {
            duration,
            correlationId: context.correlationId,
        });

        return result;
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Record failed execution
        metricsCollector.recordToolExecution(name, duration, false);
        logger.error(`Tool ${name} failed`, {
            duration,
            error: errorMessage,
            correlationId: context.correlationId,
        });

        throw error;
    } finally {
        // Cleanup context
        contextManager.clearContext(context.correlationId);
        clearCorrelationId();
        clearSessionToken();
    }
}
