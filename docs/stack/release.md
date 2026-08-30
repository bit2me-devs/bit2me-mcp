# How we release

Canonical playbook. If `AGENTS.md` or a comment disagrees, **this file wins**.

## Do not do this

- Do not bump `package.json` by hand.
- Do not `pnpm publish` / `npm publish` locally.
- Do not `git tag` a version by hand.
- Do not edit the root `CHANGELOG.md` (Semantic Release owns it **on the npm tarball and GitHub Release**, not necessarily on `main`).
- Do not `git push --all`. Local-only names are blocked (`scripts/push-deny-branches.txt`).

## What to do

1. On `main`, working tree clean. `feat:` / `fix:` / `perf:` since the last **git tag** will cut a release.
2. `git push origin main` (maintainers). Contributors open a PR instead; see `CONTRIBUTING.md`.
3. GitHub Actions `release.yml` runs tests and Semantic Release.
4. Semantic Release publishes `@bit2me/mcp-server`, creates tag `vX.Y.Z` and a GitHub Release.
5. The **same** workflow then redeploys GitHub Pages so `tools-data.js` can see the new tag. The landing hero also reads **live npm** (same as the shields badge).

`GITHUB_TOKEN` cannot start a second workflow. That is why Pages is a job in `release.yml`, not only `on.release` in `deploy.yml`.

## Source of truth for the version number

| Place                           | Trust it?                                      |
| ------------------------------- | ---------------------------------------------- |
| npm `@bit2me/mcp-server`        | **Yes** — what users install                   |
| Git tag `v*`                    | **Yes** — created with the publish             |
| Landing hero + shields badge    | Yes — they follow npm                          |
| `package.json` on branch `main` | **No** — not committed back (bot is not admin) |

## Who may push `main`

- **External / typical contributors:** PR into `main`. Do not push `main`.
- **Maintainers cutting a release:** push `main` knowing `feat`/`fix`/`perf` publish npm.

CI Release uses **Node 24** (OIDC trusted publishing). No `NPM_TOKEN` in the current workflow.

## Troubleshooting

- **Nothing published:** only `feat:` / `fix:` / `perf:` since the last **git tag** cut a release. `docs:` / `chore:` / `ci:` do not.
- **OIDC / 401 on npm:** the Release job needs `id-token: write`. `@bit2me/mcp-server` must list `.github/workflows/release.yml` as trusted publisher. Do not add `NPM_TOKEN` unless trusted publishing is retired on purpose.
- **`package.json` on `main` looks old:** expected. Trust npm + the git tag.
- **Landing still shows an old tag:** the `landing` job in `release.yml` must run after Semantic Release (same workflow). `GITHUB_TOKEN` cannot start `deploy.yml` via `on.release`.
