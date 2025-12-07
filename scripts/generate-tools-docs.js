#!/usr/bin/env node
/**
 * Script to generate documentation artifacts from centralized tools metadata
 * Generates:
 * - landing/tools-data.js (for landing page)
 * - TOOLS_DOCUMENTATION.md (response schemas with descriptions and endpoints)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Endpoint mappings for each tool
 * Maps tool names to their Bit2Me API endpoints
 */
const ENDPOINT_MAPPINGS = {
    // General
    general_get_assets_config: 'GET /v2/currency/assets\nGET /v2/currency/assets/:symbol',
    portfolio_get_valuation: 'Aggregates Wallet, Pro, Earn & Loan services',

    // Broker
    broker_get_asset_price: 'GET /v1/currency/rate',
    broker_get_asset_data: 'GET /v3/currency/ticker/:symbol',
    broker_get_asset_chart: 'GET /v3/currency/chart',
    broker_quote_buy: 'POST /v1/wallet/transaction/proforma',
    broker_quote_sell: 'POST /v1/wallet/transaction/proforma',
    broker_quote_swap: 'POST /v1/wallet/transaction/proforma',
    broker_confirm_quote: 'POST /v1/wallet/transaction',

    // Wallet
    wallet_get_cards: 'GET /v1/teller/card',
    wallet_get_pockets: 'GET /v1/wallet/pocket',
    wallet_get_pocket_addresses: 'GET /v2/wallet/pocket/:pocket_id/:network/address',
    wallet_get_networks: 'GET /v1/wallet/currency/:symbol/network',
    wallet_get_movements: 'GET /v1/wallet/transaction\nGET /v1/wallet/transaction/:movement_id',

    // Pro Trading
    pro_get_balance: 'GET /v1/trading/wallet/balance',
    pro_get_open_orders: 'GET /v1/trading/order',
    pro_get_trades: 'GET /v1/trading/trade',
    pro_get_order_trades: 'GET /v1/trading/order/:id/trades',
    pro_get_market_config: 'GET /v1/trading/market-config',
    pro_get_order_book: 'GET /v2/trading/order-book',
    pro_get_public_trades: 'GET /v1/trading/trade/last',
    pro_get_candles: 'GET /v1/trading/candle',
    pro_get_ticker: 'GET /v2/trading/tickers',
    pro_create_order: 'POST /v1/trading/order',
    pro_cancel_order: 'DELETE /v1/trading/order/:id',
    pro_cancel_all_orders: 'DELETE /v1/trading/order',
    pro_deposit: 'POST /v1/trading/wallet/deposit',
    pro_withdraw: 'POST /v1/trading/wallet/withdraw',

    // Earn
    earn_get_summary: 'GET /v1/earn/summary',
    earn_get_positions: 'GET /v2/earn/wallets',
    earn_get_position_movements: 'GET /v1/earn/wallets/:id/movements',
    earn_get_movements: 'GET /v2/earn/movements',
    earn_get_movements_summary: 'GET /v1/earn/movements/:type/summary',
    earn_get_rewards_config: 'GET /v1/earn/wallets/rewards/config',
    earn_get_position_rewards_config: 'GET /v1/earn/wallets/:id/rewards/config',
    earn_get_position_rewards_summary: 'GET /v1/earn/wallets/:id/rewards/summary',
    earn_get_assets: 'GET /v2/earn/assets',
    earn_deposit: 'POST /v1/earn/wallets/:id/movements',
    earn_withdraw: 'POST /v1/earn/wallets/:id/movements',

    // Loans
    loan_get_simulation: 'GET /v1/loan/ltv',
    loan_get_config: 'GET /v1/loan/currency/configuration',
    loan_get_movements: 'GET /v1/loan/movements',
    loan_get_orders: 'GET /v1/loan/orders',
    loan_create: 'POST /v1/loan',
    loan_increase_guarantee: 'POST /v1/loan/orders/:id/guarantee/increase',
    loan_payback: 'POST /v1/loan/orders/:id/payback',

    // Health
    server_health_check: 'Internal health aggregation'
};

/**
 * Parameters marked as internal (with _internal: true) are excluded from documentation
 */

/**
 * Global JWT parameter that is injected into all tools
 * This parameter enables alternative session-based authentication
 */
