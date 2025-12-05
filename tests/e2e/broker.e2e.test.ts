import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleBrokerTool } from "../../src/tools/broker.js";

describeE2E("E2E: Broker Tools", () => {
    it(
        "should get price info for BTC",
        async () => {
            const result = await handleBrokerTool("broker_get_info", {
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
        "should get price chart data",
        async () => {
            const result = await handleBrokerTool("broker_get_chart", {
                pair: "BTC-USD",
                timeframe: "1d",
            });
            const chart = JSON.parse(result.content[0].text);

            expect(Array.isArray(chart.result)).toBe(true);
            expect(chart.result.length).toBeGreaterThan(0);
            if (chart.result.length > 0) {
                expect(chart.result[0]).toHaveProperty("date");
                expect(chart.result[0]).toHaveProperty("price");
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should get price rates",
        async () => {
            const result = await handleBrokerTool("broker_get_price", {
                quote_symbol: "EUR",
                base_symbol: "BTC",
            });
            const rates = JSON.parse(result.content[0].text);

            expect(Array.isArray(rates.result)).toBe(true);
            expect(rates.result.length).toBeGreaterThan(0);
            if (rates.result.length > 0) {
                expect(rates.result[0]).toHaveProperty("base_symbol", "BTC");
                expect(rates.result[0]).toHaveProperty("price");
                expect(rates.result[0]).toHaveProperty("quote_symbol", "EUR");
                expect(parseFloat(rates.result[0].price)).toBeGreaterThan(0);
            }
        },
        E2E_TIMEOUT
    );

    it(
        "should create buy quote (proforma)",
        async () => {
            // Get pockets first
            const { handleWalletTool } = await import("../../src/tools/wallet.js");
            const pocketsResult = await handleWalletTool("wallet_get_pockets", {});
            const pockets = JSON.parse(pocketsResult.content[0].text).result;

            const eurPocket = pockets.find((p: any) => p.symbol === "EUR" && parseFloat(p.balance) > 0);
            const btcPocket = pockets.find((p: any) => p.symbol === "BTC");

            if (!eurPocket || !btcPocket) {
                console.log("Skipping broker_quote_buy test - missing required pockets");
                return;
            }

            // Create proforma (quote) - NOT confirming to avoid real transaction
            const proformaResult = await handleBrokerTool("broker_quote_buy", {
                origin_pocket_id: eurPocket.id,
                destination_pocket_id: btcPocket.id,
                amount: "0.01", // Very small amount for testing
            });

            const proforma = JSON.parse(proformaResult.content[0].text);
            expect(proforma.result).toHaveProperty("proforma_id");
            expect(proforma.result).toHaveProperty("origin_symbol");
            expect(proforma.result).toHaveProperty("destination_symbol");

            // NOTE: We're NOT calling broker_confirm_quote in E2E tests
            // to avoid making real transactions. The proforma creation validates
            // the endpoint is correct.
        },
        E2E_TIMEOUT * 2
    );
});
