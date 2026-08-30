import { ValidationError } from "../errors.js";
import { normalizeStatus, normalizeMovementStatus } from "../format.js";
import { asFiniteNumber, asString, firstDefined, isValidObject } from "./guards.js";
import type {
    ProDepositResponse,
    ProWithdrawResponse,
    ProCancelOrderResponse,
    ProCancelAllOrdersResponse,
} from "../schemas.js";

export function mapProDepositResponse(raw: unknown): ProDepositResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro deposit response structure");
    }

    return {
        id: asString(firstDefined(raw, "id", "transactionId")),
        symbol: asString(raw.currency).toUpperCase(),
        amount: asString(raw.amount, "0"),
        status: normalizeMovementStatus(asString(raw.status)),
        message: asString(raw.message, "Deposit successful"),
    };
}

export function mapProWithdrawResponse(raw: unknown): ProWithdrawResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro withdraw response structure");
    }

    return {
        id: asString(firstDefined(raw, "id", "transactionId")),
        symbol: asString(raw.currency).toUpperCase(),
        amount: asString(raw.amount, "0"),
        status: normalizeMovementStatus(asString(raw.status)),
        message: asString(raw.message, "Withdrawal successful"),
    };
}

export function mapProCancelOrderResponse(raw: unknown): ProCancelOrderResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid Pro cancel order response structure");
    }

    return {
        id: asString(firstDefined(raw, "id", "orderId")),
        status: normalizeStatus(asString(raw.status)) || "cancelled",
        message: asString(raw.message, "Order cancelled"),
    };
}

export function mapProCancelAllOrdersResponse(raw: unknown): ProCancelAllOrdersResponse {
    if (!isValidObject(raw)) {
        return { cancelled: 0, message: "No orders cancelled" };
    }

    const cancelled = asFiniteNumber(firstDefined(raw, "cancelled", "count"));
    return {
        cancelled,
        message: asString(raw.message, `${asFiniteNumber(raw.cancelled)} orders cancelled`),
    };
}
