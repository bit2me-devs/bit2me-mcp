import { ValidationError } from "../errors.js";
import { normalizeStatus, smartRound } from "../format.js";
import { asFiniteNumber, asRecord, asString, firstDefined, isValidObject } from "./guards.js";
import type { FeeBreakdown, OperationConfirmationResponse, ProformaResponse } from "../schemas.js";

function feePart(node: ReturnType<typeof asRecord>): { amount: string; currency: string; percentage?: string } {
    const part: { amount: string; currency: string; percentage?: string } = {
        amount: asString(node.amount),
        currency: asString(node.currency),
    };
    if (node.percentage !== undefined) {
        part.percentage = asString(node.percentage);
    }
    return part;
}

export function mapProformaResponse(raw: unknown): ProformaResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid proforma response structure");
    }

    const dest = asRecord(raw.destination);
    const destRate = asRecord(dest.rate);
    const userRate = asRecord(asRecord(raw.userRate).rate);
    const destRateValue = destRate.value;
    const userRateValue = userRate.value;
    const rateValue = destRateValue || userRateValue || raw.rate || raw.exchangeRate || "0";

    const destRatePair = isValidObject(destRate.pair) ? destRate.pair : undefined;
    const userRatePair = isValidObject(userRate.pair) ? userRate.pair : undefined;
    const ratePair = destRatePair ?? userRatePair;
    const ratePairStr = ratePair ? `${asString(ratePair.base)}/${asString(ratePair.quote)}` : undefined;

    const feeBreakdown: FeeBreakdown = {};
    let totalFeeAmount = 0;
    let feeCurrency = "";
    const fee = asRecord(raw.fee);
    const network = asRecord(fee.network);
    const flip = asRecord(fee.flip);
    const teller = asRecord(fee.teller);
    const tellerFixed = asRecord(teller.fixed);
    const tellerVariable = asRecord(teller.variable);

    if (raw.fee) {
        if (network.amount) {
            feeBreakdown.network = feePart(network);
            totalFeeAmount += asFiniteNumber(network.amount);
            feeCurrency = feeCurrency || asString(network.currency);
        }
        if (flip.amount) {
            feeBreakdown.flip = feePart(flip);
            totalFeeAmount += asFiniteNumber(flip.amount);
            feeCurrency = feeCurrency || asString(flip.currency);
        }
        if (tellerFixed.amount) {
            feeBreakdown.teller_fixed = feePart(tellerFixed);
            totalFeeAmount += asFiniteNumber(tellerFixed.amount);
            feeCurrency = feeCurrency || asString(tellerFixed.currency);
        }
        if (tellerVariable.amount) {
            feeBreakdown.teller_variable = feePart(tellerVariable);
            totalFeeAmount += asFiniteNumber(tellerVariable.amount);
            feeCurrency = feeCurrency || asString(tellerVariable.currency);
        }
    }

    const origin = asRecord(raw.origin);
    return {
        proforma_id: asString(firstDefined(raw, "id", "proformaId")),
        origin_amount: asString(firstDefined(origin, "amount") ?? raw.originAmount, "0"),
        origin_symbol: asString(firstDefined(origin, "currency") ?? raw.originCurrency).toUpperCase(),
        destination_amount: asString(firstDefined(dest, "amount") ?? raw.destinationAmount, "0"),
        destination_symbol: asString(firstDefined(dest, "currency") ?? raw.destinationCurrency).toUpperCase(),
        rate: asString(rateValue, "0"),
        rate_pair: ratePairStr,
        total_fee: smartRound(totalFeeAmount).toString(),
        fee_currency: feeCurrency.toUpperCase(),
        fee_breakdown: Object.keys(feeBreakdown).length > 0 ? feeBreakdown : undefined,
        expires_at: asString(firstDefined(raw, "expirationTime", "expiresAt", "validUntil")),
    };
}

export function mapOperationConfirmationResponse(raw: unknown): OperationConfirmationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid operation confirmation response structure");
    }

    return {
        id: asString(firstDefined(raw, "id", "transactionId", "movementId")),
        status: normalizeStatus(asString(raw.status)) || "confirmed",
    };
}
