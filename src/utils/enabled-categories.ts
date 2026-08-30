/**
 * Parse BIT2ME_ENABLED_CATEGORIES (comma-separated category ids).
 *
 * Unset / empty / whitespace → all known categories. Unknown tokens fail
 * closed at parse time. Reads process.env directly so listing/dispatch
 * never require API keys via getConfig().
 */

import { loadToolsMetadata } from "./tool-metadata.js";

export const VALID_CATEGORY_IDS = ["general", "broker", "wallet", "pro", "earn", "loan"] as const;

export type CategoryId = (typeof VALID_CATEGORY_IDS)[number];

const ALL_CATEGORIES: ReadonlySet<string> = new Set(VALID_CATEGORY_IDS);

function allCategories(): Set<string> {
    return new Set(VALID_CATEGORY_IDS);
}

/**
 * Parse a raw env value into the enabled category set.
 * Duplicates are ignored. Matching is case-sensitive and exact.
 */
export function parseEnabledCategories(raw: string | undefined | null): Set<string> {
    if (raw == null) {
        return allCategories();
    }
    const trimmed = raw.trim();
    if (trimmed === "") {
        return allCategories();
    }

    const tokens = trimmed
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0);

    if (tokens.length === 0) {
        return allCategories();
    }

    const enabled = new Set<string>();
    for (const token of tokens) {
        if (!ALL_CATEGORIES.has(token)) {
            throw new Error(
                `Unknown category "${token}" in BIT2ME_ENABLED_CATEGORIES. ` +
                    `Valid ids: ${VALID_CATEGORY_IDS.join(", ")}`
            );
        }
        enabled.add(token);
    }
    return enabled;
}

/** Current enabled set from `process.env.BIT2ME_ENABLED_CATEGORIES`. */
export function getEnabledCategories(): Set<string> {
    return parseEnabledCategories(process.env.BIT2ME_ENABLED_CATEGORIES);
}

export function isCategoryEnabled(category: string): boolean {
    return getEnabledCategories().has(category);
}

/**
 * Whether a catalogue tool is in an enabled category.
 * Unknown names are not enabled (same as a disabled category).
 */
export function isToolEnabled(toolName: string): boolean {
    for (const category of loadToolsMetadata().categories) {
        if (category.tools.some((tool) => tool.name === toolName)) {
            return getEnabledCategories().has(category.id);
        }
    }
    return false;
}
