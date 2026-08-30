/**
 * Stable cache key. Objects are JSON.stringified with sorted keys.
 * One process, one operator (ADR 0003).
 */
export function cacheKey(parts: ReadonlyArray<string | number | boolean | object>): string {
    const serialised = parts.map((part) => {
        if (part === null || part === undefined) return "";
        if (typeof part === "object") return stableStringify(part);
        return String(part);
    });
    return serialised.join("::");
}

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}
