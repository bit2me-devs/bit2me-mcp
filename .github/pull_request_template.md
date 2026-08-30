## Description

<!-- Provide a brief description of your changes -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Code refactor
- [ ] 🎨 Style/formatting update

## Related Issues

<!-- Link to related issues, e.g., "Fixes #123" or "Closes #456" -->

## Changes Made

<!-- Provide a detailed list of changes -->

-
-
-

## Commit Convention Checklist

- [ ] I have followed the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- [ ] My commit messages are in **English**.

## Testing

<!-- Describe the testing you've done -->

- [ ] All existing tests pass (`pnpm test`)
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## Checklist

<!-- Mark completed items with an 'x' -->

- [ ] ✅ Code builds successfully (`pnpm run build`)
- [ ] ✅ All tests pass (`pnpm test`)
- [ ] ✅ Lint passes (`pnpm lint`)
- [ ] ✅ Code formatted (`pnpm run lint:fix`)
- [ ] 📖 Documentation updated (if needed). Tool changes: `data/tools.json` (Python/shell) + `endpoints.js` + `pnpm build:docs` (commit `TOOLS_DOCUMENTATION.md` only). Count/prompt changes: README + `landing/index.html`
- [ ] 🚫 Did not bump `package.json`, edit `/CHANGELOG.md`, or commit `landing/tools-data.js` / `llms*.txt`
- [ ] 🔒 No sensitive data exposed
- [ ] ♿ Accessibility considered (landing HTML only; N/A for the MCP server)

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Additional Notes

<!-- Any additional information that reviewers should know -->
