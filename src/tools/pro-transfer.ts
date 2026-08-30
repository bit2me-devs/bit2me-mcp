import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";
import { mapProDepositResponse, mapProWithdrawResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { ProDepositArgs, ProWithdrawArgs } from "../utils/args.js";
import { normalizeSymbol, validateUUID, validateSymbol, validateAmount } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleProDeposit(args: Record<string, unknown>) {
    const params = args as unknown as ProDepositArgs;
    if (!params.symbol) {
        throw new ValidationError("symbol is required", "symbol");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    validateSymbol(params.symbol);
    validateAmount(params.amount, "amount");
    const symbol = normalizeSymbol(params.symbol);
    const requestContext = {
        symbol,
        amount: params.amount,
    };
    const depositIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        "/v1/trading/wallet/deposit",
        {
            currency: symbol,
            amount: params.amount,
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: depositIdemKey }
    );
    const optimized = mapProDepositResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleProWithdraw(args: Record<string, unknown>) {
    const params = args as unknown as ProWithdrawArgs;
    if (!params.symbol) {
        throw new ValidationError("symbol is required", "symbol");
    }
    if (!params.amount) {
        throw new ValidationError("amount is required", "amount");
    }
    validateSymbol(params.symbol);
    validateAmount(params.amount, "amount");
    if (params.to_pocket_id) {
        validateUUID(params.to_pocket_id, "to_pocket_id");
    }
    const symbol = normalizeSymbol(params.symbol);
    const body: Record<string, unknown> = {
        currency: symbol,
        amount: params.amount,
    };
    if (params.to_pocket_id) {
        body.toPocketId = params.to_pocket_id;
    }

    const requestContext: Record<string, unknown> = {
        symbol,
        amount: params.amount,
    };
    if (params.to_pocket_id) {
        requestContext.to_pocket_id = params.to_pocket_id;
    }
    const withdrawIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest("POST", "/v1/trading/wallet/withdraw", body, undefined, undefined, undefined, {
        idempotencyKey: withdrawIdemKey,
    });
    const optimized = mapProWithdrawResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
