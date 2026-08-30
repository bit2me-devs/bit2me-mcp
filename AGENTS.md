# Agent Rules for Bit2Me MCP Server Repository

Canonical map of all docs (generated vs hand-edited, EN vs ES): [`docs/README.md`](./docs/README.md). If this file disagrees with that map, **the map wins**.

This document contains conventions for implementing in this repository.

## 📋 Table of Contents

1. [Commit Conventions](#commit-conventions)
2. [Versioning & Releases](#versioning--releases)
3. [API Response Mapping](#api-response-mapping)
4. [Testing](#testing)
5. [Code Structure](#code-structure)
6. [Adding a New Tool](#adding-a-new-tool)
7. [Also see](#also-see)
8. [Quick Reference](#quick-reference)

---

## Commit Conventions

### Rules

- **ALWAYS** use [Conventional Commits](https://www.conventionalcommits.org/) format
- **Format**: `<type>(<scope>): <subject>`
- **Types that trigger releases**:
    - `feat:` → Minor version bump (1.1.0 → 1.2.0)
    - `fix:` → Patch version bump (1.1.0 → 1.1.1)
    - `perf:` → Patch version bump
- **Types that DON'T trigger releases**:
    - `chore:` - Build/dependency changes
    - `ci:` - CI/CD changes
    - `docs:` - Documentation only
    - `style:` - Code style changes
    - `refactor:` - Code refactoring
    - `test:` - Test changes
- **CRITICAL: All commit messages MUST be written in English**
    - Subject line must be in English
    - Body (if present) must be in English
    - No exceptions - this ensures consistency and compatibility with tools
- **Commitlint** validates all commits via Husky pre-commit hook

### Examples

```bash
feat: add optional raw_response support in mapped responses
fix: correct wallet address mapper and add pocket details mapper
ci: improve semantic-release npm configuration
docs: add NPM badge and link to README
chore(deps): bump zod from 4.1.12 to 4.1.13
```

---

## Versioning & Releases

Canonical playbook: [`docs/stack/release.md`](./docs/stack/release.md). If this section disagrees, **that file wins**.

- **Publish:** `feat:` / `fix:` / `perf:` on `main` (maintainers push; contributors open a PR).
- **Do not** bump `package.json`, `pnpm publish`, or `git tag` by hand.
- **Version** = npm `@bit2me/mcp-server` + git tag `v*`. `package.json` on `main` may lag.
- **Major** needs `BREAKING CHANGE:` in the commit body. `docs:` / `chore:` / `ci:` do not publish.

---

## API Response Mapping

### Core Principles

- **Always map raw API responses** to optimized schemas
- **Use snake_case** for all field names (better for LLM consumption)
- **Flatten structures** - remove unnecessary nesting
- **Filter zero balances** and irrelevant fields
- **Provide defaults** for missing fields (empty strings, "0", etc.)

### Mapper Functions

- **Location**: `src/utils/response-mappers.ts`
- **Pattern**: `map<Entity>Response(raw: unknown): <Entity>Response`
- **Always validate** input with type guards (`isValidObject`, `isValidArray`)
- **Throw `ValidationError`** for invalid structures
- **Handle multiple field name variations** (e.g., `address`, `addr`, `addressValue`)

### Raw Response Support

- **Optional feature** via `BIT2ME_INCLUDE_RAW_RESPONSE` env var
- **Default**: `false` (raw responses excluded)
- **Usage**: Wrap mapped responses with `wrapResponseWithRaw()`
- **Purpose**: Debugging and completeness verification
- **Do not** add a separate guide under `docs/` — this section and `.env.example` are enough

### Example Mapper Pattern

```typescript
export function mapWalletPocketDetailsResponse(raw: unknown): WalletPocketDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid wallet pocket details response structure");
    }

    return {
        id: raw.id || "",
        currency: raw.currency || "",
        balance: raw.balance || "0",
        available: raw.available || "0",
        blocked: raw.blocked || raw.blockedBalance || "0",
        name: raw.name,
        created_at: raw.createdAt || raw.created_at || "",
    };
}
```

### Schema Definitions

- **Location**: `src/utils/schemas.ts`
- **All schemas** must match mapper output
- **Use TypeScript interfaces** for type safety
- **Optional fields** marked with `?`
- **Required fields** have defaults in mappers

---

## Testing

### Test Structure

- **Framework**: Vitest
- **Location**: `tests/` directory
- **Pattern**: Mirror `src/` structure
- **Coverage gate** (Vitest): 70% lines/functions/statements, 60% branches (`vitest.config.ts`). Do not lower it.

### Test Files

- `tests/mappers.test.ts` - Response mapper tests
- `tests/tools/*.test.ts` - Tool handler tests
- `tests/config.test.ts` - Configuration tests
- `tests/auth.test.ts` - Authentication tests
- `tests/regression.test.ts` - Zero-diff catalogue: every tool in `data/tools.json` matches the registry (modulo injected `jwt`).
- `tests/concurrency.test.ts` - Verifies `AsyncLocalStorage` isolation: concurrent requests with different JWTs do not bleed state into each other.
- `tests/http-transport.test.ts` - Integration tests for the HTTP/SSE binary.
- `tests/write-safeguards.test.ts` - Confirm preview, idempotency stamp, amount validation.

### Mocking Rules

- **Always mock** `getConfig()` in tests
- **Set `INCLUDE_RAW_RESPONSE: false`** by default in test mocks
- **Mock external API calls** (Bit2Me API)
- **Use fixtures** for consistent test data (`tests/fixtures.ts`)

### Running Tests

```bash
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Generate coverage report
```

### Test Requirements

- **All mappers** must have tests
- **All tools** must have handler tests
- **Tests run automatically** on pre-commit (via lint-staged)
- **CI runs tests** before release

---

## Code Structure

### Do not grow these files

New files in `src/`, `tests/`, `scripts/`: **≤200 lines**. Extract a sibling in the same task (examples already in tree: `amount.ts`, `write-guards.ts`, `pair-api.ts`, `broker-proforma.ts`).

Do **not** add lines to: `pro.ts`, `broker.ts`, `format.ts`, `bit2me.ts`, `response-mappers.ts`, `http.ts`.

### Architecture: Key Patterns

#### 1. Declarative Tool Registry (`src/tools/registry.ts`)

Tools are registered once at startup using metadata from `data/tools.json`. The registry provides O(1) dispatch — no `if/else` chain in `index.ts`. When you add a new tool you only need to:

1. Add its entry to `data/tools.json` (name, description, inputSchema, type: `"READ"` or `"WRITE"` or `"META"`, category, examples).
2. Export a handler function from the appropriate `src/tools/<category>.ts`.
3. Register the handler in `src/tools/registry.ts`.

The registry reads `type` from `data/tools.json` to determine whether a tool is a write operation (required for the audit hook).

#### 2. Per-Request Context Isolation (`src/utils/context.ts`)

Every tool invocation runs inside an `AsyncLocalStorage` boundary (`runWithContext()`). The context store carries:

- `correlationId`: UUID generated per request, included in every log line.
- `sessionToken` (`jwt`): the optional per-call session token, never logged in the clear.
- `toolName`, `startTime`: used for metrics and audit.

Two concurrent HTTP requests (different JWTs) never share state. That is ALS isolation, **not** a hosted SaaS — see ADR 0003. Tests outside `runWithContext` fall back to a safe default.

#### 3. Tool Wrapper & Audit Hook (`src/utils/tool-wrapper.ts`)

`executeTool()` wraps every handler call:

1. Initialises the `AsyncLocalStorage` context.
2. For WRITE: stamps a stable `idempotency_key` on `args` (handler and audit share it).
3. If `writeRequiresConfirm` and `confirm !== true`, returns `needs_confirmation` (no Bit2Me call) and audits that outcome.
4. Otherwise runs the handler; audits WRITE on success or failure.
5. Clears per-request cache in `finally`.

#### 4. Audit Log (`src/utils/audit.ts`)

Audit entries are newline-delimited JSON objects written append-only. Each entry contains:

- `tool`, `args` (sanitised — no credentials), `outcome` (`success` / `error`), `correlationId`
- `sessionFingerprint`: SHA-256 of the session token (never the token itself)

Set `AUDIT_LOG_PATH` to persist to a dedicated file. If unset, the line is emitted via the logger with `audit: true`.

- **TypeScript files**: `.ts` extension
- **Test files**: `.test.ts` suffix
- **Use kebab-case** for file names (if needed)
- **Match directory structure** in tests

### Import Conventions

- **Use ES modules** (`import`/`export`)
- **Add `.js` extension** to imports (TypeScript requirement)
- **Group imports**: External → Internal → Types
- **Use type imports** when importing only types (`import type`)

---

## Adding a New Tool

To add a new tool to the MCP server, follow this comprehensive checklist to ensure consistency, quality, and proper documentation.

### 1. Metadata (`data/tools.json`)

`data/tools.json` is the catalogue and is **too large for the Cursor Read/StrReplace tools** (often ignored). Edit it with `python3` or the shell, then `pnpm build:docs`. Never re-indent the whole file.

Add the tool definition to the appropriate category in `data/tools.json`:

```json
{
    "name": "example_get_data",
    "description": "Get example data from the Bit2Me API",
    "type": "READ",
    "inputSchema": {
        "type": "object",
        "properties": {
            "id": { "type": "string", "description": "Resource ID" }
        },
        "required": ["id"]
    },
    "exampleArgs": { "id": "abc123" },
    "exampleResponse": { "id": "abc123", "value": "42" }
}
```

> **`type` field is required**: use `"READ"` for queries, `"WRITE"` for operations that mutate state (orders, withdrawals, deposits, …), and `"META"` for introspection tools. The `type` field drives the audit hook — only `WRITE` tools emit audit entries.

### 2. Implementation (`src/tools/`)

1. **Identify the category**: Choose an existing file (e.g., `wallet.ts`, `earn.ts`) or create a new one.
2. **Create/Update handler file**: Edit `src/tools/<category>.ts`.
3. **Implement the handler function**:

```typescript
// src/tools/example.ts
export async function handleExampleTool(name: string, args: Record<string, unknown>) {
    if (name === "example_get_data") {
        const id = String(args.id ?? "");
        const data = await bit2meRequest("GET", `/v1/example/${id}`);
        const optimized = mapExampleResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
}
```

**Conventions for write tools:**

- Accept optional `idempotency_key`. The tool wrapper stamps a stable key (UUID if omitted) and audit uses the same value. Sanitize before sending `Idempotency-Key`.
- Irreversible WRITE tools (not `broker_quote_*` proforma creation) must not put `confirm` in `required` or `exampleArgs`. Runtime returns `needs_confirmation` unless `confirm === true`. `broker_confirm_quote` is irreversible and follows the same preview.
- Use `decimal.js` for monetary arithmetic. Validate amounts with `validateAmount()` from `src/utils/format.ts` (implemented in `src/utils/amount.ts`). Validate date ranges with `validateDateRange()`.

### 3. Registry (`src/tools/registry.ts`)

Register the handler so the declarative registry can dispatch it:

Existing categories (`general`, `broker`, `wallet`, `earn`, `loan`, `pro`) are registered once via `registerCategory(...)` in `src/tools/registry.ts`. A new tool in an **existing** category only needs its handler `if (name === "...")` branch — the JSON catalogue is listed automatically.

If you add a **new category**, register it:

```typescript
registerCategory("example", exampleTools, handleExampleTool as ToolHandler);
```

Do not add an `if/else` chain in `index.ts`. `tests/regression.test.ts` checks that every `data/tools.json` name matches the registry (modulo injected `jwt`).

### 4. Response Mapping (`src/utils/`)

1. **Define Schema**: Add the TypeScript interface in `src/utils/schemas.ts`.
2. **Create Mapper**: Add the mapper function in `src/utils/response-mappers.ts`.

```typescript
// src/utils/schemas.ts
export interface ExampleResponse {
    id: string;
    value: string;
    created_at: string;
}

// src/utils/response-mappers.ts
export function mapExampleResponse(raw: unknown): ExampleResponse {
    if (!isValidObject(raw)) throw new ValidationError("Invalid response");
    return {
        id: String(raw["id"] ?? ""),
        value: String(raw["val"] ?? raw["value"] ?? "0"),
        created_at: String(raw["createdAt"] ?? ""),
    };
}
```

### 5. Testing (`tests/`)

1. **Mapper Tests**: Add test cases in `tests/mappers.test.ts`.
2. **Tool Tests**: Create `tests/tools/example.test.ts`.
3. **Registry regression**: `tests/regression.test.ts` verifies every `data/tools.json` name matches the in-memory registry. No edit needed there when you only add a tool to an existing category.
4. **Concurrency**: If your tool stores per-request state, add a test in `tests/concurrency.test.ts` verifying that two concurrent invocations do not bleed state.

```typescript
// tests/tools/example.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleExampleTool } from "../../src/tools/example.js";
import { bit2meRequest } from "../../src/services/bit2me.js";

vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.js", () => ({ getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }) }));

describe("Example Tools", () => {
    it("should handle example_get_data", async () => {
        vi.mocked(bit2meRequest).mockResolvedValue({ id: "123", val: "test" });
        const result = await handleExampleTool("example_get_data", { id: "123" });
        const content = JSON.parse(result.content[0].text);
        expect(content.id).toBe("123");
    });
});
```

### 6. Documentation

1. **TOOLS_DOCUMENTATION.md**: Auto-generated from `data/tools.json` — run `pnpm build:docs` after editing the metadata.
2. **README.md**: Update category counts in "Available Tools & API Endpoints" if a new category is introduced or a count changes.
3. **Landing catalogue**: `pnpm build:docs` regenerates `landing/tools-data.js`. Do not edit that file by hand. HTML/CSS/`CNAME` in `landing/` are maintained separately.

### 7. Verification

1. Run `pnpm test` — the zero-diff registry regression test will catch missing registry entries.
2. Run `pnpm build` — TypeScript strict mode (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) will catch type errors in your mapper.
3. (Optional) Inspector: `pnpm dev` (web UI) or
   `pnpm dlx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list`.

---

## Also see

- Commands, coverage gate, local-only branches: [`docs/stack/tooling.md`](./docs/stack/tooling.md)
- How we publish / OIDC / landing after release: [`docs/stack/release.md`](./docs/stack/release.md)
- Threat model: [`docs/adr/0003-local-single-user-threat-model.md`](./docs/adr/0003-local-single-user-threat-model.md)
- Dependabot: `.github/dependabot.yml` (`chore(deps):` — no npm publish). Always commit `pnpm-lock.yaml`.
- Hooks: Husky + lint-staged + commitlint. `pnpm install` runs `prepare`.
- Tests fail? Mock `getConfig()`, set `INCLUDE_RAW_RESPONSE: false`, run `pnpm test`.

## Quick Reference

### Important Files

- `.releaserc.json` - Semantic Release configuration
- `.github/workflows/release.yml` - Release workflow
- `data/tools.json` - **Source of truth** for all tool definitions (metadata, schemas, examples)
- `src/tools/registry.ts` - Declarative tool registry (O(1) dispatch)
- `src/utils/context.ts` - AsyncLocalStorage request context
- `src/utils/tool-wrapper.ts` - executeTool() wrapper with audit hook
- `src/utils/write-guards.ts` - confirm preview + writeRequiresConfirm
- `src/utils/amount.ts` - `validateAmount()` (re-exported from `format.ts`)
- `src/utils/format.ts` - Shared validators (validateDateRange, re-exports amount)
- `docs/README.md` - Canonical documentation map
- `docs/stack/release.md` - How we publish (npm + tag, not package.json on main)
- `docs/adr/0003-local-single-user-threat-model.md` - Threat model
- `src/utils/response-mappers.ts` - API response mappers (do **not** grow this file)
- `src/utils/schemas.ts` - TypeScript interfaces
- `package.json` - Dependencies and scripts
- `.commitlintrc.json` - Commit message validation

### Critical Rules Summary

1. ✅ **Always use Conventional Commits**
2. ✅ **Only `feat:` / `fix:` / `perf:` trigger releases**
3. ✅ **Map all API responses** to optimized schemas
4. ✅ **Mock `getConfig()` in tests**
5. ✅ **Node.js 20+** to run the server; Release CI uses **Node 24** (OIDC)
6. ✅ **Published version** = npm + git tag — not `package.json` on `main`
7. ✅ **Always commit `pnpm-lock.yaml`**
8. ✅ **Use snake_case** for API response fields
9. ✅ **Provide defaults** for all mapper fields
10. ✅ **Test before committing** (hooks run automatically)
11. ✅ **Use `decimal.js`** for all monetary arithmetic — no plain JS `number` for money
12. ✅ **Validate amounts** with `validateAmount()` (`src/utils/amount.ts`, re-exported from `format.ts`)
13. ✅ **Write tools**: stable `idempotency_key` (wrapper stamps if omitted); irreversible WRITE returns `needs_confirmation` unless `confirm === true`
14. ✅ **Register via `registerCategory`** in `src/tools/registry.ts` — do not add `if/else` dispatch in `index.ts`
15. ✅ **TypeScript strict** — `exactOptionalPropertyTypes` globally; `noUncheckedIndexedAccess` in production builds
16. ✅ **File size**: new files in `src/` / `tests/` / `scripts/` ≤200 lines. Do not grow `pro.ts`, `broker.ts`, `format.ts`, `bit2me.ts`, `response-mappers.ts`, `http.ts` — extract a sibling.
17. ✅ **`data/tools.json`**: Python/shell only, then `pnpm build:docs`. Initiative logs (`docs/done-tasks/`) are history, not the spec.

---

**Last Updated**: 2026-08-30
**Maintainer**: Follow these rules to ensure consistent repository management
