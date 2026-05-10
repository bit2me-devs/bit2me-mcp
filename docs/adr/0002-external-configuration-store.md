# ADR 0002 — External Configuration Store for HTTP deployments

- Status: Deferred (2026-05-10) — see "Deferral note" below
- Date: 2026-05-10
- Deciders: Backend / SRE
- Supersedes: —
- Related: `src/config.ts`, `src/transport/http.ts`, `.env.example`

## Deferral note

This ADR is **deferred** rather than accepted or rejected. The proposal
is sound and reflects a real cloud pattern, but the current operating
profile of the project does not justify the implementation cost yet:

- The dominant deployment path is the **stdio binary** with `.env` /
  `process.env`. A single operator runs the MCP on their workstation
  with their own credentials; there is no shared service to rotate
  secrets for.
- The HTTP transport exists, but no hosted SaaS deployment of it is
  on the roadmap — every known operator runs it themselves, behind
  their own reverse proxy, with credentials they already manage
  through their existing platform.
- Implementing the pluggable resolver before there is an operator who
  needs it would be speculative code (YAGNI) and would still leave
  every concrete provider integration to be designed when a real
  request arrives.

The ADR is kept on file as the canonical design for when a trigger
appears.

### Reopen criteria

Move this ADR to **Accepted** and execute the implementation outline
when **any** of the following becomes true:

1. A managed-SaaS / multi-tenant hosted variant of the HTTP transport
   ships, requiring secret rotation without redeploys.
2. A concrete operator requests integration with a managed secret
   store (Vault, AWS Parameter Store + KMS, Azure Key Vault, GCP
   Secret Manager, Doppler, …) and `.env` no longer satisfies their
   compliance requirements (SOC 2, ISO 27001, PCI-DSS controls on
   secret handling).
3. Kubernetes-native deployments become a first-class target and
   operators want to mount secrets as files (Option C) rather than
   passing them through env at pod start.
4. The retry / circuit / rate-limit subsystems gain configuration
   that benefits from runtime updates without restarting the process.

Until then the existing `.env` + `process.env` resolver in
`src/config.ts` remains the single source of truth.

## Context

Today the MCP server reads its operational configuration (gateway URL,
log level, retry policy, **API credentials for the stdio mode**, ...)
exclusively from the process environment, with `dotenv` loading
`.env` as a fallback (see `getConfig()` in `src/config.ts`).

This is appropriate for the **stdio CLI** path: a single user runs
`bit2me-mcp-server` on their workstation with their own credentials.
It is _not_ appropriate for the **HTTP transport** when deployed as a
shared service:

1. Operational secrets (signing keys, observability tokens, future
   metrics push gateways) need to be rotated without redeploys.
2. Production environments (Kubernetes, ECS, GKE, AKS, ...) standardise
   on managed secret stores (Vault, AWS Parameter Store + KMS, Azure
   Key Vault, GCP Secret Manager, Doppler, …). A flat `.env` is at
   best a stop-gap and at worst a compliance failure.
3. The configuration should be auditable and versioned outside the
   source tree.

This is the textbook scenario for the **External Configuration Store**
cloud design pattern.

## Decision drivers

1. **Cloud neutrality** — the MCP server is published as a portable
   binary. We cannot couple the codebase to a specific provider.
2. **Backwards compatibility** — `.env` and `process.env` MUST remain
   the path for stdio CLI users; the new mechanism is opt-in.
3. **Boot-time vs. runtime resolution** — at minimum we need
   boot-time resolution (read once at startup). Hot-reload is
   desirable but not required for v1.
4. **Caching & failure handling** — the resolver must tolerate
   transient store outages (cache last-known-good values) and surface
   resolution errors loudly when no fallback exists.

## Options considered

### Option A — Provider-specific clients hard-coded

Add `@aws-sdk/client-ssm`, `@azure/keyvault-secrets`, etc., and pick at
runtime via env. Rejected: bloats the dependency tree for stdio users
and couples the MCP image to specific cloud SDKs.

### Option B — Pluggable resolver with chained fallbacks (RECOMMENDED)

Introduce a `ConfigResolver` interface in `src/config.ts`:

```ts
interface ConfigResolver {
    load(): Promise<Partial<RawConfig>>;
}
```

Ship two built-in resolvers:

- `EnvResolver` — current behaviour (`process.env` + `dotenv`).
- `RemoteResolver` — generic resolver pointing to a URL or command
  (`CONFIG_PROVIDER_URL`, `CONFIG_PROVIDER_CMD`) so operators can
  bridge whichever store they use without us depending on its SDK.
  Examples:
    - `vault read -format=json secret/mcp/bit2me`
    - `aws ssm get-parameters-by-path --path /mcp/bit2me ...`
    - `curl https://internal/secret/mcp.json`

Resolution order: explicit `process.env` > `RemoteResolver` >
`EnvResolver` (.env) > defaults.

Failure mode: if the `RemoteResolver` was configured but failed, log
`error` and keep the last-known-good cached snapshot if any; never
silently fall back to the previous tier (would mask a misconfigured
production deployment).

### Option C — Mount secrets as files

Operators mount Kubernetes Secret volumes / Vault Agent files at a
known path (`/run/secrets/mcp/*`). The MCP reads them via
`@iarna/toml` or just `readFileSync`.

- Pros: zero runtime SDK dependencies; works with every orchestrator.
- Cons: mixed schema (one secret per file); harder to validate.

## Decision

Adopt **Option B** — pluggable resolver with chained fallbacks — and
optionally support **Option C** as a special case of `RemoteResolver`
when `CONFIG_PROVIDER=files:/run/secrets/mcp/`.

Rationale:

- Keeps the stdio CLI path zero-config and zero-dependency.
- Keeps the codebase free of cloud SDKs while still letting operators
  plug in their preferred store via a standard CLI / HTTPS interface.
- Failure semantics are explicit and observable.

## Consequences

- **Positive**: cloud-neutral; small blast radius on the existing
  `getConfig()`; operators get a single integration surface they can
  back with whichever store they already operate.
- **Negative**: requires the operator to write a tiny bridge
  command/URL in environments that prefer SDK-native integration; slight
  added latency on cold start.
- **Follow-up**: pluggable resolver lays the groundwork for hot
  rotation (a future ADR can introduce a polling resolver and a
  signal-driven cache invalidation path).

## Implementation outline (deferred — execute when a reopen criterion is met)

| Step | File                                  | Change                                                                    | Status   |
| ---- | ------------------------------------- | ------------------------------------------------------------------------- | -------- |
| 1    | `src/config.ts`                       | Extract `RawConfig` type, add `ConfigResolver` interface.                 | Deferred |
| 2    | `src/config/env-resolver.ts` (new)    | Wrap the current `dotenv` + env logic.                                    | Deferred |
| 3    | `src/config/remote-resolver.ts` (new) | Implement URL + shell-command bridges.                                    | Deferred |
| 4    | `src/config.ts`                       | Replace `getConfig()` body with the chained resolver pipeline.            | Deferred |
| 5    | `tests/config.test.ts`                | Cover happy-path, last-known-good cache, and explicit-error path.         | Deferred |
| 6    | `README.md`                           | Document `CONFIG_PROVIDER`, `CONFIG_PROVIDER_URL`, `CONFIG_PROVIDER_CMD`. | Deferred |

## References

- _Cloud Design Patterns: External Configuration Store_ — Microsoft
  Architecture Center.
- _Twelve-Factor App, III. Config_ — https://12factor.net/config
- HashiCorp Vault, AWS Parameter Store, Azure Key Vault docs.
