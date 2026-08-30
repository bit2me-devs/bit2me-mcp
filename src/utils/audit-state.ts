const DEFAULT_AUDIT_MAX_BYTES = 50 * 1024 * 1024;
export const AUDIT_HISTORY_DEPTH = 4;

let auditPathValidated: string | null = null;
let auditMaxBytes: number = DEFAULT_AUDIT_MAX_BYTES;

export function getAuditPath(): string | null {
    return auditPathValidated;
}

export function setAuditPath(path: string | null): void {
    auditPathValidated = path;
}

export function getAuditMaxBytes(): number {
    return auditMaxBytes;
}

export function setAuditMaxBytes(bytes: number): void {
    auditMaxBytes = bytes;
}

export function resetAuditState(): void {
    auditPathValidated = null;
    auditMaxBytes = DEFAULT_AUDIT_MAX_BYTES;
}
