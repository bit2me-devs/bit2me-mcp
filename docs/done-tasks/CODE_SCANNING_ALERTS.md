# Cierre de alertas de code scanning

Revisión y cierre de las 5 alertas abiertas en [code scanning](https://github.com/bit2me-devs/bit2me-mcp/security/code-scanning) (2026-08-30).

## Contexto

### Qué es

Triage de CodeQL y Scorecard contra el modelo de amenaza local (un usuario, loopback, proxy a Bit2Me).

### Por qué

Quedaban 5 alertas abiertas. Dos eran falsos positivos de CodeQL; una CVE de `esbuild` en el árbol de desarrollo; dos checks de gobernanza de Scorecard (CODEOWNERS / ruleset).

### Architecture

Sin cambio de runtime. `hashIdentifier` sigue siendo HMAC-SHA256 en memoria. El `User-Agent` sigue leyendo solo `package.json`. El HTTP transport y el cliente Axios no cambian.

### Technology

- Descarte CodeQL `#125` y `#131` (`false positive`).
- `pnpm.overrides.esbuild` `^0.28.1` (GHSA-g7r4-m6w7-qqqr).
- `.github/CODEOWNERS` y ruleset `main-branch-protection` sin bypass de admin.

### Business

Menos ruido en Security y Scorecard alineado con el proceso real de PRs (CONTRIBUTING ya prohibía push directo a `main`).

### Security

`#125` no es hash de contraseña. `#131` no filtra secretos. La CVE de esbuild es el _dev server_ en Windows; no entra en el paquete publicado. El ruleset aplica a administradores: review de CODEOWNERS y `require_last_push_approval`.

### Operations

El ruleset ya no tiene bypass de admin. Los merges a `main` van por PR. Semantic Release no pushea a `main` (el bot no es admin). Scorecard `#40` (Code-Review histórico 1/22) baja solo cuando haya PRs revisados nuevos; no se puede reescribir el pasado.

No se sube el número de reviews a 2: el equipo son dos maintainers y `last_push_approval` ya exige una aprobación distinta del último push.

## Change log

### 2026-08-30 19:39 UTC — Descarte CodeQL, override esbuild y ruleset

Se descartan `#125` y `#131`. Override de `esbuild`. CODEOWNERS `@bit2me-dev` `@seguxb2m`. Ruleset: CODEOWNERS + last-push approval, sin bypass de admin.
