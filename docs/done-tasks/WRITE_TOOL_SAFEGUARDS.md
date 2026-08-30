# Salvaguardas de tools WRITE (confirm, idempotencia, importes)

Protecciones contra el diputado confuso del LLM: confirmación explícita, clave de idempotencia estable y validación estricta de importes.

## Contexto

### Qué es

Capa de defensa en las tools que mueven dinero (Pro, Earn, Loan) y en las quotes de Broker. El servidor MCP es un proxy local de un solo usuario; el riesgo real es que el modelo dispare una mutación irreversible o reintente con una clave nueva.

### Por qué

Un agente puede llamar `pro_create_order` o `earn_withdraw` en un solo paso. Sin `confirm=true` eso es un disparo accidental. Sin `idempotency_key` en el schema, un timeout hace que el modelo reintente con un UUID distinto y Bit2Me ejecuta dos veces. `parseFloat` aceptaba `0` y `"10abc"`.

### Architecture

- `src/utils/write-guards.ts` — `requireConfirm`, `resolveIdempotencyKey` (sanitiza el header) y el set `REQUIRES_CONFIRM`.
- `src/utils/tool-wrapper.ts` — estampa la clave efectiva en `args` (handler y audit comparten la misma) y exige `confirm` antes del executor.
- `src/utils/amount.ts` — `validateAmount` con `decimal.js`; `format.ts` reexporta.
- `data/tools.json` — `confirm` requerido en las 10 tools irreversibles; `idempotency_key` opcional en las 14 WRITE.

Broker quotes no piden `confirm` (ya son quote → `broker_confirm_quote`). `broker_confirm_quote` valida UUID de `proforma_id`.

### Technology

TypeScript, `decimal.js`, metadata MCP en `data/tools.json`.

### Business

Menos órdenes, depósitos y préstamos duplicados o no intencionados cuando el usuario opera vía LLM.

### Security

Alineado con el modelo de amenaza local: no es un hallazgo multi-tenant. Es defensa contra el LLM como diputado confuso y contra reintentos inestables.

### Operations

Tras publicar, los clientes MCP verán `confirm` en el schema. Las llamadas WRITE de Pro/Earn/Loan sin `confirm: true` fallan con `ValidationError` y no llegan a Bit2Me.

## Change log

### 2026-08-30 13:22 UTC — Confirm, idempotencia estable e importes estrictos

Se añade `confirm=true` obligatorio en Pro/Earn/Loan WRITE, `idempotency_key` en todos los schemas WRITE, sanitización de la clave, `validateAmount` con Decimal (rechaza 0, basura y notación científica) y `validateUUID` en `broker_confirm_quote`. Tests en `tests/write-safeguards.test.ts` y casos extra en `tests/edge-cases.test.ts`.
