import { bit2meRequest } from "../services/bit2me.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import {
    normalizeSymbol,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validateSymbol,
} from "../utils/format.js";
import { mapWalletMovementsResponse, mapWalletMovementDetailsResponse } from "../utils/response-mappers.js";
import { buildFilteredContextualResponse, buildPaginatedContextualResponse } from "../utils/contextual-response.js";
import { WalletMovementsArgs } from "../utils/args.js";

export async function handleWalletGetMovements(args: Record<string, unknown>) {
    const params = args as unknown as WalletMovementsArgs;
    const requestContext: Record<string, unknown> = {};

    // If movement_id is provided, get details for that specific movement
    if (params.movement_id) {
        validateUUID(params.movement_id, "movement_id");
        requestContext.movement_id = params.movement_id;
        const data = await bit2meRequest("GET", `/v1/wallet/transaction/${encodeURIComponent(params.movement_id)}`);
        const optimized = mapWalletMovementDetailsResponse(data);
        // Return as array for consistency
        const contextual = buildFilteredContextualResponse(
            requestContext,
            [optimized],
            {
                total_records: 1,
            },
            data
        );
        return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
    }

    // Otherwise, get paginated list of movements
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
    const offset = validatePaginationOffset(params.offset);

    if (params.symbol) {
        validateSymbol(params.symbol);
    }

    const queryParams: Record<string, unknown> = {};
    if (params.symbol) queryParams.currency = normalizeSymbol(params.symbol);
    queryParams.limit = limit;
    queryParams.offset = offset;

    const data = await bit2meRequest("GET", "/v2/wallet/transaction", queryParams);

    // v2 endpoint returns { data: [...], total: number } according to docs
    const rawData = data as Record<string, unknown>;
    const movementsArray = rawData.data ?? rawData.transactions ?? [];
    const metadata =
        rawData.metadata && typeof rawData.metadata === "object" ? (rawData.metadata as Record<string, unknown>) : {};

    const optimized = mapWalletMovementsResponse(movementsArray);

    // Extract total from root 'total' or metadata
    const totalRecords = Number(rawData.total || metadata.total || metadata.total_records || optimized.length);

    requestContext.limit = limit;
    requestContext.offset = offset;
    if (params.symbol) {
        requestContext.symbol = normalizeSymbol(params.symbol);
    }

    const contextual = buildPaginatedContextualResponse(
        requestContext,
        optimized,
        {
            total_records: totalRecords,
            limit,
            offset,
            has_more: offset + limit < totalRecords,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
