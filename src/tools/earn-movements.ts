import { bit2meRequest } from "../services/bit2me.js";
import {
    mapEarnMovementsResponse,
    mapEarnPositionMovementsResponse,
    mapEarnMovementsSummaryResponse,
} from "../utils/response-mappers.js";
import { buildSimpleContextualResponse, buildPaginatedContextualResponse } from "../utils/contextual-response.js";
import { EarnMovementsArgs, EarnPositionMovementsArgs, EarnMovementsSummaryArgs } from "../utils/args.js";
import {
    normalizeSymbol,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validateSymbol,
    validateISO8601,
    validateDateRange,
} from "../utils/format.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { ValidationError } from "../utils/errors.js";

export async function handleEarnGetPositionMovements(args: Record<string, unknown>) {
    const params = args as unknown as EarnPositionMovementsArgs;
    if (!params.position_id) {
        throw new ValidationError("position_id is required", "position_id");
    }
    validateUUID(params.position_id, "position_id");
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
    const offset = validatePaginationOffset(params.offset);

    const queryParams: Record<string, unknown> = {
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

export async function handleEarnGetMovements(args: Record<string, unknown>) {
    const params = args as unknown as EarnMovementsArgs;
    const limit = validatePaginationLimit(params.limit, 100); // Max 100 for v2 endpoint
    const offset = validatePaginationOffset(params.offset);

    const queryParams: Record<string, unknown> = {
        limit,
        offset,
    };

    // Add optional filters
    if (params.user_symbol) {
        validateSymbol(params.user_symbol);
        queryParams.userCurrency = normalizeSymbol(params.user_symbol);
    }
    if (params.symbol) {
        validateSymbol(params.symbol);
        queryParams.currency = normalizeSymbol(params.symbol);
    }
    if (params.related_symbol) {
        validateSymbol(params.related_symbol);
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
    if (params.start_date || params.end_date) {
        validateDateRange(params.start_date, params.end_date);
    }
    const VALID_EARN_MOVEMENT_TYPES = [
        "deposit",
        "withdraw",
        "reward",
        "exchange",
        "increase_collateral",
        "release_collateral",
        "loan",
        "payback",
    ];
    if (params.type) {
        const normalizedType = params.type.toLowerCase();
        if (!VALID_EARN_MOVEMENT_TYPES.includes(normalizedType)) {
            throw new ValidationError(
                `type must be one of: ${VALID_EARN_MOVEMENT_TYPES.join(", ")}`,
                "type",
                params.type
            );
        }
        queryParams.type = normalizedType;
    }
    if (params.sort_by) {
        const VALID_SORT_BY = ["date", "amount", "type", "currency"];
        if (!VALID_SORT_BY.includes(params.sort_by)) {
            throw new ValidationError(`sort_by must be one of: ${VALID_SORT_BY.join(", ")}`, "sort_by", params.sort_by);
        }
        queryParams.sortBy = params.sort_by;
    }

    const requestContext: Record<string, unknown> = {
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

export async function handleEarnGetMovementsSummary(args: Record<string, unknown>) {
    const params = args as unknown as EarnMovementsSummaryArgs;
    if (!params.type) {
        throw new ValidationError("type is required", "type");
    }
    // Normalize type to lowercase for consistency
    const normalizedType = params.type.toLowerCase();
    const VALID_SUMMARY_TYPES = [
        "deposit",
        "withdraw",
        "reward",
        "exchange",
        "increase_collateral",
        "release_collateral",
        "loan",
        "payback",
    ];
    if (!VALID_SUMMARY_TYPES.includes(normalizedType)) {
        throw new ValidationError(`type must be one of: ${VALID_SUMMARY_TYPES.join(", ")}`, "type", params.type);
    }
    const requestContext = {
        type: normalizedType,
    };
    const data = await bit2meRequest("GET", `/v1/earn/movements/${encodeURIComponent(normalizedType)}/summary`);
    const optimized = mapEarnMovementsSummaryResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
