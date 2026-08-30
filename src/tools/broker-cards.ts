import { bit2meRequest } from "../services/bit2me.js";
import { mapWalletCardsResponse } from "../utils/response-mappers.js";
import { buildPaginatedContextualResponse } from "../utils/contextual-response.js";
import { WalletCardsArgs } from "../utils/args.js";
import { validatePaginationLimit, validatePaginationOffset, validateUUID } from "../utils/format.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";

export async function handleWalletGetCards(args: Record<string, unknown>) {
    const params = args as unknown as WalletCardsArgs;
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
    const offset = validatePaginationOffset(params.offset);

    const queryParams: Record<string, unknown> = {};
    if (params.card_id) {
        validateUUID(params.card_id, "card_id");
        queryParams.id = params.card_id;
    }
    queryParams.limit = limit;
    queryParams.offset = offset;

    const data = await bit2meRequest("GET", "/v1/teller/card", queryParams);
    const optimized = mapWalletCardsResponse(data);

    // Extract total from response if available, otherwise use array length
    const rawData = data as Record<string, unknown>;
    const metadata =
        rawData.metadata && typeof rawData.metadata === "object" ? (rawData.metadata as Record<string, unknown>) : {};
    const totalRecords = Number(rawData.total || metadata.total || optimized.length);

    const requestContext: Record<string, unknown> = {
        limit,
        offset,
    };
    if (params.card_id) {
        requestContext.card_id = params.card_id;
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
