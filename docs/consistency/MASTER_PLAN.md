# Plan Maestro de Consistencia - MCP Bit2Me

## Resumen Ejecutivo

Este documento consolida y mejora los análisis de consistencia realizados por múltiples agentes, creando un plan maestro completo y unificado para estandarizar la nomenclatura, estructura de datos y formato de respuestas en todas las herramientas del MCP Bit2Me.

**Objetivo**: Establecer una API coherente, predecible y fácil de usar tanto para LLMs como para desarrolladores humanos.

---

## Categorías de Inconsistencias Identificadas

### 1. TERMINOLOGÍA INCONSISTENTE: Currency vs Symbol vs Pair vs Asset

#### Problema Crítico
Se utilizan términos diferentes para referirse a conceptos similares o relacionados, causando confusión significativa:

- **`currency`**: Se usa tanto para criptomonedas (BTC, ETH) como para monedas fiat (EUR, USD)
- **`symbol`**: Se usa para referirse a criptomonedas individuales (BTC) pero también para pares de trading (BTC/EUR)
- **`pair`**: Se usa solo en `market_get_chart` pero debería usarse consistentemente para pares de trading
- **`asset`**: Se usa en descripciones pero no en parámetros
- **`ticker`**: Se menciona en descripciones pero no se usa como parámetro

#### Impacto
- **Alta confusión para LLMs**: No pueden inferir correctamente qué tipo de valor esperar
- **Errores de uso**: Los usuarios pueden pasar valores incorrectos sin darse cuenta
- **Mantenibilidad**: Código difícil de entender y mantener

---

### 2. INCONSISTENCIA DE CASING: snake_case vs camelCase

#### Problema Crítico
Mezcla de convenciones de nomenclatura en parámetros de entrada:

- **snake_case**: `origin_pocket_id`, `destination_pocket_id`, `created_at`
- **camelCase**: `pocketId`, `walletId`, `orderId`, `guaranteeCurrency`, `loanCurrency`
- **PascalCase**: `guaranteeCurrency`, `loanCurrency` (en algunos lugares)

#### Impacto
- **Inconsistencia visual**: Dificulta la lectura y comprensión
- **Errores tipográficos**: Mayor probabilidad de errores al escribir parámetros
- **Estándar de la industria**: snake_case es más común en APIs REST y Python

---

### 3. TIMESTAMPS SIN FECHAS LEGIBLES

#### Problema Crítico
Muchas respuestas incluyen solo `timestamp` (número) sin incluir `date` (ISO 8601), o viceversa:

**Respuestas con SOLO timestamp (sin date):**
- `market_get_ticker`: `time` (timestamp numérico) - **FALTA `date`**
- `market_get_order_book`: `timestamp` - **FALTA `date`**
- `market_get_public_trades`: `timestamp` - **FALTA `date`**
- `market_get_candles`: `timestamp` - **FALTA `date`**
- `market_get_currency_rate`: `timestamp` (opcional) - **FALTA `date`**
- `pro_get_transactions`: `timestamp` - **FALTA `date`**
- `pro_get_order_trades`: `timestamp` - **FALTA `date`**

**Respuestas con SOLO date (sin timestamp):**
- `wallet_get_pocket_details`: `created_at` (ISO string) - **FALTA `timestamp`**
- `wallet_get_pocket_addresses`: `created_at` (ISO string) - **FALTA `timestamp`**
- `earn_get_wallet_details`: `createdAt` (ISO string) - **FALTA `timestamp`**
- `pro_get_order_details`: `createdAt` (ISO string) - **FALTA `timestamp`**
- `account_get_info`: `created_at` (ISO string) - **FALTA `timestamp`**

#### Impacto
- **Procesamiento programático**: Sin timestamp numérico, difícil hacer cálculos
- **Lectura humana**: Sin date ISO, difícil entender cuándo ocurrió algo
- **Inconsistencia**: Algunas respuestas tienen ambos, otras solo uno

---

### 4. NOMBRES DE PARÁMETROS INCONSISTENTES

#### Problema Crítico
Los nombres de parámetros no siguen un patrón consistente, incluso cuando se refieren al mismo concepto:

**Para criptomonedas:**
- `market_get_ticker`: `symbol` ✅
- `market_get_asset_details`: `symbol` ✅
- `wallet_get_networks`: `currency` ❌ (debería ser `symbol`)
- `earn_create_transaction`: `currency` ❌ (debería ser `symbol`)
- `pro_deposit`/`pro_withdraw`: `currency` ❌ (debería ser `symbol` cuando es crypto)

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
- `market_get_currency_rate`: `fiat_currency` ✅ (pero podría ser `fiat`)
- `market_get_ticker`: `currency` ✅ (es fiat, pero podría ser más claro)
- `portfolio_get_valuation`: `fiat_currency` ✅ (pero podría ser `fiat`)

**Para IDs:**
- `wallet_get_pocket_details`: `pocketId` ❌ (debería ser `pocket_id`)
- `earn_get_wallet_details`: `walletId` ❌ (debería ser `wallet_id`)
- `loan_get_order_details`: `orderId` ❌ (debería ser `order_id`)
- `pro_get_order_details`: `orderId` ❌ (debería ser `order_id`)
- `wallet_get_transaction_details`: `transactionId` ❌ (debería ser `transaction_id`)

---

### 5. DESCRIPCIONES POCO CLARAS O INCONSISTENTES

#### Problema
Algunas descripciones no son precisas sobre qué esperar o usan terminología inconsistente:

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

