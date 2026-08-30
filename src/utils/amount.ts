import { Decimal } from "decimal.js";
import { ValidationError } from "./errors.js";

/**
 * Upper bound for a single trade / withdraw / loan amount. Larger values
 * are almost always an LLM typo (extra zeros, scientific notation).
 */
const MAX_AMOUNT = 1e12;

const DIGITS_ONLY = /^\d+$/;
const MAX_AMOUNT_DEC = new Decimal(MAX_AMOUNT);
/** Cap before Decimal parse — blocks oversized strings from the LLM. */
const MAX_AMOUNT_CHARS = 40;

/** Canonical decimal: no exponent, no leading zeros, no trailing dot. */
function isCanonicalDecimalString(value: string): boolean {
    const dot = value.indexOf(".");
    const intPart = dot === -1 ? value : value.slice(0, dot);
    const fracPart = dot === -1 ? null : value.slice(dot + 1);
    if (intPart.length === 0 || !DIGITS_ONLY.test(intPart)) return false;
    if (intPart.length > 1 && intPart.startsWith("0")) return false;
    if (fracPart !== null && (fracPart.length === 0 || !DIGITS_ONLY.test(fracPart))) return false;
    return value.indexOf(".", dot + 1) === -1;
}

/**
 * Validate a monetary amount with decimal.js (never raw JS number math).
 * Rejects zero, negatives, partial junk (`10abc`) and scientific notation.
 */
export function validateAmount(amount: string | number, name: string = "amount"): void {
    if (amount === undefined || amount === null) {
        throw new ValidationError(`${name} is required`, name, amount);
    }

    let value: Decimal;
    if (typeof amount === "number") {
        if (!Number.isFinite(amount)) {
            throw new ValidationError(`${name} must be a finite number`, name, amount);
        }
        value = new Decimal(amount);
    } else if (typeof amount === "string") {
        const trimmed = amount.trim();
        if (trimmed.length > MAX_AMOUNT_CHARS) {
            throw new ValidationError(`${name} exceeds ${MAX_AMOUNT_CHARS} characters`, name, amount);
        }
        if (trimmed === "" || !isCanonicalDecimalString(trimmed)) {
            throw new ValidationError(
                `${name} must be a canonical positive decimal (e.g. "10.5"), not "${amount}"`,
                name,
                amount
            );
        }
        value = new Decimal(trimmed);
    } else {
        throw new ValidationError(`${name} must be a string or number`, name, amount);
    }

    if (!value.isFinite() || value.lte(0)) {
        throw new ValidationError(`${name} must be a valid positive number`, name, amount);
    }
    if (value.gt(MAX_AMOUNT_DEC)) {
        throw new ValidationError(
            `${name} (${amount}) exceeds the maximum allowed value of ${MAX_AMOUNT}`,
            name,
            amount
        );
    }
}
