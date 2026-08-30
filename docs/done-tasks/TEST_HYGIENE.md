# Higiene de tests y mappers muertos

Quitar `any` en tests, mappers sin caller de producción y cablear el harness de audit.

## Contexto

### Qué es

Tres deudas del refactor ≤200L: tipos flojos en tests, mappers que nadie llama desde `src/tools`, y `tests/audit-harness.ts` duplicado en cada test de audit.

### Por qué

`any` esconde roturas de contrato. Un mapper sin tool es inventario falso (AGENTS lo citaba como ejemplo). El harness huérfano vuelve a copiar tmpdir/env.

### Architecture

`loggerMock` sigue en `vi.hoisted` de cada test: Vitest hoist no puede importar el mock desde el harness. El harness DRY de tmpdir, env y fs de test.

### Security

Los `writeFileSync`/`chmodSync` de audit van por helpers del harness con disable justificado (path de tmpdir).

## Change log

### 2026-08-30 23:08 UTC — constantes muertas y exports internos

Se borran constantes sin caller (`PRICE_CACHE_TTL_MS`, `BACKOFF_JITTER_MS`, `TESTNET_MARKER`, …). Paginación y timeouts de config leen `src/constants.ts`. Dejan de exportarse helpers de un solo módulo (`jsonRpc*`, `sanitizeString`, `validatePromptArg`, …). Fuera: `getToolAttributes`, `clearMetadataCache`, `_resetRequestCacheForTests`, `set/clearCorrelationId`. Landing: `pnpm` en vez de `npm`/`npx`.

### 2026-08-30 23:02 UTC — any de services y restos P2

Se quitan los `any` de `bit2meRequest`, firma HMAC, axios errors, `cachedGet` y contextual echo. `buildContextualResponse` deja de ser API pública; `wrapResponseWithRaw` no se reexporta en el barrel. ADR 0001 apunta a `http-transport-auth`/`probes`. E2E: `isE2E` interno y `pnpm test:e2e`. Se parte `handlers-earn.test.ts` (>200L).

### 2026-08-30 22:52 UTC — ADR 0002 y any de mappers

El ADR 0002 apunta a `tests/config-defaults.test.ts` y `config-http.test.ts` (el monolito `config.test.ts` ya no existe). Los guards de payload pasan a `unknown` (`asRecord`, `asString`, `firstDefined`). Se quitan los `eslint-disable no-explicit-any` de `src/utils/mappers/`. `WalletMovementResponse.created_at`/`type` admiten `undefined` como en los tests; `CandleResponse.volume` admite número si el raw lo trae así.

### 2026-08-30 22:42 UTC — contrato portfolio, validators muertos, mapper account

`portfolio_get_valuation` acepta `quote_symbol` (canónico) y `fiat_symbol` (alias); el catálogo ya no deja al cliente en EUR por defecto. `ProTradesResponse` incluye `count`. `response-validators.ts` se queda con el ticker Zod que usa market. `mapOperationConfirmationResponse` pasa a `mappers/broker.ts`. Se borra `normalizeLoanMovementType` (cero callers). Mocks de test dejan de inventar `BIT2ME_GATEWAY_URL` / `config`.

### 2026-08-30 22:34 UTC — duplicado de tests, schemas muertos, getTicker

`tests/tools/general.test.ts` y `market.test.ts` eran el mismo fichero (el split ≤200L copió el monolito dos veces). Cada uno se queda con su suite. Se borran schemas sin caller (`account.ts` portfolio, `WalletAddressDetailsResponse`, `OrderCreationResponse`, `ChartDataPoint`) y fixtures huérfanos (`MOCK_ACCOUNT_INFO`, etc.). `getTicker` pasa a `Promise<unknown>`; `WalletPocketResponse` incluye `blocked` y `created_at` como el mapper. Comentario tenant en `broker-read.ts` fuera.

### 2026-08-30 22:30 UTC — any, mappers muertos, harness

Se tipan los `any` de `broker-error-redaction`, `config-defaults`, `portfolio-valuation`, `tools-assets`, `index-call` e `index-list`. Se borran `mapAccountInfoResponse`, `mapWalletPocketDetailsResponse` y `mapEarnPositionDetailsResponse` (sin caller en tools; Earn/Wallet filtran la lista). Schemas huérfanos asociados fuera. `audit-path` / `audit-record` usan `tests/audit-harness.ts`. El ejemplo de AGENTS pasa a `mapWalletPocketsResponse`.
