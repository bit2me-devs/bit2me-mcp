# Tool Response Schemas

Este documento muestra la estructura JSON exacta que devuelve cada tool del MCP Bit2Me.

## Tool Count (51 total)

- 4 Wallet Market Data Tools
- 8 Wallet Tools
- 13 Earn Tools
- 9 Loan Tools
- 14 Pro Trading Tools
- 1 Account Tool
- 1 Aggregation Tool

_Nota: Las herramientas de operaciones (write actions) están incluidas en sus respectivas categorías._

---

## Wallet Market Data Tools (4 tools)

> **Note:** These tools return market prices and data used by the **Wallet/Broker** service, not Pro Trading prices. For Pro Trading market data (order books, candles, public trades), see the **Pro Trading Tools** section below.

### market_get_ticker

```json
[
    {
        "base_symbol": "BTC",
        "price": "90000",
        "quote_symbol": "EUR",
        "date": "2023-01-01T00:00:00.000Z"
    }
]
```

### market_get_data

```json
{
    "base_symbol": "BTC",
    "quote_symbol": "EUR",
    "date": "2025-11-25T10:30:00.258Z",
    "price": "75869.89",
    "market_cap": "1510730550631.13",
    "volume_24h": "62022281357.81",
    "max_supply": "21000000",
    "total_supply": "19953446"
}
```

### market_get_chart

```json
[
    {
        "date": "2024-11-25T10:30:00.000Z",
        "price": "72145.32",
        "quote_symbol": "EUR"
    },
    {
        "date": "2024-11-26T14:45:00.000Z",
        "price": "72489.56",
        "quote_symbol": "EUR"
    }
]
```

### market_get_assets_details

**Without symbol parameter (returns all assets):**

```json
[
    {
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "crypto",
        "network": "bitcoin",
        "enabled": true,
        "tradeable": true,
        "loanable": true,
        "pairs_with": ["EUR"]
    },
    {
        "symbol": "ETH",
        "name": "Ethereum",
        "type": "crypto",
        "network": "ethereum",
        "enabled": true,
        "tradeable": true,
        "loanable": true,
        "pairs_with": ["EUR"]
    }
]
```

**With symbol parameter (returns single asset):**

```json
{
    "symbol": "BTC",
    "name": "Bitcoin",
    "type": "crypto",
    "network": "bitcoin",
    "enabled": true,
    "tradeable": true,
    "loanable": true,
    "pairs_with": ["EUR"]
}
```

---

## Wallet Tools (8 tools)

### wallet_get_pockets

```json
[
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
]
```

### wallet_get_pocket_details

```json
{
    "id": "abc123-def456-...",
    "symbol": "EUR",
    "balance": "1250.50",
    "available": "1200.00",
    "blocked": "50.50",
    "name": "EUR Wallet",
    "created_at": "2021-01-19T20:24:59.209Z"
}
```

### wallet_get_pocket_addresses

```json
[
    {
        "id": "addr123-...",
        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "network": "bitcoin",
        "symbol": "BTC",
        "tag": "",
        "created_at": "2021-01-19T20:24:59.209Z"
    }
]
```

### wallet_get_networks

```json
[
    {
        "id": "bitcoin",
        "name": "bitcoin",
        "native_symbol": "BTC",
        "fee_symbol": "BTC",
        "has_tag": false
    }
]
```

### wallet_get_movements

```json
{
    "metadata": {
        "total_records": 150,
        "limit": 10,
        "offset": 0,
        "has_more": true,
        "is_empty": false,
        "filter_symbol": "EUR"
    },
    "movements": [
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
    ]
}
```

### wallet_get_movement_details

```json
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
```

### wallet_buy_crypto

```json
{
    "proforma_id": "proforma123-...",
    "origin_amount": "100.00",
    "origin_symbol": "EUR",
    "destination_amount": "0.00131579",
    "destination_symbol": "BTC",
    "rate": "75869.89",
    "fee": "0.50",
    "expires_at": "2024-11-25T10:35:00.000Z"
}
```

