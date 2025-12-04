# Radical Consistency Plan - MCP Bit2Me

## Análisis Exhaustivo de Inconsistencias

Tras una revisión completa del código, se han identificado **inconsistencias críticas** que afectan la calidad y usabilidad de la API. Este plan propone una solución radical y completa.

---

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. INCONSISTENCIA EN TIMESTAMPS: `time` vs `timestamp` vs falta de `date`

#### Estado Actual

**Schemas que tienen `time` en lugar de `timestamp`:**
- [x] `MarketTickerResponse.time: number` (línea 11 de schemas.ts) - **DEBE SER `timestamp`**

**Schemas que tienen `timestamp` pero NO tienen `date`:**
- [x] `MarketOrderBookResponse.timestamp: number` (línea 49) - **FALTA `date`**
- [x] `PublicTradeResponse.timestamp: number` (línea 59) - **FALTA `date`** (aunque el mapper lo agrega)
- [x] `CandleResponse.timestamp: number` (línea 69) - **FALTA `date`**
- [x] `CurrencyRateResponse.timestamp: number` (línea 79) - **FALTA `date`**

**Schemas que tienen `date` pero NO tienen `timestamp`:**
- [x] `ChartDataPoint.date: string` (línea 39) - **FALTA `timestamp`**

**Mappers que NO usan `formatTimestamp`:**
- [x] `mapTickerResponse`: Usa `time` directamente en lugar de `formatTimestamp`
- [x] `mapOrderBookResponse`: No agrega `date` aunque tiene `timestamp`
- [x] `mapPublicTradesResponse`: Agrega `date` pero no usa `formatTimestamp` consistentemente
- [x] `mapCandlesResponse`: No agrega `date` aunque tiene `timestamp`
- [x] `mapCurrencyRateResponse`: No agrega `date` aunque tiene `timestamp`

#### Regla Propuesta
**TODOS los schemas DEBEN tener AMBOS campos:**
- `timestamp: number` - Timestamp en milisegundos (Unix epoch)
- `date: string` - Fecha legible en formato ISO 8601

**TODOS los mappers DEBEN usar `formatTimestamp`** para generar ambos campos consistentemente.

---

### 2. INCONSISTENCIA EN TIPOS DE DATOS: `string` vs `number` para cantidades monetarias

#### Estado Actual

**Schemas que usan `number` para cantidades monetarias:**
- [x] `ProBalanceResponse.balance: number` (línea 141)
- [x] `ProBalanceResponse.blocked_balance: number` (línea 142)
- [x] `ProBalanceResponse.available: number` (línea 143)
- [x] `ChartDataPoint.price_usd: number` (línea 40)
- [x] `ChartDataPoint.price_fiat: number` (línea 41)
- [x] `LoanOrderResponse.guarantee_amount: number` (línea 201)
- [x] `LoanOrderResponse.loan_amount: number` (línea 202)
- [x] `LoanOrderResponse.ltv: number` (línea 203)
- [x] `LoanOrderDetailsResponse.guarantee_amount: number` (línea 213)
- [x] `LoanOrderDetailsResponse.loan_amount: number` (línea 214)
- [x] `LoanOrderDetailsResponse.ltv: number` (línea 215)
- [x] `LoanOrderDetailsResponse.interest_rate: number` (línea 216)
- [x] `LoanCreateResponse.guarantee_amount: string` (línea 223) - **YA ES STRING** ✅
- [x] `LoanCreateResponse.loan_amount: string` (línea 224) - **YA ES STRING** ✅
- [x] `LoanIncreaseGuaranteeResponse.guarantee_amount: string` (línea 230) - **YA ES STRING** ✅
- [x] `LoanPaybackResponse.loan_amount: string` (línea 236) - **YA ES STRING** ✅
- [x] `ProOrderResponse.amount: number` (línea 251)
- [x] `ProOrderResponse.price: number` (línea 252)
- [x] `ProOrderResponse.filled_amount: number` (línea 253)
- [x] `ProTradeResponse.amount: number` (línea 262)
- [x] `ProTradeResponse.price: number` (línea 263)
- [x] `ProTradeResponse.fee: number` (línea 264)
- [x] `ProDepositResponse.amount: number` (línea 272)
- [x] `ProWithdrawResponse.amount: number` (línea 279)
- [x] `PortfolioValuationResponse.total_value: number` (línea 287)
- [x] `PortfolioValuationResponse.details[].amount: number` (línea 290)
- [x] `PortfolioValuationResponse.details[].price_unit: number` (línea 291)
- [x] `PortfolioValuationResponse.details[].value_fiat: number` (línea 292)

