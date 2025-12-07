# Tool Response Schemas

This document shows the exact JSON structure returned by each Bit2Me MCP tool, including detailed descriptions of each field and their possible values.

## Tool Count (47 total)

- 3 General Tools
- 8 Broker (Simple Trading) Tools
- 4 Wallet (Storage) Tools
- 14 Pro (Advanced Trading) Tools
- 11 Earn (Staking) Tools
- 7 Loans Tools

_Note: Write operation tools are included in their respective categories._

---

## General (3 tools)

> **Note:** General information tools including asset details, account information, and portfolio valuation.

### general_get_assets_config

> Gets asset configuration for Bit2Me. Optional symbol filter. Returns symbol, name, type (crypto/fiat), network, trading status, loan availability, and pro_trading_pairs. Use to discover symbols or verify if an asset is tradeable/loanable. [PUBLIC]

#### Response Fields

- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`name`** (string) **(required)**: Human-readable pocket name or currency name
- **`type`** (string) **(required)**: Asset type: "crypto" for cryptocurrencies, "fiat" for traditional currencies
    - Possible values: `"crypto"`, `"fiat"`
- **`network`** (string): Blockchain network name in lowercase (e.g., bitcoin, ethereum, binance_smart_chain)
    - Can be `null`
- **`enabled`** (boolean) **(required)**: Whether the asset is enabled for use
- **`tradeable`** (boolean) **(required)**: Whether the asset can be traded
- **`loanable`** (boolean) **(required)**: Whether the asset can be used as collateral for loans
- **`pro_trading_pairs`** (array) **(required)**: List of complete trading pairs available for Pro Trading in BASE-QUOTE format (e.g., BTC-EUR, BTC-USD)
    - Array items: string

#### Example Response

```json
{
    "request": {
        "symbol": "BTC",
        "include_testnet": false,
        "show_exchange": true
    },
    "result": {
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "crypto",
        "network": "bitcoin",
        "enabled": true,
        "tradeable": true,
        "loanable": true,
        "pro_trading_pairs": [
            "BTC-EUR"
        ]
    }
}
```

**Bit2Me API:** `GET /v2/currency/assets` | `GET /v2/currency/assets/:symbol`

### portfolio_get_valuation

> Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat symbol (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations. Filters out dust amounts below minimum threshold. [PRIVATE]

#### Response Fields

- **`quote_symbol`** (string) **(required)**: Quote currency symbol in uppercase (e.g., EUR, USD)
- **`total_balance`** (string) **(required)**: Total portfolio balance in fiat currency
- **`by_service`** (object) **(required)**: Breakdown by service with balance suffix
    - **`wallet_balance`** (string): Total balance in Wallet
    - **`pro_balance`** (string): Total balance in Pro Trading
    - **`earn_balance`** (string): Total balance in Earn/Staking
    - **`loan_guarantees_balance`** (string): Total balance in loan guarantees
- **`details`** (array) **(required)**: Individual asset valuations with breakdown per cryptocurrency
    - Array items:
        - **`symbol`** (string): Cryptocurrency symbol in uppercase (e.g., BTC, ETH)
        - **`balance`** (string): Total amount of this asset across all services (as string for precision)
        - **`price_unit`** (string): Current price of one unit in the quote currency (as string for precision)
        - **`converted_balance`** (string): Total value of this asset in the quote currency (balance × price_unit)

#### Example Response

```json
{
    "request": {
        "fiat_symbol": "EUR"
    },
    "result": {
        "quote_symbol": "EUR",
        "total_balance": "12500.50",
        "by_service": {
            "wallet_balance": "5000.00",
            "pro_balance": "3000.00",
            "earn_balance": "4000.00",
            "loan_guarantees_balance": "500.50"
        },
        "details": [
            {
                "symbol": "BTC",
                "balance": "0.5",
                "price_unit": "90000.00",
                "converted_balance": "45000.00"
            }
        ]
    }
}
```

**Bit2Me API:** `Aggregates Wallet, Pro, Earn & Loan services`

### general_health

> Check the system health. Returns global status (online/degraded/offline), Bit2Me server reachability, and MCP server status.

#### Response Fields

- **`status`** (string) **(required)**: Global system status based on component health
    - Possible values: `"online"`, `"degraded"`, `"offline"`
- **`timestamp`** (string (date-time)) **(required)**: ISO 8601 timestamp of when the health check was performed
- **`version`** (string) **(required)**: MCP server version
- **`uptime_seconds`** (number) **(required)**: Server uptime in seconds since startup
- **`components`** (object) **(required)**: Individual component health status
    - **`bit2me_server`** (object): Bit2Me API server health (public liveness check)
        - **`status`** (string): Component status
            - Possible values: `"online"`, `"offline"`
        - **`response_time_ms`** (number): Response time in milliseconds
    - **`mcp_server`** (object): MCP integration health (authenticated API + Circuit Breaker)
        - **`status`** (string): Component status
            - Possible values: `"online"`, `"offline"`
        - **`response_time_ms`** (number): Response time in milliseconds (when available)
        - **`details`** (string): Additional details or error message (when status is offline)

#### Example Response

```json
{
    "request": {},
    "result": {
        "status": "online",
        "timestamp": "2024-11-25T10:30:00.000Z",
        "version": "1.0.0",
        "uptime_seconds": 3600,
        "components": {
            "bit2me_server": {
                "status": "online",
                "response_time_ms": 45
            },
            "mcp_server": {
                "status": "online",
                "response_time_ms": 120
            }
        }
    }
}
```

**Bit2Me API:** `N/A`

---

## Broker (Simple Trading) (8 tools)

> **Note:** Tools for simple trading operations and broker prices. Includes market data (prices, charts) and trading actions (buy, sell, swap) for the Wallet/Broker service. These prices include spread and are different from Pro Trading prices.

### broker_get_asset_price

> Get Wallet exchange rates for cryptocurrencies in a specific quote symbol and date. Returns the price of one unit of the base symbol in the requested quote symbol (default: EUR) as used by the Wallet/Broker service. Optional base_symbol filter and date for historical rates. Response is a list of prices. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "quote_symbol": "EUR",
        "base_symbol": "BTC"
    },
    "result": [
        {
            "base_symbol": "BTC",
            "price": "90000",
            "quote_symbol": "EUR",
            "date": "2024-11-25T10:30:00.000Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/currency/rate`

### broker_get_asset_data

> Gets comprehensive market ticker data for a cryptocurrency from the Wallet/Broker service (not Pro Trading). These prices include spread and differ from Pro Trading prices. Requires base_symbol (e.g., BTC) and optional quote_symbol (default: EUR). [PUBLIC]

#### Response Fields

- **`base_symbol`** (string) **(required)**: Base cryptocurrency symbol in uppercase (e.g., BTC, ETH)
- **`quote_symbol`** (string) **(required)**: Quote currency symbol in uppercase (e.g., EUR, USD)
- **`date`** (string (date-time)) **(required)**: ISO 8601 date/time when the data was recorded
- **`price`** (string) **(required)**: Current price of base_symbol in quote_symbol (as string for precision)
- **`market_cap`** (string) **(required)**: Total market capitalization in quote_symbol (as string for precision)
- **`volume_24h`** (string) **(required)**: 24-hour trading volume in quote_symbol (as string for precision)
- **`max_supply`** (string): Maximum supply of the cryptocurrency (as string, nullable)
    - Can be `null`
- **`total_supply`** (string): Total current supply of the cryptocurrency (as string, nullable)
    - Can be `null`

#### Example Response

```json
{
    "request": {
        "base_symbol": "BTC",
        "quote_symbol": "EUR"
    },
    "result": {
        "base_symbol": "BTC",
        "quote_symbol": "EUR",
        "date": "2025-11-25T10:30:00.258Z",
        "price": "75869.89",
        "market_cap": "1510730550631.13",
        "volume_24h": "62022281357.81",
        "max_supply": "21000000",
        "total_supply": "19953446"
    }
}
```

**Bit2Me API:** `GET /v3/currency/ticker/:symbol`

### broker_get_asset_chart

> Gets Wallet price history (candles/chart) with date and price in the quote symbol. These prices reflect the Wallet/Broker service, not Pro Trading. Requires pair (e.g., BTC-USD) and timeframe. Returns data points with ISO 8601 date/time and price in the quote symbol from the pair. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "timeframe": "1d"
    },
    "result": [
        {
            "date": "2024-11-25T10:30:00.000Z",
            "price": "72145.32"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v3/currency/chart`

### broker_quote_buy

> STEP 1: Buy cryptocurrency using fiat balance from a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]

#### Response Fields

- **`proforma_id`** (string) **(required)**: Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation
- **`origin_amount`** (string) **(required)**: Amount being spent from the source pocket (in origin currency, as string for precision)
- **`origin_symbol`** (string) **(required)**: Currency symbol of the source pocket (e.g., EUR for buy, BTC for sell)
- **`destination_amount`** (string) **(required)**: Amount to be received in the destination pocket (in destination currency, as string for precision)
- **`destination_symbol`** (string) **(required)**: Currency symbol of the destination pocket (e.g., BTC for buy, EUR for sell)
- **`rate`** (string) **(required)**: Exchange rate applied to this quote (as string for precision)
- **`fee`** (string) **(required)**: Transaction fee amount in origin currency (as string for precision)
- **`expires_at`** (string (date-time)) **(required)**: ISO 8601 date/time when this quote expires. Must confirm before this time

#### Example Response

```json
{
    "request": {
        "origin_pocket_id": "pocket-eur-uuid",
        "destination_pocket_id": "pocket-btc-uuid",
        "amount": "100.00"
    },
    "result": {
        "proforma_id": "proforma123-...",
        "origin_amount": "100.00",
        "origin_symbol": "EUR",
        "destination_amount": "0.00131579",
        "destination_symbol": "BTC",
        "rate": "75869.89",
        "fee": "0.50",
        "expires_at": "2024-11-25T10:35:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/wallet/transaction/proforma`

### broker_quote_sell

> STEP 1: Sell cryptocurrency to receive fiat balance in a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]

#### Response Fields

- **`proforma_id`** (string) **(required)**: Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation
- **`origin_amount`** (string) **(required)**: Amount of cryptocurrency being sold (as string for precision)
- **`origin_symbol`** (string) **(required)**: Symbol of the cryptocurrency being sold (e.g., BTC)
- **`destination_amount`** (string) **(required)**: Amount of fiat currency to be received (as string for precision)
- **`destination_symbol`** (string) **(required)**: Symbol of the fiat currency to receive (e.g., EUR)
- **`rate`** (string) **(required)**: Exchange rate applied to this quote (as string for precision)
- **`fee`** (string) **(required)**: Transaction fee amount (as string for precision)
- **`expires_at`** (string (date-time)) **(required)**: ISO 8601 date/time when this quote expires. Must confirm before this time

#### Example Response

```json
{
    "request": {
        "origin_pocket_id": "pocket-btc-uuid",
        "destination_pocket_id": "pocket-eur-uuid",
        "amount": "0.001"
    },
    "result": {
        "proforma_id": "proforma123-...",
        "origin_amount": "0.001",
        "origin_symbol": "BTC",
        "destination_amount": "75.87",
        "destination_symbol": "EUR",
        "rate": "75869.89",
        "fee": "0.50",
        "expires_at": "2024-11-25T10:35:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/wallet/transaction/proforma`

### broker_quote_swap

> STEP 1: Swap/exchange one cryptocurrency for another between pockets. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]

#### Response Fields

- **`proforma_id`** (string) **(required)**: Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation
- **`origin_amount`** (string) **(required)**: Amount of cryptocurrency being swapped from (as string for precision)
- **`origin_symbol`** (string) **(required)**: Symbol of the cryptocurrency being swapped from (e.g., BTC)
- **`destination_amount`** (string) **(required)**: Amount of cryptocurrency to be received (as string for precision)
- **`destination_symbol`** (string) **(required)**: Symbol of the cryptocurrency to receive (e.g., ETH)
- **`rate`** (string) **(required)**: Exchange rate between the two cryptocurrencies (as string for precision)
- **`fee`** (string) **(required)**: Transaction fee amount in origin currency (as string for precision)
- **`expires_at`** (string (date-time)) **(required)**: ISO 8601 date/time when this quote expires. Must confirm before this time

#### Example Response

```json
{
    "request": {
        "origin_pocket_id": "pocket-btc-uuid",
        "destination_pocket_id": "pocket-eth-uuid",
        "amount": "0.001"
    },
    "result": {
        "proforma_id": "proforma123-...",
        "origin_amount": "0.001",
        "origin_symbol": "BTC",
        "destination_amount": "0.025",
        "destination_symbol": "ETH",
        "rate": "0.04",
        "fee": "0.0001",
        "expires_at": "2024-11-25T10:35:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/wallet/transaction/proforma`

### broker_confirm_quote

> STEP 2: Confirms and executes a previously created proforma from broker_quote_buy, broker_quote_sell, or broker_quote_swap. Final action. [PRIVATE]

#### Response Fields

- **`movement_id`** (string) **(required)**: Unique identifier for the executed movement. Use this to track the transaction
- **`type`** (string) **(required)**: Type of movement executed: deposit (incoming funds), withdrawal (outgoing funds), swap (crypto exchange), purchase (buy crypto with fiat), transfer (internal move), fee (charged fee)
    - Possible values: `"deposit"`, `"withdrawal"`, `"swap"`, `"purchase"`, `"transfer"`, `"fee"`, `"other"`
- **`status`** (string) **(required)**: Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`origin_amount`** (string) **(required)**: Amount spent from the source pocket (as string for precision)
- **`origin_symbol`** (string) **(required)**: Currency symbol that was spent (e.g., EUR, BTC)
- **`destination_amount`** (string) **(required)**: Amount received in the destination pocket (as string for precision)
- **`destination_symbol`** (string) **(required)**: Currency symbol that was received (e.g., BTC, EUR)
- **`fee`** (string) **(required)**: Transaction fee charged (as string for precision)
- **`created_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the movement was executed

#### Example Response

```json
{
    "request": {
        "proforma_id": "proforma-uuid-1234-5678"
    },
    "result": {
        "movement_id": "movement-uuid-1234-5678",
        "type": "swap",
        "status": "completed",
        "origin_amount": "0.001",
        "origin_symbol": "BTC",
        "destination_amount": "0.025",
        "destination_symbol": "ETH",
        "fee": "0.0001",
        "created_at": "2024-11-25T10:35:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/wallet/transaction`

### wallet_get_cards

> List credit/debit cards registered in Bit2Me. Returns card details including card ID, brand, last 4 digits, expiration date, and alias. Optional card_id filter to retrieve a specific card. Use limit and offset for pagination. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "limit": 10,
        "offset": 0
    },
    "result": [
        {
            "card_id": "card-uuid-1234",
            "type": "credit",
            "brand": "VISA",
            "country": "ES",
            "last4": "1234",
            "expire_month": "12",
            "expire_year": "2025",
            "alias": "My Visa Card",
            "created_at": "2025-12-04T01:31:14.303Z"
        }
    ],
    "metadata": {
        "total_records": 1,
        "limit": 10,
        "offset": 0,
        "has_more": false
    }
}
```

**Bit2Me API:** `GET /v1/teller/card`

---

## Wallet (Storage) (4 tools)

> **Note:** Tools for managing wallet balances, movements, and addresses. For trading operations and cards, see Broker Tools.

### wallet_get_pockets

> Gets balances, UUIDs, and available funds from Simple Wallet (Broker). Does not include Pro/Earn balance. Returns all pockets of the user. If pocket_id is provided, returns only that specific pocket. IMPORTANT: Users often have MULTIPLE pockets for the same symbol (e.g. multiple EUR pockets). ALWAYS check ALL pockets for a specific symbol to find the one with a positive balance. [PRIVATE]

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "id": "abc123-def456-...",
            "symbol": "EUR",
            "balance": "1250.50",
            "available": "1200.00",
            "blocked": "50.50",
            "name": "EUR Wallet",
            "created_at": "2021-01-19T20:24:59.209Z"
        },
        {
            "id": "def456-abc123-...",
            "symbol": "BTC",
            "balance": "0.5",
            "available": "0.5",
            "blocked": "0",
            "name": "BTC Wallet",
            "created_at": "2021-01-19T20:24:59.209Z"
        }
    ],
    "metadata": {
        "total_records": 2
    }
}
```

**Bit2Me API:** `GET /v1/wallet/pocket`

### wallet_get_pocket_addresses

> Lists deposit addresses for a wallet (Pocket) on a specific network. Use wallet_get_networks first to see available networks for a currency. Each network may have different addresses. Returns address, network, and creation date. Use this address to receive deposits on the specified network. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "pocket_id": "pocket-uuid-1234-5678",
        "network": "bitcoin"
    },
    "result": [
        {
            "id": "addr123-...",
            "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "network": "bitcoin",
            "symbol": "BTC",
            "tag": "",
            "created_at": "2021-01-19T20:24:59.209Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v2/wallet/pocket/:pocket_id/:network/address`

### wallet_get_networks

> Lists available networks for a specific currency. Use this before wallet_get_pocket_addresses to see which networks support deposits for a currency (e.g., bitcoin, ethereum, binanceSmartChain). Returns network ID, name, native currency, fee currency, and whether it requires a tag/memo. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "symbol": "BTC"
    },
    "result": [
        {
            "id": "bitcoin",
            "name": "bitcoin",
            "native_currency_code": "BTC",
            "fee_currency_code": "BTC",
            "has_tag": false
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/wallet/currency/:symbol/network`

### wallet_get_movements

> History of Wallet operations. Optional movement_id for specific details, symbol filter, limit/offset for pagination. Returns type, amount, symbol, status, date. Status ENUM: pending, completed, failed. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "symbol": "EUR",
        "limit": 10,
        "offset": 0
    },
    "result": [
        {
            "id": "tx123-...",
            "date": "2024-11-25T10:30:00.000Z",
            "type": "deposit",
            "subtype": "bank_transfer",
            "status": "completed",
            "amount": "1000.00",
            "symbol": "EUR",
            "origin": {
                "amount": "1000.00",
                "symbol": "EUR",
                "class": "bank"
            },
            "destination": {
                "amount": "1000.00",
                "symbol": "EUR",
                "class": "pocket"
            },
            "fee": {
                "amount": "0.00",
                "symbol": "EUR",
                "class": "fee"
            }
        }
    ],
    "metadata": {
        "total_records": 150,
        "limit": 10,
        "offset": 0,
        "has_more": true
    }
}
```

**Bit2Me API:** `GET /v1/wallet/transaction` | `GET /v1/wallet/transaction/:movement_id`

---

## Pro (Advanced Trading) (14 tools)

> **Note:** Advanced trading tools for Pro Trading. Includes order management, market data (order book, candles, tickers), and fund transfers between Wallet and Pro Trading. Pro Trading offers lower fees and more control than Broker.

### pro_get_balance

> Gets balances from PRO Trading account. This is separate from Simple Wallet - funds must be transferred using pro_deposit/pro_withdraw. Returns available and blocked balances per symbol for trading. [PRIVATE]

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "symbol": "BTC",
            "balance": "0.00689471",
            "blocked": "0.00011102",
            "available": "0.00689471"
        },
        {
            "symbol": "EUR",
            "balance": "27812.0234142",
            "blocked": "0",
            "available": "27812.0234142"
        }
    ],
    "metadata": {
        "total_records": 2
    }
}
```

**Bit2Me API:** `GET /v1/trading/wallet/balance`

### pro_get_open_orders

> View open trading orders in PRO. Returns all active orders (pending, partially filled). If order_id is provided, returns details for that specific order. Optional pair filter to see orders for a specific market. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD"
    },
    "result": [
        {
            "id": "order123",
            "pair": "BTC-USD",
            "side": "buy",
            "type": "limit",
            "amount": "0.1",
            "price": "75000.00",
            "status": "pending",
            "filled_amount": "0",
            "created_at": "2024-11-25T10:00:00.000Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/trading/order`

### pro_get_trades

> Gets the user's trade history in Pro Trading. Returns executed trades with price, amount, side (buy/sell), fees, and date. Optional filters: trading pair, side, order type, date range, limit (max 50), offset, and sort order. Use this to review past trading activity. Response is a paginated list with metadata. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "limit": 10,
        "offset": 0,
        "sort": "DESC"
    },
    "result": [
        {
            "id": "trade123",
            "order_id": "order456",
            "pair": "BTC-USD",
            "price": "75869.89",
            "amount": "0.1",
            "side": "buy",
            "order_type": "limit",
            "fee": "0.75",
            "fee_symbol": "EUR",
            "cost": "7586.99",
            "is_maker": false,
            "date": "2024-11-25T10:30:00.258Z"
        }
    ],
    "metadata": {
        "total_records": 150,
        "limit": 10,
        "offset": 0,
        "has_more": true
    }
}
```

**Bit2Me API:** `GET /v1/trading/trade`

### pro_get_order_trades

> Gets all individual trades (executions) associated with a specific order. Returns detailed execution data including price, amount, fees, and date for each fill. Useful for analyzing how a large order was executed across multiple trades. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "order_id": "order-uuid-1234-5678"
    },
    "result": [
        {
            "id": "trade123",
            "order_id": "order456",
            "pair": "BTC-USD",
            "price": "75869.89",
            "amount": "0.1",
            "fee": "0.75",
            "date": "2024-11-25T10:30:00.258Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/trading/order/:id/trades`

