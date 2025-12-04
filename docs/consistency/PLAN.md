# Plan de Consistencia y Normalización MCP Bit2Me

Este documento detalla el análisis crítico de las inconsistencias detectadas en el servidor MCP y propone un plan de resolución para estandarizar la nomenclatura y estructura de datos.

## 1. Diagnóstico Crítico

Se han identificado 4 problemas fundamentales que afectan la experiencia cognitiva del LLM y la mantenibilidad del código:

1.  **Ambigüedad Semántica ("Currency" vs "Symbol" vs "Pair"):**
    *   El término `currency` se utiliza indistintamente para activos cripto (BTC), moneda fiat (EUR) y pares de trading.
    *   *Ejemplo:* En `wallet`, `currency` filtra criptos. En `market`, suele ser la moneda base. En `pro`, `symbol` se usa para pares.

2.  **Inconsistencia de Tipografía (Casing):**
    *   Mezcla de `snake_case` y `camelCase` en los parámetros de entrada.
    *   *Ejemplo:* `origin_pocket_id` (bien) vs `pocketId` (mal), `guaranteeCurrency` (mal).

3.  **Falta de Precisión en Pares de Trading:**
    *   Herramientas solicitan `symbol` (ej: "BTC") cuando requieren obligatoriamente un `pair` (ej: "BTC/EUR").

4.  **Inconsistencia Temporal (Fechas):**
    *   Las respuestas mezclan `timestamp` (Unix), `time`, `date` (ISO), `createdAt`.

## 2. Glosario Estándar (Naming Convention)

Se aplicará estrictamente este glosario para **Inputs** y **Outputs**:

| Concepto | Nombre Estándar | Ejemplo | Nota |
| :--- | :--- | :--- | :--- |
| **Activo Cripto** | `symbol` | `BTC`, `ETH` | Reemplaza a `currency` para activos. |
| **Moneda Fiat** | `fiat` | `EUR`, `USD` | Para diferenciar dinero fiduciario explícito. |
| **Par de Trading** | `pair` | `BTC/EUR` | Reemplaza a `symbol` o `ticker` si es un par. |
| **Identificador** | `{entity}_id` | `pocket_id` | Siempre `snake_case`. |
| **Cantidad** | `amount` | `"0.5"` | Siempre string. |
| **Fecha ISO** | `date` | `"2024-..."` | ISO 8601 para lectura humana. |
| **Fecha Unix** | `timestamp` | `1700000...` | Entero para máquinas. |
| **Banderas** | `include_...` | `include_testnet` | Siempre `snake_case` para booleanos. |

## 3. Plan de Acción: Refactorización de Inputs

Cambios a realizar en `src/tools/*.ts`. Estos son **Breaking Changes** para la interfaz del LLM.

### Wallet (`src/tools/wallet.ts`)
- [ ] `wallet_get_pockets`: `currency` → `symbol`
- [ ] `wallet_get_pocket_details`: `pocketId` → `pocket_id`
- [ ] `wallet_get_pocket_addresses`: `pocketId` → `pocket_id`, `currency` → `symbol`
- [ ] `wallet_get_networks`: `currency` → `symbol`
- [ ] `wallet_get_transaction_details`: `transactionId` → `transaction_id`
- [ ] `wallet_get_transactions`: `currency` → `symbol`

### Market (`src/tools/market.ts`)
- [ ] `market_get_currency_rate`: `fiat_currency` → `fiat`
- [ ] `market_get_order_book`: `symbol` → `pair`
- [ ] `market_get_public_trades`: `symbol` → `pair`
- [ ] `market_get_candles`: `symbol` → `pair`
- [ ] `market_get_assets`: `includeTestnet` → `include_testnet`, `showExchange` → `show_exchange`
- [ ] `market_get_asset_details`: `showExchange` → `show_exchange`

### Earn (`src/tools/earn.ts`)
- [ ] `earn_get_wallet_details`: `walletId` → `wallet_id`
- [ ] `earn_get_transactions`: `walletId` → `wallet_id`
- [ ] `earn_get_wallet_rewards_config`: `walletId` → `wallet_id`
- [ ] `earn_get_wallet_rewards_summary`: `walletId` → `wallet_id`
- [ ] `earn_create_transaction`: `pocketId` → `pocket_id`, `currency` → `symbol`

### Loan (`src/tools/loan.ts`)
- [ ] `loan_get_ltv`:
    - `guaranteeCurrency` → `guarantee_symbol`
    - `loanCurrency` → `loan_symbol`
    - `userCurrency` → `user_fiat`
    - `guaranteeAmount` → `guarantee_amount`
    - `loanAmount` → `loan_amount`
- [ ] `loan_create`: Aplicar mismos cambios que en `loan_get_ltv`.
- [ ] `loan_get_transactions`: `orderId` → `order_id`
- [ ] `loan_get_order_details`: `orderId` → `order_id`
- [ ] `loan_increase_guarantee`: `orderId` → `order_id`, `guaranteeAmount` → `guarantee_amount`
- [ ] `loan_payback`: `orderId` → `order_id`, `paybackAmount` → `payback_amount`

### Pro (`src/tools/pro.ts`)
- [ ] `pro_get_open_orders`: `symbol` → `pair`
- [ ] `pro_get_transactions`: `symbol` → `pair`
- [ ] `pro_create_order`: `symbol` → `pair`, `stopPrice` → `stop_price`, `orderType` → `type`
- [ ] `pro_cancel_order`: `orderId` → `order_id`
- [ ] `pro_cancel_all_orders`: `symbol` → `pair`
- [ ] `pro_deposit`: `currency` → `symbol`
- [ ] `pro_withdraw`: `currency` → `symbol`

## 4. Plan de Acción: Refactorización de Outputs

Cambios a realizar en `src/utils/response-mappers.ts` y `src/utils/schemas.ts`.

1.  **Unificación de Fechas**: Asegurar que todas las entidades principales devuelvan `date` (ISO) y `timestamp` (Unix).
2.  **Nomenclatura**:
    *   Renombrar campos `currency` a `symbol` en respuestas de Wallet y Earn cuando se refieran al activo.
    *   Renombrar campos `symbol` a `pair` en respuestas de Market y Pro cuando se refieran al par.

## 5. Fases de Ejecución

1.  **Fase 1**: Mappers y Schemas (Outputs).
2.  **Fase 2**: Herramientas (Inputs y lógica interna).
3.  **Fase 3**: Tests (Actualización de llamadas y expectativas).
4.  **Fase 4**: Documentación (SCHEMA_MAPPING.md y README.md).

