import { bit2meRequest } from "../services/bit2me.js";
import {
    mapEarnAPYResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnPositionRewardsConfigResponse,
    mapEarnPositionRewardsSummaryResponse,
} from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { EarnPositionRewardsConfigArgs, EarnPositionRewardsSummaryArgs } from "../utils/args.js";
import { normalizeSymbol, validateUUID, validateFiat } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleEarnGetAssets(_args: Record<string, unknown>) {
    // Parallel requests to get assets and APY
    const [assetsData, apyData] = await Promise.all([
        bit2meRequest("GET", "/v2/earn/assets"),
        bit2meRequest("GET", "/v2/earn/apy"),
    ]);

    const requestContext = {};
    // Map Assets with full details
    const mappedAssets = mapEarnAssetsResponse(assetsData);
    // Map APY
    const apys = mapEarnAPYResponse(apyData);

    // Combine assets with APY, preserving all asset fields
    const combinedAssets = mappedAssets.assets.map((item) => {
        const apyInfo = apys[item.symbol];
        return {
            ...item,
            apy: apyInfo ? apyInfo.rates : undefined,
        };
    });

    const contextual = buildFilteredContextualResponse(
        requestContext,
        { assets: combinedAssets },
        {
            total_records: combinedAssets.length,
        },
        { assetsData, apyData }
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleEarnGetRewardsConfig(_args: Record<string, unknown>) {
    const requestContext = {};
    const data = await bit2meRequest("GET", "/v1/earn/wallets/rewards/config");
    const optimized = mapEarnRewardsConfigResponse(data);
    const result = Array.isArray(optimized) ? optimized : [optimized];
    const contextual = buildFilteredContextualResponse(
        requestContext,
        result,
        {
            total_records: Array.isArray(optimized) ? optimized.length : 1,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleEarnGetPositionRewardsConfig(args: Record<string, unknown>) {
    const params = args as unknown as EarnPositionRewardsConfigArgs;
    if (!params.position_id) {
        throw new ValidationError("position_id is required", "position_id");
    }
    validateUUID(params.position_id, "position_id");
    const requestContext = {
        position_id: params.position_id,
    };
    const data = await bit2meRequest(
        "GET",
        `/v1/earn/wallets/${encodeURIComponent(params.position_id)}/rewards/config`
    );
    const optimized = mapEarnPositionRewardsConfigResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleEarnGetPositionRewardsSummary(args: Record<string, unknown>) {
    const params = args as unknown as EarnPositionRewardsSummaryArgs;
    if (!params.position_id) {
        throw new ValidationError("position_id is required", "position_id");
    }
    validateUUID(params.position_id, "position_id");

    const queryParams: Record<string, unknown> = {};
    if (params.user_currency) {
        validateFiat(params.user_currency);
        queryParams.userCurrency = normalizeSymbol(params.user_currency);
    }

    const requestContext: Record<string, unknown> = {
        position_id: params.position_id,
    };
    if (params.user_currency) {
        requestContext.user_currency = normalizeSymbol(params.user_currency);
    }

    const data = await bit2meRequest(
        "GET",
        `/v1/earn/wallets/${encodeURIComponent(params.position_id)}/rewards/summary`,
        queryParams
    );
    const optimized = mapEarnPositionRewardsSummaryResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
