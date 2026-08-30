export type ToolResult = { content: Array<{ type: string; text: string }> };

export type NamedToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export function lookupHandler(
    handlers: Map<string, NamedToolHandler>,
    name: string,
    category: string
): NamedToolHandler {
    const handler = handlers.get(name);
    if (!handler) {
        throw new Error(`Unknown ${category} tool: ${name}`);
    }
    return handler;
}
