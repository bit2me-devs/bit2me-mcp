# Análisis de Consistencia y Plan de Resolución

## Resumen Ejecutivo

Este documento identifica todas las inconsistencias encontradas en las herramientas del MCP Bit2Me y propone un plan completo de resolución para mejorar la coherencia, claridad y usabilidad de la API.

---

## Categorías de Inconsistencias Identificadas

### 1. TERMINOLOGÍA INCONSISTENTE: Currency vs Symbol vs Pair vs Asset

#### Problema
Se utilizan términos diferentes para referirse a conceptos similares o relacionados, causando confusión:

- **`currency`**: Se usa tanto para criptomonedas (BTC, ETH) como para monedas fiat (EUR, USD)
- **`symbol`**: Se usa para referirse a criptomonedas individuales (BTC) pero también para pares de trading (BTC/EUR)
- **`pair`**: Se usa solo en `market_get_chart` pero debería usarse consistentemente para pares de trading
- **`asset`**: Se usa en descripciones pero no en parámetros

#### Ejemplos Específicos

**Market Tools:**
- `market_get_ticker`: usa `symbol` (correcto para criptomoneda) pero `currency` para fiat (inconsistente)
- `market_get_chart`: usa `pair` (correcto) pero la descripción menciona "ticker pair"
- `market_get_order_book`: usa `symbol` pero debería ser `pair` (es un par BTC/EUR)
- `market_get_public_trades`: usa `symbol` pero debería ser `pair`
- `market_get_candles`: usa `symbol` pero debería ser `pair`
- `market_get_config`: usa `symbol` pero debería ser `pair` (filtra por mercado)

**Wallet Tools:**
- `wallet_get_pockets`: usa `currency` para filtrar (correcto, puede ser BTC o EUR)
- `wallet_get_networks`: usa `currency` (correcto, es un símbolo de criptomoneda)
- `wallet_get_transactions`: usa `currency` (correcto)

**Earn Tools:**
- `earn_get_summary`: respuesta usa `currency` (correcto, es BTC/ETH)
- `earn_get_wallets`: respuesta usa `currency` (correcto)
- `earn_create_transaction`: usa `currency` (correcto)
- Descripciones hablan de "assets" pero parámetros usan "currency"

**Loan Tools:**
- `loan_get_ltv`: usa `guaranteeCurrency` y `loanCurrency` (correcto, descriptivo)
- `loan_create`: usa `guaranteeCurrency` y `loanCurrency` (correcto)
- `loan_get_config`: respuesta usa `currency` (debería ser `asset_symbol` o `cryptocurrency_symbol`)

**Pro Tools:**
- `pro_get_transactions`: usa `symbol` pero debería ser `pair` (filtra por mercado)
- `pro_get_open_orders`: usa `symbol` pero debería ser `pair`
- `pro_create_order`: usa `symbol` (correcto, es un par BTC/EUR)
- `pro_cancel_all_orders`: usa `symbol` pero debería ser `pair`
- `pro_deposit`/`pro_withdraw`: usa `currency` (correcto, puede ser BTC o EUR)

#### Propuesta de Terminología Estándar

1. **`cryptocurrency_symbol`** o **`asset_symbol`**: Para referirse a criptomonedas individuales (BTC, ETH, DOGE)
   - Ejemplos: `market_get_ticker`, `market_get_asset_details`, `wallet_get_networks`

2. **`trading_pair`** o **`pair`**: Para referirse a pares de trading (BTC/EUR, ETH/USD)
   - Ejemplos: `market_get_chart`, `market_get_order_book`, `pro_create_order`

3. **`currency`**: Solo para referirse a monedas fiat (EUR, USD) o cuando el contexto es ambiguo (puede ser crypto o fiat)
   - Ejemplos: `wallet_get_pockets` (puede filtrar por BTC o EUR), `pro_deposit` (puede ser BTC o EUR)

4. **`fiat_currency`**: Explícitamente para monedas fiat
   - Ejemplos: `market_get_currency_rate`, `portfolio_get_valuation`

---

### 2. TIMESTAMPS SIN FECHAS LEGIBLES

#### Problema
Muchas respuestas incluyen solo `timestamp` (número) sin incluir `date` (ISO 8601), lo que dificulta la lectura humana.

#### Ejemplos Específicos

