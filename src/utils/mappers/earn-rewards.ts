import { ValidationError } from "../errors.js";
import { smartRound, normalizeMovementStatus } from "../format.js";
import { asFiniteNumber, asRecord, asString, extractArrayData, firstDefined, isValidObject } from "./guards.js";
import type {
    EarnAssetWithAPY,
    EarnAssetsResponse,
    EarnRewardsConfigResponse,
    EarnPositionRewardsConfigResponse,
    EarnPositionRewardsSummaryResponse,
    EarnOperationResponse,
} from "../schemas.js";

function mapLockPeriods(value: unknown): EarnAssetWithAPY["lock_periods"] {
    if (!Array.isArray(value)) return undefined;
    return value.map((entry) => {
        const lp = asRecord(entry);
        return {
            id: asString(firstDefined(lp, "id", "lockPeriodId")),
            months: asFiniteNumber(lp.months),
        };
    });
}

function mapRewardCurrencies(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.map((c) => (typeof c === "string" ? c : asString(firstDefined(asRecord(c), "currency", "symbol"))));
}

function mapEarnAssetItem(item: unknown): EarnAssetWithAPY {
    if (typeof item === "string") {
        return { symbol: item, disabled: false, deposit_disabled: false, withdrawal_disabled: false, is_new: false };
    }
    const row = asRecord(item);
    const name = asString(row.name) || undefined;
    const lock_periods = mapLockPeriods(row.lockPeriodsAllowed);
    const reward_currencies = mapRewardCurrencies(row.currenciesRewardAllowed);
    const extra = row.levelExtraYieldPercentage ? asFiniteNumber(row.levelExtraYieldPercentage) : undefined;
    return {
        symbol: asString(firstDefined(row, "symbol", "currency")).toUpperCase(),
        disabled: Boolean(row.disabled),
        deposit_disabled: Boolean(row.depositDisabled),
        withdrawal_disabled: Boolean(row.withdrawalDisabled),
        is_new: Boolean(row.isNew),
        ...(name ? { name } : {}),
        ...(lock_periods ? { lock_periods } : {}),
        ...(reward_currencies ? { reward_currencies } : {}),
        ...(extra !== undefined ? { level_extra_yield_percentage: extra } : {}),
    };
}

function mapRewardsConfigItem(item: unknown): EarnRewardsConfigResponse {
    const row = asRecord(item);
    const positionId = asString(firstDefined(row, "walletId", "wallet_id"));
    return {
        position_id: positionId,
        user_id: asString(firstDefined(row, "userId", "user_id")),
        symbol: asString(row.currency).toUpperCase(),
        lock_period_id: asString(firstDefined(row, "lockPeriodId", "lock_period_id")) || null,
        reward_symbol: asString(firstDefined(row, "rewardCurrency", "reward_currency", "currency")).toUpperCase(),
        created_at: asString(firstDefined(row, "createdAt", "created_at")),
        updated_at: asString(firstDefined(row, "updatedAt", "updated_at")),
        wallet_id: positionId,
    };
}

export function mapEarnAssetsResponse(raw: unknown): EarnAssetsResponse {
    let assets: unknown[] = [];
    if (isValidObject(raw) && (raw.assets || raw.currencies)) {
        const list = raw.assets || raw.currencies;
        assets = Array.isArray(list) ? list : [];
    } else {
        assets = extractArrayData(raw);
    }

    if (assets.length > 0) {
        return { assets: assets.map(mapEarnAssetItem) };
    }
    return { assets: [] };
}

export function mapEarnRewardsConfigResponse(raw: unknown): EarnRewardsConfigResponse | EarnRewardsConfigResponse[] {
    const asArray = extractArrayData(raw);
    if (asArray.length > 0) {
        return asArray.map(mapRewardsConfigItem);
    }

    if (isValidObject(raw)) {
        return mapRewardsConfigItem(raw);
    }

    throw new ValidationError("Invalid earn rewards config response structure");
}

export function mapEarnPositionRewardsConfigResponse(raw: unknown): EarnPositionRewardsConfigResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn position rewards config response structure");
    }
    return mapRewardsConfigItem(raw);
}

export function mapEarnPositionRewardsSummaryResponse(raw: unknown): EarnPositionRewardsSummaryResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn position rewards summary response structure");
    }

    const accumulatedRewards = Array.isArray(raw.accumulatedRewards) ? raw.accumulatedRewards : [];
    const firstReward = asRecord(accumulatedRewards[0]);
    const totalConvertedReward = asRecord(raw.totalConvertedReward);

    return {
        reward_symbol: asString(firstReward.currency).toUpperCase(),
        reward_amount: asString(firstReward.amount, "0"),
        reward_converted_symbol: asString(totalConvertedReward.currency).toUpperCase(),
        reward_converted_amount: smartRound(asFiniteNumber(totalConvertedReward.amount)).toString(),
    };
}

export function mapEarnOperationResponse(raw: unknown): EarnOperationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid earn operation response structure");
    }

    const opType = asString(raw.type, "deposit") as "deposit" | "withdrawal";

    return {
        id: asString(firstDefined(raw, "id", "transactionId", "movementId")),
        type: opType === "withdrawal" ? "withdrawal" : "deposit",
        symbol: asString(raw.currency).toUpperCase(),
        amount: asString(raw.amount, "0"),
        status: normalizeMovementStatus(asString(raw.status)),
        message: asString(raw.message, "Operation created"),
    };
}
