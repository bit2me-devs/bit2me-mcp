import { describe, it, expect, vi } from "vitest";
import { CATALOG_URI, HEALTH_URI, SERVER_URI, listResources, readResource } from "../src/resources/index.js";

vi.mock("../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }),
}));

describe("stdio MCP resources", () => {
    it("lists health and server URIs", () => {
        const { resources } = listResources();
        const uris = resources.map((r) => r.uri).sort();
        expect(uris).toEqual([CATALOG_URI, HEALTH_URI, SERVER_URI].sort());
        expect(resources.every((r) => r.mimeType === "application/json")).toBe(true);
    });

    it("reads health as application/json without probing Bit2Me", () => {
        const result = readResource(HEALTH_URI);
        const block = result.contents[0];
        expect(block.uri).toBe(HEALTH_URI);
        expect(block.mimeType).toBe("application/json");
        const payload = JSON.parse(block.text);
        expect(payload.liveness.status).toBe("ok");
        expect(payload.readiness.status).toMatch(/^(ok|degraded)$/);
        expect(payload.liveness.timestamp).toEqual(expect.any(String));
    });

    it("reads server name and package version as application/json", () => {
        const result = readResource(SERVER_URI);
        const block = result.contents[0];
        expect(block.uri).toBe(SERVER_URI);
        expect(block.mimeType).toBe("application/json");
        const payload = JSON.parse(block.text);
        expect(payload.name).toBe("bit2me-mcp-server");
        expect(typeof payload.version).toBe("string");
        expect(payload.version.length).toBeGreaterThan(0);
    });

    it("reads catalog of enabled tools without probing Bit2Me", () => {
        const result = readResource(CATALOG_URI);
        const payload = JSON.parse(result.contents[0].text);
        expect(payload.enabled_categories).toEqual(["broker", "earn", "general", "loan", "pro", "wallet"]);
        expect(payload.tools.some((t: { name: string }) => t.name === "wallet_get_pockets")).toBe(true);
        expect(
            payload.tools.some(
                (t: { name: string; read_only: boolean }) => t.name === "pro_create_order" && t.read_only === false
            )
        ).toBe(true);
    });

    it("catalog honours BIT2ME_ENABLED_CATEGORIES", () => {
        const prev = process.env.BIT2ME_ENABLED_CATEGORIES;
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        try {
            const payload = JSON.parse(readResource(CATALOG_URI).contents[0].text);
            expect(payload.enabled_categories).toEqual(["general", "wallet"]);
            expect(payload.tools.every((t: { category: string }) => ["general", "wallet"].includes(t.category))).toBe(
                true
            );
            expect(payload.tools.some((t: { name: string }) => t.name === "pro_create_order")).toBe(false);
        } finally {
            if (prev === undefined) {
                delete process.env.BIT2ME_ENABLED_CATEGORIES;
            } else {
                process.env.BIT2ME_ENABLED_CATEGORIES = prev;
            }
        }
    });

    it("rejects unknown URIs", () => {
        expect(() => readResource("bit2me://unknown")).toThrow(/Unknown resource/);
    });
});
