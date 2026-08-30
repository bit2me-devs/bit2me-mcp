import type { AxiosRequestConfig } from "axios";
import { getGatewayUrl } from "../config.js";
import { PACKAGE_VERSION } from "../package-version.js";
import { flattenScalarParams, generateSignature, nextNonce } from "./bit2me-sign.js";
import { assertSafeIdempotencyKey } from "../utils/write-guards.js";

/**
 * Identify outbound traffic with the project's User-Agent. Do not
 * impersonate a browser — TOS / fraud-detection implications.
 */
const USER_AGENT = `bit2me-mcp/${PACKAGE_VERSION} (+https://mcp.bit2me.com)`;

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = 5 * 1024 * 1024;

export interface Bit2MeBuildInput {
    method: "GET" | "POST" | "DELETE";
    endpoint: string;
    params: Record<string, unknown> | undefined;
    timeout: number;
    apiKey: string;
    apiSecret: string;
    resolvedSessionToken: string | undefined;
    idempotencyKey: string | undefined;
    sessionCookieName: string;
    preflightFlatParams: Record<string, string> | undefined;
}

export interface Bit2MeBuiltRequest {
    requestConfig: AxiosRequestConfig;
    urlToSign: string;
    signatureData: unknown;
    useSessionAuth: boolean;
}

export function buildBit2MeAxiosConfig(input: Bit2MeBuildInput): Bit2MeBuiltRequest {
    const {
        method,
        endpoint,
        params,
        timeout,
        apiKey,
        apiSecret,
        resolvedSessionToken,
        idempotencyKey,
        sessionCookieName,
        preflightFlatParams,
    } = input;

    const nonce = nextNonce();
    let urlToSign = endpoint;
    const useSessionAuth = !!resolvedSessionToken;

    let baseHeaders: Record<string, string>;
    if (useSessionAuth) {
        baseHeaders = {
            Cookie: `${sessionCookieName}=${resolvedSessionToken}`,
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
        };
    } else {
        baseHeaders = {
            "x-api-key": apiKey,
            "x-nonce": nonce.toString(),
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        };
    }

    if (idempotencyKey) {
        assertSafeIdempotencyKey(idempotencyKey);
        baseHeaders["Idempotency-Key"] = idempotencyKey;
    }

    const requestConfig: AxiosRequestConfig = {
        method,
        timeout,
        headers: baseHeaders,
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_REQUEST_BYTES,
        maxRedirects: 0,
    };

    let signatureData = undefined;

    if (method === "GET" && params && Object.keys(params).length > 0) {
        const flat = preflightFlatParams ?? flattenScalarParams(params);
        const queryString = new URLSearchParams(flat).toString();
        urlToSign = `${endpoint}?${queryString}`;
        // Do NOT use requestConfig.params — Axios would re-encode differently.
        requestConfig.url = `${getGatewayUrl()}${urlToSign}`;
    } else if ((method === "POST" || method === "DELETE") && params) {
        requestConfig.url = `${getGatewayUrl()}${endpoint}`;
        requestConfig.data = JSON.stringify(params);
        signatureData = params;
    } else {
        requestConfig.url = `${getGatewayUrl()}${endpoint}`;
    }

    if (!useSessionAuth) {
        const signature = generateSignature(nonce, urlToSign, signatureData, apiSecret);
        if (requestConfig.headers) {
            requestConfig.headers["api-signature"] = signature;
        }
    }

    return { requestConfig, urlToSign, signatureData, useSessionAuth };
}
