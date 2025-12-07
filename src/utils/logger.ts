/**
 * Structured logging system for Bit2Me MCP Server
 * Automatically sanitizes sensitive data and provides configurable log levels
 * Includes correlation ID support for request tracking
 */

import { getCorrelationId } from "./context.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private level: LogLevel;
    private sensitiveKeys = [
        "x-api-key",
        "api-signature",
        "authorization",
        "password",
        "secret",
        "token",
        "apikey",
        "api_key",
        "api_secret",
        "cookie",
        "sessiontoken",
        "session_token",
        "b2m-atoken",
    ];

    // Exact key matches that should always be redacted
    private exactSensitiveKeys = ["jwt"];

    constructor(level: LogLevel = "info") {
        this.level = level;
    }

    /**
     * Set the current log level
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Sanitize sensitive data from objects
     */
    private sanitize(data: unknown): unknown {
        if (!data) return data;

        // Handle primitive types
        if (typeof data !== "object") return data;

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map((item) => this.sanitize(item));
        }

        // Handle objects
        const sanitized: Record<string, unknown> = {};
        const obj = data as Record<string, unknown>;
        for (const [key, value] of Object.entries(obj)) {
            const keyLower = key.toLowerCase();
            // Check both partial matches and exact matches for sensitive keys
            const isSensitive =
                this.sensitiveKeys.some((k) => keyLower.includes(k)) || this.exactSensitiveKeys.includes(key);

            if (isSensitive && typeof value === "string") {
                sanitized[key] = "***REDACTED***";
            } else if (typeof value === "object" && value !== null) {
                sanitized[key] = this.sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    /**
     * Format log message with timestamp and level
     */
    private format(level: LogLevel, message: string, context?: unknown): string {
        const timestamp = new Date().toISOString();
        const levelUpper = level.toUpperCase().padEnd(5);
        const correlationId = getCorrelationId();

        let formatted = `[${timestamp}] ${levelUpper} ${message}`;

        // Add correlation ID if available
        if (correlationId) {
            formatted += ` [correlationId: ${correlationId}]`;
        }

        if (context) {
            const sanitizedContext = this.sanitize(context);
            // Ensure correlationId is in context if not already present
            const contextWithCorrelation = {
                ...(sanitizedContext as Record<string, unknown>),
                ...(correlationId && !(sanitizedContext as Record<string, unknown>)?.correlationId
                    ? { correlationId }
                    : {}),
            };
            formatted += " " + JSON.stringify(contextWithCorrelation);
        } else if (correlationId) {
            formatted += " " + JSON.stringify({ correlationId });
        }

        return formatted;
    }

    /**
     * Internal log method
     */
    private log(level: LogLevel, message: string, context?: unknown): void {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
            return; // Skip if below current log level
        }

        const formatted = this.format(level, message, context);

        // All logs go to stderr to avoid polluting MCP stdout
        console.error(formatted);
    }

    /**
     * Log debug message
     */
    debug(message: string, context?: unknown): void {
        this.log("debug", message, context);
    }

    /**
     * Log info message
     */
    info(message: string, context?: unknown): void {
        this.log("info", message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: unknown): void {
        this.log("warn", message, context);
    }

    /**
     * Log error message
     */
    error(message: string, context?: unknown): void {
        this.log("error", message, context);
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Initialize logger with environment configuration
 */
export function initLogger(level?: string): void {
    const validLevels: LogLevel[] = ["debug", "info", "warn", "error"];
    const logLevel = (level?.toLowerCase() || "info") as LogLevel;

    if (validLevels.includes(logLevel)) {
        logger.setLevel(logLevel);
        logger.info(`Logger initialized with level: ${logLevel}`);
    } else {
        logger.setLevel("info");
        logger.warn(`Invalid log level '${level}', defaulting to 'info'`);
    }
}
