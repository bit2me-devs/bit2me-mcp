import { bit2meRequest, resolveIdempotencyKey } from "../services/bit2me.js";

/** POST /v1/wallet/transaction/proforma with a stable Idempotency-Key. */
export async function postWalletProforma(
    body: Record<string, unknown>,
    args: Record<string, unknown>
): Promise<unknown> {
    const idempotencyKey = resolveIdempotencyKey(args);
    return bit2meRequest("POST", "/v1/wallet/transaction/proforma", body, undefined, undefined, undefined, {
        idempotencyKey,
    });
}
