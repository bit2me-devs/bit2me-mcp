import dotenv from "dotenv";
import { z } from "zod";
import { logger } from "./utils/logger.js";

const DEFAULT_GATEWAY_URL = "https://gateway.bit2me.com";
const DEFAULT_SESSION_COOKIE_NAME = "b2m-atoken";
const DEFAULT_HTTP_HOST = "127.0.0.1";
const DEFAULT_HTTP_PORT = 3000;

/**
 * Allow plain HTTP only when targeting localhost / loopback. Any other host
 * must be HTTPS so that API keys, signatures and JWT cookies cannot be
 * intercepted on the wire.
 */
function isAllowedGatewayUrl(value: string): boolean {
    if (value.startsWith("https://")) return true;
    if (value.startsWith("http://localhost")) return true;
    if (value.startsWith("http://127.")) return true;
    if (value.startsWith("http://[::1]")) return true;
    return false;
}

/**
 * Parse a `MCP_HTTP_TRUST_PROXY` string into a value that Fastify can
 * consume. The intent is to make trust *opt-in*: by default we ignore
 * `X-Forwarded-*` headers so an attacker on a directly-exposed
 * deployment cannot spoof their IP.
 *
 *   - unset / `false` / `off` / `0`        → `false`
 *   - `true` / `on` / `1`                  → `true` (only safe behind
 *                                            a proxy you control)
 *   - `loopback`, `linklocal`, `uniquelocal` → handled natively by
 *                                            `proxy-addr`
 *   - CIDR list (`10.0.0.0/8,192.168.0.0/16`) → trust those proxies
 */
function parseTrustProxy(input: string | undefined): boolean | string | string[] {
    if (input === undefined) return false;
    const v = input.trim();
    if (v === "" || /^(false|off|0)$/i.test(v)) return false;
    if (/^(true|on|1)$/i.test(v)) return true;
    if (v.includes(",")) {
        return v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return v;
}

const envSchema = z.object({
    BIT2ME_API_KEY: z.string().min(1, "BIT2ME_API_KEY is required"),
    BIT2ME_API_SECRET: z.string().min(1, "BIT2ME_API_SECRET is required"),
    BIT2ME_GATEWAY_URL: z
        .string()
        .url()
        .refine(isAllowedGatewayUrl, {
            message: "BIT2ME_GATEWAY_URL must use https:// (plain http:// is only allowed for localhost / loopback)",
        })
        .optional()
        .default(DEFAULT_GATEWAY_URL),
    BIT2ME_REQUEST_TIMEOUT: z.string().optional().default("30000"),
    BIT2ME_LOG_LEVEL: z.string().optional().default("info"),
    BIT2ME_MAX_RETRIES: z.string().optional().default("3"),
    BIT2ME_RETRY_BASE_DELAY: z.string().optional().default("1000"),
    BIT2ME_INCLUDE_RAW_RESPONSE: z.string().optional().default("false"),
    // Cookie names are placed verbatim into a `Cookie:` header so they
    // must be HTTP-token-safe (RFC 6265 cookie-name = token). Reject
    // anything that could enable header injection / smuggling against
    // the upstream gateway.
    BIT2ME_SESSION_COOKIE_NAME: z
        .string()
        .regex(/^[A-Za-z0-9_-]{1,64}$/, "BIT2ME_SESSION_COOKIE_NAME must match /^[A-Za-z0-9_-]{1,64}$/")
        .optional()
        .default(DEFAULT_SESSION_COOKIE_NAME),
    // ------------------------------------------------------------------
    // HTTP transport — only consumed by `bit2me-mcp-http`.
    // ------------------------------------------------------------------
    MCP_HTTP_HOST: z.string().min(1).optional().default(DEFAULT_HTTP_HOST),
    MCP_HTTP_PORT: z
        .string()
        .regex(/^\d{1,5}$/, "MCP_HTTP_PORT must be a port number")
        .optional()
        .default(String(DEFAULT_HTTP_PORT)),
    MCP_HTTP_AUTH_MODE: z.enum(["api_key", "jwt", "both"]).optional().default("api_key"),
    MCP_HTTP_TRUST_PROXY: z.string().optional(),
});

export type Config = z.infer<typeof envSchema> & {
    GATEWAY_URL: string;
    REQUEST_TIMEOUT: number;
    LOG_LEVEL: string;
    MAX_RETRIES: number;
    RETRY_BASE_DELAY: number;
    INCLUDE_RAW_RESPONSE: boolean;
    SESSION_COOKIE_NAME: string;
    HTTP_HOST: string;
    HTTP_PORT: number;
    HTTP_AUTH_MODE: "api_key" | "jwt" | "both";
    HTTP_TRUST_PROXY: boolean | string | string[];
};

let cachedConfig: Config | null = null;

/**
 * Get configuration with lazy loading.
 * This ensures environment variables from mcp_config.json are available before validation.
 */
export function getConfig(): Config {
    if (cachedConfig) {
        return cachedConfig;
    }

    // Only load .env if credentials are not already in process.env (from mcp_config.json)
    if (!process.env.BIT2ME_API_KEY || !process.env.BIT2ME_API_SECRET) {
        logger.debug("Loading credentials from .env file");
        dotenv.config({ quiet: true } as any);
    } else {
        logger.debug("Using credentials from environment (mcp_config.json)");
    }

    // Debug: Log credential sources (masked)
    const apiKeySource = process.env.BIT2ME_API_KEY ? "SET" : "MISSING";
    const apiSecretSource = process.env.BIT2ME_API_SECRET ? "SET" : "MISSING";
    logger.debug(`BIT2ME_API_KEY: ${apiKeySource}, BIT2ME_API_SECRET: ${apiSecretSource}`);

    try {
        const parsed = envSchema.parse(process.env);

        // Parse numeric values with defaults
        const gatewayUrl = (parsed.BIT2ME_GATEWAY_URL || DEFAULT_GATEWAY_URL).replace(/\/$/, ""); // Remove trailing slash

        cachedConfig = {
            ...parsed,
            GATEWAY_URL: gatewayUrl,
            REQUEST_TIMEOUT: parseInt(parsed.BIT2ME_REQUEST_TIMEOUT || "30000", 10),
            LOG_LEVEL: parsed.BIT2ME_LOG_LEVEL || "info",
            MAX_RETRIES: parseInt(parsed.BIT2ME_MAX_RETRIES || "3", 10),
            RETRY_BASE_DELAY: parseInt(parsed.BIT2ME_RETRY_BASE_DELAY || "1000", 10),
            INCLUDE_RAW_RESPONSE: parsed.BIT2ME_INCLUDE_RAW_RESPONSE === "true",
            SESSION_COOKIE_NAME: parsed.BIT2ME_SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME,
            HTTP_HOST: parsed.MCP_HTTP_HOST || DEFAULT_HTTP_HOST,
            HTTP_PORT: parseInt(parsed.MCP_HTTP_PORT || String(DEFAULT_HTTP_PORT), 10),
            HTTP_AUTH_MODE: parsed.MCP_HTTP_AUTH_MODE,
            HTTP_TRUST_PROXY: parseTrustProxy(parsed.MCP_HTTP_TRUST_PROXY),
        };

        // Register the cookie name as sensitive immediately so even error logs
        // emitted later cannot leak it. We deliberately keep this side-effect
        // here (instead of `logConfig`) because it is a security guard, not a
        // diagnostic message.
        logger.addSensitiveKey(cachedConfig.SESSION_COOKIE_NAME);

        logger.debug("Configuration validated successfully", {
            gateway: gatewayUrl,
            timeout: cachedConfig.REQUEST_TIMEOUT,
            maxRetries: cachedConfig.MAX_RETRIES,
            logLevel: cachedConfig.LOG_LEVEL,
        });
        return cachedConfig;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missing = error.issues.map((e: any) => e.path.join(".")).join(", ");
            logger.error("Missing required credentials", { missing });
            logger.error("Please set BIT2ME_API_KEY and BIT2ME_API_SECRET in your .env file or environment");
        } else {
            logger.error("Credential validation failed", { error });
        }
        throw error;
    }
}

