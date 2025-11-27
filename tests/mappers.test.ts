import { describe, it, expect } from "vitest";
import {
    mapTickerResponse,
    mapAssetsResponse,
    mapMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
    mapCandlesResponse,
    mapWalletPocketsResponse,
    mapWalletAddressesResponse,
    mapWalletTransactionsResponse,
    mapWalletTransactionDetailsResponse,
    mapProformaResponse,
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnWalletsResponse,
    mapEarnTransactionsResponse,
    mapEarnWalletDetailsResponse,
    mapEarnTransactionsSummaryResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnWalletRewardsConfigResponse,
    mapEarnWalletRewardsSummaryResponse,
    mapLoanOrdersResponse,
    mapLoanTransactionsResponse,
    mapLoanConfigResponse,
    mapLoanLTVResponse,
    mapLoanOrderDetailsResponse,
    mapProBalanceResponse,
    mapProOrderResponse,
    mapProOpenOrdersResponse,
    mapProOrderTradesResponse,
    mapTransactionConfirmationResponse,
    mapEarnCreateTransactionResponse,
    mapProDepositResponse,
} from "../src/utils/response-mappers.js";
import { ValidationError } from "../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Market Mappers", () => {
        it("should map ticker response with correct field transformations", () => {
            const valid = {
                time: 123,
                price: "100",
                marketCap: "1M",
                totalVolume: "10k",
                maxSupply: "21M",
                totalSupply: "19M",
            };
            const result = mapTickerResponse(valid);

            // Verify critical fields are present and correctly mapped
            expect(result).toMatchObject({
                time: 123,
                price: "100",
                market_cap: expect.any(String),
                volume_24h: expect.any(String),
            });

            // Verify specific transformations
            expect(result.market_cap).toBe("1M");
            expect(result.volume_24h).toBe("10k");
        });

        it("should throw ValidationError on invalid ticker data", () => {
            expect(() => mapTickerResponse({})).toThrow(ValidationError);
        });

        it("should validate assets response", () => {
            const valid = {
                BTC: {
                    name: "Bitcoin",
                    assetType: "crypto",
                    network: "bitcoin",
                    enabled: true,
                    ticker: true,
                    loanable: true,
                    pairsWith: ["EUR"],
                },
            };
            expect(mapAssetsResponse(valid)).toEqual([
                {
                    symbol: "BTC",
                    name: "Bitcoin",
                    asset_type: "crypto",
                    network: "bitcoin",
                    enabled: true,
                    tradeable: true,
                    loanable: true,
                    pairs_with: ["EUR"],
                },
            ]);
            expect(() => mapAssetsResponse(null)).toThrow(ValidationError);
        });

        it("should map market config response", () => {
            expect(mapMarketConfigResponse(null)).toEqual([]);
            const valid = {
                "BTC/EUR": {
                    basePrecision: 8,
                    quotePrecision: 2,
                    minAmount: "0.001",
                    maxAmount: "10",
                    status: "active",
                },
            };
            expect(mapMarketConfigResponse(valid)).toEqual([
                {
                    symbol: "BTC/EUR",
                    base_precision: 8,
                    quote_precision: 2,
                    min_amount: "0.001",
                    max_amount: "10",
                    status: "active",
                },
            ]);
        });

        it("should map order book response", () => {
            expect(() => mapOrderBookResponse(null)).toThrow(ValidationError);
            const valid = {
                symbol: "BTC/EUR",
                bids: [["100", "1"]],
                asks: [{ price: "101", amount: "1" }],
                timestamp: 123,
            };
            expect(mapOrderBookResponse(valid)).toEqual({
                symbol: "BTC/EUR",
                bids: [{ price: "100", amount: "1" }],
                asks: [{ price: "101", amount: "1" }],
                timestamp: 123,
            });
            // Test defaults
            expect(mapOrderBookResponse({})).toEqual({
                symbol: "",
                bids: [],
                asks: [],
                timestamp: expect.any(Number),
            });
        });

        it("should map public trades response", () => {
            expect(mapPublicTradesResponse(null)).toEqual([]);
            const valid = [{ id: "1", symbol: "BTC/EUR", price: "100", amount: "1", side: "buy", timestamp: 123 }];
            expect(mapPublicTradesResponse(valid)).toEqual([
                {
                    id: "1",
                    symbol: "BTC/EUR",
                    price: "100",
                    amount: "1",
                    side: "buy",
                    timestamp: 123,
                },
            ]);
            // Test defaults
            expect(mapPublicTradesResponse([{}])).toEqual([
                {
                    id: "",
                    symbol: "",
                    price: "0",
                    amount: "0",
                    side: "buy",
                    timestamp: expect.any(Number),
                },
            ]);
        });

        it("should map candles response", () => {
            expect(mapCandlesResponse(null)).toEqual([]);
            const valid = [{ timestamp: 123, open: "100", high: "110", low: "90", close: "105", volume: "10" }];
            expect(mapCandlesResponse(valid)).toEqual([
                {
                    timestamp: 123,
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
            // Test array format
            expect(mapCandlesResponse([[123, "100", "110", "90", "105", "10"]])).toEqual([
                {
                    timestamp: 123,
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
        });
    });

    describe("Wallet Mappers", () => {
        it("should validate wallet pockets response", () => {
            expect(() => mapWalletPocketsResponse({})).toThrow(ValidationError);
            const valid = [{ id: "1", currency: "EUR", balance: "100", available: "100", name: "Main" }];
            expect(mapWalletPocketsResponse(valid)).toEqual(valid);
        });

        it("should map wallet addresses response", () => {
            expect(mapWalletAddressesResponse(null)).toEqual([]);
            const valid = [{ address: "addr1", network: "btc", currency: "BTC", tag: "tag1" }];
            expect(mapWalletAddressesResponse(valid)).toEqual(valid);
            // Test defaults
            expect(mapWalletAddressesResponse([{}])).toEqual([
                {
                    address: "",
                    network: "",
                    currency: "",
                    tag: undefined,
                },
            ]);
        });

        it("should map wallet transactions response", () => {
            expect(mapWalletTransactionsResponse(null)).toEqual([]);
            const valid = [
                {
                    id: "tx1",
                    date: "2023-01-01",
                    type: "deposit",
                    subtype: "fiat",
                    status: "completed",
                    denomination: { amount: "100", currency: "EUR" },
                    origin: { amount: "100", currency: "EUR", class: "bank" },
                    destination: { amount: "100", currency: "EUR", class: "wallet" },
                    fee: { mercantile: { amount: "1", currency: "EUR" } },
                },
            ];
            expect(mapWalletTransactionsResponse(valid)).toEqual([
                {
                    id: "tx1",
                    date: "2023-01-01",
                    type: "deposit",
                    subtype: "fiat",
                    status: "completed",
                    amount: "100",
                    currency: "EUR",
                    origin: { amount: "100", currency: "EUR", class: "bank" },
                    destination: { amount: "100", currency: "EUR", class: "wallet" },
                    fee: { amount: "1", currency: "EUR" },
                },
            ]);
            // Test defaults and missing optional fields
            expect(mapWalletTransactionsResponse([{}])).toEqual([
                {
                    id: "tx_0",
                    date: undefined,
                    type: undefined,
                    subtype: undefined,
                    status: undefined,
                    amount: "0",
                    currency: "",
                    origin: undefined,
                    destination: undefined,
                    fee: undefined,
                },
            ]);
        });

        it("should map wallet transaction details response", () => {
            expect(() => mapWalletTransactionDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                date: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                denomination: { amount: "100", currency: "EUR" },
                origin: { amount: "100", currency: "EUR", class: "bank", rate: { value: "1" } },
            };
            expect(mapWalletTransactionDetailsResponse(valid)).toEqual({
                id: "tx1",
                date: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                amount: "100",
                currency: "EUR",
                origin: { amount: "100", currency: "EUR", class: "bank", rate_applied: "1" },
                destination: undefined,
                fee: undefined,
            });
        });

        it("should map proforma response", () => {
            expect(() => mapProformaResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "pf1",
                originAmount: "100",
                originCurrency: "EUR",
                destinationAmount: "0.1",
                destinationCurrency: "BTC",
                rate: "1000",
                feeAmount: "1",
                validUntil: "2023-01-01",
            };
            expect(mapProformaResponse(valid)).toEqual({
                proforma_id: "pf1",
                origin_amount: "100",
                origin_currency: "EUR",
                destination_amount: "0.1",
                destination_currency: "BTC",
                rate: "1000",
                fee: "1",
                expires_at: "2023-01-01",
            });
        });
    });

    describe("Earn Mappers", () => {
        it("should map earn summary response", () => {
            expect(mapEarnSummaryResponse(null)).toEqual([]);
            const valid = [{ currency: "BTC", totalBalance: "1", rewardsEarned: "0.1", apy: "5" }];
            expect(mapEarnSummaryResponse(valid)).toEqual([
                {
                    currency: "BTC",
                    total_balance: "1",
                    rewards_earned: "0.1",
                    apy: "5",
                },
            ]);
        });

        it("should map earn APY response", () => {
            expect(mapEarnAPYResponse(null)).toEqual({});
            const valid = { BTC: { daily: "0.01", weekly: "0.07", monthly: "0.3" } };
            expect(mapEarnAPYResponse(valid)).toEqual({
                BTC: {
                    currency: "BTC",
                    daily: "0.01",
                    weekly: "0.07",
                    monthly: "0.3",
                },
            });
        });

        it("should map earn wallets response", () => {
            expect(mapEarnWalletsResponse(null)).toEqual([]);
            const valid = [
                { id: "1", currency: "BTC", totalBalance: "1", strategy: "flexible", apy: "5", status: "active" },
            ];
            expect(mapEarnWalletsResponse(valid)).toEqual([
                {
                    id: "1",
                    currency: "BTC",
                    balance: "1",
                    strategy: "flexible",
                    apy: "5",
                    status: "active",
                },
            ]);
        });

        it("should map earn transactions response", () => {
            expect(mapEarnTransactionsResponse(null)).toEqual([]);
            const valid = [
                { id: "1", type: "deposit", currency: "BTC", amount: "1", date: "2023-01-01", status: "completed" },
            ];
            expect(mapEarnTransactionsResponse(valid)).toEqual([
                {
                    id: "1",
                    type: "deposit",
                    currency: "BTC",
                    amount: "1",
                    date: "2023-01-01",
                    status: "completed",
                },
            ]);
        });

        it("should map earn wallet details response", () => {
            expect(() => mapEarnWalletDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "1",
                currency: "BTC",
                totalBalance: "1",
                strategy: "flexible",
                apy: "5",
                status: "active",
                createdAt: "2023-01-01",
            };
            expect(mapEarnWalletDetailsResponse(valid)).toEqual({
                id: "1",
                currency: "BTC",
                balance: "1",
                strategy: "flexible",
                apy: "5",
                status: "active",
                created_at: "2023-01-01",
            });
        });

        it("should map earn transactions summary response", () => {
            expect(() => mapEarnTransactionsSummaryResponse(null)).toThrow(ValidationError);
            const valid = { type: "deposit", totalAmount: "10", totalCount: 5, currency: "BTC" };
            expect(mapEarnTransactionsSummaryResponse(valid)).toEqual({
                type: "deposit",
                total_amount: "10",
                total_count: 5,
                currency: "BTC",
            });
        });

        it("should map earn assets response", () => {
            expect(mapEarnAssetsResponse(null)).toEqual({ assets: [] });
            const valid = { assets: ["BTC", "ETH"] };
            expect(mapEarnAssetsResponse(valid)).toEqual({ assets: ["BTC", "ETH"] });
        });

        it("should map earn rewards config response", () => {
            expect(() => mapEarnRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = { distributionFrequency: "daily", minimumBalance: "0.001", compounding: true };
            expect(mapEarnRewardsConfigResponse(valid)).toEqual({
                distribution_frequency: "daily",
                minimum_balance: "0.001",
                compounding: true,
            });
        });

        it("should map earn wallet rewards config response", () => {
            expect(() => mapEarnWalletRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "1",
                currency: "BTC",
                distributionFrequency: "daily",
                nextDistribution: "2023-01-02",
            };
            expect(mapEarnWalletRewardsConfigResponse(valid)).toEqual({
                wallet_id: "1",
                currency: "BTC",
                distribution_frequency: "daily",
                next_distribution: "2023-01-02",
            });
        });

        it("should map earn wallet rewards summary response", () => {
            expect(() => mapEarnWalletRewardsSummaryResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "1",
                currency: "BTC",
                totalRewards: "0.1",
                lastReward: "0.001",
                lastRewardDate: "2023-01-01",
            };
            expect(mapEarnWalletRewardsSummaryResponse(valid)).toEqual({
                wallet_id: "1",
                currency: "BTC",
                total_rewards: "0.1",
                last_reward: "0.001",
                last_reward_date: "2023-01-01",
            });
        });
    });

    describe("Loan Mappers", () => {
        it("should map loan orders response", () => {
            expect(mapLoanOrdersResponse(null)).toEqual([]);
            const valid = {
                data: [
                    {
                        orderId: "1",
                        status: "active",
                        guaranteeCurrency: "BTC",
                        guaranteeAmount: "1",
                        loanCurrency: "EUR",
                        loanAmount: "1000",
                        remainingAmount: "1000",
                        ltv: "50",
                        apr: "5",
                        liquidationPriceReference: "20000",
                        createdAt: "2023-01-01",
                        expiresAt: "2024-01-01",
                    },
                ],
            };
            expect(mapLoanOrdersResponse(valid)).toEqual([
                {
                    order_id: "1",
                    status: "active",
                    guarantee_currency: "BTC",
                    guarantee_amount: "1",
                    loan_currency: "EUR",
                    loan_amount: "1000",
                    remaining_amount: "1000",
                    ltv: "50",
                    apr: "5",
                    liquidation_price: "20000",
                    created_at: "2023-01-01",
                    expires_at: "2024-01-01",
                },
            ]);
        });

        it("should map loan transactions response", () => {
            expect(mapLoanTransactionsResponse(null)).toEqual([]);
            const valid = [
                {
                    id: "1",
                    orderId: "o1",
                    type: "repayment",
                    amount: "100",
                    currency: "EUR",
                    date: "2023-01-01",
                    status: "completed",
                },
            ];
            expect(mapLoanTransactionsResponse(valid)).toEqual([
                {
                    id: "1",
                    order_id: "o1",
                    type: "repayment",
                    amount: "100",
                    currency: "EUR",
                    date: "2023-01-01",
                    status: "completed",
                },
            ]);
        });

        it("should map loan config response", () => {
            expect(mapLoanConfigResponse(null)).toEqual([]);
            const valid = [
                {
                    currency: "BTC",
                    minGuarantee: "0.001",
                    maxLtv: "70",
                    apr: "5",
                    availableAsGuarantee: true,
                    availableAsLoan: false,
                },
            ];
            expect(mapLoanConfigResponse(valid)).toEqual([
                {
                    currency: "BTC",
                    min_guarantee: "0.001",
                    max_ltv: "70",
                    apr: "5",
                    available_as_guarantee: true,
                    available_as_loan: false,
                },
            ]);
        });

        it("should map loan LTV response", () => {
            expect(() => mapLoanLTVResponse(null)).toThrow(ValidationError);
            const valid = { ltv: "50", maxLoanAmount: "1000", liquidationPrice: "20000", healthFactor: "1.5" };
            expect(mapLoanLTVResponse(valid)).toEqual({
                ltv: "50",
                max_loan_amount: "1000",
                liquidation_price: "20000",
                health_factor: "1.5",
            });
        });

        it("should map loan order details response", () => {
            expect(() => mapLoanOrderDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                orderId: "1",
                status: "active",
                guaranteeCurrency: "BTC",
                guaranteeAmount: "1",
                loanCurrency: "EUR",
                loanAmount: "1000",
                remainingAmount: "1000",
                ltv: "50",
                apr: "5",
                liquidationPriceReference: "20000",
                createdAt: "2023-01-01",
                expiresAt: "2024-01-01",
            };
            expect(mapLoanOrderDetailsResponse(valid)).toEqual({
                order_id: "1",
                status: "active",
                guarantee_currency: "BTC",
                guarantee_amount: "1",
                loan_currency: "EUR",
                loan_amount: "1000",
                remaining_amount: "1000",
                ltv: "50",
                apr: "5",
                liquidation_price: "20000",
                created_at: "2023-01-01",
                expires_at: "2024-01-01",
                apr_details: undefined,
            });
        });
    });

    describe("Pro Mappers", () => {
        it("should map pro balance response", () => {
            expect(mapProBalanceResponse(null)).toEqual([]);
            const valid = [
                { currency: "EUR", balance: 100, blockedBalance: 10 },
                { currency: "BTC", balance: 0, blockedBalance: 0 },
            ];
            expect(mapProBalanceResponse(valid)).toEqual([
                {
                    currency: "EUR",
                    balance: 100,
                    blocked_balance: 10,
                    available: 90,
                },
            ]);
        });

        it("should map pro order response", () => {
            expect(() => mapProOrderResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "1",
                symbol: "BTC/EUR",
                side: "buy",
                type: "limit",
                status: "open",
                price: "20000",
                amount: "1",
                filled: "0",
                remaining: "1",
                createdAt: "2023-01-01",
            };
            expect(mapProOrderResponse(valid)).toEqual({
                id: "1",
                symbol: "BTC/EUR",
                side: "buy",
                type: "limit",
                status: "open",
                price: "20000",
                amount: "1",
                filled: "0",
                remaining: "1",
                created_at: "2023-01-01",
            });
        });

        it("should map pro open orders response", () => {
            expect(mapProOpenOrdersResponse(null)).toEqual({ orders: [] });
            const valid = [
                {
                    id: "1",
                    symbol: "BTC/EUR",
                    side: "buy",
                    type: "limit",
                    status: "open",
                    price: "20000",
                    amount: "1",
                    filled: "0",
                    remaining: "1",
                    createdAt: "2023-01-01",
                },
            ];
            expect(mapProOpenOrdersResponse(valid)).toEqual({
                orders: [
                    {
                        id: "1",
                        symbol: "BTC/EUR",
                        side: "buy",
                        type: "limit",
                        status: "open",
                        price: "20000",
                        amount: "1",
                        filled: "0",
                        remaining: "1",
                        created_at: "2023-01-01",
                    },
                ],
            });
        });

        it("should map pro order trades response", () => {
            expect(mapProOrderTradesResponse(null)).toEqual({ order_id: "", trades: [] });
            const valid = {
                orderId: "o1",
                trades: [
                    {
                        id: "t1",
                        orderId: "o1",
                        symbol: "BTC/EUR",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        timestamp: 123,
                    },
                ],
            };
            expect(mapProOrderTradesResponse(valid)).toEqual({
                order_id: "o1",
                trades: [
                    {
                        id: "t1",
                        order_id: "o1",
                        symbol: "BTC/EUR",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        timestamp: 123,
                    },
                ],
            });
        });
    });

    describe("Operation Mappers", () => {
        it("should map transaction confirmation response", () => {
            expect(() => mapTransactionConfirmationResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", status: "confirmed", message: "Success" };
            expect(mapTransactionConfirmationResponse(valid)).toEqual({
                transaction_id: "tx1",
                status: "confirmed",
                message: "Success",
            });
        });

        it("should map earn create transaction response", () => {
            expect(() => mapEarnCreateTransactionResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                type: "deposit",
                currency: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            };
            expect(mapEarnCreateTransactionResponse(valid)).toEqual({
                transaction_id: "tx1",
                type: "deposit",
                currency: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            });
        });

        it("should map pro deposit response", () => {
            expect(() => mapProDepositResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", currency: "EUR", amount: "100", status: "completed", message: "Deposited" };
            expect(mapProDepositResponse(valid)).toEqual({
                transaction_id: "tx1",
                currency: "EUR",
                amount: "100",
                status: "completed",
                message: "Deposited",
            });
        });
    });
});
