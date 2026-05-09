# Bit2Me MCP Server

[![CI](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml)
[![Deploy](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml)
[![NPM Version](https://img.shields.io/npm/v/@bit2me/mcp-server?style=flat-square&color=0075FF&labelColor=slate-900)](https://www.npmjs.com/package/@bit2me/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/bit2me-devs/bit2me-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/bit2me-devs/bit2me-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server to interact with the [Bit2Me](https://bit2me.com/) ecosystem. This server allows AI assistants like Claude to access real-time market data, manage wallets, execute trading operations, and query products like Earn and Loans.

For more information, visit: **[https://mcp.bit2me.com](https://mcp.bit2me.com)**

**Bit2Me** is a leading cryptocurrency exchange based in Spain, offering a wide range of services including trading, staking (Earn), and loans. This MCP server acts as a bridge, enabling LLMs to perform actions and retrieve data securely from your Bit2Me account.

## 🚀 Features

- **General**: Asset information, account details, portfolio valuation, and self-introspection (`general_describe_tool` returns description, schema, and examples for any tool — useful for LLMs encountering a tool for the first time).
- **Wallet Management**: Query balances, transactions, and wallet (Pockets) details.
- **Pro Trading**: Manage orders (Limit, Market, Stop), query open orders, and transfer funds between Wallet and Pro.
- **Earn & Loans**: Manage Earn (Staking) strategies and collateralized loans.
- **Operations**: Execute trades, transfers, and withdrawals securely.
- **Idempotency & Retries**: Every write tool auto-generates an idempotency key; failed POST/DELETE calls retry with exponential backoff + jitter, making operations safe to retry without duplicates.
- **Decimal Precision**: Portfolio valuation uses `decimal.js` — no floating-point drift on large balances or high-precision assets.
- **Expanded PII Redaction**: Logs automatically scrub email addresses, IBANs, phone numbers, KYC fields, JWT-shaped tokens, and long base64 blobs, in addition to API keys and signatures.
- **Monotonic Nonces**: API-key signing uses a strictly-increasing nonce counter, preventing replay attacks even under high concurrency.
- **Audit Log**: Every write tool (order creation, withdrawals, earn deposits, loan operations, …) appends a tamper-evident JSON line on both success and failure. Set `AUDIT_LOG_PATH` to write to a dedicated file; otherwise audit lines are emitted via the logger with `audit: true`.
- **Parametrized Prompts**: `analyze_portfolio` and `market_summary` accept arguments. Three new prompts ship out of the box: `tax_report`, `dca_plan`, and `loan_health_check`.

## 🛠️ Available Tools & API Endpoints

The server currently exposes **48 tools** grouped as follows:

- 4 General tools (including `general_describe_tool` for self-introspection)
- 8 Broker (Simple Trading) tools
- 4 Wallet tools
- 14 Pro Trading tools
- 11 Earn (Staking) tools
- 7 Loan tools

Full descriptions, response schemas, Bit2Me REST endpoints and usage notes live in [`TOOLS_DOCUMENTATION.md`](./TOOLS_DOCUMENTATION.md).

## 📋 Documentation & Schemas

All tool responses are normalised for LLM consumption (consistent naming, flattened payloads, concise metadata). Use the following references when developing new tooling:

- **[`TOOLS_DOCUMENTATION.md`](./TOOLS_DOCUMENTATION.md)** – Auto-generated catalogue with descriptions, Bit2Me endpoints and response schemas for each tool.
- **[`data/tools.json`](./data/tools.json)** – Source metadata powering the landing page (includes request/response schemas and examples for each tool).

## ⚙️ Installation and Configuration

### Prerequisites

- **Node.js**: v20 or higher.
- **Bit2Me Account**: You need a verified Bit2Me account.

### 🔑 Authentication Methods

#### API Keys (Recommended)

The recommended way to authenticate is using API Keys. This method is secure, granular, and designed for programmatic access.

1. Go to your **[Bit2Me API Dashboard](https://app.bit2me.com/profile/api)**.
2. Click on **"New Key"**.
3. Select the permissions you need (e.g., Wallets, Trading, Earn, Loans).
    > **⚠️ Security Note:** This MCP server does **NOT** support crypto withdrawals to external blockchain addresses or transfers to other users. For security best practices, please **DO NOT** enable "Withdrawal" permissions on your API Key. Internal transfers between your own Bit2Me wallets (Wallet ↔ Pro ↔ Earn) are fully supported.

#### JWT Session Token (Alternative)

All tools support an optional `jwt` parameter for session-based authentication. This is useful for:

- **Multi-tenant applications**: Where each request is made on behalf of a different user.
- **Web integrations**: Where users are already authenticated via the Bit2Me web interface.

When the `jwt` parameter is provided, the server will use cookie-based authentication instead of API Keys.

```typescript
// Example: Using JWT session token
const result = await mcpClient.callTool("wallet_get_pockets", {
    symbol: "BTC",
    jwt: "user_session_token_here", // Optional - uses API keys if omitted
});
```

> **📝 Note:** API Keys are recommended for most use cases. The `jwt` parameter should only be used when building multi-tenant applications or web integrations where users have existing Bit2Me sessions.

### Steps

1. **Clone the repository:**

    ```bash
    git clone https://github.com/bit2me-devs/bit2me-mcp.git
    cd bit2me-mcp
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and add your keys:

    ```env
    BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
    BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET

    # Optional Configuration
    BIT2ME_GATEWAY_URL=https://gateway.bit2me.com  # Must be HTTPS (localhost/127.x are exempt)
    BIT2ME_REQUEST_TIMEOUT=30000     # Request timeout in ms (default: 30000)
    BIT2ME_MAX_RETRIES=3             # Max retries for rate limits (default: 3)
    BIT2ME_RETRY_BASE_DELAY=1000     # Base delay for backoff in ms (default: 1000)
    BIT2ME_LOG_LEVEL=info            # Log level: debug, info, warn, error (default: info)
    LOG_FORMAT=json                  # Optional: "json" for log aggregators; default is human-readable
    # AUDIT_LOG_PATH=/var/log/bit2me-mcp/audit.log  # Append-only write-tool audit log
    ```

    > **💡 QA/Staging:** Use `BIT2ME_GATEWAY_URL` to point to different environments (e.g., `https://qa-gateway.bit2me.com` for QA testing).

4. **Build the project:**
    ```bash
    npm run build
    ```

## 🖥️ Usage with Claude Desktop

To use this server with the Claude Desktop application, add the following configuration to your `claude_desktop_config.json` file:

### MacOS

`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows

`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
    "mcpServers": {
        "bit2me": {
            "command": "node",
            "args": ["/absolute/path/to/bit2me-mcp/build/index.js"],
            "env": {
                "BIT2ME_API_KEY": "YOUR_BIT2ME_ACCOUNT_API_KEY",
                "BIT2ME_API_SECRET": "YOUR_BIT2ME_ACCOUNT_API_SECRET"
            }
        }
    }
}
```

> **Note:** Replace `/absolute/path/to/...` with the actual full path to your project.

#### Using a Custom Gateway (QA/Staging)

For testing against different environments, add the `BIT2ME_GATEWAY_URL` variable:

```json
{
    "mcpServers": {
        "bit2me": {
            "command": "node",
            "args": ["/absolute/path/to/bit2me-mcp/build/index.js"],
            "env": {
                "BIT2ME_API_KEY": "YOUR_BIT2ME_ACCOUNT_API_KEY",
                "BIT2ME_API_SECRET": "YOUR_BIT2ME_ACCOUNT_API_SECRET",
                "BIT2ME_GATEWAY_URL": "https://qa-gateway.bit2me.com"
            }
        }
    }
}
```

## 🛡️ Security

### Security Policy

For detailed information about reporting vulnerabilities and our security policy, please see [SECURITY.md](./SECURITY.md).

### Best Practices

- **API Keys**: Never commit API keys to version control. The pre-commit hook runs `gitleaks` (if installed) to block accidental secret commits.
- **Permissions**: Use minimal permissions. Avoid "Withdrawal" permissions for MCP usage.
- **HTTPS Gateway**: `BIT2ME_GATEWAY_URL` is validated at startup — only `https://` URLs are accepted. Plain `http://` is rejected except for `localhost` / `127.x` addresses (local development only).
- **Monotonic Nonces**: API-key signing uses a strictly-increasing nonce counter so concurrent requests cannot generate replay-vulnerable signatures.
- **Expanded PII Redaction**: The logger scrubs API keys, signatures, JWTs, emails, IBANs, phone numbers, KYC fields, and long base64 blobs before writing any line to stderr.
- **Audit Log**: Every write tool appends an append-only JSON entry (tool name, sanitised args, outcome, correlation ID, SHA-256 fingerprint of the session token — never the token itself). Set `AUDIT_LOG_PATH` to persist to a file.

## ⚠️ Rate Limits & Error Handling

The Bit2Me API enforces rate limits to ensure stability.

- **429 Too Many Requests**: If the server hits a rate limit, it will **automatically retry** the request after a 1-second delay (up to 3 retries).
- **Console Warnings**: You may see warnings in the logs if rate limits are hit.
- **Best Practice**: Avoid asking for massive amounts of data in a very short loop.
- **Exponential Backoff**: The server now uses exponential backoff with jitter for retries to handle rate limits more gracefully.

## 📊 Logging

The server implements a structured logging system that automatically sanitizes sensitive data (API keys, signatures, JWTs, emails, IBANs, and other PII).
You can control the verbosity using the `BIT2ME_LOG_LEVEL` environment variable:

- `debug`: Detailed request/response logs (useful for development)
- `info`: Startup and operational events (default)
- `warn`: Rate limits and non-critical issues
- `error`: API errors and failures

Set `LOG_FORMAT=json` to switch the logger to a single-JSON-object-per-line format suitable for log aggregators (Loki, Datadog, CloudWatch, etc.). The default is human-readable.

All logs are written to **stderr**; stdout is reserved for the MCP JSON-RPC frame.

## 🧵 Concurrency Model

Each incoming tool call runs inside its own [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) boundary. The store carries:

- `correlationId`: a UUID generated per request, included in every log line
- `sessionToken` (`jwt`): the optional per-call session token, never logged in the clear
- `toolName`, `startTime`: useful for metrics / audit

Two requests that arrive concurrently — for example two different users hitting the HTTP transport with their own JWTs — never share state. The legacy global-context fallbacks remain for unit tests that run outside a `runWithContext` boundary, but production code paths always create a context. See `tests/concurrency.test.ts` and `tests/http-transport.test.ts` for the regression coverage.

Per-request state stored via `memoizePerRequest()` (e.g. wallet pockets fetched multiple times during a single broker quote) is keyed by `correlationId` and cleared in the `finally` block of `executeTool()` so the cache cannot grow unbounded.

## 🚢 Operating in Production

Two binaries ship with this package:

- `bit2me-mcp-server` — the original stdio transport, designed to be spawned by a single LLM client (Claude Desktop, Cursor, …).
- `bit2me-mcp-http` — the multi-tenant HTTP/SSE transport (`src/index-http.ts`). Each request supplies its own credentials in headers (`X-Bit2Me-Api-Key` + `X-Bit2Me-Api-Secret` or `Authorization: Bearer <jwt>`). TLS termination is delegated to a reverse proxy.

Recommended environment variables for the HTTP binary:

- `MCP_HTTP_HOST` / `MCP_HTTP_PORT` (default `127.0.0.1:3000`)
- `MCP_HTTP_AUTH_MODE`: `api_key` (default), `jwt`, or `both`
- `LOG_FORMAT=json` for structured logs
- `AUDIT_LOG_PATH=/var/log/bit2me-mcp/audit.log` to ship audit lines to a file

Built-in observability endpoints (HTTP transport only):

- `GET /health` — liveness + Bit2Me reachability + cache/circuit-breaker/rate-limiter snapshot. Cached for 30s.
- `GET /metrics` — Prometheus text-format counters (`bit2me_mcp_tool_calls_total`, `bit2me_mcp_tool_errors_total`, `bit2me_mcp_tool_duration_avg_ms`).

Reliability features active by default:

- Circuit breaker on the upstream Bit2Me API (`src/utils/circuit-breaker.ts`).
- Per-endpoint rate limiter with exponential backoff + jitter.
- Idempotency keys on every write tool (`pro_create_order`, `loan_create`, `earn_deposit`, …) — the SDK auto-generates one if the caller doesn't supply `idempotency_key`.
- Monotonic request nonces for API-key signing (replay-safe even under high concurrency).
- Append-only audit log for every successful **and** failed write operation.

## ❓ Troubleshooting

### Error: "Connection refused"

- Ensure the MCP server is running.
- Check that the path in `claude_desktop_config.json` points correctly to the `build/index.js` file.

### Error: "API Key invalid" or "Unauthorized"

- Verify your keys in `.env` or the Claude config.
- Ensure your API keys have the necessary permissions (Wallet, Trade, Earn, etc.) enabled in the Bit2Me dashboard.
- Check that there are no extra spaces or quotes around the API key values.

### Error: "Rate limit exceeded" or 429 responses

- The Bit2Me API has rate limits. The server automatically retries with exponential backoff.
- If you're hitting rate limits frequently, reduce the number of concurrent requests.
- Consider adding delays between operations in your workflows.

### Tools not showing up in Claude

- Restart Claude Desktop completely (quit and reopen).
- Check the Claude Desktop logs for initialization errors.
- Verify the configuration file syntax is valid JSON.

### Error: "Request timeout"

- Check your internet connection.
- Increase `BIT2ME_REQUEST_TIMEOUT` in your environment variables (default: 30000ms).
- Some Bit2Me API endpoints may be temporarily slow.

### Environment variables not loading

- When using `npx`, environment variables must be set in the config file's `env` section.
- For local development, ensure the `.env` file is in the project root.
- The server prioritizes config-provided credentials over `.env` file values.

### Error: "Network error" or CORS issues

- The MCP server runs server-side and doesn't have CORS restrictions.
- Network errors usually indicate connectivity problems or API downtime.
- Check the Bit2Me status page or try again later.

### Debugging

- Run the server manually to see logs:
    ```bash
    npm run dev
    ```
- Set `BIT2ME_LOG_LEVEL=debug` for detailed logging.
- Check Claude Desktop logs:
    - macOS: `~/Library/Logs/Claude/mcp*.log`
    - Windows: `%APPDATA%\Claude\logs\mcp*.log`

## 🔍 Testing with MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official debugging tool for MCP servers. It provides a web interface to test your tools, view responses, and debug issues.

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Running the Inspector

You have two options to run the inspector:

#### Option A: Using NPM Package (Recommended)

Use the published package from npm - no build required:

```bash
export BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
export BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET
npx -y @modelcontextprotocol/inspector npx @bit2me/mcp-server
```

#### Option B: Using Local Repository

For development or testing unreleased changes:

```bash
# 1. Clone and build the project
git clone https://github.com/bit2me-devs/bit2me-mcp.git
cd bit2me-mcp
npm install
npm run build

# 2. Run the inspector
export BIT2ME_API_KEY=YOUR_BIT2ME_ACCOUNT_API_KEY
export BIT2ME_API_SECRET=YOUR_BIT2ME_ACCOUNT_API_SECRET
npx @modelcontextprotocol/inspector node build/index.js
```

**Note:** The inspector will automatically open at `http://localhost:5173`

### Using the Inspector

The web interface provides:

1. **Tools Tab:**
    - View all 48 available tools
    - See input schemas for each tool
    - Test tools with custom parameters
    - View formatted responses

2. **Resources Tab:**
    - Explore available resources (if any)

3. **Prompts Tab:**
    - Test prompt templates (if configured)

4. **Request/Response Logs:**
    - See all MCP protocol messages
    - Debug communication issues
    - View timing information

### Example: Testing a Tool

1. Navigate to the **Tools** tab
2. Select a tool (e.g., `market_get_ticker`)
3. Fill in the required parameters:
    ```json
    {
        "base_symbol": "BTC",
        "quote_symbol": "EUR"
    }
    ```
4. Click **Run** to execute the tool
5. View the formatted response in the output panel

## 🌐 Landing Page Deployment

The project's landing page is located in the `/landing` directory.
Deployment is automated using GitHub Actions.

**How to update the website:**

1. Edit the HTML/CSS files in `/landing`.
2. Push your changes to the `main` branch.
3. The `.github/workflows/deploy.yml` action will automatically publish the changes.

**Domain:**
The `/landing/CNAME` file manages the custom domain configuration.

## 🤝 Contributing

We welcome contributions to improve this MCP server! Whether it's fixing bugs, adding new tools, or improving documentation, your help is appreciated.

Please read our **[Contributing Guidelines](./CONTRIBUTING.md)** for details on:

- Setting up your development environment
- Running tests
- Commit conventions (Conventional Commits)
- Pull Request process

### Quick Start

1.  **Fork and Clone**:
    ```bash
    git clone https://github.com/bit2me-devs/bit2me-mcp.git
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Create a Branch**:
    ```bash
    git checkout -b feat/amazing-feature
    ```

For full details, check the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build together.

## 📄 License

[MIT License](./LICENSE)
