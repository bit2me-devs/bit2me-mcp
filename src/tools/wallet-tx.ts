import { bit2meRequest } from "../services/bit2me.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { normalizeSymbol, validatePaginationLimit, validateUUID, validateSymbol } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";
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

    // Otherwise, get one page of movements. The v3 endpoint pages with a cursor, not an offset.
    if (params.offset !== undefined && params.offset !== 0) {
        throw new ValidationError(
            "offset is no longer supported: pass the next_cursor of the previous page as cursor",
            "offset",
            params.offset
        );
    }
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);

    if (params.symbol) {
        validateSymbol(params.symbol);
    }

    const queryParams: Record<string, unknown> = {};
    if (params.symbol) queryParams.currency = normalizeSymbol(params.symbol);
    queryParams.limit = limit;
    if (params.cursor) queryParams.cursor = params.cursor;

    const data = await bit2meRequest("GET", "/v3/wallet/transaction", queryParams);

    // v3 returns { data: [...], pageInfo: { hasNextPage, endCursor } }
    const rawData = data as Record<string, unknown>;
    const pageInfo =
        rawData.pageInfo && typeof rawData.pageInfo === "object" ? (rawData.pageInfo as Record<string, unknown>) : {};
    const optimized = mapWalletMovementsResponse(rawData.data ?? []);
    const hasMore = pageInfo.hasNextPage === true;
    const nextCursor = hasMore && typeof pageInfo.endCursor === "string" ? pageInfo.endCursor : null;

    requestContext.limit = limit;
    if (params.cursor) requestContext.cursor = params.cursor;
    if (params.symbol) {
        requestContext.symbol = normalizeSymbol(params.symbol);
    }

    const contextual = buildPaginatedContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
            limit,
            has_more: hasMore,
            next_cursor: nextCursor,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
