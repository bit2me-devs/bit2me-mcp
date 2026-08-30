# Documentation map

Canonical index for this repository. If two documents disagree, **this table and the files it marks as source of truth win**.

## Language

| Audience                    | Language    | Examples                                                                                                                              |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Public / contributors / npm | **English** | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, `CODE_OF_CONDUCT.md`, ADRs, `TOOLS_DOCUMENTATION.md`, root `CHANGELOG.md` |
| Internal initiative log     | **Spanish** | `docs/done-tasks/`, `docs/CHANGELOG.md`                                                                                               |

Commit messages are always **English** (Conventional Commits).

## For agents

If another file disagrees with this map, **this map wins**.

1. Edit `data/tools.json` with `python3` or the shell; then `pnpm build:docs`. Do not re-indent the whole file.
2. Do not edit generated files or the root `CHANGELOG.md`.
3. Do not bump `package.json`. Published version = npm + git tag `v*`. See [`stack/release.md`](./stack/release.md).
4. Threat model: [`adr/0003-local-single-user-threat-model.md`](./adr/0003-local-single-user-threat-model.md). This is a local one-user proxy, not a multi-tenant SaaS.
5. `docs/done-tasks/` is a Spanish diary, not the WRITE spec (that is AGENTS + `src/utils/write-guards.ts`).
6. Do not read or edit `docs/TODO.md`.

## Source of truth

| Topic                                     | File                                                                                         | Notes                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Tool catalogue (names, schemas, examples) | [`data/tools.json`](../data/tools.json)                                                      | Edit this; then `pnpm build:docs`                              |
| Generated tool docs                       | [`TOOLS_DOCUMENTATION.md`](../TOOLS_DOCUMENTATION.md)                                        | Do **not** edit by hand                                        |
| Landing catalogue JS                      | [`landing/tools-data.js`](../landing/tools-data.js)                                          | Generated. HTML/CSS/CNAME in `landing/` are hand-edited        |
| Agent / contributor implementation rules  | [`AGENTS.md`](../AGENTS.md)                                                                  | Add-tool + mappers + WRITE. Release facts → `stack/release.md` |
| User install & operations                 | [`README.md`](../README.md)                                                                  | stdio + HTTP                                                   |
| How to contribute                         | [`CONTRIBUTING.md`](../CONTRIBUTING.md)                                                      | PRs, pnpm, hooks                                               |
| Code of conduct                           | [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)                                                | Contributor Covenant 2.1 (English)                             |
| Required reviewers                        | [`.github/CODEOWNERS`](../.github/CODEOWNERS)                                                | Either listed maintainer                                       |
| Vulnerability reporting                   | [`SECURITY.md`](../SECURITY.md)                                                              |                                                                |
| npm release history                       | [`CHANGELOG.md`](../CHANGELOG.md)                                                            | Semantic Release only — do not edit                            |
| Published package version                 | npm `@bit2me/mcp-server` + git tag `v*`                                                      | **Not** `package.json` (that file is not bumped on main)       |
| How we release                            | [`stack/release.md`](./stack/release.md)                                                     | Push `main` publishes; do not bump versions by hand            |
| Threat model                              | [`adr/0003-local-single-user-threat-model.md`](./adr/0003-local-single-user-threat-model.md) | Local one-user proxy; LLM confused deputy                      |
| Internal change log                       | [`CHANGELOG.md`](./CHANGELOG.md)                                                             | Spanish; links to done-tasks                                   |
| HTTP credentials                          | [`adr/0001-valet-key-http-credentials.md`](./adr/0001-valet-key-http-credentials.md)         | Accepted                                                       |
| External config store                     | [`adr/0002-external-configuration-store.md`](./adr/0002-external-configuration-store.md)     | **Deferred** — not implemented                                 |
| Tooling / commands                        | [`stack/tooling.md`](./stack/tooling.md)                                                     | pnpm, Makefile, Node versions                                  |
| Doc-generation scripts                    | [`scripts/README.md`](../scripts/README.md)                                                  | `build:docs` / `build:llms`                                    |
| Write-tool confirm / idempotency          | [`AGENTS.md`](../AGENTS.md) (Adding a New Tool) + `src/utils/write-guards.ts`                | `docs/done-tasks/` is a diary, not the spec                    |
| Raw API payload in MCP responses          | [`AGENTS.md`](../AGENTS.md) (Raw Response Support) + `.env.example`                          | Env `BIT2ME_INCLUDE_RAW_RESPONSE`. No separate guide           |

## Two runtimes (do not mix)

- **stdio** (`bit2me-mcp-server`): one local user, credentials in `.env`. Default threat model.
- **HTTP** (`bit2me-mcp-http`): per-request API key or JWT. Bind defaults to `127.0.0.1`. See ADR 0001.

Bit2Me’s gateway authenticates keys/JWTs. A missing header on the MCP HTTP gate is not “auth bypass”.

## Generated vs hand-edited

**Generated** (`pnpm build:docs` / `pnpm build:llms`): `TOOLS_DOCUMENTATION.md`, `landing/tools-data.js`, `landing/llms.txt`, `landing/llms-full.txt`.

**Hand-edited landing**: `landing/index.html`, CSS, `landing/CNAME`. Do not rewrite `tools-data.js` by hand.

## Not canonical

These may exist on a developer disk under `docs/` (gitignored except the paths above). Treat them as scratch from 2025 planning — **not** current product docs:

`PRODUCT.md`, `IMPROVEMENTS_*.md`, `CONSISTENCY_*.md`, `RADICAL_CONSISTENCY_PLAN.md`, `CLEANUP_ANALYSIS.md`, `MIGRATION_GUIDE.md`, `tool_documentation.md`, swagger JSON dumps, video prompts, etc.

`docs/TODO.md` is the maintainer’s private list. Agents must not read or edit it.

A leftover `docs/RAW_RESPONSE_GUIDE.md` may exist on disk from 2025. It is **gitignored** and not canonical — use AGENTS + `.env.example`.
