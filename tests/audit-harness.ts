import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";

const ORIGINAL_AUDIT_PATH = process.env.AUDIT_LOG_PATH;

export type AuditLoggerMock = {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    setLevel: ReturnType<typeof vi.fn>;
    addSensitiveKey: ReturnType<typeof vi.fn>;
};

export function createAuditTmp(): string {
    return mkdtempSync(join(tmpdir(), "audit-test-"));
}

export function restoreAuditPathEnv(): void {
    if (ORIGINAL_AUDIT_PATH === undefined) {
        delete process.env.AUDIT_LOG_PATH;
    } else {
        process.env.AUDIT_LOG_PATH = ORIGINAL_AUDIT_PATH;
    }
}

export function cleanupAuditTmp(tmpRoot: string): void {
    try {
        rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
        // best-effort cleanup
    }
}

export function clearLoggerMocks(loggerMock: AuditLoggerMock): void {
    loggerMock.debug.mockClear();
    loggerMock.info.mockClear();
    loggerMock.warn.mockClear();
    loggerMock.error.mockClear();
}

export function writeAuditTmpFile(filePath: string, contents: string): void {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test tmpdir
    writeFileSync(filePath, contents);
}

export function chmodAuditTmpFile(filePath: string, mode: number): void {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test tmpdir
    chmodSync(filePath, mode);
}

export function listAuditTmp(dir: string): string[] {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test tmpdir
    return readdirSync(dir);
}

export function readAuditTmpFile(filePath: string): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test tmpdir
    return readFileSync(filePath, "utf-8");
}
