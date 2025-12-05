# Tool Response Schemas

Este documento muestra la estructura JSON exacta que devuelve cada tool del MCP Bit2Me, incluyendo descripciones detalladas de cada campo y sus posibles valores.

## Tool Count (53 total)

- 1 Market Data Tools
- 7 Broker (Simple Trading) Tools
- 8 Wallet (Storage) Tools
- 14 Pro (Advanced Trading) Tools
- 13 Earn (Staking) Tools
- 8 Loans Tools
- 1 Account Tools
- 1 Portfolio Tools

_Nota: Las herramientas de operaciones (write actions) están incluidas en sus respectivas categorías._

---

## Market Data Tools (1 tool)

> **Note:** Asset information and details. For broker prices and trading, see Broker Tools. For Pro Trading market data, see Pro Trading Tools.

### market_get_assets_details

#### Response Fields

- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`name`** (string) **(required)**: Human-readable pocket name or currency name
- **`type`** (string) **(required)**: Order type: "limit" executes at specified price or better, "market" executes immediately at best available price, "stop-limit" triggers when stop price is reached
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

---

## Broker (Simple Trading) Tools (7 tools)

> **Note:** Tools for simple trading operations and broker prices. Includes market data (prices, charts) and trading actions (buy, sell, swap) for the Wallet/Broker service. These prices include spread and are different from Pro Trading prices.

### broker_get_price

#### Response Fields

- Array of object
  - **`base_symbol`** (string) **(required)**: Base cryptocurrency symbol in uppercase (e.g., BTC, ETH)
  - **`quote_symbol`** (string) **(required)**: Quote currency symbol in uppercase (e.g., EUR, USD)
  - **`date`** (string) **(required)**: ISO 8601 date/time when the rate was recorded
    - Format: `date-time`
  - **`price`** (string) **(required)**: Price of one unit of base_symbol in quote_symbol (as string for precision)

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

### broker_get_info

#### Response Fields

- **`base_symbol`** (string) **(required)**: Base cryptocurrency symbol in uppercase (e.g., BTC, ETH)
- **`quote_symbol`** (string) **(required)**: Quote currency symbol in uppercase (e.g., EUR, USD)
- **`date`** (string) **(required)**: ISO 8601 date/time when the data was recorded
  - Format: `date-time`
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

### broker_get_chart

#### Response Fields

- Array of object
  - **`date`** (string) **(required)**: ISO 8601 date/time for this data point
    - Format: `date-time`
  - **`price`** (string) **(required)**: Price at this point in time in the quote symbol from the pair (as string for precision)

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

### broker_quote_buy

#### Response Fields

- **`proforma_id`** (string) **(required)**: Proforma UUID
- **`origin_amount`** (string) **(required)**: origin amount
- **`origin_symbol`** (string) **(required)**: origin symbol
- **`destination_amount`** (string) **(required)**: destination amount
- **`destination_symbol`** (string) **(required)**: destination symbol
- **`rate`** (string) **(required)**: Exchange rate as string for precision
- **`fee`** (string) **(required)**: Fee amount as string for precision
- **`expires_at`** (string) **(required)**: ISO 8601 date/time when the resource expires
  - Format: `date-time`

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

### broker_quote_sell

#### Response Fields

- **`proforma_id`** (string) **(required)**: Proforma UUID
- **`origin_amount`** (string) **(required)**: origin amount
- **`origin_symbol`** (string) **(required)**: origin symbol
- **`destination_amount`** (string) **(required)**: destination amount
- **`destination_symbol`** (string) **(required)**: destination symbol
- **`rate`** (string) **(required)**: Exchange rate as string for precision
- **`fee`** (string) **(required)**: Fee amount as string for precision
- **`expires_at`** (string) **(required)**: ISO 8601 date/time when the resource expires
  - Format: `date-time`

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

### broker_quote_swap

#### Response Fields

