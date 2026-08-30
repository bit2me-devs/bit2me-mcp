import { getVisibleToolCatalog } from "../tools/registry.js";
import { getEnabledCategories } from "../utils/enabled-categories.js";

export const CATALOG_URI = "bit2me://catalog";

export function catalogPayload() {
    return {
        enabled_categories: [...getEnabledCategories()].sort(),
        tools: getVisibleToolCatalog(),
    };
}
