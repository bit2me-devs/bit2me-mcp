# Reporting Security Issues

The Bit2Me team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

## How to Report Security Issues

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/bit2me-devs/bit2me-mcp/security/advisories/new) tab.

The Bit2Me team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## Reporting Security Bugs in Dependencies

Report security bugs in third-party modules to the person or team maintaining the module. You can also report a vulnerability through the [npm contact form](https://www.npmjs.com/support) by selecting "I'm reporting a security vulnerability".

## Escalation

If you do not receive an acknowledgement of your report within 6 business days, or if you cannot find a private security contact for the project, you may escalate by opening a ticket in ["Bit2Me Support Platform"](https://support.bit2me.com/en/support/tickets/new).

If the project acknowledges your report but does not provide any further response or engagement within 14 days, escalation is also appropriate.

## Threat model (this repository)

The server is a **local, single-user proxy** (stdio or HTTP on `127.0.0.1`). Bit2Me’s gateway authenticates keys/JWTs. The findings that matter are LLM confused-deputy on WRITE tools and self-inflicted config — not multi-tenant SaaS issues.

Canonical write-up: [`docs/adr/0003-local-single-user-threat-model.md`](./docs/adr/0003-local-single-user-threat-model.md).

## Security Best Practices

When using the Bit2Me MCP server, please follow these security best practices:

- **API Keys**: Never commit API keys to version control. Use environment variables or secure configuration files.
- **Permissions**: Only grant the minimum necessary permissions to your API keys. Do not enable "Withdrawal" permissions — the MCP server intentionally does not support external blockchain withdrawals or transfers to other users, so granting that scope only widens the blast radius of a leak.
- **HTTP transport (`bit2me-mcp-http`)**: per-request API key or JWT (not a hosted multi-tenant SaaS). Default bind is `127.0.0.1`. Put TLS in front of any non-loopback bind. Decision matrix: [`docs/adr/0001-valet-key-http-credentials.md`](./docs/adr/0001-valet-key-http-credentials.md) and README “Choosing an auth mode”. The server emits a startup `WARN` when `api_key` mode is on a non-loopback interface.
- **Updates**: Keep the MCP server and its dependencies up to date to receive security patches.

## What We Consider Security Issues

- LLM confused-deputy on WRITE tools (missing `needs_confirmation` preview, unstable `idempotency_key`, loose amount parsing)
- Self-inflicted config that leaks or redirects credentials (`BIT2ME_GATEWAY_URL`, world-readable `.env`, bind `0.0.0.0` without TLS)
- Sensitive data exposure (API keys, secrets, credentials) in logs, audit, or responses
- Injection or RCE in this process
- Cryptographic weaknesses in request signing

## What We Don't Consider Security Issues

- HTTP gate that only checks that credential headers **exist** (Bit2Me’s gateway authenticates)
- Cross-tenant isolation, lockout of “another” tenant, or `/metrics` tenancy (this is a local one-user proxy)
- Missing HMAC-of-tenant / multi-tenant ALS as a **product** requirement
- Cloud metadata SSRF unless the operator deploys this as a cloud service
- Issues that require physical access, social engineering, or an already compromised account
- Self-XSS; missing security headers without demonstrated impact
- Issues in third-party **dev** dependencies without a working exploit in the published package

## Recognition

We appreciate responsible disclosure and may recognize security researchers who help improve the security of the Bit2Me MCP server, subject to their consent.

## Questions

If you have questions about security or need clarification on whether something is a security issue, please open a discussion or contact the maintainers.