**Respuestas con SOLO timestamp (sin date):**
- `market_get_ticker`: `time` (timestamp numérico) - **FALTA `date`**
- `market_get_order_book`: `timestamp` - **FALTA `date`**
- `market_get_public_trades`: `timestamp` - **FALTA `date`**
- `market_get_candles`: `timestamp` - **FALTA `date`**
- `market_get_currency_rate`: `timestamp` (opcional) - **FALTA `date`**
- `pro_get_transactions`: `timestamp` - **FALTA `date`**
- `pro_get_order_trades`: `timestamp` - **FALTA `date`**

**Respuestas con AMBOS timestamp y date (correcto):**
- `market_get_chart`: ✅ `timestamp` + `date`
- `wallet_get_transactions`: ✅ `date` (sin timestamp, pero es legible)
- `wallet_get_transaction_details`: ✅ `date`
- `earn_get_transactions`: ✅ `date`
- `loan_get_transactions`: ✅ `date`
- `loan_get_orders`: ✅ `created_at` y `expires_at` (ISO strings)

**Respuestas con SOLO date (sin timestamp):**
- `wallet_get_pocket_details`: `created_at` (ISO string) - **FALTA `timestamp`**
- `wallet_get_pocket_addresses`: `created_at` (ISO string) - **FALTA `timestamp`**
- `earn_get_wallet_details`: `createdAt` (ISO string) - **FALTA `timestamp`**
- `pro_get_order_details`: `createdAt` (ISO string) - **FALTA `timestamp`**

#### Propuesta
**Todas las respuestas que incluyan información temporal deben tener AMBOS campos:**
- `timestamp`: número (milliseconds desde epoch) - para procesamiento programático
- `date`: string ISO 8601 (ej: "2024-11-25T10:30:00.000Z") - para lectura humana

---

### 3. NOMBRES DE PARÁMETROS INCONSISTENTES

#### Problema
Los nombres de parámetros no siguen un patrón consistente, incluso cuando se refieren al mismo concepto.

#### Ejemplos Específicos

**Para criptomonedas:**
- `market_get_ticker`: `symbol` ✅
- `market_get_asset_details`: `symbol` ✅
- `wallet_get_networks`: `currency` ❌ (debería ser `cryptocurrency_symbol`)
- `earn_create_transaction`: `currency` ❌ (debería ser `cryptocurrency_symbol`)
- `loan_get_config`: respuesta usa `currency` ❌ (debería ser `asset_symbol`)

**Para pares de trading:**
- `market_get_chart`: `pair` ✅
- `market_get_order_book`: `symbol` ❌ (debería ser `pair`)
- `market_get_public_trades`: `symbol` ❌ (debería ser `pair`)
- `market_get_candles`: `symbol` ❌ (debería ser `pair`)
- `market_get_config`: `symbol` ❌ (debería ser `pair`)
- `pro_get_transactions`: `symbol` ❌ (debería ser `pair`)
- `pro_get_open_orders`: `symbol` ❌ (debería ser `pair`)
- `pro_create_order`: `symbol` ❌ (debería ser `pair`)
- `pro_cancel_all_orders`: `symbol` ❌ (debería ser `pair`)

**Para monedas fiat:**
- `market_get_currency_rate`: `fiat_currency` ✅
- `market_get_ticker`: `currency` ✅ (es fiat)
- `portfolio_get_valuation`: `fiat_currency` ✅

**Para IDs:**
- `wallet_get_pocket_details`: `pocketId` ✅
- `earn_get_wallet_details`: `walletId` ✅
- `loan_get_order_details`: `orderId` ✅
- `pro_get_order_details`: `orderId` ✅
- `wallet_get_transaction_details`: `transactionId` ✅

---

### 4. DESCRIPCIONES POCO CLARAS O INCONSISTENTES

#### Problema
Algunas descripciones no son precisas sobre qué esperar o usan terminología inconsistente.

#### Ejemplos Específicos

1. **`market_get_chart`**: 
   - Descripción dice "Returns data points with dates and prices in both USD and the fiat currency from the ticker"
   - Debería decir "from the pair" (no "ticker")

2. **`market_get_ticker`**:
   - Descripción dice "Specify symbol (e.g., BTC) and optional base currency"
   - Debería ser más claro: "cryptocurrency symbol" y "fiat currency"

