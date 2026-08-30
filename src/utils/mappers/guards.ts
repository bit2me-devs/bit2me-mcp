/**
 * Type guards and accessors for raw Bit2Me payloads (`unknown` at the boundary).
 */

export type RawRecord = Record<string, unknown>;

export function isValidAssetRecord(data: unknown): data is RawRecord {
    return typeof data === "object" && data !== null;
}

export function isValidArray(data: unknown): data is unknown[] {
    return Array.isArray(data);
}

export function isValidObject(data: unknown): data is RawRecord {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}

export function asRecord(value: unknown): RawRecord {
    return isValidObject(value) ? value : {};
}

export function asString(value: unknown, fallback = ""): string {
    if (value === undefined || value === null) return fallback;
    return String(value);
}

export function asFiniteNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const n = parseFloat(String(value ?? ""));
    return Number.isFinite(n) ? n : fallback;
}

export function firstDefined(obj: RawRecord, ...keys: string[]): unknown {
    for (const k of keys) {
        const v = obj[k];
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
}

export function asTime(value: unknown): number | string | undefined {
    if (typeof value === "number" || typeof value === "string") return value;
    return undefined;
}

/**
 * Unwraps array payloads: `[...]`, `{ data: [...] }`, `[{ data: [...] }]`, `[[...]]`.
 */
export function extractArrayData(raw: unknown): unknown[] {
    if (raw == null) return [];

    if (Array.isArray(raw)) {
        const first = raw[0];
        if (raw.length > 0 && Array.isArray(first)) return first;
        if (raw.length > 0 && isValidObject(first) && Array.isArray(first.data)) {
            return first.data;
        }
        return raw;
    }

    if (isValidObject(raw) && Array.isArray(raw.data)) {
        return raw.data;
    }

    return [];
}
