/**
 * Boot-time validation of AUDIT_LOG_PATH.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from "node:path";
import { cleanupAuditTmp, clearLoggerMocks, createAuditTmp, restoreAuditPathEnv } from "./audit-harness.js";

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

import { initAudit, _resetAuditForTesting, _getAuditPathForTesting } from "../src/utils/audit.js";

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
