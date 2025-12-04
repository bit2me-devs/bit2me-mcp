import { logger } from "./logger.js";

/**
 * Wrapper for tool execution that handles standard logging and error tracking.
 * @param name - The name of the tool being executed
 * @param args - The arguments passed to the tool
 * @param executor - The function containing the tool's core logic
 * @returns The result of the executor function
 */
export async function executeTool<T>(name: string, args: any, executor: () => Promise<T>): Promise<T> {
    logger.debug(`Executing tool: ${name}`, { args });
    const startTime = Date.now();

    try {
        const result = await executor();
        return result;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`Tool ${name} failed`, { duration, error: error.message });
        throw error;
    } finally {
        const duration = Date.now() - startTime;
        logger.debug(`Tool ${name} completed`, { duration });
    }
}
