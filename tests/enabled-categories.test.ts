import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseEnabledCategories, VALID_CATEGORY_IDS } from "../src/utils/enabled-categories.js";

const ALL = [...VALID_CATEGORY_IDS].sort();

describe("parseEnabledCategories", () => {
    it("enables all six categories when unset", () => {
        expect([...parseEnabledCategories(undefined)].sort()).toEqual(ALL);
        expect([...parseEnabledCategories(null)].sort()).toEqual(ALL);
    });

    it("enables all six categories when empty or whitespace", () => {
        expect([...parseEnabledCategories("")].sort()).toEqual(ALL);
        expect([...parseEnabledCategories("   ")].sort()).toEqual(ALL);
        expect([...parseEnabledCategories(" , , ")].sort()).toEqual(ALL);
    });

    it("parses a trimmed subset", () => {
        expect(parseEnabledCategories("wallet,broker")).toEqual(new Set(["wallet", "broker"]));
        expect(parseEnabledCategories(" wallet , broker ")).toEqual(new Set(["wallet", "broker"]));
    });

    it("deduplicates tokens", () => {
        expect(parseEnabledCategories("wallet,wallet,broker")).toEqual(new Set(["wallet", "broker"]));
    });

    it("is case-sensitive and fails closed on unknown ids", () => {
        expect(() => parseEnabledCategories("Wallet")).toThrow(/Wallet/);
        expect(() => parseEnabledCategories("trading")).toThrow(/trading/);
        expect(() => parseEnabledCategories("wallet,trading")).toThrow(
            /Valid ids: general, broker, wallet, pro, earn, loan/
        );
    });
});

describe("registry filter via BIT2ME_ENABLED_CATEGORIES", () => {
    beforeEach(() => {
        delete process.env.BIT2ME_ENABLED_CATEGORIES;
        vi.resetModules();
    });

    afterEach(() => {
        delete process.env.BIT2ME_ENABLED_CATEGORIES;
        vi.resetModules();
    });

    it("hides disabled categories and rejects dispatch", async () => {
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        vi.resetModules();
        const { getAllTools, dispatchTool } = await import("../src/tools/registry.js");
        const names = getAllTools().map((t) => t.name);
        expect(names.some((n) => n.startsWith("pro_"))).toBe(false);
        expect(names.some((n) => n.startsWith("earn_"))).toBe(false);
        expect(names.some((n) => n.startsWith("wallet_"))).toBe(true);
        expect(names.some((n) => n.startsWith("general_"))).toBe(true);
        await expect(dispatchTool("pro_create_order", {})).rejects.toMatchObject({ name: "ValidationError" });
        await expect(dispatchTool("pro_create_order", {})).rejects.toThrow(/pro_create_order/);
        await expect(dispatchTool("pro_create_order", {})).rejects.toThrow(/BIT2ME_ENABLED_CATEGORIES/);
    });

    it("keeps the Unknown tool error for names that are not registered", async () => {
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        vi.resetModules();
        const { dispatchTool } = await import("../src/tools/registry.js");
        await expect(dispatchTool("not_a_real_tool", {})).rejects.toThrow(/Unknown tool/);
    });

    it("does not describe a tool whose category is disabled", async () => {
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        vi.resetModules();
        const { handleGeneralTool } = await import("../src/tools/general.js");
        await expect(handleGeneralTool("general_describe_tool", { tool_name: "pro_create_order" })).rejects.toThrow(
            /Unknown tool: pro_create_order/
        );
    });

    it("hides Earn/Loan prompts when those categories are off", async () => {
        process.env.BIT2ME_ENABLED_CATEGORIES = "wallet,general";
        vi.resetModules();
        const { getPrompts } = await import("../src/prompts/visible.js");
        const names = getPrompts().map((p) => p.name);
        expect(names).not.toContain("check_earn_opportunities");
        expect(names).not.toContain("loan_health_check");
        expect(names).toContain("confirm_write");
        expect(names).toContain("analyze_portfolio");
        const { handleGetPrompt } = await import("../src/prompts/index.js");
        expect(() => handleGetPrompt("confirm_write", { tool: "loan_create" })).toThrow(
            /Invalid prompt argument: tool/
        );
    });
});
