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

- **General**: Asset information, account details, and portfolio valuation.
- **Wallet Management**: Query balances, transactions, and wallet (Pockets) details.
- **Pro Trading**: Manage orders (Limit, Market, Stop), query open orders, and transfer funds between Wallet and Pro.
- **Earn & Loans**: Manage Earn (Staking) strategies and collateralized loans.
- **Operations**: Execute trades, transfers, and withdrawals securely.

## 🛠️ Available Tools & API Endpoints

The server provides **52 tools** organized into categories:

- 3 General Tools
- 7 Broker (Simple Trading) Tools
- 8 Wallet Tools
- 13 Earn Tools
- 8 Loan Tools
- 14 Pro (Advanced Trading) Tools

_Note: Operation tools (write actions) are included in their respective categories above._

_Note: Operation tools are included in the categories above._

Below is a detailed list of tools and the Bit2Me API endpoints they use.

### ℹ️ General

> **Note:** General information tools including asset details, account information, and portfolio valuation.

| Tool                      | Endpoint                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_assets_details`      | `GET /v2/currency/assets` or `/v2/currency/assets/:symbol` | Gets detailed information of assets (cryptocurrencies and fiat) supported by Bit2Me Wallet. If symbol is provided, returns details for that specific asset. If symbol is not provided, returns all available assets. Returns symbol, name, type, network (lowercase), trading status, loan availability, and supported pairs. Use this to discover available symbols or verify if a specific asset is tradeable or loanable before operations. |
| `account_get_info`        | `GET /v1/account`                                          | View user account information including profile details, verification levels, account status, and user settings. Returns account metadata useful for understanding account capabilities and restrictions.                                                                                                                                                                                                                                      |
| `portfolio_get_valuation` | Multiple endpoints                                         | Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat symbol (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations.                                                                                                                                                   |

### 💱 Broker (Simple Trading)

> **Note:** Tools for simple trading operations and broker prices. Includes market data (prices, charts) and trading actions (buy, sell, swap) for the Wallet/Broker service. These prices include spread and are different from Pro Trading prices.

| Tool               | Endpoint                          | Description                                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `broker_get_price` | `GET /v1/currency/rate`           | Get Wallet exchange rates for cryptocurrencies in a specific quote symbol and date. Returns the price of one unit of the base symbol in the requested quote symbol (default: USD) as used by the Wallet/Broker service. Optional base_symbol filter and date for historical rates. Response is a list of prices.           |
| `broker_get_info`  | `GET /v3/currency/ticker/:symbol` | Gets current Wallet price, 24h volume, market highs and lows for a cryptocurrency. These prices are used by the Wallet/Broker service (not Pro Trading). Specify base_symbol (e.g., BTC) and optional quote_symbol (default: EUR). Returns price, volume, market cap, and supply information. Response is a single object. |
| `broker_get_chart` | `GET /v3/currency/chart`          | Gets Wallet price history (candles/chart) with date and price in the quote symbol. These prices reflect the Wallet/Broker service, not Pro Trading. Requires pair (e.g., BTC-USD) and timeframe (1h, 1d, 1w, 1M, 1y). Returns data points with ISO 8601 date/time and price in the quote symbol from the pair.             |

### 💼 Wallet (Storage)

| Tool                          | Endpoint                         | Description                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wallet_get_pockets`          | `GET /v1/wallet/pocket`          | Gets balances, UUIDs, and available funds from Simple Wallet (Broker). Does not include Pro/Earn balance. Returns all pockets of the user. Multiple pockets can exist for the same symbol. After getting the response, filter by the 'symbol' field client-side if needed. Look for pockets with meaningful names or non-zero balances to identify the active one. |
| `wallet_get_pocket_details`   | `GET /v1/wallet/pocket`          | Gets detailed information of a specific wallet (Pocket) by its ID. Requires pocket_id. Returns balance, available funds, blocked funds, symbol, name, and creation date. Use wallet_get_pockets first to get the pocket ID.                                                                                                                                        |
| `wallet_get_movements`        | `GET /v2/wallet/transaction`     | History of past Wallet operations (deposits, withdrawals, swaps, purchases). Optional symbol filter. Use limit and offset for pagination (default limit: 10). Returns movement list with type, amount, symbol, status, and date. Response is a paginated list with metadata.                                                                                       |
| `wallet_get_pocket_addresses` | `GET /v2/wallet/pocket/...`      | Lists deposit addresses for a wallet (Pocket) on a specific network. Requires pocket_id and network. Use wallet_get_networks first to see available networks for a symbol. Each network may have different addresses. Returns address, network, and creation date. Use this address to receive deposits on the specified network.                                  |
| `wallet_get_networks`         | `GET /v1/wallet/currency/...`    | Lists available networks for a specific cryptocurrency. Requires symbol (e.g., BTC, ETH). Use this before wallet_get_pocket_addresses to see which networks support deposits for a symbol (e.g., bitcoin, ethereum, binanceSmartChain). Returns network ID, name, native symbol, fee symbol, and whether it requires a tag/memo.                                   |
| `wallet_get_movement_details` | `GET /v1/wallet/transaction/:id` | Gets detailed information of a specific movement by its ID. Requires movement_id. Returns complete movement data including type, amount, symbol, status, fees, and related pocket IDs. Use wallet_get_movements first to get movement IDs.                                                                                                                         |

