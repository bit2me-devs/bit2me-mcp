import { describe, it, expect } from "vitest";
import {
    mapWalletPocketsResponse,
    mapWalletAddressesResponse,
    mapWalletNetworksResponse,
} from "../../src/utils/response-mappers.js";
import { ValidationError } from "../../src/utils/errors.js";

describe("Response Mappers", () => {
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
    });
});
