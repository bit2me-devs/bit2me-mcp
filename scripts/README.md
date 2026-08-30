# Documentation Generation Scripts

Canonical map: [`docs/README.md`](../docs/README.md). This folder only documents the generators.

## Available Scripts

### `generate-tools-docs.js`

**Command:** `pnpm run build:docs`

**Purpose:** Regenerates derived assets from the centralized tools metadata.

**Generates:**

- `landing/tools-data.js` — Tools catalogue for the landing page (includes schemas and examples).
- `TOOLS_DOCUMENTATION.md` (repository root) — Auto-generated tool documentation with descriptions, endpoints and response schemas.

**Source:**

- `data/tools.json` - Central metadata file

**Usage:** Run after modifying `data/tools.json` to regenerate the landing catalogue.

---

### `generate-llms.js`

**Command:** `pnpm run build:llms`

**Purpose:** Generates documentation files for LLMs from markdown.

**Generates:**

- `landing/llms-full.txt` — complete dump
- `landing/llms.txt` — short index

**Sources:**

- `README.md`
- `AGENTS.md`
- `CHANGELOG.md` (npm / Semantic Release)

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

2. **Regenerate documentation:**

    ```bash
    pnpm run build:docs
    ```

3. **Regenerate LLM documentation (if you change README / AGENTS.md / root CHANGELOG.md):**

    ```bash
    pnpm run build:llms
    ```

4. **Build the project:**
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
