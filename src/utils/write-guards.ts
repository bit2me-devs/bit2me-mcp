import { randomUUID } from "node:crypto";
import { ValidationError } from "./errors.js";
import { getToolMetadata } from "./tool-metadata.js";

/**
 * Broker quotes are already two-step (proforma → confirm). Every other
 * WRITE tool requires an explicit confirm after the user agrees.
 */
const CONFIRM_EXEMPT_WRITE = new Set([
    "broker_quote_buy",
    "broker_quote_sell",
    "broker_quote_swap",
    "broker_confirm_quote",
]);

export function writeRequiresConfirm(name: string): boolean {
    if (CONFIRM_EXEMPT_WRITE.has(name)) return false;
    return getToolMetadata(name)?.type === "WRITE";
}

export function requireConfirm(args: Record<string, unknown> | undefined | null): void {
    if (args?.confirm !== true) {
        throw new ValidationError(
            "This write tool requires confirm=true after the user explicitly agrees. Do not execute until confirm is true.",
            "confirm",
            args?.confirm
        );
    }
}

const PREVIEW_OMIT = new Set(["confirm", "jwt", "idempotency_key"]);

/** Successful MCP result: no upstream call. The model should show this and wait. */
export function buildNeedsConfirmationResult(name: string, args: Record<string, unknown>) {
    const proposed_args: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
        if (!PREVIEW_OMIT.has(key)) proposed_args[key] = value;
    }
    return {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(
                    {
                        status: "needs_confirmation",
                        tool: name,
                        proposed_args,
                        next_step:
                            "Show this preview to the user. If they approve, call again with the same arguments and confirm=true. Do not set confirm=true unless the user agreed.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._\-:]+$/;
const IDEMPOTENCY_KEY_MAX = 128;

export function assertSafeIdempotencyKey(value: string): void {
    if (value.length === 0 || value.length > IDEMPOTENCY_KEY_MAX) {
        throw new ValidationError(
            `idempotency_key must be 1–${IDEMPOTENCY_KEY_MAX} characters`,
            "idempotency_key",
            value
        );
    }
    if (!IDEMPOTENCY_KEY_RE.test(value)) {
        throw new ValidationError(
            "idempotency_key must be URL-safe (letters, digits, . _ - :)",
            "idempotency_key",
            value
        );
    }
}

export function resolveIdempotencyKey(args: { idempotency_key?: unknown } | undefined | null): string {
    if (
        args &&
        typeof args === "object" &&
        typeof args.idempotency_key === "string" &&
        args.idempotency_key.length > 0
    ) {
        assertSafeIdempotencyKey(args.idempotency_key);
        return args.idempotency_key;
    }
    return randomUUID();
}