### 6. FORMATO DE RESPUESTAS INCONSISTENTE

#### Problema
Algunas respuestas tienen campos con nombres inconsistentes o faltan campos importantes:

1. **Campos de fecha inconsistentes:**
   - Algunos usan `created_at` (snake_case) ✅
   - Otros usan `createdAt` (camelCase) ❌
   - **Propuesta**: Siempre usar `created_at` (snake_case) para consistencia

2. **Campos de respuesta inconsistentes:**
   - `market_get_ticker`: Tiene `time` pero debería ser `timestamp` + `date`
   - `loan_get_config`: Respuesta usa `currency` pero debería ser `symbol`
   - `pro_get_order_details`: Tiene `createdAt` pero falta `timestamp`

3. **Nombres de campos en respuestas:**
   - Algunos usan `symbol` para pares (debería ser `pair`)
   - Algunos usan `currency` para criptos (debería ser `symbol`)

---

## GLOSARIO ESTÁNDAR (Naming Convention)

### Para Parámetros de Entrada

| Concepto | Nombre Estándar | Ejemplo | Uso |
| :--- | :--- | :--- | :--- |
| **Activo Cripto** | `symbol` | `BTC`, `ETH`, `DOGE` | Reemplaza a `currency` cuando es claramente un activo crypto |
| **Moneda Fiat** | `fiat` | `EUR`, `USD` | Reemplaza a `fiat_currency` (más corto y claro) |
| **Par de Trading** | `pair` | `BTC/EUR`, `ETH/USD` | Reemplaza a `symbol` cuando es un par de trading |
| **Moneda Ambigua** | `currency` | `BTC` o `EUR` | Solo cuando puede ser crypto o fiat (ej: `wallet_get_pockets`) |
| **Identificador** | `{entity}_id` | `pocket_id`, `wallet_id`, `order_id` | Siempre `snake_case`, reemplaza `pocketId`, `walletId`, etc. |
| **Cantidad** | `amount` | `"0.5"` | Siempre string |
| **Banderas Booleanas** | `include_{feature}` | `include_testnet`, `show_exchange` | Siempre `snake_case` |

### Para Campos de Respuesta

| Concepto | Nombre Estándar | Ejemplo | Uso |
| :--- | :--- | :--- | :--- |
| **Activo Cripto** | `symbol` | `BTC`, `ETH` | En respuestas de Wallet, Earn, Loan cuando es crypto |
| **Par de Trading** | `pair` | `BTC/EUR` | En respuestas de Market y Pro cuando es un par |
| **Moneda Fiat** | `fiat` o `currency` | `EUR`, `USD` | `fiat` cuando es explícitamente fiat, `currency` cuando es ambiguo |
| **Fecha ISO** | `date` | `"2024-11-25T10:30:00.000Z"` | ISO 8601 para lectura humana |
| **Fecha Unix** | `timestamp` | `1700000000000` | Entero (milliseconds) para procesamiento programático |
| **Fecha de Creación** | `created_at` + `created_timestamp` | Ambos campos siempre | ISO string + número |
| **Fecha de Expiración** | `expires_at` + `expires_timestamp` | Ambos campos siempre | ISO string + número |

### Reglas de Nomenclatura

1. **Siempre snake_case** para todos los parámetros y campos de respuesta
2. **Nombres descriptivos**: `guarantee_symbol` mejor que `guaranteeCurrency`
3. **Consistencia**: Mismo concepto = mismo nombre en todas las tools
4. **Claridad**: Preferir nombres más largos pero claros sobre abreviaciones

---

## PLAN DE RESOLUCIÓN COMPLETO

### Fase 0: Preparación y Validación

#### 0.1 Crear Función Helper para Timestamps

```typescript
// src/utils/format.ts
/**
 * Formats a timestamp (number or ISO string) into both timestamp and date fields
 * @param timestamp - Unix timestamp (ms) or ISO 8601 string
 * @returns Object with both timestamp (number) and date (ISO string)
 */
export function formatTimestamp(timestamp: number | string | undefined): { timestamp: number; date: string } {
    if (!timestamp) {
        const now = Date.now();
        return {
            timestamp: now,
            date: new Date(now).toISOString()
        };
    }
    
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    
    if (isNaN(ts)) {
        const now = Date.now();
        return {
            timestamp: now,
            date: new Date(now).toISOString()
        };
    }
    
    return {
        timestamp: ts,
        date: new Date(ts).toISOString()
    };
}
```

#### 0.2 Documentar Breaking Changes

Crear documento `docs/BREAKING_CHANGES.md` con:
- Lista completa de cambios de nombres de parámetros
- Guía de migración para usuarios
- Fechas de deprecación (si se mantiene compatibilidad temporal)

---

### Fase 1: Estandarizar Terminología en Parámetros

#### 1.1 Cambios en Market Tools

**`market_get_ticker`**:
- ✅ `symbol` → mantener (es correcto para crypto)
- ✅ `currency` → mantener pero mejorar descripción: "Fiat currency (e.g., EUR, USD)"

**`market_get_chart`**:
- ✅ `pair` → mantener (ya correcto)

**`market_get_order_book`**:
- ❌ `symbol` → `pair`
- Actualizar handler para usar `args.pair`

**`market_get_public_trades`**:
- ❌ `symbol` → `pair`
- Actualizar handler para usar `args.pair`

**`market_get_candles`**:
- ❌ `symbol` → `pair`
- Actualizar handler para usar `args.pair`

