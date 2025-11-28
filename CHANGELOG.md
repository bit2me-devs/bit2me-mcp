## [1.6.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.6.0...v1.6.1) (2025-11-28)

### Bug Fixes

- resolve high severity security alerts ([fcaa6f0](https://github.com/bit2me-devs/bit2me-mcp/commit/fcaa6f07ae0d4535c79ddf3b730055ca47c4f0f5))

# [1.6.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.5.0...v1.6.0) (2025-11-28)

### Features

- add robots.txt to landing page ([f13294b](https://github.com/bit2me-devs/bit2me-mcp/commit/f13294bb0a6182bff892d7e763b721a787dd43e1))

# [1.5.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.4.1...v1.5.0) (2025-11-28)

### Features

- implement automatic generation of llms.txt and llms-full.txt ([9b95992](https://github.com/bit2me-devs/bit2me-mcp/commit/9b959924d235ef440c11704be4286c782f015fa8))

## [1.4.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.4.0...v1.4.1) (2025-11-27)

### Bug Fixes

- resolver alertas de CodeQL security scanning ([dc432e7](https://github.com/bit2me-devs/bit2me-mcp/commit/dc432e769c7373e3981b6b541b734717bf7d1b31))

# [1.4.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.3.1...v1.4.0) (2025-11-27)

### Features

- add Google Analytics to landing page ([ec61650](https://github.com/bit2me-devs/bit2me-mcp/commit/ec616502fcf21206b45f2b2becd4c8e416353af4))

## [1.3.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.3.0...v1.3.1) (2025-11-27)

### Bug Fixes

- reorganize imports in wallet.ts to match export order ([969cf5b](https://github.com/bit2me-devs/bit2me-mcp/commit/969cf5b9562a84753c516f0ddf627b3e12b1b7f3))

# [1.3.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.2.0...v1.3.0) (2025-11-27)

### Bug Fixes

- remove deprecated husky lines ([545c3eb](https://github.com/bit2me-devs/bit2me-mcp/commit/545c3eba36fbe3d2bf4577b66479f083961f2730))
- remove currency parameter from wallet_get_pockets ([0c74d73](https://github.com/bit2me-devs/bit2me-mcp/commit/0c74d73b6b967e14bf7375ae46fb83ca5e515585))

### Features

- update tools, mappers and documentation ([34af228](https://github.com/bit2me-devs/bit2me-mcp/commit/34af228ca9acfeb0f6b33c77b7c26f23aaccbe02))

# [1.2.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.1.1...v1.2.0) (2025-11-27)

### Bug Fixes

- add config mock to wallet tests ([84048b4](https://github.com/bit2me-devs/bit2me-mcp/commit/84048b49d24e74200803429edfb254372445b707))
- configure npm registry authentication before semantic-release ([15fe81f](https://github.com/bit2me-devs/bit2me-mcp/commit/15fe81f8bebe146c5bbec932333b36694bf4adb0))
- configure semantic-release workflow with proper credentials ([235d49c](https://github.com/bit2me-devs/bit2me-mcp/commit/235d49c0bda41e08b5c7bb1ea651f6502e8e1e6d))
- correct wallet address mapper and add pocket details mapper ([b392a69](https://github.com/bit2me-devs/bit2me-mcp/commit/b392a6968a80d6f59c76e0e3936088a2bf2fd016))
- improve npm token verification in release workflow ([1e89869](https://github.com/bit2me-devs/bit2me-mcp/commit/1e89869d850c8e2c307102c624a53e5e9e0a2071))
- improve semantic-release configuration ([88ea71c](https://github.com/bit2me-devs/bit2me-mcp/commit/88ea71c4ff0b0e753f6806ded20a9532097af6f0))
- **landing:** update github link in sidebar ([d11afe1](https://github.com/bit2me-devs/bit2me-mcp/commit/d11afe1d52e5cc66d5c18151726c45fe7ef7cae2))
- remove workaround from semantic-release workflow ([0043544](https://github.com/bit2me-devs/bit2me-mcp/commit/00435447f72dd6986215b175f078de4c6e256a5c))
- resolve all eslint warnings and improve type safety ([823d262](https://github.com/bit2me-devs/bit2me-mcp/commit/823d26293d5dda49a2f5b3eb8ef7351aed5005a0))
- update Node.js version to 22 for semantic-release compatibility ([f78f88f](https://github.com/bit2me-devs/bit2me-mcp/commit/f78f88f2b292290abc5910dfdfeffc5e013e0e56))

### Features

- add optional raw_response support in mapped responses ([623413b](https://github.com/bit2me-devs/bit2me-mcp/commit/623413b5b69cbd7629ea96e1f3aae381d5bfb871))
- improve landing page and git hooks management ([bbb1364](https://github.com/bit2me-devs/bit2me-mcp/commit/bbb1364b5d3bff5ca8ad8809dedb8da30493787c))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2025-11-26

### Added

- **Landing Page Improvements**:
    - New "Prerequisites" section explaining how to obtain API Keys.
    - Tabbed installation instructions for **Claude Desktop**, **Cursor IDE**, **Windsurf**, **Gemini CLI**, and **VS Code**.
    - Detailed `mcp_config.json` examples for each platform.
    - Explicit warning about Cursor's environment variable limitations (requires `.env` file).

### Fixed

- **Documentation Accuracy**:
    - Corrected total tool count from 48 to **47** in both `landing/index.html` and `README.md`.
    - Updated tool breakdown list in `README.md` to match the actual implementation (8 Market, 7 Wallet, 11 Earn, 9 Loan, 10 Pro, 1 Account, 1 Aggregation).

## [1.1.1] - 2025-11-26

### Fixed

- Added missing `repository` field to `package.json` for NPM metadata.

## [1.1.0] - 2025-11-26

### Added

- **Landing Page Enhancements**:
    - Predictive search with suggestions and auto-scroll.
    - New "Tools Reference" section name (previously API Reference).
    - Added "Parameters & Validation" and "Server & Maintenance" troubleshooting guides.
    - Improved JSON example indentation and visualization.
    - Updated footer links (GitHub, Bit2Me Website, API Docs).
- **Documentation**:
    - Added GitHub repository button with logo in Hero section.
    - Updated all repository references to `bit2me-devs/bit2me-mcp`.

### Changed

- **Code Refactoring**:
    - Flattened `src/tools` directory structure (removed `assets`, `market`, `aggregation` subfolders).
    - Moved `schemas.ts` from `src/types/` to `src/utils/`.
    - Updated import paths across the project to reflect new structure.
- **Tool Logic**:
    - Unified return types in tool handlers (replaced `null` returns with explicit Errors for MCP SDK compatibility).

### Fixed

- Corrected argument definitions in landing page examples for `wallet_create_proforma`, `earn_create_transaction`, `loan_get_ltv`, and others.
- Fixed build errors related to strict type checking in tool handlers.
- Resolved test import path issues after directory restructuring.

### Added (Previous)

- Complete mapper coverage (47/47 tools with optimized responses)
- TypeScript strict mode enforcement
- ESLint configuration with TypeScript rules
- Prettier code formatting
- Pre-commit hooks with Husky
- Comprehensive CI/CD workflows
- Code quality badges in README
- Barrel exports for utilities
- Pull request template
- Dependabot configuration
- Semantic release automation
- Code coverage reporting

### Changed

- Consolidated API service layer (merged `api.ts` and `auth.ts` into `services/bit2me.ts`)
- Internationalized all code comments and documentation to English
- Enhanced error handling with custom error classes
- Improved logging with structured logger and data sanitization
- Updated deployment workflow with pre-deployment validation

### Fixed

- Missing mapper for `pro_get_order_details` tool
- Exponential backoff implementation with configurable limits
- Rate limit handling with proper retry logic

### Security

- Sanitized sensitive data in logs (API keys, signatures)
- Strict TypeScript type checking
- Input validation with type guards on all mappers

---

## [1.0.0] - 2025-11-25

### Added

- Initial release of Bit2Me MCP Server
- 47 tools across 8 categories:
    - 8 Market tools (public data)
    - 7 Wallet tools (private)
    - 12 Earn/Staking tools
    - 11 Loan tools
    - 8 Pro Trading tools
    - 1 Account tool
    - 1 Portfolio aggregation tool
    - 11 Operation tools (write actions)
- Automatic retry mechanism for rate-limited requests
- Exponential backoff with jitter
- Comprehensive test suite (31 tests)
- Documentation:
    - Complete README with all 47 tools
    - SCHEMA_MAPPING.md with JSON examples
    - TypeScript schema coverage documentation
    - Product marketing documentation
- Landing page with GitHub Pages deployment
- Environment-based configuration
- MCP SDK integration

### Security

- Secure API authentication with signature generation
- Environment variable validation with Zod
- No hardcoded credentials

---

## Release Notes

### Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

### Automated Releases

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release).
Version bumps are determined by commit message conventions.

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `docs:` - Documentation changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `perf:` - Performance improvements (patch version bump)
- `test:` - Test changes (no version bump)
- `chore:` - Build/dependency changes (no version bump)
- `ci:` - CI/CD changes (no version bump)

Add `BREAKING CHANGE:` in commit body for major version bumps.

---

## [Links]

- [Repository](https://github.com/bit2me-devs/bit2me-mcp)
- [Issues](https://github.com/bit2me-devs/bit2me-mcp/issues)
- [Pull Requests](https://github.com/bit2me-devs/bit2me-mcp/pulls)
- [Releases](https://github.com/bit2me-devs/bit2me-mcp/releases)