### wallet_sell_crypto

```json
{
    "proforma_id": "proforma123-...",
    "origin_amount": "0.001",
    "origin_symbol": "BTC",
    "destination_amount": "75.87",
    "destination_symbol": "EUR",
    "rate": "75869.89",
    "fee": "0.50",
    "expires_at": "2024-11-25T10:35:00.000Z"
}
```

### wallet_swap_crypto

```json
{
    "proforma_id": "proforma123-...",
    "origin_amount": "0.001",
    "origin_symbol": "BTC",
    "destination_amount": "0.025",
    "destination_symbol": "ETH",
    "rate": "0.04",
    "fee": "0.0001",
    "expires_at": "2024-11-25T10:35:00.000Z"
}
```

### wallet_buy_crypto_with_card

```json
{
    "proforma_id": "proforma123-...",
    "origin_amount": "100.00",
    "origin_symbol": "EUR",
    "destination_amount": "0.00131579",
    "destination_symbol": "BTC",
    "rate": "75869.89",
    "fee": "0.50",
    "expires_at": "2024-11-25T10:35:00.000Z"
}
```

### wallet_confirm_operation

```json
{
    "id": "tx123-...",
    "status": "completed",
    "message": "✅ Operación confirmada. ID: tx123-..."
}
```

---

## Earn Tools (13 tools)

### earn_get_summary

```json
[
    {
        "symbol": "BTC",
        "total_balance": "0.5",
        "total_rewards": "0.0001"
    }
]
```

### earn_get_wallets

```json
[
    {
        "id": "earn123-...",
        "symbol": "BTC",
        "balance": "0.5",
        "strategy": "flexible",
        "status": "active",
        "created_at": "2021-01-19T20:24:59.209Z",
,
        "total_balance": "0.5"
    }
]
```

### earn_get_wallet_details

```json
{
    "id": "earn123-...",
    "symbol": "BTC",
    "balance": "0.5",
    "strategy": "flexible",
    "status": "active",
    "created_at": "2021-01-19T20:24:59.209Z",
,
    "total_balance": "0.5"
}
```

### earn_get_wallet_movements

```json
{
    "metadata": {
        "total_records": 25,
        "limit": 10,
        "offset": 0,
        "has_more": true,
        "is_empty": false
    },
    "movements": [
        {
            "id": "mov123-...",
            "type": "deposit",
            "symbol": "BTC",
            "amount": "0.1",
            "created_at": "2024-11-25T10:30:00.000Z",
            "wallet_id": "earn123-..."
        }
    ]
}
```

### earn_get_movements

```json
{
    "metadata": {
        "total_records": 100,
        "limit": 20,
        "offset": 0,
        "has_more": true,
        "is_empty": false
    },
    "movements": [
        {
            "id": "mov123-...",
            "type": "deposit",
            "created_at": "2024-11-25T10:30:00.000Z",
            "wallet_id": "earn123-...",
            "amount": {
                "value": "0.1",
                "symbol": "BTC"
            },
            "rate": {
                "amount": {
                    "value": "75869.89",
                    "symbol": "EUR"
                },
                "pair": "BTC/EUR"
            },
            "converted_amount": {
                "value": "7586.99",
                "symbol": "EUR"
            },
            "source": {
                "wallet_id": "pocket123-...",
                "symbol": "BTC"
            },
            "issuer": {
                "id": "issuer123",
                "name": "Bit2Me",
                "integrator": "bit2me"
            }
        }
    ]
}
```

### earn_get_movements_summary

```json
{
    "type": "deposit",
    "total_amount": "1.5",
    "total_count": 10,
    "symbol": "BTC"
}
```

### earn_get_assets

```json
{
    "symbols": ["BTC", "ETH", "USDC", "USDT", "ADA", "DOT"]
}
```

### earn_get_apy

