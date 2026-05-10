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

## Security Best Practices

When using the Bit2Me MCP server, please follow these security best practices:

- **API Keys**: Never commit API keys to version control. Use environment variables or secure configuration files.
- **Permissions**: Only grant the minimum necessary permissions to your API keys. Do not enable "Withdrawal" permissions — the MCP server intentionally does not support external blockchain withdrawals or transfers to other users, so granting that scope only widens the blast radius of a leak.
- **HTTP transport (`bit2me-mcp-http`)**: when running the multi-tenant binary, choose the auth mode that matches your topology and place TLS in front of any non-loopback bind. The full threat model and decision matrix live in [`docs/adr/0001-valet-key-http-credentials.md`](./docs/adr/0001-valet-key-http-credentials.md); the same matrix is summarised in the README under "Choosing an auth mode (HTTP transport)". The server emits a startup `WARN` when the legacy `api_key` mode is exposed on a non-loopback interface so misconfigurations are visible early.
- **Updates**: Keep the MCP server and its dependencies up to date to receive security patches.

## What We Consider Security Issues

- Authentication bypasses or weaknesses
- Authorization flaws that allow unauthorized access
- Sensitive data exposure (API keys, secrets, credentials)
- Injection vulnerabilities (code, command, SQL)
- Cross-Site Scripting (XSS) vulnerabilities
- Remote Code Execution (RCE) vulnerabilities
- Cryptographic weaknesses or misconfigurations
- Denial of Service (DoS) vulnerabilities

## What We Don't Consider Security Issues

- Issues that require physical access to the device
- Issues that require social engineering
- Issues that require already compromised accounts
- Self-XSS vulnerabilities
- Missing security headers without demonstrated impact
- Issues in third-party dependencies without a working exploit

## Recognition

We appreciate responsible disclosure and may recognize security researchers who help improve the security of the Bit2Me MCP server, subject to their consent.

## Questions

If you have questions about security or need clarification on whether something is a security issue, please open a discussion or contact the maintainers.