### pro_create_order

> Create Limit/Market/Stop order in PRO Trading. Returns order ID. For Limit orders, 'price' is required. For Stop-Limit orders, both 'price' and 'stop_price' are required. Market orders execute immediately at current price. Use pro_get_open_orders to check order status. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
- **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
    - Possible values: `"buy"`, `"sell"`
- **`type`** (string) **(required)**: Order type: limit (executes at specified price), market (executes immediately at best price), stop-limit (triggers at stop price)
    - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`amount`** (string) **(required)**: Amount as string for precision
- **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
    - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`created_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the resource was created

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "side": "buy",
        "type": "limit",
        "amount": "0.1",
        "price": "60000"
    },
    "result": {
        "id": "order123",
        "pair": "BTC-USD",
        "side": "buy",
        "type": "limit",
        "amount": "0.1",
        "price": "75000.00",
        "status": "pending",
        "created_at": "2024-11-25T10:00:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/trading/order`

### pro_cancel_order

> Cancel a specific PRO order by ID. Only open/pending orders can be cancelled. Returns cancellation status. Use pro_get_open_orders first to see which orders can be cancelled. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
    - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "order_id": "order-uuid-1234-5678"
    },
    "result": {
        "id": "order123",
        "status": "cancelled",
        "message": "Order cancelled successfully"
    }
}
```

**Bit2Me API:** `DELETE /v1/trading/order/:id`

### pro_cancel_all_orders

> Cancel all open orders in Pro Trading. Optional pair filter to cancel only orders for a specific market. Returns count of cancelled orders. Use with caution as this affects all pending orders. [PRIVATE]

#### Response Fields

- **`cancelled`** (number) **(required)**: Number of orders cancelled by this operation
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD"
    },
    "result": {
        "cancelled": 5,
        "message": "5 orders cancelled successfully"
    }
}
```

