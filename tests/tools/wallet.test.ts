import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleWalletTool } from "../../src/tools/wallet.js";
import * as bit2meService from "../../src/services/bit2me.js";
import { NotFoundError } from "../../src/utils/errors.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_UUID_2 = "123e4567-e89b-12d3-a456-426614174001";

vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: () => ({
        INCLUDE_RAW_RESPONSE: false,
    }),
}));

describe("Wallet Tools Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should handle wallet_get_pockets", async () => {
        const mockPockets = [{ id: VALID_UUID, currency: "BTC", amount: "1.5" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockPockets);

        const result = await handleWalletTool("wallet_get_pockets", {});

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", {});
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toHaveLength(1);
    });

    it("should handle wallet_get_pocket_details", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([mockPocket]);

        const result = await handleWalletTool("wallet_get_pocket_details", { pocket_id: VALID_UUID });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toHaveProperty("request");
        expect(parsed).toHaveProperty("result");
        expect(parsed.result).toEqual(expect.objectContaining({ id: VALID_UUID }));
    });

    it("should handle wallet_get_pocket_details not found", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        await expect(handleWalletTool("wallet_get_pocket_details", { pocket_id: VALID_UUID })).rejects.toThrow(
            NotFoundError
        );
    });

    it("should handle wallet_get_pocket_addresses", async () => {
        const mockAddresses = [{ address: "abc", network: "bitcoin" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAddresses);

        await handleWalletTool("wallet_get_pocket_addresses", { pocket_id: VALID_UUID, network: "bitcoin" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "GET",
            `/v2/wallet/pocket/${VALID_UUID}/bitcoin/address`
        );
    });

    it("should handle wallet_get_networks", async () => {
        const mockNetworks = [
            {
                id: "bitcoin",
                name: "bitcoin",
                nativeCurrencyCode: "BTC",
                feeCurrencyCode: "BTC",
                hasTag: false,
            },
        ];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockNetworks);

        const result = await handleWalletTool("wallet_get_networks", { symbol: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/currency/BTC/network");
        const content = JSON.parse(result.content[0].text);
        expect(content).toHaveProperty("request");
        expect(content).toHaveProperty("result");
        expect(content.result).toHaveLength(1);
        expect(content.result[0]).toEqual({
            id: "bitcoin",
            name: "bitcoin",
            native_symbol: "BTC",
            fee_symbol: "BTC",
            has_tag: false,
        });
    });

    it("should handle wallet_get_movements", async () => {
        const mockResponse = {
            data: [{ id: VALID_UUID, denomination: { amount: "100", currency: "EUR" } }],
            total: 1,
        };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockResponse);

        await handleWalletTool("wallet_get_movements", { symbol: "EUR", limit: 5 });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/wallet/transaction", {
            currency: "EUR",
            limit: 5,
            offset: 0,
        });
    });

    it("should handle wallet_get_movement_details", async () => {
        const mockTx = { id: VALID_UUID, status: "completed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockTx);

        await handleWalletTool("wallet_get_movement_details", { movement_id: VALID_UUID });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", `/v1/wallet/transaction/${VALID_UUID}`);
    });

    it("should handle wallet_buy_crypto", async () => {
        const mockPocket = { id: VALID_UUID, currency: "EUR", balance: "1000" };
        const mockProforma = { id: VALID_UUID, amount: "100" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "100" };
        await handleWalletTool("wallet_buy_crypto", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "buy",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "100",
            })
        );
    });

    it("should handle wallet_sell_crypto", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleWalletTool("wallet_sell_crypto", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "sell",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
            })
        );
    });

    it("should handle wallet_swap_crypto", async () => {
        const mockPocket = { id: VALID_UUID, currency: "BTC", balance: "1.5" };
        const mockProforma = { id: VALID_UUID, amount: "0.001" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValueOnce([mockPocket]).mockResolvedValueOnce(mockProforma);

        const args = { origin_pocket_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "0.001" };
        await handleWalletTool("wallet_swap_crypto", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: VALID_UUID });
        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "purchase",
                pocket: VALID_UUID,
                destination: { pocket: VALID_UUID_2 },
                amount: "0.001",
            })
        );
    });

    it("should handle wallet_buy_crypto_with_card", async () => {
        const mockProforma = { id: VALID_UUID, amount: "100" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockProforma);

        const args = { card_id: VALID_UUID, destination_pocket_id: VALID_UUID_2, amount: "100", currency: "EUR" };
        await handleWalletTool("wallet_buy_crypto_with_card", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.objectContaining({
                operation: "buy",
                origin: { creditcard: { cardId: VALID_UUID } },
                destination: { pocket: VALID_UUID_2 },
                amount: "100",
                currency: "EUR",
            })
        );
    });

    it("should handle wallet_confirm_operation", async () => {
        const mockConfirm = { status: "confirmed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockConfirm);

        await handleWalletTool("wallet_confirm_operation", { proforma_id: VALID_UUID });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v1/wallet/transaction", {
            proforma: VALID_UUID,
        });
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleWalletTool("unknown_tool", {})).rejects.toThrow("Unknown wallet tool");
    });
});