**`market_get_config`**:
- ❌ `symbol` → `pair` (opcional)
- Actualizar handler para usar `args.pair`

**`market_get_currency_rate`**:
- ✅ `fiat_currency` → `fiat` (más corto y claro)
- Actualizar handler para usar `args.fiat`

**`market_get_assets`**:
- ❌ `includeTestnet` → `include_testnet`
- ❌ `showExchange` → `show_exchange`
- Actualizar handler para usar `args.include_testnet` y `args.show_exchange`

**`market_get_asset_details`**:
- ❌ `showExchange` → `show_exchange`
- Actualizar handler para usar `args.show_exchange`

#### 1.2 Cambios en Wallet Tools

**`wallet_get_pockets`**:
- ✅ `currency` → mantener (puede ser BTC o EUR, es ambiguo)
- Mejorar descripción: "Filter by cryptocurrency or fiat currency symbol (e.g., BTC, EUR)"

**`wallet_get_pocket_details`**:
- ❌ `pocketId` → `pocket_id`
- Actualizar handler para usar `args.pocket_id`

**`wallet_get_pocket_addresses`**:
- ❌ `pocketId` → `pocket_id`
- Actualizar handler para usar `args.pocket_id`

**`wallet_get_networks`**:
- ❌ `currency` → `symbol` (siempre es crypto)
- Actualizar handler para usar `args.symbol`

**`wallet_get_transactions`**:
- ✅ `currency` → mantener (puede ser BTC o EUR)
- Mejorar descripción

**`wallet_get_transaction_details`**:
- ❌ `transactionId` → `transaction_id`
- Actualizar handler para usar `args.transaction_id`

**`wallet_create_proforma`**:
- ❌ `origin_pocket_id` → mantener (ya correcto)
- ❌ `destination_pocket_id` → mantener (ya correcto)
- ✅ `currency` → mantener (puede ser BTC o EUR)

#### 1.3 Cambios en Earn Tools

**`earn_get_wallet_details`**:
- ❌ `walletId` → `wallet_id`
- Actualizar handler para usar `args.wallet_id`

**`earn_get_transactions`**:
- ❌ `walletId` → `wallet_id`
- Actualizar handler para usar `args.wallet_id`

**`earn_get_wallet_rewards_config`**:
- ❌ `walletId` → `wallet_id`
- Actualizar handler para usar `args.wallet_id`

**`earn_get_wallet_rewards_summary`**:
- ❌ `walletId` → `wallet_id`
- Actualizar handler para usar `args.wallet_id`

**`earn_create_transaction`**:
- ❌ `pocketId` → `pocket_id`
- ❌ `currency` → `symbol` (siempre es crypto)
- Actualizar handler para usar `args.pocket_id` y `args.symbol`

#### 1.4 Cambios en Loan Tools

**`loan_get_ltv`**:
- ❌ `guaranteeCurrency` → `guarantee_symbol`
- ❌ `loanCurrency` → `loan_fiat` (es siempre fiat)
- ❌ `userCurrency` → `user_fiat`
- ❌ `guaranteeAmount` → `guarantee_amount`
- ❌ `loanAmount` → `loan_amount`
- Actualizar handler para usar nuevos nombres

**`loan_create`**:
- ❌ `guaranteeCurrency` → `guarantee_symbol`
- ❌ `guaranteeAmount` → `guarantee_amount`
- ❌ `loanCurrency` → `loan_fiat`
- ❌ `loanAmount` → `loan_amount`
- Actualizar handler para usar nuevos nombres

**`loan_get_transactions`**:
- ❌ `orderId` → `order_id`
- Actualizar handler para usar `args.order_id`

**`loan_get_order_details`**:
- ❌ `orderId` → `order_id`
- Actualizar handler para usar `args.order_id`

**`loan_increase_guarantee`**:
- ❌ `orderId` → `order_id`
- ❌ `guaranteeAmount` → `guarantee_amount`
- Actualizar handler para usar nuevos nombres

**`loan_payback`**:
- ❌ `orderId` → `order_id`
- ❌ `paybackAmount` → `payback_amount`
- Actualizar handler para usar nuevos nombres

#### 1.5 Cambios en Pro Tools

**`pro_get_open_orders`**:
- ❌ `symbol` → `pair` (opcional)
- Actualizar handler para usar `args.pair`

**`pro_get_transactions`**:
- ❌ `symbol` → `pair` (opcional)
- Actualizar handler para usar `args.pair`

**`pro_get_order_details`**:
- ❌ `orderId` → `order_id`
- Actualizar handler para usar `args.order_id`

**`pro_get_order_trades`**:
- ❌ `orderId` → `order_id`
- Actualizar handler para usar `args.order_id`

**`pro_create_order`**:
- ❌ `symbol` → `pair`
- ❌ `stopPrice` → `stop_price`
- ✅ `type` → mantener (ya correcto)
- Actualizar handler para usar `args.pair` y `args.stop_price`

**`pro_cancel_order`**:
- ❌ `orderId` → `order_id`
- Actualizar handler para usar `args.order_id`

**`pro_cancel_all_orders`**:
- ❌ `symbol` → `pair` (opcional)
- Actualizar handler para usar `args.pair`

**`pro_deposit`**:
- ✅ `currency` → mantener (puede ser BTC o EUR)
- Mejorar descripción

**`pro_withdraw`**:
- ✅ `currency` → mantener (puede ser BTC o EUR)
- Mejorar descripción

---

### Fase 2: Agregar Fechas Legibles a Todas las Respuestas

