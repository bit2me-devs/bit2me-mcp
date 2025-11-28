# Tool Response Schemas

Este documento muestra la estructura JSON exacta que devuelve cada tool del MCP Bit2Me.

## Tool Count (47 total)

- 8 Market Tools
- 6 Wallet Tools
- 10 Earn Tools
- 6 Loan Tools
- 4 Pro Trading Tools
- 1 Account Tool
- 1 Aggregation Tool
- 12 Operation Tools

---

## Market Tools (8 tools)

### market_get_ticker

```json
{
    "time": 1764072740258,
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
        "timestamp": 1732492800000,
        "date": "2024-11-25T00:00:00.000Z",
        "price_usd": 75869.89,
        "price_fiat": 72145.32,
        "currency": "EUR"
    },
    {
        "timestamp": 1732579200000,
        "date": "2024-11-26T00:00:00.000Z",
        "price_usd": 76234.12,
        "price_fiat": 72489.56,
        "currency": "EUR"
    }
]
```

### market_get_assets

```json
[
    {
        "symbol": "BTC",
        "name": "Bitcoin",
        "asset_type": "currency",
        "network": "BITCOIN",
        "enabled": true,
        "tradeable": true,
        "loanable": true,
        "pairs_with": ["EUR"]
    },
    {
        "symbol": "ETH",
        "name": "Ethereum",
        "asset_type": "platform",
        "network": "ETHEREUM (ERC20)",
        "enabled": true,
        "tradeable": true,
        "loanable": true,
        "pairs_with": ["EUR"]
    }
]
```

### market_get_asset_details

```json
{
    "symbol": "BTC",
    "name": "Bitcoin",
    "asset_type": "currency",
    "network": "BITCOIN",
    "enabled": true,
    "tradeable": true,
    "loanable": true,
    "pairs_with": ["EUR"]
}
```

### market_get_config

```json
{
    "symbol": "BTC/EUR",
    "basePrecision": 8,
    "quotePrecision": 2,
    "minAmount": "0.0001",
    "maxAmount": "100",
    "status": "active"
}
```

### market_get_order_book

```json
{
    "symbol": "BTC/EUR",
    "bids": [
        ["75800.00", "0.5"],
        ["75750.00", "1.2"]
    ],
    "asks": [
        ["75900.00", "0.8"],
        ["75950.00", "1.5"]
    ],
    "timestamp": 1764072740258
}
```

### market_get_public_trades

```json
[
    {
        "id": "12345",
        "symbol": "BTC/EUR",
        "price": "75869.89",
        "amount": "0.5",
        "side": "buy",
        "timestamp": 1764072740258
    }
]
```

### market_get_candles

```json
[
    {
        "timestamp": 1764072000000,
        "open": "75800.00",
        "high": "76100.00",
        "low": "75600.00",
        "close": "75869.89",
        "volume": "125.5"
    }
]
```

---

## Wallet Tools (7 tools)

### wallet_get_pockets

```json
[
    {
        "id": "abc123-def456-...",
        "currency": "EUR",
        "balance": "1250.50",
        "available": "1200.00",
        "name": "EUR Wallet"
    },
    {
        "id": "def456-abc123-...",
        "currency": "BTC",
        "balance": "0.5",
        "available": "0.5"
    }
]
```

### wallet_get_pocket_details

```json
{
    "id": "abc123-def456-...",
    "currency": "EUR",
    "balance": "1250.50",
    "available": "1200.00",
    "blocked": "50.50",
    "name": "EUR Wallet",
    "createdAt": "2021-01-19T20:24:59.209Z"
}
```

### wallet_get_pocket_addresses

```json
[
    {
        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "network": "bitcoin",
        "currency": "BTC",
        "createdAt": "2021-01-19T20:24:59.209Z"
    }
]
```

### wallet_get_networks

```json
[
    {
        "id": "bitcoin",
        "name": "bitcoin",
        "native_currency_code": "BTC",
        "fee_currency_code": "BTC",
        "has_tag": false
    }
]
```

### wallet_get_transactions

```json
{
    "metadata": {
        "total_records": 150,
        "limit": 2,
        "offset": 0,
        "filter_currency": "ALL"
    },
    "transactions": [
        {
            "index": 1,
            "id": "tx123-...",
            "date": "2024-11-25T10:30:00.000Z",
            "type": "deposit",
            "subtype": "bank_transfer",
            "status": "completed",
            "amount": "1000.00",
            "currency": "EUR",
            "origin": {
                "amount": "1000.00",
                "currency": "EUR",
                "class": "bank"
            },
            "destination": {
                "amount": "1000.00",
                "currency": "EUR",
                "class": "pocket"
            },
            "fee": {
                "amount": "0.00",
                "currency": "EUR"
            }
        }
    ]
}
```

### wallet_get_transaction_details

