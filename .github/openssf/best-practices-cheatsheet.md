# OpenSSF / CII Best Practices — Passing badge cheatsheet

> Project page: <https://www.bestpractices.dev/projects/11511>
>
> This file contains the answers prepared for every "Passing" criterion of
> the OpenSSF Best Practices badge (formerly CII Best Practices). The badge
> form only accepts submissions from a logged-in browser session, so this
> document exists as a copy-paste reference for whoever submits the form.
>
> Last reviewed: 2026-05-09

## Legend

- `Met` — the criterion is fully satisfied; provide the justification text.
- `N/A` — the criterion does not apply to this kind of project.
- `Unmet` — the criterion is not yet satisfied (we mark these explicitly so
  the form does not silently default to "?").

---

## Basics

| Criterion                   | Status | Justification                                                                                                                                                                                   |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description_good`          | Met    | The README opens with a clear description of what an MCP server is and what value Bit2Me MCP provides for AI assistants. See <https://github.com/bit2me-devs/bit2me-mcp/blob/main/README.md>.   |
| `interact`                  | Met    | Issues, Discussions and Pull Requests are enabled on GitHub; CONTRIBUTING.md describes the contribution process.                                                                                |
| `contribution_requirements` | Met    | CONTRIBUTING.md documents the workflow, commit conventions, lint/test requirements and the pnpm tooling.                                                                                        |
| `license_location`          | Met    | (auto-detected)                                                                                                                                                                                 |
| `floss_license`             | Met    | MIT (auto-detected).                                                                                                                                                                            |
| `floss_license_osi`         | Met    | MIT is OSI-approved (auto-detected).                                                                                                                                                            |
| `documentation_basics`      | Met    | README.md, agents.md (developer guide), TOOLS_DOCUMENTATION.md (auto-generated tool catalogue), CONTRIBUTING.md and SECURITY.md cover installation, usage, contribution and security reporting. |
| `documentation_interface`   | Met    | TOOLS_DOCUMENTATION.md describes every tool, its parameters and example responses. The MCP server also exposes `general_describe_tool` to introspect the catalog at runtime.                    |
| `sites_https`               | Met    | (auto-detected) Both the homepage and the repository are served over HTTPS only.                                                                                                                |

## Change control

| Criterion             | Status | Justification                                                                                                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo_public`         | Met    | (auto-detected)                                                                                                                                               |
| `repo_track`          | Met    | (auto-detected)                                                                                                                                               |
| `repo_interim`        | Met    | All development happens through Pull Requests against `main` with squash/rebase merges. Each commit on `main` is a complete, reviewed change.                 |
| `repo_distributed`    | Met    | (auto-detected)                                                                                                                                               |
| `version_unique`      | Met    | Versions are assigned by `semantic-release` based on Conventional Commits and published as immutable npm tags.                                                |
| `version_semver`      | Met    | Strict Semantic Versioning enforced by `semantic-release` (see `.releaserc.json`).                                                                            |
| `version_tags`        | Met    | Every release creates a signed git tag `vX.Y.Z` and a matching GitHub Release.                                                                                |
| `release_notes`       | Met    | (auto-detected) CHANGELOG.md is generated by `@semantic-release/changelog` from Conventional Commits.                                                         |
| `release_notes_vulns` | Met    | Security-relevant changes are committed with the `fix(security)` or `fix!:` prefix and surface in CHANGELOG.md. SECURITY.md describes the disclosure process. |

## Reporting

| Criterion                       | Status | Justification                                                                                                                           |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `report_url`                    | Met    | <https://github.com/bit2me-devs/bit2me-mcp/issues>                                                                                      |
| `report_tracker`                | Met    | GitHub Issues.                                                                                                                          |
| `report_process`                | Met    | CONTRIBUTING.md and `.github/ISSUE_TEMPLATE/` describe how to file bugs and feature requests.                                           |
| `report_responses`              | Met    | Maintainers triage issues weekly; bugs labelled `priority/high` are acknowledged within 7 days.                                         |
| `enhancement_responses`         | Met    | Feature requests are reviewed via the `enhancement` label and either accepted (with a milestone) or politely declined with a rationale. |
| `report_archive`                | Met    | GitHub keeps the full history of issues and PRs publicly accessible.                                                                    |
| `vulnerability_report_process`  | Met    | SECURITY.md documents the responsible disclosure channel (private GitHub security advisory).                                            |
| `vulnerability_report_private`  | Met    | Private GitHub Security Advisories are enabled on the repository.                                                                       |
| `vulnerability_report_response` | Met    | SECURITY.md commits to acknowledging vulnerability reports within 14 days.                                                              |

## Quality