#### 2.1 Actualizar Mappers para Agregar `date` donde falta

**`mapTickerResponse`**:
- Agregar `date` desde `time`
- Renombrar `time` → `timestamp`

**`mapOrderBookResponse`**:
- Agregar `date` desde `timestamp`

**`mapPublicTradesResponse`**:
- Agregar `date` desde `timestamp` en cada trade

**`mapCandlesResponse`**:
- Agregar `date` desde `timestamp` en cada candle

**`mapCurrencyRateResponse`**:
- Agregar `date` desde `timestamp` (si existe)

**`mapProOrderTradesResponse`**:
- Agregar `date` desde `timestamp` en cada trade

**`mapProTransactionsResponse`** (si existe mapper):
- Agregar `date` desde `timestamp` en cada transacción

#### 2.2 Actualizar Mappers para Agregar `timestamp` donde falta

**`mapWalletPocketDetailsResponse`**:
- Agregar `timestamp` desde `created_at`
- Mantener `created_at` (ISO string)

**`mapWalletAddressesResponse`**:
- Agregar `timestamp` desde `created_at` en cada dirección
- Mantener `created_at` (ISO string)

**`mapEarnWalletDetailsResponse`**:
- Agregar `timestamp` desde `createdAt`
- Renombrar `createdAt` → `created_at`
- Agregar `created_timestamp`

**`mapProOrderResponse`**:
- Agregar `timestamp` desde `createdAt`
- Renombrar `createdAt` → `created_at`
- Agregar `created_timestamp`

**`mapLoanOrdersResponse`**:
- Agregar `created_timestamp` desde `created_at`
- Agregar `expires_timestamp` desde `expires_at`
- Mantener `created_at` y `expires_at` (ISO strings)

**`mapLoanOrderDetailsResponse`**:
- Agregar `created_timestamp` desde `created_at`
- Agregar `expires_timestamp` desde `expires_at`
- Mantener `created_at` y `expires_at` (ISO strings)

**`mapAccountInfoResponse`**:
- Agregar `timestamp` desde `created_at`
- Mantener `created_at` (ISO string)
- Agregar `created_timestamp`

#### 2.3 Actualizar Schemas

Actualizar todas las interfaces en `src/utils/schemas.ts` para incluir ambos campos cuando corresponda:
- `MarketTickerResponse`: `timestamp` + `date`
- `MarketOrderBookResponse`: `timestamp` + `date`
- `PublicTradeResponse`: `timestamp` + `date`
- `CandleResponse`: `timestamp` + `date`
- `CurrencyRateResponse`: `timestamp?` + `date?`
- `WalletPocketDetailsResponse`: `created_at` + `created_timestamp`
- `WalletAddressResponse`: `created_at` + `created_timestamp`
- `EarnWalletDetailsResponse`: `created_at` + `created_timestamp`
- `ProOrderResponse`: `created_at` + `created_timestamp`
- `LoanOrderResponse`: `created_at` + `created_timestamp` + `expires_at` + `expires_timestamp`
- `LoanOrderDetailsResponse`: `created_at` + `created_timestamp` + `expires_at` + `expires_timestamp`
- `AccountInfoResponse`: `created_at` + `created_timestamp`

---

### Fase 3: Estandarizar Nombres de Campos en Respuestas

#### 3.1 Convención: Siempre snake_case

**Cambios necesarios en mappers y schemas:**

- `createdAt` → `created_at` (en todos los lugares)
- `expiresAt` → `expires_at` (ya está correcto en loans, verificar otros lugares)
- `lastRewardDate` → `last_reward_date` (verificar si existe)
- `orderId` → `order_id` (en respuestas)
- `walletId` → `wallet_id` (en respuestas)
- `transactionId` → `transaction_id` (en respuestas)
- `pocketId` → `pocket_id` (en respuestas)

#### 3.2 Cambios Específicos en Respuestas

**`loan_get_config`**:
- Respuesta: `currency` → `symbol` (es siempre crypto)

**`market_get_ticker`**:
- `time` → `timestamp`
- Agregar `date`

**`pro_get_order_details`** y **`pro_create_order`**:
- `createdAt` → `created_at`
- Agregar `created_timestamp`

**`earn_get_wallet_details`**:
- `createdAt` → `created_at`
- Agregar `created_timestamp`

---

### Fase 4: Mejorar Descripciones

#### 4.1 Actualizar Descripciones de Tools

Revisar y mejorar todas las descripciones para:
- Usar terminología consistente (`symbol` para crypto, `pair` para trading pairs, `fiat` para fiat)
- Ser más específicas sobre qué esperar
- Eliminar ambigüedades
- Incluir ejemplos claros cuando sea útil

#### 4.2 Actualizar Descripciones de Parámetros

Mejorar todas las descripciones de parámetros para:
- Ser más descriptivas
- Incluir ejemplos claros
- Usar terminología consistente
- Especificar si es opcional o requerido claramente

#### 4.3 Lista de Descripciones a Mejorar

1. **`market_get_chart`**: 
   - Cambiar "from the ticker" → "from the pair"

2. **`market_get_ticker`**:
   - Cambiar "symbol" → "cryptocurrency symbol"
   - Cambiar "base currency" → "fiat currency"

3. **`earn_get_assets`**:
   - Cambiar "Returns available currencies" → "Returns list of cryptocurrency symbols"

4. **`pro_get_transactions`**:
   - Cambiar "Optional filters: symbol" → "Optional filter: trading pair"

