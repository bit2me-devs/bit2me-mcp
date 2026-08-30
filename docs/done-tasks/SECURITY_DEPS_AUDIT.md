# Auditoría semanal de dependencias y CVEs de producción

Cierre de los issues semanales de `pnpm audit` y consolidación de los PRs de Dependabot pendientes sobre `main`.

## Contexto

### Qué es

Actualización de dependencias de producción y desarrollo, más `pnpm.overrides` para dependencias transitivas vulnerables, y bump de GitHub Actions pinneadas.

### Por qué

Los issues `#84`–`#114` reportaban CVEs altas en el árbol de producción: `axios` (gadgets de prototype pollution, proxy/SSRF), `hono`/`qs`/`body-parser`/`fast-uri`/`ip-address`/`@hono/node-server` vía `@modelcontextprotocol/sdk`, `form-data` vía `axios`, y `find-my-way` vía `fastify`. Siete PRs de Dependabot cubrían parte de los bumps, pero estaban desfasados entre sí.

### Architecture

No hay cambio de arquitectura. El HTTP transport sigue usando Fastify + `@fastify/rate-limit`. El cliente Bit2Me sigue usando `axios`. El SDK MCP se mantiene en la línea 1.x (`1.30.0`); no se migra a MCP v2.

### Technology

- `axios` 1.16.0 → 1.20.0 (incluye parches de 1.18.x y endurecimiento adicional de 1.20.0)
- `@modelcontextprotocol/sdk` 1.29.0 → 1.30.0
- `fastify` 5.8.5 → 5.12.1
- `@fastify/rate-limit` 10.3.0 → 11.2.0 (breaking solo en tipos deprecados; la API `max`/`timeWindow` no cambia)
- Overrides de producción: `qs`, `hono`, `form-data`, `body-parser`, `fast-uri` 3.x, `find-my-way`, `ip-address`, `@hono/node-server` 1.x
- Overrides de desarrollo (para que `pnpm audit --audit-level=high` del pre-commit quede limpio): `undici@6` 6.28.0, `undici@7` 7.29.0, `brace-expansion@5` 5.0.9, `js-yaml@4` 4.3.2
- GitHub Actions: checkout v7, setup-node v7, CodeQL 4.37.3, codecov v7 (PR #109)

### Business

Publicar un parche de seguridad en `@bit2me/mcp-server` para que consumidores npm no arrastren el árbol vulnerable.

### Security

- `pnpm audit --prod --audit-level=high` queda en cero vulnerabilidades.
- Exploitabilidad directa de Hono/Express del SDK es baja (este repo usa Fastify propio), pero el override evita que un consumidor o un path futuro las exponga.
- Se pospone `@eslint/js` 10 (PR #83 falló CI; ESLint 10 ya corre con `@eslint/js` 9).

### Operations

Tras merge en `main`, Semantic Release publicará un patch. Los PRs de Dependabot afectados se cierran como sustituidos. El workflow semanal de audit no debería reabrir issue si el árbol se mantiene limpio.

## Change log

### 2026-08-30 12:51 UTC — Parche de CVEs y consolidación de Dependabot

Se aplican en `main` (rama `chore/security-deps-audit`) los bumps de producción, overrides transitivos y pins de Actions del PR #109. Los hooks de Husky pasan de `npx` a `pnpm exec` para no depender del `npx` corporativo bloqueado. Verificación local: audit prod high limpio, 424 tests, fuzz, typecheck y build OK.