const JWT_PARAMETER = {
    type: 'string',
    description: 'Optional session token for authentication. API keys are recommended for most use cases.'
};

/**
 * Convert inputSchema to simplified args format for landing
 * Excludes internal parameters (marked with _internal: true) from documentation
 * Injects the global jwt parameter into all tools
 */
function convertInputSchemaToArgs(inputSchema) {
    if (!inputSchema.properties) {
        // Even if no properties, inject jwt parameter
        return {
            jwt: {
                type: JWT_PARAMETER.type,
                desc: JWT_PARAMETER.description,
                required: false
            }
        };
    }

    const requiredFields = inputSchema.required || [];
    const args = {};
    for (const [key, value] of Object.entries(inputSchema.properties)) {
        // Skip internal parameters only
        if (value._internal === true) {
            continue;
        }
        args[key] = {
            type: value.type || 'string',
            desc: value.description || '',
            required: requiredFields.includes(key)
        };
        if (value.enum) args[key].enum = value.enum;
        if (value.examples) args[key].examples = value.examples;
        if (value.default !== undefined) args[key].default = value.default;
    }

    // Inject global jwt parameter
    args.jwt = {
        type: JWT_PARAMETER.type,
        desc: JWT_PARAMETER.description,
        required: false
    };

    return args;
}

/**
 * Generate tools-data.js for landing page
 */
function generateLandingToolsData(metadata, version) {
    const categories = metadata.categories.map(cat => ({
        category: cat.name,
        id: `cat-${cat.id}`,
        icon: cat.icon,
        description: cat.description || '',
        tools: cat.tools.map(tool => {
            const toolData = {
                name: tool.name, // Keep original name for API compatibility
                type: tool.type,
                desc: tool.description,
                args: convertInputSchemaToArgs(tool.inputSchema),
                exampleArgs: tool.exampleArgs,
                response: tool.exampleResponse,
                responseSchema: tool.responseSchema, // Include response schema for field descriptions
                attributes: tool.attributes || { requires_auth: false } // Include attributes for auth visibility
            };
            
            return toolData;
        })
    }));

    return `// Auto-generated from data/tools.json
// Do not edit manually - run: npm run build:docs

const toolsData = ${JSON.stringify(categories, null, 4)};

// Package version
const packageVersion = '${version}';

// Export for use in landing page
if (typeof window !== 'undefined') {
    window.toolsData = toolsData;
    window.packageVersion = packageVersion;
}
`;
}

/**
 * Format a schema property for markdown documentation
 * Returns empty string for internal parameters (marked with _internal: true)
 */
function formatSchemaProperty(key, prop, required, indent = '') {
    // Skip internal parameters only
    if (prop._internal === true) {
        return '';
    }
    
    let typeStr = prop.type || 'any';
    if (prop.format) typeStr += ` (${prop.format})`;
    
    const requiredStr = required ? ' **(required)**' : '';
    const description = prop.description || '';
    
    let line = `${indent}- **\`${key}\`** (${typeStr})${requiredStr}: ${description}`;
    
    // Add enum values if present
    if (prop.enum && prop.enum.length > 0) {
        line += `\n${indent}    - Possible values: ${prop.enum.map(v => `\`"${v}"\``).join(', ')}`;
    }
    
    // Add nullable info
    if (prop.nullable) {
        line += `\n${indent}    - Can be \`null\``;
    }
    
    // Handle array items
    if (prop.type === 'array' && prop.items) {
        if (prop.items.type === 'object' && prop.items.properties) {
            line += `\n${indent}    - Array items:`;
            const itemRequired = prop.items.required || [];
            for (const [itemKey, itemProp] of Object.entries(prop.items.properties)) {
                line += '\n' + formatSchemaProperty(itemKey, itemProp, itemRequired.includes(itemKey), indent + '        ');
            }
        } else {
            line += `\n${indent}    - Array items: ${prop.items.type || 'any'}`;
        }
    }
    
    // Handle nested objects
    if (prop.type === 'object' && prop.properties) {
        const nestedRequired = prop.required || [];
        for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
            line += '\n' + formatSchemaProperty(nestedKey, nestedProp, nestedRequired.includes(nestedKey), indent + '    ');
        }
    }
    
    return line;
}

/**
 * Generate response schema documentation for a tool
 */
