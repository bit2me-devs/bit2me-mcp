# Mapa y homogeneización de documentación

Índice canónico en `docs/README.md` y alineación de README, AGENTS, CONTRIBUTING, scripts y generadores para que no se contradigan.

## Contexto

### Qué es

Revisión de la documentación versionada: fuentes de verdad, idioma, ficheros generados y textos desfasados (registry, landing, npm vs pnpm, JWT vs stdio).

### Por qué

Había dos changelogs sin explicar, `CONTRIBUTING` exigía toda la docs en inglés (choca con `done-tasks` en español), `AGENTS.md` citaba `registry.set` y `registry.test.ts`, el generador de tools decía `npm run build:docs`, y `generate-llms.js` leía `agents.md` (en Linux no existe).

### Architecture

Sin cambio de runtime. `docs/README.md` es el índice. `data/tools.json` sigue siendo la fuente de tools.

### Technology

Markdown, `scripts/generate-tools-docs.js`, `scripts/generate-llms.js`.

### Business

Contribuidores y agentes dejan de editar artefactos generados o de publicar docs contradictorias.

### Security

Se aclara stdio (un usuario, `.env`) vs HTTP (credenciales por request, ADR 0001). No se cambia el modelo de amenaza.

### Operations

Tras cambiar `data/tools.json`, `pnpm build:docs` y commitear `TOOLS_DOCUMENTATION.md`. Los `llms*.txt` y `tools-data.js` no van a git (Pages los genera). Diario: [GENERATED_LANDING](./GENERATED_LANDING.md).

## Change log

### 2026-08-30 22:47 UTC — Landing generada fuera de git

Puntero a [GENERATED_LANDING](./GENERATED_LANDING.md): `tools-data.js` y `llms*.txt` gitignored. El mapa distingue artefactos commiteados vs Pages.

### 2026-08-30 20:36 UTC — Límite ≤200 líneas en el mapa

`docs/README.md` añade la fila de file-size (`check-file-size.sh`, validate, CI). Diario: [FILE_SIZE_200L](./FILE_SIZE_200L.md).

### 2026-08-30 20:12 UTC — Sin tenantId

Puntero a [NO_TENANT](./NO_TENANT.md): se quita `tenantId` del runtime. El mapa no cambia (ADR 0003 sigue siendo la amenaza).

### 2026-08-30 19:50 UTC — Protocolo MCP: allow-list y copy ADR 0003

Puntero a [MCP_PROTOCOL_HARDENING](./MCP_PROTOCOL_HARDENING.md): `BIT2ME_ENABLED_CATEGORIES`, anotaciones, `structuredContent`, resources y `confirm_write`. El mapa añade una fila de allow-list (fuente: AGENTS + `.env.example`).

### 2026-08-30 19:45 UTC — CoC en inglés; CONTRIBUTING sin tipos de commit

`CODE_OF_CONDUCT.md` pasa a Contributor Covenant 2.1 en inglés (contacto: Support + CODEOWNERS). CONTRIBUTING apunta a AGENTS para Conventional Commits.

### 2026-08-30 19:42 UTC — AGENTS deja de duplicar release/CI

CI, npm, Dependabot y el árbol desfasado de `src/` salen de AGENTS. Quedan commits, mappers, tests, patrones y el checklist de tools. Troubleshooting de publish vive en `stack/release.md`. El wrapper documenta confirm + `idempotency_key`.

### 2026-08-30 19:40 UTC — Segunda pasada: agentes, HTTP y OpenSSF

`docs/README.md` añade «For agents». README/ADR 0001 dejan de vender HTTP como SaaS multi-tenant. SECURITY lista hallazgos reales vs ruido. Cheatsheet OpenSSF, plantilla de PR, bug report (Node 20) y comentario de `release.yml` alineados. `generate-llms.js` incluye el mapa. CODEOWNERS versionado.

### 2026-08-30 19:38 UTC — Release, amenaza y contradicciones

Playbook `docs/stack/release.md` (npm + tag; no bump a mano). ADR 0003 (proxy local, un usuario). AGENTS/CONTRIBUTING/SECURITY/README/tooling dejan de decir que SemVer actualiza `package.json`, que hace falta `NPM_TOKEN`/Node 22, cobertura 97%+ o que nadie puede pushear `main`. El spec WRITE es AGENTS + código; `done-tasks/` es diario. Inspector CLI documentado. `.gitignore` re-incluye `docs/adr/**`.

### 2026-08-30 13:40 UTC — Segunda pasada: mapa, stack y enlaces

Se añade `docs/stack/tooling.md` (pnpm/Makefile). ADR 0002 queda marcado como deferred. Se quita el enlace roto a `docs/RAW_RESPONSE_GUIDE.md` (gitignored). TOC de AGENTS incluye «Adding a New Tool»; reglas WRITE (confirm + idempotency); mocks `config.js`. CONTRIBUTING apunta al checklist de AGENTS. README inspector usa `pnpm dlx`; SECURITY deja de llamar «multi-tenant SaaS» al binario HTTP. `.gitignore` re-incluye `docs/stack/**`.

### 2026-08-30 13:36 UTC — Índice y contradicciones

Se añade `docs/README.md` (y excepción en `.gitignore`). Se corrigen AGENTS (registry, confirm, landing), CONTRIBUTING (idioma y cobertura 97%+), README (TypeScript 6, confirm, JWT, landing), scripts/README, generadores (`pnpm`, `AGENTS.md`), plantilla de PR y cheatsheet OpenSSF. `WRITE_TOOL_SAFEGUARDS` deja de decir que falta de confirm lanza `ValidationError`.
