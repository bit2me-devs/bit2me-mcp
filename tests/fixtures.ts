/**
 * Mock data fixtures for testing
 * These are based on the Bit2Me API Swagger documentation
 */

// Wallet Pockets Mock Response
export const MOCK_WALLET_POCKETS = [
    {
        id: "uuid-wallet-eur",
        currency: "EUR",
        balance: "1000.50",
        available: "950.00",
        name: "Euro Wallet",
    },
    {
        id: "uuid-wallet-btc",
        currency: "BTC",
        balance: "0.5",
        available: "0.45",
        name: "Bitcoin Wallet",
    },
    {
        id: "uuid-wallet-eth",
        currency: "ETH",
        balance: "2.5",
        available: "2.3",
        name: "Ethereum Wallet",
    },
];

// Pro Trading Wallet Mock Response
export const MOCK_PRO_WALLETS = [
    {
        currency: "BTC",
        balance: "1.0",
        blockedBalance: "0.1",
        available: "0.9",
    },
    {
        currency: "EUR",
        balance: "5000.00",
        blockedBalance: "500.00",
        available: "4500.00",
    },
];

export const MOCK_EARN_WALLETS = [
    {
        id: "uuid-earn-1",
        currency: "USDT",
        balance: "1000.00",
        apy: "5.5",
        status: "ACTIVE",
    },
    {
        id: "uuid-earn-2",
        currency: "BTC",
        balance: "0.1",
        apy: "3.2",
        status: "ACTIVE",
    },
];

// Ticker Mock Response
export const MOCK_TICKER_BTC_EUR = {
    price: "50000.00",
    high24h: "51000.00",
    low24h: "49000.00",
    volume24h: "1000000.00",
};
