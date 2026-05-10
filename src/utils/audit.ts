/**
 * Append-only audit log for write operations.
 *
 * Every successful (or failed) mutation of user state — order placement,
 * cancellation, withdrawal, loan creation, earn deposit/withdraw — is
 * recorded here. The log is intended for after-the-fact reconciliation,
 * compliance, and forensic debugging when a user disputes a trade.
 *
 * Storage:
 *  - When `AUDIT_LOG_PATH` is set AND validates at boot, lines are
 *    appended asynchronously to that file. The file rotates by size
 *    (default 50 MiB) keeping up to 5 historical files.
 *  - Otherwise the audit entry is emitted via `logger.info` with a
 *    distinct `audit: true` tag, keeping the dependency surface
 *    minimal.
 *
 * Validation: `initAudit()` MUST be called once during bootstrap. It
 * resolves the configured path through `realpath` (catching symlink
 * attacks), enforces the absolute / no-traversal contract, and verifies
 * the parent directory is writable. If any check fails the boot is
 * aborted instead of silently downgrading to logger fallback.
 *
 * The log contains NO sensitive identifiers (API keys, JWTs, full PII).
 * Tenant identification is via the AsyncLocalStorage correlation ID and
 * the masked session token already used elsewhere.
 */

import { accessSync, constants as fsConstants, realpathSync } from "node:fs";
import { appendFile, stat as fsStat, rename as fsRename, unlink as fsUnlink } from "node:fs/promises";
import { isAbsolute, dirname, basename, join, normalize, sep } from "node:path";
import { createHash } from "node:crypto";
import { logger } from "./logger.js";
import { getCorrelationId, getSessionToken } from "./context.js";

export interface AuditEntry {
    /** Tool name as exposed by the MCP catalog (e.g. `pro_create_order`). */
    tool: string;
    /** "success" | "error" */
    outcome: "success" | "error";
    /** Sanitised arguments that drove the call. */
    args: Record<string, unknown>;
    /** Optional error message (when outcome === "error"). */
    error?: string;
    /** Optional idempotency key, when applicable. */
    idempotencyKey?: string;
}

/** Recorded shape on disk / in the log stream. */
interface AuditRecord extends AuditEntry {
    ts: string;
    correlationId: string | undefined;
    /**
     * Short SHA-256 prefix of the session token used during this call.
     *
     * Property name is deliberately `sessionFingerprint` (NOT `tokenHash`
     * or `*token*`): the logger's PII sanitizer aggressively redacts any
     * key matching `/token|secret|key|jwt/`, and we want the fingerprint
     * to remain visible — it's a one-way digest, never the token itself.
     */
    sessionFingerprint: string | undefined;
}

/**
 * Default rotation threshold. The active file rotates to `.1` once it
 * crosses this size, keeping up to {@link AUDIT_HISTORY_DEPTH} historical
 * archives. 50 MiB is a sensible default: large enough to absorb several
 * days of trading activity, small enough to ship to log aggregators.
 */
const DEFAULT_AUDIT_MAX_BYTES = 50 * 1024 * 1024;

/**
 * How many historical files we keep in addition to the active one.
 * `audit.log`, `audit.log.1` … `audit.log.<DEPTH>`. Older archives are
 * deleted on rotation.
 */
const AUDIT_HISTORY_DEPTH = 4;

let auditPathValidated: string | null = null;
let auditMaxBytes: number = DEFAULT_AUDIT_MAX_BYTES;

