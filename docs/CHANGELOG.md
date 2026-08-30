# Changelog interno

Entradas de trazabilidad de iniciativas. El changelog de release npm sigue en `/CHANGELOG.md` (Semantic Release).

## [2026-08-30 22:52 UTC] — Mappers sin any y ADR 0002

- Guards a `unknown`; ADR 0002 cita los tests de config actuales. See [TEST_HYGIENE](done-tasks/TEST_HYGIENE.md).

## [2026-08-30 22:47 UTC] — Landing generada fuera de git

- `tools-data.js` y `llms*.txt` gitignored; Pages los construye. See [GENERATED_LANDING](done-tasks/GENERATED_LANDING.md).

## [2026-08-30 22:42 UTC] — Higiene: alias portfolio y código muerto

- `fiat_symbol`/`quote_symbol` alineados; validators y mapper account podados. See [TEST_HYGIENE](done-tasks/TEST_HYGIENE.md).

## [2026-08-30 22:39 UTC] — Verificación en vivo: Inspector + HTTP

- Health local honesto; breaker stats sin epoch. Inspector y HTTP OK; 503 es del gateway. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 22:34 UTC] — Tests duplicados y schemas huérfanos

- Se parte el clon general/market, se borran schemas/fixtures muertos y se tipa `getTicker`. See [TEST_HYGIENE](done-tasks/TEST_HYGIENE.md).

## [2026-08-30 22:30 UTC] — Higiene: any de tests, mappers muertos, audit-harness

- Se tipan `any` de tests, se borran mappers sin caller y se cablea `tests/audit-harness.ts`. See [TEST_HYGIENE](done-tasks/TEST_HYGIENE.md).

## [2026-08-30 22:18 UTC] — Sync-chains: maps de handlers y Makefile

- Test 1:1 Map vs catálogo, `pnpm run` del Makefile, métodos MCP y resources. See [SYNC_CHAINS](done-tasks/SYNC_CHAINS.md).

## [2026-08-30 22:00 UTC] — Segunda pasada de sync-chains

- Test cubre env Zod, `config-env`, categorías en README/AGENTS/landing y confirm vs anotaciones. See [SYNC_CHAINS](done-tasks/SYNC_CHAINS.md).

## [2026-08-30 21:50 UTC] — Cierre de deuda post-refactor

- ProtocolVersion SDK, ValidationError en tool/prompt desconocidos, versión única, CI typecheck/publint, docs de add-tool. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 21:51 UTC] — Cadenas de sync: endpoints, conteos y test

- `endpoints.js` alinea health/describe; landing 7 prompts; `tests/sync-chains.test.ts`. See [SYNC_CHAINS](done-tasks/SYNC_CHAINS.md).

## [2026-08-30 21:45 UTC] — Notificaciones MCP sin respuesta JSON-RPC

- `POST /mcp` sin `id` → 202 vacío. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 21:43 UTC] — Gateway via getConfig; params JSON-RPC objeto

- Se quita el const `BIT2ME_GATEWAY_URL` (no respetaba el env) y el Proxy `config`. `params` HTTP debe ser objeto. See [SELF_INFLICTED](done-tasks/SELF_INFLICTED.md) y [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 21:41 UTC] — raw_response unificado y dates/describe cubiertos

- `wrapResponseWithRaw` lo usa el builder contextual; tests de rango de fechas y `general_describe_tool`. See [SELF_INFLICTED](done-tasks/SELF_INFLICTED.md).

## [2026-08-30 21:39 UTC] — JSON-RPC: arguments objeto + mapa de errores

- `tools/call` rechaza `arguments` que no sean objeto. Tests de `mapErrorToJsonRpc` y catálogo/ping/health por HTTP. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 21:32 UTC] — Autolesión: raw response y HTTP plano

- WARN si `INCLUDE_RAW_RESPONSE` o bind no-loopback; el cliente ya no loguea bodies. See [SELF_INFLICTED](done-tasks/SELF_INFLICTED.md).

## [2026-08-30 21:31 UTC] — Axios: sin redirects y path acotado

