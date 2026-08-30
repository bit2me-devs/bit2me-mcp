# Contributing to Bit2Me MCP Server

Thank you for your interest in contributing to the Bit2Me MCP Server! We welcome contributions from the community to make this project better.

This document covers PRs, pnpm, hooks, and language. Canonical doc map: [docs/README.md](./docs/README.md). Full add-tool checklist: [AGENTS.md](./AGENTS.md).

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
    - [Branching Strategy](#branching-strategy)
    - [Commit Conventions](#commit-conventions)
    - [Language Policy](#language-policy)
- [Testing](#testing)
- [Code Quality & Security](#code-quality--security)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Please be respectful, inclusive, and constructive. The full text is
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) (Contributor Covenant 2.1, English).

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10 or higher (`packageManager` in `package.json`)
- **Git**

### Installation

1.  **Fork the repository** to your own GitHub account.
2.  **Clone your fork** locally:

    ```bash
    git clone https://github.com/YOUR_USERNAME/bit2me-mcp.git
    cd bit2me-mcp
    ```

3.  **Install dependencies**:

    ```bash
    pnpm install
    ```

4.  **Install Husky hooks** (should happen automatically, but if not):

    ```bash
    pnpm run prepare
    ```

### Environment Setup

1.  Create a `.env` file in the root directory based on the example:

    ```bash
    cp .env.example .env
    ```

2.  Configure your API keys in `.env` (required for integration testing or running the server locally):

    ```env
    BIT2ME_API_KEY=your_api_key
    BIT2ME_API_SECRET=your_api_secret
    ```

## Development Workflow

### Branching Strategy

- **`main`**: Production. **Contributors** never push it — open a PR.
  **Maintainers** may push `main` to cut a release (`feat`/`fix`/`perf` publish
  npm). Playbook: [docs/stack/release.md](./docs/stack/release.md).
- **Feature Branches**: Create a new branch for each feature or fix.
- **Local-only** (Husky `pre-push` refuses these names): `feat/go-migration`,
  `fix/audit-batch-hardening`. List: `scripts/push-deny-branches.txt`.

    ```bash
    # For new features
    git checkout -b feat/my-new-feature

    # For bug fixes
    git checkout -b fix/bug-description
    ```

### Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/) in **English**,
enforced by commitlint. Types, release rules, and examples:
[AGENTS.md — Commit Conventions](./AGENTS.md#commit-conventions).
`feat` / `fix` / `perf` on `main` publish npm; `docs` / `chore` / `ci` do not.
See [docs/stack/release.md](./docs/stack/release.md).

### Language Policy

- **Commit Messages**: MUST be in **English**.
- **Code Comments**: MUST be in **English**.
- **Public documentation** (README, CONTRIBUTING, SECURITY, AGENTS.md, `CODE_OF_CONDUCT.md`, ADRs, generated tool docs, root `CHANGELOG.md`): **English**.
- **Internal initiative log** (`docs/done-tasks/`, `docs/CHANGELOG.md`): **Spanish**. See [docs/README.md](./docs/README.md).

## Testing

We use **Vitest**. Coverage **gate** (do not lower): 70% lines/functions/statements, 60% branches (`vitest.config.ts`).

- **Run all tests:**

    ```bash
    pnpm test
    ```

- **Run tests in watch mode (TDD):**

    ```bash
    pnpm test:watch
    ```

- **Run with coverage report:**

    ```bash
    pnpm test:coverage
    ```

**Note:** Please ensure all tests pass before pushing your changes.

## House rules (do not skip)

- **Do not bump** `package.json` or edit the root `CHANGELOG.md`. Version = npm + git tag. See [docs/stack/release.md](./docs/stack/release.md).
- **Do not edit** `TOOLS_DOCUMENTATION.md` by hand. Do not commit `landing/tools-data.js` or `landing/llms*.txt` (gitignored; Pages runs `build:docs` / `build:llms`).
- **New files** in `src/`, `tests/`, `scripts/`: ≤200 lines. Barrels (`pro.ts`, `http.ts`, `response-mappers.ts`, `schemas.ts`) only re-export. `bit2me.ts` orchestrates `bit2meRequest`. Grow a cohesive sibling, not the barrel. `pnpm validate` includes `check-file-size --strict`.
- Reviewers: [`.github/CODEOWNERS`](./.github/CODEOWNERS).

## Code Quality & Security

Our strict pre-commit hooks will automatically run:

1.  **Linting**: `ESLint` for code quality.
2.  **Formatting**: `Prettier` for code style.
3.  **Testing**: Run related unit tests.
4.  **Security Audit**: `pnpm audit` (on package changes) to check for vulnerabilities.
5.  **Secret Scanning**: `gitleaks` (if installed) to prevent committing API keys.

**Manual Commands:**

- Check for linting errors: `pnpm lint`
- Fix linting/formatting: `pnpm run lint:fix`
- Build the project: `pnpm run build`

## Tool Metadata Management

This project uses a centralized metadata system for all tool definitions. The source of truth is `data/tools.json`, which contains all tool definitions including:

- Tool names, descriptions, and types (READ/WRITE/META)
- Input schemas (parameters and their types)
- Example arguments and responses
- Category information

### Adding or Modifying Tools

1. **Edit `data/tools.json`** with `python3` or the shell (the file is huge; do not re-indent it all). Add or modify the tool in the appropriate category.
2. **Update TypeScript handlers**: Modify the corresponding handler function in `src/tools/*.ts` if needed.
3. **Map the REST path** in `scripts/docs-gen/endpoints.js` (one key per tool). Local-only tools get a note, not an HTTP path.
4. **Regenerate committed docs**: Run `pnpm run build:docs` and commit `TOOLS_DOCUMENTATION.md`. `landing/tools-data.js` is gitignored (generate it only for a local landing preview).
5. **Counts**: if the tool total or a category count changes, update `README.md` and the hand-edited strings in `landing/index.html`. `tests/sync-chains.test.ts` checks both.
6. **Follow [AGENTS.md — Adding a New Tool](./AGENTS.md#adding-a-new-tool)** for handlers, registry (`registerCategory`), mappers, tests, and WRITE rules (`confirm` preview + `idempotency_key`).

### Important Notes

- **Never edit `TOOLS_DOCUMENTATION.md` manually**. Always edit `data/tools.json` and run `pnpm run build:docs`. Do not commit `landing/tools-data.js` / `llms*.txt`.
- **Keep examples up to date**: When modifying tool responses, update the `exampleResponse` in `data/tools.json`.
- **Test your changes**: After modifying metadata, run `pnpm run build:docs` and verify the generated files are correct.

## Pull Request Process

1.  **Update Documentation**: If your change affects how a tool works, update `data/tools.json` and run `pnpm run build:docs` to regenerate documentation.
2.  **Changelogs**: Do not edit the root `CHANGELOG.md` (Semantic Release). Maintainers record initiatives in `docs/done-tasks/` and `docs/CHANGELOG.md` (see [docs/README.md](./docs/README.md)).
3.  **Push to your fork**:

    ```bash
    git push origin feat/my-new-feature
    ```

4.  **Open a Pull Request**:
    - Target the `main` branch.
    - Fill out the PR template completely.
    - Link related issues (e.g., `Closes #123`).
5.  **Code Review**: A maintainer listed in [`.github/CODEOWNERS`](./.github/CODEOWNERS) must approve. The last push after review needs a fresh approval (`require_last_push_approval`). Admins cannot bypass these rules.
6.  **Merge**: Once approved and required status checks pass, your code will be merged.

Thank you for contributing! 🚀