```json
{
    "id": "tx123-...",
    "date": "2024-11-25T10:30:00.000Z",
    "type": "deposit",
    "subtype": "bank_transfer",
    "status": "completed",
    "amount": "1000.00",
    "currency": "EUR",
    "origin": {
        "amount": "1000.00",
        "currency": "EUR",
        "class": "bank"
    },
    "destination": {
        "amount": "1000.00",
        "currency": "EUR",
        "class": "pocket"
    },
    "fee": {
        "amount": "0.00",
        "currency": "EUR"
    }
}
```

---

## Earn Tools (12 tools)

### earn_get_summary

```json
[
    {
        "currency": "BTC",
        "total_balance": "0.5",
        "rewards_earned": "0.0001",
        "apy": "0.05"
    },
    {
        "currency": "ETH",
        "total_balance": "5.0",
        "rewards_earned": "0.002",
        "apy": "0.04"
    }
]
```

### earn_get_wallets

```json
[
    {
        "id": "earn123-...",
        "currency": "BTC",
        "balance": "0.5",
        "strategy": "flexible",
        "apy": "0.05",
        "status": "active"
    }
]
```

### earn_get_wallet_details

```json
{
    "id": "earn123-...",
    "currency": "BTC",
    "balance": "0.5",
    "strategy": "flexible",
    "apy": "0.05",
    "status": "active",
    "createdAt": "2021-01-19T20:24:59.209Z"
}
```

### earn_get_transactions

```json
[
    {
        "id": "tx123-...",
        "type": "deposit",
        "currency": "BTC",
        "amount": "0.1",
        "date": "2024-11-25T10:30:00.000Z",
        "status": "completed"
    }
]
```

### earn_get_transactions_summary

```json
{
    "type": "DEPOSIT",
    "totalAmount": "1.5",
    "totalCount": 10,
    "currency": "BTC"
}
```

### earn_get_assets

```json
["BTC", "ETH", "USDC", "USDT", "ADA", "DOT"]
```

### earn_get_apy

```json
{
    "BTC": {
        "currency": "BTC",
        "daily": 0.0001,
        "weekly": 0.000099999917563314,
        "monthly": 0.000099999597052597
    },
    "ETH": {
        "currency": "ETH",
        "daily": 0.00008,
        "weekly": 0.000079999934050651,
        "monthly": 0.000079999677642078
    }
}
```

### earn_get_rewards_config

```json
{
    "distributionFrequency": "daily",
    "minimumBalance": "0.0001",
    "compounding": true
}
```

### earn_get_wallet_rewards_config

```json
{
    "walletId": "earn123-...",
    "currency": "BTC",
    "distributionFrequency": "daily",
    "nextDistribution": "2024-11-26T00:00:00.000Z"
}
```

### earn_get_wallet_rewards_summary

```json
{
    "walletId": "earn123-...",
    "currency": "BTC",
    "totalRewards": "0.0001",
    "lastReward": "0.0000027",
    "lastRewardDate": "2024-11-25T00:00:00.000Z"
}
```

---

## Loan Tools (11 tools)

### loan_get_active

```json
[
    {
        "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
        "status": "active",
        "guarantee_currency": "BTC",
        "guarantee_amount": "1.000000000000000000",
        "loan_currency": "EURR",
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
    "ltv": "0.65",
    "maxLoanAmount": "50000.00",
    "liquidationPrice": "60000.00",
    "healthFactor": "1.54"
}
```

### loan_get_config

```json
[
    {
        "currency": "BTC",
        "minGuarantee": "0.001",
        "maxLtv": "0.70",
        "apr": "0.15",
        "availableAsGuarantee": true,
        "availableAsLoan": false
    },
    {
        "currency": "ETH",
        "minGuarantee": "0.01",
        "maxLtv": "0.70",
        "apr": "0.15",
        "availableAsGuarantee": true,
        "availableAsLoan": false
    }
]
```

### loan_get_transactions

```json
[
    {
        "id": "tx123-...",
        "orderId": "fb930f0c-...",
        "type": "disbursement",
        "amount": "50000.00",
        "currency": "EURR",
        "date": "2025-07-27T16:24:00.119Z",
        "status": "completed"
    }
]
```

### loan_get_orders

```json
[
    {
        "order_id": "6ee84520-b399-4a93-9a48-8ba852d78ac5",
        "status": "active",
        "guarantee_currency": "BTC",
        "guarantee_amount": "0.407452069999999900",
        "loan_currency": "EURR",
        "loan_amount": "19780.869923949592558916",
        "remaining_amount": "19780.869923949592558916",
        "ltv": "0.6404",
        "apr": "0.1700",
        "liquidation_price": "57211.452470588239403676",
        "created_at": "2025-05-13T22:59:38.096Z",
        "expires_at": "2025-05-16T22:59:38.094Z"
    }
]
```

### loan_get_order_details

```json
{
    "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
    "status": "active",
    "guarantee_currency": "BTC",
    "guarantee_amount": "1.000000000000000000",
    "loan_currency": "EURR",
    "loan_amount": "52100.455127197287622924",
    "remaining_amount": "52100.455127197287622924",
    "ltv": "0.6863",
    "apr": "0.1700",
    "liquidation_price": "61258.249847058816304395",
    "created_at": "2025-07-27T16:23:59.876Z",
    "expires_at": "2025-07-30T16:23:59.872Z"
}
```

