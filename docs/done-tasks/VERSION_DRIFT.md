# Tres versiones que no coincidían

El hero de la landing decía `v4.3.3 Stable` mientras el badge de npm (shields) ya mostraba `4.4.0`.

## Contexto

Había **cuatro** números distintos:

| Fuente                         | Valor típico | Quién lo escribe                                             |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| npm `@bit2me/mcp-server`       | 4.4.0        | Semantic Release                                             |
| Tag git `v*`                   | v4.4.0       | Semantic Release (GitHub)                                    |
| `package.json` en `main`       | 4.1.4        | Nadie: no hay `@semantic-release/git`                        |
| `landing/tools-data.js` / hero | 4.3.3        | `pnpm build:docs` → `git describe` en el deploy del **push** |

Semantic Release no commitea el bump a `main` (ruleset; el bot no es admin). El deploy de Pages en el push corre **antes** de existir el tag nuevo. El `on.release` de `deploy.yml` no se dispara: un workflow con `GITHUB_TOKEN` no arranca otro.

## Change log

### 2026-08-30 19:19 UTC — Hero lee npm; Pages se redeploya en Release

El badge superior consulta `registry.npmjs.org` (misma verdad que shields). Tras Semantic Release, el job `landing` del mismo workflow regenera `tools-data.js` con el tag ya creado.