```json
{
    "BTC": {
        "symbol": "BTC",
        "rates": {
            "daily_yield_ratio": "0.0001",
            "weekly_yield_ratio": "0.000099999917563314",
            "monthly_yield_ratio": "0.000099999597052597"
        }
    },
    "ETH": {
        "symbol": "ETH",
        "rates": {
            "daily_yield_ratio": "0.00008",
            "weekly_yield_ratio": "0.000079999934050651",
            "monthly_yield_ratio": "0.000079999677642078"
        }
    }
}
```

### earn_get_rewards_config

```json
{
    "distribution_frequency": "daily",
    "minimum_balance": "0.0001",
    "compounding": true
}
```

### earn_get_wallet_rewards_config

```json
{
    "wallet_id": "earn123-...",
    "symbol": "BTC",
    "distribution_frequency": "daily",
    "next_distribution": "2024-11-26T00:00:00.000Z"
}
```

### earn_get_wallet_rewards_summary

```json
{
    "wallet_id": "earn123-...",
    "symbol": "BTC",
    "total_rewards": "0.0001",
    "last_reward": "0.0000027",
    "last_reward_date": "2024-11-25T00:00:00.000Z"
}
```

### earn_deposit

```json
{
    "id": "mov123-...",
    "type": "deposit",
    "symbol": "BTC",
    "amount": "0.1",
    "status": "completed",
    "message": "Deposit successful"
}
```

### earn_withdraw

```json
{
    "id": "mov123-...",
    "type": "withdrawal",
    "symbol": "BTC",
    "amount": "0.1",
    "status": "completed",
    "message": "Withdrawal successful"
}
```

---

## Loan Tools (9 tools)

### loan_get_active

```json
[
    {
        "id": "fb930f0c-8e90-403a-95e4-112394183cf2",
        "status": "active",
        "guarantee_symbol": "BTC",
        "guarantee_amount": "1.000000000000000000",
        "loan_symbol": "EURR",
        "loan_amount": "52100.455127197287622924",
        "remaining_amount": "52100.455127197287622924",
        "ltv": "0.6863",
        "apr": "0.1700",
        "liquidation_price": "61258.249847058816304395",
        "created_at": "2025-07-27T16:23:59.876Z",
        "expires_at": "2025-07-30T16:23:59.872Z"
    }
]
```

### loan_get_ltv

```json
{
    "guarantee_symbol": "BTC",
    "loan_symbol": "EUR",
    "ltv_ratio": "0.65",
    "max_loan_amount": "50000.00",
    "liquidation_price": "60000.00",
    "health_factor": "1.54"
}
```

### loan_get_config

```json
[
    {
        "symbol": "BTC",
        "min_guarantee": "0.001",
        "max_ltv": "0.70",
        "apr": "0.15",
        "available_as_guarantee": true,
        "available_as_loan": false
    },
    {
        "symbol": "ETH",
        "min_guarantee": "0.01",
        "max_ltv": "0.70",
        "apr": "0.15",
        "available_as_guarantee": true,
        "available_as_loan": false
    }
]
```

### loan_get_movements

```json
{
    "metadata": {
        "total_records": 50,
        "limit": 10,
        "offset": 0,
        "has_more": true,
        "is_empty": false
    },
    "movements": [
        {
            "id": "mov123-...",
            "order_id": "fb930f0c-...",
            "type": "payment",
            "amount": "50000.00",
            "symbol": "EUR",
            "date": "2025-07-27T16:24:00.119Z",
            "status": "completed"
        }
    ]
}
```

### loan_get_orders