---

## Pro Trading Tools (8 tools)

### pro_get_balance

```json
[
    {
        "currency": "BTC",
        "balance": 0.00689471,
        "blocked_balance": 0,
        "available": 0.00689471
    },
    {
        "currency": "FLOW",
        "balance": 27812.0234142,
        "blocked_balance": 0,
        "available": 27812.0234142
    },
    {
        "currency": "EUR",
        "balance": 0,
        "blocked_balance": 0.00011102,
        "available": -0.00011102
    }
]
```

### pro_get_transactions

```json
[
    {
        "id": "trade123",
        "orderId": "order456",
        "symbol": "BTC/EUR",
        "side": "buy",
        "price": "75869.89",
        "amount": "0.1",
        "fee": "0.75",
        "timestamp": 1764072740258
    }
]
```

### pro_get_order_trades

```json
[
    {
        "id": "trade123",
        "orderId": "order456",
        "symbol": "BTC/EUR",
        "side": "buy",
        "price": "75869.89",
        "amount": "0.1",
        "fee": "0.75",
        "timestamp": 1764072740258
    }
]
```

### pro_get_order_details

```json
{
    "id": "order789",
    "symbol": "BTC/EUR",
    "side": "buy",
    "type": "limit",
    "status": "open",
    "price": "75000.00",
    "amount": "0.1",
    "filled": "0.0",
    "remaining": "0.1",
    "createdAt": "2024-11-25T10:00:00.000Z"
}
```

---

## Account Tools (1 tool)

### account_get_info

```json
{
    "userId": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
    "email": "user@example.com",
    "level": "verified",
    "kycStatus": "approved",
    "createdAt": "2021-01-19T20:24:59.209Z",
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
    "currency": "EUR",
    "total_value": 771789.52,
    "details": [
        {
            "asset": "BTC",
            "amount": 8.657983471809322,
            "price_unit": 75936.5,
            "value_fiat": 657456.96
        },
        {
            "asset": "B2M",
            "amount": 3205806.09708881,
            "price_unit": 0.0099566,
            "value_fiat": 31918.93
        },
        {
            "asset": "DOGE",
            "amount": 232444.85337828,
            "price_unit": 0.1290807,
            "value_fiat": 30004.14
        }
    ]
}
```

---

## Operation Tools (12 tools)

### wallet_create_proforma

```json
{
    "proforma": "proforma123-...",
    "origin": {
        "pocket": "pocket123-...",
        "currency": "EUR",
        "amount": "100.00"
    },
    "destination": {
        "pocket": "pocket456-...",
        "currency": "BTC",
        "amount": "0.00131579"
    },
    "rate": "75869.89",
    "fee": {
        "amount": "0.50",
        "currency": "EUR"
    },
    "expiresAt": "2024-11-25T10:35:00.000Z"
}
```

### wallet_confirm_transaction

```json
{
    "id": "tx123-...",
    "status": "completed",
    "message": "✅ Transacción confirmada. ID: tx123-..."
}
```

### pro_get_open_orders

```json
[
    {
        "id": "order789",
        "symbol": "BTC/EUR",
        "side": "buy",
        "type": "limit",
        "status": "open",
        "price": "75000.00",
        "amount": "0.1",
        "filled": "0.0",
        "remaining": "0.1",
        "createdAt": "2024-11-25T10:00:00.000Z"
    }
]
```

### pro_create_order

```json
{
    "id": "order123-...",
    "symbol": "BTC/EUR",
    "side": "buy",
    "type": "limit",
    "status": "open",
    "price": "75000.00",
    "amount": "0.1",
    "createdAt": "2024-11-25T10:00:00.000Z"
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
    "currency": "EUR",
    "amount": "1000.00",
    "status": "completed",
    "message": "Deposit successful"
}
```

### pro_withdraw

```json
{
    "id": "transfer456-...",
    "currency": "EUR",
    "amount": "500.00",
    "status": "completed",
    "message": "Withdrawal successful"
}
```

### earn_create_transaction

```json
{
    "id": "tx123-...",
    "type": "deposit",
    "currency": "BTC",
    "amount": "0.1",
    "status": "completed",
    "message": "Earn deposit successful"
}
```

### loan_create

```json
{
    "orderId": "loan123-...",
    "guaranteeCurrency": "BTC",
    "guaranteeAmount": "1.0",
    "loanCurrency": "EUR",
    "loanAmount": "50000.00",
    "ltv": "0.65",
    "apr": "0.15",
    "status": "active",
    "createdAt": "2024-11-25T10:00:00.000Z"
}
```

### loan_increase_guarantee

```json
{
    "orderId": "loan123-...",
    "newGuaranteeAmount": "1.5",
    "newLtv": "0.43",
    "status": "updated",
    "message": "Guarantee increased successfully"
}
```

### loan_payback

```json
{
    "orderId": "loan123-...",
    "paybackAmount": "10000.00",
    "remainingAmount": "40000.00",
    "status": "active",
    "message": "Payback successful"
}
```