3. **`earn_get_assets`**:
   - Descripción dice "Returns available currencies"
   - Debería decir "Returns list of cryptocurrency symbols"

4. **`pro_get_transactions`**:
   - Descripción dice "Optional filters: symbol"
   - Debería decir "Optional filter: trading pair"

5. **`wallet_get_pockets`**:
   - Descripción dice "Filter by currency symbol"
   - Debería ser más específico: "Filter by cryptocurrency or fiat currency symbol"

---

### 5. FORMATO DE RESPUESTAS INCONSISTENTE

#### Problema
Algunas respuestas tienen campos con nombres inconsistentes o faltan campos importantes.

#### Ejemplos Específicos

1. **Campos de fecha inconsistentes:**
   - Algunos usan `created_at` (snake_case)
   - Otros usan `createdAt` (camelCase)
   - **Propuesta**: Siempre usar `created_at` (snake_case) para consistencia

2. **`market_get_ticker`**:
   - Tiene `time` (timestamp) pero falta `date`
   - **Propuesta**: Agregar `date` y mantener `time` como `timestamp`

3. **`pro_get_order_details`**:
   - Tiene `createdAt` pero falta `timestamp`
   - **Propuesta**: Agregar `timestamp` y renombrar `createdAt` a `created_at`

4. **`loan_get_orders`** y `loan_get_order_details`**:
   - Usan `created_at` y `expires_at` (correcto)
   - Pero falta `timestamp` para ambos
   - **Propuesta**: Agregar `created_timestamp` y `expires_timestamp`

---

## PLAN DE RESOLUCIÓN COMPLETO

### Fase 1: Establecer Terminología Estándar

#### 1.1 Definir Convenciones de Nomenclatura

**Para parámetros de entrada:**
- `cryptocurrency_symbol`: Criptomonedas individuales (BTC, ETH, DOGE)
- `trading_pair`: Pares de trading (BTC/EUR, ETH/USD)
- `fiat_currency`: Monedas fiat (EUR, USD)
- `currency`: Solo cuando el contexto es ambiguo (puede ser crypto o fiat)

**Para campos de respuesta:**
- `asset_symbol`: Criptomonedas en respuestas
- `trading_pair`: Pares en respuestas
- `fiat_currency`: Monedas fiat en respuestas
- `currency`: Solo cuando es ambiguo

#### 1.2 Actualizar Todas las Tools

**Market Tools:**
- `market_get_ticker`: 
  - `symbol` → `cryptocurrency_symbol` ✅ (mantener, pero mejorar descripción)
  - `currency` → `fiat_currency` ✅ (mantener, pero mejorar descripción)
  
- `market_get_chart`: 
  - `pair` ✅ (mantener)
  
- `market_get_order_book`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `market_get_public_trades`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `market_get_candles`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `market_get_config`: 
  - `symbol` → `trading_pair` ❌ (cambiar, es opcional para filtrar por mercado)

**Pro Tools:**
- `pro_get_transactions`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `pro_get_open_orders`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `pro_create_order`: 
  - `symbol` → `trading_pair` ❌ (cambiar)
  
- `pro_cancel_all_orders`: 
  - `symbol` → `trading_pair` ❌ (cambiar)

**Earn Tools:**
- `earn_create_transaction`: 
  - `currency` → `cryptocurrency_symbol` ❌ (cambiar, es siempre crypto)
  
- `earn_get_assets`: 
  - Respuesta: cambiar descripción de "currencies" a "cryptocurrency symbols"

**Loan Tools:**
- `loan_get_config`: 
  - Respuesta: `currency` → `asset_symbol` ❌ (cambiar)

**Wallet Tools:**
- `wallet_get_networks`: 
  - `currency` → `cryptocurrency_symbol` ❌ (cambiar, es siempre crypto)

---

### Fase 2: Agregar Fechas Legibles a Todas las Respuestas

#### 2.1 Crear Función Helper

```typescript
// src/utils/format.ts
export function formatTimestamp(timestamp: number | string | undefined): { timestamp: number; date: string } {
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : (timestamp || Date.now());
    return {
        timestamp: ts,
        date: new Date(ts).toISOString()
    };
}
```

#### 2.2 Actualizar Mappers

