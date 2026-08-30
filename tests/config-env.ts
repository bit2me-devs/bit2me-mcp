import { resetConfigForTesting } from "../src/config.js";

export const mockEnv = (env: Record<string, string>) => {
    Object.keys(env).forEach((key) => {
        process.env[key] = env[key];
    });
};

export const clearEnv = () => {
    resetConfigForTesting();
    delete process.env.BIT2ME_API_KEY;
    delete process.env.BIT2ME_API_SECRET;
    delete process.env.BIT2ME_GATEWAY_URL;
    delete process.env.BIT2ME_REQUEST_TIMEOUT;
    delete process.env.BIT2ME_LOG_LEVEL;
    delete process.env.BIT2ME_MAX_RETRIES;
    delete process.env.BIT2ME_RETRY_BASE_DELAY;
    delete process.env.BIT2ME_INCLUDE_RAW_RESPONSE;
    delete process.env.BIT2ME_SESSION_COOKIE_NAME;
    delete process.env.MCP_HTTP_HOST;
    delete process.env.MCP_HTTP_PORT;
    delete process.env.MCP_HTTP_AUTH_MODE;
    delete process.env.MCP_HTTP_TRUST_PROXY;
    delete process.env.BIT2ME_ENABLED_CATEGORIES;
    delete process.env.AUDIT_LOG_PATH;
    delete process.env.LOG_FORMAT;
};
