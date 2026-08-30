/**
 * Runtime maps and wrappers that tools.json / docs cannot see.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { generalHandlers } from "../src/tools/general.js";
import { brokerHandlers } from "../src/tools/broker.js";
import { walletHandlers } from "../src/tools/wallet.js";
import { earnHandlers } from "../src/tools/earn.js";
import { loanHandlers } from "../src/tools/loan.js";
import { proHandlers } from "../src/tools/pro.js";
import { prompts } from "../src/prompts/index.js";
import { VALID_CATEGORY_IDS } from "../src/utils/enabled-categories.js";
import { RESOURCES, readResource } from "../src/resources/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

interface Catalog {
    categories: Array<{ id: string; tools: Array<{ name: string }> }>;
}

const catalog = JSON.parse(read("data/tools.json")) as Catalog;
const HANDLERS: Record<string, Map<string, unknown>> = {
    general: generalHandlers,
    broker: brokerHandlers,
    wallet: walletHandlers,
    earn: earnHandlers,
    loan: loanHandlers,
    pro: proHandlers,
};

const MCP_CORE = [
    "initialize",
    "ping",
    "tools/list",
    "tools/call",
    "prompts/list",
    "prompts/get",
    "resources/list",
    "resources/read",
];

describe("sync chains — handlers, Makefile, MCP, resources", () => {
    it("each category handler Map matches tools.json names 1:1", () => {
        expect(Object.keys(HANDLERS).sort()).toEqual([...VALID_CATEGORY_IDS].sort());
        for (const category of catalog.categories) {
            const documented = category.tools.map((t) => t.name).sort();
            const implemented = [...(HANDLERS[category.id]?.keys() ?? [])].sort();
            expect(implemented, category.id).toEqual(documented);
        }
    });

    it("Earn/Loan gated prompts exist in the catalogue", () => {
        const visible = read("src/prompts/visible.ts");
        const gated = [...visible.matchAll(/prompt\.name === "([a-z_]+)"/g)].map((m) => m[1]!);
        expect(gated.sort()).toEqual(["check_earn_opportunities", "loan_health_check"]);
        const names = new Set(prompts.map((p) => p.name));
        for (const name of gated) {
            expect(names.has(name), name).toBe(true);
        }
    });

    it("Makefile `pnpm run` targets exist in package.json scripts", () => {
        const make = read("Makefile");
        const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
        const invoked = [...make.matchAll(/pnpm run (\S+)/g)].map((m) => m[1]!);
        expect(invoked.length).toBeGreaterThan(5);
        for (const name of invoked) {
            expect(scripts[name], `make → pnpm run ${name}`).toBeDefined();
        }
    });

    it("HTTP JSON-RPC exposes the same core MCP methods README advertises", () => {
        const rpc = read("src/transport/mcp-rpc.ts");
        const cases = [...rpc.matchAll(/case "([^"]+)":/g)].map((m) => m[1]!);
        for (const method of MCP_CORE) {
            expect(cases, method).toContain(method);
        }
        const readme = read("README.md");
        expect(readme).toMatch(/tools\/\*/);
        expect(readme).toMatch(/prompts\/\*/);
        expect(readme).toMatch(/resources\/\*/);
    });

    it("every listed resource URI is readable", () => {
        for (const resource of RESOURCES) {
            expect(() => readResource(resource.uri)).not.toThrow();
        }
    });
});