**Bit2Me API:** `DELETE /v1/trading/order`

### pro_deposit

> Deposit funds from Simple Wallet to Pro Trading account. Funds must be available in Simple Wallet first (check with wallet_get_pockets). Transfer is immediate. Use pro_get_balance to verify the deposit. Transfer status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "symbol": "EUR",
        "amount": "500.00"
    },
    "result": {
        "id": "transfer123-...",
        "symbol": "EUR",
        "amount": "500.00",
        "status": "completed",
        "message": "Deposit successful"
    }
}
```

**Bit2Me API:** `POST /v1/trading/wallet/deposit`

### pro_withdraw

> Withdraw funds from Pro Trading account back to Simple Wallet. Funds must be available in Pro Trading (check with pro_get_balance). Transfer is immediate. Use wallet_get_pockets to verify the withdrawal. Transfer status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "symbol": "EUR",
        "amount": "500.00",
        "to_pocket_id": "pocket-uuid-1234"
    },
    "result": {
        "id": "transfer123-...",
        "symbol": "EUR",
        "amount": "500.00",
        "status": "completed",
        "message": "Withdrawal successful"
    }
}
```

**Bit2Me API:** `POST /v1/trading/wallet/withdraw`

### pro_get_market_config

> Gets full market configuration including precision, amounts, prices, fees, and trading status. Use this before placing orders to validate amounts, prices, and understand fee structure. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-EUR"
    },
    "result": [
        {
            "id": "31fdfac9-a5b2-4efd-ae3f-b578532294e7",
            "pair": "BTC-EUR",
            "base_precision": "8",
            "quote_precision": "2",
            "min_amount": "0.0001",
            "max_amount": "100",
            "min_price": "1000",
            "max_price": "500000",
            "min_order_size": "10",
            "tick_size": "0.01",
            "fee_maker": "0.1",
            "fee_taker": "0.2",
            "status": "active"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/trading/market-config`

### pro_get_order_book

> Gets the order book (market depth) for a market showing current buy and sell orders. Requires trading pair (e.g., BTC-USD). Returns bids (buy orders) and asks (sell orders) with prices and amounts. Useful for analyzing market liquidity and determining optimal order prices. Response is a single object. [PUBLIC]

#### Response Fields

- **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
- **`bids`** (array) **(required)**: Array of buy orders sorted by price (highest first). Each bid represents demand at that price level
    - Array items: [object Object]
- **`asks`** (array) **(required)**: Array of sell orders sorted by price (lowest first). Each ask represents supply at that price level
    - Array items: [object Object]
- **`date`** (string (date-time)) **(required)**: ISO 8601 date/time when this event occurred

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD"
    },
    "result": {
        "pair": "BTC-USD",
        "bids": [
            {
                "price": "75800.00",
                "amount": "0.5"
            }
        ],
        "asks": [
            {
                "price": "75900.00",
                "amount": "0.8"
            }
        ],
        "date": "2025-11-25T10:30:00.258Z"
    }
}
```

**Bit2Me API:** `GET /v2/trading/order-book`

### pro_get_public_trades

> Gets the latest public trades (executed orders) for a market. Requires trading pair (e.g., BTC-USD). Returns recent transactions with price, amount, side (buy/sell), and date. Optional limit (max 50, default: 50) and sort order (ASC/DESC). Useful for seeing recent market activity. Response is a list of trades with metadata. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "limit": 5
    },
    "result": [
        {
            "id": "12345",
            "pair": "BTC-USD",
            "price": "75869.89",
            "amount": "0.5",
            "side": "buy",
            "date": "2024-11-25T10:30:00.258Z"
        }
    ],
    "metadata": {
        "total_records": 100,
        "limit": 5,
        "sort": "DESC"
    }
}
```

**Bit2Me API:** `GET /v1/trading/trade/last`

### pro_get_candles

> Gets OHLCV (Open, High, Low, Close, Volume) candles for Pro (Advanced Trading). Requires trading pair (e.g., BTC-EUR) and timeframe. Returns price data in specified timeframe with timestamp and date. Optional limit (default: 1000, max: 1000), startTime and endTime (Unix epoch milliseconds). If startTime/endTime not provided, defaults to last 24 hours. Essential for technical analysis and charting. Response is a list of candles with metadata. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-EUR",
        "timeframe": "1h",
        "limit": 100,
        "startTime": 1715081606087,
        "endTime": 1715168006087
    },
    "result": [
        {
            "date": "2024-11-25T10:00:00.000Z",
            "open": "75800.00",
            "high": "76100.00",
            "low": "75600.00",
            "close": "75869.89",
            "volume": "125.5"
        }
    ],
    "metadata": {
        "total_records": 100,
        "limit": 5,
        "timeframe": "1h",
        "pair": "BTC-USD"
    }
}
```

