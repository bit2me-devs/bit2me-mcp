import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Single read of package.json. `src/` and `build/` both sit one level
 * above the repo root's package.json.
 */
export function readPackageVersion(): string {
    if (process.env.npm_package_version) return process.env.npm_package_version;
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf-8")) as {
            version?: string;
        };
        return pkg.version ?? "unknown";
    } catch {
        return "unknown";
    }
}

export const PACKAGE_VERSION = readPackageVersion();
