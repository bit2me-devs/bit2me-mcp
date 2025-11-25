# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