**Agregar `date` donde falta:**
- `mapTickerResponse`: Agregar `date` desde `time`
- `mapOrderBookResponse`: Agregar `date` desde `timestamp`
- `mapPublicTradesResponse`: Agregar `date` desde `timestamp`
- `mapCandlesResponse`: Agregar `date` desde `timestamp`
- `mapCurrencyRateResponse`: Agregar `date` desde `timestamp` (si existe)
- `mapProOrderTradesResponse`: Agregar `date` desde `timestamp`

**Agregar `timestamp` donde falta:**
- `mapWalletPocketDetailsResponse`: Agregar `timestamp` desde `created_at`
- `mapWalletAddressesResponse`: Agregar `timestamp` desde `created_at`
- `mapEarnWalletDetailsResponse`: Agregar `timestamp` desde `createdAt`
- `mapProOrderResponse`: Agregar `timestamp` desde `createdAt`
- `mapLoanOrdersResponse`: Agregar `created_timestamp` y `expires_timestamp`
- `mapLoanOrderDetailsResponse`: Agregar `created_timestamp` y `expires_timestamp`

#### 2.3 Actualizar Schemas

Actualizar todas las interfaces en `src/utils/schemas.ts` para incluir ambos campos cuando corresponda.

---

### Fase 3: Estandarizar Nombres de Campos en Respuestas

#### 3.1 Convención: Siempre snake_case

**Cambios necesarios:**
- `createdAt` → `created_at` (en todos los lugares)
- `expiresAt` → `expires_at` (ya está correcto en loans)
- `lastRewardDate` → `last_reward_date` (ya está correcto)

#### 3.2 Actualizar Schemas y Mappers

Revisar todos los schemas y mappers para asegurar consistencia snake_case.

---

### Fase 4: Mejorar Descripciones

#### 4.1 Actualizar Descripciones de Tools

Revisar y mejorar todas las descripciones para:
- Usar terminología consistente
- Ser más específicas sobre qué esperar
- Eliminar ambigüedades

#### 4.2 Actualizar Descripciones de Parámetros

Mejorar todas las descripciones de parámetros para:
- Ser más descriptivas
- Incluir ejemplos claros
- Usar terminología consistente

---

### Fase 5: Actualizar Documentación

#### 5.1 Actualizar SCHEMA_MAPPING.md

Actualizar todos los ejemplos JSON para reflejar los cambios:
- Nuevos nombres de campos
- Nuevos campos agregados (date, timestamp)
- Nuevos nombres de parámetros

#### 5.2 Actualizar README.md

Actualizar la tabla de herramientas con:
- Nuevos nombres de parámetros
- Descripciones mejoradas

#### 5.3 Actualizar landing/index.html

Actualizar ejemplos y descripciones en la landing page.

---

### Fase 6: Actualizar Tests

#### 6.1 Actualizar Tests Unitarios

Actualizar todos los tests para:
- Usar nuevos nombres de parámetros
- Verificar nuevos campos en respuestas
- Verificar ambos `timestamp` y `date`

#### 6.2 Actualizar Tests E2E

Actualizar tests end-to-end con los nuevos nombres de parámetros.

---

## RESUMEN DE CAMBIOS POR TOOL

### Market Tools (8 tools)

1. **`market_get_currency_rate`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `date` si hay `timestamp`

2. **`market_get_ticker`**
   - ✅ Parámetros OK (mejorar descripciones)
   - ❌ Respuesta: Agregar `date` desde `time`, renombrar `time` → `timestamp`

3. **`market_get_chart`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene ambos)

4. **`market_get_assets`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

5. **`market_get_asset_details`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

6. **`market_get_config`**
   - ❌ Parámetro: `symbol` → `trading_pair` (opcional)
   - ✅ Respuesta OK

7. **`market_get_order_book`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

8. **`market_get_public_trades`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

9. **`market_get_candles`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

### Wallet Tools (7 tools)

1. **`wallet_get_pockets`**
   - ✅ Parámetros OK (mejorar descripción)
   - ✅ Respuesta OK

2. **`wallet_get_pocket_details`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `timestamp` desde `created_at`

3. **`wallet_get_pocket_addresses`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `timestamp` desde `created_at`

4. **`wallet_get_networks`**
   - ❌ Parámetro: `currency` → `cryptocurrency_symbol`
   - ✅ Respuesta OK

5. **`wallet_get_transactions`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene `date`)

6. **`wallet_get_transaction_details`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene `date`)

