# Sin tenantId (proxy de un usuario)

Se elimina `tenantId` del runtime. El servidor es un MCP local de un solo operador (stdio; HTTP en loopback), no un producto multi-tenant.

## Contexto

### Qué es

`tenantId` era un hash HMAC de la credencial HTTP usado para partir caché, rate-limit, circuit breaker y bulkhead «por tenant». Eso venía de un diseño HTTP tipo SaaS. ADR 0003 ya lo deja fuera: un tenant, credenciales del proceso o de la request.

### Por qué

Soportar tenants no encaja con un cliente stdio. El aislamiento que sí importa es ALS por request (credenciales HTTP no se mezclan entre llamadas concurrentes) y el breaker/bulkhead por grupo de endpoint.

### Architecture

- `RequestContext` ya no tiene `tenantId` ni `getTenantId()`.
- Caché: `cacheKey(parts)` estable, sin partición por identidad.
- Rate-limit, circuit breaker y bulkhead: un proceso, buckets por patrón o grupo.
- HTTP: credenciales por request en ALS; el HMAC solo etiqueta el lockout de 401.
- `args.jwt` sigue ignorándose si HTTP ya autenticó por cabeceras.

### Security

Alineado con ADR 0003. No hay producto multi-tenant. El diputado confuso del LLM y el preview WRITE no cambian.

## Change log

### 2026-08-30 20:23 UTC — Copy y nombres residuales

`TENANT_ID_KEY` pasa a `LOCKOUT_HMAC_KEY`. HTTP ya no dice que rate-limit/breaker van por request ni que hay que desplegar detrás de nginx. Tests: `group-isolation`, `tool-wrapper-http-jwt`. OpenSSF deja de citar el HMAC de HTTP como crypto de producto.

### 2026-08-30 20:12 UTC — Se quita tenantId

Campo, particiones y métricas `bit2me_inflight_tenant_*` fuera. Tests de aislamiento entre tenants reescritos a aislamiento por grupo.
