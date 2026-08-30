import { MAX_BACKOFF_DELAY } from "../constants.js";

/**
 * Exponential backoff with AWS full jitter: uniform random in
 * `[0, cappedDelay]` instead of `cappedDelay + small_jitter`.
 *
 * Full jitter is better at preventing thundering-herd retry storms
 * after a synchronous outage recovers (AWS Architecture Blog,
 * "Exponential Backoff and Jitter"). Expected delay is `cappedDelay / 2`.
 */
export function calculateBackoffDelay(retryAttempt: number, baseDelay: number, maxDelay = MAX_BACKOFF_DELAY): number {
    const exponentialDelay = baseDelay * Math.pow(2, retryAttempt);
    const cappedDelay = Math.min(maxDelay, exponentialDelay);
    return Math.random() * cappedDelay;
}
