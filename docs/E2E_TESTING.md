# E2E Testing Guide

This document explains how to run and maintain E2E (End-to-End) tests for the Bit2Me MCP Server.

## Why E2E Tests?

E2E tests validate that our MCP tools work correctly against the **real Bit2Me API**. Unlike unit tests that use mocks, E2E tests catch issues like:

- 🔴 **Wrong API endpoints** (e.g., using `/v2` instead of `/v1`)
- 🔴 **Changed request formats** (e.g., different body parameters)
- 🔴 **API breaking changes** from Bit2Me's side

## Running E2E Tests Locally

### Prerequisites

1. Valid Bit2Me API credentials
2. Sufficient balance for testing (some tests may create small transactions)

### Setup

Create a `.env` file in the project root:

```bash
BIT2ME_API_KEY=your_api_key_here
BIT2ME_API_SECRET=your_api_secret_here
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
RUN_E2E=true npx vitest run tests/e2e/wallet.e2e.test.ts
```

### Watch Mode

```bash
npm run test:e2e:watch
```

## Test Structure

```
tests/e2e/
├── setup.ts              # E2E configuration and helpers
├── wallet.e2e.test.ts    # Wallet operations
├── market.e2e.test.ts    # Market data
├── pro.e2e.test.ts       # Pro trading
├── earn.e2e.test.ts      # Earn/Staking
├── loan.e2e.test.ts      # Loans
├── portfolio.e2e.test.ts # Portfolio aggregation
└── account.e2e.test.ts   # Account info
```

## CI/CD Integration

### GitHub Actions

E2E tests run automatically on:
- ✅ **Push to main** - Validates changes before deployment
- ✅ **Pull requests** - Ensures PRs don't break API integration
- ✅ **Daily cron (6 AM UTC)** - Detects Bit2Me API changes

### Required Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add new repository secrets:
   - `BIT2ME_API_KEY` - Your Bit2Me API key
   - `BIT2ME_API_SECRET` - Your Bit2Me API secret

### Workflow File

See [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml)

## What E2E Tests Cover

### ✅ Read-Only Operations
Most tests are **read-only** and safe to run:
- Getting wallets, balances, transactions
- Fetching market data, prices, charts
- Retrieving loan configurations, APY rates

### ⚠️ Write Operations
Some tests create **real operations**:
- `wallet_create_proforma` - Creates transaction quotes (not executed)
- Pro trading order tests - **DISABLED** (would create real orders)
- Earn deposit/withdrawal - **DISABLED** (would move real funds)

> [!NOTE]
> Tests that would execute real financial operations are intentionally disabled to prevent accidental transactions. We only validate the API endpoints respond correctly.

## Troubleshooting

### Tests Fail with "Missing API credentials"

Ensure `BIT2ME_API_KEY` and `BIT2ME_API_SECRET` are set:
```bash
# Check if variables are set
echo $BIT2ME_API_KEY
echo $BIT2ME_API_SECRET

# Or source your .env file
source .env
npm run test:e2e
```

### Tests Timeout

E2E tests have a 10-second timeout. If tests consistently timeout:
1. Check your internet connection
2. Verify Bit2Me API is accessible
3. Check for API rate limits

### Specific Tool Fails

If one tool consistently fails:
1. **Check if Bit2Me changed the API** - Look at the error message
2. **Verify the endpoint** - Compare with [SCHEMA_MAPPING.md](../SCHEMA_MAPPING.md)
3. **Update the tool** - Fix the endpoint/parameters in `src/tools/`
4. **Update the test** - Ensure test expectations match new response format

## Daily Monitoring

The daily cron job helps detect issues:

- If E2E tests fail **without code changes**, Bit2Me likely changed their API
- GitHub Actions will **automatically create an issue** when scheduled tests fail
- Check the generated issue for details and fix the affected tools

## Best Practices

1. **Run E2E before pushing** - Catch issues early
2. **Don't commit credentials** - Use `.env` file (gitignored)
3. **Keep tests read-only** - Avoid real transactions when possible
4. **Update tests with API changes** - When Bit2Me updates, update tests too

## Example: Fixing a Failed E2E Test

If `wallet.e2e.test.ts` fails with "404 Not Found":

```bash
# 1. Run the specific test
RUN_E2E=true npx vitest run tests/e2e/wallet.e2e.test.ts

# 2. Check the error - might show:
#    "POST /v2/wallet/transaction/xxx/confirm" returned 404

# 3. Check Bit2Me docs or SCHEMA_MAPPING.md 
#    Maybe endpoint changed to /v1/wallet/transaction

# 4. Fix the tool
vim src/tools/wallet.ts
# Update the endpoint

# 5. Re-run E2E test
npm run test:e2e

# 6. Commit the fix
git add src/tools/wallet.ts
git commit -m "fix: update wallet confirmation endpoint to v1"
```

## Questions?

Check the main [README.md](../README.md) or open an issue.
