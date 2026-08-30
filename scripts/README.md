# Documentation Generation Scripts

Canonical map: [`docs/README.md`](../docs/README.md). This folder only documents the generators.

## Available Scripts

### `generate-tools-docs.js`

**Command:** `pnpm run build:docs`

**Purpose:** Regenerates derived assets from the centralized tools metadata. Thin entry: helpers live in `scripts/docs-gen/` (`version.js`, `landing.js`, `markdown.js`, `endpoints.js`).

**Generates:**

- `TOOLS_DOCUMENTATION.md` (committed) — tool documentation with descriptions, endpoints and response schemas.
- `landing/tools-data.js` (gitignored) — catalogue for the landing. GitHub Pages runs this script; locally only if you preview `landing/`.

**Source:**

- `data/tools.json` — catalogue
- `scripts/docs-gen/endpoints.js` — Bit2Me path (or local-only note) per tool. Keys must match the catalogue 1:1 (`tests/sync-chains.test.ts`).

**Usage:** Run after modifying `data/tools.json` (and `endpoints.js` if you added/renamed a tool) to regenerate the landing catalogue.

---

### `generate-llms.js`

**Command:** `pnpm run build:llms`

**Purpose:** Generates documentation files for LLMs from markdown.

**Generates** (gitignored; Pages runs this job):

- `landing/llms-full.txt` — complete dump
- `landing/llms.txt` — short index

**Sources:**

- `docs/README.md` (canonical map)
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md` (npm / Semantic Release)

---

### `check-file-size.sh`

**Command:** `make check-file-size` / `make check-file-size-strict` / Husky `--strict --staged`

**Purpose:** Reject source files over 200 lines (`*.ts`, `*.js`, tests, `.sh`, `.py`). Distinct from `.husky/check-file-size.sh` (500KB bytes).

---

### `check-push-deny.sh`

**Command:** run by Husky `pre-push` (also `sh scripts/check-push-deny.sh`)

**Purpose:** Rejects a push if a local or remote ref is listed in `scripts/push-deny-branches.txt`.

---

### `minify-html.js`

**Command:** Not in package.json (run manually if needed)

**Purpose:** Minifies the landing page HTML for production.

**Usage:**

```bash
NODE_ENV=production node scripts/minify-html.js
```

**Note:** Currently not used in the build flow, but can be useful for optimization.

---

## Recommended Workflow

1. **Modify tools metadata:**

    ```bash
    # Edit data/tools.json with python3 or the shell (file is huge)
    ```

2. **Regenerate committed docs** (`TOOLS_DOCUMENTATION.md`):

    ```bash
    pnpm run build:docs
    ```

    `landing/tools-data.js` is also written but gitignored. Run the same command (plus `pnpm run build:llms`) only if you preview the landing locally. GitHub Pages generates both.

3. **Build the project:**

    ```bash
    pnpm run build
    ```

## Centralized Architecture

All tools metadata is centralized in `data/tools.json`, including:

- Tool definitions (name, description, type)
- Input schemas (`inputSchema`)
- Response schemas (`responseSchema`) with detailed descriptions
- Usage examples and responses

The generation scripts transform this single source into the different documentation artifacts.