**Schemas que ya usan `string` correctamente:**
- ✅ `WalletPocketResponse.balance: string`
- ✅ `WalletPocketDetailsResponse.balance: string`
- ✅ `WalletPocketDetailsResponse.available: string`
- ✅ `WalletPocketDetailsResponse.blocked: string`
- ✅ `EarnWalletResponse.balance: string`
- ✅ `EarnWalletDetailsResponse.balance: string`
- ✅ `MarketTickerResponse.price: string`
- ✅ `MarketTickerResponse.volume_24h: string`
- ✅ `MarketTickerResponse.high_24h: string`
- ✅ `MarketTickerResponse.low_24h: string`
- ✅ `MarketOrderBookResponse.bids[].price: string`
- ✅ `MarketOrderBookResponse.bids[].amount: string`
- ✅ `MarketOrderBookResponse.asks[].price: string`
- ✅ `MarketOrderBookResponse.asks[].amount: string`
- ✅ `PublicTradeResponse.price: string`
- ✅ `PublicTradeResponse.amount: string`
- ✅ `CandleResponse.open: string`
- ✅ `CandleResponse.high: string`
- ✅ `CandleResponse.low: string`
- ✅ `CandleResponse.close: string`
- ✅ `CandleResponse.volume: string`

#### Regla Propuesta
**TODAS las cantidades monetarias DEBEN ser `string`** para:
- Precisión: Evitar pérdida de precisión en números grandes
- Consistencia: Todas las APIs de cripto usan strings para cantidades
- Flexibilidad: Permite valores como "0.00000001" sin problemas de precisión

**Excepciones (mantener `number`):**
- `timestamp`: Siempre `number`
- `ltv`, `apr`, `apy`: Porcentajes, pueden ser `number` o `string` (decidir estándar)
- `limit`, `offset`: Parámetros de paginación, siempre `number`
- Contadores, índices, IDs numéricos

---

### 3. INCONSISTENCIA EN NOMBRES DE CAMPOS: `symbol` vs falta de campo

#### Estado Actual

**Schemas que NO tienen campo `symbol` pero deberían:**
- [x] `MarketTickerResponse` - No tiene `symbol`, solo `pair` (línea 10)
- [x] `MarketOrderBookResponse` - Tiene `symbol` pero debería ser `pair` (línea 48)
- [x] `PublicTradeResponse` - Tiene `symbol` pero debería ser `pair` (línea 58)
- [x] `CandleResponse` - Tiene `symbol` pero debería ser `pair` (línea 68)
- [x] `ProOrderResponse` - Tiene `symbol` pero debería ser `pair` (línea 250)
- [x] `ProTradeResponse` - Tiene `symbol` pero debería ser `pair` (línea 261)
- [x] `LoanConfigResponse` - Tiene `currency` pero debería ser `symbol` (línea 195)

#### Regla Propuesta
**Glosario de términos:**
- `symbol`: Símbolo de criptomoneda (ej: `BTC`, `ETH`)
- `fiat`: Moneda fiat (ej: `EUR`, `USD`)
- `pair`: Par de trading (ej: `BTC/EUR`, `ETH/USD`)
- `currency`: Genérico, puede ser crypto o fiat (usar solo cuando sea ambiguo)

**Reglas específicas:**
- Si la respuesta es sobre un ticker/orden/libro de órdenes → usar `pair: string`
- Si la respuesta es sobre un asset/wallet → usar `symbol: string`
- Si la respuesta es sobre configuración de préstamos → usar `symbol: string` (guarantee currency)

---

### 4. INCONSISTENCIA EN NOMBRES DE CAMPOS: `snake_case` vs `camelCase`

#### Estado Actual

**Schemas que aún tienen `camelCase`:**
- Ya se corrigió en el plan anterior, pero verificar que TODOS los campos estén en `snake_case`

#### Regla Propuesta
**TODOS los campos de respuesta DEBEN estar en `snake_case`** para consistencia con convenciones de APIs REST.

---

## PLAN DE IMPLEMENTACIÓN RADICAL

### Fase 1: Corregir Timestamps (CRÍTICO)

#### 1.1 Actualizar Schemas
- [x] Cambiar `MarketTickerResponse.time` → `timestamp: number`
- [x] Agregar `date: string` a `MarketOrderBookResponse`
- [x] Agregar `date: string` a `PublicTradeResponse`
- [x] Agregar `date: string` a `CandleResponse`
- [x] Agregar `date: string` a `CurrencyRateResponse`
- [x] Agregar `timestamp: number` a `ChartDataPoint`

#### 1.2 Actualizar Mappers
- [x] `mapTickerResponse`: Usar `formatTimestamp` en lugar de `time` directo
- [x] `mapOrderBookResponse`: Agregar `date` usando `formatTimestamp`
- [x] `mapPublicTradesResponse`: Usar `formatTimestamp` consistentemente
- [x] `mapCandlesResponse`: Agregar `date` usando `formatTimestamp`
- [x] `mapCurrencyRateResponse`: Agregar `date` usando `formatTimestamp`
- [x] `mapChartResponse`: Agregar `timestamp` usando `formatTimestamp`

