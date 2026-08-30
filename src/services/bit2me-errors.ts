import type { AxiosError } from "axios";
import { logger } from "../utils/logger.js";
import {
    Bit2MeAPIError,
    RateLimitError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
} from "../utils/errors.js";
import { metricsCollector } from "../utils/metrics.js";
import type { CircuitBreaker } from "../utils/circuit-breaker.js";
import type { EndpointGroup } from "../utils/endpoint-groups.js";
import { calculateBackoffDelay } from "./bit2me-backoff.js";

export interface Bit2MeErrorContext {
    method: "GET" | "POST" | "DELETE";
    urlToSign: string;
    group: EndpointGroup;
    circuitBreaker: CircuitBreaker;
    effectiveRetries: number;
    attempt: number;
    baseDelay: number;
    idempotencyKey: string | undefined;
    useSessionAuth: boolean;
}

function axiosErrorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === "object" && "message" in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === "string" && message) return message;
    }
    if (data === undefined || data === null) return fallback;
    try {
        return JSON.stringify(data) || fallback;
    } catch {
        return fallback;
    }
}

function throwMappedError(
    status: number | undefined,
    errorMsg: string,
    urlToSign: string,
    useSessionAuth: boolean
): never {
    if (status === 429) {
        throw new RateLimitError(urlToSign);
    } else if (status === 401) {
        throw new AuthenticationError(urlToSign, useSessionAuth ? "jwt" : "api_key");
    } else if (status === 400) {
        throw new BadRequestError(urlToSign, errorMsg);
    } else if (status === 404) {
        throw new NotFoundError(urlToSign);
    } else {
        throw new Bit2MeAPIError(status || 500, errorMsg, urlToSign);
    }
}

/**
 * Axios catch: 4xx do not trip the breaker; 429 always retries;
 * POST/DELETE 5xx/network retry only when `idempotencyKey` is set.
 */
export async function handleBit2MeAxiosError<T>(
    error: unknown,
    ctx: Bit2MeErrorContext,
    retry: () => Promise<T>
): Promise<T> {
    const { method, urlToSign, group, circuitBreaker, effectiveRetries, attempt, baseDelay, useSessionAuth } = ctx;
    const idempotencyKey = ctx.idempotencyKey;

    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const errorMsg = axiosErrorMessage(axiosError.response?.data, axiosError.message);

    logger.error(`Bit2Me API Error: ${method} ${urlToSign}`, {
        status,
        message: errorMsg,
        endpoint: urlToSign,
    });
    logger.debug(`Bit2Me API Error: ${method} ${urlToSign}`, { status, endpoint: urlToSign });

    // 4xx are caller mistakes, not service failures. 429 is retried separately.
    const isServerError = !!status && status >= 500;
    const isConnectionError = !status;
    if (isServerError || isConnectionError) {
        circuitBreaker.recordFailure();
        metricsCollector.recordCircuitFailure(group);
    }

    const remainingRetries = effectiveRetries - attempt;
    const isRateLimited = status === 429;
    const isTransient = isRateLimited || isServerError || isConnectionError;
    const isMutating = method === "POST" || method === "DELETE";
    const canRetryNonRateLimit = !isMutating || !!idempotencyKey;
    const shouldRetry =
        remainingRetries > 0 && (isRateLimited || ((isServerError || isConnectionError) && canRetryNonRateLimit));

    if (shouldRetry) {
        const delay = calculateBackoffDelay(attempt, baseDelay);
        const reason = isRateLimited ? "rate limit" : isServerError ? `${status}` : "network";
        const metricReason: "rate_limit" | "server_error" | "network" = isRateLimited
            ? "rate_limit"
            : isServerError
              ? "server_error"
              : "network";
        metricsCollector.recordRetry(metricReason);
        logger.warn(
            `Bit2Me request transient failure (${reason}). Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${effectiveRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retry();
    }

    if (isTransient && !shouldRetry && isMutating && !idempotencyKey) {
        logger.warn(
            `Bit2Me ${method} ${urlToSign} failed transiently (${status ?? "network"}) but was not retried because no Idempotency-Key was provided`
        );
    }

    throwMappedError(status, errorMsg, urlToSign, useSessionAuth);
}
