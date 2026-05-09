/**
 * Structured logging system for Bit2Me MCP Server
 * Automatically sanitizes sensitive data and provides configurable log levels
 * Includes correlation ID support for request tracking
 *
 * The redaction policy is intentionally aggressive: in addition to a list of
 * sensitive keys, every string value is inspected with heuristics that catch
 * JWT tokens and long base64 / hex blobs even when the field name is benign
 * (e.g. an upstream API returning a token in a generic `data` payload).
 */

import { getCorrelationId } from "./context.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * Default truncation length for string values in log output. Long values are
 * trimmed to avoid leaking large response bodies (or PII embedded in them).
 */
const DEFAULT_VALUE_TRUNCATE_AT = 256;

/**
 * Matches a JWT-shaped string: three base64url segments separated by dots.
 *
 * Each segment is required to be at least 10 characters so the regex does
 * not accidentally redact innocuous dotted values like semantic versions
 * (`4.1.3`) or short identifiers. Real JWTs always exceed this floor: a
 * minimal JWT header alone (`eyJ0eXAiOiJKV1QifQ`) is 18 characters once
 * base64url-encoded.
 */
const JWT_VALUE_REGEX = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;

/**
 * Matches a long base64 / base64url / hex blob. We deliberately require a
 * decent length (>= 64) to avoid redacting normal short strings.
 */
const LONG_OPAQUE_VALUE_REGEX = /^[A-Za-z0-9+/_=-]{64,}$/;

class Logger {
    private level: LogLevel;
    private sensitiveKeys = [
        // Auth headers / credentials
        "x-api-key",
        "api-signature",
        "authorization",
        "bearer",
        "password",
        "secret",
        "token",
        "apikey",
        "api_key",
        "api_secret",
        "cookie",
        "sessiontoken",
        "session_token",
        "sessionkey",
        "session_key",
        "signature",
        // PII / KYC fields commonly returned by Bit2Me
        "email",
        "iban",
        "phone",
        "address",
        "dni",
        "nif",
        "passport",
        "kyc",
        "tag",
        "nationalid",
        "national_id",
    ];

    /** Exact key matches that should always be redacted. */
    private exactSensitiveKeys = ["jwt"];

    /** Maximum length of a string value before being truncated in logs. */
    private valueTruncateAt = DEFAULT_VALUE_TRUNCATE_AT;

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
     * Register an additional key to be redacted in log output.
     * Use this to dynamically add runtime-configured sensitive values (e.g. custom cookie names).
     */
    addSensitiveKey(key: string): void {
        const normalized = key.toLowerCase();
        if (!this.sensitiveKeys.includes(normalized)) {
            this.sensitiveKeys.push(normalized);
        }
    }

    /**
     * Override the default truncation length for string values.
     */
    setValueTruncateAt(maxLen: number): void {
        this.valueTruncateAt = Math.max(16, maxLen);
    }

    /**
     * Sanitize sensitive data from objects.
     */
    private sanitize(data: unknown): unknown {
        return this.sanitizeValue(data, /* depth */ 0);
    }

    private sanitizeValue(value: unknown, depth: number): unknown {
        if (value == null) return value;
        if (depth > 8) return "[TRUNCATED]";

        if (typeof value === "string") {
            return this.sanitizeString(value);
        }

        if (typeof value !== "object") return value;

        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeValue(item, depth + 1));
        }

        const sanitized: Record<string, unknown> = {};
        const obj = value as Record<string, unknown>;
        for (const [key, child] of Object.entries(obj)) {
            const keyLower = key.toLowerCase();
            const isSensitive =
                this.exactSensitiveKeys.includes(key) || this.sensitiveKeys.some((k) => keyLower.includes(k));

            if (isSensitive) {
                sanitized[key] = "***REDACTED***";
                continue;
            }
            sanitized[key] = this.sanitizeValue(child, depth + 1);
        }
        return sanitized;
    }

    /**
     * Apply value-level heuristics to a string and optionally truncate.
     */
    private sanitizeString(value: string): string {
        if (JWT_VALUE_REGEX.test(value)) {
            return "***REDACTED***";
        }
        if (LONG_OPAQUE_VALUE_REGEX.test(value)) {
            return "***REDACTED***";
        }
        if (value.length > this.valueTruncateAt) {
            return value.slice(0, this.valueTruncateAt) + "...[truncated]";
        }
        return value;
    }

    /**
     * Format log message.
     *
     * Two output modes are supported:
     *  - `pretty` (default): human-readable, used by tests and local dev.
     *    Format: `[timestamp] LEVEL message [correlationId: …] {context}`
     *  - `json`: one JSON object per line, suitable for log aggregators
     *    (Loki, Datadog, CloudWatch, etc.). Enabled by setting
     *    `LOG_FORMAT=json` in the environment.
     */
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

    /**
     * Internal log method
     */
    private log(level: LogLevel, message: string, context?: unknown): void {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
            return;
        }

        const formatted = this.format(level, message, context);

        // All logs go to stderr; stdout is reserved for the MCP JSON-RPC
        // protocol framing.
        process.stderr.write(formatted + "\n");
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