#### 1.3 Actualizar Tests
- [x] Actualizar tests para verificar `timestamp` y `date` en todas las respuestas
- [x] Verificar que `formatTimestamp` se use correctamente

---

### Fase 2: Estandarizar Tipos de Datos (CRÍTICO)

#### 2.1 Actualizar Schemas - Cambiar `number` → `string` para cantidades monetarias
- [x] `ProBalanceResponse`: `balance`, `blocked_balance`, `available` → `string`
- [x] `ChartDataPoint`: `price_usd`, `price_fiat` → `string`
- [x] `LoanOrderResponse`: `guarantee_amount`, `loan_amount` → `string` (mantener `ltv: number`)
- [x] `LoanOrderDetailsResponse`: `guarantee_amount`, `loan_amount` → `string` (mantener `ltv: number`, `interest_rate: number`)
- [x] `ProOrderResponse`: `amount`, `price`, `filled_amount` → `string`
- [x] `ProTradeResponse`: `amount`, `price`, `fee` → `string`
- [x] `ProDepositResponse`: `amount` → `string`
- [x] `ProWithdrawResponse`: `amount` → `string`
- [x] `PortfolioValuationResponse`: `total_value` → `string`
- [x] `PortfolioValuationResponse.details[].amount: number` (línea 290)
- [x] `PortfolioValuationResponse.details[].price_unit: number` (línea 291)
- [x] `PortfolioValuationResponse.details[].value_fiat: number` (línea 292)

#### 2.2 Actualizar Mappers
- [x] Actualizar todos los mappers para convertir números a strings usando `.toString()` o mantener como string si ya viene de la API
- [x] Asegurar que los mappers manejen correctamente valores `null`/`undefined` → `"0"`

#### 2.3 Actualizar Tests
- [x] Actualizar tests para verificar que cantidades monetarias sean `string`
- [x] Verificar conversión correcta de números a strings

---

### Fase 3: Corregir Nombres de Campos de Symbol/Pair

#### 3.1 Actualizar Schemas
- [x] `MarketOrderBookResponse.symbol` → `pair: string`
- [x] `PublicTradeResponse.symbol` → `pair: string`
- [x] `CandleResponse.symbol` → `pair: string`
- [x] `ProOrderResponse.symbol` → `pair: string`
- [x] `ProTradeResponse.symbol` → `pair: string`
- [x] `LoanConfigResponse.currency` → `symbol: string` (guarantee currency)

#### 3.2 Actualizar Mappers
- [x] Actualizar mappers para mapear correctamente `symbol` → `pair` o mantener `symbol` según corresponda
- [x] Verificar que los mappers extraigan el `pair` correctamente de la respuesta de la API

#### 3.3 Actualizar Tests
- [x] Actualizar tests para verificar nombres correctos de campos

---

### Fase 4: Verificar snake_case Completo

#### 4.1 Revisar Todos los Schemas
- [x] Verificar que TODOS los campos estén en `snake_case`
- [x] Buscar cualquier `camelCase` restante y corregirlo

#### 4.2 Revisar Todos los Mappers
- [x] Verificar que TODOS los mappers mapeen a `snake_case`
- [x] Buscar cualquier mapeo a `camelCase` y corregirlo

#### 4.3 Actualizar Tests
- [x] Verificar que tests esperen `snake_case`

---

## MEJORAS ADICIONALES IDENTIFICADAS

### 6. INCONSISTENCIA EN TIPOS DE PARÁMETROS DE PAGINACIÓN

#### Estado Actual

**Parámetros de paginación con tipos inconsistentes:**

**Wallet Tools:**
- ✅ `wallet_get_transactions`: `limit: string`, `offset: string` (líneas 73-74)

**Earn Tools:**
- ✅ `earn_get_transactions`: `limit: string`, `offset: string` (líneas 51-52)

**Loan Tools:**
- [x] `loan_get_transactions`: `limit: number`, `offset: number` (líneas 52-53)
- [x] `loan_get_orders`: `limit: number`, `offset: number` (líneas 64-65)

**Pro Tools:**
- [x] `pro_get_transactions`: `limit: number`, `offset: number` (líneas 32-33)

**Market Tools:**
- [x] `market_get_public_trades`: `limit: number` (línea 116)
- [x] `market_get_candles`: `limit: number` (línea 135)

#### Impacto
- **Inconsistencia**: Algunos tools esperan `string`, otros `number` para el mismo concepto
- **Errores de tipo**: Los usuarios pueden pasar el tipo incorrecto
- **Confusión**: No hay razón para que algunos sean `string` y otros `number`

