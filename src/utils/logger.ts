/**
 * Structured logging system for Bit2Me MCP Server
 * Automatically sanitizes sensitive data and provides configurable log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private level: LogLevel;
    private sensitiveKeys = [
        'x-api-key',
        'api-signature',
        'authorization',
        'password',
        'secret',
        'token',
        'apikey',
        'api_key',
        'api_secret',
    ];

    constructor(level: LogLevel = 'info') {
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
    private sanitize(data: any): any {
        if (!data) return data;

        // Handle primitive types
        if (typeof data !== 'object') return data;

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        // Handle objects
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            const keyLower = key.toLowerCase();
            const isSensitive = this.sensitiveKeys.some(k => keyLower.includes(k));

            if (isSensitive && typeof value === 'string') {
                sanitized[key] = '***REDACTED***';
            } else if (typeof value === 'object' && value !== null) {
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
    private format(level: LogLevel, message: string, context?: any): string {
        const timestamp = new Date().toISOString();
        const levelUpper = level.toUpperCase().padEnd(5);

        let formatted = `[${timestamp}] ${levelUpper} ${message}`;

        if (context) {
            const sanitizedContext = this.sanitize(context);
            formatted += ' ' + JSON.stringify(sanitizedContext);
        }

        return formatted;
    }

    /**
     * Internal log method
     */
    private log(level: LogLevel, message: string, context?: any): void {
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
    debug(message: string, context?: any): void {
        this.log('debug', message, context);
    }

    /**
     * Log info message
     */
    info(message: string, context?: any): void {
        this.log('info', message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: any): void {
        this.log('warn', message, context);
    }

    /**
     * Log error message
     */
    error(message: string, context?: any): void {
        this.log('error', message, context);
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Initialize logger with environment configuration
 */
export function initLogger(level?: string): void {
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const logLevel = (level?.toLowerCase() || 'info') as LogLevel;

    if (validLevels.includes(logLevel)) {
        logger.setLevel(logLevel);
        logger.info(`Logger initialized with level: ${logLevel}`);
    } else {
        logger.setLevel('info');
        logger.warn(`Invalid log level '${level}', defaulting to 'info'`);
    }
}
