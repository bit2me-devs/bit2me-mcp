# Cadenas de sincronización (conteos, endpoints, landing)

Cierra el desfase entre el catálogo runtime y los textos/mapas que ningún generador actualiza.

## Contexto

### Qué es

Checklist + test para las copias **a mano**: `scripts/docs-gen/endpoints.js`, conteos en `README.md` y `landing/index.html`, ids de categoría y anotaciones de cancelación.

### Por qué

`pnpm build:docs` solo regenera `TOOLS_DOCUMENTATION.md` y `landing/tools-data.js`. Un rename (`server_health_check` → `general_health`) dejó una clave muerta y dos tools en `N/A`. Añadir `confirm_write` dejó la landing en «6 prompts» con 7 reales.

### Architecture

- Rule `.cursor/rules/sync-chains.mdc` (lista por tipo de cambio).
- `tests/sync-chains.test.ts` compara catálogo vs `ENDPOINT_MAPPINGS`, `VALID_CATEGORY_IDS`, README, landing y `idempotentHint` en WRITE `*cancel*`.
- `CONFIRM_EXEMPT_WRITE` sigue cubierto por `tests/write-safeguards.test.ts`.

### Technology

Vitest, `data/tools.json`, `src/prompts/index.ts`.

### Business

La landing y TOOLS_DOCUMENTATION dejan de mentir sobre cuántas tools/prompts hay y a qué path llaman.

### Security

Sin cambio de amenaza. Las anotaciones de cancelación (`IDEMPOTENT_CANCEL`) pasan a tener red de test.

### Operations

Al añadir tool o prompt: `endpoints.js` + conteos README/landing + `pnpm build:docs`. El test falla si se olvida.

## Change log

### 2026-08-30 22:18 UTC — Tercera pasada

`tests/sync-chains-runtime.test.ts`: el `Map` de cada categoría = `tools.json`; prompts gated de Earn/Loan existen; `make` → `pnpm run` existe en `package.json`; métodos MCP núcleo en `mcp-rpc.ts`; cada resource URI es legible. Los maps se exportan (`generalHandlers`, …).

### 2026-08-30 22:00 UTC — Segunda pasada

El test ahora exige: ids de categoría en README/AGENTS/`.env.example`/nav de landing; claves Zod en `.env.example` y `delete` en `tests/config-env.ts` (más `AUDIT_LOG_PATH`/`LOG_FORMAT`); cada prompt del catálogo tiene handler; WRITE sin confirm = `destructiveHint: false`. Plantilla de PR y rule actualizadas.

### 2026-08-30 21:51 UTC — Test, rule y dos desfases

Se corrige `endpoints.js` (`general_health`, `general_describe_tool`; se elimina `server_health_check`). Landing JSON-LD: 7 prompts. Rule `sync-chains`, skill `add-mcp-tool` / `mcp-prompts`, AGENTS/CONTRIBUTING/mapa.