- **`proforma_id`** (string) **(required)**: Proforma UUID
- **`origin_amount`** (string) **(required)**: origin amount
- **`origin_symbol`** (string) **(required)**: origin symbol
- **`destination_amount`** (string) **(required)**: destination amount
- **`destination_symbol`** (string) **(required)**: destination symbol
- **`rate`** (string) **(required)**: Exchange rate as string for precision
- **`fee`** (string) **(required)**: Fee amount as string for precision
- **`expires_at`** (string) **(required)**: ISO 8601 date/time when the resource expires
  - Format: `date-time`

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

### broker_confirm_quote

#### Response Fields

- **`movement_id`** (string) **(required)**: Movement UUID
- **`type`** (string) **(required)**: Movement type
  - Possible values: `"deposit"`, `"withdrawal"`, `"swap"`, `"purchase"`, `"transfer"`, `"fee"`, `"other"`
- **`status`** (string) **(required)**: Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
  - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`origin_amount`** (string) **(required)**: origin amount
- **`origin_symbol`** (string) **(required)**: origin symbol
- **`destination_amount`** (string) **(required)**: destination amount
- **`destination_symbol`** (string) **(required)**: destination symbol
- **`fee`** (string) **(required)**: Fee amount as string for precision
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the movement was created
  - Format: `date-time`

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

---

## Wallet (Storage) Tools (8 tools)

> **Note:** Tools for managing wallet balances, movements, addresses, and cards. For trading operations, see Broker Tools.

### wallet_get_pockets

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`balance`** (string) **(required)**: Current balance as string for precision
  - **`available`** (string) **(required)**: Available balance as string for precision
  - **`name`** (string) **(required)**: Human-readable pocket name or currency name

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
            "name": "EUR Wallet"
        },
        {
            "id": "def456-abc123-...",
            "symbol": "BTC",
            "balance": "0.5",
            "available": "0.5"
        }
    ],
    "metadata": {
        "total_records": 2
    }
}
```

### wallet_get_pocket_details

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`balance`** (string) **(required)**: Current balance as string for precision
- **`available`** (string) **(required)**: Available balance as string for precision
- **`blocked`** (string) **(required)**: Blocked balance as string for precision
- **`name`** (string) **(required)**: Human-readable pocket name or currency name
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`

#### Example Response

```json
{
    "request": {
        "pocket_id": "pocket-uuid-1234-5678"
    },
    "result": {
        "id": "abc123-def456-...",
        "symbol": "EUR",
        "balance": "1250.50",
        "available": "1200.00",
        "blocked": "50.50",
        "name": "EUR Wallet",
        "created_at": "2021-01-19T20:24:59.209Z"
    }
}
```

### wallet_get_pocket_addresses

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`address`** (string) **(required)**: Blockchain address for receiving deposits on the specified network
  - **`network`** (string) **(required)**: Blockchain network for deposits/withdrawals (e.g., bitcoin, ethereum, polygon)
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`tag`** (string): tag
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`

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

### wallet_get_networks

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`name`** (string) **(required)**: Human-readable pocket name or currency name
  - **`native_currency_code`** (string) **(required)**: native currency code
  - **`fee_currency_code`** (string) **(required)**: fee currency code
  - **`has_tag`** (boolean) **(required)**: If true, deposits require a memo/tag in addition to the address (common for XRP, XLM)

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

### wallet_get_cards

#### Response Fields

- Array of object
  - **`card_id`** (string) **(required)**: Unique identifier for the payment card
  - **`type`** (string) **(required)**: Card type (e.g., "credit", "debit")
  - **`brand`** (string) **(required)**: Card network brand (e.g., "visa", "mastercard")
  - **`country`** (string) **(required)**: Country code where the card was issued
  - **`last4`** (string) **(required)**: Last 4 digits of the card number for identification
  - **`expire_month`** (string) **(required)**: Card expiration month (01-12)
  - **`expire_year`** (string) **(required)**: Card expiration year (4 digits)
  - **`alias`** (string) **(required)**: User-defined alias for the card
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the card was registered
    - Format: `date-time`

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

### wallet_get_movements

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`
  - **`type`** (string) **(required)**: Type of the resource or operation
    - Possible values: `"deposit"`, `"withdrawal"`, `"swap"`, `"purchase"`, `"transfer"`, `"fee"`, `"other"`
  - **`subtype`** (string) **(required)**: subtype
  - **`status`** (string) **(required)**: Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`origin`** (object) **(required)**: origin
  - **`destination`** (object) **(required)**: destination
  - **`fee`** (object) **(required)**: Fee amount as string for precision

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

