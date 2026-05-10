/**
 * Broker tool error-redaction contract.
 *
 * Pins the fix for the two `catch` blocks in `broker_get_asset_data`
 * and `broker_get_asset_chart` that previously re-threw
 * `error.response?.data` (or the raw upstream `error.message`) in the
 * public message. Anything that crosses the tool boundary must be a
 * controlled `Bit2MeAPIError` whose user-facing string is the static
 * "Bit2Me API Error (...)" envelope; the internal detail can still be
 * inspected via `internalMessage` for log correlation but never leaks
 * to the caller as part of `error.message`.
 *
 * If a future refactor accidentally re-introduces a `JSON.stringify`
 * of the upstream payload, the assertions below will catch it before
 * the change can land.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Bit2MeAPIError } from "../src/utils/errors.js";

vi.mock("axios");
vi.mock("../src/services/bit2me.js", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        bit2meRequest: vi.fn(),
        getTicker: vi.fn(),
        getMarketPrice: vi.fn(),
    };
});
vi.mock("../src/config.js", () => ({
    BIT2ME_GATEWAY_URL: "https://gateway.bit2me.com",
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }),
}));

const SECRET_HINT = "POCKET-ID-DEADBEEF-1234-5678-9012-345678901234";

describe("broker_get_asset_data — error redaction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not leak upstream error.response.data in the public error message", async () => {
        const { handleBrokerTool } = await import("../src/tools/broker.js");
        const bit2meService = await import("../src/services/bit2me.js");

        // Simulate an axios-style error carrying sensitive payload data
        // in `response.data`. The previous implementation would have
        // `JSON.stringify`-ed this into the thrown message.
        const upstream: any = new Error("Request failed with status code 500");
        upstream.response = { data: { internalPocketId: SECRET_HINT, debugTrace: "stack..." } };
        vi.mocked(bit2meService.getTicker).mockRejectedValue(upstream);

        await expect(
            handleBrokerTool("broker_get_asset_data", { base_symbol: "BTC", quote_symbol: "EUR" })
        ).rejects.toMatchObject({
            // Anything thrown from the catch block must be the
            // controlled API error type — no plain `Error`.
            constructor: Bit2MeAPIError,
        });

        // Capture the actual thrown error and assert no leakage.
        let captured: unknown = null;
        try {
            await handleBrokerTool("broker_get_asset_data", { base_symbol: "BTC", quote_symbol: "EUR" });
        } catch (e) {
            captured = e;
        }
        expect(captured).toBeInstanceOf(Bit2MeAPIError);
        const message = (captured as Error).message;
        expect(message).not.toContain(SECRET_HINT);
        expect(message).not.toContain("debugTrace");
        // The internalMessage carries the original axios message for
        // operator-side debugging but does not include the payload.
        const internal = (captured as Bit2MeAPIError).internalMessage;
        expect(internal).not.toContain(SECRET_HINT);
    });
});

describe("broker_get_asset_chart — error redaction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not leak upstream error.response.data in the public error message", async () => {
        const { handleBrokerTool } = await import("../src/tools/broker.js");
        const bit2meService = await import("../src/services/bit2me.js");

        const upstream: any = new Error("Request failed with status code 500");
        upstream.response = { data: { traceId: SECRET_HINT, dbStatement: "SELECT *" } };
        vi.mocked(bit2meService.bit2meRequest).mockRejectedValue(upstream);

        let captured: unknown = null;
        try {
            await handleBrokerTool("broker_get_asset_chart", {
                pair: "BTC-EUR",
                timeframe: "1h",
                limit: 24,
            });
        } catch (e) {
            captured = e;
        }
        expect(captured).toBeInstanceOf(Bit2MeAPIError);
        const message = (captured as Error).message;
        expect(message).not.toContain(SECRET_HINT);
        expect(message).not.toContain("dbStatement");
    });
});
