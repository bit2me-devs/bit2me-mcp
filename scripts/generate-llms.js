import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCE_FILES = [
    { path: 'README.md', title: 'README / Documentation' },
    { path: 'agents.md', title: 'Agent Rules & Conventions' },
    { path: 'CHANGELOG.md', title: 'Changelog' }
];
const OUTPUT_DIR = 'landing';
const FULL_OUTPUT_FILE = 'llms-full.txt';
const LIGHT_OUTPUT_FILE = 'llms.txt';

function cleanMarkdown(content) {
    // 1. Remove HTML comments
    // Use a robust regex that handles multiline comments
    let text = content.replace(/<!--[\s\S]*?-->/g, '');
    
    // 2. Remove badges (images that are links)
    // Pattern: [![Alt](image_url)](link_url)
    text = text.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '');
    
    // 3. Remove standalone badges (images at start of line)
    // Pattern: [![Alt](image_url)]
    text = text.replace(/^\[!\[[^\]]*\]\([^)]*\)\]\s*$/gm, '');

    // 4. Normalize whitespace
    // Replace 3+ newlines with 2 newlines
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
}

function generate() {
    console.log('🤖 Generating LLM documentation...');

    // Ensure output dir exists
    const outputDirPath = path.join(__dirname, '..', OUTPUT_DIR);
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
    }

    let fullContent = `# Bit2Me MCP Server - Technical Documentation\n\n`;
    fullContent += `> Generated on ${new Date().toISOString()}\n\n`;

    // 1. Generate llms-full.txt
    for (const file of SOURCE_FILES) {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
            console.log(`   Reading ${file.path}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            const cleaned = cleanMarkdown(content);
            
            fullContent += `\n${'='.repeat(50)}\n`;
            fullContent += `FILE: ${file.path} (${file.title})\n`;
            fullContent += `${'='.repeat(50)}\n\n`;
            fullContent += cleaned + '\n\n';
        } else {
            console.warn(`   ⚠️ Warning: ${file.path} not found.`);
        }
    }

    const fullOutputPath = path.join(outputDirPath, FULL_OUTPUT_FILE);
    fs.writeFileSync(fullOutputPath, fullContent);
    console.log(`✅ Generated ${fullOutputPath}`);

    // 2. Generate llms.txt (Lightweight)
    const lightContent = `# Bit2Me MCP Server

> Official Model Context Protocol (MCP) server to interact with Bit2Me Pro API, Trading, and Wallet services via AI agents.

## Documentation
- [Full Documentation & Installation](llms-full.txt)
- [GitHub Repository](https://github.com/bit2me-devs/bit2me-mcp)

## Key Features
- **Market Data**: Real-time prices, order books, public trades.
- **Wallet**: Manage pockets, check balances, transactions.
- **Trading**: Spot trading execution (Buy/Sell), order management.
- **Earn**: Staking strategies and rewards.
- **Loans**: Crypto-backed loans management.

## Quick Start
This server requires a Bit2Me API Key.
See 'llms-full.txt' for detailed configuration and tool schemas.
`;

    const lightOutputPath = path.join(outputDirPath, LIGHT_OUTPUT_FILE);
    fs.writeFileSync(lightOutputPath, lightContent);
    console.log(`✅ Generated ${lightOutputPath}`);
}

generate();
