# Release del servidor modular

Marca para Semantic Release el trabajo que ya está en `main` tras v4.4.1.

## Contexto

### Qué es

Los commits posteriores a `v4.4.1` eran `refactor` / `docs` / `chore`: el árbol ya incluía el split ≤200 líneas, el endurecimiento de Axios/MCP y los dumps de landing fuera de git, pero npm no se publicó.

### Por qué

Un `feat:` en `main` es lo que corta versión. Sin él, `release.yml` termina en éxito y no hay tag.

### Architecture

Sin cambio de contrato: el paquete npm pasa a coincidir con el `main` actual.

### Technology

Semantic Release + OIDC (`release.yml`). No se toca `package.json` ni se etiqueta a mano.

### Business

`@bit2me/mcp-server` recibe el árbol que ya se prueba en local (wallet/pro READ).

### Security

Axios sin redirects y el cliente partido siguen ADR 0003.

### Operations

Tras el push a `main`, el job publica tag `v*` y regenera Pages.

## Change log

### 2026-08-31 05:20 UTC — feat para publicar

Commit `feat` que dispara minor. El código ya estaba en `origin/main`.