**Bit2Me API:** `GET /v1/trading/candle`

### pro_get_ticker

> Get ticker information (OHLCV, current best bid and ask, percentage versus price 24 hours ago) for all markets or by requested market symbol. The data refers to the last 24 hours from the date indicated. Optional pair filter for a specific market. Returns ticker data with open, close, bid, ask, high, low, volumes, and percentage change. [PUBLIC]

#### Example Response

```json
{
    "request": {
        "pair": "BTC-EUR"
    },
    "result": [
        {
            "symbol": "BTC/EUR",
            "open": "59692.2",
            "close": "59459.3",
            "bid": "59459.3",
            "ask": "59459.4",
            "high": "59807.8",
            "low": "58259",
            "baseVolume": "506.2471485105999",
            "percentage": "-0.39",
            "quoteVolume": "30160053.557880376",
            "date": "2024-05-07T10:00:06.087Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v2/trading/tickers`

---

## Earn (Staking) (11 tools)

> **Note:** Staking and yield generation tools. Deposit crypto to earn rewards, view positions, track movements, and manage reward configurations. Positions represent locked funds generating yield, different from Wallet pockets.

### earn_get_summary

> View summary of accumulated rewards in Staking/Earn. Returns total rewards earned across all Earn positions, breakdown by symbol, and overall performance. Use this to see your total staking rewards. [PRIVATE]

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "symbol": "BTC",
            "total_balance": "0.5",
            "total_rewards": "0.0001"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/earn/summary`

### earn_get_positions

> List active Earn positions/strategies. Optional position_id filter for specific position. Returns position_id, symbol, balance, strategy (fixed/flexible), lock_period, converted_balance, and timestamps. Use earn_get_assets for APY rates. Note: Positions are locked/yielding funds, different from Pockets (liquid funds). [PRIVATE]

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "position_id": "ce2bb790-f538-4d04-8acd-f3473044e703",
            "symbol": "B2M",
            "balance": "25865004.93005867",
            "strategy": "fixed",
            "lock_period": {
                "lock_period_id": "bfbc04b5-b7f8-4060-8ec0-bb2c924851b5",
                "months": 12
            },
            "converted_balance": {
                "value": "269293.50",
                "symbol": "EUR"
            },
            "created_at": "2024-06-24T11:59:28.905Z",
            "updated_at": "2025-12-04T11:05:54.389Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v2/earn/wallets`

### earn_get_position_movements

> Get movement history of a specific Earn position. Returns movements with type (deposit, withdrawal, reward, fee), amounts, dates, and status. Optional limit and offset for pagination. Use earn_get_positions first to get the position ID. Response is a paginated list with metadata. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "position_id": "earn-position-uuid-1234",
        "limit": 10,
        "offset": 0
    },
    "result": [
        {
            "id": "mov123-...",
            "type": "deposit",
            "symbol": "BTC",
            "amount": "0.1",
            "created_at": "2024-11-25T10:30:00.000Z",
            "position_id": "earn123-...",
            "status": "completed"
        }
    ],
    "metadata": {
        "total_records": 25,
        "limit": 10,
        "offset": 0,
        "has_more": true
    }
}
```

**Bit2Me API:** `GET /v1/earn/wallets/:id/movements`

### earn_get_movements

> Get movement history across all Earn positions. Returns movements with type (deposit, reward, withdrawal, discount-funds, discount-rewards, fee), amounts, dates, rates, source, and issuer information. Supports filtering by symbol, position_id, type (deposit, reward, withdrawal, discount-funds, discount-rewards), date range, and pagination. All parameters are optional. Response is a paginated list with metadata. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "symbol": "BTC",
        "limit": 20,
        "offset": 0
    },
    "result": [
        {
            "id": "mov123-...",
            "type": "deposit",
            "created_at": "2024-11-25T10:30:00.000Z",
            "position_id": "earn123-...",
            "amount": {
                "value": "0.1",
                "symbol": "BTC"
            },
            "rate": {
                "amount": {
                    "value": "75869.89",
                    "symbol": "EUR"
                },
                "pair": "BTC-USD"
            },
            "converted_amount": {
                "value": "7586.99",
                "symbol": "EUR"
            },
            "source": {
                "pocket_id": "pocket123-...",
                "symbol": "BTC"
            },
            "issuer": {
                "id": "issuer123",
                "name": "Bit2Me",
                "integrator": "bit2me"
            }
        }
    ],
    "metadata": {
        "total_records": 100,
        "limit": 20,
        "offset": 0,
        "has_more": true
    }
}
```

