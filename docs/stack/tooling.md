# Tooling snapshot

Canonical stack for this repo. Commands go through **pnpm**; `Makefile` is a thin wrapper (`make test` → `pnpm test`).

## Runtime

| Piece       | Version / note                                      |
| ----------- | --------------------------------------------------- |
| Node.js     | ≥20 to run; Release CI uses **Node 24** (OIDC)      |
| Package mgr | **pnpm** (`pnpm-lock.yaml`). Do not use npm locally |
| TypeScript  | 6.x                                                 |
| Tests       | Vitest; coverage **gate** 70/70/60/70 (see config)  |
| Lint/format | ESLint + Prettier (Husky + lint-staged)             |
| Commits     | Conventional Commits (commitlint)                   |
| Secrets     | gitleaks on pre-commit (`pnpm secret-scan`)         |
| Publish     | Semantic Release → npm `@bit2me/mcp-server`         |

## Day-to-day commands

| Goal                          | Command                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Install                       | `pnpm install --frozen-lockfile`                                                         |
| Typecheck                     | `pnpm typecheck`                                                                         |
| Unit tests                    | `pnpm test`                                                                              |
| Coverage                      | `pnpm test:coverage`                                                                     |
| E2E (opt-in)                  | `pnpm test:e2e`                                                                          |
| Full gate                     | `pnpm validate`                                                                          |
| Build                         | `pnpm build`                                                                             |
| Tool docs + landing catalogue | `pnpm build:docs`                                                                        |
| LLM landing dumps             | `pnpm build:llms`                                                                        |
| Inspector vs local build      | `pnpm dev` (`pnpm dlx` inspector)                                                        |
| Inspector CLI                 | `pnpm dlx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list` |

## Sources of truth (do not invent others)

- Tools: `data/tools.json` → `pnpm build:docs`
- Doc map: [`../README.md`](../README.md)
- Agent rules: [`../../AGENTS.md`](../../AGENTS.md)
- Release: [`release.md`](./release.md)
- Threat model: [`../adr/0003-local-single-user-threat-model.md`](../adr/0003-local-single-user-threat-model.md)

There is **no** `make check-file-size` in this repo. Keep new source files ≤200 lines by convention.

## Local-only branches

Husky `pre-push` runs `scripts/check-push-deny.sh` first. Names in
`scripts/push-deny-branches.txt` cannot be pushed (`git push`, `git push --all`,
or `main:feat/go-migration`). Today: `feat/go-migration`, `fix/audit-batch-hardening`.
