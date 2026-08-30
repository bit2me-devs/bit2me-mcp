# Endurecimiento del protocolo MCP (docs de operador)

Documentación de operador para el allow-list de categorías, anotaciones MCP, `structuredContent`, resources stdio y el prompt `confirm_write`. Se elimina el copy residual de «SaaS multi-tenant».

## Contexto

### Qué es

Capa de protocolo MCP (hints, recursos, prompts, contenido estructurado) y un filtro opcional de categorías. El servidor sigue siendo un proxy local de un solo usuario (ADR 0003): HTTP en loopback con credenciales por request, no un producto alojado multi-tenant.

### Por qué

El runtime ya filtra categorías, anota tools, adjunta `structuredContent` y enseña el preview WRITE. La segunda pasada cierra huecos: `ValidationError` en dispatch (HTTP no devuelve Internal error), prompts Earn/Loan ocultos, `confirm_write` solo acepta WRITE con confirm, y copy ADR 0003 en `http.ts`. El spec WRITE no cambia.

### Architecture

- `BIT2ME_ENABLED_CATEGORIES` — ids separados por coma: `general`, `broker`, `wallet`, `pro`, `earn`, `loan`. Sin definir = todas. Un id desconocido = error de arranque/parseo. Filtra `tools/list`, dispatch, `general_describe_tool` y prompts Earn/Loan. Tool desactivada → `ValidationError`.
- Anotaciones MCP — `metadataToTool` las deriva de `type` en `data/tools.json`: `readOnlyHint` en READ/META; `destructiveHint` en WRITE salvo `broker_quote_*`; `idempotentHint` en cancelación de órdenes.
- `structuredContent` — campo extra en el resultado de la tool; el JSON de texto no cambia.
- Resources — `bit2me://health`, `bit2me://server`, `bit2me://catalog` (tools habilitadas; sin I/O a Bit2Me). stdio y HTTP `resources/*`.
- Prompt `confirm_write` — argumento opcional `tool`.
- HTTP — bind por defecto `127.0.0.1`. Autentica el gateway Bit2Me, no un gate HTTP de producto.

Fuente de verdad de operador: AGENTS (Code Structure) + `.env.example`. Este fichero es diario.

### Technology

MCP (anotaciones, resources, prompts, `structuredContent`). Metadata en `data/tools.json`. Env documentada en `.env.example`.

### Business

El operador puede recortar el catálogo que ve el LLM y el cliente recibe hints de solo-lectura / destructivo sin inventar APIs nuevas.

### Security

Alineado con ADR 0003: proxy local, un usuario. HTTP no es un SaaS multi-tenant. WRITE irreversible sigue exigiendo `confirm=true` tras el preview (quotes Broker no). El gateway Bit2Me autentica las claves.

### Operations

Tras editar README/AGENTS: `pnpm build:llms` (regenera `landing/llms.txt` y `landing/llms-full.txt`). No editar a mano esos dos ni `TOOLS_DOCUMENTATION.md` / `landing/tools-data.js`. No reescribir HTML/CSS de `landing/`.

## Change log

### 2026-08-30 22:39 UTC — Health honesto + stats sin epoch

`general_health` pasa a META y su descripción deja de prometer reachability de Bit2Me (el probe es local). `getStats()` del breaker usa `null` si nunca hubo fallo, en vez de `Date.now()` desde 1970. Verificado en vivo: Inspector CLI + UI (stdio, 48 tools, protocol 2025-11-25) y HTTP en loopback (`/livez`, `/mcp` initialize/list/call, notificación 202). El gateway Bit2Me respondía 503 overload; el MCP mapea `isError` sin filtrar bodies.

### 2026-08-30 21:50 UTC — Cierre post-refactor

`initialize` negocia `protocolVersion` con el SDK. Tool desconocida → `ValidationError` (HTTP `-32602`). Prompts stdio usan el mismo tipo. Versión única (`package-version.ts`). `deprecated` en metadata ya no se ignora. CI corre `typecheck` + `publint` de verdad. Tests HTTP de envelope, confirm, allow-list y `-32600`.

### 2026-08-30 21:45 UTC — Notificaciones JSON-RPC sin cuerpo

`POST /mcp` sin `id` responde `202` vacío (MCP HTTP / JSON-RPC 2.0). No se despacha `tools/call`. `id: null` sigue siendo un request y sí responde.

### 2026-08-30 21:43 UTC — `params` JSON-RPC debe ser objeto

HTTP `POST /mcp` rechaza `params` array o escalar con `-32602` (400).

### 2026-08-30 21:41 UTC — `prompts/get` arguments objeto

Misma regla que `tools/call`: `arguments` array o escalar → `-32602`.

### 2026-08-30 21:39 UTC — `tools/call` arguments y mapa de errores HTTP

`arguments` de `tools/call` debe ser un objeto JSON (o omitirse). Un array o escalar responde `-32602` en vez de castear y despachar. Tests: `mapErrorToJsonRpc` (no filtra bodies) + `resources/read` de `bit2me://catalog`, `ping` y `general_health` por HTTP.

### 2026-08-30 20:36 UTC — Resource `bit2me://catalog`

Lista las tools habilitadas (`name`, `category`, `read_only`). Respeta `BIT2ME_ENABLED_CATEGORIES`. Sin llamadas a Bit2Me. Mismo URI en stdio y HTTP.

### 2026-08-30 20:10 UTC — HTTP al mismo catálogo MCP

`handleMcpRpc` en sibling. HTTP deja de devolver Method not found en prompts/resources. Copy ALS sin vender multi-tenant. Se elimina `getAllTools` duplicado en tool-metadata.

### 2026-08-30 20:05 UTC — Segunda pasada

`ValidationError` al dispatch de categoría off; `getPrompts()` oculta Earn/Loan; `confirm_write` exige tool con confirm gate; `structuredContent` solo en `executeTool`; cabecera de `http.ts` alineada con ADR 0003.

### 2026-08-30 19:58 UTC — Runtime integrado

Código en `main` working tree: annotations, structuredContent, resources, allow-list, prompt `confirm_write`, split de mappers/schemas, dispatch por Map, tests Earn/Loan.

### 2026-08-30 19:50 UTC — Docs de operador y copy ADR 0003

README, AGENTS, `.env.example` y cabecera de `src/index-http.ts` documentan allow-list, anotaciones, `structuredContent`, resources stdio y `confirm_write`. Se quita el copy «varios tenants comparten un servidor».
