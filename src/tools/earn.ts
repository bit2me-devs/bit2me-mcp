/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnPositionsResponse,
    mapEarnMovementsResponse,
    mapEarnPositionMovementsResponse,
    mapEarnPositionDetailsResponse,
    mapEarnMovementsSummaryResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnPositionRewardsConfigResponse,
    mapEarnPositionRewardsSummaryResponse,
    mapEarnOperationResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import {
    EarnPositionDetailsArgs,
    EarnMovementsArgs,
    EarnPositionMovementsArgs,
    EarnMovementsSummaryArgs,
    EarnDepositArgs,
    EarnWithdrawArgs,
    EarnPositionRewardsConfigArgs,
    EarnPositionRewardsSummaryArgs,
    EarnAPYArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import {
    normalizeSymbol,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validateSymbol,
    validateFiat,
    validateAmount,
    validateISO8601,
} from "../utils/format.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { ValidationError } from "../utils/errors.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const earnTools: Tool[] = getCategoryTools("earn");

/**
 * Handles earn/staking-related tool requests
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 */
export async function handleEarnTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "earn_get_summary") {
            const requestContext = {};
            const data = await bit2meRequest("GET", "/v1/earn/summary");
            const optimized = mapEarnSummaryResponse(data);
            const contextual = buildFilteredContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.length,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_positions") {
            const requestContext = {};
            const data = await bit2meRequest("GET", "/v2/earn/wallets");
            const optimized = mapEarnPositionsResponse(data);
            const contextual = buildFilteredContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.length,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_position_details") {
            const params = args as EarnPositionDetailsArgs;
            if (!params.position_id) {
                throw new ValidationError("position_id is required", "position_id");
            }
            validateUUID(params.position_id, "position_id");
            const requestContext = {
                position_id: params.position_id,
            };
            const data = await bit2meRequest("GET", `/v1/earn/wallets/${encodeURIComponent(params.position_id)}`);
            const optimized = mapEarnPositionDetailsResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_position_movements") {
            const params = args as EarnPositionMovementsArgs;
            if (!params.position_id) {
                throw new ValidationError("position_id is required", "position_id");
            }
            validateUUID(params.position_id, "position_id");
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {
                limit,
                offset,
            };
            const requestContext = {
                position_id: params.position_id,
                limit,
                offset,
            };
            const data = await bit2meRequest(
                "GET",
                `/v1/earn/wallets/${encodeURIComponent(params.position_id)}/movements`,
                queryParams
            );
            const response = mapEarnPositionMovementsResponse(data);

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                response.movements,
                {
                    total_records: response.total,
                    limit,
                    offset,
                    has_more: response.movements.length === limit,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_movements") {
            const params = args as EarnMovementsArgs;
            const limit = validatePaginationLimit(params.limit, 100); // Max 100 for v2 endpoint
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {
                limit,
                offset,
            };

            // Add optional filters
            if (params.user_symbol) {
                queryParams.userCurrency = normalizeSymbol(params.user_symbol);
            }
            if (params.symbol) {
                queryParams.currency = normalizeSymbol(params.symbol);
            }
            if (params.related_symbol) {
                queryParams.relatedCurrency = normalizeSymbol(params.related_symbol);
            }
            if (params.position_id) {
                validateUUID(params.position_id, "position_id");
                queryParams.walletId = params.position_id;
            }
            if (params.start_date) {
                validateISO8601(params.start_date);
                queryParams.from = params.start_date;
            }
            if (params.end_date) {
                validateISO8601(params.end_date);
                queryParams.to = params.end_date;
            }
            if (params.type) {
                queryParams.type = params.type;
            }
            if (params.sort_by) {
                queryParams.sortBy = params.sort_by;
            }

            const requestContext: any = {
                limit,
                offset,
            };
            if (params.user_symbol) requestContext.user_symbol = normalizeSymbol(params.user_symbol);
            if (params.symbol) requestContext.symbol = normalizeSymbol(params.symbol);
            if (params.related_symbol) requestContext.related_symbol = normalizeSymbol(params.related_symbol);
            if (params.position_id) requestContext.position_id = params.position_id;
            if (params.start_date) requestContext.start_date = params.start_date;
            if (params.end_date) requestContext.end_date = params.end_date;
            if (params.type) requestContext.type = params.type;
            if (params.sort_by) requestContext.sort_by = params.sort_by;

            const data = await bit2meRequest("GET", "/v2/earn/movements", queryParams);
            const response = mapEarnMovementsResponse(data);

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                response.movements,
                {
                    total_records: response.total,
                    limit,
                    offset,
                    has_more: response.movements.length === limit,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_movements_summary") {
            const params = args as EarnMovementsSummaryArgs;
            if (!params.type) {
                throw new ValidationError("type is required", "type");
            }
            // Normalize type to lowercase for consistency
            const normalizedType = params.type.toLowerCase();
            const requestContext = {
                type: normalizedType,
            };
            const data = await bit2meRequest("GET", `/v1/earn/movements/${normalizedType}/summary`);
            const optimized = mapEarnMovementsSummaryResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_deposit") {
            const params = args as EarnDepositArgs;
            if (!params.pocket_id) {
                throw new ValidationError("pocket_id is required", "pocket_id");
            }
            if (!params.symbol) {
                throw new ValidationError("symbol is required", "symbol");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.pocket_id, "pocket_id");
            validateSymbol(params.symbol);
            validateAmount(params.amount, "amount");
            const symbol = normalizeSymbol(params.symbol);
            const requestContext = {
                pocket_id: params.pocket_id,
                symbol,
                amount: params.amount,
            };
            const data = await bit2meRequest(
                "POST",
                `/v1/earn/wallets/${encodeURIComponent(params.pocket_id)}/movements`,
                {
                    currency: symbol,
                    amount: params.amount,
                    type: "deposit",
                }
            );
            const optimized = mapEarnOperationResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_withdraw") {
            const params = args as EarnWithdrawArgs;
            if (!params.pocket_id) {
                throw new ValidationError("pocket_id is required", "pocket_id");
            }
            if (!params.symbol) {
                throw new ValidationError("symbol is required", "symbol");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.pocket_id, "pocket_id");
            validateSymbol(params.symbol);
            validateAmount(params.amount, "amount");
            const symbol = normalizeSymbol(params.symbol);
            const requestContext = {
                pocket_id: params.pocket_id,
                symbol,
                amount: params.amount,
            };
            const data = await bit2meRequest(
                "POST",
                `/v1/earn/wallets/${encodeURIComponent(params.pocket_id)}/movements`,
                {
                    currency: symbol,
                    amount: params.amount,
                    type: "withdrawal",
                }
            );
            const optimized = mapEarnOperationResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_assets") {
            // Parallel requests to get assets and APY
            const [assetsData, apyData] = await Promise.all([
                bit2meRequest("GET", "/v2/earn/assets"),
                bit2meRequest("GET", "/v2/earn/apy"),
            ]);

            const requestContext = {};
            // Map Assets (just symbols)
            const assets = mapEarnAssetsResponse(assetsData); // Returns { symbols: string[] }
            // Map APY
            const apys = mapEarnAPYResponse(apyData); // Returns Record<string, EarnAPYResponse>

            // Combine assets with APY
            const combinedAssets = assets.symbols.map((symbol) => {
                const apyInfo = apys[symbol];
                return {
                    symbol,
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

        if (name === "earn_get_rewards_config") {
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

        if (name === "earn_get_position_rewards_config") {
            const params = args as EarnPositionRewardsConfigArgs;
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

        if (name === "earn_get_position_rewards_summary") {
            const params = args as EarnPositionRewardsSummaryArgs;
            if (!params.position_id) {
                throw new ValidationError("position_id is required", "position_id");
            }
            validateUUID(params.position_id, "position_id");

            const queryParams: Record<string, any> = {};
            if (params.user_currency) {
                validateFiat(params.user_currency);
                queryParams.userCurrency = normalizeSymbol(params.user_currency);
            }

            const requestContext: any = {
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

        if (name === "earn_get_apy") {
            const params = args as EarnAPYArgs;
            const queryParams: Record<string, any> = {};
            if (params.symbol) {
                queryParams.currency = normalizeSymbol(params.symbol);
            }

            const requestContext: any = {};
            if (params.symbol) {
                requestContext.symbol = normalizeSymbol(params.symbol);
            }

            const data = await bit2meRequest("GET", "/v2/earn/apy", queryParams);
            const optimized = mapEarnAPYResponse(data);
            const contextual = buildFilteredContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: Object.keys(optimized).length,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown earn tool: ${name}`);
    });
}