| Criterion                | Status | Justification                                                                                                                                                                                                                          |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`                  | Met    | `pnpm run build` produces the publishable bundle (`tsc -p tsconfig.build.json`).                                                                                                                                                       |
| `build_common_tools`     | Met    | Standard Node.js toolchain (`pnpm`, `tsc`, `vitest`); no exotic prerequisites.                                                                                                                                                         |
| `build_floss_tools`      | Met    | Every build dependency is FLOSS (Node.js, TypeScript, pnpm, vitest, ESLint, etc.).                                                                                                                                                     |
| `test`                   | Met    | 300+ unit, integration and property-based tests (`pnpm test`).                                                                                                                                                                         |
| `test_invocation`        | Met    | A single command — `pnpm test` — runs the full suite. CONTRIBUTING.md documents it.                                                                                                                                                    |
| `test_most`              | Met    | Vitest covers the registry, every tool handler, the request context, the rate limiter, the circuit breaker, the audit log, the HTTP transport, the formatters and the response mappers. Coverage is reported by `@vitest/coverage-v8`. |
| `test_policy`            | Met    | CONTRIBUTING.md and agents.md require tests for every new tool, mapper and validator.                                                                                                                                                  |
| `tests_are_added`        | Met    | Every PR adding behaviour has accompanying tests; the policy is enforced in code review.                                                                                                                                               |
| `tests_documented_added` | Met    | The policy is documented in CONTRIBUTING.md ("Test Requirements" section).                                                                                                                                                             |
| `warnings`               | Met    | ESLint runs in CI with `--max-warnings 0`; TypeScript builds with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.                                                                                                         |
| `warnings_fixed`         | Met    | The CI build fails on any warning, so the codebase is kept warning-free.                                                                                                                                                               |
| `warnings_strict`        | Met    | `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess` (production), `exactOptionalPropertyTypes`, `noImplicitOverride` and friends.                                                                                             |

## Security

| Criterion                        | Status | Justification                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `know_secure_design`             | Met    | The codebase implements per-request `AsyncLocalStorage` isolation, monotonic nonces, idempotency keys, append-only audit log, structured logging with PII redaction, HMAC-derived tenant ids, circuit breakers and rate limiting per tenant. Maintainers review threat models before adding new tools. |
| `know_common_errors`             | Met    | Maintainers are familiar with the OWASP Top 10 and the typical pitfalls of API clients (input validation, parameter pollution, log injection, SSRF, etc.). The HTTP transport documents these explicitly.                                                                                              |
| `crypto_published`               | N/A    | The project uses standard Node.js `crypto` (HMAC-SHA256, randomBytes); it does not implement any custom cryptographic algorithm.                                                                                                                                                                       |
| `crypto_call`                    | Met    | All cryptographic calls go through Node.js `crypto`, which is itself a well-maintained FLOSS library.                                                                                                                                                                                                  |
| `crypto_floss`                   | Met    | Node.js `crypto` is FLOSS.                                                                                                                                                                                                                                                                             |
| `crypto_keylength`               | Met    | HMAC-SHA256 with a 256-bit random key (see `src/transport/http.ts`).                                                                                                                                                                                                                                   |
| `crypto_working`                 | Met    | Only modern, non-deprecated primitives are used (HMAC-SHA256, `crypto.randomBytes`).                                                                                                                                                                                                                   |
| `crypto_pfs`                     | Met    | TLS termination is delegated to the deployment proxy/CDN; both Bit2Me's API endpoints and the optional GitHub Pages homepage support TLS 1.2+ ciphers with forward secrecy.                                                                                                                            |
| `crypto_password_storage`        | N/A    | The server stores no passwords. API keys and JWTs live only in per-request `AsyncLocalStorage` and are never persisted.                                                                                                                                                                                |
| `crypto_random`                  | Met    | `crypto.randomBytes` is used everywhere randomness is needed (tenant id key, idempotency keys, correlation ids).                                                                                                                                                                                       |
| `delivery_mitm`                  | Met    | The npm package is published with provenance (`NPM_CONFIG_PROVENANCE=true`) and signed with Cosign keyless attestations. SBOMs (CycloneDX) are signed and uploaded as release artifacts. The repository is served over HTTPS.                                                                          |
| `delivery_unsigned`              | Met    | Releases include CycloneDX SBOMs and Cosign signatures. The npm package carries provenance attestations linking the published artifact to this repository and to a specific GitHub Actions run.                                                                                                        |
| `vulnerabilities_fixed_60_days`  | Met    | The project tracks vulnerabilities via the weekly `pnpm audit` workflow, dependabot, GitHub Code Scanning (CodeQL) and OpenSSF Scorecard, and patches them well within 60 days.                                                                                                                        |
| `vulnerabilities_critical_fixed` | Met    | No publicly known critical vulnerabilities affect the project. The hardening pass landed in May 2026 closed every critical and high finding from CodeQL/Scorecard.                                                                                                                                     |

## Analysis

| Criterion                                | Status | Justification                                                                                                                                                                    |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static_analysis`                        | Met    | CodeQL (javascript), ESLint with `eslint-plugin-security`, OpenSSF Scorecard and `publint` all run on every PR.                                                                  |
| `static_analysis_common_vulnerabilities` | Met    | The CodeQL `security-and-quality` query suite covers the OWASP Top 10 and CWE Top 25.                                                                                            |
| `static_analysis_fixed`                  | Met    | All medium-and-above findings have been triaged: real issues fixed in code, false positives explicitly dismissed with a written justification (see Code Scanning alert history). |
| `static_analysis_often`                  | Met    | CodeQL and Scorecard run on every push to `main` and every PR, plus on a weekly schedule.                                                                                        |
| `dynamic_analysis`                       | Met    | Property-based fuzzing with `fast-check` runs on every PR (`Property-based Fuzzing` workflow).                                                                                   |
| `dynamic_analysis_unsafe`                | N/A    | TypeScript / JavaScript on Node.js — no memory-safety primitives in scope.                                                                                                       |
| `dynamic_analysis_enable_assertions`     | Met    | Tests run with Vitest assertions enabled and `NODE_ENV=test`. The runtime keeps Zod schema validation and `validateAmount`/`validateDateRange` checks active in production.      |
| `dynamic_analysis_fixed`                 | Met    | Fuzzing failures block merges and are fixed before release.                                                                                                                      |