- `maxRedirects: 0`, `assertSafeEndpoint`, Idempotency-Key saneado en el builder. See [AXIOS_HARDENING](done-tasks/AXIOS_HARDENING.md).

## [2026-08-30 20:36 UTC] — Resource catalog + gate de líneas en hook

- `bit2me://catalog` lista tools habilitadas sin I/O a Bit2Me. Husky `--strict --staged` (líneas). See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md) y [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:33 UTC] — Límite ≤200 líneas: gate strict

- Deuda 0. `pnpm validate` y CI corren `check-file-size --strict`. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:30 UTC] — Tests handlers/tools/broker ≤200 líneas

- `handlers.test.ts`, `tools.test.ts` y `broker.test.ts` partidos por categoría; se eliminan los monolitos. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:30 UTC] — Cliente Bit2Me ≤200 líneas

- `bit2me.ts` partido en sign/backoff/errors/build/market; barrel reexporta la API pública. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:29 UTC] — Transporte HTTP ≤200 líneas

- `http.ts` partido en auth/bind/errors/routes; barrel reexporta `buildHttpServer` y `startHttpServer`. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:29 UTC] — Tests de mappers ≤200 líneas

- `tests/mappers.test.ts` partido en `tests/mappers/*.test.ts` por dominio; se elimina el monolito. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:29 UTC] — Tests y generador de docs ≤200L

- Oleadas F/G: partidos config/http-transport/portfolio/index/audit y `scripts/docs-gen/`. See [FILE_SIZE_200L](done-tasks/FILE_SIZE_200L.md).

## [2026-08-30 20:23 UTC] — Sin tenant: copy residual

- `LOCKOUT_HMAC_KEY`, comentarios HTTP loopback-first, tests sin nombre tenant. See [NO_TENANT](done-tasks/NO_TENANT.md).

## [2026-08-30 20:12 UTC] — Sin tenantId

- Se elimina `tenantId` del runtime (caché, rate-limit, breaker, bulkhead, ALS). Proxy local de un usuario (ADR 0003). See [NO_TENANT](done-tasks/NO_TENANT.md).

## [2026-08-30 20:10 UTC] — HTTP JSON-RPC: prompts y resources

- `POST /mcp` despacha `initialize`, `prompts/*` y `resources/*` (mismo catálogo que stdio). Extraído a `src/transport/mcp-rpc.ts` sin crecer `http.ts`. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 20:05 UTC] — Segunda pasada protocolo MCP

- Dispatch desactivado lanza `ValidationError` (HTTP JSON-RPC la echo). Prompts Earn/Loan respetan el allow-list. `confirm_write` solo acepta WRITE con confirm. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 19:58 UTC] — Runtime: protocolo MCP, categorías y deuda

- Annotations, `structuredContent`, resources stdio (`bit2me://health`, `bit2me://server`).
- `BIT2ME_ENABLED_CATEGORIES` filtra `tools/list` y dispatch; `general_describe_tool` no describe categorías off.
- Prompt `confirm_write`. Mappers/schemas partidos; handlers por Map sin `any`.
- Tests Earn/Loan de preview, importes y UUID. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 19:50 UTC] — Docs de protocolo MCP y copy ADR 0003

- Allow-list `BIT2ME_ENABLED_CATEGORIES`, anotaciones MCP, `structuredContent`, resources stdio y prompt `confirm_write` en README/AGENTS/`.env.example`. Se quita el copy multi-tenant del binario HTTP. See [MCP_PROTOCOL_HARDENING](done-tasks/MCP_PROTOCOL_HARDENING.md).

## [2026-08-30 19:45 UTC] — Código de conducta en inglés

- Contributor Covenant 2.1 en `CODE_OF_CONDUCT.md`. CONTRIBUTING deja de listar tipos de commit. See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 19:42 UTC] — AGENTS más corto, release canónico

- AGENTS deja de copiar CI/npm/árbol de `src/`. Publish y OIDC viven en `stack/release.md`. See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 19:40 UTC] — Segunda pasada de docs (agentes y HTTP)

