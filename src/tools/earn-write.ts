import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";
import { mapEarnOperationResponse } from "../utils/response-mappers.js";
import { buildSimpleContextualResponse } from "../utils/contextual-response.js";
import { EarnDepositArgs, EarnWithdrawArgs } from "../utils/args.js";
import { normalizeSymbol, validateUUID, validateSymbol, validateAmount } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";

export async function handleEarnDeposit(args: Record<string, unknown>) {
    const params = args as unknown as EarnDepositArgs;
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
    const depositIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        `/v1/earn/wallets/${encodeURIComponent(params.pocket_id)}/movements`,
        {
            currency: symbol,
            amount: params.amount,
            type: "deposit",
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: depositIdemKey }
    );
    const optimized = mapEarnOperationResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleEarnWithdraw(args: Record<string, unknown>) {
    const params = args as unknown as EarnWithdrawArgs;
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
    const withdrawIdemKey = resolveIdempotencyKey(args);
    const data = await bit2meRequest(
        "POST",
        `/v1/earn/wallets/${encodeURIComponent(params.pocket_id)}/movements`,
        {
            currency: symbol,
            amount: params.amount,
            type: "withdrawal",
        },
        undefined,
        undefined,
        undefined,
        { idempotencyKey: withdrawIdemKey }
    );
    const optimized = mapEarnOperationResponse(data);
    const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
