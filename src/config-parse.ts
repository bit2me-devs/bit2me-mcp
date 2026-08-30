export const DEFAULT_GATEWAY_URL = "https://gateway.bit2me.com";
export const DEFAULT_SESSION_COOKIE_NAME = "b2m-atoken";
export const DEFAULT_HTTP_HOST = "127.0.0.1";
export const DEFAULT_HTTP_PORT = 3000;

/**
 * Allow plain HTTP only when targeting localhost / loopback.
 */
export function isAllowedGatewayUrl(value: string): boolean {
    if (value.startsWith("https://")) return true;
    if (value.startsWith("http://localhost")) return true;
    if (value.startsWith("http://127.")) return true;
    if (value.startsWith("http://[::1]")) return true;
    return false;
}

/**
 * Parse MCP_HTTP_TRUST_PROXY for Fastify. Default is false (ignore
 * X-Forwarded-*). Trust is opt-in.
 */
export function parseTrustProxy(input: string | undefined): boolean | string | string[] {
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
