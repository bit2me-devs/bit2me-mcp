import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false, API_KEY: "test", API_SECRET: "test" }),
}));

describe("HTTP MCP category allow-list", () => {
    afterEach(() => {
        delete process.env.BIT2ME_ENABLED_CATEGORIES;
        vi.resetModules();
    });

    it("hides disabled categories on tools/list, GET /mcp/tools, and prompts/list", async () => {
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        vi.resetModules();
        const { buildHttpServer } = await import("../src/transport/http.js");
        const app = await buildHttpServer({ authMode: "jwt" });
        await app.ready();

        const headers = { authorization: "Bearer test-token" };
        const list = await app.inject({
            method: "POST",
            url: "/mcp",
            headers,
            payload: { jsonrpc: "2.0", method: "tools/list", id: 1 },
        });
        const names = (list.json() as { result: { tools: Array<{ name: string }> } }).result.tools.map((t) => t.name);
        expect(names.some((n) => n.startsWith("pro_"))).toBe(false);
        expect(names.some((n) => n.startsWith("wallet_"))).toBe(true);

        const rest = await app.inject({ method: "GET", url: "/mcp/tools", headers });
        const restNames = (rest.json() as { tools: Array<{ name: string }> }).tools.map((t) => t.name);
        expect(restNames).toEqual(names);

        const prompts = await app.inject({
            method: "POST",
            url: "/mcp",
            headers,
            payload: { jsonrpc: "2.0", method: "prompts/list", id: 2 },
        });
        const promptNames = (prompts.json() as { result: { prompts: Array<{ name: string }> } }).result.prompts.map(
            (p) => p.name
        );
        expect(promptNames).not.toContain("check_earn_opportunities");
        expect(promptNames).not.toContain("loan_health_check");

        const disabled = await app.inject({
            method: "POST",
            url: "/mcp",
            headers,
            payload: {
                jsonrpc: "2.0",
                method: "tools/call",
                params: { name: "pro_create_order", arguments: {} },
                id: 3,
            },
        });
        expect((disabled.json() as { error: { message: string } }).error.message).toMatch(/BIT2ME_ENABLED_CATEGORIES/);
    });
});
