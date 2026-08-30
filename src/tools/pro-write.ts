import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";
import {
    mapProOrderResponse,
    mapProCancelOrderResponse,
    mapProCancelAllOrdersResponse,
} from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { ProCreateOrderArgs, ProCancelOrderArgs, ProCancelAllOrdersArgs } from "../utils/args.js";
import { normalizePair, validateUUID, validatePair, validateAmount } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleProCreateOrder(args: Record<string, unknown>) {
    const params = args as unknown as ProCreateOrderArgs;
    if (!params.pair) {
        throw new ValidationError("pair is required", "pair");
    }
    if (!params.side) {
        throw new ValidationError("side is required", "side");
    }
    if (!params.type) {
        throw new ValidationError("type is required", "type");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    // Validate side against allowed values
    const validSides = ["buy", "sell"];
    const normalizedSide = params.side.toLowerCase();
    if (!validSides.includes(normalizedSide)) {
        throw new ValidationError(`side must be one of: ${validSides.join(", ")}`, "side", params.side);
    }
    // Validate type against allowed values
    const validTypes = ["limit", "market", "stop-limit"];
    const normalizedType = params.type.toLowerCase();
    if (!validTypes.includes(normalizedType)) {
        throw new ValidationError(`type must be one of: ${validTypes.join(", ")}`, "type", params.type);
    }
    // Validate price requirements based on order type
    if ((normalizedType === "limit" || normalizedType === "stop-limit") && !params.price) {
        throw new ValidationError("price is required for limit and stop-limit orders", "price");
    }
    if (normalizedType === "stop-limit" && !params.stop_price) {
        throw new ValidationError("stop_price is required for stop-limit orders", "stop_price");
    }
    validatePair(params.pair);
    validateAmount(params.amount, "amount");
    if (params.price) {
        validateAmount(params.price, "price");
    }
    if (params.stop_price) {
        validateAmount(params.stop_price, "stop_price");
    }
    const pair = normalizePair(params.pair);
    const body = {
        symbol: pair,
        side: normalizedSide,
        orderType: normalizedType,
        amount: params.amount,
        price: params.price,
        stopPrice: params.stop_price,
    };
    const requestContext: Record<string, unknown> = {
        pair,
        side: normalizedSide,
        type: normalizedType,
        amount: params.amount,
    };
    if (params.price) requestContext.price = params.price;
    if (params.stop_price) requestContext.stop_price = params.stop_price;
    const idempotencyKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest("POST", "/v1/trading/order", body, undefined, undefined, undefined, {
        idempotencyKey,
    });
    const optimized = mapProOrderResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProCancelOrder(args: Record<string, unknown>) {
    const params = args as unknown as ProCancelOrderArgs;
    if (!params.order_id) {
        throw new ValidationError("order_id is required", "order_id");
    }
    validateUUID(params.order_id, "order_id");
    const requestContext = {
        order_id: params.order_id,
    };
    const cancelIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "DELETE",
        `/v1/trading/order/${encodeURIComponent(params.order_id)}`,
        undefined,
        undefined,
        undefined,
        undefined,
        { idempotencyKey: cancelIdemKey }
    );
    const optimized = mapProCancelOrderResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProCancelAllOrders(args: Record<string, unknown>) {
    const params = args as unknown as ProCancelAllOrdersArgs;
    const queryParams: Record<string, unknown> = {};
    const requestContext: Record<string, unknown> = {};
    if (params.pair) {
        validatePair(params.pair);
        const pair = normalizePair(params.pair);
        queryParams.symbol = pair;
        requestContext.pair = pair;
    }
    // Endpoint is DELETE /v1/trading/order (singular) with query params
    const cancelAllIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest("DELETE", "/v1/trading/order", queryParams, undefined, undefined, undefined, {
        idempotencyKey: cancelAllIdemKey,
    });
    const optimized = mapProCancelAllOrdersResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