### 💰 Earn (Staking) Tools

| Tool                                | Endpoint                                   | Description                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `earn_get_summary`                  | `GET /v1/earn/summary`                     | View summary of accumulated rewards in Staking/Earn. Returns total rewards earned across all Earn positions, breakdown by symbol, and overall performance. Use this to see your total staking rewards.                                                                                                                                                                 |
| `earn_get_positions`                | `GET /v2/earn/wallets`                     | List active Earn positions/strategies. Returns position_id, symbol, balance, strategy, and status. Use earn_get_apy to get APY rates for each symbol. Use this to see available staking options before depositing. Note: Positions represent money that is locked or generating yield (invested money), different from Pockets which represent liquid available funds. |
| `earn_get_position_details`         | `GET /v1/earn/wallets/:id`                 | Get detailed information of a specific Earn position. Requires position_id. Returns balance, strategy, status, configuration, and creation date. Use earn_get_positions first to get the position ID. Use earn_get_apy to get APY rates.                                                                                                                               |
| `earn_get_position_movements`       | `GET /v1/earn/wallets/:id/movements`       | Get movement history of a specific Earn position. Requires position_id. Returns deposits, withdrawals, and reward payments with amounts, dates, and status. Optional limit and offset for pagination. Use earn_get_positions first to get the position ID. Response is a paginated list with metadata.                                                                 |
| `earn_get_movements`                | `GET /v2/earn/movements`                   | Get movement history across all Earn positions. Returns deposits, withdrawals, rewards, and other movements with amounts, dates, rates, source, and issuer information. Supports filtering by symbol, position_id, type, date range, and pagination. All parameters are optional. Response is a paginated list with metadata.                                          |
| `earn_get_movements_summary`        | `GET /v1/earn/movements/:type/summary`     | Get summary statistics of Earn movements filtered by type (deposit, withdrawal, reward, discount-funds, discount-rewards). Returns total count, total amounts, and aggregated data for the specified movement type across all Earn positions.                                                                                                                          |
| `earn_get_assets`                   | `GET /v2/earn/assets`                      | Get list of assets (cryptocurrencies) supported in Earn/Staking. Returns list of cryptocurrency symbols with their staking options. Use this to discover which assets can be staked before creating Earn operations.                                                                                                                                                   |
| `earn_get_apy`                      | `GET /v2/earn/apy`                         | Get current APY (Annual Percentage Yield) rates for all Earn/Staking options. Returns APY percentages per asset and strategy. Use this to compare returns before choosing where to stake your assets.                                                                                                                                                                  |
| `earn_get_rewards_config`           | `GET /v1/earn/wallets/rewards/config`      | Get global rewards configuration for Earn/Staking. Returns reward calculation rules, distribution schedules, and general staking parameters. Use this to understand how rewards are calculated.                                                                                                                                                                        |
| `earn_get_position_rewards_config`  | `GET /v1/earn/wallets/:id/rewards/config`  | Get rewards configuration for a specific Earn position. Returns reward calculation rules, APY details, and position-specific staking parameters. Use earn_get_positions first to get the position ID.                                                                                                                                                                  |
| `earn_get_position_rewards_summary` | `GET /v1/earn/wallets/:id/rewards/summary` | Get rewards summary for a specific Earn position. Returns total rewards earned, pending rewards, reward history, and performance metrics. Use earn_get_positions first to get the position ID.                                                                                                                                                                         |

