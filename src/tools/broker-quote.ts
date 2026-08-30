import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";
import { postWalletProforma } from "./broker-proforma.js";
import { memoizePerRequest } from "../utils/request-cache.js";
import { mapProformaResponse, mapOperationConfirmationResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import {
    WalletBuyCryptoArgs,
    WalletSellCryptoArgs,
    WalletSwapCryptoArgs,
    WalletConfirmOperationArgs,
} from "../utils/args.js";
import { normalizeSymbol, validateUUID, validateAmount } from "../utils/format.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

async function getAllPocketsForRequest(): Promise<unknown[]> {
    const data = await memoizePerRequest("/v1/wallet/pocket", () => bit2meRequest("GET", "/v1/wallet/pocket", {}));
    return Array.isArray(data) ? (data as unknown[]) : [];
}

function pocketById(pockets: unknown[], id: string): Record<string, unknown> | undefined {
    for (const p of pockets) {
        if (!p || typeof p !== "object") continue;
        const rec = p as Record<string, unknown>;
        if (rec.id === id) return rec;
    }
    return undefined;
}

export async function handleBrokerQuoteBuy(args: Record<string, unknown>) {
    const params = args as unknown as WalletBuyCryptoArgs;
    if (!params.origin_pocket_id) {
        throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
    }
    if (!params.destination_pocket_id) {
        throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    validateUUID(params.origin_pocket_id, "origin_pocket_id");
    validateUUID(params.destination_pocket_id, "destination_pocket_id");
    validateAmount(params.amount, "amount");

    const allPockets = await getAllPocketsForRequest();
    const originPocket = pocketById(allPockets, params.origin_pocket_id);
    const originCurrency = originPocket && typeof originPocket.currency === "string" ? originPocket.currency : "";

    if (!originPocket || !originCurrency) {
        throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
    }

    // API format: pocket + destination (without operation field)
    // Amount must be string according to swagger docs
    const body = {
        pocket: params.origin_pocket_id,
        destination: { pocket: params.destination_pocket_id },
        amount: params.amount,
        currency: normalizeSymbol(originCurrency),
    };
    const requestContext = {
        origin_pocket_id: params.origin_pocket_id,
        destination_pocket_id: params.destination_pocket_id,
        amount: params.amount,
    };
    const data = await postWalletProforma(body, args);
    const optimized = mapProformaResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleBrokerQuoteSell(args: Record<string, unknown>) {
    const params = args as unknown as WalletSellCryptoArgs;
    if (!params.origin_pocket_id) {
        throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
    }
    if (!params.destination_pocket_id) {
        throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    validateUUID(params.origin_pocket_id, "origin_pocket_id");
    validateUUID(params.destination_pocket_id, "destination_pocket_id");
    validateAmount(params.amount, "amount");

    const allPockets = await getAllPocketsForRequest();
    const originPocket = pocketById(allPockets, params.origin_pocket_id);
    const originCurrency = originPocket && typeof originPocket.currency === "string" ? originPocket.currency : "";

    if (!originPocket || !originCurrency) {
        throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
    }

    // API format: pocket + destination (without operation field)
    // Amount must be string according to swagger docs
    const body = {
        pocket: params.origin_pocket_id,
        destination: { pocket: params.destination_pocket_id },
        amount: params.amount,
        currency: normalizeSymbol(originCurrency),
    };
    const requestContext = {
        origin_pocket_id: params.origin_pocket_id,
        destination_pocket_id: params.destination_pocket_id,
        amount: params.amount,
    };
    const data = await postWalletProforma(body, args);
    const optimized = mapProformaResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleBrokerQuoteSwap(args: Record<string, unknown>) {
    const params = args as unknown as WalletSwapCryptoArgs;
    if (!params.origin_pocket_id) {
        throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
    }
    if (!params.destination_pocket_id) {
        throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    validateUUID(params.origin_pocket_id, "origin_pocket_id");
    validateUUID(params.destination_pocket_id, "destination_pocket_id");
    validateAmount(params.amount, "amount");

    const allPockets = await getAllPocketsForRequest();
    const originPocket = pocketById(allPockets, params.origin_pocket_id);
    const originCurrency = originPocket && typeof originPocket.currency === "string" ? originPocket.currency : "";

    if (!originPocket || !originCurrency) {
        throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
    }

    // API format for swap: pocket + destination + type + userCurrency
    // Amount must be string according to swagger docs
    const body = {
        pocket: params.origin_pocket_id,
        destination: { pocket: params.destination_pocket_id },
        amount: params.amount,
        currency: normalizeSymbol(originCurrency),
        type: "SEA",
        userCurrency: "EUR",
    };
    const requestContext = {
        origin_pocket_id: params.origin_pocket_id,
        destination_pocket_id: params.destination_pocket_id,
        amount: params.amount,
    };
    const data = await postWalletProforma(body, args);
    const optimized = mapProformaResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleBrokerConfirmQuote(args: Record<string, unknown>) {
    const params = args as unknown as WalletConfirmOperationArgs;
    if (!params.proforma_id) {
        throw new ValidationError("proforma_id is required", "proforma_id");
    }
    validateUUID(params.proforma_id, "proforma_id");
    const requestContext = {
        proforma_id: params.proforma_id,
    };
    const body = { proforma: params.proforma_id };
    const idempotencyKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest("POST", "/v1/wallet/transaction", body, undefined, undefined, undefined, {
        idempotencyKey,
    });
    const optimized = mapOperationConfirmationResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