7. **`wallet_create_proforma`** / **`wallet_confirm_transaction`**
   - ✅ Parámetros OK
   - ✅ Respuestas OK

### Earn Tools (11 tools)

1. **`earn_get_summary`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

2. **`earn_get_wallets`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

3. **`earn_get_wallet_details`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

4. **`earn_get_transactions`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene `date`)

5. **`earn_get_transactions_summary`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

6. **`earn_create_transaction`**
   - ❌ Parámetro: `currency` → `cryptocurrency_symbol`
   - ✅ Respuesta OK

7. **`earn_get_assets`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (mejorar descripción)

8. **`earn_get_apy`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

9. **`earn_get_rewards_config`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

10. **`earn_get_wallet_rewards_config`**
    - ✅ Parámetros OK
    - ✅ Respuesta OK

11. **`earn_get_wallet_rewards_summary`**
    - ✅ Parámetros OK
    - ✅ Respuesta OK

### Loan Tools (9 tools)

1. **`loan_get_active`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

2. **`loan_get_ltv`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

3. **`loan_get_config`**
   - ✅ Parámetros OK
   - ❌ Respuesta: `currency` → `asset_symbol`

4. **`loan_get_transactions`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene `date`)

5. **`loan_get_orders`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

6. **`loan_get_order_details`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

7. **`loan_create`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

8. **`loan_increase_guarantee`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

9. **`loan_payback`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

### Pro Tools (10 tools)

1. **`pro_get_balance`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

2. **`pro_get_transactions`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

3. **`pro_get_order_trades`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `date` desde `timestamp` en cada trade

4. **`pro_get_order_details`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

5. **`pro_get_open_orders`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `timestamp` y `date` en cada orden

6. **`pro_create_order`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

7. **`pro_cancel_order`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

8. **`pro_cancel_all_orders`**
   - ❌ Parámetro: `symbol` → `trading_pair`
   - ✅ Respuesta OK

9. **`pro_deposit`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

10. **`pro_withdraw`**
    - ✅ Parámetros OK
    - ✅ Respuesta OK

### Account Tools (1 tool)

1. **`account_get_info`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `timestamp` desde `created_at`

### Aggregation Tools (1 tool)

1. **`portfolio_get_valuation`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Prioridad ALTA (Impacto Alto, Esfuerzo Medio)
1. Agregar fechas legibles a todas las respuestas con timestamps
2. Renombrar parámetros `symbol` → `trading_pair` en market y pro tools
3. Renombrar `currency` → `cryptocurrency_symbol` donde corresponda

### Prioridad MEDIA (Impacto Medio, Esfuerzo Bajo)
4. Estandarizar nombres de campos (snake_case)
5. Mejorar descripciones de tools y parámetros
6. Actualizar documentación

### Prioridad BAJA (Impacto Bajo, Esfuerzo Bajo)
7. Actualizar tests
8. Actualizar landing page

---

## CONSIDERACIONES ADICIONALES

### Breaking Changes
Los cambios de nombres de parámetros son **breaking changes**. Se debe:
1. Documentar claramente en CHANGELOG.md
2. Considerar versión mayor si se hace todo junto
3. O hacer cambios incrementales con versiones menores

### Compatibilidad
Si se quiere mantener compatibilidad temporal:
- Mantener parámetros antiguos como deprecated
- Aceptar ambos nombres durante un período de transición
- Documentar fecha de deprecación

### Testing
- Todos los cambios deben ir acompañados de tests actualizados
- Verificar que los mappers funcionan correctamente
- Verificar que las respuestas tienen el formato esperado

---

## CONCLUSIÓN

Este plan de resolución aborda todas las inconsistencias identificadas de manera sistemática y completa. La implementación puede hacerse de forma incremental, priorizando los cambios de mayor impacto.

**Total de cambios propuestos:**
- ~25 cambios de nombres de parámetros
- ~15 cambios de agregar campos de fecha/timestamp
- ~10 cambios de nombres de campos en respuestas
- Múltiples mejoras de descripciones

**Estimación de esfuerzo:**
- Fase 1-2 (Alta prioridad): 2-3 días
- Fase 3-4 (Media prioridad): 1-2 días
- Fase 5-6 (Baja prioridad): 1 día
- **Total: ~4-6 días de desarrollo**

