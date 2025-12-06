# Documentation Generation Scripts

This folder contains scripts for generating documentation and project artifacts.

## Available Scripts

### `generate-tools-docs.js`

**Command:** `npm run build:docs`

**Purpose:** Regenerates derived assets from the centralized tools metadata.

**Generates:**

- `landing/tools-data.js` — Tools catalogue for the landing page (includes schemas and examples).
- `TOOLS_DOCUMENTATION.md` (repository root) — Auto-generated tool documentation with descriptions, endpoints and response schemas.

**Source:**

- `data/tools.json` - Central metadata file

**Usage:** Run after modifying `data/tools.json` to regenerate the landing catalogue.

---

### `generate-llms.js`

**Command:** `npm run build:llms`

**Purpose:** Generates documentation files for LLMs from markdown.

**Generates:**

- `landing/llms-full.txt` - Complete documentation
- `landing/llms.txt` - Lightweight version

**Sources:**

- `README.md`
- `agents.md`
- `CHANGELOG.md`

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
    # Edit data/tools.json
    ```

2. **Regenerate documentation:**

    ```bash
    npm run build:docs
    ```

3. **Regenerate LLM documentation (if you change README/agents/CHANGELOG):**

    ```bash
    npm run build:llms
    ```

4. **Build the project:**
    ```bash
    npm run build
    ```

## Centralized Architecture

All tools metadata is centralized in `data/tools.json`, including:

- Tool definitions (name, description, type)
- Input schemas (`inputSchema`)
- Response schemas (`responseSchema`) with detailed descriptions
- Usage examples and responses

The generation scripts transform this single source into the different documentation artifacts.