5. **`wallet_get_pockets`**:
   - Cambiar "Filter by currency symbol" → "Filter by cryptocurrency or fiat currency symbol (e.g., BTC, EUR)"

6. **`pro_deposit`** y **`pro_withdraw`**:
   - Mejorar descripción para aclarar que `currency` puede ser crypto o fiat

---

### Fase 5: Actualizar Documentación

#### 5.1 Actualizar SCHEMA_MAPPING.md

Actualizar todos los ejemplos JSON para reflejar los cambios:
- Nuevos nombres de campos (`created_at` en lugar de `createdAt`)
- Nuevos campos agregados (`date`, `timestamp`, `created_timestamp`, `expires_timestamp`)
- Nuevos nombres de parámetros en ejemplos de uso

#### 5.2 Actualizar README.md

Actualizar la tabla de herramientas con:
- Nuevos nombres de parámetros
- Descripciones mejoradas
- Ejemplos actualizados

#### 5.3 Actualizar landing/index.html

Actualizar ejemplos y descripciones en la landing page:
- Nuevos nombres de parámetros en `exampleArgs`
- Nuevas descripciones en `desc`
- Nuevos campos en `response` examples

#### 5.4 Actualizar landing/llms-full.txt

Actualizar con nuevos nombres de parámetros y descripciones mejoradas.

---

### Fase 6: Actualizar Tests

#### 6.1 Actualizar Tests Unitarios

Actualizar todos los tests en `tests/tools/*.test.ts` para:
- Usar nuevos nombres de parámetros
- Verificar nuevos campos en respuestas
- Verificar ambos `timestamp` y `date` cuando corresponda
- Verificar `created_at` + `created_timestamp` cuando corresponda

#### 6.2 Actualizar Tests E2E

Actualizar tests end-to-end en `tests/e2e/*.e2e.test.ts` con los nuevos nombres de parámetros.

#### 6.3 Verificar Cobertura

Asegurar que todos los cambios tienen tests correspondientes.

---

## RESUMEN DETALLADO DE CAMBIOS POR TOOL

### Market Tools (9 tools)

1. **`market_get_currency_rate`**
   - ❌ Parámetro: `fiat_currency` → `fiat`
   - ❌ Respuesta: Agregar `date` si hay `timestamp`

2. **`market_get_ticker`**
   - ✅ Parámetros: `symbol` y `currency` → mantener (mejorar descripciones)
   - ❌ Respuesta: Agregar `date` desde `time`, renombrar `time` → `timestamp`

3. **`market_get_chart`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK (ya tiene ambos)

4. **`market_get_assets`**
   - ❌ Parámetros: `includeTestnet` → `include_testnet`, `showExchange` → `show_exchange`
   - ✅ Respuesta OK

5. **`market_get_asset_details`**
   - ❌ Parámetro: `showExchange` → `show_exchange`
   - ✅ Respuesta OK

6. **`market_get_config`**
   - ❌ Parámetro: `symbol` → `pair` (opcional)
   - ✅ Respuesta OK

7. **`market_get_order_book`**
   - ❌ Parámetro: `symbol` → `pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

8. **`market_get_public_trades`**
   - ❌ Parámetro: `symbol` → `pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

9. **`market_get_candles`**
   - ❌ Parámetro: `symbol` → `pair`
   - ❌ Respuesta: Agregar `date` desde `timestamp`

### Wallet Tools (7 tools)

1. **`wallet_get_pockets`**
   - ✅ Parámetros OK (mejorar descripción de `currency`)
   - ✅ Respuesta OK

2. **`wallet_get_pocket_details`**
   - ❌ Parámetro: `pocketId` → `pocket_id`
   - ❌ Respuesta: Agregar `timestamp` desde `created_at`

3. **`wallet_get_pocket_addresses`**
   - ❌ Parámetro: `pocketId` → `pocket_id`
   - ❌ Respuesta: Agregar `timestamp` desde `created_at` en cada dirección

4. **`wallet_get_networks`**
   - ❌ Parámetro: `currency` → `symbol`
   - ✅ Respuesta OK

5. **`wallet_get_transactions`**
   - ✅ Parámetros OK (mejorar descripción de `currency`)
   - ✅ Respuesta OK (ya tiene `date`)

6. **`wallet_get_transaction_details`**
   - ❌ Parámetro: `transactionId` → `transaction_id`
   - ✅ Respuesta OK (ya tiene `date`)

7. **`wallet_create_proforma`** / **`wallet_confirm_transaction`**
   - ✅ Parámetros OK (ya están en snake_case)
   - ✅ Respuestas OK

### Earn Tools (11 tools)

1. **`earn_get_summary`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

2. **`earn_get_wallets`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

3. **`earn_get_wallet_details`**
   - ❌ Parámetro: `walletId` → `wallet_id`
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

4. **`earn_get_transactions`**
   - ❌ Parámetro: `walletId` → `wallet_id`
   - ✅ Respuesta OK (ya tiene `date`)

5. **`earn_get_transactions_summary`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

6. **`earn_create_transaction`**
   - ❌ Parámetros: `pocketId` → `pocket_id`, `currency` → `symbol`
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
    - ❌ Parámetro: `walletId` → `wallet_id`
    - ✅ Respuesta OK

11. **`earn_get_wallet_rewards_summary`**
    - ❌ Parámetro: `walletId` → `wallet_id`
    - ✅ Respuesta OK

### Loan Tools (9 tools)

1. **`loan_get_active`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

