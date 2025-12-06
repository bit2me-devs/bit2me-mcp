/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import {
    mapLoanOrdersResponse,
    mapLoanMovementsResponse,
    mapLoanConfigResponse,
    mapLoanSimulationResponse,
    mapLoanOrderDetailsResponse,
    mapLoanCreateResponse,
    mapLoanIncreaseGuaranteeResponse,
    mapLoanPaybackResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildPaginatedContextualResponse,
    buildFilteredContextualResponse,
} from "../utils/contextual-response.js";
import {
    LoanSimulationArgs,
    LoanMovementsArgs,
    LoanOrdersArgs,
    LoanCreateArgs,
    LoanIncreaseGuaranteeArgs,
    LoanPaybackArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
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

export const loanTools: Tool[] = getCategoryTools("loan");

/**
 * Handles loan-related tool requests
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 */
export async function handleLoanTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "loan_get_simulation") {
            const params = args as LoanSimulationArgs;
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
            const queryParams: Record<string, any> = {
                guaranteeCurrency: guarantee_symbol,
                loanCurrency: loan_symbol,
                userCurrency: user_symbol,
            };
            if (params.guarantee_amount) queryParams.guaranteeAmount = params.guarantee_amount;
            if (params.loan_amount) queryParams.loanAmount = params.loan_amount;

            const requestContext: any = {
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

        if (name === "loan_get_config") {
            const requestContext = {};
            const data = await bit2meRequest("GET", "/v2/loan/currency/configuration");
            const optimized = mapLoanConfigResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "loan_get_movements") {
            const params = args as LoanMovementsArgs;
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {
                limit,
                offset,
            };
            if (params.order_id) queryParams.orderId = params.order_id;

            const requestContext: any = {
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

        if (name === "loan_get_orders") {
            const params = args as LoanOrdersArgs;
            const requestContext: any = {};

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

            const queryParams: Record<string, any> = {
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

        if (name === "loan_create") {
            const params = args as LoanCreateArgs;
            if (!params.guarantee_symbol) {
                throw new ValidationError("guarantee_symbol is required", "guarantee_symbol");
            }
            if (!params.loan_symbol) {
                throw new ValidationError("loan_symbol is required", "loan_symbol");
            }
            if (!params.amount_type) {
                throw new ValidationError("amount_type is required", "amount_type");
            }
            if (params.amount_type !== "fixed_collateral" && params.amount_type !== "fixed_loan") {
                throw new ValidationError(
                    'amount_type must be either "fixed_collateral" or "fixed_loan"',
                    "amount_type"
                );
            }
            validateSymbol(params.guarantee_symbol);
            validateSymbol(params.loan_symbol);

            const guarantee_symbol = normalizeSymbol(params.guarantee_symbol);
            const loan_symbol = normalizeSymbol(params.loan_symbol);
            const user_symbol = normalizeSymbol(params.user_symbol || "EUR");

            let guarantee_amount: string;
            let loan_amount: string;

            // Calculate missing amount using simulation
            if (params.amount_type === "fixed_collateral") {
                if (!params.guarantee_amount) {
                    throw new ValidationError(
                        "guarantee_amount is required when amount_type is 'fixed_collateral'",
                        "guarantee_amount"
                    );
                }
                validateAmount(params.guarantee_amount, "guarantee_amount");
                guarantee_amount = params.guarantee_amount;

                // Calculate loan_amount using simulation
                const simulationData = await bit2meRequest("GET", "/v1/loan/ltv", {
                    guaranteeCurrency: guarantee_symbol,
                    loanCurrency: loan_symbol,
                    userCurrency: user_symbol,
                    guaranteeAmount: guarantee_amount,
                });
                const simulation = mapLoanSimulationResponse(simulationData);
                loan_amount = simulation.loan_amount;
            } else {
                // fixed_loan
                if (!params.loan_amount) {
                    throw new ValidationError(
                        "loan_amount is required when amount_type is 'fixed_loan'",
                        "loan_amount"
                    );
                }
                validateAmount(params.loan_amount, "loan_amount");
                loan_amount = params.loan_amount;

                // Calculate guarantee_amount using simulation
                const simulationData = await bit2meRequest("GET", "/v1/loan/ltv", {
                    guaranteeCurrency: guarantee_symbol,
                    loanCurrency: loan_symbol,
                    userCurrency: user_symbol,
                    loanAmount: loan_amount,
                });
                const simulation = mapLoanSimulationResponse(simulationData);
                guarantee_amount = simulation.guarantee_amount;
            }

            const requestContext: any = {
                guarantee_symbol,
                guarantee_amount,
                loan_symbol,
                loan_amount,
                amount_type: params.amount_type,
            };
            if (params.user_symbol) requestContext.user_symbol = params.user_symbol;

            const data = await bit2meRequest("POST", "/v1/loan", {
                guaranteeCurrency: guarantee_symbol,
                guaranteeAmount: guarantee_amount,
                loanCurrency: loan_symbol,
                loanAmount: loan_amount,
            });
            const optimized = mapLoanCreateResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "loan_increase_guarantee") {
            const params = args as LoanIncreaseGuaranteeArgs;
            if (!params.order_id) {
                throw new ValidationError("order_id is required", "order_id");
            }
            if (!params.guarantee_amount) {
                throw new ValidationError("guarantee_amount is required", "guarantee_amount");
            }
            validateUUID(params.order_id, "order_id");
            validateAmount(params.guarantee_amount, "guarantee_amount");
            const requestContext = {
                order_id: params.order_id,
                guarantee_amount: params.guarantee_amount,
            };
            const data = await bit2meRequest(
                "POST",
                `/v1/loan/${encodeURIComponent(params.order_id)}/guarantee/increase`,
                {
                    guaranteeAmount: params.guarantee_amount,
                }
            );
            const optimized = mapLoanIncreaseGuaranteeResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "loan_payback") {
            const params = args as LoanPaybackArgs;
            if (!params.order_id) {
                throw new ValidationError("order_id is required", "order_id");
            }
            if (!params.payback_amount) {
                throw new ValidationError("payback_amount is required", "payback_amount");
            }
            validateUUID(params.order_id, "order_id");
            validateAmount(params.payback_amount, "payback_amount");
            const requestContext = {
                order_id: params.order_id,
                payback_amount: params.payback_amount,
            };
            const data = await bit2meRequest("POST", `/v1/loan/${encodeURIComponent(params.order_id)}/payback`, {
                paybackAmount: params.payback_amount,
            });
            const optimized = mapLoanPaybackResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown loan tool: ${name}`);
    });
}
