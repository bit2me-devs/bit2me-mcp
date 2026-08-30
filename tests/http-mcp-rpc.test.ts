import { beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildHttpServer } from "../src/transport/http.js";
import { CATALOG_URI, HEALTH_URI, SERVER_URI } from "../src/resources/index.js";

vi.mock("../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false, API_KEY: "test", API_SECRET: "test" }),
}));

let app: FastifyInstance;

beforeAll(async () => {
    app = await buildHttpServer({ authMode: "jwt" });
    await app.ready();
});

function mcp(method: string, params?: Record<string, unknown>, id: number | null = 1) {
    return app.inject({
        method: "POST",
        url: "/mcp",
        headers: { authorization: "Bearer test-token" },
        payload: { jsonrpc: "2.0", method, params, id },
    });
}

describe("HTTP MCP JSON-RPC methods", () => {
    it("initialize advertises tools, prompts and resources", async () => {
        const res = await mcp("initialize");
        expect(res.statusCode).toBe(200);
        const body = res.json() as {
            result: { capabilities: Record<string, unknown>; serverInfo: { name: string } };
        };
        expect(body.result.capabilities).toEqual({ tools: {}, prompts: {}, resources: {} });
        expect(body.result.serverInfo.name).toBe("bit2me-mcp-server");
    });

    it("lists prompts including confirm_write", async () => {
        const res = await mcp("prompts/list");
        expect(res.statusCode).toBe(200);
        const names = (res.json() as { result: { prompts: Array<{ name: string }> } }).result.prompts.map(
            (p) => p.name
        );
        expect(names).toContain("confirm_write");
        expect(names).toContain("analyze_portfolio");
    });

    it("gets confirm_write and rejects a READ tool name", async () => {
        const ok = await mcp("prompts/get", { name: "confirm_write", arguments: { tool: "pro_create_order" } });
        expect(ok.statusCode).toBe(200);
        const text = (ok.json() as { result: { messages: Array<{ content: { text: string } }> } }).result.messages[0]
            .content.text;
        expect(text).toContain("pro_create_order");

        const bad = await mcp("prompts/get", { name: "confirm_write", arguments: { tool: "wallet_get_pockets" } });
        const err = bad.json() as { error: { code: number; message: string } };
        expect(err.error.code).toBe(-32602);
        expect(err.error.message).toMatch(/Invalid prompt argument: tool/);
    });

    it("lists and reads resources without calling Bit2Me", async () => {
        const listed = await mcp("resources/list");
        const uris = (listed.json() as { result: { resources: Array<{ uri: string }> } }).result.resources.map(
            (r) => r.uri
        );
        expect(uris).toEqual(expect.arrayContaining([CATALOG_URI, HEALTH_URI, SERVER_URI]));

        const health = await mcp("resources/read", { uri: HEALTH_URI });
        const payload = JSON.parse(
            (health.json() as { result: { contents: Array<{ text: string }> } }).result.contents[0].text
        );
        expect(payload.liveness.status).toBe("ok");

        const catalog = await mcp("resources/read", { uri: CATALOG_URI });
        const catalogPayload = JSON.parse(
            (catalog.json() as { result: { contents: Array<{ text: string }> } }).result.contents[0].text
        );
        expect(catalogPayload.tools.some((t: { name: string }) => t.name === "general_health")).toBe(true);

        const unknown = await mcp("resources/read", { uri: "bit2me://nope" });
        const err = unknown.json() as { error: { code: number; message: string } };
        expect(err.error.code).toBe(-32602);
        expect(err.error.message).toMatch(/Unknown resource/);
    });

    it("rejects JSON-RPC params that are not an object", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "2.0", method: "tools/list", params: ["nope"], id: 1 },
        });
        expect(res.statusCode).toBe(400);
        expect((res.json() as { error: { message: string } }).error.message).toMatch(/params must be an object/);
    });

    it("still rejects unknown methods", async () => {
        const res = await mcp("foo/bar");
        expect((res.json() as { error: { code: number } }).error.code).toBe(-32601);
    });

    it("answers notifications/initialized without a JSON-RPC body", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "2.0", method: "notifications/initialized" },
        });
        expect(res.statusCode).toBe(202);
        expect(res.body).toBe("");
    });

    it("answers ping without tools I/O", async () => {
        const res = await mcp("ping");
        expect(res.statusCode).toBe(200);
        expect((res.json() as { result: unknown }).result).toEqual({});
    });

    it("rejects prompts/get with non-object arguments", async () => {
        const res = await mcp("prompts/get", { name: "analyze_portfolio", arguments: ["EUR"] });
        expect((res.json() as { error: { message: string } }).error.message).toMatch(/arguments must be an object/);
    });

    it("rejects tools/call without a name or with non-object arguments", async () => {
        const missing = await mcp("tools/call", {});
        expect((missing.json() as { error: { code: number } }).error.code).toBe(-32602);

        const badArgs = await mcp("tools/call", { name: "general_health", arguments: ["nope"] });
        expect((badArgs.json() as { error: { message: string } }).error.message).toMatch(/arguments must be an object/);
    });

    it("calls general_health without probing Bit2Me", async () => {
        const res = await mcp("tools/call", { name: "general_health", arguments: {} });
        expect(res.statusCode).toBe(200);
        const text = (res.json() as { result: { content: Array<{ text: string }> } }).result.content[0].text;
        const body = JSON.parse(text) as { status?: string; liveness?: { status: string } };
        expect(body.status ?? body.liveness?.status).toMatch(/^(ok|degraded)$/);
    });
});