2. **`loan_get_ltv`**
   - ❌ Parámetros: `guaranteeCurrency` → `guarantee_symbol`, `loanCurrency` → `loan_fiat`, `userCurrency` → `user_fiat`, `guaranteeAmount` → `guarantee_amount`, `loanAmount` → `loan_amount`
   - ✅ Respuesta OK

3. **`loan_get_config`**
   - ✅ Parámetros OK
   - ❌ Respuesta: `currency` → `symbol`

4. **`loan_get_transactions`**
   - ❌ Parámetro: `orderId` → `order_id`
   - ✅ Respuesta OK (ya tiene `date`)

5. **`loan_get_orders`**
   - ✅ Parámetros OK
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

6. **`loan_get_order_details`**
   - ❌ Parámetro: `orderId` → `order_id`
   - ❌ Respuesta: Agregar `created_timestamp` y `expires_timestamp`

7. **`loan_create`**
   - ❌ Parámetros: `guaranteeCurrency` → `guarantee_symbol`, `guaranteeAmount` → `guarantee_amount`, `loanCurrency` → `loan_fiat`, `loanAmount` → `loan_amount`
   - ✅ Respuesta OK

8. **`loan_increase_guarantee`**
   - ❌ Parámetros: `orderId` → `order_id`, `guaranteeAmount` → `guarantee_amount`
   - ✅ Respuesta OK

9. **`loan_payback`**
   - ❌ Parámetros: `orderId` → `order_id`, `paybackAmount` → `payback_amount`
   - ✅ Respuesta OK

### Pro Tools (10 tools)

1. **`pro_get_balance`**
   - ✅ Parámetros OK
   - ✅ Respuesta OK

2. **`pro_get_transactions`**
   - ❌ Parámetro: `symbol` → `pair` (opcional)
   - ❌ Respuesta: Agregar `date` desde `timestamp` en cada transacción

3. **`pro_get_order_trades`**
   - ❌ Parámetro: `orderId` → `order_id`
   - ❌ Respuesta: Agregar `date` desde `timestamp` en cada trade

4. **`pro_get_order_details`**
   - ❌ Parámetro: `orderId` → `order_id`
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

5. **`pro_get_open_orders`**
   - ❌ Parámetro: `symbol` → `pair` (opcional)
   - ❌ Respuesta: Agregar `timestamp` y `date` en cada orden (si no existe mapper, crear uno)

6. **`pro_create_order`**
   - ❌ Parámetros: `symbol` → `pair`, `stopPrice` → `stop_price`
   - ❌ Respuesta: Agregar `timestamp` desde `createdAt`, renombrar `createdAt` → `created_at`

7. **`pro_cancel_order`**
   - ❌ Parámetro: `orderId` → `order_id`
   - ✅ Respuesta OK

8. **`pro_cancel_all_orders`**
   - ❌ Parámetro: `symbol` → `pair` (opcional)
   - ✅ Respuesta OK

9. **`pro_deposit`**
   - ✅ Parámetros OK (mejorar descripción de `currency`)
   - ✅ Respuesta OK

10. **`pro_withdraw`**
    - ✅ Parámetros OK (mejorar descripción de `currency`)
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

### Sprint 1: Preparación y Helpers (1 día)
- ✅ Crear función `formatTimestamp` helper
- ✅ Documentar breaking changes
- ✅ Crear plan de migración

### Sprint 2: Timestamps y Fechas (Alta Prioridad - 1 día)
- ✅ Agregar `date` donde falta `timestamp`
- ✅ Agregar `timestamp` donde falta `date`
- ✅ Actualizar todos los mappers
- ✅ Actualizar todos los schemas

### Sprint 3: Estandarizar Casing en Respuestas (Media Prioridad - 0.5 días)
- ✅ Renombrar `createdAt` → `created_at` en todos los lugares
- ✅ Verificar y corregir otros campos camelCase
- ✅ Actualizar schemas y mappers

### Sprint 4: Renombrar Parámetros - Market y Pro (Alta Prioridad - 1 día)
- ✅ Cambiar `symbol` → `pair` en market tools (order_book, public_trades, candles, config)
- ✅ Cambiar `symbol` → `pair` en pro tools (transactions, open_orders, create_order, cancel_all_orders)
- ✅ Cambiar `fiat_currency` → `fiat` en market_get_currency_rate
- ✅ Cambiar `includeTestnet` → `include_testnet`, `showExchange` → `show_exchange`
- ✅ Actualizar handlers y tests

### Sprint 5: Renombrar Parámetros - Wallet y Earn (Media Prioridad - 0.5 días)
- ✅ Cambiar `pocketId` → `pocket_id` en wallet tools
- ✅ Cambiar `walletId` → `wallet_id` en earn tools
- ✅ Cambiar `currency` → `symbol` en wallet_get_networks y earn_create_transaction
- ✅ Cambiar `transactionId` → `transaction_id`
- ✅ Actualizar handlers y tests

### Sprint 6: Renombrar Parámetros - Loan (Media Prioridad - 0.5 días)
- ✅ Cambiar `orderId` → `order_id` en loan tools
- ✅ Cambiar `guaranteeCurrency` → `guarantee_symbol`
- ✅ Cambiar `loanCurrency` → `loan_fiat`
- ✅ Cambiar `userCurrency` → `user_fiat`
- ✅ Cambiar `guaranteeAmount` → `guarantee_amount`
- ✅ Cambiar `loanAmount` → `loan_amount`
- ✅ Cambiar `paybackAmount` → `payback_amount`
- ✅ Actualizar handlers y tests

