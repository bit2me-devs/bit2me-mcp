import { describe, it, expect, afterEach, vi } from "vitest";
import { warnIfPlainHttpOnNonLoopback } from "../src/transport/http.js";
import { logger } from "../src/utils/logger.js";

describe("warnIfPlainHttpOnNonLoopback (ADR 0001)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("warns on wildcard and external binds regardless of auth mode", () => {
        const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
        warnIfPlainHttpOnNonLoopback("0.0.0.0");
        warnIfPlainHttpOnNonLoopback("203.0.113.4");
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(String(warnSpy.mock.calls[0]![0])).toMatch(/without TLS/i);
    });

    it("stays silent on loopback", () => {
        const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
        warnIfPlainHttpOnNonLoopback("127.0.0.1");
        warnIfPlainHttpOnNonLoopback("localhost");
        warnIfPlainHttpOnNonLoopback("::1");
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
