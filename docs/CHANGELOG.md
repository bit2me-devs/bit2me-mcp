# Changelog interno

Entradas de trazabilidad de iniciativas. El changelog de release npm sigue en `/CHANGELOG.md` (Semantic Release).

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
