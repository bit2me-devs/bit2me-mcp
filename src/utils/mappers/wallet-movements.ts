import { ValidationError } from "../errors.js";
import { normalizeMovementStatus, normalizeMovementType } from "../format.js";
import { asRecord, asString, firstDefined, isValidArray, isValidObject } from "./guards.js";
import type { WalletMovementResponse, WalletMovementDetailsResponse } from "../schemas.js";

function mapParty(value: unknown): { amount: string; symbol: string; class: string } | undefined {
    if (!value) return undefined;
    const party = asRecord(value);
    return {
        amount: asString(party.amount),
        symbol: asString(party.currency),
        class: asString(party.class),
    };
}

function mapFee(value: unknown): { amount: string; symbol: string; class: string } | undefined {
    if (!value) return undefined;
    const fee = asRecord(value);
    const mercantile = asRecord(fee.mercantile);
    const network = asRecord(fee.network);
    return {
        amount: asString(firstDefined(mercantile, "amount") ?? network.amount, "0"),
        symbol: asString(firstDefined(mercantile, "currency") ?? network.currency),
        class: asString(firstDefined(mercantile, "class") ?? network.class),
    };
}

export function mapWalletMovementsResponse(raw: unknown): WalletMovementResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item, index) => {
        const tx = asRecord(item);
        const denomination = asRecord(tx.denomination);
        const type = asString(tx.type);
        return {
            id: asString(tx.id, `tx_${index}`),
            created_at: tx.date == null ? undefined : asString(tx.date),
            type: type ? type.toLowerCase() : undefined,
            subtype: asString(tx.subtype) || undefined,
            status: normalizeMovementStatus(asString(tx.status)),
            amount: asString(denomination.amount, "0"),
            symbol: asString(denomination.currency),
            origin: mapParty(tx.origin),
            destination: mapParty(tx.destination),
            fee: mapFee(tx.fee),
        };
    });
}

export function mapWalletMovementDetailsResponse(raw: unknown): WalletMovementDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid movement details response structure");
    }

    const origin = asRecord(raw.origin);
    const rate = asRecord(origin.rate);
    const nestedRate = asRecord(rate.rate);
    const originRate = firstDefined(nestedRate, "value") ?? rate.value;
    const denomination = asRecord(raw.denomination);
    const subtype = asString(raw.subtype);

    return {
        id: asString(raw.id),
        created_at: asString(raw.date),
        type: normalizeMovementType(asString(raw.type)) as
            "deposit" | "withdrawal" | "swap" | "purchase" | "transfer" | "fee" | "other",
        subtype: subtype ? subtype.toLowerCase() : undefined,
        status: normalizeMovementStatus(asString(raw.status)),
        amount: asString(denomination.amount, "0"),
        symbol: asString(denomination.currency),
        origin: raw.origin
            ? {
                  amount: asString(origin.amount),
                  symbol: asString(origin.currency),
                  class: asString(origin.class),
                  rate_applied: originRate !== undefined ? asString(originRate) : undefined,
              }
            : undefined,
        destination: raw.destination
            ? {
                  amount: asString(asRecord(raw.destination).amount),
                  symbol: asString(asRecord(raw.destination).currency),
                  class: asString(asRecord(raw.destination).class),
              }
            : undefined,
        fee: mapFee(raw.fee),
    };
}
