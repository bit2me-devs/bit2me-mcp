# Changelog interno

Entradas de trazabilidad de iniciativas. El changelog de release npm sigue en `/CHANGELOG.md` (Semantic Release).

## [2026-08-30 13:27 UTC] — Segunda pasada: preview de confirm y confirm opcional

- Sin `confirm` el WRITE devuelve preview (no error). `confirm` deja de ser required/ejemplo. Confirm por defecto en todo WRITE salvo quotes. See [WRITE_TOOL_SAFEGUARDS](done-tasks/WRITE_TOOL_SAFEGUARDS.md).

## [2026-08-30 13:22 UTC] — Salvaguardas WRITE: confirm, idempotencia e importes estrictos

- Las tools irreversibles exigen `confirm=true`; `idempotency_key` entra en el schema y se reutiliza en audit. `validateAmount` usa decimal.js. See [WRITE_TOOL_SAFEGUARDS](done-tasks/WRITE_TOOL_SAFEGUARDS.md).

## [2026-08-30 13:01 UTC] — Documentación de desarrollo alineada con pnpm

- README, CONTRIBUTING, plantilla de PR y scripts pasan a comandos pnpm. See [SECURITY_DEPS_AUDIT](done-tasks/SECURITY_DEPS_AUDIT.md).

## [2026-08-30 12:51 UTC] — Parche de CVEs de producción y consolidación de Dependabot

- Se actualizan axios, MCP SDK, Fastify, rate-limit y se fuerzan overrides transitivos. Audit prod high queda limpio. See [SECURITY_DEPS_AUDIT](done-tasks/SECURITY_DEPS_AUDIT.md).
