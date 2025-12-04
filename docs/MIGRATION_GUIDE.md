# Guía de Migración

Esta guía te ayudará a migrar tu código de la versión anterior a la versión 2.0.0 con los cambios de consistencia.

## Resumen de Cambios

La versión 2.0.0 introduce cambios importantes para mejorar la consistencia:
- Todos los parámetros ahora usan `snake_case`
- Todas las respuestas incluyen tanto timestamps (números) como fechas legibles (ISO strings)
- Terminología consistente: `symbol` para crypto, `pair` para trading pairs, `fiat` para monedas fiat

## Cambios por Categoría

### Market Tools

#### `market_get_order_book`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `market_get_public_trades`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `market_get_candles`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `market_get_config`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `market_get_currency_rate`
```typescript
// Antes
{ fiat_currency: "EUR", symbol: "BTC" }

// Después
{ fiat: "EUR", symbol: "BTC" }
```

#### `market_get_assets`
```typescript
// Antes
{ includeTestnet: true, showExchange: false }

// Después
{ include_testnet: true, show_exchange: false }
```

#### `market_get_asset_details`
```typescript
// Antes
{ showExchange: false }

// Después
{ show_exchange: false }
```

### Wallet Tools

#### `wallet_get_pocket_details`
```typescript
// Antes
{ pocketId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ pocket_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `wallet_get_pocket_addresses`
```typescript
// Antes
{ pocketId: "123e4567-e89b-12d3-a456-426614174000", network: "bitcoin" }

// Después
{ pocket_id: "123e4567-e89b-12d3-a456-426614174000", network: "bitcoin" }
```

#### `wallet_get_networks`
```typescript
// Antes
{ currency: "BTC" }

// Después
{ symbol: "BTC" }
```

#### `wallet_get_transaction_details`
```typescript
// Antes
{ transactionId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ transaction_id: "123e4567-e89b-12d3-a456-426614174000" }
```

### Earn Tools

#### `earn_get_wallet_details`
```typescript
// Antes
{ walletId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ wallet_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `earn_get_transactions`
```typescript
// Antes
{ walletId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ wallet_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `earn_get_wallet_rewards_config`
```typescript
// Antes
{ walletId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ wallet_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `earn_get_wallet_rewards_summary`
```typescript
// Antes
{ walletId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ wallet_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `earn_create_transaction`
```typescript
// Antes
{ pocketId: "123...", currency: "BTC", amount: "0.1", type: "deposit" }

// Después
{ pocket_id: "123...", symbol: "BTC", amount: "0.1", type: "deposit" }
```

### Loan Tools

#### `loan_get_ltv`
```typescript
// Antes
{
  guaranteeCurrency: "BTC",
  loanCurrency: "EUR",
  userCurrency: "EUR",
  guaranteeAmount: "1.0"
}

// Después
{
  guarantee_symbol: "BTC",
  loan_fiat: "EUR",
  user_fiat: "EUR",
  guarantee_amount: "1.0"
}
```

#### `loan_create`
```typescript
// Antes
{
  guaranteeCurrency: "BTC",
  guaranteeAmount: "1.0",
  loanCurrency: "EUR",
  loanAmount: "50000"
}

// Después
{
  guarantee_symbol: "BTC",
  guarantee_amount: "1.0",
  loan_fiat: "EUR",
  loan_amount: "50000"
}
```

#### `loan_get_transactions`
```typescript
// Antes
{ orderId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ order_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `loan_get_order_details`
```typescript
// Antes
{ orderId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ order_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `loan_increase_guarantee`
```typescript
// Antes
{ orderId: "123...", guaranteeAmount: "0.5" }

// Después
{ order_id: "123...", guarantee_amount: "0.5" }
```

#### `loan_payback`
```typescript
// Antes
{ orderId: "123...", paybackAmount: "10000" }

// Después
{ order_id: "123...", payback_amount: "10000" }
```

### Pro Trading Tools

#### `pro_get_open_orders`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `pro_get_transactions`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

#### `pro_get_order_details`
```typescript
// Antes
{ orderId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ order_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `pro_get_order_trades`
```typescript
// Antes
{ orderId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ order_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `pro_create_order`
```typescript
// Antes
{
  symbol: "BTC/EUR",
  side: "buy",
  type: "limit",
  amount: 0.1,
  price: 50000,
  stopPrice: 49000
}

// Después
{
  pair: "BTC/EUR",
  side: "buy",
  type: "limit",
  amount: 0.1,
  price: 50000,
  stop_price: 49000
}
```

#### `pro_cancel_order`
```typescript
// Antes
{ orderId: "123e4567-e89b-12d3-a456-426614174000" }

// Después
{ order_id: "123e4567-e89b-12d3-a456-426614174000" }
```

#### `pro_cancel_all_orders`
```typescript
// Antes
{ symbol: "BTC/EUR" }

// Después
{ pair: "BTC/EUR" }
```

### Aggregation Tools

#### `portfolio_get_valuation`
```typescript
// Antes
{ fiat_currency: "EUR" }

// Después
{ fiat: "EUR" }
```

## Cambios en Respuestas

### Timestamps y Fechas

Todas las respuestas que contenían solo timestamps ahora incluyen también fechas legibles:

```typescript
// Antes
{
  timestamp: 1704067200000
}

// Después
{
  timestamp: 1704067200000,
  date: "2024-01-01T00:00:00.000Z"
}
```

### Campos Renombrados en Respuestas

```typescript
// Antes
{
  orderId: "123...",
  walletId: "456...",
  createdAt: "2024-01-01T00:00:00.000Z",
  time: 1704067200000
}

// Después
{
  order_id: "123...",
  wallet_id: "456...",
  created_at: "2024-01-01T00:00:00.000Z",
  created_timestamp: 1704067200000,
  timestamp: 1704067200000,
  date: "2024-01-01T00:00:00.000Z"
}
```

## Estrategia de Migración

1. **Revisa tu código**: Busca todos los usos de los parámetros y campos antiguos
2. **Actualiza parámetros**: Cambia todos los nombres de parámetros a `snake_case`
3. **Actualiza respuestas**: Ajusta tu código para usar los nuevos nombres de campos
4. **Usa fechas legibles**: Aprovecha los nuevos campos `date` para mostrar fechas más amigables
5. **Prueba exhaustivamente**: Verifica que todas las integraciones funcionen correctamente

## Herramientas de Migración

Puedes usar herramientas de búsqueda y reemplazo para facilitar la migración:

```bash
# Buscar usos de parámetros antiguos
grep -r "symbol:" tu-proyecto/
grep -r "orderId:" tu-proyecto/
grep -r "fiat_currency:" tu-proyecto/

# Buscar campos antiguos en respuestas
grep -r "\.orderId" tu-proyecto/
grep -r "\.createdAt" tu-proyecto/
grep -r "\.time" tu-proyecto/
```

## Soporte

Si encuentras problemas durante la migración, por favor:
1. Revisa este documento y [BREAKING_CHANGES.md](./BREAKING_CHANGES.md)
2. Consulta los ejemplos en [README.md](../README.md)
3. Abre un issue en el repositorio de GitHub
