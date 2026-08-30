# Documentation map

Canonical index for this repository. If two documents disagree, **this table and the files it marks as source of truth win**.

## Language

| Audience                    | Language    | Examples                                                                                                        |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| Public / contributors / npm | **English** | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, ADRs, `TOOLS_DOCUMENTATION.md`, root `CHANGELOG.md` |
| Internal initiative log     | **Spanish** | `docs/done-tasks/`, `docs/CHANGELOG.md`                                                                         |

Commit messages are always **English** (Conventional Commits).

## Source of truth

| Topic                                     | File                                                                                     | Notes                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Tool catalogue (names, schemas, examples) | [`data/tools.json`](../data/tools.json)                                                  | Edit this; then `pnpm build:docs`                       |
| Generated tool docs                       | [`TOOLS_DOCUMENTATION.md`](../TOOLS_DOCUMENTATION.md)                                    | Do **not** edit by hand                                 |
| Landing catalogue JS                      | [`landing/tools-data.js`](../landing/tools-data.js)                                      | Generated. HTML/CSS/CNAME in `landing/` are hand-edited |
| Agent / contributor implementation rules  | [`AGENTS.md`](../AGENTS.md)                                                              | How to add tools, test, release                         |
| User install & operations                 | [`README.md`](../README.md)                                                              | stdio + HTTP                                            |
| How to contribute                         | [`CONTRIBUTING.md`](../CONTRIBUTING.md)                                                  | PRs, pnpm, hooks                                        |
| Vulnerability reporting                   | [`SECURITY.md`](../SECURITY.md)                                                          |                                                         |
| npm release history                       | [`CHANGELOG.md`](../CHANGELOG.md)                                                        | Semantic Release only — do not edit                     |
| Internal change log                       | [`CHANGELOG.md`](./CHANGELOG.md)                                                         | Spanish; links to done-tasks                            |
| HTTP credentials                          | [`adr/0001-valet-key-http-credentials.md`](./adr/0001-valet-key-http-credentials.md)     |                                                         |
| External config                           | [`adr/0002-external-configuration-store.md`](./adr/0002-external-configuration-store.md) |                                                         |
| Doc-generation scripts                    | [`scripts/README.md`](../scripts/README.md)                                              |                                                         |

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
