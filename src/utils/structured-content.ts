/**
 * Attach MCP `structuredContent` from a tool result's `content[0].text`.
 *
 * Existing handlers emit pretty-printed JSON in `content[0].text`; tests parse
 * that string. This helper leaves the text untouched and adds a parsed object
 * when the payload is JSON.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstTextBlock(result: object): string | undefined {
    if (!("content" in result) || !Array.isArray(result.content) || result.content.length === 0) {
        return undefined;
    }
    const first: unknown = result.content[0];
    if (!first || typeof first !== "object" || !("text" in first)) {
        return undefined;
    }
    return typeof first.text === "string" ? first.text : undefined;
}

function structuredFromParsed(parsed: unknown): Record<string, unknown> | undefined {
    if (isPlainObject(parsed)) {
        return parsed;
    }
    if (Array.isArray(parsed)) {
        return { items: parsed };
    }
    if (parsed === undefined) {
        return undefined;
    }
    return { result: parsed };
}

/**
 * If `result` already has `structuredContent`, it is returned unchanged.
 * Otherwise parse `content[0].text` when it is JSON and attach an object.
 */
export function attachStructuredContent<T>(result: T): T & { structuredContent?: Record<string, unknown> } {
    if (!result || typeof result !== "object") {
        return result as T & { structuredContent?: Record<string, unknown> };
    }
    const rec = result as Record<string, unknown>;
    if (rec.structuredContent !== undefined) {
        return result as T & { structuredContent?: Record<string, unknown> };
    }
    const text = firstTextBlock(rec);
    if (text === undefined) {
        return result as T & { structuredContent?: Record<string, unknown> };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return result as T & { structuredContent?: Record<string, unknown> };
    }
    const structured = structuredFromParsed(parsed);
    if (structured === undefined) {
        return result as T & { structuredContent?: Record<string, unknown> };
    }
    return { ...rec, structuredContent: structured } as T & { structuredContent?: Record<string, unknown> };
}
