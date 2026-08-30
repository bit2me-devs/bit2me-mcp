import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";
import {
    mapLoanSimulationResponse,
    mapLoanCreateResponse,
    mapLoanIncreaseGuaranteeResponse,
    mapLoanPaybackResponse,
} from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { LoanCreateArgs, LoanIncreaseGuaranteeArgs, LoanPaybackArgs } from "../utils/args.js";
import { validateUUID, validateSymbol, validateAmount, normalizeSymbol } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleLoanCreate(args: Record<string, unknown>) {
    const params = args as unknown as LoanCreateArgs;
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
        throw new ValidationError('amount_type must be either "fixed_collateral" or "fixed_loan"', "amount_type");
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
            throw new ValidationError("loan_amount is required when amount_type is 'fixed_loan'", "loan_amount");
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

    const requestContext: Record<string, unknown> = {
        guarantee_symbol,
        guarantee_amount,
        loan_symbol,
        loan_amount,
        amount_type: params.amount_type,
    };
    if (params.user_symbol) requestContext.user_symbol = params.user_symbol;

    const createIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        "/v1/loan",
        {
            guaranteeCurrency: guarantee_symbol,
            guaranteeAmount: guarantee_amount,
            loanCurrency: loan_symbol,
            loanAmount: loan_amount,
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: createIdemKey }
    );
    const optimized = mapLoanCreateResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleLoanIncreaseGuarantee(args: Record<string, unknown>) {
    const params = args as unknown as LoanIncreaseGuaranteeArgs;
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
    const increaseIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        `/v1/loan/${encodeURIComponent(params.order_id)}/guarantee/increase`,
        {
            guaranteeAmount: params.guarantee_amount,
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: increaseIdemKey }
    );
    const optimized = mapLoanIncreaseGuaranteeResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleLoanPayback(args: Record<string, unknown>) {
    const params = args as unknown as LoanPaybackArgs;
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
    const paybackIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        `/v1/loan/${encodeURIComponent(params.order_id)}/payback`,
        {
            paybackAmount: params.payback_amount,
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: paybackIdemKey }
    );
    const optimized = mapLoanPaybackResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
