import { smartRound, formatTimestamp, normalizePairResponse } from "../format.js";
import { asFiniteNumber, asRecord, asString, asTime, extractArrayData, firstDefined, isValidObject } from "./guards.js";
import type { EarnPositionMovementResponse, EarnMovementResponse, EarnMovementsSummaryResponse } from "../schemas.js";

export function mapEarnPositionMovementsResponse(raw: unknown): {
    total: number;
    movements: EarnPositionMovementResponse[];
} {
    if (isValidObject(raw) && Array.isArray(raw.data)) {
        return {
            total: asFiniteNumber(raw.total) || raw.data.length,
            movements: raw.data.map(mapSingleEarnPositionMovement),
        };
    }

    const txs = extractArrayData(raw);
    return {
        total: txs.length,
        movements: txs.map(mapSingleEarnPositionMovement),
    };
}

function mapSingleEarnPositionMovement(item: unknown): EarnPositionMovementResponse {
    const tx = asRecord(item);
    const dateValue = asTime(firstDefined(tx, "createdAt", "created_at", "date")) ?? "";
    const { date: created_at } = formatTimestamp(dateValue);

    let amountValue: string;
    let symbol: string;
    if (tx.amount && typeof tx.amount === "object") {
        const amount = asRecord(tx.amount);
        amountValue = asString(amount.value, "0");
        symbol = asString(amount.currency);
    } else {
        amountValue = asString(tx.amount, "0");
        symbol = asString(tx.currency);
    }

    const positionId = asString(firstDefined(tx, "walletId", "wallet_id"));
    return {
        id: asString(firstDefined(tx, "movementId", "id", "transactionId")),
        type: asString(tx.type, "deposit").toLowerCase() as EarnPositionMovementResponse["type"],
        symbol,
        amount: amountValue,
        created_at,
        position_id: positionId,
        wallet_id: positionId,
    };
}

export function mapEarnMovementsResponse(raw: unknown): { total: number; movements: EarnMovementResponse[] } {
    if (!isValidObject(raw)) {
        return { total: 0, movements: [] };
    }

    const movements = Array.isArray(raw.data) ? raw.data : [];
    return {
        total: raw.total != null ? asFiniteNumber(raw.total) : movements.length,
        movements: movements.map(mapSingleEarnMovement),
    };
}

function mapSingleEarnMovement(item: unknown): EarnMovementResponse {
    const tx = asRecord(item);
    const dateValue = asTime(firstDefined(tx, "createdAt", "created_at")) ?? "";
    const { date } = formatTimestamp(dateValue);
    const positionId = asString(firstDefined(tx, "walletId", "wallet_id"));
    const amount = asRecord(tx.amount);

    const movement: EarnMovementResponse = {
        id: asString(firstDefined(tx, "movementId", "id")),
        type: asString(tx.type, "deposit").toLowerCase() as EarnMovementResponse["type"],
        created_at: date,
        position_id: positionId,
        amount: {
            value: asString(amount.value, "0"),
            symbol: asString(amount.currency),
        },
        wallet_id: positionId,
    };

    if (tx.rate) {
        const rate = asRecord(tx.rate);
        const rateAmount = asRecord(rate.amount);
        movement.rate = {
            amount: {
                value: asString(rateAmount.value, "0"),
                symbol: asString(rateAmount.currency),
            },
            pair: normalizePairResponse(asString(rate.pair)),
        };
    }

    if (tx.convertedAmount) {
        const converted = asRecord(tx.convertedAmount);
        movement.converted_amount = {
            value: smartRound(asFiniteNumber(converted.value)).toString(),
            symbol: asString(converted.currency),
        };
    }

    if (tx.source) {
        const source = asRecord(tx.source);
        movement.source = {
            pocket_id: asString(firstDefined(source, "walletId", "wallet_id", "pocketId", "pocket_id")),
            symbol: asString(source.currency),
        };
    }

    if (tx.issuer) {
        const issuer = asRecord(tx.issuer);
        movement.issuer = {
            id: asString(issuer.id),
            name: asString(issuer.name),
            integrator: asString(issuer.integrator),
        };
    }

    return movement;
}

const EMPTY_SUMMARY: EarnMovementsSummaryResponse = {
    type: "",
    total_amount: "0",
    total_count: 0,
    symbol: "",
};

export function mapEarnMovementsSummaryResponse(raw: unknown): EarnMovementsSummaryResponse {
    if (raw === null || raw === undefined) {
        return { ...EMPTY_SUMMARY };
    }

    let data: ReturnType<typeof asRecord>;
    if (Array.isArray(raw)) {
        data = raw.length > 0 ? asRecord(raw[0]) : {};
    } else if (isValidObject(raw)) {
        data = raw;
    } else {
        return { ...EMPTY_SUMMARY };
    }

    return {
        type: asString(firstDefined(data, "type", "movementType")).toLowerCase(),
        total_amount: asString(firstDefined(data, "totalAmount", "total_amount", "total"), "0"),
        total_count: asFiniteNumber(firstDefined(data, "totalCount", "total_count", "count")),
        symbol: asString(firstDefined(data, "currency", "symbol")).toUpperCase(),
    };
}