- Mapa «For agents», README/ADR 0001/SECURITY sin SaaS multi-tenant, OpenSSF y plantillas al día, `llms` incluye el mapa, CODEOWNERS. See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 19:38 UTC] — Docs de release y modelo de amenaza

- Playbook `stack/release.md`, ADR 0003, y alineación de AGENTS/CONTRIBUTING/SECURITY/README (versión = npm+tag, OIDC, cobertura del gate Vitest, PR vs maintainer). See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 19:39 UTC] — Alertas de code scanning

- CodeQL `#125`/`#131` descartadas (FP). Override `esbuild` ^0.28.1. CODEOWNERS + ruleset de `main` sin bypass de admin. See [CODE_SCANNING_ALERTS](done-tasks/CODE_SCANNING_ALERTS.md).

## [2026-08-30 19:19 UTC] — Drift de versión en la landing

- El hero leía un snapshot de `git describe`; npm ya era 4.4.0. See [VERSION_DRIFT](done-tasks/VERSION_DRIFT.md).

## [2026-08-30 14:26 UTC] — Cierre de residuales WRITE y ticker Pro

- Preview con `idempotency_key`; `broker_confirm_quote` pide confirm; `pro_get_ticker` usa `BASE/QUOTE`. See [WRITE_TOOL_SAFEGUARDS](done-tasks/WRITE_TOOL_SAFEGUARDS.md).

## [2026-08-30 13:42 UTC] — Bloqueo de push de ramas solo locales

- Husky `pre-push` rechaza `feat/go-migration` y `fix/audit-batch-hardening` (`scripts/push-deny-branches.txt`).

## [2026-08-30 13:40 UTC] — Segunda pasada del mapa de documentación

- `docs/stack/tooling.md`, ADR 0002 deferred, sin enlace a RAW_RESPONSE_GUIDE, AGENTS/CONTRIBUTING/SECURITY/README alineados. See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 13:36 UTC] — Mapa de documentación y homogeneización

- Índice en `docs/README.md`; se alinean README, AGENTS, CONTRIBUTING y generadores (pnpm, registry, idiomas). See [DOCUMENTATION_MAP](done-tasks/DOCUMENTATION_MAP.md).

## [2026-08-30 13:32 UTC] — Rules y skills de Cursor quedan fuera del repo

- `.gitignore` ignora `.cursor/` y `.claude/` por completo. Se deja de versionar `mcp-threat-model.mdc`. Las rules/skills viven solo en local.

## [2026-08-30 13:30 UTC] — Limpieza de restos de feat/go-migration en el working tree

- Se quitan binarios `go/bin` y skills/rules de checkout que no están en GitHub `main`. La rama `feat/go-migration` sigue intacta. `.gitignore` ignora `/go/` y `.claude/` en main.

## [2026-08-30 13:27 UTC] — Segunda pasada: preview de confirm y confirm opcional

- Sin `confirm` el WRITE devuelve preview (no error). `confirm` deja de ser required/ejemplo. Confirm por defecto en todo WRITE salvo quotes. See [WRITE_TOOL_SAFEGUARDS](done-tasks/WRITE_TOOL_SAFEGUARDS.md).

## [2026-08-30 13:22 UTC] — Salvaguardas WRITE: confirm, idempotencia e importes estrictos

- Las tools irreversibles exigen `confirm=true`; `idempotency_key` entra en el schema y se reutiliza en audit. `validateAmount` usa decimal.js. See [WRITE_TOOL_SAFEGUARDS](done-tasks/WRITE_TOOL_SAFEGUARDS.md).

## [2026-08-30 13:01 UTC] — Documentación de desarrollo alineada con pnpm

- README, CONTRIBUTING, plantilla de PR y scripts pasan a comandos pnpm. See [SECURITY_DEPS_AUDIT](done-tasks/SECURITY_DEPS_AUDIT.md).

## [2026-08-30 12:51 UTC] — Parche de CVEs de producción y consolidación de Dependabot

- Se actualizan axios, MCP SDK, Fastify, rate-limit y se fuerzan overrides transitivos. Audit prod high queda limpio. See [SECURITY_DEPS_AUDIT](done-tasks/SECURITY_DEPS_AUDIT.md).
