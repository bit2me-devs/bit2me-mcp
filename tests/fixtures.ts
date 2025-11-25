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
        name: "Euro Wallet"
    },
    {
        id: "uuid-wallet-btc",
        currency: "BTC",
        balance: "0.5",
        available: "0.45",
        name: "Bitcoin Wallet"
    },
    {
        id: "uuid-wallet-eth",
        currency: "ETH",
        balance: "2.5",
        available: "2.3",
        name: "Ethereum Wallet"
    }
];

// Pro Trading Wallet Mock Response
export const MOCK_PRO_WALLETS = [
    {
        currency: "BTC",
        balance: "1.0",
        blockedBalance: "0.1",
        available: "0.9"
    },
    {
        currency: "EUR",
        balance: "5000.00",
        blockedBalance: "500.00",
        available: "4500.00"
    }
];

// Earn Positions Mock Response
export const MOCK_EARN_POSITIONS = [
    {
        id: "uuid-earn-1",
        currency: "USDT",
        balance: "1000.00",
        apy: "5.5",
        status: "ACTIVE"
    },
    {
        id: "uuid-earn-2",
        currency: "BTC",
        balance: "0.1",
        apy: "3.2",
        status: "ACTIVE"
    }
];

// Loan Positions Mock Response
export const MOCK_LOAN_POSITIONS = [
    {
        id: "uuid-loan-1",
        collateralCurrency: "BTC",
        collateralAmount: "0.5",
        loanCurrency: "EUR",
        loanAmount: "10000.00",
        status: "ACTIVE"
    }
];

// Ticker Mock Response
export const MOCK_TICKER_BTC_EUR = {
    price: "50000.00",
    high24h: "51000.00",
    low24h: "49000.00",
    volume24h: "1000000.00"
};

export const MOCK_TICKER_ETH_EUR = {
    price: "3000.00",
    high24h: "3100.00",
    low24h: "2900.00",
    volume24h: "500000.00"
};

// Transaction Mock Response
export const MOCK_TRANSACTIONS = {
    data: [
        {
            id: "uuid-tx-1",
            type: "DEPOSIT",
            currency: "EUR",
            amount: "1000.00",
            status: "COMPLETED",
            createdAt: "2024-01-01T10:00:00Z"
        },
        {
            id: "uuid-tx-2",
            type: "WITHDRAWAL",
            currency: "BTC",
            amount: "0.1",
            status: "COMPLETED",
            createdAt: "2024-01-02T15:30:00Z"
        }
    ]
};

// Market Orders Mock Response
export const MOCK_ORDERS = [
    {
        id: "uuid-order-1",
        type: "BUY",
        pair: "BTC-EUR",
        amount: "0.1",
        price: "50000.00",
        status: "FILLED"
    },
    {
        id: "uuid-order-2",
        type: "SELL",
        pair: "ETH-EUR",
        amount: "1.0",
        price: "3000.00",
        status: "PENDING"
    }
];

// Account Info Mock Response
export const MOCK_ACCOUNT_INFO = {
    userId: "uuid-user-123",
    email: "test@example.com",
    verified: true,
    kycLevel: "ADVANCED"
};
