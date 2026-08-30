import { isToolEnabled } from "../utils/enabled-categories.js";
import { writeRequiresConfirm } from "../utils/write-guards.js";
import { optionalArg } from "./args.js";

/**
 * Two-step WRITE preview. `tool` must be a confirm-gated catalogue name
 * in an enabled category — READ, quotes, and disabled tools are rejected.
 */
export function handleConfirmWritePrompt(args?: Record<string, string>): string {
    const raw = optionalArg(args, "tool");
    if (raw && (!writeRequiresConfirm(raw) || !isToolEnabled(raw))) {
        throw new RangeError("Invalid prompt argument: tool");
    }
    const tool = raw ?? "the write tool";
    return [
        `Follow the two-step confirm flow for ${tool}. Do not execute a write until the user approves the preview.`,
        "1. Call with the intended arguments and omit confirm. Show the needs_confirmation preview.",
        "2. Do not set confirm to true unless the user agreed.",
        '3. After approval, recall with the same arguments, the same stamped idempotency_key, and confirm as boolean true. The string "true" is not valid.',
    ].join(" ");
}
