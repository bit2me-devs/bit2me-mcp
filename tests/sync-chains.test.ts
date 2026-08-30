/**
 * Hand-maintained marketing / docs / env lists must match the catalogue.
 * Generated landing JS/llms are gitignored. TOOLS_DOCUMENTATION.md is committed.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ENDPOINT_MAPPINGS } from "../scripts/docs-gen/endpoints.js";
import { handleGetPrompt, prompts } from "../src/prompts/index.js";
import { VALID_CATEGORY_IDS } from "../src/utils/enabled-categories.js";
import { annotationsForTool } from "../src/utils/tool-annotations.js";
import { getAllToolsMetadata } from "../src/utils/tool-metadata.js";
import { getAllTools, getToolCategory } from "../src/tools/registry.js";
import { writeRequiresConfirm } from "../src/utils/write-guards.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

interface Catalog {
    categories: Array<{ id: string; tools: Array<{ name: string }> }>;
}

const catalog = JSON.parse(read("data/tools.json")) as Catalog;
const toolNames = catalog.categories.flatMap((c) => c.tools.map((t) => t.name)).sort();
const countsById = Object.fromEntries(catalog.categories.map((c) => [c.id, c.tools.length]));
const totalTools = toolNames.length;
const tickList = VALID_CATEGORY_IDS.map((id) => `\`${id}\``).join(", ");

const README_CAT: Record<string, RegExp> = {
    general: /^- (\d+) General tools/m,
    broker: /^- (\d+) Broker /m,
    wallet: /^- (\d+) Wallet tools/m,
    pro: /^- (\d+) Pro Trading tools/m,
    earn: /^- (\d+) Earn \(Staking\) tools/m,
    loan: /^- (\d+) Loan tools/m,
};

function ints(source: string, re: RegExp): number[] {
    return [...source.matchAll(re)].map((m) => Number(m[1]));
}

function schemaEnvKeys(configSrc: string): string[] {
    return [...configSrc.matchAll(/^\s+((?:BIT2ME|MCP_HTTP)_[A-Z0-9_]+):/gm)].map((m) => m[1]!);
}

describe("sync chains — catalogue vs hand-edited docs", () => {
    delete process.env.BIT2ME_ENABLED_CATEGORIES;

    const readme = read("README.md");
    const landing = read("landing/index.html");
    const agents = read("AGENTS.md");
    const envExample = read(".env.example");
    const configSrc = read("src/config.ts");
    const configEnvSrc = read("tests/config-env.ts");

    it("ENDPOINT_MAPPINGS keys match data/tools.json names 1:1", () => {
        expect(Object.keys(ENDPOINT_MAPPINGS).sort()).toEqual(toolNames);
    });

    it("VALID_CATEGORY_IDS matches tools.json and the registry", () => {
        const fromJson = catalog.categories.map((c) => c.id).sort();
        const fromRegistry = [...new Set(getAllTools().map((t) => getToolCategory(t.name)))].sort();
        expect([...VALID_CATEGORY_IDS].sort()).toEqual(fromJson);
        expect(fromRegistry).toEqual(fromJson);
    });

    it("category ids appear in README, AGENTS, .env.example, and landing nav", () => {
        expect(readme).toContain(tickList);
        expect(agents).toContain(tickList);
        expect(envExample).toContain(`Valid ids: ${VALID_CATEGORY_IDS.join(", ")}`);
        for (const id of VALID_CATEGORY_IDS) {
            expect(landing, `#cat-${id}`).toContain(`href="#cat-${id}"`);
        }
    });

    it("README total and per-category counts match the catalogue", () => {
        expect(readme.match(/exposes \*\*(\d+) tools\*\*/)?.[1]).toBe(String(totalTools));
        for (const [id, re] of Object.entries(README_CAT)) {
            expect(readme.match(re)?.[1], `README ${id}`).toBe(String(countsById[id]));
        }
    });

    it("landing marketing counts match tools.json and the prompt catalogue", () => {
        const totals = ints(landing, /(\d+) [Tt]ools(?: [Aa]vailable| for| organized|<\/strong>)/g);
        expect(totals.length).toBeGreaterThan(0);
        expect(new Set(totals), "landing N tools").toEqual(new Set([totalTools]));

        const faq = landing.match(
            /(\d+) General Tools, (\d+) Broker \(Simple Trading\) Tools, (\d+) Wallet Tools, (\d+) Pro \(Advanced Trading\) Tools, (\d+) Earn \(Staking\) Tools, and (\d+) Loan Tools/
        );
        expect(faq!.slice(1).map(Number)).toEqual(VALID_CATEGORY_IDS.map((id) => countsById[id]));

        const promptCounts = ints(landing, /(\d+) [Rr]eady-to-use AI [Pp]rompts/g);
        expect(new Set(promptCounts)).toEqual(new Set([prompts.length]));
    });

    it("every catalogue prompt has a handler", () => {
        for (const prompt of prompts) {
            expect(() => handleGetPrompt(prompt.name)).not.toThrow();
        }
    });

    it("zod env keys are documented and cleared in config-env", () => {
        const keys = schemaEnvKeys(configSrc);
        expect(keys.length).toBeGreaterThan(8);
        for (const key of keys) {
            expect(envExample, `.env.example ${key}`).toContain(key);
            expect(configEnvSrc, `config-env ${key}`).toContain(`delete process.env.${key}`);
        }
        for (const extra of ["AUDIT_LOG_PATH", "LOG_FORMAT"]) {
            expect(envExample, extra).toContain(extra);
            expect(configEnvSrc, extra).toContain(`delete process.env.${extra}`);
        }
    });

    it("WRITE confirm exemptions match non-destructive annotations; cancels are idempotent", () => {
        for (const tool of getAllToolsMetadata()) {
            if (tool.type !== "WRITE") continue;
            const ann = annotationsForTool(tool);
            if (!writeRequiresConfirm(tool.name)) {
                expect(ann.destructiveHint, tool.name).toBe(false);
            }
            if (tool.name.includes("cancel")) {
                expect(ann.idempotentHint, tool.name).toBe(true);
            }
        }
    });
});
