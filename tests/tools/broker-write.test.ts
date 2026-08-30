import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBrokerTool } from "../../src/tools/broker.js";
import * as bit2meService from "../../src/services/bit2me.js";

vi.mock("axios");
vi.mock("../../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";

describe("Broker Tools Handler — write", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle broker_quote_buy", async () => {
        const mockPocket = { id: VALID_UUID, currency: "EUR", balance: "1000" };
        const mockProforma = { id: VALID_UUID, amount: "100" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "100" };
        await handleBrokerTool("broker_quote_buy", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "100",
                currency: "EUR",
            }),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle broker_quote_sell", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleBrokerTool("broker_quote_sell", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
                currency: "BTC",
            }),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle broker_quote_swap", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleBrokerTool("broker_quote_swap", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", {});
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
                currency: "BTC",
                type: "SEA",
                userCurrency: "EUR",
            }),
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it("should handle broker_confirm_quote", async () => {
        const mockConfirm = { status: "confirmed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockConfirm);

        await handleBrokerTool("broker_confirm_quote", { proforma_id: VALID_UUID, confirm: true });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction",
            { proforma: VALID_UUID },
            undefined,
            undefined,
            undefined,
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });
});
