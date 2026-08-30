import { ValidationError } from "../errors.js";
import { normalizeStatus } from "../format.js";
import { asString, firstDefined, isValidObject } from "./guards.js";
import type { LoanCreateResponse, LoanIncreaseGuaranteeResponse, LoanPaybackResponse } from "../schemas.js";

export function mapLoanCreateResponse(raw: unknown): LoanCreateResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan create response structure");
    }

    return {
        id: asString(firstDefined(raw, "orderId", "id")),
        guarantee_symbol: asString(raw.guaranteeCurrency),
        guarantee_amount: asString(raw.guaranteeAmount, "0"),
        loan_symbol: asString(raw.loanCurrency),
        loan_amount: asString(raw.loanAmount, "0"),
        ltv: asString(raw.ltv, "0"),
        apr: asString(raw.apr, "0"),
        status: normalizeStatus(asString(raw.status)) || "active",
        created_at: asString(firstDefined(raw, "createdAt", "created_at")),
    };
}

export function mapLoanIncreaseGuaranteeResponse(raw: unknown): LoanIncreaseGuaranteeResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan increase guarantee response structure");
    }

    return {
        id: asString(firstDefined(raw, "orderId", "id")),
        new_guarantee_amount: asString(firstDefined(raw, "newGuaranteeAmount", "guaranteeAmount"), "0"),
        new_ltv: asString(firstDefined(raw, "newLtv", "ltv"), "0"),
        status: normalizeStatus(asString(raw.status)) || "updated",
        message: asString(raw.message, "Guarantee increased"),
    };
}

export function mapLoanPaybackResponse(raw: unknown): LoanPaybackResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan payback response structure");
    }

    return {
        id: asString(firstDefined(raw, "orderId", "id")),
        payback_amount: asString(firstDefined(raw, "paybackAmount", "amount"), "0"),
        remaining_amount: asString(firstDefined(raw, "remainingAmount", "remaining"), "0"),
        status: normalizeStatus(asString(raw.status)) || "updated",
        message: asString(raw.message, "Payment processed"),
    };
}
