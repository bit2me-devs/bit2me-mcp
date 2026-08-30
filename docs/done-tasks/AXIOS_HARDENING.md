# Cliente Axios: path, redirects e Idempotency-Key

El proceso local no sigue redirects del gateway ni acepta un path que deje `BIT2ME_GATEWAY_URL`.

## Contexto

### Qué es

Cierre de la superficie Axios que ADR 0003 marca como autolesión: URL de gateway torcida, `.env` raro, o un path que no es relativo.

### Por qué

Axios sigue redirects por defecto. Una 3xx del gateway (o de un HTTP plano en loopback mal configurado) enviaría firma y API key a otro host. Un endpoint `https://…` concatenado a `getGatewayUrl()` también sale del gateway. `Idempotency-Key` ya se sanea en `resolveIdempotencyKey`; el builder lo vuelve a comprobar por si alguien pasa `options.idempotencyKey` crudo.

### Architecture

- `assertSafeEndpoint` en `src/services/bit2me-sign.ts` — path `/…`, sin query, URL absoluta ni CRLF. Corre antes de `getConfig()`.
- `buildBit2MeAxiosConfig` — `maxRedirects: 0`; `assertSafeIdempotencyKey` al poner el header.
- No se desactiva `HTTP_PROXY`/`HTTPS_PROXY`: un usuario local detrás de proxy corporativo tiene que poder salir. El riesgo de proxy de entorno se queda documentado, no se fuerza.

### Technology

Axios. Tests en `tests/bit2me-axios.test.ts`.

### Business

Sin cambio de contrato Bit2Me ni de tools.

### Security

Autolesión (gateway/`.env`/path), no un atacante de red. Cookie CRLF y tamaño de body ya existían.

### Operations

Si el gateway redirige, la llamada falla en vez de seguir. Corregir la URL, no el cliente.

## Change log

### 2026-08-30 21:31 UTC — Path acotado, sin redirects

`assertSafeEndpoint`, `maxRedirects: 0`, `Idempotency-Key` saneado en el builder.
