import { describe, it, expect } from "vitest";
import { mapTickerResponse, mapAssetsResponse } from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
    describe("Market Mappers", () => {
        it("should map ticker response with correct field transformations", () => {
            const valid = {
                time: 123,
                price: "100.5678",
                marketCap: "1500000000.867",
                totalVolume: "43000000.902",
                maxSupply: "21000000",
                totalSupply: "19000000",
            };
            const result = mapTickerResponse(valid, "BTC", "EUR");

            // Verify critical fields are present and correctly mapped
            expect(result).toMatchObject({
                base_symbol: "BTC",
                quote_symbol: "EUR",
                date: expect.any(String),
                price: "100.57", // smartRound to 2 decimals
                market_cap: expect.any(String),
                volume_24h: expect.any(String),
            });

            // Verify fiat values are rounded to 2 decimals
            expect(result.market_cap).toBe("1500000000.87");
            expect(result.volume_24h).toBe("43000000.9");
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
    });
});
