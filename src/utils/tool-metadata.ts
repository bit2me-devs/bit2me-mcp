/**
 * Utilities for loading and working with centralized tool metadata
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");

export interface ToolAttributes {
    requires_auth: boolean;
    scope?: "read" | "write";
    complexity?: "low" | "medium" | "high";
}

export interface ToolMetadata {
    name: string;
    description: string;
    type: "READ" | "WRITE" | "META";
    attributes?: ToolAttributes;
    inputSchema: {
        type: "object";
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
    exampleArgs: Record<string, any>;
    exampleResponse: any;
}

export interface CategoryMetadata {
    id: string;
    name: string;
    icon: string;
    description: string;
    tools: ToolMetadata[];
}

export interface ToolsMetadata {
    $schema: string;
    version: string;
    categories: CategoryMetadata[];
}

let cachedMetadata: ToolsMetadata | null = null;

/**
 * Load tools metadata from the central JSON file
 */
export function loadToolsMetadata(): ToolsMetadata {
    if (cachedMetadata) {
        return cachedMetadata;
    }

    try {
        const metadataPath = join(rootDir, "data", "tools.json");
        const content = readFileSync(metadataPath, "utf-8");
        cachedMetadata = JSON.parse(content) as ToolsMetadata;
        return cachedMetadata;
    } catch (error) {
        throw new Error(`Failed to load tools metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get all tools metadata
 */
export function getAllToolsMetadata(): ToolMetadata[] {
    const metadata = loadToolsMetadata();
    return metadata.categories.flatMap((cat) => cat.tools);
}

/**
 * Get tools metadata for a specific category
 */
export function getCategoryToolsMetadata(categoryId: string): ToolMetadata[] {
    const metadata = loadToolsMetadata();
    const category = metadata.categories.find((cat) => cat.id === categoryId);
    return category?.tools || [];
}

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(toolName: string): ToolMetadata | undefined {
    const metadata = loadToolsMetadata();
    for (const category of metadata.categories) {
        const tool = category.tools.find((t) => t.name === toolName);
        if (tool) return tool;
    }
    return undefined;
}

/**
 * Convert ToolMetadata to MCP Tool format
 * Includes custom attributes for internal use (requires_auth)
 */
export function metadataToTool(metadata: ToolMetadata): Tool {
    const tool: Tool = {
        name: metadata.name,
        description: metadata.description,
        inputSchema: metadata.inputSchema,
    };

    // Add custom attributes if present (for internal use, not part of MCP spec)
    if (metadata.attributes) {
        (tool as any).attributes = metadata.attributes;
    }

    return tool;
}

/**
 * Check if a tool requires authentication
 */
export function toolRequiresAuth(toolName: string): boolean {
    const metadata = getToolMetadata(toolName);
    return metadata?.attributes?.requires_auth ?? false;
}

/**
 * Get tool attributes
 */
export function getToolAttributes(toolName: string): ToolAttributes | undefined {
    const metadata = getToolMetadata(toolName);
    return metadata?.attributes;
}

/**
 * Get all tools in MCP Tool format for a category
 */
export function getCategoryTools(categoryId: string): Tool[] {
    const toolsMetadata = getCategoryToolsMetadata(categoryId);
    return toolsMetadata.map(metadataToTool);
}

/**
 * Get all tools in MCP Tool format
 */
export function getAllTools(): Tool[] {
    const metadata = loadToolsMetadata();
    return metadata.categories.flatMap((cat) => cat.tools.map(metadataToTool));
}

/**
 * Clear the metadata cache (useful for testing or hot-reloading)
 */
export function clearMetadataCache(): void {
    cachedMetadata = null;
}
