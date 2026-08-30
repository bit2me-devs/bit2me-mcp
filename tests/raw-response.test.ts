import { describe, expect, it, vi } from "vitest";
import { wrapResponseWithRaw } from "../src/utils/mappers/raw.js";
import { buildSimpleContextualResponse } from "../src/utils/contextual-response.js";

const config = { INCLUDE_RAW_RESPONSE: false };

vi.mock("../src/config.js", () => ({
    getConfig: () => config,
}));

describe("wrapResponseWithRaw", () => {
    it("leaves the mapped object unchanged when the flag is off", () => {
        config.INCLUDE_RAW_RESPONSE = false;
        const mapped = { id: "1", balance: "0" };
        expect(wrapResponseWithRaw(mapped, { secret: "body" })).toEqual(mapped);
        expect(wrapResponseWithRaw(mapped, { secret: "body" })).not.toHaveProperty("raw_response");
    });

    it("omits raw_response when the upstream payload is missing", () => {
        config.INCLUDE_RAW_RESPONSE = true;
        expect(wrapResponseWithRaw({ id: "1" })).toEqual({ id: "1" });
        expect(wrapResponseWithRaw({ id: "1" }, undefined)).toEqual({ id: "1" });
    });

    it("attaches raw_response when the flag is on", () => {
        config.INCLUDE_RAW_RESPONSE = true;
        expect(wrapResponseWithRaw({ id: "1" }, { nonce: 9 })).toEqual({
            id: "1",
            raw_response: { nonce: 9 },
        });
    });
});

describe("contextual builders use wrapResponseWithRaw", () => {
    it("echoes request/result and attaches raw only when enabled", () => {
        config.INCLUDE_RAW_RESPONSE = false;
        const off = buildSimpleContextualResponse({ symbol: "BTC" }, { price: "1" }, { raw: true });
        expect(off).toEqual({ request: { symbol: "BTC" }, result: { price: "1" } });

        config.INCLUDE_RAW_RESPONSE = true;
        const on = buildSimpleContextualResponse({ symbol: "BTC" }, { price: "1" }, { raw: true });
        expect(on.raw_response).toEqual({ raw: true });
        expect(on.result).toEqual({ price: "1" });
    });
});