#### Regla Propuesta
**TODOS los parámetros de paginación DEBEN ser `number`** porque:
- Son valores numéricos, no cantidades monetarias
- Es más natural trabajar con números para límites y offsets
- Consistente con convenciones de APIs REST

**Cambios requeridos:**
- [x] `wallet_get_transactions`: `limit: string` → `limit: number`, `offset: string` → `offset: number`
- [x] `earn_get_transactions`: `limit: string` → `limit: number`, `offset: string` → `offset: number`

---

### 7. HANDLERS USANDO NOMBRES ANTIGUOS DE PARÁMETROS (CRÍTICO)

#### Estado Actual

**Handlers que usan nombres antiguos:**

**wallet.ts:**
- [x] Línea 129: `args.pocketId` → **DEBE SER `args.pocket_id`**
- [x] Línea 142: `args.pocketId` → **DEBE SER `args.pocket_id`**
- [x] Línea 150: `args.currency` → **DEBE SER `args.symbol`** (según schema actualizado)
- [x] Línea 189: `args.transactionId` → **DEBE SER `args.transaction_id`**

**loan.ts:**
- [x] Línea 173: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 180: `args.guaranteeCurrency` → **DEBE SER `args.guarantee_symbol`**
- [x] Línea 181: `args.guaranteeAmount` → **DEBE SER `args.guarantee_amount`**
- [x] Línea 182: `args.loanCurrency` → **DEBE SER `args.loan_fiat`**
- [x] Línea 183: `args.loanAmount` → **DEBE SER `args.loan_amount`**
- [x] Línea 190: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 191: `args.guaranteeAmount` → **DEBE SER `args.guarantee_amount`**
- [x] Línea 198: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 199: `args.paybackAmount` → **DEBE SER `args.payback_amount`**

**pro.ts:**
- [x] Línea 143: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 152: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 158: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 165: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 190: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 195: `args.stopPrice` → **DEBE SER `args.stop_price`** (según schema actualizado)
- [x] Línea 203: `args.orderId` → **DEBE SER `args.order_id`**
- [x] Línea 209: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)

**earn.ts:**
- [x] Línea 145: `args.walletId` → **DEBE SER `args.wallet_id`** (según schema actualizado)
- [x] Línea 154: `args.walletId` → **DEBE SER `args.wallet_id`** (según schema actualizado)
- [x] Línea 166: `args.pocketId` → **DEBE SER `args.pocket_id`** (según schema actualizado)
- [x] Línea 167: `args.currency` → **DEBE SER `args.symbol`** (según schema actualizado)
- [x] Línea 194: `args.walletId` → **DEBE SER `args.wallet_id`** (según schema actualizado)
- [x] Línea 200: `args.walletId` → **DEBE SER `args.wallet_id`** (según schema actualizado)

**market.ts:**
- [x] Línea 232: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 239: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 245: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 254: `args.symbol` → **DEBE SER `args.pair`** (según schema actualizado)
- [x] Línea 266: `args.fiat_currency` → **DEBE SER `args.fiat`** (según schema actualizado)
- [x] Línea 212: `args.includeTestnet` → **DEBE SER `args.include_testnet`** (según schema actualizado)
- [x] Línea 213: `args.showExchange` → **DEBE SER `args.show_exchange`** (según schema actualizado)
- [x] Línea 222: `args.showExchange` → **DEBE SER `args.show_exchange`** (según schema actualizado)

**aggregation.ts:**
- [x] Línea 23: `args.fiat_currency` → **DEBE SER `args.fiat`** (según schema actualizado)

#### Impacto
- **Errores en runtime**: Los handlers no encontrarán los parámetros porque los schemas esperan nombres diferentes
- **Inconsistencia crítica**: Los schemas dicen una cosa pero los handlers hacen otra
- **Bugs silenciosos**: Puede causar valores `undefined` que pasan desapercibidos

#### Regla Propuesta
**TODOS los handlers DEBEN usar los nombres de parámetros EXACTOS** que están definidos en los schemas de las tools.

---

### 8. `pro_get_transactions` NO USA MAPPER

#### Estado Actual

**Tool que retorna datos raw sin mapper:**
- [x] `pro_get_transactions` (línea 141-148 de pro.ts): Retorna `data` directamente sin pasar por mapper

**Todos los demás tools:**
- ✅ Usan mappers para transformar respuestas

#### Impacto
- **Inconsistencia**: Una tool retorna formato diferente al resto
- **Falta de optimización**: No se aplican las mejoras de formato (timestamps, snake_case, etc.)
- **Datos inconsistentes**: La respuesta puede tener campos en camelCase, falta de date/timestamp, etc.

