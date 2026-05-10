/**
 * Cross-tenant confusion guards on `executeTool`.
 *
 * Audit finding High-1: when the HTTP transport has already
 * authenticated the caller via headers, an attacker should not be
 * able to swap in a different tenant's session token through the
 * MCP `args.jwt` field.
 */

import { describe, it, expect, vi } from "vitest";
import { executeTool } from "../src/utils/tool-wrapper.js";
import { runWithContext, getSessionToken, getRequestApiKey } from "../src/utils/context.js";
import { logger } from "../src/utils/logger.js";

describe("executeTool — tenant confusion guard", () => {
    it("ignores args.jwt when the parent context already has an HTTP api_key", async () => {
        const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

        const observed = await runWithContext(
            {
                correlationId: "parent-ctx",
                startTime: Date.now(),
                apiKey: "tenant-A-key",
                apiSecret: "tenant-A-secret",
                tenantId: "tenant-A",
            },
            async () =>
                executeTool("dummy_tool", { jwt: "stolen-tenant-B-jwt" }, async () => ({
                    sessionToken: getSessionToken(),
                    apiKey: getRequestApiKey(),
                }))
        );

        expect(observed.sessionToken).toBeUndefined();
        expect(observed.apiKey).toBe("tenant-A-key");
        expect(warnSpy).toHaveBeenCalledWith(
            "Ignoring args.jwt under authenticated HTTP context",
            expect.objectContaining({ tool: "dummy_tool" })
        );

        warnSpy.mockRestore();
    });

    it("ignores args.jwt when the parent context already has an HTTP session token", async () => {
        const observed = await runWithContext(
            {
                correlationId: "parent-ctx",
                startTime: Date.now(),
                sessionToken: "tenant-A-session",
                tenantId: "tenant-A",
            },
            async () =>
                executeTool("dummy_tool", { jwt: "stolen-tenant-B-jwt" }, async () => ({
                    sessionToken: getSessionToken(),
                }))
        );
        expect(observed.sessionToken).toBe("tenant-A-session");
    });

    it("still honours args.jwt under stdio transport (no parent context)", async () => {
        const observed = await executeTool("dummy_tool", { jwt: "user-supplied-jwt" }, async () => ({
            sessionToken: getSessionToken(),
        }));
        expect(observed.sessionToken).toBe("user-supplied-jwt");
    });
});
