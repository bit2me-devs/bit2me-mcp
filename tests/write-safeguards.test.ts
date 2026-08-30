import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProTool } from "../src/tools/pro.js";
import { handleBrokerTool } from "../src/tools/broker.js";
import { dispatchTool } from "../src/tools/registry.js";
import * as bit2meService from "../src/services/bit2me.js";
import { ValidationError } from "../src/utils/errors.js";
import { getAllToolsMetadata } from "../src/utils/tool-metadata.js";
import { resolveIdempotencyKey, requireConfirm, writeRequiresConfirm } from "../src/utils/write-guards.js";

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

    it("defaults new WRITE tools to confirm; broker quotes stay exempt", () => {
        expect(writeRequiresConfirm("pro_create_order")).toBe(true);
        expect(writeRequiresConfirm("loan_payback")).toBe(true);
        expect(writeRequiresConfirm("broker_quote_buy")).toBe(false);
        expect(writeRequiresConfirm("broker_confirm_quote")).toBe(true);
        expect(writeRequiresConfirm("pro_get_balance")).toBe(false);
    });

    it("requires confirm on every WRITE except broker_quote_*", () => {
        for (const tool of getAllToolsMetadata()) {
            if (tool.type !== "WRITE") continue;
            const exempt = tool.name.startsWith("broker_quote_");
            expect(writeRequiresConfirm(tool.name), tool.name).toBe(!exempt);
        }
    });

    it("resolveIdempotencyKey reuses a safe caller key", () => {
        expect(resolveIdempotencyKey({ idempotency_key: VALID_UUID })).toBe(VALID_UUID);
    });

    it("resolveIdempotencyKey rejects CRLF and oversize keys", () => {
        expect(() => resolveIdempotencyKey({ idempotency_key: "abc\r\nX" })).toThrow(ValidationError);
        expect(() => resolveIdempotencyKey({ idempotency_key: "a".repeat(129) })).toThrow(ValidationError);
    });

    it("returns a preview and does not call the API when confirm is missing", async () => {
        const result = await handleProTool("pro_create_order", {
            pair: "BTC-USD",
            side: "buy",
            type: "market",
            amount: "1",
        });
        const payload = JSON.parse(result.content[0].text);
        expect(payload.status).toBe("needs_confirmation");
        expect(payload.proposed_args).toMatchObject({
            pair: "BTC-USD",
            side: "buy",
            type: "market",
            amount: "1",
        });
        expect(payload.proposed_args.idempotency_key).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(payload.next_step).toMatch(/idempotency_key/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it.each([
        ["earn_deposit", { pocket_id: VALID_UUID, symbol: "BTC", amount: "1" }],
        ["earn_withdraw", { pocket_id: VALID_UUID, symbol: "BTC", amount: "1" }],
        [
            "loan_create",
            {
                guarantee_symbol: "BTC",
                guarantee_amount: "1",
                loan_symbol: "EUR",
                loan_amount: "100",
                amount_type: "fixed_collateral",
            },
        ],
        ["loan_payback", { order_id: VALID_UUID, payback_amount: "100" }],
        ["pro_deposit", { symbol: "EUR", amount: "100" }],
        ["pro_withdraw", { symbol: "EUR", amount: "100" }],
        ["broker_confirm_quote", { proforma_id: VALID_UUID }],
    ] as const)("preview %s does not call Bit2Me", async (name, args) => {
        const result = await dispatchTool(name, { ...args });
        const block = result.content[0];
        if (!block || block.type !== "text") {
            throw new Error("expected text content");
        }
        const payload = JSON.parse(block.text);
        expect(payload.status).toBe("needs_confirmation");
        expect(payload.proposed_args.idempotency_key).toEqual(expect.any(String));
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("does not treat confirm='true' as approval", async () => {
        const result = await handleProTool("pro_cancel_all_orders", { confirm: "true" });
        const payload = JSON.parse(result.content[0].text);
        expect(payload.status).toBe("needs_confirmation");
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
        await expect(
            handleBrokerTool("broker_confirm_quote", { proforma_id: "not-a-uuid", confirm: true })
        ).rejects.toThrow(/Invalid proforma_id/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });
});
