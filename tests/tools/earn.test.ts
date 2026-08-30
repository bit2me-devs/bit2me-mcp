import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleEarnTool } from "../../src/tools/earn.js";
import * as bit2meService from "../../src/services/bit2me.js";
import { ValidationError } from "../../src/utils/errors.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const DEPOSIT_ARGS = { pocket_id: VALID_UUID, symbol: "BTC", amount: "1" };

vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false, API_KEY: "test", API_SECRET: "test" }),
}));

function parseText(result: { content: Array<{ text: string }> }) {
    return JSON.parse(result.content[0].text);
}

describe("Earn Tools — gaps", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(["earn_deposit", "earn_withdraw"] as const)(
        "%s without confirm returns needs_confirmation and skips API",
        async (name) => {
            const result = await handleEarnTool(name, { ...DEPOSIT_ARGS });
            expect(parseText(result).status).toBe("needs_confirmation");
            expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
        }
    );

    it.each(["0", "10abc"])("earn_deposit rejects amount %s and skips API", async (amount) => {
        await expect(handleEarnTool("earn_deposit", { ...DEPOSIT_ARGS, amount, confirm: true })).rejects.toThrow(
            ValidationError
        );
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("earn_withdraw rejects amount 0 and skips API", async () => {
        await expect(handleEarnTool("earn_withdraw", { ...DEPOSIT_ARGS, amount: "0", confirm: true })).rejects.toThrow(
            ValidationError
        );
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("rejects invalid pocket_id on confirmed earn_deposit", async () => {
        await expect(
            handleEarnTool("earn_deposit", { ...DEPOSIT_ARGS, pocket_id: "not-a-uuid", confirm: true })
        ).rejects.toThrow(/Invalid pocket_id/);
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("rejects invalid position_id on earn_get_positions", async () => {
        await expect(handleEarnTool("earn_get_positions", { position_id: "not-a-uuid" })).rejects.toThrow(
            /Invalid position_id/
        );
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("throws for unknown earn tool", async () => {
        await expect(handleEarnTool("unknown_earn", {})).rejects.toThrow("Unknown earn tool");
        expect(bit2meService.bit2meRequest).not.toHaveBeenCalled();
    });

    it("maps earn_get_summary fields from API currency/totalBalance", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([
            { currency: "BTC", totalBalance: "1", totalRewards: "0.1" },
        ]);
        const parsed = parseText(await handleEarnTool("earn_get_summary", {}));
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/earn/summary");
        expect(parsed.result).toEqual([{ symbol: "BTC", total_balance: "1", total_rewards: "0.1" }]);
        expect(parsed.metadata.total_records).toBe(1);
    });

    it("maps earn_get_positions walletId/totalBalance to position_id/balance", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            data: [{ walletId: VALID_UUID, currency: "EUR", totalBalance: "100", status: "active" }],
        });
        const parsed = parseText(await handleEarnTool("earn_get_positions", {}));
        expect(parsed.result[0]).toMatchObject({
            position_id: VALID_UUID,
            symbol: "EUR",
            balance: "100",
            strategy: "flexible",
        });
        expect(parsed.result[0]).not.toHaveProperty("apy");
    });

    it("maps earn_get_movements_summary totals and symbol", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            type: "deposit",
            totalAmount: "10",
            totalCount: 5,
            currency: "BTC",
        });
        const parsed = parseText(await handleEarnTool("earn_get_movements_summary", { type: "deposit" }));
        expect(parsed.request.type).toBe("deposit");
        expect(parsed.result).toEqual({
            type: "deposit",
            total_amount: "10",
            total_count: 5,
            symbol: "BTC",
        });
    });

    it("maps earn_get_position_movements nested amount/walletId", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue({
            total: 1,
            data: [
                {
                    movementId: "1",
                    type: "deposit",
                    amount: { value: "1", currency: "BTC" },
                    createdAt: "2023-01-01T00:00:00Z",
                    walletId: VALID_UUID,
                },
            ],
        });
        const parsed = parseText(await handleEarnTool("earn_get_position_movements", { position_id: VALID_UUID }));
        expect(parsed.result[0]).toMatchObject({
            id: "1",
            type: "deposit",
            symbol: "BTC",
            amount: "1",
            position_id: VALID_UUID,
        });
        expect(parsed.metadata.total_records).toBe(1);
    });
});
