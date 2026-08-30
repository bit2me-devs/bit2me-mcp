import { isCategoryEnabled } from "../utils/enabled-categories.js";
import { prompts, type PromptDefinition } from "./index.js";

/** Hide Earn/Loan prompts when those categories are disabled. */
export function getPrompts(): PromptDefinition[] {
    return prompts.filter((prompt) => {
        if (prompt.name === "check_earn_opportunities") return isCategoryEnabled("earn");
        if (prompt.name === "loan_health_check") return isCategoryEnabled("loan");
        return true;
    });
}
