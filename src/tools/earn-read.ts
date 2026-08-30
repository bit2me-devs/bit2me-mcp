import { bit2meRequest } from "../services/bit2me.js";
import { mapEarnSummaryResponse, mapEarnPositionsResponse } from "../utils/response-mappers.js";
import { buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { validateUUID } from "../utils/format.js";

export async function handleEarnGetSummary(_args: Record<string, unknown>) {
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

export async function handleEarnGetPositions(args: Record<string, unknown>) {
    const params = args as unknown as { position_id?: string };
    const requestContext: Record<string, unknown> = {};

    // If position_id is provided, filter to that specific position
    if (params.position_id) {
        validateUUID(params.position_id, "position_id");
        requestContext.position_id = params.position_id;
    }

    const data = await bit2meRequest("GET", "/v2/earn/wallets");
    let optimized = mapEarnPositionsResponse(data);

    // Filter by position_id if provided
    if (params.position_id) {
        optimized = optimized.filter((p) => p.position_id === params.position_id);
    }

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
