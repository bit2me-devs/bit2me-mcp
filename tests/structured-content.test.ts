import { describe, it, expect, vi } from "vitest";
import { attachStructuredContent } from "../src/utils/structured-content.js";
import { executeTool } from "../src/utils/tool-wrapper.js";
import { buildNeedsConfirmationResult } from "../src/utils/write-guards.js";

vi.mock("../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }),
}));

type TextToolResult = {
    content: { type: "text"; text: string }[];
    structuredContent?: Record<string, unknown>;
};

function textResult(payload: unknown): TextToolResult {
    return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    };
}

describe("attachStructuredContent", () => {
    it("attaches a parsed object as-is and keeps pretty JSON text", () => {
        const payload = { request: { id: "1" }, result: { ok: true } };
        const result = textResult(payload);
        const originalText = result.content[0].text;
        const wrapped = attachStructuredContent(result);
        expect(wrapped.content[0].text).toBe(originalText);
        expect(wrapped.structuredContent).toEqual(payload);
    });

    it("wraps a JSON array as { items }", () => {
        const wrapped = attachStructuredContent(textResult([1, 2, 3]));
        expect(wrapped.structuredContent).toEqual({ items: [1, 2, 3] });
    });

    it("wraps a JSON primitive as { result }", () => {
        const wrapped = attachStructuredContent(textResult(42));
        expect(wrapped.structuredContent).toEqual({ result: 42 });
    });

    it("leaves an existing structuredContent untouched", () => {
        const existing = { already: true };
        const result = { ...textResult({ parsed: true }), structuredContent: existing };
        const wrapped = attachStructuredContent(result);
        expect(wrapped.structuredContent).toBe(existing);
        expect(wrapped.content[0].text).toContain("parsed");
    });

    it("skips non-JSON text and results without content", () => {
        expect(attachStructuredContent({ content: [{ type: "text", text: "not-json" }] })).not.toHaveProperty(
            "structuredContent"
        );
        expect(attachStructuredContent({ sessionToken: "x" })).toEqual({ sessionToken: "x" });
    });
});

describe("buildNeedsConfirmationResult", () => {
    it("returns preview JSON without attaching structuredContent itself", () => {
        const result = buildNeedsConfirmationResult("pro_create_order", {
            pair: "BTC-USD",
            confirm: false,
            jwt: "secret",
        });
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.status).toBe("needs_confirmation");
        expect(parsed.proposed_args).not.toHaveProperty("jwt");
        expect(result).not.toHaveProperty("structuredContent");
    });
});

describe("executeTool structuredContent", () => {
    it("attaches structuredContent after a successful executor", async () => {
        const payload = { request: {}, result: { ok: true } };
        const result = await executeTool<TextToolResult>("general_health", {}, async () => textResult(payload));
        expect(result.structuredContent).toEqual(payload);
        expect(JSON.parse(result.content[0].text)).toEqual(payload);
    });

    it("attaches structuredContent on needs_confirmation", async () => {
        const result = await executeTool<TextToolResult>("pro_create_order", { pair: "BTC-USD" }, async () => {
            throw new Error("executor must not run");
        });
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.status).toBe("needs_confirmation");
        expect(result.structuredContent).toEqual(parsed);
    });
});
