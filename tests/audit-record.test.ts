/**
 * Audit write path: logger fallback, rotation, envelope.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from "node:path";
import {
    chmodAuditTmpFile,
    cleanupAuditTmp,
    clearLoggerMocks,
    createAuditTmp,
    listAuditTmp,
    readAuditTmpFile,
    restoreAuditPathEnv,
    writeAuditTmpFile,
} from "./audit-harness.js";

const { loggerMock } = vi.hoisted(() => ({
    loggerMock: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setLevel: vi.fn(),
        addSensitiveKey: vi.fn(),
    },
}));

vi.mock("../src/utils/logger.js", () => ({
    logger: loggerMock,
    initLogger: vi.fn(),
}));

import { initAudit, recordAudit, _setAuditMaxBytesForTesting, _resetAuditForTesting } from "../src/utils/audit.js";

let tmpRoot: string;

beforeEach(() => {
    tmpRoot = createAuditTmp();
    delete process.env.AUDIT_LOG_PATH;
    _resetAuditForTesting();
    clearLoggerMocks(loggerMock);
});

afterEach(() => {
    restoreAuditPathEnv();
    _resetAuditForTesting();
    cleanupAuditTmp(tmpRoot);
});

describe("recordAudit — fallback to logger", () => {
    it("emits via logger.info('audit', ...) when AUDIT_LOG_PATH is unset", async () => {
        initAudit();
        await recordAudit({
            tool: "wallet_buy_crypto",
            outcome: "success",
            args: { foo: "bar" },
        });
        expect(loggerMock.info).toHaveBeenCalledWith(
            "audit",
            expect.objectContaining({ audit: true, tool: "wallet_buy_crypto", outcome: "success" })
        );
    });

    it("falls back to logger when the configured file becomes unwritable", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        writeAuditTmpFile(target, "");
        chmodAuditTmpFile(target, 0o400);
        try {
            await recordAudit({
                tool: "wallet_sell_crypto",
                outcome: "error",
                args: {},
                error: "boom",
            });
            const wroteToLogger =
                loggerMock.warn.mock.calls.some((c) => String(c[0]).includes("Failed to write audit log")) ||
                loggerMock.info.mock.calls.some((c) => c[0] === "audit");
            expect(wroteToLogger).toBe(true);
        } finally {
            chmodAuditTmpFile(target, 0o600);
        }
    });
});

describe("recordAudit — rotation", () => {
    it("rotates the active file once it exceeds the threshold", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        _setAuditMaxBytesForTesting(200);

        for (let i = 0; i < 8; i += 1) {
            await recordAudit({
                tool: "wallet_buy_crypto",
                outcome: "success",
                args: { iteration: i, padding: "x".repeat(64) },
            });
        }

        const files = listAuditTmp(tmpRoot).sort();
        expect(files).toContain("audit.log");
        const archives = files.filter((f) => /^audit\.log\.\d+$/.test(f));
        expect(archives.length).toBeGreaterThanOrEqual(1);
        expect(archives.length).toBeLessThanOrEqual(4);
    });

    it("never produces more than 5 files (active + 4 archives)", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        _setAuditMaxBytesForTesting(50);

        for (let i = 0; i < 30; i += 1) {
            await recordAudit({
                tool: "wallet_swap_crypto",
                outcome: "success",
                args: { i, padding: "y".repeat(40) },
            });
        }

        const files = listAuditTmp(tmpRoot).filter((f) => f.startsWith("audit.log"));
        expect(files.length).toBeLessThanOrEqual(5);
    });
});

describe("recordAudit — sanity", () => {
    it("writes a JSON line with the expected envelope", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        await recordAudit({
            tool: "wallet_buy_crypto",
            outcome: "success",
            args: { foo: "bar" },
            idempotencyKey: "abc",
        });
        const contents = readAuditTmpFile(target).trim();
        expect(contents.length).toBeGreaterThan(0);
        const lines = contents.split("\n").filter(Boolean);
        const last = JSON.parse(lines[lines.length - 1] ?? "{}");
        expect(last.tool).toBe("wallet_buy_crypto");
        expect(last.outcome).toBe("success");
        expect(last.idempotencyKey).toBe("abc");
        expect(typeof last.ts).toBe("string");
    });
});
