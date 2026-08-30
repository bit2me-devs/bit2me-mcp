import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export type ToolAnnotationType = "READ" | "WRITE" | "META";

export interface ToolAnnotationSource {
    name: string;
    type: ToolAnnotationType;
}

/** Broker proforma quotes are reversible until `broker_confirm_quote`. */
const QUOTE_PROFORMA = new Set(["broker_quote_buy", "broker_quote_sell", "broker_quote_swap"]);

/** Cancel is destructive for the order book but safe to retry. */
const IDEMPOTENT_CANCEL = new Set(["pro_cancel_order", "pro_cancel_all_orders"]);

const READ_OR_META: ToolAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_PROFORMA: ToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_CANCEL: ToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
};

const WRITE_DEFAULT: ToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
};

/**
 * MCP Tool `annotations` derived from catalogue `type` (and a few WRITE names).
 * Hints only — clients must not treat them as a security boundary.
 */
export function annotationsForTool(metadata: ToolAnnotationSource): ToolAnnotations {
    if (metadata.type === "READ" || metadata.type === "META") {
        return { ...READ_OR_META };
    }
    if (QUOTE_PROFORMA.has(metadata.name)) {
        return { ...WRITE_PROFORMA };
    }
    if (IDEMPOTENT_CANCEL.has(metadata.name)) {
        return { ...WRITE_CANCEL };
    }
    return { ...WRITE_DEFAULT };
}
