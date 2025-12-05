import { logger } from "./logger.js";
import { metricsCollector } from "./metrics.js";
import { setCorrelationId, contextManager, clearCorrelationId } from "./context.js";

/**
 * Wrapper for tool execution that handles standard logging, error tracking, metrics, and correlation IDs.
 * @param name - The name of the tool being executed
 * @param args - The arguments passed to the tool
 * @param executor - The function containing the tool's core logic
 * @returns The result of the executor function
 */
export async function executeTool<T>(name: string, args: any, executor: () => Promise<T>): Promise<T> {
    // Create context for this request
    const context = contextManager.createContext(name);
    setCorrelationId(context.correlationId);

    logger.debug(`Executing tool: ${name}`, { args, correlationId: context.correlationId });
    const startTime = Date.now();

    try {
        const result = await executor();
        const duration = Date.now() - startTime;
        
        // Record successful execution
        metricsCollector.recordToolExecution(name, duration, true);
        logger.debug(`Tool ${name} completed successfully`, { 
            duration, 
            correlationId: context.correlationId 
        });
        
        return result;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // Record failed execution
        metricsCollector.recordToolExecution(name, duration, false);
        logger.error(`Tool ${name} failed`, { 
            duration, 
            error: error.message,
            correlationId: context.correlationId 
        });
        
        throw error;
    } finally {
        // Cleanup context
        contextManager.clearContext(context.correlationId);
        clearCorrelationId();
    }
}