### Sprint 7: Renombrar Campos en Respuestas (Media Prioridad - 0.5 días)
- ✅ Cambiar `currency` → `symbol` en loan_get_config respuesta
- ✅ Cambiar `time` → `timestamp` en market_get_ticker respuesta
- ✅ Verificar y corregir otros campos inconsistentes

### Sprint 8: Mejorar Descripciones (Baja Prioridad - 0.5 días)
- ✅ Actualizar todas las descripciones de tools
- ✅ Actualizar todas las descripciones de parámetros
- ✅ Usar terminología consistente

### Sprint 9: Actualizar Documentación (Baja Prioridad - 1 día)
- ✅ Actualizar SCHEMA_MAPPING.md
- ✅ Actualizar README.md
- ✅ Actualizar landing/index.html
- ✅ Actualizar landing/llms-full.txt

### Sprint 10: Actualizar Tests (Media Prioridad - 1 día)
- ✅ Actualizar todos los tests unitarios
- ✅ Actualizar todos los tests E2E
- ✅ Verificar cobertura

**Total estimado: ~6-7 días de desarrollo**

---

## CONSIDERACIONES CRÍTICAS

### Breaking Changes

**Todos los cambios de nombres de parámetros son BREAKING CHANGES.**

#### Estrategia de Migración

**Opción A: Cambio Inmediato (Recomendado para versión mayor)**
- Cambiar todos los nombres de una vez
- Versión: `2.0.0` (major version bump)
- Documentar claramente en CHANGELOG.md
- Crear guía de migración detallada

**Opción B: Compatibilidad Temporal (Recomendado para versión menor)**
- Mantener parámetros antiguos como deprecated
- Aceptar ambos nombres durante período de transición (ej: 2 versiones menores)
- Emitir warnings cuando se use nombre antiguo
- Documentar fecha de deprecación
- Versión: `1.7.0` → `1.8.0` (deprecation) → `2.0.0` (removal)

**Recomendación**: Opción A si se puede coordinar con usuarios, Opción B si hay muchos usuarios activos.

### Validación de Cambios

Antes de cada commit:
1. ✅ Ejecutar `npm test` - todos los tests deben pasar
2. ✅ Ejecutar `npm run build` - sin errores de TypeScript
3. ✅ Ejecutar `npm run lint` - sin errores de linting
4. ✅ Verificar manualmente con MCP Inspector al menos 2-3 tools por categoría

### Testing Strategy

1. **Tests Unitarios**: Actualizar primero, verificar que fallan con código antiguo
2. **Implementar cambios**: Hacer que los tests pasen
3. **Tests E2E**: Actualizar y verificar contra API real
4. **Verificación manual**: Usar MCP Inspector para validar comportamiento

### Documentación de Cambios

Crear `docs/MIGRATION_GUIDE.md` con:
- Tabla de mapeo: nombre antiguo → nombre nuevo
- Ejemplos de código antes/después
- Lista de breaking changes
- Fechas importantes (si hay período de transición)

---

## CHECKLIST DE IMPLEMENTACIÓN

### Fase 0: Preparación
- [ ] Crear función `formatTimestamp` helper
- [ ] Crear documento `docs/BREAKING_CHANGES.md`
- [ ] Crear documento `docs/MIGRATION_GUIDE.md`
- [ ] Revisar y aprobar plan con equipo

### Fase 1: Timestamps y Fechas
- [ ] Actualizar `mapTickerResponse`: agregar `date`, renombrar `time` → `timestamp`
- [ ] Actualizar `mapOrderBookResponse`: agregar `date`
- [ ] Actualizar `mapPublicTradesResponse`: agregar `date` en cada trade
- [ ] Actualizar `mapCandlesResponse`: agregar `date` en cada candle
- [ ] Actualizar `mapCurrencyRateResponse`: agregar `date` si hay `timestamp`
- [ ] Actualizar `mapProOrderTradesResponse`: agregar `date` en cada trade
- [ ] Actualizar `mapWalletPocketDetailsResponse`: agregar `timestamp`
- [ ] Actualizar `mapWalletAddressesResponse`: agregar `timestamp` en cada dirección
- [ ] Actualizar `mapEarnWalletDetailsResponse`: agregar `timestamp`, renombrar `createdAt` → `created_at`
- [ ] Actualizar `mapProOrderResponse`: agregar `timestamp`, renombrar `createdAt` → `created_at`
- [ ] Actualizar `mapLoanOrdersResponse`: agregar `created_timestamp` y `expires_timestamp`
- [ ] Actualizar `mapLoanOrderDetailsResponse`: agregar `created_timestamp` y `expires_timestamp`
- [ ] Actualizar `mapAccountInfoResponse`: agregar `timestamp`
- [ ] Actualizar todos los schemas correspondientes

### Fase 2: Renombrar Parámetros - Market
- [ ] `market_get_order_book`: `symbol` → `pair`
- [ ] `market_get_public_trades`: `symbol` → `pair`
- [ ] `market_get_candles`: `symbol` → `pair`
- [ ] `market_get_config`: `symbol` → `pair`
- [ ] `market_get_currency_rate`: `fiat_currency` → `fiat`
- [ ] `market_get_assets`: `includeTestnet` → `include_testnet`, `showExchange` → `show_exchange`
- [ ] `market_get_asset_details`: `showExchange` → `show_exchange`
- [ ] Actualizar handlers
- [ ] Actualizar tests