## Other

| Criterion                         | Status            | Justification                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crypto_weaknesses`               | Met               | No use of MD5, SHA-1, RC4, DES, ECB or any other deprecated primitive.                                                                                                                                                                                                                                                                                                                                        |
| `test_continuous_integration`     | Met               | GitHub Actions CI runs the full validate pipeline on every push and PR.                                                                                                                                                                                                                                                                                                                                       |
| `discussion`                      | Met               | (auto-detected)                                                                                                                                                                                                                                                                                                                                                                                               |
| `no_leaked_credentials`           | Met               | Pre-commit gitleaks runs locally; a Gitleaks Secret Scan job runs in CI and uploads SARIF to Code Scanning. The `BIT2ME_API_KEY` and `BIT2ME_API_SECRET` are read from the environment, never committed.                                                                                                                                                                                                      |
| `english`                         | Met               | All documentation, code comments and CI output are in English.                                                                                                                                                                                                                                                                                                                                                |
| `hardening`                       | Met               | The landing page sets Content-Security-Policy, X-Content-Type-Options, Referrer-Policy and Permissions-Policy via `<meta http-equiv>` tags (GitHub Pages cannot set true HTTP headers). The MCP server itself enforces HTTPS for `BIT2ME_GATEWAY_URL`, redacts PII from logs, derives opaque tenant ids via HMAC-SHA256 with a per-process random key, and runs every write through an append-only audit log. |
| `crypto_used_network`             | Met               | All outbound traffic to Bit2Me's API uses HTTPS with TLS 1.2+. The HMAC-SHA256 used for request signing is implemented per Bit2Me's official spec.                                                                                                                                                                                                                                                            |
| `crypto_tls12`                    | Met               | Outbound HTTPS to Bit2Me uses TLS 1.2+; the Node.js HTTPS agent default disallows weaker versions.                                                                                                                                                                                                                                                                                                            |
| `crypto_certificate_verification` | Met               | TLS certificate verification is enabled (default in `axios`/Node.js) and never disabled.                                                                                                                                                                                                                                                                                                                      |
| `crypto_verification_private`     | Met               | Same as above; certificate verification is in effect for every connection.                                                                                                                                                                                                                                                                                                                                    |
| `hardened_site`                   | Met (with caveat) | CSP, X-Content-Type-Options, Referrer-Policy and Permissions-Policy are emitted as `<meta http-equiv>` from `landing/index.html`. HSTS requires a real HTTP header which GitHub Pages does not let us add; it will be enabled once the homepage is fronted by Cloudflare.                                                                                                                                     |
| `installation_common`             | Met               | A single `npx @bit2me/mcp-server` (or `pnpm install` in the repo) is enough to run the server. README documents both flows.                                                                                                                                                                                                                                                                                   |
| `build_reproducible`              | Met               | `pnpm install --frozen-lockfile` produces a reproducible install from `pnpm-lock.yaml`; `pnpm run build` is deterministic.                                                                                                                                                                                                                                                                                    |

---

## Form-submission tips

1. Open <https://www.bestpractices.dev/projects/11511/edit> while logged in
   with the GitHub account that owns the project (user_id `46489`).
2. Paste the justifications above into the matching fields.
3. The fields auto-save; you can leave the page and come back.
4. When the percentage hits 100 the badge turns green; click "Submit"
   only after every criterion is either Met or N/A.
5. The badge URL to embed in the README will be:
   `https://www.bestpractices.dev/projects/11511/badge`.

## Once the badge is green

Add this line to README.md right under the existing badges:

```markdown
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/11511/badge)](https://www.bestpractices.dev/projects/11511)
```
