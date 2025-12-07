# Bit2Me MCP Server

[![CI](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/ci.yml)
[![Deploy](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml/badge.svg)](https://github.com/bit2me-devs/bit2me-mcp/actions/workflows/deploy.yml)
[![NPM Version](https://img.shields.io/npm/v/@bit2me/mcp-server?style=flat-square&color=0075FF&labelColor=slate-900)](https://www.npmjs.com/package/@bit2me/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/bit2me-devs/bit2me-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/bit2me-devs/bit2me-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server to interact with the [Bit2Me](https://bit2me.com/) ecosystem. This server allows AI assistants like Claude to access real-time market data, manage wallets, execute trading operations, and query products like Earn and Loans.

For more information, visit: **[https://mcp.bit2me.com](https://mcp.bit2me.com)**

**Bit2Me** is a leading cryptocurrency exchange based in Spain, offering a wide range of services including trading, staking (Earn), and loans. This MCP server acts as a bridge, enabling LLMs to perform actions and retrieve data securely from your Bit2Me account.

## 🚀 Features

- **General**: Asset information, account details, and portfolio valuation.
- **Wallet Management**: Query balances, transactions, and wallet (Pockets) details.
- **Pro Trading**: Manage orders (Limit, Market, Stop), query open orders, and transfer funds between Wallet and Pro.
- **Earn & Loans**: Manage Earn (Staking) strategies and collateralized loans.
- **Operations**: Execute trades, transfers, and withdrawals securely.

## 🛠️ Available Tools & API Endpoints

The server currently exposes **47 tools** grouped as follows:

- 3 General tools
- 7 Broker (Simple Trading) tools
- 5 Wallet tools
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

- **Node.js**: v18 or higher.
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
    jwt: "user_session_token_here"  // Optional - uses API keys if omitted
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
    BIT2ME_GATEWAY_URL=https://gateway.bit2me.com  # API Gateway URL (default: https://gateway.bit2me.com)
    BIT2ME_REQUEST_TIMEOUT=30000     # Request timeout in ms (default: 30000)
    BIT2ME_MAX_RETRIES=3             # Max retries for rate limits (default: 3)
    BIT2ME_RETRY_BASE_DELAY=1000     # Base delay for backoff in ms (default: 1000)
    BIT2ME_LOG_LEVEL=info            # Log level: debug, info, warn, error (default: info)
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

- **API Keys**: Never commit API keys to version control.
- **Permissions**: Use minimal permissions. Avoid "Withdrawal" permissions for MCP usage.
- **Logging**: The server automatically sanitizes sensitive data in logs.

## ⚠️ Rate Limits & Error Handling

The Bit2Me API enforces rate limits to ensure stability.

- **429 Too Many Requests**: If the server hits a rate limit, it will **automatically retry** the request after a 1-second delay (up to 3 retries).
- **Console Warnings**: You may see warnings in the logs if rate limits are hit.
- **Best Practice**: Avoid asking for massive amounts of data in a very short loop.
- **Exponential Backoff**: The server now uses exponential backoff with jitter for retries to handle rate limits more gracefully.

## 📊 Logging

The server implements a structured logging system that automatically sanitizes sensitive data (API keys, signatures).
You can control the verbosity using the `BIT2ME_LOG_LEVEL` environment variable:

- `debug`: Detailed request/response logs (useful for development)
- `info`: Startup and operational events (default)
- `warn`: Rate limits and non-critical issues
- `error`: API errors and failures

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
    - View all 47 available tools
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