/**
 * Emit informational log messages about the resolved configuration.
 *
 * Previously these `logger.info` calls lived inside `getConfig()`, which
 * meant that simply reading `config.X` produced log lines. That coupling
 * made tests flaky and caused unrelated startup paths to spam the log. The
 * caller (`src/index.ts`) now invokes this explicitly once after the
 * logger has been initialised.
 */
export function logConfig(c: Config): void {
    if (c.GATEWAY_URL !== DEFAULT_GATEWAY_URL) {
        logger.info(`Using custom gateway: ${c.GATEWAY_URL}`);
    }
    if (c.SESSION_COOKIE_NAME !== DEFAULT_SESSION_COOKIE_NAME) {
        logger.info(`Using custom session cookie name: ${c.SESSION_COOKIE_NAME}`);
    }
}

/**
 * @deprecated Prefer `getConfig()` (or, in Phase 2 onwards, the
 * `ServerContext`). The proxy-based `config` export is kept for backwards
 * compatibility with consumers that destructured `config.BIT2ME_*` at
 * module load time. New code should call `getConfig()` directly so the
 * dependency is explicit and side-effect-free.
 */
export const config = new Proxy({} as Config, {
    get(_target, prop) {
        return getConfig()[prop as keyof Config];
    },
});

/**
 * Get the Bit2Me Gateway URL (configurable via BIT2ME_GATEWAY_URL env var)
 * Default: https://gateway.bit2me.com
 *
 * @example
 * // In .env or environment:
 * BIT2ME_GATEWAY_URL=https://qa-gateway.bit2me.com
 */
export function getGatewayUrl(): string {
    return getConfig().GATEWAY_URL;
}

// Backward compatibility - lazy evaluation via getter
export const BIT2ME_GATEWAY_URL = DEFAULT_GATEWAY_URL;
