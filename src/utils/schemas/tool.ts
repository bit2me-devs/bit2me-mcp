import { Tool } from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// EXTENDED TOOL INTERFACE WITH DEPRECATION SUPPORT
// ============================================================================

/**
 * Extended Tool interface with deprecation support
 * Use this when defining tools that may be deprecated in the future
 */
export interface ExtendedTool extends Tool {
    /** Mark tool as deprecated - will show warning in description */
    deprecated?: boolean;
    /** Reason for deprecation and migration path */
    deprecationMessage?: string;
    /** Version when tool was deprecated */
    deprecatedSince?: string;
    /** Replacement tool name, if any */
    replacedBy?: string;
}

/**
 * Adds deprecation warning to tool description if deprecated
 * @param tool - The tool definition
 * @returns Tool with updated description if deprecated
 */
export function processToolDeprecation(tool: ExtendedTool): Tool {
    if (!tool.deprecated) {
        return tool;
    }

    const deprecationNotice = [
        "⚠️ DEPRECATED",
        tool.deprecatedSince ? `(since ${tool.deprecatedSince})` : "",
        tool.replacedBy ? `- Use ${tool.replacedBy} instead.` : "",
        tool.deprecationMessage || "",
    ]
        .filter(Boolean)
        .join(" ");

    return {
        ...tool,
        description: `${deprecationNotice} ${tool.description}`,
    };
}
