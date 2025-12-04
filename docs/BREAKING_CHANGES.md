# Breaking Changes

Este documento lista todos los cambios que rompen la compatibilidad con versiones anteriores del servidor MCP Bit2Me.

## Versión 2.0.0 - Cambios de Consistencia

### Cambios en Parámetros de Entrada

#### Market Tools

- **`market_get_order_book`**: `symbol` → `pair`
- **`market_get_public_trades`**: `symbol` → `pair`
- **`market_get_candles`**: `symbol` → `pair`
- **`market_get_config`**: `symbol` → `pair` (opcional)
- **`market_get_currency_rate`**: `fiat_currency` → `fiat`
- **`market_get_assets`**: 
  - `includeTestnet` → `include_testnet`
  - `showExchange` → `show_exchange`
- **`market_get_asset_details`**: `showExchange` → `show_exchange`

#### Wallet Tools

- **`wallet_get_pocket_details`**: `pocketId` → `pocket_id`
- **`wallet_get_pocket_addresses`**: `pocketId` → `pocket_id`
- **`wallet_get_networks`**: `currency` → `symbol`
- **`wallet_get_transaction_details`**: `transactionId` → `transaction_id`

#### Earn Tools

- **`earn_get_wallet_details`**: `walletId` → `wallet_id`
- **`earn_get_transactions`**: `walletId` → `wallet_id`
- **`earn_get_wallet_rewards_config`**: `walletId` → `wallet_id`
- **`earn_get_wallet_rewards_summary`**: `walletId` → `wallet_id`
- **`earn_create_transaction`**: 
  - `pocketId` → `pocket_id`
  - `currency` → `symbol`

#### Loan Tools

- **`loan_get_ltv`**: 
  - `guaranteeCurrency` → `guarantee_symbol`
  - `loanCurrency` → `loan_fiat`
  - `userCurrency` → `user_fiat`
  - `guaranteeAmount` → `guarantee_amount`
  - `loanAmount` → `loan_amount`
- **`loan_create`**: 
  - `guaranteeCurrency` → `guarantee_symbol`
  - `guaranteeAmount` → `guarantee_amount`
  - `loanCurrency` → `loan_fiat`
  - `loanAmount` → `loan_amount`
- **`loan_get_transactions`**: `orderId` → `order_id`
- **`loan_get_order_details`**: `orderId` → `order_id`
- **`loan_increase_guarantee`**: 
  - `orderId` → `order_id`
  - `guaranteeAmount` → `guarantee_amount`
- **`loan_payback`**: 
  - `orderId` → `order_id`
  - `paybackAmount` → `payback_amount`

#### Pro Trading Tools

- **`pro_get_open_orders`**: `symbol` → `pair`
- **`pro_get_transactions`**: `symbol` → `pair`
- **`pro_get_order_details`**: `orderId` → `order_id`
- **`pro_get_order_trades`**: `orderId` → `order_id`
- **`pro_create_order`**: 
  - `symbol` → `pair`
  - `stopPrice` → `stop_price`
- **`pro_cancel_order`**: `orderId` → `order_id`
- **`pro_cancel_all_orders`**: `symbol` → `pair`

#### Aggregation Tools

- **`portfolio_get_valuation`**: `fiat_currency` → `fiat`

### Cambios en Respuestas

#### Campos Renombrados

- **`market_get_ticker`**: `time` → `timestamp` (se mantiene `date` como ISO string)
- **`earn_get_wallet_details`**: `createdAt` → `created_at`
- **`pro_get_order_details`** y **`pro_create_order`**: `createdAt` → `created_at`
- **`loan_get_config`**: `currency` → `symbol` en la respuesta

#### Campos Agregados

Todas las respuestas que contenían solo timestamps ahora incluyen también fechas legibles:

- **`market_get_ticker`**: Agregado `date` (ISO string)
- **`market_get_order_book`**: Agregado `date` (ISO string)
- **`market_get_public_trades`**: Agregado `date` en cada trade
- **`market_get_candles`**: Agregado `date` en cada candle
- **`market_get_currency_rate`**: Agregado `date` si hay timestamp
- **`wallet_get_pocket_details`**: Agregado `created_timestamp` (número)
- **`wallet_get_pocket_addresses`**: Agregado `created_timestamp` en cada dirección
- **`earn_get_wallet_details`**: Agregado `created_timestamp` (número)
- **`pro_get_order_details`**: Agregado `created_timestamp` (número)
- **`pro_get_order_trades`**: Agregado `date` en cada trade
- **`loan_get_active`** y **`loan_get_orders`**: Agregado `created_timestamp` y `expires_timestamp`
- **`loan_get_order_details`**: Agregado `created_timestamp` y `expires_timestamp`
- **`account_get_info`**: Agregado `created_timestamp` (número)

#### Convención de Nombres

Todos los campos en las respuestas ahora usan `snake_case` de forma consistente:
- `orderId` → `order_id`
- `walletId` → `wallet_id`
- `transactionId` → `transaction_id`
- `pocketId` → `pocket_id`
- `createdAt` → `created_at`
- `expiresAt` → `expires_at`
- `lastRewardDate` → `last_reward_date`
- `guaranteeCurrency` → `guarantee_currency`
- `loanCurrency` → `loan_currency`
- `maxLoanAmount` → `max_loan_amount`
- `liquidationPrice` → `liquidation_price`
- `healthFactor` → `health_factor`

### Impacto

Estos cambios afectan a:
- Todos los usuarios que integren este servidor MCP
- Scripts y automatizaciones que usen los nombres antiguos de parámetros
- Código que dependa de los nombres antiguos de campos en las respuestas

### Migración

Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para una guía detallada de migración.