#### Regla Propuesta
**TODAS las tools DEBEN usar mappers** para:
- Consistencia en formato de respuestas
- Aplicar transformaciones estándar (timestamps, snake_case, etc.)
- Optimizar estructura de datos

**Acción requerida:**
- [x] Crear `mapProTransactionsResponse` si no existe
- [x] Actualizar `pro_get_transactions` para usar el mapper

---

### 9. INCONSISTENCIA EN USO DE `wrapResponseWithRaw`

#### Estado Actual

**Tools que usan `wrapResponseWithRaw`:**
- ✅ `wallet_get_pocket_details` (línea 137)
- ✅ `wallet_get_pocket_addresses` (línea 145)
- ✅ `wallet_get_transaction_details` (probablemente)

**Tools que NO usan `wrapResponseWithRaw`:**
- [x] Todas las demás tools

#### Impacto
- **Inconsistencia**: Algunas tools incluyen `raw` y otras no
- **Falta de transparencia**: Los usuarios no pueden ver la respuesta original cuando la necesitan
- **Debugging difícil**: No hay forma de ver qué retornó realmente la API

#### Regla Propuesta
**TODAS las tools DEBEN usar `wrapResponseWithRaw`** para:
- Consistencia en estructura de respuestas
- Transparencia: Los usuarios pueden acceder a datos raw cuando los necesiten
- Debugging: Facilita identificar problemas con la API

**Excepción**: Solo si `INCLUDE_RAW_RESPONSE` está deshabilitado en configuración.

---

### 10. VALORES POR DEFECTO HARDCODEADOS EN LUGAR DE CONSTANTES

#### Estado Actual

**Valores hardcodeados encontrados:**

**wallet_get_transactions:**
- [x] `params.limit || 10` (línea 163) - **DEBE USAR `DEFAULT_PAGINATION_LIMIT`**

**Mappers:**
- [x] `|| "0"` usado en múltiples lugares - **DEBE SER constante `DEFAULT_AMOUNT = "0"`**
- [x] `|| ""` usado en múltiples lugares - **DEBE SER constante `DEFAULT_STRING = ""`**
- [x] `|| []` usado en múltiples lugares - **DEBE SER constante `DEFAULT_ARRAY = []`**

#### Regla Propuesta
**TODOS los valores por defecto DEBEN ser constantes** definidas en `constants.ts`:
- [x] `DEFAULT_PAGINATION_LIMIT = 10`
- [x] `DEFAULT_PAGINATION_OFFSET = 0`
- [x] `MAX_PAGINATION_LIMIT = 100`
- [x] `DEFAULT_AMOUNT = "0"`
- [x] `DEFAULT_STRING = ""`
- [x] `DEFAULT_ARRAY = []`

---

### 11. FALTA DE VALIDACIÓN DE LÍMITES DE PAGINACIÓN

#### Estado Actual

**No hay validación de límites:**
- [x] `wallet_get_transactions`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `earn_get_transactions`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `loan_get_transactions`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `loan_get_orders`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `pro_get_transactions`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `market_get_public_trades`: No valida que `limit <= MAX_PAGINATION_LIMIT`
- [x] `market_get_candles`: No valida que `limit <= MAX_PAGINATION_LIMIT`

#### Regla Propuesta
**VALIDAR límites antes de hacer llamadas**:
```typescript
if (limit && limit > MAX_PAGINATION_LIMIT) {
    throw new ValidationError(`Limit cannot exceed ${MAX_PAGINATION_LIMIT}`);
}
```

---

### 12. ESTRUCTURA DE RESPUESTAS CON PAGINACIÓN INCONSISTENTE

#### Estado Actual

**Solo `wallet_get_transactions` retorna metadata:**
- ✅ `wallet_get_transactions`: Retorna `{ data: [], metadata: { total, limit, offset } }`

**Otros tools con paginación NO retornan metadata:**
- [x] `earn_get_transactions`: Retorna solo array
- [x] `loan_get_transactions`: Retorna solo array
- [x] `loan_get_orders`: Retorna solo array
- [x] `pro_get_transactions`: Retorna solo array
- [x] `market_get_public_trades`: Retorna solo array
- [x] `market_get_candles`: Retorna solo array

#### Regla Propuesta
**TODAS las respuestas con paginación DEBEN incluir metadata**:
```typescript
{
    data: [...],
    metadata: {
        total: number,
        limit: number,
        offset: number,
        has_more: boolean
    }
}
```

---

## MEJORAS ADICIONALES DE CALIDAD Y CONSISTENCIA

### 13. NORMALIZACIÓN INCONSISTENTE DE PARÁMETROS

#### Estado Actual

**Normalización solo en `market_get_ticker`:**
- ✅ `market_get_ticker`: Normaliza `currency` y `symbol` a `toUpperCase()` (líneas 144-145)

