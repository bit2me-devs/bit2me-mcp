# Contributing to Bit2Me MCP Server

Thank you for your interest in contributing to the Bit2Me MCP Server! We welcome contributions from the community to make this project better.

This document provides guidelines and instructions for contributing to the project.

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

Please be respectful, inclusive, and constructive in all interactions. We are committed to providing a welcoming experience for everyone.

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
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
    npm install
    ```

4.  **Install Husky hooks** (should happen automatically, but if not):

    ```bash
    npm run prepare
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

- **`main`**: The production-ready code. Do not push directly to `main`.
- **Feature Branches**: Create a new branch for each feature or fix.

    ```bash
    # For new features
    git checkout -b feat/my-new-feature

    # For bug fixes
    git checkout -b fix/bug-description
    ```

### Commit Conventions

We strictly follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification. This is enforced by `commitlint` hooks.

**Format:** `<type>(<scope>): <subject>`

**Types:**

- `feat`: A new feature (triggers MINOR version bump)
- `fix`: A bug fix (triggers PATCH version bump)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation
- `ci`: Changes to our CI configuration files and scripts

**Examples:**

```bash
git commit -m "feat(wallet): add new balance check tool"
git commit -m "fix(api): handle rate limit errors correctly"
git commit -m "docs: update CONTRIBUTING.md"
```

### Language Policy

- **Commit Messages**: MUST be in **English**.
- **Code Comments**: MUST be in **English**.
- **Documentation**: MUST be in **English**.

## Testing

We use **Vitest** for testing. We aim for high test coverage (>95%).

- **Run all tests:**

    ```bash
    npm test
    ```

- **Run tests in watch mode (TDD):**

    ```bash
    npm run test:watch
    ```

- **Run with coverage report:**

    ```bash
    npm run test:coverage
    ```

**Note:** Please ensure all tests pass before pushing your changes.

## Code Quality & Security

Our strict pre-commit hooks will automatically run:

1.  **Linting**: `ESLint` for code quality.
2.  **Formatting**: `Prettier` for code style.
3.  **Testing**: Run related unit tests.
4.  **Security Audit**: `npm audit` (on package changes) to check for vulnerabilities.
5.  **Secret Scanning**: `gitleaks` (if installed) to prevent committing API keys.

**Manual Commands:**

- Check for linting errors: `npm run lint`
- Fix linting/formatting: `npm run lint:fix`
- Build the project: `npm run build`

## Tool Metadata Management

This project uses a centralized metadata system for all tool definitions. The source of truth is `data/tools.json`, which contains all tool definitions including:

- Tool names, descriptions, and types (READ/WRITE/META)
- Input schemas (parameters and their types)
- Example arguments and responses
- Category information

### Adding or Modifying Tools

1. **Edit `data/tools.json`**: Add or modify the tool definition in the appropriate category.
2. **Update TypeScript handlers**: Modify the corresponding handler function in `src/tools/*.ts` if needed.
3. **Regenerate derived assets**: Run `npm run build:docs` to regenerate:
    - `landing/tools-data.js` (used by the landing page)
    - `TOOLS_DOCUMENTATION.md` (tool documentation with descriptions, endpoints and response schemas)
4. **Update backend**: The backend automatically uses the metadata from `data/tools.json` via `src/utils/tool-metadata.ts`.

### Important Notes

- **Never edit generated files manually**: `landing/tools-data.js` is auto-generated. Always edit `data/tools.json` and run `npm run build:docs`.
- **Keep examples up to date**: When modifying tool responses, update the `exampleResponse` in `data/tools.json`.
- **Test your changes**: After modifying metadata, run `npm run build:docs` and verify the generated files are correct.

## Pull Request Process

1.  **Update Documentation**: If your change affects how a tool works, update `data/tools.json` and run `npm run build:docs` to regenerate documentation.
2.  **Update Changelog**: Significant changes should be noted.
3.  **Push to your fork**:

    ```bash
    git push origin feat/my-new-feature
    ```

4.  **Open a Pull Request**:
    - Target the `main` branch.
    - Fill out the PR template completely.
    - Link related issues (e.g., `Closes #123`).
5.  **Code Review**: A maintainer will review your code. Be open to feedback!
6.  **Merge**: Once approved and CI passes, your code will be merged.

Thank you for contributing! 🚀