```json
{
    "metadata": {
        "total_records": 15,
        "limit": 10,
        "offset": 0,
        "has_more": true,
        "is_empty": false
    },
    "orders": [
        {
            "id": "6ee84520-b399-4a93-9a48-8ba852d78ac5",
            "status": "active",
            "guarantee_symbol": "BTC",
            "guarantee_amount": "0.407452069999999900",
            "loan_symbol": "EURR",
            "loan_amount": "19780.869923949592558916",
            "remaining_amount": "19780.869923949592558916",
            "ltv": "0.6404",
            "apr": "0.1700",
            "liquidation_price": "57211.452470588239403676",
            "created_at": "2025-05-13T22:59:38.096Z",
            "expires_at": "2025-05-16T22:59:38.094Z"
        }
    ]
}
```

### loan_get_order_details

```json
{
    "id": "fb930f0c-8e90-403a-95e4-112394183cf2",
    "status": "active",
    "guarantee_symbol": "BTC",
    "guarantee_amount": "1.000000000000000000",
    "loan_symbol": "EURR",
    "loan_amount": "52100.455127197287622924",
    "remaining_amount": "52100.455127197287622924",
    "ltv": "0.6863",
    "apr": "0.1700",
    "liquidation_price": "61258.249847058816304395",
    "created_at": "2025-07-27T16:23:59.876Z",
    "expires_at": "2025-07-30T16:23:59.872Z"
}
```

### loan_create

```json
{
    "id": "loan123-...",
    "guarantee_symbol": "BTC",
    "guarantee_amount": "1.0",
    "loan_symbol": "EUR",
    "loan_amount": "50000.00",
    "ltv": "0.65",
    "apr": "0.15",
    "status": "active",
    "created_at": "2024-11-25T10:00:00.000Z"
}
```

### loan_increase_guarantee

```json
{
    "id": "loan123-...",
    "new_guarantee_amount": "1.5",
    "new_ltv": "0.43",
    "status": "updated",
    "message": "Guarantee increased successfully"
}
```

### loan_payback

```json
{
    "id": "loan123-...",
    "payback_amount": "10000.00",
    "remaining_amount": "40000.00",
    "status": "active",
    "message": "Payback successful"
}
```

---

## Pro Trading Tools (14 tools)

### pro_get_balance

```json
[
    {
        "symbol": "BTC",
        "balance": "0.00689471",
        "blocked_balance": "0",
        "available": "0.00689471"
    },
    {
        "symbol": "FLOW",
        "balance": "27812.0234142",
        "blocked_balance": "0",
        "available": "27812.0234142"
    },
    {
        "symbol": "EUR",
        "balance": "0",
        "blocked_balance": "0.00011102",
        "available": "-0.00011102"
    }
]
```

### pro_get_trades

```json
{
    "metadata": {
        "total_records": 150,
        "limit": 50,
        "offset": 0,
        "has_more": true,
        "is_empty": false
    },
    "trades": [
        {
            "id": "trade123",
            "order_id": "order456",
            "pair": "BTC/EUR",
            "side": "buy",
            "price": "75869.89",
            "amount": "0.1",
            "fee": "0.75",
            "fee_symbol": "EUR",
            "cost": "7586.99",
            "is_maker": false,
            "order_type": "limit",
            "date": "2025-11-25T10:30:00.258Z"
        }
    ]
}
```

### pro_get_order_trades

```json
{
    "order_id": "order456",
    "trades": [
        {
            "id": "trade123",
            "order_id": "order456",
            "pair": "BTC/EUR",
            "side": "buy",
            "price": "75869.89",
            "amount": "0.1",
            "fee": "0.75",
            "date": "2025-11-25T10:30:00.258Z"
        }
    ]
}
```

### pro_get_order_details

```json
{
    "id": "order789",
    "pair": "BTC/EUR",
    "side": "buy",
    "type": "limit",
    "status": "active",
    "price": "75000.00",
    "amount": "0.1",
    "filled": "0.0",
    "remaining": "0.1",
    "created_at": "2024-11-25T10:00:00.000Z"
}
```

### pro_get_open_orders

