import { describe, it, expect } from "vitest";
import {
    mapTickerResponse,
    mapAssetsResponse,
    mapProMarketConfigResponse,
    mapOrderBookResponse,
    mapPublicTradesResponse,
    mapCandlesResponse,
    mapWalletPocketsResponse,
    mapWalletNetworksResponse,
    mapWalletAddressesResponse,
    mapWalletMovementsResponse,
    mapWalletMovementDetailsResponse,
    mapProformaResponse,
    mapEarnSummaryResponse,
    mapEarnAPYResponse,
    mapEarnPositionsResponse,
    mapEarnMovementsResponse,
    mapEarnPositionMovementsResponse,
    mapEarnPositionDetailsResponse,
    mapEarnMovementsSummaryResponse,
    mapEarnAssetsResponse,
    mapEarnRewardsConfigResponse,
    mapEarnPositionRewardsConfigResponse,
    mapEarnPositionRewardsSummaryResponse,
    mapLoanOrdersResponse,
    mapLoanMovementsResponse,
    mapLoanConfigResponse,
    mapLoanSimulationResponse,
    mapLoanOrderDetailsResponse,
    mapProBalanceResponse,
    mapProOrderResponse,
    mapProOpenOrdersResponse,
    mapProOrderTradesResponse,
    mapOperationConfirmationResponse,
    mapEarnOperationResponse,
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
            const result = mapTickerResponse(valid, "BTC", "EUR");

            // Verify critical fields are present and correctly mapped
            expect(result).toMatchObject({
                base_symbol: "BTC",
                quote_symbol: "EUR",
                date: expect.any(String),
                price: "100",
                market_cap: expect.any(String),
                volume_24h: expect.any(String),
            });

            // Verify specific transformations
            expect(result.market_cap).toBe("1M");
            expect(result.volume_24h).toBe("10k");
            expect(result.date).toBe(new Date(123).toISOString());
        });

        it("should throw ValidationError on invalid ticker data", () => {
            expect(() => mapTickerResponse({}, "BTC", "EUR")).toThrow(ValidationError);
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
                    type: "crypto",
                    network: "bitcoin",
                    enabled: true,
                    tradeable: true,
                    loanable: true,
                    pro_trading_pairs: ["BTC-EUR"],
                },
            ]);
            expect(() => mapAssetsResponse(null)).toThrow(ValidationError);
        });

        it("should normalize currency assetType to crypto", () => {
            const valid = {
                BTC: {
                    name: "Bitcoin",
                    assetType: "currency",
                    network: "bitcoin",
                    enabled: true,
                    ticker: true,
                    loanable: true,
                    pairsWith: ["EUR"],
                },
            };
            const result = mapAssetsResponse(valid);
            expect(result[0].type).toBe("crypto");
        });

        it("should normalize currenct assetType to crypto", () => {
            const valid = {
                BTC: {
                    name: "Bitcoin",
                    assetType: "currenct",
                    network: "bitcoin",
                    enabled: true,
                    ticker: true,
                    loanable: true,
                    pairsWith: ["EUR"],
                },
            };
            const result = mapAssetsResponse(valid);
            expect(result[0].type).toBe("crypto");
        });

        it("should map market config response", () => {
            expect(mapProMarketConfigResponse(null)).toEqual([]);
            const valid = {
                "BTC-USD": {
                    basePrecision: 8,
                    quotePrecision: 2,
                    minAmount: "0.001",
                    maxAmount: "10",
                    status: "active",
                },
            };
            expect(mapProMarketConfigResponse(valid)).toEqual([
                {
                    pair: "BTC-USD",
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
                symbol: "BTC-USD",
                bids: [["100", "1"]],
                asks: [{ price: "101", amount: "1" }],
                timestamp: 123,
            };
            const result = mapOrderBookResponse(valid);
            expect(result).toMatchObject({
                pair: "BTC-USD",
                bids: [{ price: "100", amount: "1" }],
                asks: [{ price: "101", amount: "1" }],
                date: expect.any(String),
            });
            // Test defaults
            const defaultResult = mapOrderBookResponse({});
            expect(defaultResult).toMatchObject({
                pair: "",
                bids: [],
                asks: [],
                date: expect.any(String),
            });
        });

        it("should map public trades response", () => {
            expect(mapPublicTradesResponse(null)).toEqual([]);

            // Test array format (API format): [side, price, amount, timestamp]
            const arrayFormat = [
                ["sell", 63606.3, 0.0008, 1715087548704],
                ["buy", 63601.2, 0.0013, 1715087523417],
            ];
            const arrayResult = mapPublicTradesResponse(arrayFormat);
            expect(arrayResult).toHaveLength(2);
            expect(arrayResult[0]).toMatchObject({
                id: expect.stringContaining("trade-0"),
                pair: "",
                price: "63606.3",
                amount: "0.0008",
                side: "sell",
                date: expect.any(String),
            });
            expect(arrayResult[1]).toMatchObject({
                id: expect.stringContaining("trade-1"),
                pair: "",
                price: "63601.2",
                amount: "0.0013",
                side: "buy",
                date: expect.any(String),
            });

            // Test object format (fallback for backward compatibility)
            const valid = [{ id: "1", symbol: "BTC-USD", price: "100", amount: "1", side: "buy", timestamp: 123 }];
            const result = mapPublicTradesResponse(valid);
            expect(result).toMatchObject([
                {
                    id: "1",
                    pair: "BTC-USD",
                    price: "100",
                    amount: "1",
                    side: "buy",
                    date: expect.any(String),
                },
            ]);

            // Test defaults with empty object
            const defaultResult = mapPublicTradesResponse([{}]);
            expect(defaultResult).toMatchObject([
                {
                    id: expect.stringContaining("trade-0"),
                    pair: "",
                    price: "0",
                    amount: "0",
                    side: "buy",
                    date: expect.any(String),
                },
            ]);
        });

        it("should map candles response", () => {
            expect(mapCandlesResponse(null)).toEqual([]);
            const valid = [{ timestamp: 123, open: "100", high: "110", low: "90", close: "105", volume: "10" }];
            const result = mapCandlesResponse(valid);
            expect(result).toMatchObject([
                {
                    date: expect.any(String),
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
            // Test array format
            const arrayResult = mapCandlesResponse([[123, "100", "110", "90", "105", "10"]]);
            expect(arrayResult).toMatchObject([
                {
                    date: expect.any(String),
                    open: "100",
                    high: "110",
                    low: "90",
                    close: "105",
                    volume: "10",
                },
            ]);
            // Test volume as number (passed through as-is)
            const numericVolume = [{ timestamp: 123, open: 100, high: 110, low: 90, close: 105, volume: 10.5 }];
            const numericResult = mapCandlesResponse(numericVolume);
            expect(numericResult[0].volume).toBe(10.5);
        });
    });

    describe("Wallet Mappers", () => {
        it("should validate wallet pockets response", () => {
            expect(() => mapWalletPocketsResponse({})).toThrow(ValidationError);
            const valid = [
                {
                    id: "1",
                    currency: "EUR",
                    balance: "100",
                    available: "100",
                    blocked: "0",
                    name: "Main",
                    createdAt: "2021-01-19T20:24:59.209Z",
                },
            ];
            expect(mapWalletPocketsResponse(valid)).toEqual([
                {
                    id: "1",
                    symbol: "EUR",
                    balance: "100",
                    available: "100",
                    blocked: "0",
                    name: "Main",
                    created_at: "2021-01-19T20:24:59.209Z",
                },
            ]);
        });

        it("should map wallet addresses response", () => {
            expect(mapWalletAddressesResponse(null)).toEqual([]);
            const valid = [
                {
                    id: "addr-id-123",
                    address: "addr1",
                    network: "btc",
                    currency: "BTC",
                    tag: "tag1",
                    createdAt: "2023-01-01T00:00:00Z",
                },
            ];
            const result = mapWalletAddressesResponse(valid);
            expect(result).toMatchObject([
                {
                    id: "addr-id-123",
                    address: "addr1",
                    network: "btc",
                    symbol: "BTC",
                    tag: "tag1",
                    created_at: "2023-01-01T00:00:00Z",
                },
            ]);
            // Test defaults
            const defaultResult = mapWalletAddressesResponse([{}]);
            expect(defaultResult).toMatchObject([
                {
                    id: "",
                    address: "",
                    network: "",
                    symbol: undefined,
                    tag: "",
                    created_at: "",
                },
            ]);
        });

        it("should map wallet networks response", () => {
            expect(mapWalletNetworksResponse(null)).toEqual([]);
            const valid = [
                {
                    id: "bitcoin",
                    name: "Bitcoin",
                    nativeCurrencyCode: "BTC",
                    feeCurrencyCode: "BTC",
                    hasTag: false,
                },
            ];
            expect(mapWalletNetworksResponse(valid)).toEqual([
                {
                    id: "bitcoin",
                    name: "Bitcoin",
                    native_symbol: "BTC",
                    fee_symbol: "BTC",
                    has_tag: false,
                },
            ]);
        });

        it("should map wallet movements response", () => {
            expect(mapWalletMovementsResponse(null)).toEqual([]);
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
                    fee: { mercantile: { amount: "1", currency: "EUR", class: "fee" } },
                },
            ];
            expect(mapWalletMovementsResponse(valid)).toEqual([
                {
                    id: "tx1",
                    created_at: "2023-01-01",
                    type: "deposit",
                    subtype: "fiat",
                    status: "completed",
                    amount: "100",
                    symbol: "EUR",
                    origin: { amount: "100", symbol: "EUR", class: "bank" },
                    destination: { amount: "100", symbol: "EUR", class: "wallet" },
                    fee: { amount: "1", symbol: "EUR", class: "fee" },
                },
            ]);
            // Test defaults and missing optional fields
            expect(mapWalletMovementsResponse([{}])).toEqual([
                {
                    id: "tx_0",
                    created_at: undefined,
                    type: undefined,
                    subtype: undefined,
                    status: "pending",
                    amount: "0",
                    symbol: "",
                    origin: undefined,
                    destination: undefined,
                    fee: undefined,
                },
            ]);
        });

        it("should map wallet movement details response", () => {
            expect(() => mapWalletMovementDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                date: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                denomination: { amount: "100", currency: "EUR" },
                origin: { amount: "100", currency: "EUR", class: "bank", rate: { value: "1" } },
            };
            expect(mapWalletMovementDetailsResponse(valid)).toEqual({
                id: "tx1",
                created_at: "2023-01-01",
                type: "deposit",
                subtype: "fiat",
                status: "completed",
                amount: "100",
                symbol: "EUR",
                origin: { amount: "100", symbol: "EUR", class: "bank", rate_applied: "1" },
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
                origin_symbol: "EUR",
                destination_amount: "0.1",
                destination_symbol: "BTC",
                rate: "1000",
                fee: "1",
                expires_at: "2023-01-01",
            });
        });
    });

    describe("Earn Mappers", () => {
        it("should map earn summary response", () => {
            // API returns array of summaries per currency
            expect(mapEarnSummaryResponse(null)).toEqual([]);
            const valid = [{ currency: "BTC", totalBalance: "1", totalRewards: "0.1" }];
            expect(mapEarnSummaryResponse(valid)).toEqual([
                {
                    symbol: "BTC",
                    total_balance: "1",
                    total_rewards: "0.1",
                },
            ]);
        });

        it("should map earn APY response", () => {
            expect(mapEarnAPYResponse(null)).toEqual({});
            const valid = { BTC: { daily: 0.01, weekly: 0.07, monthly: 0.3 } };
            expect(mapEarnAPYResponse(valid)).toEqual({
                BTC: {
                    symbol: "BTC",
                    rates: {
                        daily_yield_ratio: "0.01",
                        weekly_yield_ratio: "0.07",
                        monthly_yield_ratio: "0.3",
                    },
                },
            });
        });

        it("should map earn wallets response", () => {
            expect(mapEarnPositionsResponse(null)).toEqual([]);
            const valid = [{ id: "1", currency: "BTC", totalBalance: "1", strategy: "flexible", status: "active" }];
            const result = mapEarnPositionsResponse(valid);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: "1",
                symbol: "BTC",
                balance: "1",
                strategy: "flexible",
                total_balance: "1",
            });
            // APY should not be present
            expect(result[0]).not.toHaveProperty("apy");
        });

        it("should map earn wallet movements response", () => {
            // API returns { total, data } structure for wallet-specific endpoint
            expect(mapEarnPositionMovementsResponse(null)).toEqual({ total: 0, movements: [] });
            const valid = {
                total: 1,
                data: [
                    {
                        movementId: "1",
                        type: "deposit",
                        amount: { value: "1", currency: "BTC" },
                        createdAt: "2023-01-01T00:00:00Z",
                        walletId: "w1",
                    },
                ],
            };
            const result = mapEarnPositionMovementsResponse(valid);
            expect(result.total).toBe(1);
            expect(result.movements).toHaveLength(1);
            expect(result.movements[0]).toMatchObject({
                id: "1",
                type: "deposit",
                symbol: "BTC",
                amount: "1",
                position_id: "w1",
            });
        });

        it("should map earn movements response (global endpoint)", () => {
            // API returns { total, data } structure for global endpoint
            expect(mapEarnMovementsResponse(null)).toEqual({ total: 0, movements: [] });
            const valid = {
                total: 1,
                data: [
                    {
                        movementId: "mov-123",
                        type: "deposit",
                        createdAt: "2023-01-01T00:00:00Z",
                        walletId: "wallet-789",
                        amount: { value: "1.5", currency: "BTC" },
                        rate: {
                            amount: { value: "50000", currency: "EUR" },
                            pair: "BTC-USD",
                        },
                        convertedAmount: { value: "75000", currency: "EUR" },
                        source: { walletId: "source-123", currency: "EUR" },
                        issuer: { id: "issuer-1", name: "Bit2Me", integrator: "bit2me" },
                    },
                ],
            };
            const result = mapEarnMovementsResponse(valid);
            expect(result.total).toBe(1);
            expect(result.movements).toHaveLength(1);
            expect(result.movements[0]).toMatchObject({
                id: "mov-123",
                type: "deposit",
                position_id: "wallet-789",
                amount: { value: "1.5", symbol: "BTC" },
                rate: {
                    amount: { value: "50000", symbol: "EUR" },
                    pair: "BTC-USD",
                },
                converted_amount: { value: "75000", symbol: "EUR" },
                source: { pocket_id: "source-123", symbol: "EUR" },
                issuer: { id: "issuer-1", name: "Bit2Me", integrator: "bit2me" },
            });
            expect(result.movements[0].created_at).toBeTypeOf("string");
            // user_id should not be present (movements are always for the authenticated user)
            expect(result.movements[0]).not.toHaveProperty("user_id");
        });

        it("should map earn wallet details response", () => {
            expect(() => mapEarnPositionDetailsResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "1",
                currency: "BTC",
                totalBalance: "1",
                strategy: "flexible",
                status: "active",
                createdAt: "2023-01-01",
            };
            const result = mapEarnPositionDetailsResponse(valid);
            expect(result).toMatchObject({
                id: "1",
                symbol: "BTC",
                balance: "1",
                strategy: "flexible",
                created_at: "2023-01-01",
            });
            // APY should not be present
            expect(result).not.toHaveProperty("apy");
        });

        it("should map earn movements summary response", () => {
            // Handle null/undefined - should return defaults instead of throwing
            expect(mapEarnMovementsSummaryResponse(null)).toEqual({
                type: "",
                total_amount: "0",
                total_count: 0,
                symbol: "",
            });

            // Handle valid object response
            const valid = { type: "deposit", totalAmount: "10", totalCount: 5, currency: "BTC" };
            expect(mapEarnMovementsSummaryResponse(valid)).toEqual({
                type: "deposit",
                total_amount: "10",
                total_count: 5,
                symbol: "BTC",
            });

            // Handle array response (take first element)
            const arrayResponse = [{ type: "reward", totalAmount: "5", totalCount: 3, currency: "ETH" }];
            expect(mapEarnMovementsSummaryResponse(arrayResponse)).toEqual({
                type: "reward",
                total_amount: "5",
                total_count: 3,
                symbol: "ETH",
            });

            // Handle empty array
            expect(mapEarnMovementsSummaryResponse([])).toEqual({
                type: "",
                total_amount: "0",
                total_count: 0,
                symbol: "",
            });

            // Handle object with alternative field names
            const altFields = { movementType: "withdrawal", total: "20", count: 7, symbol: "EUR" };
            expect(mapEarnMovementsSummaryResponse(altFields)).toEqual({
                type: "withdrawal",
                total_amount: "20",
                total_count: 7,
                symbol: "EUR",
            });
        });

        it("should map earn assets response", () => {
            expect(mapEarnAssetsResponse(null)).toEqual({ assets: [] });
            const valid = { assets: ["BTC", "ETH"] };
            expect(mapEarnAssetsResponse(valid)).toEqual({
                assets: [{ symbol: "BTC" }, { symbol: "ETH" }],
            });
        });

        it("should map earn rewards config response", () => {
            expect(() => mapEarnRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "d3841daf-b619-4903-838c-032f31fbd593",
                userId: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                currency: "B3X",
                lockPeriodId: null,
                rewardCurrency: "B3X",
                createdAt: "2022-09-13T20:36:21.065Z",
                updatedAt: "2025-07-02T13:37:26.141Z",
            };
            const result = mapEarnRewardsConfigResponse(valid);
            expect(result).toMatchObject({
                position_id: "d3841daf-b619-4903-838c-032f31fbd593",
                user_id: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                symbol: "B3X",
                lock_period_id: null,
                reward_symbol: "B3X",
                created_at: "2022-09-13T20:36:21.065Z",
                updated_at: "2025-07-02T13:37:26.141Z",
            });
            // wallet_id should still be present for backward compatibility
            expect(result).toHaveProperty("wallet_id", "d3841daf-b619-4903-838c-032f31fbd593");
        });

        it("should map earn wallet rewards config response", () => {
            expect(() => mapEarnPositionRewardsConfigResponse(null)).toThrow(ValidationError);
            const valid = {
                walletId: "f482981e-6f8e-4d43-841d-8585a1021f94",
                userId: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                currency: "DOT",
                lockPeriodId: null,
                rewardCurrency: "B2M",
                createdAt: "2025-04-23T04:00:32.551Z",
                updatedAt: "2025-07-02T13:37:26.141Z",
            };
            const result = mapEarnPositionRewardsConfigResponse(valid);
            expect(result).toMatchObject({
                position_id: "f482981e-6f8e-4d43-841d-8585a1021f94",
                user_id: "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                symbol: "DOT",
                lock_period_id: null,
                reward_symbol: "B2M",
                created_at: "2025-04-23T04:00:32.551Z",
                updated_at: "2025-07-02T13:37:26.141Z",
            });
            // wallet_id should still be present for backward compatibility
            expect(result).toHaveProperty("wallet_id", "f482981e-6f8e-4d43-841d-8585a1021f94");
        });

        it("should map earn wallet rewards summary response", () => {
            expect(() => mapEarnPositionRewardsSummaryResponse(null)).toThrow(ValidationError);
            const valid = {
                accumulatedRewards: [
                    {
                        currency: "B2M",
                        amount: "3861562.41527785",
                    },
                ],
                totalConvertedReward: {
                    currency: "EUR",
                    amount: "46361.57588988",
                },
            };
            const result = mapEarnPositionRewardsSummaryResponse(valid);
            expect(result).toEqual({
                reward_symbol: "B2M",
                reward_amount: "3861562.41527785",
                reward_converted_symbol: "EUR",
                reward_converted_amount: "46361.57588988",
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
            const result = mapLoanOrdersResponse(valid);
            expect(result).toMatchObject([
                {
                    id: "1",
                    status: "active",
                    guarantee_symbol: "BTC",
                    guarantee_amount: "1",
                    loan_symbol: "EUR",
                    loan_amount: "1000",
                    created_at: "2023-01-01",
                },
            ]);
        });

        it("should map loan movements response", () => {
            expect(mapLoanMovementsResponse(null)).toEqual([]);
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
            expect(mapLoanMovementsResponse(valid)).toEqual([
                {
                    id: "1",
                    order_id: "o1",
                    type: "payment", // "repayment" normalizes to "payment"
                    amount: "100",
                    symbol: "EUR",
                    date: "2023-01-01",
                    status: "completed",
                },
            ]);
        });

        it("should map loan config response", () => {
            expect(mapLoanConfigResponse(null)).toEqual({
                guarantee_currencies: [],
                loan_currencies: [],
            });
            const valid = {
                loanCurrencies: [
                    {
                        currencyConfigurationLoanId: "loan-id-123",
                        currency: "USDC",
                        enabled: true,
                        liquidity: "250000.000000000000000000",
                        liquidityStatus: "high",
                        apr: "0.130000000000000000",
                        minimumAmount: "100.000000000000000000",
                        maximumAmount: "250000.000000000000000000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        currencyConfigurationLoanId: "loan-id-456",
                        currency: "EURC",
                        enabled: true,
                        liquidity: "150000.000000000000000000",
                        liquidityStatus: "medium",
                        apr: "0.120000000000000000",
                        minimumAmount: "50.000000000000000000",
                        maximumAmount: "150000.000000000000000000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                ],
                guaranteeCurrencies: [
                    {
                        currencyConfigurationGuaranteeId: "guarantee-id-123",
                        currency: "BTC",
                        enabled: true,
                        liquidationLtv: "0.8500",
                        initialLtv: "0.5000",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        currencyConfigurationGuaranteeId: "guarantee-id-456",
                        currency: "ETH",
                        enabled: true,
                        liquidationLtv: "0.8000",
                        initialLtv: "0.4500",
                        createdAt: "2024-07-16T15:49:30.646Z",
                        updatedAt: "2024-07-16T15:49:30.646Z",
                    },
                ],
            };
            const result = mapLoanConfigResponse(valid);
            expect(result).toEqual({
                guarantee_currencies: [
                    {
                        symbol: "BTC",
                        enabled: true,
                        liquidation_ltv: "0.8500",
                        initial_ltv: "0.5000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        symbol: "ETH",
                        enabled: true,
                        liquidation_ltv: "0.8000",
                        initial_ltv: "0.4500",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                ],
                loan_currencies: [
                    {
                        symbol: "USDC",
                        enabled: true,
                        liquidity: "250000.000000000000000000",
                        liquidity_status: "high",
                        apr: "0.130000000000000000",
                        minimum_amount: "100.000000000000000000",
                        maximum_amount: "250000.000000000000000000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                    {
                        symbol: "EURC",
                        enabled: true,
                        liquidity: "150000.000000000000000000",
                        liquidity_status: "medium",
                        apr: "0.120000000000000000",
                        minimum_amount: "50.000000000000000000",
                        maximum_amount: "150000.000000000000000000",
                        created_at: "2024-07-16T15:49:30.646Z",
                        updated_at: "2024-07-16T15:49:30.646Z",
                    },
                ],
            });
        });

        it("should map loan simulation response", () => {
            expect(() => mapLoanSimulationResponse(null)).toThrow(ValidationError);
            const valid = {
                guaranteeCurrency: "BTC",
                guaranteeAmount: "0.5678",
                guaranteeAmountConverted: "57000.34",
                loanCurrency: "USDC",
                loanAmount: "1250.34",
                loanAmountConverted: "1300.34",
                userCurrency: "EUR",
                ltv: "0.5",
                apr: "13.12",
            };
            expect(mapLoanSimulationResponse(valid)).toEqual({
                guarantee_symbol: "BTC",
                guarantee_amount: "0.5678",
                guarantee_amount_converted: "57000.34",
                loan_symbol: "USDC",
                loan_amount: "1250.34",
                loan_amount_converted: "1300.34",
                user_symbol: "EUR",
                ltv: "0.5",
                apr: "13.12",
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
            const result = mapLoanOrderDetailsResponse(valid);
            expect(result).toMatchObject({
                id: "1",
                status: "active",
                guarantee_symbol: "BTC",
                guarantee_amount: "1",
                loan_symbol: "EUR",
                loan_amount: "1000",
                remaining_amount: "1000",
                ltv: "50",
                apr: "5",
                liquidation_price: "20000",
                created_at: "2023-01-01",
                expires_at: "2024-01-01",
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
            const result = mapProBalanceResponse(valid);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                symbol: "EUR",
                balance: "100",
                blocked: "10",
                available: "90",
            });
        });

        it("should map pro order response", () => {
            expect(() => mapProOrderResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "1",
                symbol: "BTC-USD",
                side: "buy",
                type: "limit",
                status: "open",
                price: "20000",
                amount: "1",
                filled: "0",
                remaining: "1",
                createdAt: "2023-01-01",
            };
            const result = mapProOrderResponse(valid);
            expect(result).toMatchObject({
                id: "1",
                pair: "BTC-USD",
                side: "buy",
                type: "limit",
            });
            // Verify numeric values are converted to strings
            expect(result.price).toBeTypeOf("string");
            expect(result.amount).toBeTypeOf("string");
            expect(result.filled).toBeTypeOf("string");
            expect(result.remaining).toBeTypeOf("string");

            // Test with numeric values from API
            const numericValid = {
                id: "2",
                symbol: "ETH-USD",
                side: "sell",
                type: "market",
                status: "filled",
                price: 2500.5,
                amount: 2.5,
                filled: 2.5,
                remaining: 0,
                createdAt: "2023-01-02",
            };
            const numericResult = mapProOrderResponse(numericValid);
            expect(numericResult.price).toBeTypeOf("string");
            expect(numericResult.amount).toBeTypeOf("string");
            expect(numericResult.filled).toBeTypeOf("string");
            expect(numericResult.remaining).toBeTypeOf("string");
        });

        it("should map pro open orders response", () => {
            expect(mapProOpenOrdersResponse(null)).toEqual({ orders: [] });
            const valid = [
                {
                    id: "1",
                    symbol: "BTC-USD",
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
            const result = mapProOpenOrdersResponse(valid);
            expect(result).toMatchObject({
                orders: [
                    {
                        id: "1",
                        pair: "BTC-USD",
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
                        symbol: "BTC-USD",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        timestamp: 123,
                    },
                ],
            };
            const result = mapProOrderTradesResponse(valid);
            expect(result).toMatchObject({
                order_id: "o1",
                trades: [
                    {
                        id: "t1",
                        order_id: "o1",
                        pair: "BTC-USD",
                        side: "buy",
                        price: "20000",
                        amount: "0.1",
                        fee: "1",
                        date: expect.any(String),
                    },
                ],
            });
        });
    });

    describe("Operation Mappers", () => {
        it("should map operation confirmation response", () => {
            expect(() => mapOperationConfirmationResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", status: "confirmed", message: "Success" };
            expect(mapOperationConfirmationResponse(valid)).toEqual({
                id: "tx1",
                status: "confirmed",
            });
        });

        it("should map earn operation response", () => {
            expect(() => mapEarnOperationResponse(null)).toThrow(ValidationError);
            const valid = {
                id: "tx1",
                type: "deposit",
                currency: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            };
            expect(mapEarnOperationResponse(valid)).toEqual({
                id: "tx1",
                type: "deposit",
                symbol: "BTC",
                amount: "1",
                status: "pending",
                message: "Created",
            });
        });

        it("should map pro deposit response", () => {
            expect(() => mapProDepositResponse(null)).toThrow(ValidationError);
            const valid = { id: "tx1", currency: "EUR", amount: "100", status: "completed", message: "Deposited" };
            expect(mapProDepositResponse(valid)).toEqual({
                id: "tx1",
                symbol: "EUR",
                amount: "100",
                status: "completed",
                message: "Deposited",
            });
        });
    });
});
