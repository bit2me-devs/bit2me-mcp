/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnWalletsResponse,
    mapEarnMovementsResponse,
    mapEarnWalletMovementsResponse,
    mapEarnWalletDetailsResponse,
    mapEarnMovementsSummaryResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnWalletRewardsConfigResponse,
    mapEarnWalletRewardsSummaryResponse,
    mapEarnOperationResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import {
    EarnWalletDetailsArgs,
    EarnMovementsArgs,
    EarnWalletMovementsArgs,
    EarnMovementsSummaryArgs,
    EarnDepositArgs,
    EarnWithdrawArgs,
    EarnWalletRewardsConfigArgs,
    EarnWalletRewardsSummaryArgs,
    EarnAPYArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { cache } from "../utils/cache.js";
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

        if (name === "earn_get_wallets") {
            const requestContext = {};
            const data = await bit2meRequest("GET", "/v2/earn/wallets");
            const optimized = mapEarnWalletsResponse(data);
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

        if (name === "earn_get_wallet_details") {
            const params = args as EarnWalletDetailsArgs;
            if (!params.wallet_id) {
                throw new ValidationError("wallet_id is required", "wallet_id");
            }
            validateUUID(params.wallet_id, "wallet_id");
            const requestContext = {
                wallet_id: params.wallet_id,
            };
            const data = await bit2meRequest("GET", `/v1/earn/wallets/${encodeURIComponent(params.wallet_id)}`);
            const optimized = mapEarnWalletDetailsResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_wallet_movements") {
            const params = args as EarnWalletMovementsArgs;
            if (!params.wallet_id) {
                throw new ValidationError("wallet_id is required", "wallet_id");
            }
            validateUUID(params.wallet_id, "wallet_id");
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {
                limit,
                offset,
            };
            const requestContext = {
                wallet_id: params.wallet_id,
                limit,
                offset,
            };
            const data = await bit2meRequest(
                "GET",
                `/v1/earn/wallets/${encodeURIComponent(params.wallet_id)}/movements`,
                queryParams
            );
            const response = mapEarnWalletMovementsResponse(data);

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
            if (params.wallet_id) {
                validateUUID(params.wallet_id, "wallet_id");
                queryParams.walletId = params.wallet_id;
            }
            if (params.from) {
                validateISO8601(params.from);
                queryParams.from = params.from;
            }
            if (params.to) {
                validateISO8601(params.to);
                queryParams.to = params.to;
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
            if (params.wallet_id) requestContext.wallet_id = params.wallet_id;
            if (params.from) requestContext.from = params.from;
            if (params.to) requestContext.to = params.to;
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
            const cacheKey = "earn_assets";
            const cachedData = cache.get(cacheKey);

            let data;
            if (cachedData) {
                data = cachedData;
            } else {
                data = await bit2meRequest("GET", "/v2/earn/assets");
                cache.set(cacheKey, data, 3600); // 1 hour cache
            }

            const requestContext = {};
            const optimized = mapEarnAssetsResponse(data);
            const contextual = buildFilteredContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: optimized.symbols.length,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_apy") {
            const params = args as EarnAPYArgs;
            const cacheKey = "earn_apy";
            const cachedData = cache.get(cacheKey);

            let data;
            if (cachedData) {
                data = cachedData;
            } else {
                data = await bit2meRequest("GET", "/v2/earn/apy");
                cache.set(cacheKey, data, 60); // 1 minute cache
            }

            const requestContext: any = {};
            if (params.symbol) {
                validateSymbol(params.symbol);
                requestContext.symbol = normalizeSymbol(params.symbol);
            }
            const optimized = mapEarnAPYResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
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

        if (name === "earn_get_wallet_rewards_config") {
            const params = args as EarnWalletRewardsConfigArgs;
            if (!params.wallet_id) {
                throw new ValidationError("wallet_id is required", "wallet_id");
            }
            validateUUID(params.wallet_id, "wallet_id");
            const requestContext = {
                wallet_id: params.wallet_id,
            };
            const data = await bit2meRequest(
                "GET",
                `/v1/earn/wallets/${encodeURIComponent(params.wallet_id)}/rewards/config`
            );
            const optimized = mapEarnWalletRewardsConfigResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "earn_get_wallet_rewards_summary") {
            const params = args as EarnWalletRewardsSummaryArgs;
            if (!params.wallet_id) {
                throw new ValidationError("wallet_id is required", "wallet_id");
            }
            validateUUID(params.wallet_id, "wallet_id");

            const queryParams: Record<string, any> = {};
            if (params.user_currency) {
                validateFiat(params.user_currency);
                queryParams.userCurrency = normalizeSymbol(params.user_currency);
            }

            const requestContext: any = {
                wallet_id: params.wallet_id,
            };
            if (params.user_currency) {
                requestContext.user_currency = normalizeSymbol(params.user_currency);
            }

            const data = await bit2meRequest(
                "GET",
                `/v1/earn/wallets/${encodeURIComponent(params.wallet_id)}/rewards/summary`,
                queryParams
            );
            const optimized = mapEarnWalletRewardsSummaryResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown earn tool: ${name}`);
    });
}
