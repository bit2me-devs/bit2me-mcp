import dotenv from "dotenv";
import { z } from "zod";
import { logger } from "./utils/logger.js";

const DEFAULT_GATEWAY_URL = "https://gateway.bit2me.com";

const envSchema = z.object({
    BIT2ME_API_KEY: z.string().min(1, "BIT2ME_API_KEY is required"),
    BIT2ME_API_SECRET: z.string().min(1, "BIT2ME_API_SECRET is required"),
    BIT2ME_GATEWAY_URL: z.string().url().optional().default(DEFAULT_GATEWAY_URL),
    BIT2ME_REQUEST_TIMEOUT: z.string().optional().default("30000"),
    BIT2ME_LOG_LEVEL: z.string().optional().default("info"),
    BIT2ME_MAX_RETRIES: z.string().optional().default("3"),
    BIT2ME_RETRY_BASE_DELAY: z.string().optional().default("1000"),
    BIT2ME_INCLUDE_RAW_RESPONSE: z.string().optional().default("false"),
});

export type Config = z.infer<typeof envSchema> & {
    GATEWAY_URL: string;
    REQUEST_TIMEOUT: number;
    LOG_LEVEL: string;
    MAX_RETRIES: number;
    RETRY_BASE_DELAY: number;
    INCLUDE_RAW_RESPONSE: boolean;
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
        };

        // Log gateway URL only if custom (for QA/staging awareness)
        const isCustomGateway = gatewayUrl !== DEFAULT_GATEWAY_URL;
        if (isCustomGateway) {
            logger.info(`Using custom gateway: ${gatewayUrl}`);
        }

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

// For backward compatibility, export a getter
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