function fingerprint(token: string | undefined): string | undefined {
    if (!token) return undefined;
    return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

/**
 * Validate `AUDIT_LOG_PATH` and pin the resolved absolute path for
 * runtime use. MUST be called once at bootstrap, before any tool
 * execution that may invoke {@link recordAudit}.
 *
 * Validation rules:
 *  - When unset, `recordAudit` falls back to the logger stream and this
 *    function is a no-op.
 *  - Otherwise the path:
 *      * MUST be absolute (no relative paths to avoid CWD-dependent
 *        behaviour and traversal).
 *      * MUST NOT contain `..` segments after normalisation.
 *      * MUST NOT contain NUL bytes.
 *      * Its parent directory MUST resolve through `realpath` (rejects
 *        dangling symlinks and detects symlink-target tampering at
 *        boot — once frozen the path used by `recordAudit` is the
 *        already-resolved one).
 *      * The resolved parent directory MUST be writable by the current
 *        process.
 *
 * Throws on any violation so the caller can abort startup. The error
 * message is suitable for an operator-facing log line; it does not echo
 * the raw input back to potentially-untrusted clients (only operators
 * see boot logs).
 */
export function initAudit(): void {
    const raw = process.env.AUDIT_LOG_PATH;
    if (!raw || raw.trim() === "") {
        auditPathValidated = null;
        return;
    }
    const candidate = raw.trim();
    if (candidate.includes("\0")) {
        throw new Error("AUDIT_LOG_PATH must not contain NUL bytes");
    }
    if (!isAbsolute(candidate)) {
        throw new Error("AUDIT_LOG_PATH must be an absolute path");
    }
    // Reject `..` segments BEFORE normalisation collapses them. The
    // operator's intent must be expressed as a clean absolute path
    // without traversal, regardless of whether the resulting target
    // would still exist after collapsing.
    const rawSegments = candidate.split(sep);
    if (rawSegments.includes("..")) {
        throw new Error("AUDIT_LOG_PATH must not contain '..' segments");
    }
    const normalised = normalize(candidate);
    const parent = dirname(normalised);
    let resolvedParent: string;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- parent dir derived from the operator-controlled AUDIT_LOG_PATH after absolute + no-traversal checks; resolving here is the symlink-attack mitigation.
        resolvedParent = realpathSync(parent);
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`AUDIT_LOG_PATH parent directory does not resolve: ${detail}`);
    }
    try {
        accessSync(resolvedParent, fsConstants.W_OK);
    } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`AUDIT_LOG_PATH parent directory is not writable: ${detail}`);
    }
    auditPathValidated = join(resolvedParent, basename(normalised));
}

/**
 * Pre-rotation check: if the active audit file is larger than the
 * configured threshold, shift the historical archives by one slot and
 * rename the active file to `.1`. Errors during rotation are logged but
 * do NOT abort the append — the worst case is a single oversized file.
 */
async function rotateIfNeeded(activePath: string): Promise<void> {
    // `activePath` is the value frozen by `initAudit()` after absolute,
    // no-traversal, realpath and writability checks. The eslint
    // non-literal-fs-filename rule is muted on every fs call below
    // because the input has already been validated up front and is no
    // longer attacker-controlled at this layer.
    let size: number;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot via initAudit()
        const s = await fsStat(activePath);
        size = s.size;
    } catch {
        // ENOENT: file does not exist yet, nothing to rotate.
        return;
    }
    if (size < auditMaxBytes) return;
    // Drop the oldest archive (if any), then shift down: .{N-1} -> .N.
    const oldest = `${activePath}.${AUDIT_HISTORY_DEPTH}`;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot via initAudit()
        await fsUnlink(oldest);
    } catch {
        // Missing oldest archive is the common case; ignore.
    }
    for (let i = AUDIT_HISTORY_DEPTH - 1; i >= 1; i -= 1) {
        const from = `${activePath}.${i}`;
        const to = `${activePath}.${i + 1}`;
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot via initAudit()
            await fsRename(from, to);
        } catch {
            // Missing intermediate archive is benign; continue.
        }
    }
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot via initAudit()
        await fsRename(activePath, `${activePath}.1`);
    } catch (err) {
        logger.warn("Audit log rotation failed; appending to oversized active file", {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

/**
 * Append a new audit record to the configured sink. Returns a promise
 * that callers SHOULD treat as fire-and-forget — the function never
 * rejects on I/O failure (it falls back to the logger instead) so
 * awaiting it is safe but optional.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
    const record: AuditRecord = {
        ts: new Date().toISOString(),
        correlationId: getCorrelationId(),
        sessionFingerprint: fingerprint(getSessionToken()),
        ...entry,
    };

    const path = auditPathValidated;
    if (path) {
        try {
            await rotateIfNeeded(path);
            // The path here is the one we resolved through `realpath` at
            // boot time, so the eslint security rule about non-literal
            // filenames is mitigated by the up-front validation.
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot via initAudit()
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

/**
 * Test helper: override the rotation threshold in bytes.
 *
 * Production code MUST NOT call this; it exists so unit tests can
 * exercise the rotation path without writing 50 MiB of fixtures.
 */
export function _setAuditMaxBytesForTesting(bytes: number): void {
    auditMaxBytes = bytes;
}

/**
 * Test helper: reset internal state (path + rotation threshold) so each
 * test starts from a clean module-level baseline.
 */
export function _resetAuditForTesting(): void {
    auditPathValidated = null;
    auditMaxBytes = DEFAULT_AUDIT_MAX_BYTES;
}

/**
 * Test helper: synchronously inspect the validated audit path. Returns
 * `null` when in logger-fallback mode.
 */
export function _getAuditPathForTesting(): string | null {
    return auditPathValidated;
}