**Tools que NO normalizan:**
- [x] Todos los demás tools que aceptan `symbol`, `pair`, `currency`, `fiat`
- [x] `market_get_chart`: No normaliza `pair`
- [x] `market_get_order_book`: No normaliza `pair`
- [x] `pro_create_order`: No normaliza `pair`
- [x] `wallet_get_networks`: No normaliza `symbol`
- [x] `earn_create_transaction`: No normaliza `symbol`

#### Impacto
- **Errores silenciosos**: Si el usuario pasa `btc` en lugar de `BTC`, puede fallar
- **Inconsistencia**: Algunos parámetros se normalizan, otros no
- **UX pobre**: Los usuarios deben recordar el formato exacto

#### Regla Propuesta
**NORMALIZAR todos los parámetros de símbolos/pairs** a `toUpperCase()`:
- `symbol` → `symbol.toUpperCase()`
- `pair` → `pair.toUpperCase()`
- `currency` → `currency.toUpperCase()`
- `fiat` → `fiat.toUpperCase()`

**Crear función helper:**
```typescript
function normalizeSymbol(symbol: string): string {
    return symbol.toUpperCase().trim();
}
```

---

### 14. MENSAJES DE ERROR COMO STRINGS SIMPLES

#### Estado Actual

**Errores retornados como strings:**
- [x] `wallet_get_pocket_details`: Retorna `"Pocket not found."` como string simple (línea 133)
- [x] `market_get_ticker`: Retorna `"Error fetching ticker: ${error.message}"` como string (línea 156)

**Sistema de errores disponible:**
- ✅ `ValidationError`, `NotFoundError`, `Bit2MeAPIError`, etc. en `utils/errors.ts`

#### Impacto
- **Inconsistencia**: Algunos errores usan el sistema estructurado, otros son strings simples
- **Falta de contexto**: Los strings simples no tienen código de error ni metadata
- **Manejo difícil**: Los clientes no pueden distinguir tipos de errores

#### Regla Propuesta
**TODOS los errores DEBEN usar el sistema de errores estructurado**:
- `throw new NotFoundError("Pocket not found")` en lugar de retornar string
- `throw new ValidationError("Invalid pair format")` en lugar de retornar string

---

### 15. VALORES POR DEFECTO DUPLICADOS

#### Estado Actual

**Valores por defecto en múltiples lugares:**

**aggregation.ts:**
- [x] `args.fiat_currency || "EUR"` (línea 23) - Ya tiene default en schema

**Mappers:**
- [x] Múltiples lugares con `|| "0"`, `|| ""`, `|| []` - Deberían usar constantes

#### Regla Propuesta
**ELIMINAR valores por defecto duplicados**:
- Si el schema ya define un default, no duplicar en el handler
- Usar constantes en lugar de valores hardcodeados

---

### 16. FALTA DE DOCUMENTACIÓN JSDoc EN FUNCIONES

#### Estado Actual

**Funciones sin documentación:**
- [x] La mayoría de los mappers no tienen JSDoc
- [x] Algunos handlers no tienen JSDoc
- [x] Helpers no tienen JSDoc

#### Regla Propuesta
**AGREGAR JSDoc a TODAS las funciones públicas**:
```typescript
/**
 * Maps raw Bit2Me API ticker response to optimized schema
 * @param data - Raw API response
 * @returns Optimized ticker response with timestamp and date
 */
export function mapTickerResponse(data: any): MarketTickerResponse {
    // ...
}
```

---

### 17. USO EXCESIVO DE `any`

#### Estado Actual

**Uso de `any` en múltiples lugares:**
- [x] Handlers: `args: any`
- [x] Mappers: `data: any`
- [x] Parámetros: `params: any`

#### Impacto
- **Falta de type safety**: TypeScript no puede verificar tipos
- **Errores en runtime**: Fácil pasar tipos incorrectos
- **Autocompletado pobre**: Los IDEs no pueden ayudar

#### Regla Propuesta
**REDUCIR uso de `any`** creando tipos específicos:
```typescript
interface MarketToolArgs {
    symbol?: string;
    pair?: string;
    fiat?: string;
    // ...
}

export async function handleMarketTool(name: string, args: MarketToolArgs) {
    // ...
}
```

---

### 18. INCONSISTENCIA EN MANEJO DE CASOS EDGE

#### Estado Actual

**Manejo inconsistente de:**
- Arrays vacíos: Algunos retornan `[]`, otros `null`, otros `undefined`
- Valores faltantes: Algunos usan `|| "0"`, otros `|| ""`, otros `?? null`
- Errores de API: Algunos los propagan, otros los capturan silenciosamente