### wallet_get_movement_details

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`date`** (string) **(required)**: ISO 8601 date/time
  - Format: `date-time`
- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`subtype`** (string) **(required)**: subtype
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`amount`** (string) **(required)**: Amount as string for precision
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`origin`** (object) **(required)**: origin
- **`destination`** (object) **(required)**: destination
- **`fee`** (object) **(required)**: Fee amount as string for precision

#### Example Response

```json
{
    "request": {
        "movement_id": "tx-uuid-1234-5678"
    },
    "result": {
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
}
```

### wallet_get_movements

#### Response Fields

- **`proforma_id`** (string) **(required)**: Proforma UUID
- **`origin_amount`** (string) **(required)**: origin amount
- **`origin_symbol`** (string) **(required)**: origin symbol
- **`destination_amount`** (string) **(required)**: destination amount
- **`destination_symbol`** (string) **(required)**: destination symbol
- **`rate`** (string) **(required)**: Exchange rate as string for precision
- **`fee`** (string) **(required)**: Fee amount as string for precision
- **`expires_at`** (string) **(required)**: ISO 8601 date/time when the resource expires
  - Format: `date-time`

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

---

## Pro (Advanced Trading) Tools (14 tools)

### pro_get_balance

#### Response Fields

- Array of object
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`balance`** (string) **(required)**: Current balance as string for precision
  - **`blocked_balance`** (string) **(required)**: blocked balance
  - **`available`** (string) **(required)**: Available balance as string for precision

#### Example Response

```json
{
    "request": {},
    "result": [
        {
            "symbol": "BTC",
            "balance": "0.00689471",
            "blocked_balance": "0.00011102",
            "available": "0.00689471"
        },
        {
            "symbol": "EUR",
            "balance": "27812.0234142",
            "blocked_balance": "0",
            "available": "27812.0234142"
        }
    ],
    "metadata": {
        "total_records": 2
    }
}
```

### pro_get_open_orders

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
  - **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
    - Possible values: `"buy"`, `"sell"`
  - **`type`** (string) **(required)**: Type of the resource or operation
    - Possible values: `"limit"`, `"market"`, `"stop-limit"`
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
  - **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
    - Possible values: `"open"`, `"filled"`, `"cancelled"`
  - **`filled_amount`** (string) **(required)**: Amount of the order that has been executed (as string for precision)
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`

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

### pro_get_trades

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`order_id`** (string) **(required)**: Unique identifier (UUID) for the order
  - **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
  - **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
    - Possible values: `"buy"`, `"sell"`
  - **`order_type`** (string) **(required)**: order type
  - **`fee`** (string) **(required)**: Fee amount as string for precision
  - **`fee_symbol`** (string) **(required)**: fee symbol
  - **`cost`** (string) **(required)**: Total cost of executed trades in quote currency (price × filled_amount)
  - **`is_maker`** (boolean) **(required)**: true if the order added liquidity (maker), false if it removed liquidity (taker). Makers typically get lower fees
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`

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

### pro_get_order_trades

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`order_id`** (string) **(required)**: Unique identifier (UUID) for the order
  - **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
  - **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`fee`** (string) **(required)**: Fee amount as string for precision
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`

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

### pro_get_order_details

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
- **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
  - Possible values: `"buy"`, `"sell"`
- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`amount`** (string) **(required)**: Amount as string for precision
- **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`filled_amount`** (string) **(required)**: Amount of the order that has been executed (as string for precision)
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`

#### Example Response

