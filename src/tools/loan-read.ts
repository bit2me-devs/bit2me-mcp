import { bit2meRequest } from "../services/bit2me.js";
import {
    mapLoanOrdersResponse,
    mapLoanMovementsResponse,
    mapLoanConfigResponse,
    mapLoanSimulationResponse,
    mapLoanOrderDetailsResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildPaginatedContextualResponse,
    buildFilteredContextualResponse,
} from "../utils/contextual-response.js";
import { LoanSimulationArgs, LoanMovementsArgs, LoanOrdersArgs } from "../utils/args.js";
import {
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validateSymbol,
    validateFiat,
    validateAmount,
    normalizeSymbol,
} from "../utils/format.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import { ValidationError } from "../utils/errors.js";

export async function handleLoanGetSimulation(args: Record<string, unknown>) {
    const params = args as unknown as LoanSimulationArgs;
    if (!params.guarantee_symbol) {
        throw new ValidationError("guarantee_symbol is required", "guarantee_symbol");
    }
    if (!params.loan_symbol) {
        throw new ValidationError("loan_symbol is required", "loan_symbol");
    }
    if (!params.user_symbol) {
        throw new ValidationError("user_symbol is required", "user_symbol");
    }
    validateSymbol(params.guarantee_symbol);
    validateSymbol(params.loan_symbol);
    validateFiat(params.user_symbol);
    if (params.guarantee_amount) validateAmount(params.guarantee_amount, "guarantee_amount");
    if (params.loan_amount) validateAmount(params.loan_amount, "loan_amount");
    const guarantee_symbol = normalizeSymbol(params.guarantee_symbol);
    const loan_symbol = normalizeSymbol(params.loan_symbol);
    const user_symbol = normalizeSymbol(params.user_symbol);
    const queryParams: Record<string, unknown> = {
        guaranteeCurrency: guarantee_symbol,
        loanCurrency: loan_symbol,
        userCurrency: user_symbol,
    };
    if (params.guarantee_amount) queryParams.guaranteeAmount = params.guarantee_amount;
    if (params.loan_amount) queryParams.loanAmount = params.loan_amount;

    const requestContext: Record<string, unknown> = {
        guarantee_symbol,
        loan_symbol,
        user_symbol: user_symbol,
    };
    if (params.guarantee_amount) requestContext.guarantee_amount = params.guarantee_amount;
    if (params.loan_amount) requestContext.loan_amount = params.loan_amount;
    const data = await bit2meRequest("GET", "/v1/loan/ltv", queryParams);
    const optimized = mapLoanSimulationResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleLoanGetConfig(_args: Record<string, unknown>) {
    const requestContext = {};
    const data = await bit2meRequest("GET", "/v2/loan/currency/configuration");
    const optimized = mapLoanConfigResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleLoanGetMovements(args: Record<string, unknown>) {
    const params = args as unknown as LoanMovementsArgs;
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
    const offset = validatePaginationOffset(params.offset);

    const queryParams: Record<string, unknown> = {
        limit,
        offset,
    };
    if (params.order_id) queryParams.orderId = params.order_id;

    const requestContext: Record<string, unknown> = {
        limit,
        offset,
    };
    if (params.order_id) requestContext.order_id = params.order_id;
    const data = await bit2meRequest("GET", "/v1/loan/movements", queryParams);
    const optimized = mapLoanMovementsResponse(data);

    const contextual = buildPaginatedContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
            limit,
            offset,
            has_more: optimized.length === limit,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleLoanGetOrders(args: Record<string, unknown>) {
    const params = args as unknown as LoanOrdersArgs;
    const requestContext: Record<string, unknown> = {};

    // If order_id is provided, get details for that specific order (with extra fields)
    if (params.order_id) {
        validateUUID(params.order_id, "order_id");
        requestContext.order_id = params.order_id;
        const data = await bit2meRequest("GET", `/v1/loan/orders/${encodeURIComponent(params.order_id)}`);
        const optimized = mapLoanOrderDetailsResponse(data);
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

    // Otherwise, get paginated list of orders
    const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
    const offset = validatePaginationOffset(params.offset);

    const queryParams: Record<string, unknown> = {
        limit,
        offset,
    };

    requestContext.limit = limit;
    requestContext.offset = offset;

    const data = await bit2meRequest("GET", "/v1/loan/orders", queryParams);
    const optimized = mapLoanOrdersResponse(data);

    const contextual = buildPaginatedContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
            limit,
            offset,
            has_more: optimized.length === limit,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
