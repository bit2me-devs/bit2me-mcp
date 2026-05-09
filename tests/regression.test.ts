/**
 * Public-API regression suite.
 *
 * The Phase 2 refactor is internal: it MUST NOT change the shape of the
 * public tool catalog. This suite enforces that contract by checking that:
 *
 *  1. Every entry in `data/tools.json` is also present (with byte-identical
 *     `name`, `description`, and `inputSchema`) in the in-memory registry.
 *  2. The registry doesn't expose any tool that isn't documented in
 *     `data/tools.json`.
 *
 * If a tool is intentionally added/removed, the JSON file must be updated
 * in the same PR — that's the trade-off, and it's explicit by design.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { getAllTools } from "../src/tools/registry.js";

const here = dirname(fileURLToPath(import.meta.url));
const toolsJsonPath = join(here, "..", "data", "tools.json");

interface DocumentedTool {
    name: string;
    description: string;
    inputSchema: unknown;
}

interface DocumentedCatalog {
    categories: Array<{ id: string; tools: DocumentedTool[] }>;
}

const raw = JSON.parse(readFileSync(toolsJsonPath, "utf-8")) as DocumentedCatalog;
const documentedTools: DocumentedTool[] = raw.categories.flatMap((c) => c.tools);

describe("Public API — tool catalog regression", () => {
    const registered = getAllTools();
    const documentedByName = new Map(documentedTools.map((t) => [t.name, t]));
    const registeredByName = new Map(registered.map((t) => [t.name, t]));

    it("registry exposes the same tool names as data/tools.json", () => {
        const docNames = [...documentedByName.keys()].sort();
        const regNames = [...registeredByName.keys()].sort();
        expect(regNames).toEqual(docNames);
    });

    it.each([...documentedByName.keys()])(
        "tool '%s' has the same description as data/tools.json",
        (name) => {
            const doc = documentedByName.get(name)!;
            const reg = registeredByName.get(name)!;
            expect(reg.description).toBe(doc.description);
        }
    );

    it.each([...documentedByName.keys()])(
        "tool '%s' has the same inputSchema as data/tools.json (modulo runtime jwt)",
        (name) => {
            const doc = documentedByName.get(name)!;
            const reg = registeredByName.get(name)!;
            // The runtime registry enriches private tools with an optional
            // `jwt` argument for session-based auth. The documented schema
            // in `data/tools.json` is the *source of truth* without that
            // synthetic field, so we strip it before comparing.
            const stripJwt = (schema: unknown): unknown => {
                if (!schema || typeof schema !== "object") return schema;
                const cloned = JSON.parse(JSON.stringify(schema)) as {
                    properties?: Record<string, unknown>;
                };
                if (cloned.properties && "jwt" in cloned.properties) {
                    delete cloned.properties.jwt;
                }
                return cloned;
            };
            expect(JSON.stringify(stripJwt(reg.inputSchema))).toBe(JSON.stringify(doc.inputSchema));
        }
    );
});
