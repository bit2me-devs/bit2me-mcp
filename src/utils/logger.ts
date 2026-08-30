/**
 * Structured logging. Redaction lives in logger-redact.ts.
 * All logs go to stderr; stdout is reserved for MCP JSON-RPC.
 */

import { getCorrelationId } from "./context.js";
import {
    DEFAULT_SENSITIVE_KEYS,
    DEFAULT_VALUE_TRUNCATE_AT,
    EXACT_SENSITIVE_KEYS,
    sanitizeValue,
} from "./logger-redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private level: LogLevel;
    private sensitiveKeys = [...DEFAULT_SENSITIVE_KEYS];
    private exactSensitiveKeys = [...EXACT_SENSITIVE_KEYS];
    private valueTruncateAt = DEFAULT_VALUE_TRUNCATE_AT;

    constructor(level: LogLevel = "info") {
        this.level = level;
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    addSensitiveKey(key: string): void {
        const normalized = key.toLowerCase();
        if (!this.sensitiveKeys.includes(normalized)) {
            this.sensitiveKeys.push(normalized);
        }
    }

    setValueTruncateAt(maxLen: number): void {
        this.valueTruncateAt = Math.max(16, maxLen);
    }

    private sanitize(data: unknown): unknown {
        return sanitizeValue(data, 0, this.sensitiveKeys, this.exactSensitiveKeys, this.valueTruncateAt);
    }

    private format(level: LogLevel, message: string, context?: unknown): string {
        const timestamp = new Date().toISOString();
        const correlationId = getCorrelationId();
        const sanitizedContext = context ? (this.sanitize(context) as Record<string, unknown>) : {};

        if (process.env.LOG_FORMAT === "json") {
            const payload: Record<string, unknown> = {
                ts: timestamp,
                level,
                msg: message,
                ...sanitizedContext,
            };
            if (correlationId && !payload.correlationId) {
                payload.correlationId = correlationId;
            }
            return JSON.stringify(payload);
        }

        const levelUpper = level.toUpperCase().padEnd(5);
        let formatted = `[${timestamp}] ${levelUpper} ${message}`;
        if (correlationId) {
            formatted += ` [correlationId: ${correlationId}]`;
        }
        if (context) {
            const ctx = {
                ...sanitizedContext,
                ...(correlationId && !sanitizedContext.correlationId ? { correlationId } : {}),
            };
            formatted += " " + JSON.stringify(ctx);
        } else if (correlationId) {
            formatted += " " + JSON.stringify({ correlationId });
        }
        return formatted;
    }

    private log(level: LogLevel, message: string, context?: unknown): void {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
            return;
        }
        process.stderr.write(this.format(level, message, context) + "\n");
    }

    debug(message: string, context?: unknown): void {
        this.log("debug", message, context);
    }
    info(message: string, context?: unknown): void {
        this.log("info", message, context);
    }
    warn(message: string, context?: unknown): void {
        this.log("warn", message, context);
    }
    error(message: string, context?: unknown): void {
        this.log("error", message, context);
    }
}

export const logger = new Logger();

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