#### Regla Propuesta
**ESTANDARIZAR manejo de casos edge**:
- Arrays vacíos: Siempre retornar `[]` (no `null` ni `undefined`)
- Valores faltantes: Usar constantes (`DEFAULT_AMOUNT`, `DEFAULT_STRING`)
- Errores: Siempre propagar con contexto adecuado

---

### 19. FALTA DE VALIDACIÓN DE PARÁMETROS REQUERIDOS

#### Estado Actual

**No hay validación explícita:**
- Los schemas definen `required`, pero los handlers no validan explícitamente
- Si falta un parámetro requerido, el error viene de la API, no de validación local

#### Regla Propuesta
**VALIDAR parámetros requeridos** antes de hacer llamadas:
```typescript
if (!args.pocket_id) {
    throw new ValidationError("pocket_id is required");
}
```

O mejor: Usar una librería de validación como `zod` para validar args.

---

### 20. INCONSISTENCIA EN FORMATO DE RESPUESTAS

#### Estado Actual

**Algunas respuestas son arrays, otras objetos:**
- `wallet_get_pockets`: Retorna array
- `wallet_get_pocket_details`: Retorna objeto
- `market_get_assets`: Retorna array
- `market_get_asset_details`: Retorna objeto

**Esto está bien**, pero debería ser consistente y documentado.

#### Regla Propuesta
**DOCUMENTAR cuándo retornar array vs objeto**:
- Listas → Array
- Detalles de un item → Objeto
- Siempre documentar en la descripción de la tool

---

### 21. FALTA DE TIMEOUTS ESPECÍFICOS POR OPERACIÓN

#### Estado Actual

**Todos usan el mismo timeout:**
- `REQUEST_TIMEOUT` global para todas las operaciones

#### Regla Propuesta
**CONSIDERAR timeouts específicos** para operaciones que pueden tardar más:
- [x] `PORTFOLIO_VALUATION_TIMEOUT` (más largo, hace múltiples llamadas)
- [x] `MARKET_DATA_TIMEOUT` (puede ser más corto)

---

## MEJORAS ADICIONALES DE ARQUITECTURA Y CÓDIGO

### 22. CÓDIGO DUPLICADO EN HANDLERS

#### Estado Actual

**Patrón repetido en múltiples handlers:**
```typescript
// Patrón repetido ~30 veces:
const params: any = {};
if (args.param1) params.param1 = args.param1;
if (args.param2) params.param2 = args.param2;
const data = await bit2meRequest("GET", "/endpoint", params);
const optimized = mapXXXResponse(data);
return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
```

#### Impacto
- **Mantenibilidad**: Cambios requieren tocar múltiples lugares
- **Errores**: Fácil olvidar aplicar cambios en todos los lugares
- **Legibilidad**: Código repetitivo es difícil de leer

#### Regla Propuesta
**CREAR helper function** para reducir duplicación:
```typescript
async function executeTool<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE",
    args: any,
    mapper: (data: any) => T,
    paramsBuilder?: (args: any) => any
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    const params = paramsBuilder ? paramsBuilder(args) : {};
    const data = await bit2meRequest(method, endpoint, params);
    const optimized = mapper(data);
    return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
}
```

---

### 23. FALTA DE REUTILIZACIÓN DE LÓGICA COMÚN

#### Estado Actual

**Lógica duplicada en:**
- Construcción de parámetros
- Manejo de respuestas
- Manejo de errores
- Validación de parámetros

#### Regla Propuesta
**EXTRAER lógica común** a funciones helper reutilizables.

---

### 24. INCONSISTENCIA EN MANEJO DE RESPUESTAS VACÍAS

#### Estado Actual

**Manejo inconsistente:**
- Algunos retornan `[]`
- Otros retornan `{}`
- Otros retornan `null`
- Otros lanzan error

#### Regla Propuesta
**ESTANDARIZAR**:
- Arrays vacíos → `[]`
- Objetos vacíos → `{}` con estructura mínima (ej: `{ data: [], metadata: {...} }`)
- Nunca retornar `null` o `undefined`

---

### 25. FALTA DE CACHE PARA DATOS QUE CAMBIAN POCO

#### Estado Actual

**No hay cache para:**
- [x] Lista de assets (`market_get_assets`)
- [x] Configuración de mercado (`market_get_config`)
- [x] Configuración de préstamos (`loan_get_config`)
- [x] Redes disponibles (`wallet_get_networks`)

#### Regla Propuesta
**IMPLEMENTAR cache** con TTL corto (1-5 minutos) para datos que cambian poco.

---

### 26. FALTA DE RATE LIMITING CLIENT-SIDE

#### Estado Actual

**Solo hay retry logic**, pero no rate limiting proactivo.

#### Regla Propuesta
**CONSIDERAR rate limiting** para evitar hacer demasiadas llamadas seguidas.

---

### 27. FALTA DE MÉTRICAS Y MONITOREO

#### Estado Actual

