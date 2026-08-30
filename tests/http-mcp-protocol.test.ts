import { beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { buildHttpServer } from "../src/transport/http.js";
import { SERVER_URI } from "../src/resources/index.js";

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

describe("HTTP MCP protocol", () => {
    it("negotiates a supported protocolVersion and defaults to latest", async () => {
        const pinned = await mcp("initialize", { protocolVersion: "2025-11-25" });
        expect((pinned.json() as { result: { protocolVersion: string } }).result.protocolVersion).toBe("2025-11-25");

        const fallback = await mcp("initialize", { protocolVersion: "nope" });
        expect((fallback.json() as { result: { protocolVersion: string } }).result.protocolVersion).toBe(
            LATEST_PROTOCOL_VERSION
        );
    });

    it("rejects invalid JSON-RPC envelopes with -32600", async () => {
        const badVer = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "1.0", method: "ping", id: 1 },
        });
        expect(badVer.statusCode).toBe(400);
        expect((badVer.json() as { error: { code: number } }).error.code).toBe(-32600);

        const noMethod = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "2.0", id: 1 },
        });
        expect((noMethod.json() as { error: { code: number } }).error.code).toBe(-32600);
    });

    it("treats id:null as a request and omitted id as a notification", async () => {
        const withNull = await mcp("tools/list", undefined, null);
        expect(withNull.statusCode).toBe(200);
        expect((withNull.json() as { result: { tools: unknown[] } }).result.tools.length).toBeGreaterThan(0);

        const noId = await app.inject({
            method: "POST",
            url: "/mcp",
            headers: { authorization: "Bearer test-token" },
            payload: { jsonrpc: "2.0", method: "tools/call", params: { name: "general_health" } },
        });
        expect(noId.statusCode).toBe(202);
        expect(noId.body).toBe("");
    });

    it("returns 200 for notifications/initialized when the client sent an id", async () => {
        const res = await mcp("notifications/initialized");
        expect(res.statusCode).toBe(200);
        expect((res.json() as { result: unknown }).result).toEqual({});
    });

    it("maps missing uri / unknown tool / missing prompt to -32602", async () => {
        const noUri = await mcp("resources/read", {});
        expect((noUri.json() as { error: { message: string } }).error.message).toMatch(/missing uri/);

        const unknown = await mcp("tools/call", { name: "not_a_real_tool" });
        expect((unknown.json() as { error: { code: number; message: string } }).error.code).toBe(-32602);
        expect((unknown.json() as { error: { message: string } }).error.message).toMatch(/Unknown tool/);

        const noPrompt = await mcp("prompts/get", {});
        expect((noPrompt.json() as { error: { message: string } }).error.message).toMatch(/missing prompt name/);

        const badPrompt = await mcp("prompts/get", { name: "nope" });
        expect((badPrompt.json() as { error: { message: string } }).error.message).toMatch(/Prompt not found/);
    });

    it("rejects non-string prompt arguments", async () => {
        const res = await mcp("prompts/get", { name: "analyze_portfolio", arguments: { fiat: 123 } });
        expect((res.json() as { error: { message: string } }).error.message).toMatch(/arguments.fiat must be a string/);
    });

    it("returns needs_confirmation for WRITE without confirm=true", async () => {
        const res = await mcp("tools/call", {
            name: "pro_create_order",
            arguments: { pair: "BTC-EUR", side: "buy", type: "market", amount: "1" },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as {
            result: { structuredContent?: { status?: string }; content: Array<{ text: string }> };
        };
        expect(body.result.structuredContent?.status ?? JSON.parse(body.result.content[0].text).status).toBe(
            "needs_confirmation"
        );
    });

    it("reads bit2me://server and lists tools on GET /mcp/tools", async () => {
        const server = await mcp("resources/read", { uri: SERVER_URI });
        const payload = JSON.parse(
            (server.json() as { result: { contents: Array<{ text: string }> } }).result.contents[0].text
        );
        expect(payload.name).toBe("bit2me-mcp-server");

        const listed = await app.inject({
            method: "GET",
            url: "/mcp/tools",
            headers: { authorization: "Bearer test-token" },
        });
        expect(listed.statusCode).toBe(200);
        expect((listed.json() as { tools: unknown[] }).tools.length).toBeGreaterThan(0);
    });

    it("returns JSON-RPC -32001 on unauthenticated POST /mcp", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/mcp",
            payload: { jsonrpc: "2.0", method: "ping", id: 1 },
        });
        expect(res.statusCode).toBe(401);
        expect((res.json() as { error: { code: number } }).error.code).toBe(-32001);
    });
});
