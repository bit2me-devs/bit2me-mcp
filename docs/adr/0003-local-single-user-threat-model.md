# ADR 0003 — Local single-user threat model

- Status: Accepted
- Date: 2026-08-30
- Related: ADR 0001, `SECURITY.md`, `src/utils/write-guards.ts`

## Context

This MCP server is a **local proxy** the user runs on their machine (stdio, or HTTP bound to `127.0.0.1` by default). It is not a multi-tenant SaaS and not a public API. Bit2Me’s gateway authenticates API keys and JWTs.

Audits that assume cloud multi-tenancy produce false High/Critical findings and hide the real risk: an LLM acting as a confused deputy.

## Decision

Treat the following as facts. Do not re-litigate them on every security review.

- One tenant: process env (`BIT2ME_API_KEY` / JWT) is the operator’s. Env fallback is not confused-deputy between accounts.
- Effective auth is the **Bit2Me API gateway**. An HTTP gate that only checks that headers exist is not an auth bypass.
- There is no typical remote network attacker against the process. Default bind is loopback.
- The HTTP surface of this binary is Fastify in `src/transport/`, not Hono/Express from the MCP SDK.

## What matters

1. **LLM confused deputy** on WRITE (orders, Pro withdraw, Earn, loans, `broker_confirm_quote`). Preview `needs_confirmation` (never put `confirm` in `required` or `exampleArgs`), stable `idempotency_key`, strict `validateAmount`.
2. **Self-inflicted config**: malicious `BIT2ME_GATEWAY_URL`, world-readable `.env`, `INCLUDE_RAW_RESPONSE=true`, bind `0.0.0.0` without TLS.
3. **Axios client hardening** (redirects, env proxy) as defense if the gateway or `.env` is wrong — not as if this were an internet-facing server.

## Not High/Critical here

- HTTP “headers present only” (gateway validates).
- Cross-tenant leaks, lockout of “another” tenant, `/metrics` isolation.
- Cloud metadata SSRF (`169.254…`) unless someone deploys this as a cloud service (not the product).
- Multi-tenant ALS / HMAC-of-tenant as a product requirement.
