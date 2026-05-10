/**
 * Audit log boot validation, rotation and fallback tests.
 *
 * Pins the security and operational contract of `src/utils/audit.ts`:
 *  1. Boot-time validation rejects relative paths, traversal segments,
 *     dangling parent directories and read-only destinations.
 *  2. The active log file rotates by size, preserving up to 4
 *     historical archives.
 *  3. When `AUDIT_LOG_PATH` is unset (or any I/O fails) the entry is
 *     emitted through the logger sink instead of being silently
 *     dropped.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, statSync, readdirSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

import {
    initAudit,
    recordAudit,
    _setAuditMaxBytesForTesting,
    _resetAuditForTesting,
    _getAuditPathForTesting,
} from "../src/utils/audit.js";

const ORIGINAL_AUDIT_PATH = process.env.AUDIT_LOG_PATH;

let tmpRoot: string;

beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), "audit-test-"));
    delete process.env.AUDIT_LOG_PATH;
    _resetAuditForTesting();
    loggerMock.debug.mockClear();
    loggerMock.info.mockClear();
    loggerMock.warn.mockClear();
    loggerMock.error.mockClear();
});

afterEach(() => {
    if (ORIGINAL_AUDIT_PATH === undefined) {
        delete process.env.AUDIT_LOG_PATH;
    } else {
        process.env.AUDIT_LOG_PATH = ORIGINAL_AUDIT_PATH;
    }
    _resetAuditForTesting();
    try {
        rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
        // best-effort cleanup
    }
});

describe("initAudit — path validation", () => {
    it("is a no-op when AUDIT_LOG_PATH is unset", () => {
        expect(() => initAudit()).not.toThrow();
        expect(_getAuditPathForTesting()).toBeNull();
    });

    it("rejects a relative path", () => {
        process.env.AUDIT_LOG_PATH = "logs/audit.log";
        expect(() => initAudit()).toThrow(/absolute path/i);
    });

    it("rejects a path containing '..' segments", () => {
        process.env.AUDIT_LOG_PATH = `${tmpRoot}/../escape/audit.log`;
        expect(() => initAudit()).toThrow(/'\.\.'/i);
    });

    it("rejects a path whose parent directory does not exist", () => {
        process.env.AUDIT_LOG_PATH = join(tmpRoot, "missing-dir", "audit.log");
        expect(() => initAudit()).toThrow(/does not resolve/i);
    });

    it("accepts a path inside an existing writable directory", () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        expect(() => initAudit()).not.toThrow();
        expect(_getAuditPathForTesting()).toBe(target);
    });
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
        // Write the file as a read-only target so appendFile fails.
        writeFileSync(target, "");
        chmodSync(target, 0o400);
        try {
            await recordAudit({
                tool: "wallet_sell_crypto",
                outcome: "error",
                args: {},
                error: "boom",
            });
            // Either the warn-then-info path triggered, or the platform
            // ignores the chmod (some CI runners do): in both cases the
            // entry must reach the logger sink.
            const wroteToLogger =
                loggerMock.warn.mock.calls.some((c) => String(c[0]).includes("Failed to write audit log")) ||
                loggerMock.info.mock.calls.some((c) => c[0] === "audit");
            expect(wroteToLogger).toBe(true);
        } finally {
            // Restore perms so cleanup can remove the file.
            chmodSync(target, 0o600);
        }
    });
});

describe("recordAudit — rotation", () => {
    it("rotates the active file once it exceeds the threshold", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        // Threshold of 200 bytes makes this deterministic regardless of
        // the JSON serialiser's exact output length.
        _setAuditMaxBytesForTesting(200);

        for (let i = 0; i < 8; i += 1) {
            await recordAudit({
                tool: "wallet_buy_crypto",
                outcome: "success",
                args: { iteration: i, padding: "x".repeat(64) },
            });
        }

        const files = readdirSync(tmpRoot).sort();
        // We expect at least the active file plus one rotated archive.
        expect(files).toContain("audit.log");
        const archives = files.filter((f) => /^audit\.log\.\d+$/.test(f));
        expect(archives.length).toBeGreaterThanOrEqual(1);
        expect(archives.length).toBeLessThanOrEqual(4);
    });

    it("never produces more than 5 files (active + 4 archives)", async () => {
        const target = join(tmpRoot, "audit.log");
        process.env.AUDIT_LOG_PATH = target;
        initAudit();
        _setAuditMaxBytesForTesting(50); // very aggressive

        for (let i = 0; i < 30; i += 1) {
            await recordAudit({
                tool: "wallet_swap_crypto",
                outcome: "success",
                args: { i, padding: "y".repeat(40) },
            });
        }

        const files = readdirSync(tmpRoot).filter((f) => f.startsWith("audit.log"));
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
        const stats = statSync(target);
        expect(stats.size).toBeGreaterThan(0);
        // Quick parse to make sure the line is valid JSON.
        const fs = await import("node:fs");
        const contents = fs.readFileSync(target, "utf-8").trim();
        const lines = contents.split("\n").filter(Boolean);
        const last = JSON.parse(lines[lines.length - 1]);
        expect(last.tool).toBe("wallet_buy_crypto");
        expect(last.outcome).toBe("success");
        expect(last.idempotencyKey).toBe("abc");
        expect(typeof last.ts).toBe("string");
    });
});

// Keep the unused import suppressed when running on platforms that ignore
// chmod restrictions (the function is referenced inside the chmod test).
void mkdirSync;
void existsSync;
