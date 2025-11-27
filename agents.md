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

### Mocking Rules

- **Always mock** `getConfig()` in tests
- **Set `INCLUDE_RAW_RESPONSE: false`** by default in test mocks
- **Mock external API calls** (Bit2Me API)
- **Use fixtures** for consistent test data (`tests/fixtures.ts`)

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
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
    - Node.js: 20

2. **Release** (`.github/workflows/release.yml`)
    - Runs on: Push to `main`
    - Steps: Build, Test, Semantic Release
    - Node.js: 22 (required for Semantic Release)
    - **Critical**: Requires `NPM_TOKEN` secret

3. **Deploy** (`.github/workflows/deploy.yml`)
    - Runs on: Push to `main`
    - Deploys landing page to GitHub Pages
    - Node.js: 20

### Release Workflow Steps

1. Checkout with `fetch-depth: 0` (needed for Semantic Release)
2. Setup Node.js 22 with npm cache
3. Install dependencies (`npm ci`)
4. Build (`npm run build`)
5. Test (`npm test`)
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
├── config.ts              # Environment configuration
├── constants.ts           # Constants and enums
├── index.ts              # Main entry point
├── services/
│   └── bit2me.ts        # Bit2Me API client
├── tools/                # MCP tool handlers
│   ├── account.ts
│   ├── aggregation.ts
│   ├── earn.ts
│   ├── loan.ts
│   ├── market.ts
│   ├── pro.ts
│   └── wallet.ts
└── utils/
    ├── errors.ts         # Custom error classes
    ├── logger.ts         # Logging utilities
    ├── response-mappers.ts  # API response mappers
    └── schemas.ts        # TypeScript interfaces
```

### File Naming

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

- **`package-lock.json`**: Always commit changes
- **Never ignore** lock file
- **Use `npm ci`** in CI (not `npm install`)

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
4. **Run locally**: `npm test` to debug

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

1. **Husky not installed**: Run `npm install` (triggers `prepare` script)
2. **Commitlint error**: Fix commit message format
3. **Lint-staged error**: Fix linting/formatting issues

---

## Adding a New Tool

To add a new tool to the MCP server, follow this comprehensive checklist to ensure consistency, quality, and proper documentation.

### 1. Implementation (`src/tools/`)

1.  **Identify the category**: Choose an existing category (e.g., `wallet`, `market`, `earn`) or create a new one if necessary.
2.  **Create/Update file**: Edit `src/tools/<category>.ts`.
3.  **Define Tool Definition**: Add the tool definition to the `tools` array.
4.  **Implement Handler**: Add the logic to the `handle<Category>Tool` function.

```typescript
// src/tools/example.ts

export const exampleTools: Tool[] = [
    {
        name: "example_get_data",
        description: "Get example data from Bit2Me API",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Resource ID" },
            },
            required: ["id"],
        },
    },
];

export async function handleExampleTool(name: string, args: any) {
    if (name === "example_get_data") {
        const { id } = args;
        const data = await bit2meRequest("GET", `/v1/example/${id}`);
        const optimized = mapExampleResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
}
```

### 2. Response Mapping (`src/utils/`)

1.  **Define Schema**: Add the TypeScript interface in `src/utils/schemas.ts`.
2.  **Create Mapper**: Add the mapper function in `src/utils/response-mappers.ts`.

```typescript
// src/utils/schemas.ts
export interface ExampleResponse {
    id: string;
    value: string;
    created_at: string;
}

// src/utils/response-mappers.ts
export function mapExampleResponse(raw: any): ExampleResponse {
    if (!isValidObject(raw)) throw new ValidationError("Invalid response");

    return {
        id: raw.id || "",
        value: raw.val || raw.value || "0",
        created_at: raw.createdAt || "",
    };
}
```

### 3. Registration (`src/index.ts`)

1.  **Import**: Import the tools array and handler.
2.  **List Tools**: Add `...exampleTools` to `ListToolsRequestSchema`.
3.  **Handle Call**: Add the handler condition to `CallToolRequestSchema`.

```typescript
// src/index.ts
import { exampleTools, handleExampleTool } from "./tools/example.js";

// ... inside ListToolsRequestSchema
tools: [
    // ...
    ...exampleTools,
];

// ... inside CallToolRequestSchema
if (exampleTools.find((t) => t.name === name)) {
    return await handleExampleTool(name, args);
}
```

### 4. Testing (`tests/`)

1.  **Mapper Tests**: Add test cases in `tests/mappers.test.ts`.
2.  **Tool Tests**: Create `tests/tools/example.test.ts`.

```typescript
// tests/tools/example.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleExampleTool } from "../../src/tools/example.js";
import { bit2meRequest } from "../../src/services/bit2me.js";

vi.mock("../../src/services/bit2me.js");

describe("Example Tools", () => {
    it("should handle example_get_data", async () => {
        vi.mocked(bit2meRequest).mockResolvedValue({ id: "123", val: "test" });

        const result = await handleExampleTool("example_get_data", { id: "123" });
        const content = JSON.parse(result.content[0].text);

        expect(content.id).toBe("123");
    });
});
```

### 5. Documentation

1.  **SCHEMA_MAPPING.md**: Add the JSON response example.
2.  **README.md**: Add the tool to the list of available tools.
3.  **Landing Page**: Update `landing/index.html` if it lists features/tools.
4.  **Product Documentation**: Update `docs/PRODUCT.md` (if applicable).
5.  **Schema Coverage**: Update `docs/TYPESCRIPT_SCHEMA_COVERAGE.md` to map the new tool to its TypeScript interface.

### 6. Verification

1.  Run `npm test` to ensure all tests pass.
2.  Run `npm run build` to verify TypeScript compilation.
3.  (Optional) Run the server locally and test with a client.

---

## Quick Reference

### Common Commands

```bash
# Development
npm run build          # Build TypeScript
npm run dev            # Run server
npm test               # Run tests
npm run test:watch     # Watch mode
npm run lint           # Lint code
npm run eslint:fix     # Fix linting issues

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
- `src/utils/response-mappers.ts` - API response mappers
- `src/utils/schemas.ts` - TypeScript interfaces
- `package.json` - Dependencies and scripts
- `.commitlintrc.json` - Commit message validation

### Critical Rules Summary

1. ✅ **Always use Conventional Commits**
2. ✅ **Only `feat:` and `fix:` trigger releases**
3. ✅ **Map all API responses** to optimized schemas
4. ✅ **Mock `getConfig()` in tests**
5. ✅ **Node.js 22+ required** for Semantic Release
6. ✅ **NPM_TOKEN must be Automation/Publish type**
7. ✅ **Always commit `package-lock.json`**
8. ✅ **Use snake_case** for API response fields
9. ✅ **Provide defaults** for all mapper fields
10. ✅ **Test before committing** (hooks run automatically)

---

**Last Updated**: Based on repository state as of latest changes
**Maintainer**: Follow these rules to ensure consistent repository management
