import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProTool } from "../../src/tools/pro.js";
import { bit2meRequest } from "../../src/services/bit2me.js";
import { toProApiPair } from "../../src/utils/pair-api.js";

vi.mock("../../src/services/bit2me.js", () => ({
    bit2meRequest: vi.fn(),
    resolveIdempotencyKey: (args: { idempotency_key?: string }) => args.idempotency_key ?? "k",
}));
vi.mock("../../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false, API_KEY: "test", API_SECRET: "test" }),
}));

describe("pro_get_ticker pair format", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(bit2meRequest).mockResolvedValue([]);
    });

    it("toProApiPair maps hyphen and underscore to slash", () => {
        expect(toProApiPair("btc-eur")).toBe("BTC/EUR");
        expect(toProApiPair("BTC_EUR")).toBe("BTC/EUR");
        expect(toProApiPair("BTC/EUR")).toBe("BTC/EUR");
    });

    it("sends BASE/QUOTE to /v2/trading/tickers", async () => {
        await handleProTool("pro_get_ticker", { pair: "BTC-EUR" });
        expect(bit2meRequest).toHaveBeenCalledWith("GET", "/v2/trading/tickers", { symbol: "BTC/EUR" });
    });
});
