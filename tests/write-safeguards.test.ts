import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProTool } from "../src/tools/pro.js";
import { handleBrokerTool } from "../src/tools/broker.js";
import * as bit2meService from "../src/services/bit2me.js";
import { ValidationError } from "../src/utils/errors.js";
import { resolveIdempotencyKey, requireConfirm } from "../src/utils/write-guards.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("axios");
vi.mock("../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: vi.fn(() => ({
        API_KEY: "test-key",
        API_SECRET: "test-secret",
        INCLUDE_RAW_RESPONSE: false,
    })),
}));

describe("Write-tool safeguards", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requireConfirm rejects missing or false confirm", () => {
        expect(() => requireConfirm({})).toThrow(ValidationError);
        expect(() => requireConfirm({ confirm: false })).toThrow(ValidationError);
        expect(() => requireConfirm({ confirm: true })).not.toThrow();
    });

    it("resolveIdempotencyKey reuses a safe caller key", () => {
        expect(resolveIdempotencyKey({ idempotency_key: VALID_UUID })).toBe(VALID_UUID);
    });

    it("resolveIdempotencyKey rejects CRLF and oversize keys", () => {
        expect(() => resolveIdempotencyKey({ idempotency_key: "abc\r\nX" })).toThrow(ValidationError);
        expect(() => resolveIdempotencyKey({ idempotency_key: "a".repeat(129) })).toThrow(ValidationError);
    });

    it("does not call the API when confirm is missing", async () => {
        await expect(
            handleProTool("pro_create_order", {
                pair: "BTC-USD",
                side: "buy",
                type: "market",
                amount: "1",
            })
        ).rejects.toThrow(/confirm=true/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("forwards a stable idempotency_key on confirmed writes", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({ id: VALID_UUID });
        await handleProTool("pro_cancel_order", {
            order_id: VALID_UUID,
            confirm: true,
            idempotency_key: VALID_UUID,
        });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "DELETE",
            `/v1/trading/order/${VALID_UUID}`,
            undefined,
            undefined,
            undefined,
            undefined,
            { idempotencyKey: VALID_UUID }
        );
    });

    it("rejects broker_confirm_quote without a UUID proforma_id", async () => {
        await expect(handleBrokerTool("broker_confirm_quote", { proforma_id: "not-a-uuid" })).rejects.toThrow(
            /Invalid proforma_id/
        );
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });
});
