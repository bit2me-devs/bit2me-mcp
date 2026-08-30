import { randomUUID } from "node:crypto";
import { ValidationError } from "./errors.js";

/**
 * Irreversible Pro / Earn / Loan writes. Broker quotes stay two-step
 * (quote → confirm) and do not use this flag.
 */
export const REQUIRES_CONFIRM = new Set([
    "pro_create_order",
    "pro_cancel_order",
    "pro_cancel_all_orders",
    "pro_deposit",
    "pro_withdraw",
    "earn_deposit",
    "earn_withdraw",
    "loan_create",
    "loan_increase_guarantee",
    "loan_payback",
]);

/**
 * WRITE tools that move funds must be called with `confirm: true` after
 * the user agrees. Prevents a one-shot LLM mutation.
 */
export function requireConfirm(args: Record<string, unknown> | undefined | null): void {
    if (args?.confirm !== true) {
        throw new ValidationError(
            "This write tool requires confirm=true after the user explicitly agrees. Do not execute until confirm is true.",
            "confirm",
            args?.confirm
        );
    }
}

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._\-:]+$/;
const IDEMPOTENCY_KEY_MAX = 128;

/** Reject CRLF / oversize keys before they are copied into Idempotency-Key. */
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

/**
 * Honour a caller-supplied key (stable across retries) or mint a UUID.
 * The tool wrapper stamps `args.idempotency_key` so handlers and audit share it.
 */
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
