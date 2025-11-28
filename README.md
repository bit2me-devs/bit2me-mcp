# Bit2Me MCP Server

[![CI](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml)
[![Deploy](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml)
[![NPM Version](https://img.shields.io/npm/v/@bit2me/mcp-server?style=flat-square&color=0075FF&labelColor=slate-900)](https://www.npmjs.com/package/@bit2me/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/bit2me-devs/bit2me-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/bit2me-devs/bit2me-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server to interact with the [Bit2Me](https://bit2me.com/) ecosystem. This server allows AI assistants like Claude to access real-time market data, manage wallets, execute trading operations, and query products like Earn and Loans.

For more information, visit: **[https://mcp.bit2me.com](https://mcp.bit2me.com)**

**Bit2Me** is a leading cryptocurrency exchange based in Spain, offering a wide range of services including trading, staking (Earn), and loans. This MCP server acts as a bridge, enabling LLMs to perform actions and retrieve data securely from your Bit2Me account.

## 🚀 Features

- **Market Data**: Real-time prices, historical charts, order books, and asset listings.
- **Wallet Management**: Query balances, transactions, and wallet (Pockets) details.
- **Pro Trading**: Manage orders (Limit, Market, Stop), query open orders, and transfer funds between Wallet and Pro.
- **Earn & Loans**: Manage Earn (Staking) strategies and collateralized loans.
- **Aggregation**: Total portfolio valuation unifying all products.
- **Operations**: Execute trades, transfers, and withdrawals securely.

## 🛠️ Available Tools & API Endpoints

The server provides **47 tools** organized into categories:

- 8 Market Tools
- 7 Wallet Tools
- 11 Earn Tools
- 9 Loan Tools
- 10 Pro Trading Tools
- 1 Account Tool
- 1 Aggregation Tool
- 11 Operation Tools (these perform actions and are also listed under their respective categories)

_Note: Operation tools are included in the categories above._

Below is a detailed list of tools and the Bit2Me API endpoints they use.

### 📊 Market Tools (Public Data)

| Tool                       | Endpoint                          | Description                                                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `market_get_ticker`        | `GET /v3/currency/ticker/:symbol` | Gets current price, 24h volume, market highs and lows for a cryptocurrency. Specify symbol (e.g., BTC) and optional base currency (default: EUR). Returns price, volume, market cap, and supply information.                                                                              |
| `market_get_chart`         | `GET /v3/currency/chart`          | Gets price history (candles/chart) with timestamp, USD price, and Fiat price. Requires ticker pair (e.g., BTC/EUR) and timeframe (one-hour, one-day, one-week, one-month, one-year). Returns last 30 data points with dates and prices in both USD and the fiat currency from the ticker. |
| `market_get_assets`        | `GET /v2/currency/assets`         | Gets all available assets (cryptocurrencies) supported by Bit2Me. Returns symbol, name, asset type, network, trading status, and supported pairs. Use this to discover available currencies before trading or checking prices.                                                            |
| `market_get_asset_details` | `GET /v2/currency/assets/:symbol` | Gets detailed information of a specific asset by its symbol. Returns asset type, network, trading status, loan availability, and supported trading pairs. Use this to verify if an asset is tradeable or loanable before operations.                                                      |
| `market_get_order_book`    | `GET /v2/trading/order-book`      | Gets the order book (market depth) for a market showing current buy and sell orders. Returns bids (buy orders) and asks (sell orders) with prices and amounts. Useful for analyzing market liquidity and determining optimal order prices.                                                |
| `market_get_public_trades` | `GET /v1/trading/trade/last`      | Gets the latest public trades (executed orders) for a market. Returns recent transactions with price, amount, side (buy/sell), and timestamp. Optional limit (max 100) and sort order (ASC/DESC). Useful for seeing recent market activity.                                               |
| `market_get_config`        | `GET /v1/trading/market-config`   | Gets market configuration including precision (decimal places), minimum/maximum amounts, and trading status. Optional symbol filter for a specific market. Use this before placing orders to ensure amounts meet requirements.                                                            |
| `market_get_candles`       | `GET /v1/trading/candle`          | Gets OHLCV (Open, High, Low, Close, Volume) candles for Trading Pro. Returns price data in specified timeframe (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M). Optional limit to control number of candles. Essential for technical analysis and charting.                                        |

### 💼 Wallet Tools (Private)

| Tool                             | Endpoint                         | Description                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallet_get_pockets`             | `GET /v1/wallet/pocket`          | Gets balances, UUIDs, and available funds from Simple Wallet (Broker). Does not include Pro/Earn balance. Returns all pockets of the user. Multiple pockets can exist for the same currency. After getting the response, filter by the 'currency' field client-side if needed. Look for pockets with meaningful names or non-zero balances to identify the active one. |
| `wallet_get_pocket_details`      | `GET /v1/wallet/pocket`          | Gets detailed information of a specific wallet (Pocket) by its ID. Returns balance, available funds, blocked funds, currency, name, and creation date. Use wallet_get_pockets first to get the pocket ID.                                                                                                                                                              |
| `wallet_get_transactions`        | `GET /v2/wallet/transaction`     | History of past Wallet operations (deposits, withdrawals, swaps, purchases). Optional currency filter. Use limit and offset for pagination (default limit: 10). Returns transaction list with type, amount, currency, status, and timestamp.                                                                                                                           |
| `wallet_get_pocket_addresses`    | `GET /v2/wallet/pocket/...`      | Lists deposit addresses for a wallet (Pocket) on a specific network. Use wallet_get_networks first to see available networks for a currency. Each network may have different addresses. Returns address, network, and creation date. Use this address to receive deposits on the specified network.                                                                    |
| `wallet_get_networks`            | `GET /v1/wallet/currency/...`    | Lists available networks for a specific currency. Use this before wallet_get_pocket_addresses to see which networks support deposits for a currency (e.g., bitcoin, ethereum, binanceSmartChain). Returns network ID, name, native currency, fee currency, and whether it requires a tag/memo.                                                                         |
| `wallet_get_transaction_details` | `GET /v1/wallet/transaction/:id` | Gets detailed information of a specific transaction by its ID. Returns complete transaction data including type, amount, currency, status, fees, timestamps, and related pocket IDs. Use wallet_get_transactions first to get transaction IDs.                                                                                                                         |

### 💰 Earn (Staking) Tools

| Tool                              | Endpoint                                   | Description                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `earn_get_summary`                | `GET /v1/earn/summary`                     | View summary of accumulated rewards in Staking/Earn. Returns total rewards earned across all Earn wallets, breakdown by currency, and overall performance. Use this to see your total staking rewards.                                |
| `earn_get_wallets`                | `GET /v2/earn/wallets`                     | List active Earn wallets/strategies with their current APY (Annual Percentage Yield). Returns wallet ID, currency, balance, APY, and status. Use this to see available staking options and their returns before depositing.           |
| `earn_get_wallet_details`         | `GET /v1/earn/wallets/:id`                 | Get detailed information of a specific Earn wallet. Returns balance, APY, total rewards, status, and configuration. Use earn_get_wallets first to get the wallet ID.                                                                  |
| `earn_get_transactions`           | `GET /v1/earn/wallets/:id/movements`       | Get transaction history (movements) of an Earn wallet. Returns deposits, withdrawals, and reward payments with amounts, dates, and status. Optional limit and offset for pagination. Use earn_get_wallets first to get the wallet ID. |
| `earn_get_transactions_summary`   | `GET /v1/earn/movements/:type/summary`     | Get summary statistics of Earn movements filtered by type (DEPOSIT, WITHDRAWAL, etc.). Returns total count, total amounts, and aggregated data for the specified movement type across all Earn wallets.                               |
| `earn_get_assets`                 | `GET /v2/earn/assets`                      | Get list of assets (cryptocurrencies) supported in Earn/Staking. Returns available currencies with their staking options. Use this to discover which assets can be staked before creating Earn transactions.                          |
| `earn_get_apy`                    | `GET /v2/earn/apy`                         | Get current APY (Annual Percentage Yield) rates for all Earn/Staking options. Returns APY percentages per asset and strategy. Use this to compare returns before choosing where to stake your assets.                                 |
| `earn_get_rewards_config`         | `GET /v1/earn/wallets/rewards/config`      | Get global rewards configuration for Earn/Staking. Returns reward calculation rules, distribution schedules, and general staking parameters. Use this to understand how rewards are calculated.                                       |
| `earn_get_wallet_rewards_config`  | `GET /v1/earn/wallets/:id/rewards/config`  | Get rewards configuration for a specific Earn wallet. Returns reward calculation rules, APY details, and wallet-specific staking parameters. Use earn_get_wallets first to get the wallet ID.                                         |
| `earn_get_wallet_rewards_summary` | `GET /v1/earn/wallets/:id/rewards/summary` | Get rewards summary for a specific Earn wallet. Returns total rewards earned, pending rewards, reward history, and performance metrics. Use earn_get_wallets first to get the wallet ID.                                              |

### 🏦 Loan Tools

| Tool                     | Endpoint                              | Description                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loan_get_active`        | `GET /v1/loan/orders`                 | View all active loans. Returns list of current loans with guarantee amounts, loan amounts, LTV ratios, currencies, and status. Use this to monitor your active loan positions.                                                                                                                                                 |
| `loan_get_ltv`           | `GET /v1/loan/ltv`                    | Calculate LTV (Loan To Value) ratio for a loan scenario. LTV represents the loan amount as a percentage of the guarantee value. Lower LTV means lower risk. Provide either guaranteeAmount or loanAmount (the other will be calculated). Returns LTV percentage and risk level. Use this before loan_create to plan your loan. |
| `loan_get_config`        | `GET /v1/loan/currency/configuration` | Get currency configuration for loans including supported guarantee currencies, loan currencies, LTV limits, interest rates, and requirements. Use this before creating a loan to understand available options and limits.                                                                                                      |
| `loan_get_transactions`  | `GET /v1/loan/movements`              | Get loan transaction history (movements) including payments, interest accruals, and guarantee changes. Optional orderId filter to see movements for a specific loan. Use limit and offset for pagination.                                                                                                                      |
| `loan_get_orders`        | `GET /v1/loan/orders`                 | Get all loan orders (both active and closed) for the user. Returns loans with guarantee amounts, loan amounts, LTV ratios, currencies, status, and dates. Optional limit and offset for pagination.                                                                                                                            |
| `loan_get_order_details` | `GET /v1/loan/orders/:id`             | Get detailed information of a specific loan order. Returns guarantee amount, loan amount, LTV, interest rate, status, creation date, and payment history. Use loan_get_active or loan_get_orders first to get the order ID.                                                                                                    |

### 📈 Pro Trading Tools

| Tool                    | Endpoint                           | Description                                                                                                                                                                                                                                       |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pro_get_balance`       | `GET /v1/trading/wallet/balance`   | Gets balances from PRO Trading account. This is separate from Simple Wallet - funds must be transferred using pro_deposit/pro_withdraw. Returns available and blocked balances per currency for trading.                                          |
| `pro_get_open_orders`   | `GET /v1/trading/order`            | View open trading orders in PRO. Returns all active orders (pending, partially filled). Optional symbol filter to see orders for a specific market. Use this to monitor order status after pro_create_order.                                      |
| `pro_get_transactions`  | `GET /v1/trading/trade`            | Gets the user's trade history in Pro Trading. Returns executed trades with price, amount, side (buy/sell), fees, and timestamp. Optional filters: symbol, limit, offset, and sort order (ASC/DESC). Use this to review past trading activity.     |
| `pro_get_order_trades`  | `GET /v1/trading/order/:id/trades` | Gets all individual trades (executions) associated with a specific order. Returns detailed execution data including price, amount, fees, and timestamp for each fill. Useful for analyzing how a large order was executed across multiple trades. |
| `pro_get_order_details` | `GET /v1/trading/order/:id`        | Gets detailed information of a specific Pro order. Returns order type, symbol, side, amount, price, status, filled amount, creation time, and execution details. Use pro_get_open_orders or pro_get_transactions first to get the order ID.       |

### 👤 Account Tools

| Tool               | Endpoint          | Description                                                                                                                                                                                               |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `account_get_info` | `GET /v1/account` | View user account information including profile details, verification levels, account status, and user settings. Returns account metadata useful for understanding account capabilities and restrictions. |

### 📊 Aggregation Tools

| Tool                      | Endpoint   | Description                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `portfolio_get_valuation` | `GET /...` | Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat currency (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations. Filters out dust amounts below minimum threshold. |

### ⚡ Operations (Write Actions)

| Tool                         | Endpoint                                      | Description                                                                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wallet_create_proforma`     | `POST /v1/wallet/transaction/proforma`        | **Step 1**: Simulates/Quotes an operation in Simple Wallet. Returns Proforma ID and cost. REQUIRES subsequent confirmation.                                                                                                                                                                |
| `wallet_confirm_transaction` | `POST /v1/wallet/transaction`                 | **Step 2**: Executes the operation using the Proforma ID. Final action.                                                                                                                                                                                                                    |
| `pro_create_order`           | `POST /v1/trading/order`                      | Create Limit/Market/Stop order in PRO Trading. Returns order ID. For Limit orders, 'price' is required. For Stop-Limit orders, both 'price' and 'stopPrice' are required. Market orders execute immediately at current price. Use pro_get_open_orders to check order status.               |
| `pro_cancel_order`           | `DELETE /v1/trading/order/:id`                | Cancel a specific PRO order by ID. Only open/pending orders can be cancelled. Returns cancellation status. Use pro_get_open_orders first to see which orders can be cancelled.                                                                                                             |
| `pro_cancel_all_orders`      | `DELETE /v1/trading/order`                    | Cancel all open orders in Pro Trading. Optional symbol filter to cancel only orders for a specific market. Returns count of cancelled orders. Use with caution as this affects all pending orders.                                                                                         |
| `pro_deposit`                | `POST /v1/trading/wallet/deposit`             | Deposit funds from Simple Wallet to Pro Trading account. Funds must be available in Simple Wallet first (check with wallet_get_pockets). Transfer is immediate. Use pro_get_balance to verify the deposit.                                                                                 |
| `pro_withdraw`               | `POST /v1/trading/wallet/withdraw`            | Withdraw funds from Pro Trading account back to Simple Wallet. Funds must be available in Pro Trading (check with pro_get_balance). Transfer is immediate. Use wallet_get_pockets to verify the withdrawal.                                                                                |
| `earn_create_transaction`    | `POST /v1/wallet/earn/movements`              | Create deposit or withdrawal in Earn (Staking). For deposits, funds move from Simple Wallet pocket to Earn. For withdrawals, funds return from Earn to the specified pocket. Returns transaction details with status. Use earn_get_wallets to see available Earn strategies first.         |
| `loan_create`                | `POST /v1/loan/orders`                        | Create a new loan by providing cryptocurrency as guarantee (collateral) to receive fiat currency. The guarantee amount determines the maximum loan amount based on LTV (Loan To Value) ratio. Use loan_get_ltv first to calculate optimal amounts. Returns loan order details with status. |
| `loan_increase_guarantee`    | `POST /v1/loan/orders/:id/guarantee/increase` | Increase the guarantee (collateral) amount for an existing loan. This improves the LTV ratio and reduces risk. Returns updated loan details. Use loan_get_active first to get the order ID.                                                                                                |
| `loan_payback`               | `POST /v1/loan/orders/:id/payback`            | Pay back (return) part or all of a loan. Reduces the loan amount and may release guarantee if fully paid. Returns updated loan details. Use loan_get_active first to get the order ID and check current loan amount.                                                                       |

## 📋 Response Schemas

All tool responses are **optimized for LLM consumption** with clean, consistent structures. We provide comprehensive documentation of response formats:

### 📖 Documentation Files

- **[SCHEMA_MAPPING.md](./SCHEMA_MAPPING.md)** - Complete JSON response examples for all 47 tools

### Key Features

- ✅ **Consistent naming**: All fields use `snake_case` for better LLM readability
- ✅ **Flattened structures**: Removed unnecessary nesting from API responses
- ✅ **Filtered data**: Zero balances and irrelevant fields are removed
- ✅ **Type-safe**: Full TypeScript interfaces in `src/utils/schemas.ts`
- ✅ **Well-documented**: Every tool has a concrete JSON example

### Example

Instead of raw API responses like:

```json
{
    "data": [
        {
            "orderId": "...",
            "guaranteeCurrency": "BTC",
            "loanCurrency": "EUR"
        }
    ]
}
```

You get optimized responses like:

```json
[
    {
        "order_id": "...",
        "guarantee_currency": "BTC",
        "loan_currency": "EUR"
    }
]
```

See [SCHEMA_MAPPING.md](./SCHEMA_MAPPING.md) for complete examples of all 47 tool responses.

## ⚙️ Installation and Configuration

### Prerequisites

- **Node.js**: v18 or higher.
- **Bit2Me Account**: You need a verified Bit2Me account.

### 🔑 Generating API Keys

1. Go to your **[Bit2Me API Dashboard](https://app.bit2me.com/profile/api)**.
2. Click on **"New Key"**.
3. Select the permissions you need (e.g., Wallets, Trading, Earn, Loans).
    > **⚠️ Security Note:** This MCP server does **NOT** support crypto withdrawals to external blockchain addresses or transfers to other users. For security best practices, please **DO NOT** enable "Withdrawal" permissions on your API Key. Internal transfers between your own Bit2Me wallets (Wallet ↔ Pro ↔ Earn) are fully supported.

### Steps

1. **Clone the repository:**

    ```bash
    git clone https://github.com/bit2me-devs/bit2me-mcp.git
    cd bit2me-mcp
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and add your keys:

    ```env
    BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
    BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET

    # Optional Configuration
    BIT2ME_REQUEST_TIMEOUT=30000     # Request timeout in ms (default: 30000)
    BIT2ME_MAX_RETRIES=3             # Max retries for rate limits (default: 3)
    BIT2ME_RETRY_BASE_DELAY=1000     # Base delay for backoff in ms (default: 1000)
    BIT2ME_LOG_LEVEL=info            # Log level: debug, info, warn, error (default: info)
    ```

4. **Build the project:**
    ```bash
    npm run build
    ```

## 🖥️ Usage with Claude Desktop

To use this server with the Claude Desktop application, add the following configuration to your `claude_desktop_config.json` file:

### MacOS

`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows

`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
    "mcpServers": {
        "bit2me": {
            "command": "node",
            "args": ["/absolute/path/to/bit2me-mcp/build/index.js"],
            "env": {
                "BIT2ME_API_KEY": "YOUR_BIT2ME_ACCOUNT_API_KEY",
                "BIT2ME_API_SECRET": "YOUR_BIT2ME_ACCOUNT_API_SECRET"
            }
        }
    }
}
```

> **Note:** Replace `/absolute/path/to/...` with the actual full path to your project.

## 🛡️ Security

### Security Policy

For detailed information about reporting vulnerabilities and our security policy, please see [SECURITY.md](./SECURITY.md).

### Best Practices

- **API Keys**: Never commit API keys to version control.
- **Permissions**: Use minimal permissions. Avoid "Withdrawal" permissions for MCP usage.
- **Logging**: The server automatically sanitizes sensitive data in logs.

## ⚠️ Rate Limits & Error Handling

The Bit2Me API enforces rate limits to ensure stability.

- **429 Too Many Requests**: If the server hits a rate limit, it will **automatically retry** the request after a 1-second delay (up to 3 retries).
- **Console Warnings**: You may see warnings in the logs if rate limits are hit.
- **Best Practice**: Avoid asking for massive amounts of data in a very short loop.
- **Exponential Backoff**: The server now uses exponential backoff with jitter for retries to handle rate limits more gracefully.

## 📊 Logging

The server implements a structured logging system that automatically sanitizes sensitive data (API keys, signatures).
You can control the verbosity using the `BIT2ME_LOG_LEVEL` environment variable:

- `debug`: Detailed request/response logs (useful for development)
- `info`: Startup and operational events (default)
- `warn`: Rate limits and non-critical issues
- `error`: API errors and failures

## ❓ Troubleshooting

### Error: "Connection refused"

- Ensure the MCP server is running.
- Check that the path in `claude_desktop_config.json` points correctly to the `build/index.js` file.

### Error: "API Key invalid" or "Unauthorized"

- Verify your keys in `.env` or the Claude config.
- Ensure your API keys have the necessary permissions (Wallet, Trade, Earn, etc.) enabled in the Bit2Me dashboard.
- Check that there are no extra spaces or quotes around the API key values.

### Error: "Rate limit exceeded" or 429 responses

- The Bit2Me API has rate limits. The server automatically retries with exponential backoff.
- If you're hitting rate limits frequently, reduce the number of concurrent requests.
- Consider adding delays between operations in your workflows.

### Tools not showing up in Claude

- Restart Claude Desktop completely (quit and reopen).
- Check the Claude Desktop logs for initialization errors.
- Verify the configuration file syntax is valid JSON.

### Error: "Request timeout"

- Check your internet connection.
- Increase `BIT2ME_REQUEST_TIMEOUT` in your environment variables (default: 30000ms).
- Some Bit2Me API endpoints may be temporarily slow.

### Environment variables not loading

- When using `npx`, environment variables must be set in the config file's `env` section.
- For local development, ensure the `.env` file is in the project root.
- The server prioritizes config-provided credentials over `.env` file values.

### Error: "Network error" or CORS issues

- The MCP server runs server-side and doesn't have CORS restrictions.
- Network errors usually indicate connectivity problems or API downtime.
- Check the Bit2Me status page or try again later.

### Debugging

- Run the server manually to see logs:
    ```bash
    npm run dev
    ```
- Set `BIT2ME_LOG_LEVEL=debug` for detailed logging.
- Check Claude Desktop logs:
    - macOS: `~/Library/Logs/Claude/mcp*.log`
    - Windows: `%APPDATA%\Claude\logs\mcp*.log`

## 🔍 Testing with MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official debugging tool for MCP servers. It provides a web interface to test your tools, view responses, and debug issues.

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Running the Inspector

You have two options to run the inspector:

#### Option A: Using NPM Package (Recommended)

Use the published package from npm - no build required:

```bash
export BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
export BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET
npx -y @modelcontextprotocol/inspector npx @bit2me/mcp-server
```

#### Option B: Using Local Repository

For development or testing unreleased changes:

```bash
# 1. Clone and build the project
git clone https://github.com/bit2me-devs/bit2me-mcp.git
cd bit2me-mcp
npm install
npm run build

# 2. Run the inspector
export BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
export BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET
npx @modelcontextprotocol/inspector node build/index.js
```

**Note:** The inspector will automatically open at `http://localhost:5173`

### Using the Inspector

The web interface provides:

1. **Tools Tab:**
    - View all 47 available tools
    - See input schemas for each tool
    - Test tools with custom parameters
    - View formatted responses

2. **Resources Tab:**
    - Explore available resources (if any)

3. **Prompts Tab:**
    - Test prompt templates (if configured)

4. **Request/Response Logs:**
    - See all MCP protocol messages
    - Debug communication issues
    - View timing information

### Example: Testing a Tool

1. Navigate to the **Tools** tab
2. Select a tool (e.g., `market_get_ticker`)
3. Fill in the required parameters:
    ```json
    {
        "symbol": "BTC",
        "currency": "EUR"
    }
    ```
4. Click **Run** to execute the tool
5. View the formatted response in the output panel

## 🧪 Testing & Coverage

This project maintains **97% line coverage** with a focus on test quality over metrics.

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

### Coverage Philosophy

We intentionally maintain 97% coverage rather than pursuing 100%. This pragmatic approach is based on industry best practices:

> **Martin Fowler**: _"I would be suspicious of anything like 100% - it would smell of someone writing tests to make the coverage numbers happy."_

**What's Covered ✅**:

- All authentication flows and API request signing
- All error handling (HTTP errors, rate limiting, retries)
- All data validation and transformations
- All business logic (trading, wallets, Earn, Loans)
- All 47 MCP tool endpoints

**What's NOT Covered (3%) ⚠️**:

- Debug log messages within already-tested error paths
- Defensive defaults for unlikely API edge cases
- Alternative error formats that don't occur in practice

**140 tests** ensure critical paths work correctly. See `/tests` for details.

## 🛠️ Development

- **Check logs in terminal:** All server logs appear in the terminal where you started the inspector
- **Verify credentials:** Ensure API keys are set correctly
- **Test market tools first:** Use public tools like `market_get_ticker` to verify basic functionality
- **Compare responses:** Use Inspector to compare raw API responses vs. mapped responses

### Inspector vs Claude Desktop

| Feature       | Inspector           | Claude Desktop |
| ------------- | ------------------- | -------------- |
| **Purpose**   | Testing & debugging | Production use |
| **Interface** | Web UI              | Chat interface |
| **Testing**   | Individual tools    | Conversational |
| **Logs**      | Visible in terminal | Hidden         |
| **Best for**  | Development         | End users      |

### Common Inspector Use Cases

✅ **Verify tool configuration** before deploying to Claude  
✅ **Test authentication** with Bit2Me API  
✅ **Debug response mappings** and schemas  
✅ **Validate input parameters** for each tool  
✅ **Check error handling** with invalid inputs

## 🧪 Testing

The project includes a comprehensive test suite using Vitest.

```bash
npm test
```

Tests cover authentication, tool functionality, and rate limit handling using mocked responses.

## 🌐 Landing Page Deployment

The project's landing page is located in the `/landing` directory.
Deployment is automated using GitHub Actions.

**How to update the website:**

1. Edit the HTML/CSS files in `/landing`.
2. Push your changes to the `main` branch.
3. The `.github/workflows/deploy.yml` action will automatically publish the changes.

**Domain:**
The `/landing/CNAME` file manages the custom domain configuration.

## 🤝 Contributing

We welcome contributions to improve this MCP server! Whether it's fixing bugs, adding new tools, or improving documentation, your help is appreciated.

### Getting Started

1. **Fork the repository** to your own GitHub account.
2. **Clone your fork** locally:
    ```bash
    git clone https://github.com/bit2me-devs/bit2me-mcp.git
    cd bit2me-mcp
    ```
3. **Install dependencies:**
    ```bash
    npm install
    ```
4. **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-feature
    # or
    git checkout -b fix/bug-description
    ```

### Development Workflow

1. **Make your changes** following our coding standards
2. **Write or update tests** for your changes
3. **Run the test suite:**
    ```bash
    npm test              # Run all tests
    npm run test:watch    # Run tests in watch mode
    npm run test:coverage # Generate coverage report
    ```
4. **Ensure code quality:**
    ```bash
    npm run build         # TypeScript compilation
    npm run lint          # Type checking
    npm run eslint        # Linting
    npm run lint:fix      # Auto-format code with Prettier
    ```
5. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
    ```bash
    git commit -m "feat: add new market analysis tool"
    git commit -m "fix: resolve rate limit handling issue"
    git commit -m "docs: update API endpoint documentation"
    ```

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features (triggers minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semi-colons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes
- `ci:` - CI/CD configuration changes

**For breaking changes**, add `BREAKING CHANGE:` in the commit body or append `!` after the type:

```bash
git commit -m "feat!: redesign authentication flow

BREAKING CHANGE: API key format has changed"
```

### Code Quality Standards

**All contributions must:**

- ✅ Pass all tests (`npm test`)
- ✅ Pass TypeScript compilation (`npm run build`)
- ✅ Pass linting (`npm run eslint`)
- ✅ Be properly formatted (`npm run lint:fix`)
- ✅ Include tests for new features
- ✅ Update documentation as needed
- ✅ Follow existing code style and patterns

**Pre-commit hooks will automatically:**

- Run type checking
- Run all tests
- Lint your code
- Scan for secrets (if Gitleaks is installed)
- Audit dependencies for vulnerabilities (on package changes)

If any check fails, the commit will be blocked. Fix the issues and try again.

### Pull Request Process

1. **Update documentation** if you've changed APIs or added features
2. **Update CHANGELOG.md** in the "Unreleased" section (if significant change)
3. **Push to your branch:**
    ```bash
    git push origin feature/amazing-feature
    ```
4. **Open a Pull Request** to the `main` branch
5. **Fill out the PR template** completely
6. **Wait for review** - A maintainer will review your PR
7. **Address feedback** if any changes are requested
8. **Celebrate** when your PR is merged! 🎉

### What to Contribute

**Good first issues:**

- 🐛 Bug fixes
- 📝 Documentation improvements
- ✨ New test cases
- 🎨 Code formatting and style improvements

**More involved contributions:**

- 🚀 New MCP tools
- ⚡ Performance optimizations
- 🔐 Security enhancements
- 🧪 Test coverage improvements

**Before starting major work:**

- 💬 Open an issue to discuss your idea
- 📣 Get feedback from maintainers
- 🎯 Ensure it aligns with project goals

### Questions or Issues?

- 🐛 **Found a bug?** [Open an issue](https://github.com/bit2me-devs/bit2me-mcp/issues/new)
- 💡 **Have an idea?** [Start a discussion](https://github.com/bit2me-devs/bit2me-mcp/discussions)
- ❓ **Need help?** Check existing [issues](https://github.com/bit2me-devs/bit2me-mcp/issues) and [discussions](https://github.com/bit2me-devs/bit2me-mcp/discussions)

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build together.

## 📄 License

[MIT License](./LICENSE)
