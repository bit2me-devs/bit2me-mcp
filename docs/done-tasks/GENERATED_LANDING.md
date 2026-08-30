# Artefactos de landing fuera de git

`tools-data.js` y `llms*.txt` se generan en Pages; no se versionan. `TOOLS_DOCUMENTATION.md` sí.

## Contexto

### Qué es

Dejar de commitear el catálogo JS y los dumps LLM de `landing/`. Siguen generándose con `pnpm build:docs` / `build:llms`.

### Por qué

El deploy de GitHub Pages ya corre esos scripts. Tener 10k líneas generadas en git solo producía diffs y ediciones a mano.

### Architecture

`.gitignore` + `git rm --cached`. El npm package no incluye `landing/`. Runtime sigue leyendo `data/tools.json`.

### Technology

`scripts/generate-tools-docs.js`, `scripts/generate-llms.js`, `deploy.yml` / `release.yml`.

### Business

La landing en mcp.bit2me.com no cambia: el job genera los ficheros antes de subir el artifact.

### Security

Sin cambio de amenaza.

### Operations

Preview local: `pnpm build:docs` (y `build:llms` si se quieren los dumps). En un PR solo se commitea `TOOLS_DOCUMENTATION.md` tras tocar el catálogo.

## Change log

### 2026-08-30 22:47 UTC — Gitignore de tools-data y llms

Se dejan de trackear `landing/tools-data.js`, `landing/llms.txt`, `landing/llms-full.txt`. Docs, rules y plantilla de PR alineados. `tools.json` no se trocea.