**No hay métricas de:**
- Tiempo de respuesta por tool
- Tasa de errores por tool
- Uso de cada tool

#### Regla Propuesta
**AGREGAR métricas básicas** usando el logger estructurado.

---

### 28. INCONSISTENCIA EN MANEJO DE VERSIONES DE API

#### Estado Actual

**Endpoints usan diferentes versiones:**
- `/v1/...`
- `/v2/...`
- `/v3/...`

**No hay documentación** de cuándo usar cada versión.

#### Regla Propuesta
**DOCUMENTAR** qué versión usar y por qué.

---

### 29. FALTA DE TESTS PARA CASOS EDGE

#### Estado Actual

**Tests cubren casos happy path**, pero faltan:
- Respuestas vacías
- Errores de API
- Valores límite
- Parámetros inválidos

#### Regla Propuesta
**AGREGAR tests** para casos edge.

---

### 30. INCONSISTENCIA EN DOCUMENTACIÓN DE TOOLS

#### Estado Actual

**Algunas tools tienen descripciones detalladas**, otras son muy básicas.

#### Regla Propuesta
**ESTANDARIZAR formato** de descripciones:
- Propósito claro
- Ejemplos de uso
- Parámetros documentados
- Respuesta documentada

---

## MEJORAS CRÍTICAS ADICIONALES

### Fase 31: Estandarizar Uso de `bit2meRequest`
- [x] Cambiar `market_get_chart` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_assets` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_asset_details` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_config` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_order_book` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_public_trades` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_candles` de `axios.get` a `bit2meRequest`
- [x] Cambiar `market_get_currency_rate` de `axios.get` a `bit2meRequest`
- [x] Cambiar `getTicker` de `axios.get` a `bit2meRequest` o crear helper público

### Fase 32: Leer Versión desde package.json
- [x] Crear función helper para leer versión
- [x] Reemplazar hardcoded "1.1.1" en `index.ts`

### Fase 33: Reemplazar console.error por logger
- [x] Reemplazar `console.error` en `config.ts` por `logger`
- [x] Reemplazar `console.error` en `index.ts` por `logger` (excepto línea 3)

### Fase 34: Sanitizar Parámetros en URLs
- [x] Crear función helper `buildEndpoint` o `sanitizeUrlParam`
- [x] Aplicar `encodeURIComponent` a todos los parámetros en URLs
- [x] Actualizar ~15 endpoints que construyen URLs con parámetros

### Fase 35: Mejorar Manejo de Errores
- [x] Agregar logging a `getMarketPrice` catch block
- [x] Considerar retornar `null` en lugar de `0` para indicar fallo

### Fase 36: Agregar Logging a Handlers
- [x] Agregar logging al inicio de cada handler
- [x] Agregar logging al final con duración
- [x] Agregar logging de errores con contexto

### Fase 37: Validación de Formato
- [x] Crear función `validatePair`
- [x] Crear función `validateUUID`
- [x] Crear función `validateISO8601`
- [x] Crear función `validateSymbol`
- [x] Crear función `validateFiat`
- [x] Aplicar validación a todos los handlers

---

## RESUMEN FINAL DE TODAS LAS MEJORAS

### Cambios Críticos de Funcionalidad
- **15+ correcciones** en handlers con nombres antiguos
- **8 endpoints** cambiados de `axios` a `bit2meRequest`
- **15+ URLs** a sanitizar con `encodeURIComponent`
- **Versión** a leer desde `package.json`

### Mejoras de Consistencia
- **~30 tools** a estandarizar con `wrapResponseWithRaw`
- **~20 tools** a normalizar parámetros
- **6 tools** a agregar metadata de paginación
- **7 tools** a validar límites

### Mejoras de Calidad
- **~50 lugares** a refactorizar con helpers
- **~30 handlers** a agregar validación
- **Todas las funciones** a documentar con JSDoc
- **Valores constantes** a extraer

### Mejoras de Arquitectura
- **Reducir `any`** en ~100 lugares
- **Crear helpers** para reducir duplicación
- **Estandarizar** manejo de casos edge
- **Agregar logging** a todos los handlers
- **Validar logging** a todos los handlers
- **Validar formatos** de parámetros

### Mejoras de Seguridad
- **Sanitizar URLs** con `encodeURIComponent`
- **Validar formatos** antes de usar parámetros
- **Reemplazar console.error** por logger sanitizado

---

**Total estimado de cambios**: ~250+ cambios en código
**Tiempo estimado**: ~15-20 días de desarrollo
**Breaking changes**: Mayor versión (3.0.0)
**Impacto**: Alto - Mejora significativa en consistencia, calidad y seguridad

---

**Última actualización**: Implementación Completada Exitosamente
**Versión del plan**: 4.0 - IMPLEMENTADO