```json
{
    "orders": [
        {
            "id": "order789",
            "pair": "BTC/EUR",
            "side": "buy",
            "type": "limit",
            "status": "active",
            "price": "75000.00",
            "amount": "0.1",
            "filled": "0.0",
            "remaining": "0.1",
            "created_at": "2024-11-25T10:00:00.000Z"
        }
    ]
}
```

### pro_create_order

```json
{
    "id": "order123-...",
    "pair": "BTC/EUR",
    "side": "buy",
    "type": "limit",
    "status": "active",
    "price": "75000.00",
    "amount": "0.1",
    "filled": "0.0",
    "remaining": "0.1",
    "created_at": "2024-11-25T10:00:00.000Z"
}
```

### pro_cancel_order

```json
{
    "id": "order123-...",
    "status": "cancelled",
    "message": "Order cancelled successfully"
}
```

### pro_cancel_all_orders

```json
{
    "cancelled": 5,
    "message": "5 orders cancelled successfully"
}
```

### pro_deposit

```json
{
    "id": "transfer123-...",
    "symbol": "EUR",
    "amount": "1000.00",
    "status": "completed",
    "message": "Deposit successful"
}
```

### pro_withdraw

```json
{
    "id": "transfer456-...",
    "symbol": "EUR",
    "amount": "500.00",
    "status": "completed",
    "message": "Withdrawal successful"
}
```

### pro_get_market_config

```json
[
    {
        "pair": "BTC/EUR",
        "base_precision": 8,
        "quote_precision": 2,
        "min_amount": "0.0001",
        "max_amount": "100",
        "status": "active"
    }
]
```

### pro_get_order_book

```json
{
    "pair": "BTC/EUR",
    "bids": [
        {
            "price": "75800.00",
            "amount": "0.5"
        },
        {
            "price": "75750.00",
            "amount": "1.2"
        }
    ],
    "asks": [
        {
            "price": "75900.00",
            "amount": "0.8"
        },
        {
            "price": "75950.00",
            "amount": "1.5"
        }
    ],
    "date": "2025-11-25T10:30:00.258Z"
}
```

### pro_get_public_trades

```json
{
    "metadata": {
        "total_records": 100,
        "limit": 100,
        "sort": "DESC"
    },
    "trades": [
        {
            "id": "12345",
            "pair": "BTC/EUR",
            "price": "75869.89",
            "amount": "0.5",
            "side": "buy",
            "date": "2025-11-25T10:30:00.258Z"
        }
    ]
}
```

### pro_get_candles

```json
{
    "metadata": {
        "total_records": 100,
        "limit": 100,
        "timeframe": "1h",
        "pair": "BTC/EUR"
    },
    "candles": [
        {
            "date": "2025-11-25T10:00:00.000Z",
            "open": "75800.00",
            "high": "76100.00",
            "low": "75600.00",
            "close": "75869.89",
            "volume": "125.5"
        }
    ]
}
```

---

## Account Tools (1 tool)

### account_get_info

```json
{
    "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
    "email": "user@example.com",
    "level": "verified",
    "kyc_status": "approved",
    "created_at": "2021-01-19T20:24:59.209Z",
,
    "features": {
        "trading": true,
        "earn": true,
        "loans": true
    }
}
```

---

## Aggregation Tools (1 tool)

### portfolio_get_valuation

```json
{
    "quote_symbol": "EUR",
    "total_value": "771789.52",
    "by_service": {
        "wallet": "50000.00",
        "pro": "100000.00",
        "earn": "200000.00",
        "loan_guarantees": "421789.52"
    },
    "details": [
        {
            "asset": "BTC",
            "amount": "8.657983471809322",
            "price_unit": "75936.5",
            "value_fiat": "657456.96"
        },
        {
            "asset": "B2M",
            "amount": "3205806.09708881",
            "price_unit": "0.0099566",
            "value_fiat": "31918.93"
        },
        {
            "asset": "DOGE",
            "amount": "232444.85337828",
            "price_unit": "0.1290807",
            "value_fiat": "30004.14"
        }
    ]
}
```
