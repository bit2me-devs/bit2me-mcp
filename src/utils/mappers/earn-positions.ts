import { smartRound } from "../format.js";
import { asFiniteNumber, asRecord, asString, extractArrayData, firstDefined, isValidObject } from "./guards.js";
import type { EarnSummaryResponse, EarnAPYResponse, EarnPositionResponse } from "../schemas.js";

export function mapEarnSummaryResponse(raw: unknown): EarnSummaryResponse[] {
    if (!raw) return [];

    const results: EarnSummaryResponse[] = [];

    function extractItems(data: unknown): void {
        if (!data) return;

        if (Array.isArray(data)) {
            for (const item of data) {
                extractItems(item);
            }
        } else if (typeof data === "object") {
            const obj = asRecord(data);
            if ("currency" in obj || "totalBalance" in obj || "totalRewards" in obj) {
                results.push({
                    symbol: asString(obj.currency),
                    total_balance: asString(firstDefined(obj, "totalBalance", "total_balance"), "0"),
                    total_rewards: asString(firstDefined(obj, "totalRewards", "rewards_earned"), "0"),
                });
            }
        }
    }

    extractItems(raw);
    return results;
}

export function mapEarnAPYResponse(raw: unknown): Record<string, EarnAPYResponse> {
    if (!isValidObject(raw)) {
        return {};
    }

    const result: Record<string, EarnAPYResponse> = {};

    for (const [symbol, rates] of Object.entries(raw)) {
        if (rates && typeof rates === "object") {
            const row = asRecord(rates);
            result[symbol] = {
                symbol,
                rates: {
                    daily_yield_ratio: asString(row.daily, "0"),
                    weekly_yield_ratio: asString(row.weekly, "0"),
                    monthly_yield_ratio: asString(row.monthly, "0"),
                },
            };
        }
    }

    return result;
}

export function mapEarnPositionsResponse(raw: unknown): EarnPositionResponse[] {
    return extractArrayData(raw).map((item) => {
        const position = asRecord(item);
        const lockPeriod = asRecord(position.lockPeriod);
        const hasLockPeriod = Boolean(position.lockPeriod && lockPeriod.lockPeriodId);
        const strategy = hasLockPeriod ? "fixed" : "flexible";
        const positionId = asString(firstDefined(position, "walletId", "id"));
        const converted = asRecord(position.convertedBalance);

        return {
            position_id: positionId,
            symbol: asString(position.currency).toUpperCase(),
            balance: asString(firstDefined(position, "totalBalance", "balance"), "0"),
            strategy: asString(firstDefined(position, "strategy", "type"), strategy),
            lock_period: position.lockPeriod
                ? {
                      lock_period_id: asString(lockPeriod.lockPeriodId),
                      months: asFiniteNumber(lockPeriod.months),
                  }
                : undefined,
            converted_balance: position.convertedBalance
                ? {
                      value: smartRound(asFiniteNumber(converted.value)).toString(),
                      symbol: asString(converted.currency),
                  }
                : undefined,
            created_at: asString(firstDefined(position, "createdAt", "created_at")),
            updated_at: asString(firstDefined(position, "updatedAt", "updated_at")),
            id: positionId,
            wallet_id: positionId,
            total_balance: position.totalBalance == null ? undefined : asString(position.totalBalance),
        };
    });
}
