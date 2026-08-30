/**
 * Append-only audit log for WRITE tools. Path validation: audit-path.ts.
 * Rotation: audit-rotate.ts. No credentials in the log.
 */

import { appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { logger } from "./logger.js";
import { getCorrelationId, getSessionToken } from "./context.js";
import { getAuditPath, resetAuditState, setAuditMaxBytes } from "./audit-state.js";
import { rotateIfNeeded } from "./audit-rotate.js";

export { initAudit } from "./audit-path.js";

export interface AuditEntry {
    tool: string;
    outcome: "success" | "error";
    args: Record<string, unknown>;
    error?: string;
    idempotencyKey?: string;
}

interface AuditRecord extends AuditEntry {
    ts: string;
    correlationId: string | undefined;
    /** SHA-256 prefix; name avoids logger redaction of *token*. */
    sessionFingerprint: string | undefined;
}

function fingerprint(token: string | undefined): string | undefined {
    if (!token) return undefined;
    return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
    const record: AuditRecord = {
        ts: new Date().toISOString(),
        correlationId: getCorrelationId(),
        sessionFingerprint: fingerprint(getSessionToken()),
        ...entry,
    };

    const path = getAuditPath();
    if (path) {
        try {
            await rotateIfNeeded(path);
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot
            await appendFile(path, JSON.stringify(record) + "\n", { encoding: "utf8" });
            return;
        } catch (err) {
            logger.warn("Failed to write audit log; falling back to logger", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    logger.info("audit", { audit: true, ...record });
}

export function _setAuditMaxBytesForTesting(bytes: number): void {
    setAuditMaxBytes(bytes);
}

export function _resetAuditForTesting(): void {
    resetAuditState();
}

export function _getAuditPathForTesting(): string | null {
    return getAuditPath();
}
