# Agent Rules for Bit2Me MCP Server Repository

This document contains all the rules, conventions, and practices learned for managing this repository.

## 📋 Table of Contents

1. [Commit Conventions](#commit-conventions)
2. [Versioning & Releases](#versioning--releases)
3. [API Response Mapping](#api-response-mapping)
4. [Testing](#testing)
5. [CI/CD Workflows](#cicd-workflows)
6. [NPM Publishing](#npm-publishing)
7. [Code Structure](#code-structure)
8. [Dependencies Management](#dependencies-management)
9. [Git Hooks](#git-hooks)
10. [Troubleshooting](#troubleshooting)

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

### Semantic Release Configuration

- **Automated versioning** via Semantic Release
- **Configuration file**: `.releaserc.json`
- **Release rules**: Defined in `releaseRules` array
- **Branches**: Only `main` branch triggers releases
- **Node.js version**: Requires Node.js 22+ (Semantic Release requirement)

### Release Process

1. Push commits with `feat:` or `fix:` to `main`
2. Semantic Release analyzes commits since last tag
3. Generates new version based on commit types
4. Updates `CHANGELOG.md` and `package.json`
5. Creates Git tag (e.g., `v1.2.0`)
6. Publishes to NPM
7. Creates GitHub release

### Version Bump Rules

- **Major** (1.0.0 → 2.0.0): Breaking changes (requires `BREAKING CHANGE:` in commit body)
- **Minor** (1.1.0 → 1.2.0): New features (`feat:`)
- **Patch** (1.1.0 → 1.1.1): Bug fixes (`fix:`, `perf:`)

### Important Notes

- Commits `chore:`, `ci:`, `docs:` do NOT trigger releases
- Semantic Release only runs on `main` branch
- Last tag determines which commits are analyzed
- If no release-worthy commits, workflow completes without error

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
- **Documentation**: See `docs/RAW_RESPONSE_GUIDE.md`

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
- **Coverage target**: 97%+ (pragmatic approach)

### Test Files

- `tests/mappers.test.ts` - Response mapper tests
- `tests/tools/*.test.ts` - Tool handler tests
- `tests/config.test.ts` - Configuration tests
- `tests/auth.test.ts` - Authentication tests
- `tests/registry.test.ts` - Zero-diff registry regression: verifies that every tool in `data/tools.json` has a registered handler and that the tool list hasn't changed unexpectedly.
- `tests/concurrency.test.ts` - Verifies `AsyncLocalStorage` isolation: concurrent requests with different JWTs do not bleed state into each other.
- `tests/http-transport.test.ts` - Integration tests for the HTTP/SSE binary.

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

## CI/CD Workflows

### Workflows

1. **CI** (`.github/workflows/ci.yml`)
    - Runs on: Push to any branch, PRs
    - Steps: Lint, Test, Build
    - Node.js: ≥20 (Node 18 is no longer supported)

2. **Release** (`.github/workflows/release.yml`)
    - Runs on: Push to `main`
    - Steps: Build, Test, Semantic Release
    - Node.js: 22 (required for Semantic Release)
    - **Critical**: Requires `NPM_TOKEN` secret
    - Generates SBOM (CycloneDX format) and signs the release artifact with cosign keyless signing.
    - `prepublishOnly` runs the full validate pipeline before any npm publish.

3. **Deploy** (`.github/workflows/deploy.yml`)
    - Runs on: Push to `main`
    - Deploys landing page to GitHub Pages
    - Node.js: 20

4. **Security Audit** (`.github/workflows/audit.yml`)
    - Runs: Weekly schedule (cron)
    - Executes `pnpm audit` to surface new CVEs in the dependency tree.

### Release Workflow Steps

1. Checkout with `fetch-depth: 0` (needed for Semantic Release)
2. Setup Node.js 22 with pnpm cache
3. Install dependencies (`pnpm install --frozen-lockfile`)
4. Build (`pnpm build`)
5. Test (`pnpm test`)
6. Configure npm authentication (`.npmrc`)
7. Run Semantic Release

### Required Secrets

- **`NPM_TOKEN`**: NPM automation token (type: Automation or Publish)
- **`GITHUB_TOKEN`**: Auto-provided by GitHub Actions

---

## NPM Publishing

### Configuration

- **Package name**: `@bit2me/mcp-server`
- **Access**: Public (`publishConfig.access: "public"`)
- **Provenance**: Enabled (`publishConfig.provenance: true`)
- **Registry**: `https://registry.npmjs.org`

### NPM Token Requirements

- **Type**: Must be "Automation" or "Publish" (NOT "Read-only")
- **Scope access**: Must have access to `@bit2me` scope
- **Location**: GitHub Secrets → `NPM_TOKEN`
- **Expiration**: Set appropriate expiration (default: 90 days)

### Publishing Process

1. Semantic Release detects release-worthy commits
2. Updates version in `package.json`
3. Builds package (`prepublishOnly` hook)
4. Publishes to NPM registry
5. Creates Git tag
6. Creates GitHub release

### Troubleshooting NPM Publishing

- **Error: Invalid npm token**
    - Verify token type is "Automation" or "Publish"
    - Check token has `@bit2me` scope access
    - Verify token is not expired
    - Ensure `.npmrc` is configured in workflow

- **Error: Node version**
    - Semantic Release requires Node.js 22+
    - Update `node-version` in workflow to "22"

---

## Code Structure

### Directory Layout

```
src/
├── config.ts              # Environment configuration (validates HTTPS gateway, etc.)
├── constants.ts           # Constants and enums
├── index.ts               # Stdio entry point — registers tools via registry
├── index-http.ts          # HTTP/SSE entry point (`bit2me-mcp-http` binary)
├── prompts/
│   └── index.ts           # Parametrized prompts (analyze_portfolio, market_summary,
│                          #   tax_report, dca_plan, loan_health_check)
├── services/
│   └── bit2me.ts          # Bit2Me API client (nonce, signing, retry, circuit breaker)
├── tools/                 # MCP tool handlers
│   ├── broker.ts
│   ├── earn.ts
│   ├── general.ts
│   ├── loan.ts
│   ├── pro.ts
│   ├── registry.ts        # Declarative tool registry — O(1) dispatch, audit hook
│   └── wallet.ts
├── transport/             # HTTP/SSE transport layer
└── utils/
    ├── args.ts            # Argument parsing and validation helpers
    ├── audit.ts           # Append-only audit log writer
    ├── cache.ts           # In-memory cache (keyed by correlationId via memoizePerRequest)
    ├── circuit-breaker.ts # Circuit breaker for upstream Bit2Me API
    ├── context.ts         # AsyncLocalStorage request context (correlationId, jwt, toolName)
    ├── errors.ts          # Custom error classes (ValidationError, ApiError, …)
    ├── format.ts          # Shared validators: validateAmount(), validateDateRange(), etc.
    ├── health.ts          # Rich /health snapshot (cache, circuit-breaker, rate-limiter)
    ├── logger.ts          # Structured logger — stderr only, LOG_FORMAT=json support
    ├── metrics.ts         # Prometheus counters for /metrics endpoint
    ├── rate-limiter.ts    # Per-endpoint rate limiter with exponential backoff + jitter
    ├── response-mappers.ts# API response mappers (raw → typed schemas)
    ├── schemas.ts         # TypeScript interfaces for all tool responses
    ├── tool-metadata.ts   # Reads data/tools.json at startup; drives registry + docs
    ├── tool-wrapper.ts    # executeTool(): context init, audit emission, error handling
    └── request-cache.ts   # Per-request memoization (cleared in finally block)
```

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

Two concurrent requests — for example two different users in the HTTP transport — never share state. Tests that run outside a `runWithContext` boundary fall back to a safe default.

#### 3. Tool Wrapper & Audit Hook (`src/utils/tool-wrapper.ts`)

`executeTool()` wraps every handler call:

1. Initialises the `AsyncLocalStorage` context.
2. Calls the handler.
3. On completion (success **or** failure), emits an audit log entry if `type === "WRITE"`.
4. Clears per-request cache in the `finally` block so memory cannot grow unbounded.

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

## Dependencies Management

### Dependencies

- **Production**: Minimal, only runtime requirements
- **Dev**: Testing, linting, building tools
- **Update strategy**: Dependabot (weekly, grouped)

### Dependabot Configuration

- **Location**: `.github/dependabot.yml`
- **Schedule**: Weekly (Monday 09:00 Europe/Madrid)
- **Grouping**:
    - `dev-dependencies`: All dev deps together
    - `production-patches`: Production patches only
- **Commit prefix**: `chore(deps):` (doesn't trigger releases)

### Dependency Updates

- **Dependabot PRs**: Review and merge manually
- **Test locally** after merging dependency updates
- **Commit format**: `chore(deps): bump <package> from <old> to <new>`
- **No release** triggered by dependency updates

### Lock File

- **`pnpm-lock.yaml`**: Always commit changes
- **Never ignore** lock file
- **Use `pnpm install --frozen-lockfile`** in CI (not `pnpm install`)

---

## Git Hooks

### Husky Configuration

- **Location**: `.husky/` directory
- **Pre-commit**: Runs lint-staged
- **Commit-msg**: Validates commit format (commitlint)

### Lint-Staged Rules

- **`*.ts`**: ESLint fix → Prettier → Vitest related tests
- **`*.{css,html,json,md}`**: Prettier only
- **Runs automatically** on `git commit`

### Commitlint

- **Config**: `.commitlintrc.json`
- **Enforces**: Conventional Commits format
- **Blocks commits** that don't follow convention

---

## Troubleshooting

### Semantic Release Not Publishing

1. **Check Node.js version**: Must be 22+
2. **Verify NPM_TOKEN**: Type must be "Automation" or "Publish"
3. **Check commit types**: Only `feat:` and `fix:` trigger releases
4. **Verify last tag**: Semantic Release analyzes commits since last tag
5. **Check workflow logs**: Look for authentication errors

### Tests Failing

1. **Mock `getConfig()`**: Required in all test files
2. **Set `INCLUDE_RAW_RESPONSE: false`** in test mocks
3. **Check fixtures**: Ensure test data matches expected format
4. **Run locally**: `pnpm test` to debug

### Build Errors

1. **TypeScript errors**: Check `tsconfig.json` configuration
2. **Missing types**: Install `@types/*` packages
3. **Import errors**: Verify `.js` extensions in imports

### NPM Token Issues

1. **Token type**: Must be "Automation" or "Publish"
2. **Scope access**: Verify `@bit2me` scope permissions
3. **Expiration**: Check token hasn't expired
4. **Secret name**: Must be exactly `NPM_TOKEN` in GitHub Secrets

### Git Hook Failures

1. **Husky not installed**: Run `pnpm install` (triggers `prepare` script)
2. **Commitlint error**: Fix commit message format
3. **Lint-staged error**: Fix linting/formatting issues

---

## Adding a New Tool

To add a new tool to the MCP server, follow this comprehensive checklist to ensure consistency, quality, and proper documentation.

### 1. Metadata (`data/tools.json`)

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

- Accept and forward an optional `idempotency_key` argument. If the caller doesn't supply one, the tool wrapper auto-generates a UUID.
- Use `decimal.js` for any monetary arithmetic (balances, amounts, valuations). Never use plain JS `number` for money.
- Validate amount inputs with `validateAmount()` from `src/utils/format.ts` (enforces positive value and `MAX_AMOUNT = 1e12`). Validate date ranges with `validateDateRange()`.

### 3. Registry (`src/tools/registry.ts`)

Register the handler so the declarative registry can dispatch it:

```typescript
// src/tools/registry.ts
import { handleExampleTool } from "./example.js";

// Add to the registry map:
registry.set("example_get_data", handleExampleTool);
```

> **No manual list-tools wiring needed**: The registry reads tool definitions from `data/tools.json` at startup and exposes them automatically via `ListToolsRequestSchema`.

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
3. **Registry regression**: The zero-diff test in `tests/registry.test.ts` will automatically verify your new tool appears in the registry after you add it to `data/tools.json`. No changes needed there.
4. **Concurrency**: If your tool stores per-request state, add a test in `tests/concurrency.test.ts` verifying that two concurrent invocations do not bleed state.

```typescript
// tests/tools/example.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleExampleTool } from "../../src/tools/example.js";
import { bit2meRequest } from "../../src/services/bit2me.js";

vi.mock("../../src/services/bit2me.js");
vi.mock("../../src/config.ts", () => ({ getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }) }));

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
3. **Landing Page**: `landing/` is updated by a separate agent — do not touch it here.

### 7. Verification

1. Run `pnpm test` — the zero-diff registry regression test will catch missing registry entries.
2. Run `pnpm build` — TypeScript strict mode (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) will catch type errors in your mapper.
3. (Optional) Run the server locally with `pnpm dev` and test with MCP Inspector.

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm build          # Build TypeScript
pnpm dev            # Run server (stdio transport)
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm lint           # Lint code
pnpm eslint:fix     # Fix linting issues
pnpm build:docs     # Regenerate TOOLS_DOCUMENTATION.md + landing/tools-data.js from data/tools.json
pnpm typecheck      # TypeScript type-check without emitting (uses strict tsconfig)

# Git
git commit -m "feat: add new feature"  # Triggers release
git commit -m "fix: fix bug"            # Triggers patch release
git commit -m "chore: update deps"     # No release

# Release
# Automatic via Semantic Release on push to main
```

### Important Files

- `.releaserc.json` - Semantic Release configuration
- `.github/workflows/release.yml` - Release workflow
- `data/tools.json` - **Source of truth** for all tool definitions (metadata, schemas, examples)
- `src/tools/registry.ts` - Declarative tool registry (O(1) dispatch)
- `src/utils/context.ts` - AsyncLocalStorage request context
- `src/utils/tool-wrapper.ts` - executeTool() wrapper with audit hook
- `src/utils/format.ts` - Shared validators (validateAmount, validateDateRange)
- `src/utils/response-mappers.ts` - API response mappers
- `src/utils/schemas.ts` - TypeScript interfaces
- `package.json` - Dependencies and scripts
- `.commitlintrc.json` - Commit message validation

### Critical Rules Summary

1. ✅ **Always use Conventional Commits**
2. ✅ **Only `feat:` and `fix:` trigger releases**
3. ✅ **Map all API responses** to optimized schemas
4. ✅ **Mock `getConfig()` in tests**
5. ✅ **Node.js 20+ required** to run the server; Node.js 22+ for Semantic Release
6. ✅ **NPM_TOKEN must be Automation/Publish type**
7. ✅ **Always commit `pnpm-lock.yaml`**
8. ✅ **Use snake_case** for API response fields
9. ✅ **Provide defaults** for all mapper fields
10. ✅ **Test before committing** (hooks run automatically)
11. ✅ **Use `decimal.js`** for all monetary arithmetic — no plain JS `number` for money
12. ✅ **Validate amounts** with `validateAmount()` from `src/utils/format.ts`
13. ✅ **Add idempotency support** on write tools (`idempotency_key` arg; auto-generated if absent)
14. ✅ **Register in `src/tools/registry.ts`** — do not add manual `if/else` dispatch in `index.ts`
15. ✅ **TypeScript strict** — `exactOptionalPropertyTypes` globally; `noUncheckedIndexedAccess` in production builds

---

**Last Updated**: Based on repository state as of latest changes
**Maintainer**: Follow these rules to ensure consistent repository management