### 🏦 Loan Tools

| Tool                     | Endpoint                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loan_get_simulation`    | `GET /v1/loan/ltv`                    | Simulate a loan scenario to calculate LTV (Loan To Value) ratio and APR. Requires guarantee_symbol, loan_symbol, and user_symbol. LTV represents the loan amount as a ratio of the guarantee value (1.0 = 100%). Lower LTV means lower risk. Provide either guarantee_amount or loan_amount (the other will be calculated). Returns guarantee and loan amounts (original and converted), LTV ratio, APR, and user currency. Use this before loan_create to plan your loan. |
| `loan_get_config`        | `GET /v1/loan/currency/configuration` | Get symbol configuration for loans including supported guarantee symbols, loan symbols, LTV limits, interest rates, and requirements. Returns symbol for each asset. Use this before creating a loan to understand available options and limits.                                                                                                                                                                                                                           |
| `loan_get_movements`     | `GET /v1/loan/movements`              | Get loan movement history including payments, interest accruals, and guarantee changes. Optional order_id filter to see movements for a specific loan. Use limit and offset for pagination. Response is a paginated list with metadata.                                                                                                                                                                                                                                    |
| `loan_get_orders`        | `GET /v1/loan/orders`                 | Get all loan orders (both active and closed) for the user. Returns basic loan information: id, status, guarantee and loan amounts, symbols, and creation date. Use loan_get_order_details for complete information including LTV, APR, and liquidation price. Optional limit and offset for pagination.                                                                                                                                                                    |
| `loan_get_order_details` | `GET /v1/loan/orders/:id`             | Get detailed information of a specific loan order. Requires order_id. Returns complete loan details including guarantee amount, loan amount, remaining amount, LTV, APR, liquidation price, status, creation date, expiration date, and APR details. Use loan_get_orders first to get the order ID.                                                                                                                                                                        |

### 📈 Pro Trading Tools

| Tool                    | Endpoint                           | Description                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pro_get_balance`       | `GET /v1/trading/wallet/balance`   | Gets balances from PRO Trading account. This is separate from Simple Wallet - funds must be transferred using pro_deposit/pro_withdraw. Returns available and blocked balances per symbol for trading.                                                                                                                                       |
| `pro_get_open_orders`   | `GET /v1/trading/order`            | View open trading orders in PRO. Returns all active orders (pending, partially filled) with creation date and timestamp. Optional pair filter to see orders for a specific market. Use this to monitor order status after pro_create_order.                                                                                                  |
| `pro_get_trades`        | `GET /v1/trading/trade`            | Gets the user's trade history in Pro Trading. Returns executed trades with price, amount, side (buy/sell), fees, timestamp, and date. Optional filters: trading pair, side, order type, date range, limit (max 50), offset, and sort order (ASC/DESC). Use this to review past trading activity. Response is a paginated list with metadata. |
| `pro_get_order_trades`  | `GET /v1/trading/order/:id/trades` | Gets all individual trades (executions) associated with a specific order. Requires order_id. Returns detailed execution data including price, amount, fees, timestamp, and date for each fill. Useful for analyzing how a large order was executed across multiple trades.                                                                   |
| `pro_get_order_details` | `GET /v1/trading/order/:id`        | Gets detailed information of a specific Pro order. Requires order_id. Returns order type, trading pair, side, amount, price, status, filled amount, creation date, creation timestamp, and execution details. Use pro_get_open_orders or pro_get_trades first to get the order ID.                                                           |
| `pro_get_market_config` | `GET /v1/trading/market-config`    | Gets market configuration including precision (decimal places), minimum/maximum amounts, and trading status. Optional pair filter for a specific market. Use this before placing orders to ensure amounts meet requirements. Response is a list of configurations.                                                                           |
| `pro_get_order_book`    | `GET /v2/trading/order-book`       | Gets the order book (market depth) for a market showing current buy and sell orders. Requires trading pair (e.g., BTC-USD). Returns bids (buy orders) and asks (sell orders) with prices and amounts. Useful for analyzing market liquidity and determining optimal order prices. Response is a single object.                               |
| `pro_get_public_trades` | `GET /v1/trading/trade/last`       | Gets the latest public trades (executed orders) for a market. Requires trading pair (e.g., BTC-USD). Returns recent transactions with price, amount, side (buy/sell), and date. Optional limit (max 100) and sort order (ASC/DESC). Useful for seeing recent market activity. Response is a list of trades with metadata.                    |
| `pro_get_candles`       | `GET /v1/trading/candle`           | Gets OHLCV (Open, High, Low, Close, Volume) candles for Pro (Advanced Trading). Requires trading pair (e.g., BTC-USD) and timeframe (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M). Optional limit to control number of candles. Essential for technical analysis and charting. Response is a list of candles with metadata.                         |

