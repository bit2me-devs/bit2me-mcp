import { smartRound, normalizeStatus, normalizeMovementStatus } from "../format.js";
import { asFiniteNumber, asRecord, asString, firstDefined, isValidArray, isValidObject } from "./guards.js";
import type { LoanOrderResponse, LoanMovementResponse } from "../schemas.js";

export function mapLoanOrdersResponse(raw: unknown): LoanOrderResponse[] {
    if (!isValidObject(raw) || !Array.isArray(raw.data)) {
        return [];
    }

    return raw.data.map((item) => {
        const loan = asRecord(item);
        return {
            id: asString(loan.orderId),
            status: normalizeStatus(asString(loan.status)) as "active" | "completed" | "expired",
            guarantee_symbol: asString(loan.guaranteeCurrency).toUpperCase(),
            guarantee_amount: asString(loan.guaranteeAmount, "0"),
            guarantee_amount_fiat: smartRound(asFiniteNumber(loan.guaranteeAmountConverted)).toString(),
            loan_symbol: asString(loan.loanCurrency).toUpperCase(),
            loan_amount: asString(loan.loanAmount, "0"),
            loan_original_amount: asString(loan.loanOriginalAmount, "0"),
            loan_amount_fiat: smartRound(asFiniteNumber(loan.loanAmountConverted)).toString(),
            ltv: asString(loan.ltv, "0"),
            apr: asString(loan.apr, "0"),
            interest_amount: asString(loan.interestAmount, "0"),
            remaining_amount: asString(loan.remainingAmount, "0"),
            payback_amount: asString(loan.paybackAmount, "0"),
            created_at: asString(loan.createdAt),
            started_at: asString(loan.startedAt),
            expires_at: asString(loan.expiresAt),
        };
    });
}

function formatFiat(value: unknown): string {
    const num = asFiniteNumber(value);
    return num.toFixed(2);
}

function formatLtv(value: unknown): string {
    return formatFiat(value);
}

export function mapLoanMovementsResponse(raw: unknown): LoanMovementResponse[] {
    let movements: unknown[] = [];
    if (isValidObject(raw) && Array.isArray(raw.data)) {
        movements = raw.data;
    } else if (isValidArray(raw)) {
        movements = raw;
    } else {
        return [];
    }

    return movements.map((item) => {
        const tx = asRecord(item);
        const payload = asRecord(tx.payload);
        const loanAmount = asRecord(payload.loanAmount);
        const guaranteeAmount = asRecord(payload.guaranteeAmount);

        return {
            id: asString(firstDefined(tx, "movementId", "id")),
            order_id: asString(tx.orderId),
            type: asString(tx.type, "approve") as "approve" | "repay" | "liquidate" | "interest",
            status: normalizeMovementStatus(asString(tx.status)),
            loan: {
                amount: asString(loanAmount.value, "0"),
                symbol: asString(loanAmount.currency).toUpperCase(),
                amount_fiat: formatFiat(loanAmount.converted),
            },
            guarantee: {
                amount: asString(guaranteeAmount.value, "0"),
                symbol: asString(guaranteeAmount.currency).toUpperCase(),
                amount_fiat: formatFiat(guaranteeAmount.converted),
            },
            ltv: formatLtv(firstDefined(payload, "ltv") ?? tx.ltv),
            previous_ltv: formatLtv(firstDefined(payload, "previousLtv") ?? tx.previousLtv),
            created_at: asString(tx.createdAt),
        };
    });
}