**Bit2Me API:** `GET /v2/earn/movements`

### earn_get_movements_summary

> Get summary statistics of Earn movements filtered by type. Valid type values: deposit, reward, withdrawal, discount-funds, discount-rewards. Returns total count, total amounts, and aggregated data for the specified movement type across all Earn positions. [PRIVATE]

#### Response Fields

- **`type`** (string) **(required)**: Movement type for this summary: deposit (funds added), reward (earned yield), withdrawal (funds removed), discount-funds, discount-rewards
    - Possible values: `"deposit"`, `"reward"`, `"withdrawal"`, `"discount-funds"`, `"discount-rewards"`
- **`total_amount`** (string) **(required)**: Sum of all amounts in this summary (as string for precision)
- **`total_count`** (number) **(required)**: Total number of items in this summary
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)

#### Example Response

```json
{
    "request": {
        "type": "deposit"
    },
    "result": {
        "type": "deposit",
        "total_amount": "1.5",
        "total_count": 10,
        "symbol": "BTC"
    }
}
```

**Bit2Me API:** `GET /v1/earn/movements/:type/summary`

### earn_get_rewards_config

> Get global rewards configuration for Earn/Staking. Returns position rewards configuration including position_id, user_id, symbol, lock_period_id, reward_symbol, and timestamps. Use this to understand reward configuration for all positions. [PRIVATE]

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "wallet_id": "990467e1-c815-4f5c-a09b-23d0e85f6039",
            "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
            "symbol": "B2M",
            "lock_period_id": null,
            "reward_symbol": "B2M",
            "created_at": "2021-12-29T11:05:05.376Z",
            "updated_at": "2025-07-02T13:37:26.141Z"
        },
        {
            "wallet_id": "d3841daf-b619-4903-838c-032f31fbd593",
            "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
            "symbol": "B3X",
            "lock_period_id": null,
            "reward_symbol": "B3X",
            "created_at": "2022-09-13T20:36:21.065Z",
            "updated_at": "2025-07-02T13:37:26.141Z"
        }
    ],
    "metadata": {
        "total_records": 2
    }
}
```

**Bit2Me API:** `GET /v1/earn/wallets/rewards/config`

### earn_get_position_rewards_config

> Get rewards configuration for a specific Earn position. Returns reward calculation rules, APY details, and position-specific staking parameters. Use earn_get_positions first to get the position ID. [PRIVATE]

#### Response Fields

- **`position_id`** (string (uuid)): Unique identifier (UUID) for the Earn position
- **`user_id`** (string) **(required)**: User identifier who owns the wallet
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`lock_period_id`** (string): Identifier for the staking lock period configuration
    - Can be `null`
- **`reward_symbol`** (string) **(required)**: Currency symbol in which staking rewards are paid
- **`created_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the resource was created
- **`updated_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the resource was last updated

#### Example Response

```json
{
    "request": {
        "position_id": "earn-position-uuid-1234"
    },
    "result": {
        "wallet_id": "f482981e-6f8e-4d43-841d-8585a1021f94",
        "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
        "symbol": "DOT",
        "lock_period_id": null,
        "reward_symbol": "B2M",
        "created_at": "2025-04-23T04:00:32.551Z",
        "updated_at": "2025-07-02T13:37:26.141Z"
    }
}
```

**Bit2Me API:** `GET /v1/earn/wallets/:id/rewards/config`

### earn_get_position_rewards_summary

> Get rewards summary for a specific Earn position. Returns reward symbol, reward amount, and converted reward amount in fiat currency. Use earn_get_positions first to get the position ID. Optional user_currency parameter to specify the fiat currency for conversion (default: EUR). [PRIVATE]

#### Response Fields

- **`reward_symbol`** (string) **(required)**: Currency symbol in which staking rewards are paid
- **`reward_amount`** (string) **(required)**: Total accumulated rewards amount (as string for precision)
- **`reward_converted_symbol`** (string) **(required)**: Fiat currency symbol for the converted reward amount
- **`reward_converted_amount`** (string) **(required)**: Reward amount converted to fiat currency (as string for precision)

#### Example Response

```json
{
    "request": {
        "position_id": "earn-position-uuid-1234",
        "user_currency": "EUR"
    },
    "result": {
        "reward_symbol": "B2M",
        "reward_amount": "3861562.41527785",
        "reward_converted_symbol": "EUR",
        "reward_converted_amount": "46361.57588988"
    }
}
```

**Bit2Me API:** `GET /v1/earn/wallets/:id/rewards/summary`

### earn_deposit

> Deposit funds from Simple Wallet pocket to Earn (Staking). Funds will start earning rewards based on the asset's APY. Returns operation details with type: deposit. Use wallet_get_pockets to find your pocket ID and earn_get_positions to see available Earn strategies. Operation status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID) for this deposit operation
- **`type`** (string) **(required)**: Operation type: always 'deposit' for this endpoint
    - Possible values: `"deposit"`
- **`symbol`** (string) **(required)**: Cryptocurrency symbol deposited (e.g., BTC, ETH)
- **`amount`** (string) **(required)**: Amount deposited (as string for precision)
- **`status`** (string) **(required)**: Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "pocket_id": "pocket-uuid-1234",
        "symbol": "BTC",
        "amount": "0.1"
    },
    "result": {
        "id": "mov123-...",
        "type": "deposit",
        "symbol": "BTC",
        "amount": "0.1",
        "status": "completed",
        "message": "Deposit successful"
    }
}
```

**Bit2Me API:** `POST /v1/earn/wallets/:id/movements`

### earn_withdraw