```json
{
    "request": {
        "order_id": "order-uuid-1234-5678"
    },
    "result": {
        "id": "order123",
        "pair": "BTC-USD",
        "side": "buy",
        "type": "limit",
        "amount": "0.1",
        "price": "75000.00",
        "status": "filled",
        "filled_amount": "0.1",
        "created_at": "2024-11-25T10:00:00.000Z"
    }
}
```

### pro_create_order

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
- **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
  - Possible values: `"buy"`, `"sell"`
- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`amount`** (string) **(required)**: Amount as string for precision
- **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "side": "buy",
        "type": "limit",
        "amount": 0.1,
        "price": 60000
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

### pro_cancel_order

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`message`** (string) **(required)**: message

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

### pro_cancel_all_orders

#### Response Fields

- **`cancelled`** (number) **(required)**: cancelled
- **`message`** (string) **(required)**: message

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

### pro_deposit

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
  - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: message

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

### pro_withdraw

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
  - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: message

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

### pro_get_market_config

#### Response Fields

- Array of object
  - **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
  - **`base_precision`** (number) **(required)**: base precision
  - **`quote_precision`** (number) **(required)**: quote precision
  - **`min_amount`** (string) **(required)**: Minimum order amount allowed in base currency
  - **`max_amount`** (string) **(required)**: Maximum order amount allowed in base currency
  - **`status`** (string) **(required)**: Current order status
    - Possible values: `"open"`, `"filled"`, `"cancelled"`, `"inactive"`

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD"
    },
    "result": [
        {
            "pair": "BTC-USD",
            "base_precision": 8,
            "quote_precision": 2,
            "min_amount": "0.0001",
            "max_amount": "100",
            "status": "active"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

### pro_get_order_book

#### Response Fields

- **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
- **`bids`** (array) **(required)**: Array of buy orders sorted by price (highest first). Each bid represents demand at that price level
  - Array items: [object Object]
- **`asks`** (array) **(required)**: Array of sell orders sorted by price (lowest first). Each ask represents supply at that price level
  - Array items: [object Object]
- **`date`** (string) **(required)**: ISO 8601 date/time
  - Format: `date-time`

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

### pro_get_public_trades

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`pair`** (string) **(required)**: Trading pair in BASE-QUOTE format (e.g., BTC-USD)
  - **`price`** (string) **(required)**: Order price in quote currency (as string for precision). For limit orders, this is the target price
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`side`** (string) **(required)**: Order direction: "buy" to purchase base currency, "sell" to dispose base currency
    - Possible values: `"buy"`, `"sell"`
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`

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

### pro_get_candles

#### Response Fields

- Array of object
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`
  - **`open`** (string) **(required)**: Opening price at the start of the time period
  - **`high`** (string) **(required)**: Highest price reached during the time period
  - **`low`** (string) **(required)**: Lowest price reached during the time period
  - **`close`** (string) **(required)**: Closing price at the end of the time period
  - **`volume`** (string) **(required)**: Total trading volume during the time period in base currency

#### Example Response

```json
{
    "request": {
        "pair": "BTC-USD",
        "timeframe": "1h",
        "limit": 5
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

---

## Earn (Staking) Tools (13 tools)

### earn_get_summary

#### Response Fields

- Array of object
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`total_balance`** (string) **(required)**: total balance
  - **`total_rewards`** (string) **(required)**: total rewards

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

### earn_get_positions

#### Response Fields

- Array of object
  - **`position_id`** (string) **(required)**: Earn position unique identifier
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, B2M)
  - **`balance`** (string) **(required)**: Current balance as string for precision
  - **`strategy`** (string) **(required)**: Staking strategy (e.g., flexible, fixed)
  - **`lock_period`** (object): Lock period information (if applicable)
    - **`lock_period_id`** (string): Lock period identifier
    - **`months`** (number): Number of months locked

  - **`converted_balance`** (object): Balance converted to fiat currency
    - **`value`** (string): Converted balance value
    - **`symbol`** (string): Fiat currency symbol (e.g., EUR, USD)

  - **`created_at`** (string): ISO 8601 date/time when the wallet was created
    - Format: `date-time`
  - **`updated_at`** (string): ISO 8601 date/time when the wallet was last updated
    - Format: `date-time`

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

### earn_get_position_details

#### Response Fields

- **`position_id`** (string) **(required)**: Earn position unique identifier
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, B2M)
- **`balance`** (string) **(required)**: Current balance as string for precision
- **`strategy`** (string) **(required)**: Staking strategy (e.g., flexible, fixed)
- **`lock_period`** (object): Lock period information (if applicable)
  - **`lock_period_id`** (string): Lock period identifier
  - **`months`** (number): Number of months locked

- **`converted_balance`** (object): Balance converted to fiat currency
  - **`value`** (string): Converted balance value
  - **`symbol`** (string): Fiat currency symbol (e.g., EUR, USD)

- **`created_at`** (string): ISO 8601 date/time when the position was created
  - Format: `date-time`
- **`updated_at`** (string): ISO 8601 date/time when the position was last updated
  - Format: `date-time`

#### Example Response

```json
{
    "request": {
        "position_id": "earn-position-uuid-1234"
    },
    "result": {
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
}
```

### earn_get_position_movements

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`type`** (string) **(required)**: Type of the resource or operation
    - Possible values: `"deposit"`, `"withdrawal"`, `"reward"`, `"fee"`
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`
  - **`position_id`** (string) **(required)**: Unique identifier (UUID) for the Earn position
  - **`status`** (string) **(required)**: Current order status
    - Possible values: `"open"`, `"filled"`, `"cancelled"`, `"inactive"`

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

### earn_get_movements

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`type`** (string) **(required)**: Type of the resource or operation
    - Possible values: `"deposit"`, `"reward"`, `"withdrawal"`, `"discount-funds"`, `"discount-rewards"`, `"fee"`
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`
  - **`position_id`** (string): Unique identifier (UUID) for the Earn position
  - **`amount`** (object) **(required)**: Amount as string for precision
  - **`rate`** (object) **(required)**: Exchange rate as string for precision
  - **`converted_amount`** (object) **(required)**: converted amount
  - **`source`** (object) **(required)**: source
  - **`issuer`** (object) **(required)**: issuer

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

### earn_get_movements_summary

#### Response Fields

- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`total_amount`** (string) **(required)**: total amount
- **`total_count`** (number) **(required)**: total count
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

### earn_get_assets

#### Response Fields

- **`symbols`** (array) **(required)**: symbols
  - Array items: string

#### Example Response

```json
{
    "request": {},
    "result": {
        "symbols": [
            "BTC",
            "ETH",
            "USDC",
            "USDT",
            "ADA",
            "DOT"
        ]
    }
}
```

### earn_get_apy

#### Response Fields

- **`BTC`** (object) **(required)**: BTC

#### Example Response

```json
{
    "request": {
        "symbol": "BTC"
    },
    "result": {
        "BTC": {
            "symbol": "BTC",
            "rates": {
                "daily_yield_ratio": "0.0001",
                "weekly_yield_ratio": "0.000099999917563314",
                "monthly_yield_ratio": "0.000099999597052597"
            }
        }
    }
}
```

### earn_get_rewards_config

#### Response Fields

- Array of object
  - **`position_id`** (string) **(required)**: Unique identifier (UUID) for the Earn position
  - **`user_id`** (string) **(required)**: User identifier who owns the wallet
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`lock_period_id`** (string): Identifier for the staking lock period configuration
    - Can be `null`
  - **`reward_symbol`** (string) **(required)**: Currency symbol in which staking rewards are paid
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`
  - **`updated_at`** (string) **(required)**: ISO 8601 date/time when the resource was last updated
    - Format: `date-time`

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

### earn_get_position_rewards_config

#### Response Fields

- **`position_id`** (string): Unique identifier (UUID) for the Earn position
- **`user_id`** (string) **(required)**: User identifier who owns the wallet
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`lock_period_id`** (string): Identifier for the staking lock period configuration
  - Can be `null`
- **`reward_symbol`** (string) **(required)**: Currency symbol in which staking rewards are paid
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`
- **`updated_at`** (string) **(required)**: ISO 8601 date/time when the resource was last updated
  - Format: `date-time`

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

### earn_get_position_rewards_summary

#### Response Fields

- **`reward_symbol`** (string) **(required)**: Currency symbol in which staking rewards are paid
- **`reward_amount`** (string) **(required)**: Total accumulated rewards amount (as string for precision)
- **`reward_converted_symbol`** (string) **(required)**: reward converted symbol
- **`reward_converted_amount`** (string) **(required)**: reward converted amount

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

### earn_deposit

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
  - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: message

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

### earn_withdraw

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`type`** (string) **(required)**: Type of the resource or operation
  - Possible values: `"limit"`, `"market"`, `"stop-limit"`
- **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
- **`amount`** (string) **(required)**: Amount as string for precision
- **`status`** (string) **(required)**: Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
  - Possible values: `"pending"`, `"completed"`, `"failed"`
- **`message`** (string) **(required)**: message

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

---

## Loans Tools (8 tools)

### loan_get_simulation

#### Response Fields

- **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`guarantee_amount_converted`** (string) **(required)**: guarantee amount converted
- **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
- **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
- **`loan_amount_converted`** (string) **(required)**: loan amount converted
- **`user_symbol`** (string) **(required)**: user symbol
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

### loan_get_config

#### Response Fields

- **`guarantee_currencies`** (array) **(required)**: guarantee currencies
  - Array items: [object Object]
- **`loan_currencies`** (array) **(required)**: loan currencies
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

### loan_get_movements

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`order_id`** (string) **(required)**: Unique identifier (UUID) for the order
  - **`type`** (string) **(required)**: Type of the resource or operation
    - Possible values: `"payment"`, `"interest"`, `"guarantee_change"`, `"liquidation"`, `"other"`
  - **`amount`** (string) **(required)**: Amount as string for precision
  - **`symbol`** (string) **(required)**: Asset symbol in uppercase (e.g., BTC, ETH, EUR)
  - **`date`** (string) **(required)**: ISO 8601 date/time
    - Format: `date-time`
  - **`status`** (string) **(required)**: Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)
    - Possible values: `"pending"`, `"completed"`, `"failed"`

#### Example Response

```json
{
    "request": {
        "order_id": "loan-order-uuid-1234",
        "limit": 10,
        "offset": 0
    },
    "result": [
        {
            "id": "mov123-...",
            "order_id": "loan-order-uuid-1234",
            "type": "payment",
            "amount": "100.00",
            "symbol": "EUR",
            "date": "2024-11-25T10:30:00.000Z",
            "status": "completed"
        }
    ],
    "metadata": {
        "total_records": 50,
        "limit": 10,
        "offset": 0,
        "has_more": true
    }
}
```

### loan_get_orders

#### Response Fields

- Array of object
  - **`id`** (string) **(required)**: Unique identifier
  - **`status`** (string) **(required)**: Current order status
    - Possible values: `"active"`, `"completed"`, `"expired"`
  - **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
  - **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
  - **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
  - **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
  - **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
    - Format: `date-time`

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
            "guarantee_amount": "1.000000000000000000",
            "loan_symbol": "EUR",
            "loan_amount": "52100.455127197287622924",
            "created_at": "2025-07-27T16:23:59.876Z"
        }
    ],
    "metadata": {
        "total_records": 1
    }
}
```

### loan_get_order_details

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
- **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
- **`remaining_amount`** (string) **(required)**: Outstanding loan balance including interest
- **`ltv`** (string) **(required)**: Loan-to-Value ratio as string (1.0 = 100%)
- **`apr`** (string) **(required)**: Annual Percentage Rate as string
- **`liquidation_price`** (string) **(required)**: liquidation price
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`
- **`expires_at`** (string) **(required)**: ISO 8601 date/time when the resource expires
  - Format: `date-time`

#### Example Response

```json
{
    "request": {
        "order_id": "order-uuid-1234-5678"
    },
    "result": {
        "id": "fb930f0c-8e90-403a-95e4-112394183cf2",
        "status": "active",
        "guarantee_symbol": "BTC",
        "guarantee_amount": "1.000000000000000000",
        "loan_symbol": "EUR",
        "loan_amount": "52100.455127197287622924",
        "remaining_amount": "52100.455127197287622924",
        "ltv": "0.6863",
        "apr": "0.1700",
        "liquidation_price": "61258.249847058816304395",
        "created_at": "2025-07-27T16:23:59.876Z",
        "expires_at": "2025-07-30T16:23:59.872Z"
    }
}
```

### loan_create

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`guarantee_symbol`** (string) **(required)**: Cryptocurrency symbol used as collateral (e.g., BTC, ETH)
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`loan_symbol`** (string) **(required)**: Currency symbol in which the loan is denominated (e.g., USDC, EUR)
- **`loan_amount`** (string) **(required)**: Principal loan amount (as string for precision)
- **`ltv`** (string) **(required)**: Loan-to-Value ratio as string (1.0 = 100%)
- **`apr`** (string) **(required)**: Annual Percentage Rate as string
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`

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

### loan_increase_guarantee

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`guarantee_amount`** (string) **(required)**: Amount of collateral deposited (as string for precision)
- **`new_ltv`** (string) **(required)**: new ltv
- **`updated_at`** (string) **(required)**: ISO 8601 date/time when the resource was last updated
  - Format: `date-time`
- **`message`** (string) **(required)**: message

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

### loan_payback

#### Response Fields

- **`id`** (string) **(required)**: Unique identifier
- **`remaining_amount`** (string) **(required)**: Outstanding loan balance including interest
- **`status`** (string) **(required)**: Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)
  - Possible values: `"open"`, `"filled"`, `"cancelled"`
- **`message`** (string) **(required)**: message

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

---

## Account Tools (1 tools)

### account_get_info

#### Response Fields

- **`user_id`** (string) **(required)**: User identifier who owns the wallet
- **`email`** (string) **(required)**: email
- **`level`** (string) **(required)**: level
- **`kyc_status`** (string) **(required)**: kyc status
- **`created_at`** (string) **(required)**: ISO 8601 date/time when the resource was created
  - Format: `date-time`
- **`features`** (object) **(required)**: features

#### Example Response

```json
{
    "request": {},
    "result": {
        "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
        "email": "user@example.com",
        "level": "verified",
        "kyc_status": "approved",
        "created_at": "2021-01-19T20:24:59.209Z",
        "features": {
            "trading": true,
            "earn": true,
            "loans": true
        }
    }
}
```

---

## Portfolio Tools (1 tools)

### portfolio_get_valuation

#### Response Fields

- **`quote_symbol`** (string) **(required)**: Quote currency symbol in uppercase (e.g., EUR, USD)
- **`total_value`** (string) **(required)**: total value
- **`by_service`** (object) **(required)**: by service
- **`details`** (array) **(required)**: details
  - Array items: [object Object]

#### Example Response

```json
{
    "request": {
        "quote_symbol": "EUR"
    },
    "result": {
        "quote_symbol": "EUR",
        "total_value": "771789.52",
        "by_service": {
            "wallet": "500000.00",
            "pro": "150000.00",
            "earn": "100000.00",
            "loan_guarantees": "21789.52"
        },
        "details": [
            {
                "symbol": "BTC",
                "balance": "8.657983471809322",
                "price_unit": "75936.5",
                "converted_balance": "657456.96"
            },
            {
                "symbol": "B2M",
                "balance": "3205806.09708881",
                "price_unit": "0.0099566",
                "converted_balance": "31918.93"
            },
            {
                "symbol": "DOGE",
                "balance": "232444.85337828",
                "price_unit": "0.1290807",
                "converted_balance": "30004.14"
            }
        ]
    }
}
```

---