function generateToolResponseDocs(tool) {
    let doc = '';
    
    // Add description
    doc += `> ${tool.description}\n\n`;
    
    // Add response fields if schema exists
    if (tool.responseSchema && tool.responseSchema.properties) {
        doc += '#### Response Fields\n\n';
        const required = tool.responseSchema.required || [];
        
        for (const [key, prop] of Object.entries(tool.responseSchema.properties)) {
            doc += formatSchemaProperty(key, prop, required.includes(key)) + '\n';
        }
        doc += '\n';
    }
    
    // Add example response if exists
    if (tool.exampleResponse) {
        doc += '#### Example Response\n\n';
        doc += '```json\n';
        doc += JSON.stringify(tool.exampleResponse, null, 4);
        doc += '\n```\n\n';
    }
    
    // Add endpoint reference at the end
    const endpoint = ENDPOINT_MAPPINGS[tool.name] || 'N/A';
    doc += `**Bit2Me API:** \`${endpoint.replace(/\n/g, '` | `')}\`\n`;
    
    return doc;
}

/**
 * Generate TOOLS_DOCUMENTATION.md with response schemas
 */
function generateToolsDocumentation(metadata) {
    let doc = '# Tool Response Schemas\n\n';
    doc += 'This document shows the exact JSON structure returned by each Bit2Me MCP tool, including detailed descriptions of each field and their possible values.\n\n';
    
    // Count tools
    const counts = metadata.categories.map(cat => `- ${cat.tools.length} ${cat.name} Tools`);
    const total = metadata.categories.reduce((sum, cat) => sum + cat.tools.length, 0);
    
    doc += `## Tool Count (${total} total)\n\n`;
    doc += counts.join('\n') + '\n\n';
    doc += '_Note: Write operation tools are included in their respective categories._\n\n';
    doc += '---\n\n';
    
    // Generate docs for each category
    for (const category of metadata.categories) {
        doc += `## ${category.name} (${category.tools.length} tools)\n\n`;
        
        if (category.description) {
            doc += `> **Note:** ${category.description}\n\n`;
        }
        
        for (const tool of category.tools) {
            doc += `### ${tool.name}\n\n`;
            doc += generateToolResponseDocs(tool);
            doc += '\n';
        }
        
        doc += '---\n\n';
    }
    
    // Add footer
    doc += '## Additional Resources\n\n';
    doc += '- **Source of truth**: [`data/tools.json`](./data/tools.json) contains all tool definitions, input schemas, response schemas and examples.\n';
    doc += '- **Landing page**: The [landing site](./landing/index.html) is auto-generated from the same source.\n';
    doc += '- **Regenerate docs**: Run `npm run build:docs` after modifying `data/tools.json`.\n\n';
    doc += `---\n\n_Auto-generated on ${new Date().toISOString().split('T')[0]}._\n`;
    
    return doc;
}

/**
 * Main function
 */
function main() {
    console.log('🔄 Generating documentation artifacts...');

    // Load package.json to get version
    const packageJsonPath = join(rootDir, 'package.json');
    const packageJson = JSON.parse(
        readFileSync(packageJsonPath, 'utf-8')
    );
    const version = packageJson.version;

    // Load metadata
    const metadataPath = join(rootDir, 'data', 'tools.json');
    const metadata = JSON.parse(
        readFileSync(metadataPath, 'utf-8')
    );

    // Generate landing tools data with version
    const landingData = generateLandingToolsData(metadata, version);
    const landingPath = join(rootDir, 'landing', 'tools-data.js');
    writeFileSync(landingPath, landingData);
    console.log(`✅ Generated ${landingPath}`);

    // Generate TOOLS_DOCUMENTATION.md
    const toolsDocs = generateToolsDocumentation(metadata);
    const toolsDocsPath = join(rootDir, 'TOOLS_DOCUMENTATION.md');
    writeFileSync(toolsDocsPath, toolsDocs);
    console.log(`✅ Generated ${toolsDocsPath}`);

    const totalTools = metadata.categories.reduce((sum, cat) => sum + cat.tools.length, 0);
    console.log(`\n✅ Documentation generation complete!`);
    console.log(`   Categories: ${metadata.categories.length}`);
    console.log(`   Total tools: ${totalTools}`);
}

try {
    main();
} catch (error) {
    console.error(error);
    process.exit(1);
}
