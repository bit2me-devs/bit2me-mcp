/**
 * HTTP credential guards on `executeTool`.
 *
 * When the HTTP transport has already authenticated the caller via
 * headers, `args.jwt` must not swap the session token.
 */

import { describe, it, expect, vi } from "vitest";
import { executeTool } from "../src/utils/tool-wrapper.js";
import { runWithContext, getSessionToken, getRequestApiKey } from "../src/utils/context.js";
import { logger } from "../src/utils/logger.js";

describe("executeTool — HTTP jwt override guard", () => {
    it("ignores args.jwt when the parent context already has an HTTP api_key", async () => {
        const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

        const observed = await runWithContext(
            {
                correlationId: "parent-ctx",
                startTime: Date.now(),
                apiKey: "caller-key",
                apiSecret: "caller-secret",
            },
            async () =>
                executeTool("dummy_tool", { jwt: "smuggled-jwt" }, async () => ({
                    sessionToken: getSessionToken(),
                    apiKey: getRequestApiKey(),
                }))
        );

        expect(observed.sessionToken).toBeUndefined();
        expect(observed.apiKey).toBe("caller-key");
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
                sessionToken: "header-session",
            },
            async () =>
                executeTool("dummy_tool", { jwt: "smuggled-jwt" }, async () => ({
                    sessionToken: getSessionToken(),
                }))
        );
        expect(observed.sessionToken).toBe("header-session");
    });

    it("still honours args.jwt under stdio transport (no parent context)", async () => {
        const observed = await executeTool("dummy_tool", { jwt: "user-supplied-jwt" }, async () => ({
            sessionToken: getSessionToken(),
        }));
        expect(observed.sessionToken).toBe("user-supplied-jwt");
    });
});
