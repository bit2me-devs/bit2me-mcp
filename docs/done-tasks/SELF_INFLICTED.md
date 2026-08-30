# Autolesión de configuración (ADR 0003)

Avisos y omisiones de log para que el operador no filtre bodies ni exponga HTTP plano.

## Contexto

### Qué es

El modelo de amenaza local lista tres autolesiones: gateway no-HTTPS, `.env` en git, `INCLUDE_RAW_RESPONSE=true`, bind `0.0.0.0` sin TLS. Esta pasada cierra las que el runtime podía callar.

### Por qué

`debug` logueaba el body POST (importes, pocket ids). JWT en `0.0.0.0` no avisaba, aunque ADR 0001 dice que HTTP plano en una interfaz alcanzable es mal config sea cual sea el modo. `.env.example` no documentaba `BIT2ME_INCLUDE_RAW_RESPONSE` pese al mapa.

### Architecture

- `logConfig` avisa si `INCLUDE_RAW_RESPONSE`.
- `warnIfPlainHttpOnNonLoopback` en `startHttpServer` (además del aviso de `api_key`).
- El cliente Bit2Me ya no loguea `signatureData` ni el JSON de error completo.

### Technology

Logger stderr. Sin TLS en el proceso (el operador pone TLS delante si sale de loopback).

### Business

Sin cambio de tools ni de contrato Bit2Me.

### Security

Autolesión, no atacante de red. `.env` sigue gitignored.

### Operations

Si bind `0.0.0.0`, verás un WARN al arrancar HTTP aunque `MCP_HTTP_AUTH_MODE=jwt`.

## Change log

### 2026-08-30 21:43 UTC — Sin const mentiroso de gateway

Se elimina `export const BIT2ME_GATEWAY_URL` (no era lazy: ignoraba el env) y el Proxy `config`. La URL sale de `getGatewayUrl()` → `getConfig().GATEWAY_URL`.

### 2026-08-30 21:41 UTC — `wrapResponseWithRaw` deja de ser código muerto

`buildContextualResponse` llama a `wrapResponseWithRaw`. El flag `BIT2ME_INCLUDE_RAW_RESPONSE` ya no era un no-op en el helper exportado; los handlers que pasan el payload crudo al builder siguen siendo el único sitio que adjunta `raw_response`.

### 2026-08-30 21:32 UTC — Avisos y logs sin body

`INCLUDE_RAW` documentado y WARN al boot. HTTP plano fuera de loopback avisa. Debug del cliente sin body.