### 👤 Account Tools

| Tool               | Endpoint          | Description                                                                                                                                                                                               |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `account_get_info` | `GET /v1/account` | View user account information including profile details, verification levels, account status, and user settings. Returns account metadata useful for understanding account capabilities and restrictions. |

### 📊 Aggregation Tools

| Tool                      | Endpoint   | Description                                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio_get_valuation` | `GET /...` | Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat symbol (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations. Filters out dust amounts below minimum threshold. |

### ⚡ Broker Operations (Write Actions)

| Tool                   | Endpoint                               | Description                                                                                                                                                                                                |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `broker_quote_buy`     | `POST /v1/wallet/transaction/proforma` | **Step 1**: Buy cryptocurrency using fiat balance from a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote.          |
| `broker_quote_sell`    | `POST /v1/wallet/transaction/proforma` | **Step 1**: Sell cryptocurrency to receive fiat balance in a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote.      |
| `broker_quote_swap`    | `POST /v1/wallet/transaction/proforma` | **Step 1**: Swap/exchange one cryptocurrency for another between pockets. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. |
| `broker_confirm_quote` | `POST /v1/wallet/transaction`          | **Step 2**: Confirms and executes a previously created proforma from broker_quote_buy, broker_quote_sell, or broker_quote_swap. Final action.                                                              |

### ⚡ Pro Trading Operations (Write Actions)

| `pro_create_order` | `POST /v1/trading/order` | Create Limit/Market/Stop order in PRO Trading. Requires pair, side, type, and amount. For Limit orders, 'price' is required. For Stop-Limit orders, both 'price' and 'stop_price' are required. Market orders execute immediately at current price. Returns order with creation date and timestamp. Use pro_get_open_orders to check order status. |
| `pro_cancel_order` | `DELETE /v1/trading/order/:id` | Cancel a specific PRO order by ID. Requires order_id. Only open/pending orders can be cancelled. Returns cancellation status. Use pro_get_open_orders first to see which orders can be cancelled. |
| `pro_cancel_all_orders` | `DELETE /v1/trading/order` | Cancel all open orders in Pro Trading. Optional pair filter to cancel only orders for a specific market. Returns count of cancelled orders. Use with caution as this affects all pending orders. |
| `pro_deposit` | `POST /v1/trading/wallet/deposit` | Deposit funds from Simple Wallet to Pro Trading account. Funds must be available in Simple Wallet first (check with wallet_get_pockets). Transfer is immediate. Use pro_get_balance to verify the deposit. |
| `pro_withdraw` | `POST /v1/trading/wallet/withdraw` | Withdraw funds from Pro Trading account back to Simple Wallet. Funds must be available in Pro Trading (check with pro_get_balance). Transfer is immediate. Use wallet_get_pockets to verify the withdrawal. |
| `earn_deposit` | `POST /v1/earn/wallets/:id/movements` | Deposit funds from Simple Wallet pocket to Earn (Staking). Requires pocket_id, symbol (cryptocurrency), and amount. Funds will start earning rewards based on the asset's APY. Use wallet_get_pockets to find your pocket ID and earn_get_positions to see available Earn strategies. Returns operation details with status. |
| `earn_withdraw` | `POST /v1/earn/wallets/:id/movements` | Withdraw funds from Earn (Staking) back to Simple Wallet pocket. Requires pocket_id, symbol (cryptocurrency), and amount. Funds will stop earning rewards after withdrawal. Use earn_get_positions to check your Earn balance. Returns operation details with status. |
| `loan_create` | `POST /v1/loan` | Create a new loan by providing cryptocurrency as guarantee (collateral) to receive loan currency (can be any supported currency like USDC, EURC, or fiat). Requires guarantee_symbol, loan_symbol, and amount_type. Specify amount_type: 'fixed_collateral' (guarantee amount is fixed, loan amount is calculated) or 'fixed_loan' (loan amount is fixed, guarantee amount is calculated). This avoids mathematical errors where the model tries to guess the exact LTV manually. Returns loan order details with status. |
| `loan_increase_guarantee` | `POST /v1/loan/orders/:id/guarantee/increase` | Increase the guarantee (collateral) amount for an existing loan. Requires order_id and guarantee_amount. This improves the LTV ratio and reduces risk. Returns updated loan details. Use loan_get_orders first to get the order ID. |
| `loan_payback` | `POST /v1/loan/orders/:id/payback` | Pay back (return) part or all of a loan. Requires order_id and payback_amount. Reduces the loan amount and may release guarantee if fully paid. Returns updated loan details. Use loan_get_orders first to get the order ID, or loan_get_order_details to check current loan amount. |

## 📋 Response Schemas

All tool responses are **optimized for LLM consumption** with clean, consistent structures. We provide comprehensive documentation of response formats:

### 📖 Documentation Files

- **[SCHEMA_MAPPING.md](./docs/SCHEMA_MAPPING.md)** - Complete response schemas with field descriptions, types, enums, and examples for all 53 tools (auto-generated from `data/tools.json`)
- **[data/tools.json](./data/tools.json)** - Centralized metadata source for all tool definitions (name, description, inputSchema, responseSchema, examples)

### Key Features

- ✅ **Consistent naming**: All fields use `snake_case` for better LLM readability
- ✅ **Flattened structures**: Removed unnecessary nesting from API responses
- ✅ **Filtered data**: Zero balances and irrelevant fields are removed
- ✅ **Type-safe**: Full TypeScript interfaces in `src/utils/schemas.ts`
- ✅ **Well-documented**: Every tool has a concrete JSON example and complete response schema with field descriptions
- ✅ **Schema definitions**: All tools include `responseSchema` with detailed field descriptions, types, enums, and required/optional indicators
- ✅ **Temporal parity**: All date fields include both ISO 8601 string (`*_at`) and Unix timestamp (`*_timestamp`)
- ✅ **Normalized values**: Types, sides, currencies, and pairs are normalized for consistency
- ✅ **Union types**: Status and type fields use controlled vocabularies (e.g., `"active" | "completed" | "failed"`)
- ✅ **Enhanced metadata**: Paginated responses include `total_records`, `limit`, `offset`, and `has_more` flags
- ✅ **Service breakdown**: Portfolio valuation includes `by_service` breakdown (wallet, pro, earn, loan_guarantees)

### Example

Instead of raw API responses like:

```json
{
    "data": [
        {
            "orderId": "...",
            "guaranteeSymbol": "BTC",
            "loanSymbol": "EUR",
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ]
}
```

You get optimized responses like:

```json
[
    {
        "id": "...",
        "guarantee_symbol": "BTC",
        "loan_symbol": "EUR",
        "created_at": "2024-01-01T00:00:00.000Z"
    }
]
```

See [SCHEMA_MAPPING.md](./docs/SCHEMA_MAPPING.md) for complete response schemas with field descriptions and examples for all 53 tools.

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
        "base_symbol": "BTC",
        "quote_symbol": "EUR"
    }
    ```
4. Click **Run** to execute the tool
5. View the formatted response in the output panel

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

Please read our **[Contributing Guidelines](./CONTRIBUTING.md)** for details on:

- Setting up your development environment
- Running tests
- Commit conventions (Conventional Commits)
- Pull Request process

### Quick Start

1.  **Fork and Clone**:
    ```bash
    git clone https://github.com/bit2me-devs/bit2me-mcp.git
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Create a Branch**:
    ```bash
    git checkout -b feat/amazing-feature
    ```

For full details, check the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build together.

## 📄 License

[MIT License](./LICENSE)