### Fase 3: Renombrar Parámetros - Wallet
- [ ] `wallet_get_pocket_details`: `pocketId` → `pocket_id`
- [ ] `wallet_get_pocket_addresses`: `pocketId` → `pocket_id`
- [ ] `wallet_get_networks`: `currency` → `symbol`
- [ ] `wallet_get_transaction_details`: `transactionId` → `transaction_id`
- [ ] Actualizar handlers
- [ ] Actualizar tests

### Fase 4: Renombrar Parámetros - Earn
- [ ] `earn_get_wallet_details`: `walletId` → `wallet_id`
- [ ] `earn_get_transactions`: `walletId` → `wallet_id`
- [ ] `earn_get_wallet_rewards_config`: `walletId` → `wallet_id`
- [ ] `earn_get_wallet_rewards_summary`: `walletId` → `wallet_id`
- [ ] `earn_create_transaction`: `pocketId` → `pocket_id`, `currency` → `symbol`
- [ ] Actualizar handlers
- [ ] Actualizar tests

### Fase 5: Renombrar Parámetros - Loan
- [ ] `loan_get_ltv`: todos los parámetros a snake_case
- [ ] `loan_create`: todos los parámetros a snake_case
- [ ] `loan_get_transactions`: `orderId` → `order_id`
- [ ] `loan_get_order_details`: `orderId` → `order_id`
- [ ] `loan_increase_guarantee`: `orderId` → `order_id`, `guaranteeAmount` → `guarantee_amount`
- [ ] `loan_payback`: `orderId` → `order_id`, `paybackAmount` → `payback_amount`
- [ ] Actualizar handlers
- [ ] Actualizar tests

### Fase 6: Renombrar Parámetros - Pro
- [ ] `pro_get_open_orders`: `symbol` → `pair`
- [ ] `pro_get_transactions`: `symbol` → `pair`
- [ ] `pro_get_order_details`: `orderId` → `order_id`
- [ ] `pro_get_order_trades`: `orderId` → `order_id`
- [ ] `pro_create_order`: `symbol` → `pair`, `stopPrice` → `stop_price`
- [ ] `pro_cancel_order`: `orderId` → `order_id`
- [ ] `pro_cancel_all_orders`: `symbol` → `pair`
- [ ] Actualizar handlers
- [ ] Actualizar tests

### Fase 7: Renombrar Campos en Respuestas
- [ ] `loan_get_config`: respuesta `currency` → `symbol`
- [ ] Verificar otros campos inconsistentes
- [ ] Actualizar mappers y schemas

### Fase 8: Mejorar Descripciones
- [ ] Revisar y actualizar todas las descripciones de tools
- [ ] Revisar y actualizar todas las descripciones de parámetros
- [ ] Usar terminología consistente en todas las descripciones

### Fase 9: Actualizar Documentación
- [ ] Actualizar SCHEMA_MAPPING.md con todos los cambios
- [ ] Actualizar README.md con nuevos nombres y descripciones
- [ ] Actualizar landing/index.html con ejemplos actualizados
- [ ] Actualizar landing/llms-full.txt

### Fase 10: Tests Finales
- [ ] Ejecutar todos los tests unitarios
- [ ] Ejecutar todos los tests E2E
- [ ] Verificar cobertura de tests
- [ ] Pruebas manuales con MCP Inspector

---

## ESTADÍSTICAS DEL PLAN

### Cambios de Parámetros
- **Market Tools**: 7 cambios
- **Wallet Tools**: 4 cambios
- **Earn Tools**: 5 cambios
- **Loan Tools**: 11 cambios
- **Pro Tools**: 7 cambios
- **Total**: ~34 cambios de nombres de parámetros

### Cambios de Campos en Respuestas
- **Agregar `date`**: ~7 mappers
- **Agregar `timestamp`**: ~8 mappers
- **Renombrar campos**: ~5 cambios
- **Total**: ~20 cambios en mappers

### Cambios de Descripciones
- **Tools**: ~47 descripciones a revisar/mejorar
- **Parámetros**: ~100+ descripciones a revisar/mejorar

### Archivos a Modificar
- **Tools**: 6 archivos (`market.ts`, `wallet.ts`, `earn.ts`, `loan.ts`, `pro.ts`, `account.ts`)
- **Mappers**: 1 archivo (`response-mappers.ts`)
- **Schemas**: 1 archivo (`schemas.ts`)
- **Tests**: ~10 archivos de tests
- **Documentación**: 4 archivos (SCHEMA_MAPPING.md, README.md, landing/index.html, landing/llms-full.txt)

---

## CONCLUSIÓN

Este plan maestro consolida y mejora los análisis previos, proporcionando una hoja de ruta completa y detallada para estandarizar completamente la API del MCP Bit2Me. La implementación puede realizarse de forma incremental siguiendo los sprints propuestos, priorizando los cambios de mayor impacto y menor riesgo.

**Beneficios esperados:**
- ✅ API más predecible y fácil de usar
- ✅ Mejor experiencia para LLMs (menos confusión semántica)
- ✅ Código más mantenible y consistente
- ✅ Documentación más clara y precisa
- ✅ Menos errores de uso por parte de los usuarios

**Riesgos mitigados:**
- ⚠️ Breaking changes documentados y planificados
- ⚠️ Tests actualizados para validar cambios
- ⚠️ Documentación completa de migración
- ⚠️ Implementación incremental para facilitar revisión

---

**Última actualización**: Consolidación de análisis de múltiples agentes
**Versión del plan**: 1.0 (Plan Maestro)


