/**
 * Whitelist of allowed shapes per prompt argument. Each entry is a
 * RegExp that the *trimmed* user input must satisfy before being
 * interpolated into the prompt body. Anything that does not match is
 * rejected up-front so that an attacker cannot smuggle prompt-
 * injection payloads through prompt arguments.
 *
 * Rules are deliberately tight:
 *  - `fiat`            three-letter ISO currency code.
 *  - `symbols`         comma-separated list of 1-10 char alnum tickers.
 *  - `year`            four-digit calendar year.
 *  - `asset`           1-10 char alnum ticker (BTC, ETH, ...).
 *  - `budget`          decimal amount followed by a 3-letter currency.
 *  - `horizon_weeks`   1-3 digit positive integer.
 *  - `tool`            snake_case MCP tool name (optional confirm_write).
 */
const PROMPT_ARG_RULES: Record<string, RegExp> = {
    fiat: /^[A-Za-z]{3}$/,
    // eslint-disable-next-line security/detect-unsafe-regex -- Safe: bounded {1,10} and {0,15}, no nested quantifiers, no backtracking risk.
    symbols: /^[A-Za-z0-9]{1,10}(,[A-Za-z0-9]{1,10}){0,15}$/,
    year: /^\d{4}$/,
    asset: /^[A-Za-z0-9]{1,10}$/,
    // eslint-disable-next-line security/detect-unsafe-regex -- Safe: every group is bounded, no overlapping alternations.
    budget: /^\d+(\.\d+)?\s+[A-Za-z]{3}$/,
    horizon_weeks: /^\d{1,3}$/,
    tool: /^[a-z][a-z0-9_]{1,64}$/,
};

/**
 * Validate (and trim) a prompt argument against its whitelist. Throws
 * a `RangeError` so the MCP runtime can surface a clean error to the
 * client instead of silently injecting tainted text into the prompt.
 */
function validatePromptArg(key: string, value: string): string {
    const trimmed = value.trim();
    const rule = PROMPT_ARG_RULES[key];
    if (!rule) {
        throw new RangeError(`Unknown prompt argument: ${key}`);
    }
    if (!rule.test(trimmed)) {
        throw new RangeError(`Invalid prompt argument: ${key}`);
    }
    return trimmed;
}

export function arg(args: Record<string, string> | undefined, key: string, fallback: string): string {
    const raw = args?.[key];
    if (!raw || !raw.trim()) {
        // Defaults are authored by us and are known-safe; we still run
        // them through the validator to catch typos in the source code.
        return validatePromptArg(key, fallback);
    }
    return validatePromptArg(key, raw);
}

/** Like `arg`, but omitted / blank values stay undefined (no fallback). */
export function optionalArg(args: Record<string, string> | undefined, key: string): string | undefined {
    const raw = args?.[key];
    if (!raw || !raw.trim()) {
        return undefined;
    }
    return validatePromptArg(key, raw);
}
