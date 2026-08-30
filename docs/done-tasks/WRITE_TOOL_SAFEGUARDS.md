# Salvaguardas de tools WRITE (confirm, idempotencia, importes)

Protecciones contra el diputado confuso del LLM: confirmación explícita, clave de idempotencia estable y validación estricta de importes.

## Contexto

### Qué es

Capa de defensa en las tools que mueven dinero (Pro, Earn, Loan) y en las quotes de Broker. El servidor MCP es un proxy local de un solo usuario; el riesgo real es que el modelo dispare una mutación irreversible o reintente con una clave nueva.

### Por qué

Un agente puede llamar `pro_create_order` o `earn_withdraw` en un solo paso. Sin `confirm=true` eso es un disparo accidental. Sin `idempotency_key` en el schema, un timeout hace que el modelo reintente con un UUID distinto y Bit2Me ejecuta dos veces. `parseFloat` aceptaba `0` y `"10abc"`.

### Architecture

- `src/utils/write-guards.ts` — `writeRequiresConfirm` (todo WRITE salvo `broker_quote_*`), preview `needs_confirmation` con `idempotency_key`, `resolveIdempotencyKey`.
- `src/utils/tool-wrapper.ts` — estampa la clave efectiva en `args` (handler y audit comparten la misma) y exige `confirm` antes del executor.
- `src/utils/amount.ts` — `validateAmount` con `decimal.js`; `format.ts` reexporta.
- `data/tools.json` — `confirm` **opcional** (nunca en `required` ni `exampleArgs`); `idempotency_key` opcional en las WRITE. Sin `confirm === true` el runtime devuelve preview.

`broker_quote_*` no piden `confirm` (solo crean proforma). `broker_confirm_quote` sí: preview y luego `confirm=true`. Valida UUID de `proforma_id`.

### Technology

TypeScript, `decimal.js`, metadata MCP en `data/tools.json`.

### Business

Menos órdenes, depósitos y préstamos duplicados o no intencionados cuando el usuario opera vía LLM.

### Security

Alineado con el modelo de amenaza local: no es un hallazgo multi-tenant. Es defensa contra el LLM como diputado confuso y contra reintentos inestables.

### Operations

Tras publicar, `confirm` es opcional en el schema. Sin `confirm === true`, Pro/Earn/Loan WRITE devuelven `needs_confirmation` (sin llamar a Bit2Me). El audit registra `needs_confirmation`.

## Change log

### 2026-08-30 19:40 UTC — Diario: confirm no es required

Se corrige el párrafo de Architecture: `confirm` no va en `required` ni en ejemplos. El spec sigue en AGENTS + `write-guards.ts`.

### 2026-08-30 14:26 UTC — Preview con clave, confirm en quote y par Pro

El preview incluye `idempotency_key` estampada. `broker_confirm_quote` exige `confirm`. `pro_get_ticker` envía `BTC/EUR` al API. Tests de preview en Earn/Loan/Pro/Broker.

### 2026-08-30 13:27 UTC — Segunda pasada (preview, schema, default-secure)

`confirm` deja de estar en `required` y en `exampleArgs` (el modelo ya no lo copia a la primera). Si falta, el wrapper devuelve un resultado `needs_confirmation` sin llamar a Bit2Me (no un error que invite a reintentar). Toda tool WRITE exige confirm salvo las quotes de Broker. `validateAmount` limita a 40 caracteres. Las proformas de Broker envían `Idempotency-Key`.

### 2026-08-30 13:22 UTC — Confirm, idempotencia estable e importes estrictos

Se añade `confirm=true` obligatorio en Pro/Earn/Loan WRITE, `idempotency_key` en todos los schemas WRITE, sanitización de la clave, `validateAmount` con Decimal (rechaza 0, basura y notación científica) y `validateUUID` en `broker_confirm_quote`. Tests en `tests/write-safeguards.test.ts` y casos extra en `tests/edge-cases.test.ts`.
