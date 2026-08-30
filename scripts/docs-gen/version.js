import { execFileSync } from "child_process";

/**
 * Version advertised on the landing page.
 *
 * `semantic-release` does not commit the bump to `main`, so
 * `package.json.version` lags npm and the git tag.
 *
 *  1. `git describe --tags --abbrev=0`
 *  2. `process.env.RELEASE_VERSION`
 *  3. `package.json.version`
 *
 * Never includes the leading `v`.
 */
export function resolveVersion(packageJsonVersion) {
    try {
        const out = execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        if (out) return out.replace(/^v/, "");
    } catch {
        // git missing, not a repo, or no tags fetched — fall through.
    }
    if (process.env.RELEASE_VERSION) {
        return process.env.RELEASE_VERSION.replace(/^v/, "");
    }
    return packageJsonVersion;
}
