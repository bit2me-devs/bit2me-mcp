import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleWalletTool } from "../../src/tools/wallet.js";
import * as bit2meService from "../../src/services/bit2me.js";

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
        const mockPockets = [{ id: "1", currency: "BTC", amount: "1.5" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockPockets);

        const result = await handleWalletTool("wallet_get_pockets", {});

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", {});
        expect(JSON.parse(result.content[0].text)).toHaveLength(1);
    });

    it("should handle wallet_get_pocket_details", async () => {
        const mockPocket = { id: "1", currency: "BTC" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([mockPocket]);

        const result = await handleWalletTool("wallet_get_pocket_details", { pocketId: "1" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/pocket", { id: "1" });
        expect(JSON.parse(result.content[0].text)).toEqual(expect.objectContaining({ id: "1" }));
    });

    it("should handle wallet_get_pocket_details not found", async () => {
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue([]);
        const result = await handleWalletTool("wallet_get_pocket_details", { pocketId: "1" });
        expect(result.content[0].text).toBe("Pocket not found.");
    });

    it("should handle wallet_get_pocket_addresses", async () => {
        const mockAddresses = [{ address: "abc", network: "bitcoin" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockAddresses);

        await handleWalletTool("wallet_get_pocket_addresses", { pocketId: "1", network: "bitcoin" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v2/wallet/pocket/1/bitcoin/address");
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

        const result = await handleWalletTool("wallet_get_networks", { currency: "BTC" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/currency/BTC/network");
        const content = JSON.parse(result.content[0].text);
        expect(content).toHaveLength(1);
        expect(content[0]).toEqual({
            id: "bitcoin",
            name: "bitcoin",
            native_currency_code: "BTC",
            fee_currency_code: "BTC",
            has_tag: false,
        });
    });

    it("should handle wallet_get_transactions", async () => {
        const mockTxs = [{ id: "tx1", amount: "100" }];
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockTxs);

        await handleWalletTool("wallet_get_transactions", { currency: "EUR", limit: "5" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/transaction", {
            currency: "EUR",
            limit: "5",
        });
    });

    it("should handle wallet_get_transaction_details", async () => {
        const mockTx = { id: "tx1", status: "completed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockTx);

        await handleWalletTool("wallet_get_transaction_details", { transactionId: "tx1" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("GET", "/v1/wallet/transaction/tx1");
    });

    it("should handle wallet_create_proforma", async () => {
        const mockProforma = { id: "pf1", amount: "100" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockProforma);

        const args = { origin_pocket_id: "p1", destination_pocket_id: "p2", amount: "100", currency: "EUR" };
        await handleWalletTool("wallet_create_proforma", args);

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith(
            "POST",
            "/v1/wallet/transaction/proforma",
            expect.any(Object)
        );
    });

    it("should handle wallet_confirm_transaction", async () => {
        const mockConfirm = { status: "confirmed" };
        vi.mocked(bit2meService.bit2meRequest).mockResolvedValue(mockConfirm);

        await handleWalletTool("wallet_confirm_transaction", { proforma_id: "pf1" });

        expect(bit2meService.bit2meRequest).toHaveBeenCalledWith("POST", "/v2/wallet/transaction/pf1/confirm");
    });

    it("should throw error for unknown tool", async () => {
        await expect(handleWalletTool("unknown_tool", {})).rejects.toThrow("Unknown wallet tool");
    });
});
