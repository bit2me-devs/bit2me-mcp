import { describe, it, expect, vi } from "vitest";
import { annotationsForTool } from "../src/utils/tool-annotations.js";
import { getToolMetadata, metadataToTool } from "../src/utils/tool-metadata.js";

vi.mock("../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }),
}));

const READ_OR_META = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_PROFORMA = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_CANCEL = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_DEFAULT = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
};

function expectAnnotations(name: string, expected: typeof READ_OR_META): void {
    const meta = getToolMetadata(name);
    expect(meta, name).toBeDefined();
    expect(annotationsForTool(meta!)).toEqual(expected);
    expect(metadataToTool(meta!).annotations).toEqual(expected);
}

describe("MCP tool annotations", () => {
    it("marks READ tools as read-only and idempotent", () => {
        expectAnnotations("wallet_get_pockets", READ_OR_META);
        expectAnnotations("general_health", READ_OR_META);
    });

    it("marks META tools as read-only and idempotent", () => {
        expectAnnotations("general_describe_tool", READ_OR_META);
    });

    it("marks broker quote proformas as non-destructive WRITE", () => {
        expectAnnotations("broker_quote_buy", WRITE_PROFORMA);
        expectAnnotations("broker_quote_sell", WRITE_PROFORMA);
        expectAnnotations("broker_quote_swap", WRITE_PROFORMA);
    });

    it("marks cancel tools as destructive but idempotent", () => {
        expectAnnotations("pro_cancel_order", WRITE_CANCEL);
        expectAnnotations("pro_cancel_all_orders", WRITE_CANCEL);
    });

    it("marks other WRITE tools as destructive and non-idempotent", () => {
        expectAnnotations("pro_create_order", WRITE_DEFAULT);
        expectAnnotations("broker_confirm_quote", WRITE_DEFAULT);
    });

    it("does not change name, description, or inputSchema", () => {
        const meta = getToolMetadata("wallet_get_pockets")!;
        const tool = metadataToTool(meta);
        expect(tool.name).toBe(meta.name);
        expect(tool.description).toBe(meta.description);
        expect(tool.inputSchema).toMatchObject(meta.inputSchema);
    });
});
