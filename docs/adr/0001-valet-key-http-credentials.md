# ADR 0001 — HTTP transport credential strategy

- Status: Accepted
- Date: 2026-05-10
- Deciders: Backend / SRE
- Supersedes: —
- Related: `src/transport/http.ts`, `src/utils/context.ts`, `src/utils/logger.ts`,
  `src/services/bit2me.ts`

## Context

The HTTP transport (`src/transport/http.ts`) is multi-tenant by design.
Each request must carry the credentials needed to talk to the upstream
Bit2Me API. Two authentication modes are accepted:

- `api_key`: client sends `X-Bit2Me-Api-Key` and `X-Bit2Me-Api-Secret`.
- `jwt`: client sends `Authorization: Bearer <jwt>`.

A combined `both` mode accepts either. The implicit default for the
HTTP transport is `api_key`.

### How the API secret is actually used (matters for the threat model)

The secret never leaves the MCP toward the upstream API. It is used as
the HMAC key to sign each outgoing request:

```
SHA256(message) → HMAC-SHA512 → base64
```

The MCP forwards `x-api-key` plus the resulting `api-signature` to
Bit2Me; the raw secret stays inside the MCP process (see
`generateSignature` in `src/services/bit2me.ts`). Therefore the secret
only crosses the wire on **one** hop: from the HTTP client to the MCP
server.

### Where the secret can still leak on that single hop

- TLS-terminating reverse proxies that log request headers verbatim
  (nginx access logs, ALB, traefik in debug, Cloudflare logpush).
- Misconfigured middleware that serialises every header into structured
  logs.
- APM/observability tooling that captures HTTP headers by default
  (Datadog, New Relic, Sentry, …).
- Mistakes by the calling LLM agent that paste the credential headers
  into conversation history.
- Memory dumps / core dumps of the Node.js process.

These risks only materialise when the HTTP transport is reachable on a
non-loopback interface **and** the operator has not tightly controlled
the proxy chain in front of it.

### What Bit2Me already provides

The Bit2Me API dashboard lets the operator mint API keys with explicit,
narrowly-scoped permissions (read-only, trading without withdrawal,
single subaccount, …). A correctly-scoped API key is **already a valet
key emitted by the upstream provider**: the MCP does not need to mint a
second one on top.

## Decision drivers

1. **Blast radius** — given a leak on the client↔MCP hop, what does the
   attacker get? With a tightly-scoped API key: a token that cannot
   withdraw funds, optionally read-only, revocable from the Bit2Me
   dashboard. With an over-scoped one: full account control. With a
   Bit2Me JWT: a session that expires on its own (~15 min).
2. **Operator simplicity** — every additional auth concept the operator
   has to understand is a footgun. API key + scopes is the lingua
   franca of MCP servers (Stripe, GitHub, Linear, Notion, Postgres, …).
3. **Compatibility** — many integrators only have API keys, not a Bit2Me
   JWT. Forcing a mode break would push them to fish a JWT out of the
   web flow on every restart.
4. **Defence in depth** — independent of the chosen mode, credential
   headers must never reach structured logs, and the operator must be
   alerted if they expose the legacy mode on a network-reachable
   interface without TLS.

## Options considered

### Option A — Force `authMode: "jwt"` and deprecate `api_key` for HTTP

Change the default and make API-key mode opt-in.

- Pros: smallest credential surface; JWTs are short-lived.
- Cons: breaks the dominant integration pattern; depends on Bit2Me JWT
  semantics that the MCP cannot improve unilaterally; the MCP cannot
  enforce token scopes (Bit2Me decides them); operators that mint
  scoped API keys correctly already have a valet key.

### Option B — Issue MCP-native short-lived tokens

Add `POST /auth/token` to the HTTP transport. Clients exchange the API
key/secret pair (or a Bit2Me JWT) for an MCP-issued token
(`mcp_<base64>`) signed with a server-side HMAC, with TTL of 5–15 min
and a scope restricted to a list of allowed tools.

- Pros: per-tenant scopes enforceable inside the MCP server;
  credential never travels on subsequent requests; rotating the
  signing key revokes every active token.
- Cons: requires a key store, refresh logic, and a `POST /auth/refresh`
  endpoint; new auth concept the operator must understand;
  token-store sizing on multi-tenant deployments needs care.

### Option C — Mutual TLS between reverse proxy and MCP server

Operators terminate client TLS at a reverse proxy that authenticates
the client via mTLS, and the proxy injects a static internal credential
when forwarding to the MCP.

- Pros: cryptographically the strongest option.
- Cons: mTLS provisioning is operationally heavy and outside the scope
  of most MCP integrations; does not fit drop-in deployments.

