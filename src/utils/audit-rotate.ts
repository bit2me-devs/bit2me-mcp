import { stat as fsStat, rename as fsRename, unlink as fsUnlink } from "node:fs/promises";
import { logger } from "./logger.js";
import { AUDIT_HISTORY_DEPTH, getAuditMaxBytes } from "./audit-state.js";

/** Rotate the active audit file when it exceeds the size cap. */
export async function rotateIfNeeded(activePath: string): Promise<void> {
    let size: number;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path frozen by initAudit()
        const s = await fsStat(activePath);
        size = s.size;
    } catch {
        return;
    }
    if (size < getAuditMaxBytes()) return;
    const oldest = `${activePath}.${AUDIT_HISTORY_DEPTH}`;
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot
        await fsUnlink(oldest);
    } catch {
        // missing oldest archive is common
    }
    for (let i = AUDIT_HISTORY_DEPTH - 1; i >= 1; i -= 1) {
        const from = `${activePath}.${i}`;
        const to = `${activePath}.${i + 1}`;
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot
            await fsRename(from, to);
        } catch {
            // missing intermediate archive is benign
        }
    }
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- validated at boot
        await fsRename(activePath, `${activePath}.1`);
    } catch (err) {
        logger.warn("Audit log rotation failed; appending to oversized active file", {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
