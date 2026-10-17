import { spawnSync } from 'node:child_process';

// braces@3.0.3 is the newest release and is still inside GHSA-vfj7-8cjw-p6xm.
// Nothing on npm is patched. semantic-release pulls it through micromatch
// (dev/CI only). Every other high or critical advisory still fails the build.
const ALLOWED_UNFIXED = new Set(['GHSA-vfj7-8cjw-p6xm']);
const BLOCKING = new Set(['high', 'critical']);

const result = spawnSync('pnpm', ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
});

if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
}

let report;
try {
    report = JSON.parse(result.stdout || '{}');
} catch {
    process.stderr.write(result.stderr || result.stdout || 'pnpm audit returned invalid JSON\n');
    process.exit(result.status === 0 ? 1 : result.status || 1);
}

const advisories = Object.values(report.advisories ?? {});
if ((result.status ?? 1) !== 0 && advisories.length === 0) {
    process.stderr.write(result.stderr || 'pnpm audit failed without advisories\n');
    process.exit(result.status || 1);
}

const blocking = advisories.filter((advisory) => {
    if (!BLOCKING.has(advisory.severity)) {
        return false;
    }
    return !ALLOWED_UNFIXED.has(advisory.github_advisory_id);
});

if (blocking.length > 0) {
    for (const advisory of blocking) {
        process.stderr.write(
            `${advisory.severity} ${advisory.module_name} ${advisory.github_advisory_id} ${advisory.title}\n`,
        );
    }
    process.exit(1);
}

const waived = advisories.filter((advisory) => ALLOWED_UNFIXED.has(advisory.github_advisory_id));
if (waived.length > 0) {
    process.stderr.write(
        'audit: waiving GHSA-vfj7-8cjw-p6xm (braces <=3.0.3 has no patched release; dev-only via semantic-release)\n',
    );
}