### Option D — Keep `api_key` as the default, harden defence in depth

Accept that `api_key` with a tightly-scoped credential is a valid
production mode (matches Stripe/GitHub/Linear/etc. MCP servers) and
focus on:

- Redacting `x-bit2me-api-*` headers in every log path.
- Warning the operator at startup when the legacy mode is exposed on a
  non-loopback interface.
- Documenting an explicit decision matrix so operators choose the right
  mode for their topology.

## Decision

Adopt **Option D as the immediate stance**, keep **Option B on the
backlog** for a future managed-SaaS MCP tier, and **reject Option A and
Option C** for this iteration:

- **A is rejected** because (a) Bit2Me-issued API keys with scopes
  already implement the valet-key pattern at the provider layer, and
  (b) forcing a default change would break the dominant integration
  pattern across the MCP ecosystem with little net security gain when
  the operator follows the recommended scopes guidance.
- **C is rejected** because the MCP cannot enforce mTLS provisioning
  from inside its own process; the decision is shifted to operators
  and orthogonal to this server.
- **B stays in the backlog** because per-tool scopes inside the MCP
  only become valuable when the same deploy serves multiple
  third-party integrators with diverging permission sets.

### Operator decision matrix (default behaviour, enforced by docs + warnings)

| Topology                                                               | Recommended `authMode`                                 | Rationale                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| stdio (local CLI / Cursor / Claude Desktop)                            | n/a — `BIT2ME_API_KEY` + `BIT2ME_API_SECRET` in `.env` | Single-process, no network hop. Scopes set in the Bit2Me dashboard.                  |
| HTTP bound to loopback (`127.0.0.1`, `::1`, `localhost`)               | `api_key`                                              | Credentials never leave the host.                                                    |
| HTTP on a private network / VPN behind a TLS-terminating reverse proxy | `api_key`                                              | Hop is encrypted; scopes set in the Bit2Me dashboard; operator owns the proxy chain. |
| HTTP exposed on the public internet for a single operator              | `jwt`                                                  | Bit2Me JWT auto-expires (~15 min); API-secret leak window is shorter.                |
| HTTP shared by multiple third-party integrators                        | `jwt` (today) → revisit Option B                       | Independent revocation per integrator.                                               |

Hard rules that apply regardless of mode:

- API keys MUST be minted with the smallest scope that satisfies the
  caller's use case. Never enable Withdrawal scopes for MCP usage.
- The HTTP transport MUST sit behind TLS on any non-loopback bind.
  Plain HTTP on `0.0.0.0` is a misconfiguration regardless of `authMode`.
- Credential headers must never reach structured logs (enforced in code
  via the redaction list in `src/utils/logger.ts`).

## Consequences

- **Positive**: alignment with the rest of the MCP ecosystem;
  documentation tells operators exactly which mode to pick for their
  topology; the warning at startup catches the only realistic
  misconfiguration that the MCP can detect (`api_key` on a non-loopback
  bind).
- **Negative**: operators that mint over-scoped API keys can still leak
  withdrawal capability if the proxy chain mishandles headers. This is
  a scope-management problem the MCP cannot solve unilaterally; the
  README and `SECURITY.md` will continue to flag it prominently.
- **Follow-up**: revisit Option B if a managed-SaaS tier ships, or if
  per-tool scopes become a contractual requirement.

## Implementation outline

| #   | File                                                   | Change                                                                                                                      | Status                                    |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | `src/transport/http.ts`                                | Default `authMode` to `"jwt"` in `buildHttpServer`.                                                                         | **Rejected** — see Decision § (Option A). |
| 2   | `src/transport/http.ts`                                | Emit `logger.warn` (`warnIfApiKeyOnNonLoopback` + `isLoopbackHost`) when `api_key`/`both` is active on a non-loopback host. | **Done.**                                 |
| 3   | `src/utils/logger.ts`                                  | Append `x-bit2me-api-key`, `x-bit2me-api-secret`, `api-key`, `api-secret` to `sensitiveKeys`.                               | **Done.**                                 |
| 4   | `README.md`                                            | Operational guidance: auth-mode decision matrix + scopes guidance + TLS rule.                                               | **Done.**                                 |
| 5   | `tests/http-transport.test.ts`, `tests/logger.test.ts` | Cover the loopback × auth-mode matrix and the new redactions.                                                               | **Done.**                                 |

## References

- _Cloud Design Patterns: Valet Key_ — Microsoft Architecture Center
- _OAuth 2.0 Bearer Token Usage_ — RFC 6750
- _OWASP Logging Cheat Sheet_ — Best Practices for Avoiding Credentials in Logs
- _Bit2Me API key scopes_ — Bit2Me API Dashboard documentation
