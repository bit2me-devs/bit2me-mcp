export const DEFAULT_VALUE_TRUNCATE_AT = 256;

const JWT_VALUE_REGEX = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;
const LONG_OPAQUE_VALUE_REGEX = /^[A-Za-z0-9+/_=-]{64,}$/;

export const DEFAULT_SENSITIVE_KEYS = [
    "x-api-key",
    "x-bit2me-api-key",
    "x-bit2me-api-secret",
    "api-key",
    "api-secret",
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

export const EXACT_SENSITIVE_KEYS = ["jwt"];

function sanitizeString(value: string, truncateAt: number): string {
    if (JWT_VALUE_REGEX.test(value) || LONG_OPAQUE_VALUE_REGEX.test(value)) {
        return "***REDACTED***";
    }
    if (value.length > truncateAt) {
        return value.slice(0, truncateAt) + "...[truncated]";
    }
    return value;
}

export function sanitizeValue(
    value: unknown,
    depth: number,
    sensitiveKeys: string[],
    exactKeys: string[],
    truncateAt: number
): unknown {
    if (value == null) return value;
    if (depth > 8) return "[TRUNCATED]";
    if (typeof value === "string") return sanitizeString(value, truncateAt);
    if (typeof value !== "object") return value;
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item, depth + 1, sensitiveKeys, exactKeys, truncateAt));
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const keyLower = key.toLowerCase();
        const isSensitive = exactKeys.includes(key) || sensitiveKeys.some((k) => keyLower.includes(k));
        sanitized[key] = isSensitive
            ? "***REDACTED***"
            : sanitizeValue(child, depth + 1, sensitiveKeys, exactKeys, truncateAt);
    }
    return sanitized;
}
