import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleMarketTool } from "../../src/tools/market.js";

describeE2E("E2E: Market Tools", () => {
    it(
        "should get data for BTC",
        async () => {
            const result = await handleMarketTool("market_get_data", {
                base_symbol: "BTC",
                quote_symbol: "EUR",
            });
            const ticker = JSON.parse(result.content[0].text);

            expect(ticker).toHaveProperty("date");
            expect(ticker).toHaveProperty("price");
            expect(ticker).toHaveProperty("volume_24h");
            expect(parseFloat(ticker.price)).toBeGreaterThan(0);
        },
        E2E_TIMEOUT
    );

    it(
        "should get all available assets",
        async () => {
            const result = await handleMarketTool("market_get_assets_details", {});
            const assets = JSON.parse(result.content[0].text);

            expect(Array.isArray(assets)).toBe(true);
            expect(assets.length).toBeGreaterThan(0);
            expect(assets[0]).toHaveProperty("symbol");
            expect(assets[0]).toHaveProperty("name");
            // Verify network is lowercase
            if (assets[0].network) {
                expect(assets[0].network).toBe(assets[0].network.toLowerCase());
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get asset details",
        async () => {
            const result = await handleMarketTool("market_get_assets_details", { symbol: "BTC" });
            const asset = JSON.parse(result.content[0].text);

            expect(asset).toHaveProperty("symbol", "BTC");
            expect(asset).toHaveProperty("type");
            // Verify network is lowercase
            if (asset.network) {
                expect(asset.network).toBe(asset.network.toLowerCase());
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get price chart data",
        async () => {
            const result = await handleMarketTool("market_get_chart", {
                pair: "BTC-USD",
                timeframe: "one-day",
            });
            const chart = JSON.parse(result.content[0].text);

            expect(Array.isArray(chart)).toBe(true);
            expect(chart.length).toBeGreaterThan(0);
            if (chart.length > 0) {
                expect(chart[0]).toHaveProperty("timestamp");
                expect(chart[0]).toHaveProperty("price");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get order book",
        async () => {
            const result = await handleMarketTool("market_get_order_book", { pair: "BTC-USD" });
            const orderBook = JSON.parse(result.content[0].text);

            expect(orderBook).toHaveProperty("pair");
            expect(orderBook).toHaveProperty("bids");
            expect(orderBook).toHaveProperty("asks");
            expect(orderBook).toHaveProperty("timestamp");
            expect(orderBook).toHaveProperty("date");
            expect(Array.isArray(orderBook.bids)).toBe(true);
            expect(Array.isArray(orderBook.asks)).toBe(true);
        },
        E2E_TIMEOUT
    );

    it(
        "should get candles (OHLCV)",
        async () => {
            const result = await handleMarketTool("market_get_candles", {
                pair: "BTC-USD",
                timeframe: "1h",
                limit: 10,
            });
            const candles = JSON.parse(result.content[0].text);

            expect(Array.isArray(candles)).toBe(true);
            expect(candles.length).toBeGreaterThan(0);
            if (candles.length > 0) {
                expect(candles[0]).toHaveProperty("timestamp");
                expect(candles[0]).toHaveProperty("date");
                expect(candles[0]).toHaveProperty("open");
                expect(candles[0]).toHaveProperty("high");
                expect(candles[0]).toHaveProperty("low");
                expect(candles[0]).toHaveProperty("close");
                expect(candles[0]).toHaveProperty("volume");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get market config",
        async () => {
            const result = await handleMarketTool("market_get_config", { pair: "BTC-USD" });
            const config = JSON.parse(result.content[0].text);

            expect(Array.isArray(config)).toBe(true);
            if (config.length > 0) {
                expect(config[0]).toHaveProperty("symbol");
                expect(config[0]).toHaveProperty("base_precision");
                expect(config[0]).toHaveProperty("quote_precision");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get public trades",
        async () => {
            const result = await handleMarketTool("market_get_public_trades", {
                pair: "BTC-USD",
                limit: 5,
            });
            const trades = JSON.parse(result.content[0].text);

            expect(Array.isArray(trades)).toBe(true);
            if (trades.length > 0) {
                expect(trades[0]).toHaveProperty("pair");
                expect(trades[0]).toHaveProperty("price");
                expect(trades[0]).toHaveProperty("amount");
                expect(trades[0]).toHaveProperty("side");
                expect(trades[0]).toHaveProperty("timestamp");
                expect(trades[0]).toHaveProperty("date");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get ticker rates",
        async () => {
            const result = await handleMarketTool("market_get_ticker", {
                quote_symbol: "EUR",
                base_symbol: "BTC",
            });
            const rates = JSON.parse(result.content[0].text);

            expect(Array.isArray(rates)).toBe(true);
            expect(rates.length).toBeGreaterThan(0);
            if (rates.length > 0) {
                expect(rates[0]).toHaveProperty("base_symbol", "BTC");
                expect(rates[0]).toHaveProperty("price");
                expect(rates[0]).toHaveProperty("quote_symbol", "EUR");
                expect(parseFloat(rates[0].price)).toBeGreaterThan(0);

                // Verify smartRound formatting
                const rate = parseFloat(rates[0].price);
                const rateStr = rates[0].price;
                const decimals = rateStr.includes(".") ? rateStr.split(".")[1].length : 0;

                // Check decimal formatting rules
                if (rate >= 1) {
                    expect(decimals).toBeLessThanOrEqual(2);
                } else if (rate >= 0.1) {
                    expect(decimals).toBeLessThanOrEqual(4);
                } else {
                    expect(decimals).toBeLessThanOrEqual(8);
                }
            }
        },
        E2E_TIMEOUT
    );
});
