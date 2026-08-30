# Límite ≤200 líneas (regla checkout)

Ningún fichero fuente >200 líneas. Copiada de `b2m-checkout`. Gate: `make check-file-size-strict`.

## Contexto

### Qué es

Misma convención que checkout: partir en la misma tarea, barrels que solo reexportan, sin helpers de una línea.

### Por qué

Ficheros enormes empeoran el trabajo de la IA. El repo ya partió mappers/schemas/tools; quedan cliente HTTP, format (hecho), tests y el generador de docs.

### Architecture — plan completo (deuda = 0)

| Oleada    | Ficheros                                                                                                              | Destino                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A (hecho) | rule + script + Make; `format.ts`; `args.ts`; `config.ts`; `circuit-breaker.ts`                                       | barrels + siblings                                        |
| B (hecho) | `bit2me.ts` 547; `http.ts`                                                                                            | sign/backoff/errors/build/market; auth/bind/errors/routes |
| C (hecho) | `metrics.ts` 314, `cache.ts` 280, `logger.ts` 266, `audit.ts` 260                                                     | prometheus/key/redact/path+rotate                         |
| D (hecho) | `mappers.test.ts` 1288                                                                                                | `tests/mappers/*.test.ts` por dominio                     |
| E (hecho) | `handlers.test.ts` 526, `tools.test.ts` 322, `broker.test.ts` 241                                                     | siblings por categoría                                    |
| F (hecho) | `config.test.ts` 344, `http-transport.test.ts` 298, `portfolio.test.ts` 284, `index.test.ts` 239, `audit.test.ts` 216 | 2 ficheros c/u                                            |
| G (hecho) | `generate-tools-docs.js` 390                                                                                          | `scripts/docs-gen/*.js` + entry                           |
| H (hecho) | `pnpm validate` + CI `--strict`                                                                                       | deuda = 0                                                 |

Verificar tras cada oleada: `pnpm typecheck` + `pnpm test` + `bash scripts/check-file-size.sh`.

### Operations

`make check-file-size` (informe). `make check-file-size-strict` (falla). Excluye `build/`, `landing/`, `.cursor/`, `.claude/`.

## Change log

### 2026-08-30 21:39 UTC — `bit2me.ts` no es un barrel vacío

`bit2me.ts` orquesta `bit2meRequest` y reexporta siblings. No recrear `bit2me-request.ts`. Los barrels vacíos son `format.ts`, `http.ts`, `response-mappers.ts`, `schemas.ts`.

### 2026-08-30 20:36 UTC — Pre-commit de líneas

Husky corre `scripts/check-file-size.sh --strict --staged`. No confundir con `.husky/check-file-size.sh` (límite de 500KB).

### 2026-08-30 20:33 UTC — Oleada H: gate `--strict` en validate y CI

`pnpm validate` y `.github/workflows/ci.yml` ejecutan `bash scripts/check-file-size.sh --strict`. Deuda trackeada = 0. `bit2meRequest` orquesta el retry vía `handleBit2MeAxiosError` (callback, no delay suelto).

### 2026-08-30 20:30 UTC — Oleada E: tests handlers/tools/broker

`handlers.test.ts` (526) partido en `handlers-earn`, `handlers-loan`, `handlers-pro`, `handlers-portfolio`. `tools.test.ts` (322) en `tools-assets`, `tools-market`, `tools-errors`. `broker.test.ts` (241) en `broker-read` y `broker-write`. Mocks copiados a cada sibling (Vitest hoist). Aserciones iguales. Se borran los monolitos.

### 2026-08-30 20:30 UTC — Oleada B (bit2me): cliente ≤200

`bit2me.ts` (547) partido en `bit2me-sign.ts` (HMAC, cookie, nonce, flatten), `bit2me-backoff.ts` (full jitter), `bit2me-errors.ts` (4xx no breaker; 429 siempre retry; POST/DELETE 5xx solo con `idempotencyKey`), `bit2me-build.ts` (axios), `bit2me-market.ts` (`getMarketPrice`/`getTicker`) y barrel `bit2me.ts`. API pública igual. Sin `tenantId`. Retry/confirm intactos.

### 2026-08-30 20:29 UTC — Oleada B (http): transporte ≤200

`http.ts` (520 en HEAD) partido en `http-auth.ts` (creds + lockout, `LOCKOUT_HMAC_KEY`), `http-bind.ts`, `http-errors.ts` (`mapErrorToJsonRpc`), `http-routes.ts` y barrel `http.ts` (Fastify + `startHttpServer`). Se reutiliza `mcp-rpc.ts`. Sin `tenantId`. Rutas y auth iguales.

### 2026-08-30 20:29 UTC — Oleada D: tests de mappers

`tests/mappers.test.ts` (1288) partido en `tests/mappers/*.test.ts` por dominio (Market, Wallet, Earn, Loan, Pro, Operation). Earn/Loan/Market/Wallet se parten más (positions/rewards, orders/config, assets/book, pockets/movements/proforma) para ≤200 líneas. Se borra el monolito para que Vitest no doble-ejecute.

### 2026-08-30 20:29 UTC — Oleadas F y G: tests y generador de docs

Partidos `config.test.ts`, `http-transport.test.ts`, `portfolio.test.ts`, `index.test.ts` (list vs call) y `audit.test.ts`. `generate-tools-docs.js` queda como entry; lógica en `scripts/docs-gen/` (`version.js`, `landing.js`, `markdown.js`, `endpoints.js`). Sin cambiar aserciones ni el output generado.

### 2026-08-30 — Plan completo y oleadas B–H

Inventario: 16 violaciones tras format/args/config/circuit-breaker. Se parte el resto y se activa el gate.