> Withdraw funds from Earn (Staking) back to Simple Wallet pocket. Funds will stop earning rewards after withdrawal. Returns operation details with type: withdrawal. Use earn_get_positions to check your Earn balance. Operation status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID) for this withdrawal operation
- **`type`** (string) **(required)**: Operation type: always 'withdrawal' for this endpoint
    - Possible values: `"withdrawal"`
- **`symbol`** (string) **(required)**: Cryptocurrency symbol withdrawn (e.g., BTC, ETH)
- **`amount`** (string) **(required)**: Amount withdrawn (as string for precision)
- **`status`** (string) **(required)**: Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "pocket_id": "pocket-uuid-1234",
        "symbol": "BTC",
        "amount": "0.1"
    },
    "result": {
        "id": "mov123-...",
        "type": "withdrawal",
        "symbol": "BTC",
        "amount": "0.1",
        "status": "completed",
        "message": "Withdrawal successful"
    }
}
```

**Bit2Me API:** `POST /v1/earn/wallets/:id/movements`

### earn_get_assets

> Get list of assets (cryptocurrencies) supported in Earn/Staking with full details. Returns symbols, APY rates, availability status, lock period options, and reward currencies. Use this to discover stakeable assets, verify availability before deposit/withdrawal, and compare returns. [PUBLIC]

#### Response Fields

- **`assets`** (array): List of cryptocurrencies available for staking with full details
    - Array items:
        - **`symbol`** (string) **(required)**: Cryptocurrency symbol in uppercase (e.g., BTC, ETH)
        - **`name`** (string): Full name of the cryptocurrency (e.g., Bitcoin, Ethereum)
        - **`disabled`** (boolean) **(required)**: Whether the asset is globally disabled for staking
        - **`deposit_disabled`** (boolean) **(required)**: Whether deposits are currently disabled. Check before attempting earn_deposit.
        - **`withdrawal_disabled`** (boolean) **(required)**: Whether withdrawals are currently disabled. Check before attempting earn_withdraw.
        - **`is_new`** (boolean) **(required)**: Whether this is a newly added asset
        - **`lock_periods`** (array): Available lock period options. months=0 means flexible (no lock).
            - Array items:
                - **`id`** (string): Lock period identifier
                - **`months`** (number): Lock duration in months (0 = flexible/no lock)
        - **`reward_currencies`** (array): Currencies in which rewards can be received (e.g., same token or B2M)
            - Array items: string
        - **`level_extra_yield_percentage`** (number): Extra yield percentage based on user level
        - **`apy`** (object): Annual Percentage Yield rates
            - **`daily_yield_ratio`** (string): Daily yield as decimal (1.0 = 100%)
            - **`weekly_yield_ratio`** (string): Weekly yield as decimal (1.0 = 100%)
            - **`monthly_yield_ratio`** (string): Monthly yield as decimal (1.0 = 100%)

#### Example Response

```json
{
    "request": {},
    "result": {
        "assets": [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "disabled": false,
                "deposit_disabled": false,
                "withdrawal_disabled": false,
                "is_new": false,
                "lock_periods": [
                    {
                        "id": "flexible",
                        "months": 0
                    },
                    {
                        "id": "3m",
                        "months": 3
                    }
                ],
                "reward_currencies": [
                    "BTC",
                    "B2M"
                ],
                "apy": {
                    "daily_yield_ratio": "0.0001",
                    "weekly_yield_ratio": "0.0007",
                    "monthly_yield_ratio": "0.0030"
                }
            }
        ]
    },
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v2/earn/assets`

---

## Loans (7 tools)

> **Note:** Crypto-backed loan tools. Use cryptocurrency as collateral to borrow funds. Manage loans, simulate LTV scenarios, track movements, and adjust guarantees. Lower LTV means lower risk.

### loan_get_simulation

> Simulate loan LTV and APR. Provide guarantee_amount OR loan_amount (other is calculated). Requires guarantee_symbol (crypto), loan_symbol, user_symbol (fiat). Returns amounts, LTV ratio (1.0=100%, lower=safer), and APR. Use before loan_create. [PUBLIC]

#### Response Fields

- **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`guarantee_amount_converted`** (string) **(required)**: guarantee amount converted
- **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
- **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
- **`loan_amount_converted`** (string) **(required)**: Loan amount converted to user currency (as string for precision)
- **`user_symbol`** (string) **(required)**: User's preferred fiat currency symbol for conversions
- **`ltv`** (string) **(required)**: Loan-to-Value ratio as string (1.0 = 100%)
- **`apr`** (string) **(required)**: Annual Percentage Rate as string

#### Example Response

```json
{
    "request": {
        "guarantee_symbol": "BTC",
        "loan_symbol": "EUR",
        "user_symbol": "EUR",
        "guarantee_amount": "1.0"
    },
    "result": {
        "guarantee_symbol": "BTC",
        "guarantee_amount": "0.5678",
        "guarantee_amount_converted": "57000.34",
        "loan_symbol": "USDC",
        "loan_amount": "1250.34",
        "loan_amount_converted": "1300.34",
        "user_symbol": "EUR",
        "ltv": "0.5",
        "apr": "13.12"
    }
}
```

**Bit2Me API:** `GET /v1/loan/ltv`

### loan_get_config

> Get currency configuration for loans. Returns two separate arrays: guarantee_currencies (cryptocurrencies that can be used as collateral with LTV limits) and loan_currencies (currencies available for borrowing with APR, liquidity, and min/max amounts). Use guarantee currencies as collateral to receive loan currencies. Use this before creating a loan to understand available options and limits. [PUBLIC]

#### Response Fields

- **`guarantee_currencies`** (array) **(required)**: List of cryptocurrencies that can be used as loan collateral
    - Array items: [object Object]
- **`loan_currencies`** (array) **(required)**: List of currencies available for borrowing
    - Array items: [object Object]

#### Example Response

```json
{
    "request": {},
    "result": {
        "guarantee_currencies": [
            {
                "symbol": "BTC",
                "enabled": true,
                "liquidation_ltv": "0.8500",
                "initial_ltv": "0.5000",
                "created_at": "2024-07-16T15:49:30.646Z",
                "updated_at": "2024-07-16T15:49:30.646Z"
            },
            {
                "symbol": "ETH",
                "enabled": true,
                "liquidation_ltv": "0.8000",
                "initial_ltv": "0.4500",
                "created_at": "2024-07-16T15:49:30.646Z",
                "updated_at": "2024-07-16T15:49:30.646Z"
            }
        ],
        "loan_currencies": [
            {
                "symbol": "USDC",
                "enabled": true,
                "liquidity": "250000.000000000000000000",
                "liquidity_status": "high",
                "apr": "0.130000000000000000",
                "minimum_amount": "100.000000000000000000",
                "maximum_amount": "250000.000000000000000000",
                "created_at": "2024-07-16T15:49:30.646Z",
                "updated_at": "2024-07-16T15:49:30.646Z"
            },
            {
                "symbol": "EURC",
                "enabled": true,
                "liquidity": "150000.000000000000000000",
                "liquidity_status": "medium",
                "apr": "0.120000000000000000",
                "minimum_amount": "50.000000000000000000",
                "maximum_amount": "150000.000000000000000000",
                "created_at": "2024-07-16T15:49:30.646Z",
                "updated_at": "2024-07-16T15:49:30.646Z"
            }
        ]
    }
}
```

**Bit2Me API:** `GET /v1/loan/currency/configuration`

### loan_get_movements

> Get loan movement history with full details. Returns movements with type (approve, repay, liquidate, interest), nested loan/guarantee objects with fiat values, and LTV tracking. Optional order_id filter. Use to track loan lifecycle events. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
        "limit": 10,
        "offset": 0
    },
    "result": [
        {
            "id": "1b3aa379-0262-48eb-970d-da6b89882c67",
            "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
            "type": "approve",
            "status": "completed",
            "loan": {
                "amount": "50750.00",
                "symbol": "EURR",
                "amount_fiat": "50749.95"
            },
            "guarantee": {
                "amount": "1.00000000",
                "symbol": "BTC",
                "amount_fiat": "101499.90"
            },
            "ltv": "0.50",
            "previous_ltv": "0.50",
            "created_at": "2025-07-27T16:24:00.118Z"
        }
    ],
    "metadata": {
        "total_records": 28,
        "limit": 10,
        "offset": 0,
        "has_more": true
    }
}
```

