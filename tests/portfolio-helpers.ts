import { vi } from "vitest";
import { MOCK_WALLET_POCKETS, MOCK_PRO_WALLETS, MOCK_EARN_WALLETS } from "./fixtures.js";

export const PORTFOLIO_MOCK_CONFIG = {
    BIT2ME_API_KEY: "test-api-key",
    BIT2ME_API_SECRET: "test-api-secret",
    REQUEST_TIMEOUT: 30000,
    LOG_LEVEL: "info",
    MAX_RETRIES: 3,
    RETRY_BASE_DELAY: 1000,
    INCLUDE_RAW_RESPONSE: false,
};

export function mockStandardBalances(bit2meRequest: ReturnType<typeof vi.fn>) {
    vi.mocked(bit2meRequest).mockImplementation(async (_method: string, endpoint: string) => {
        if (endpoint === "/v1/wallet/pocket") return MOCK_WALLET_POCKETS;
        if (endpoint === "/v1/trading/wallet/balance") return MOCK_PRO_WALLETS;
        if (endpoint === "/v2/earn/wallets") return MOCK_EARN_WALLETS;
        if (endpoint === "/v1/loan/orders") return { data: [] };
        return [];
    });
}

export function mockStandardPrices(getMarketPrice: ReturnType<typeof vi.fn>) {
    vi.mocked(getMarketPrice).mockImplementation(async (crypto: string) => {
        if (crypto === "EUR") return 1;
        if (crypto === "BTC") return 50000;
        if (crypto === "ETH") return 3000;
        if (crypto === "USDT") return 0.95;
        return 0;
    });
}
