import { describe, it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleMarketTool } from "../../src/tools/market.js";

describeE2E("E2E: Market Tools", () => {
    it(
        "should get ticker for BTC",
        async () => {
            const result = await handleMarketTool("market_get_ticker", {
                symbol: "BTC",
                currency: "EUR",
            });
            const ticker = JSON.parse(result.content[0].text);

            expect(ticker).toHaveProperty("symbol", "BTC");
            expect(ticker).toHaveProperty("price");
            expect(ticker).toHaveProperty("volume_24h");
            expect(parseFloat(ticker.price)).toBeGreaterThan(0);
        },
        E2E_TIMEOUT
    );

    it(
        "should get all available assets",
        async () => {
            const result = await handleMarketTool("market_get_assets", {});
            const assets = JSON.parse(result.content[0].text);

            expect(Array.isArray(assets)).toBe(true);
            expect(assets.length).toBeGreaterThan(0);
            expect(assets[0]).toHaveProperty("symbol");
            expect(assets[0]).toHaveProperty("name");
        },
        E2E_TIMEOUT
    );

    it(
        "should get asset details",
        async () => {
            const result = await handleMarketTool("market_get_asset_details", { symbol: "BTC" });
            const asset = JSON.parse(result.content[0].text);

            expect(asset).toHaveProperty("symbol", "BTC");
            expect(asset).toHaveProperty("type");
        },
        E2E_TIMEOUT
    );

    it(
        "should get price chart data",
        async () => {
            const result = await handleMarketTool("market_get_chart", {
                ticker: "BTC/EUR",
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
            const result = await handleMarketTool("market_get_order_book", { symbol: "BTC/EUR" });
            const orderBook = JSON.parse(result.content[0].text);

            expect(orderBook).toHaveProperty("bids");
            expect(orderBook).toHaveProperty("asks");
            expect(Array.isArray(orderBook.bids)).toBe(true);
            expect(Array.isArray(orderBook.asks)).toBe(true);
        },
        E2E_TIMEOUT
    );

    it(
        "should get candles (OHLCV)",
        async () => {
            const result = await handleMarketTool("market_get_candles", {
                symbol: "BTC/EUR",
                timeframe: "1h",
                limit: 10,
            });
            const candles = JSON.parse(result.content[0].text);

            expect(Array.isArray(candles)).toBe(true);
            expect(candles.length).toBeGreaterThan(0);
            if (candles.length > 0) {
                expect(candles[0]).toHaveProperty("timestamp");
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
            const result = await handleMarketTool("market_get_config", { symbol: "BTC/EUR" });
            const config = JSON.parse(result.content[0].text);

            expect(Array.isArray(config)).toBe(true);
            if (config.length > 0) {
                expect(config[0]).toHaveProperty("symbol");
                expect(config[0]).toHaveProperty("precision");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get public trades",
        async () => {
            const result = await handleMarketTool("market_get_public_trades", {
                symbol: "BTC/EUR",
                limit: 5,
            });
            const trades = JSON.parse(result.content[0].text);

            expect(Array.isArray(trades)).toBe(true);
            if (trades.length > 0) {
                expect(trades[0]).toHaveProperty("price");
                expect(trades[0]).toHaveProperty("amount");
                expect(trades[0]).toHaveProperty("side");
            }
        },
        E2E_TIMEOUT
    );
});
