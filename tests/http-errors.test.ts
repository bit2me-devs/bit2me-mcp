import { describe, expect, it } from "vitest";
import { mapErrorToJsonRpc } from "../src/transport/http-errors.js";
import {
    AuthenticationError,
    BadRequestError,
    Bit2MeAPIError,
    NotFoundError,
    RateLimitError,
    ValidationError,
} from "../src/utils/errors.js";

describe("mapErrorToJsonRpc", () => {
    it("echoes ValidationError as Invalid params", () => {
        expect(mapErrorToJsonRpc(new ValidationError("bad field", "amount"))).toEqual({
            code: -32602,
            message: "bad field (field: amount)",
        });
    });

    it("hides AuthenticationError internals", () => {
        expect(mapErrorToJsonRpc(new AuthenticationError("/v1/x", "jwt"))).toEqual({
            code: -32001,
            message: "Authentication failed",
        });
    });

    it("hides RateLimitError internals", () => {
        expect(mapErrorToJsonRpc(new RateLimitError("/v1/x", 7))).toEqual({
            code: -32029,
            message: "Rate limit exceeded",
        });
    });

    it("hides NotFoundError internals", () => {
        expect(mapErrorToJsonRpc(new NotFoundError("/v1/x", "pocket"))).toEqual({
            code: -32004,
            message: "Resource not found",
        });
    });

    it("echoes BadRequestError public message only", () => {
        const mapped = mapErrorToJsonRpc(new BadRequestError("/v1/x", "raw body leaked"));
        expect(mapped.code).toBe(-32602);
        expect(mapped.message).not.toContain("raw body leaked");
    });

    it("hides Bit2MeAPIError upstream body", () => {
        expect(mapErrorToJsonRpc(new Bit2MeAPIError(502, "gateway html", "/v1/x?id=1"))).toEqual({
            code: -32000,
            message: "Upstream API error",
        });
    });

    it("collapses unknown errors to Internal error", () => {
        expect(mapErrorToJsonRpc(new Error("stack or secret"))).toEqual({
            code: -32000,
            message: "Internal error",
        });
        expect(mapErrorToJsonRpc("not-an-error")).toEqual({
            code: -32000,
            message: "Internal error",
        });
    });
});
