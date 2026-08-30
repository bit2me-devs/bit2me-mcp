import { accessSync, constants as fsConstants, realpathSync } from "node:fs";
import { isAbsolute, dirname, basename, join, normalize, sep } from "node:path";
import { setAuditPath } from "./audit-state.js";

/**
 * Validate AUDIT_LOG_PATH and pin the resolved absolute path.
 * Unset → logger fallback. Throws on invalid operator config.
 */
export function initAudit(): void {
    const raw = process.env.AUDIT_LOG_PATH;
    if (!raw || raw.trim() === "") {
        setAuditPath(null);
        return;
    }
    const candidate = raw.trim();
    if (candidate.includes("\0")) {
        throw new Error("AUDIT_LOG_PATH must not contain NUL bytes");
    }
    if (!isAbsolute(candidate)) {
        throw new Error("AUDIT_LOG_PATH must be an absolute path");
    }
    const rawSegments = candidate.split(sep);
    if (rawSegments.includes("..")) {
        throw new Error("AUDIT_LOG_PATH must not contain '..' segments");
    }
    const normalised = normalize(candidate);
    const parent = dirname(normalised);
    let resolvedParent: string;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator AUDIT_LOG_PATH after absolute + no-traversal checks
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
    setAuditPath(join(resolvedParent, basename(normalised)));
}