**Bit2Me API:** `GET /v1/loan/movements`

### loan_get_orders

> Get all loan orders with full details including LTV, APR, interest, and fiat values. Use this to monitor loan health (LTV), track payments, and calculate costs. Optional order_id filter for specific loan. [PRIVATE]

#### Example Response

```json
{
    "request": {
        "limit": 5,
        "offset": 0
    },
    "result": [
        {
            "id": "fb930f0c-8e90-403a-95e4-112394183cf2",
            "status": "active",
            "guarantee_symbol": "BTC",
            "guarantee_amount": "1.0",
            "guarantee_amount_fiat": "76854.8",
            "loan_symbol": "EUR",
            "loan_amount": "52220.14",
            "loan_original_amount": "50750.0",
            "loan_amount_fiat": "52214.92",
            "ltv": "0.6791",
            "apr": "0.17",
            "interest_amount": "1470.14",
            "remaining_amount": "52220.14",
            "payback_amount": "0",
            "created_at": "2025-07-27T16:23:59.876Z",
            "started_at": "2025-07-27T16:24:00.119Z",
            "expires_at": "2025-07-30T16:23:59.872Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

**Bit2Me API:** `GET /v1/loan/orders`

### loan_create

> Create a new loan by providing cryptocurrency as guarantee (collateral) to receive loan currency (can be any supported currency like USDC, EURC, or fiat). Specify amount_type to determine calculation mode: 'fixed_collateral' (guarantee amount is fixed, loan amount is calculated) or 'fixed_loan' (loan amount is fixed, guarantee amount is calculated). This avoids mathematical errors where the model tries to guess the exact LTV manually. Returns loan order details with status. [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
    - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
- **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
- **`ltv`** (string) **(required)**: Loan-to-Value ratio as string (1.0 = 100%)
- **`apr`** (string) **(required)**: Annual Percentage Rate as string
- **`created_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the resource was created

#### Example Response

```json
{
    "request": {
        "guarantee_symbol": "BTC",
        "loan_symbol": "EUR",
        "amount_type": "fixed_collateral",
        "guarantee_amount": "0.5"
    },
    "result": {
        "id": "loan123-...",
        "status": "active",
        "guarantee_symbol": "BTC",
        "guarantee_amount": "0.5",
        "loan_symbol": "EUR",
        "loan_amount": "15000.00",
        "ltv": "0.65",
        "apr": "0.15",
        "created_at": "2024-11-25T10:00:00.000Z"
    }
}
```

**Bit2Me API:** `POST /v1/loan`

### loan_increase_guarantee

> Increase the guarantee (collateral) amount for an existing loan. This improves the LTV ratio and reduces risk. Returns updated loan details. Use loan_get_orders first to get the order ID. [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`new_ltv`** (string) **(required)**: New Loan-to-Value ratio after the operation (lower is safer)
- **`updated_at`** (string (date-time)) **(required)**: ISO 8601 date/time when the resource was last updated
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "order_id": "loan-order-uuid-1234",
        "guarantee_amount": "0.5"
    },
    "result": {
        "id": "loan123-...",
        "guarantee_amount": "1.5",
        "new_ltv": "0.43",
        "updated_at": "2024-11-25T10:30:00.000Z",
        "message": "Guarantee increased successfully"
    }
}
```

**Bit2Me API:** `POST /v1/loan/orders/:id/guarantee/increase`

### loan_payback

> Pay back (return) part or all of a loan. Reduces the loan amount and may release guarantee if fully paid. Returns updated loan details. Use loan_get_orders to get the order ID, or loan_get_orders with order_id filter to check current loan amount and details. [PRIVATE]

#### Response Fields

- **`id`** (string (uuid)) **(required)**: Unique identifier (UUID)
- **`remaining_amount`** (string) **(required)**: Outstanding loan balance including interest
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
    - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`message`** (string) **(required)**: Human-readable status or confirmation message

#### Example Response

```json
{
    "request": {
        "order_id": "loan-order-uuid-1234",
        "payback_amount": "10000.00"
    },
    "result": {
        "id": "loan123-...",
        "remaining_amount": "40000.00",
        "status": "active",
        "message": "Payback successful"
    }
}
```

**Bit2Me API:** `POST /v1/loan/orders/:id/payback`

---

## Additional Resources

- **Source of truth**: [`data/tools.json`](./data/tools.json) contains all tool definitions, input schemas, response schemas and examples.
- **Landing page**: The [landing site](./landing/index.html) is auto-generated from the same source.
- **Regenerate docs**: Run `npm run build:docs` after modifying `data/tools.json`.

---

_Auto-generated on 2025-12-07._
