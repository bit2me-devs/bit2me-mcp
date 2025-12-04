#!/usr/bin/env node
/**
 * Script to generate documentation artifacts from centralized tools metadata
 * Generates:
 * - landing/tools-data.js (for landing page)
 * - docs/SCHEMA_MAPPING.md (response schemas documentation)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Convert inputSchema to simplified args format for landing
 */
function convertInputSchemaToArgs(inputSchema) {
    if (!inputSchema.properties) {
        return {};
    }

    const requiredFields = inputSchema.required || [];
    const args = {};
    for (const [key, value] of Object.entries(inputSchema.properties)) {
        args[key] = {
            type: value.type || 'string',
            desc: value.description || '',
            required: requiredFields.includes(key)
        };
        if (value.enum) args[key].enum = value.enum;
        if (value.examples) args[key].examples = value.examples;
        if (value.default !== undefined) args[key].default = value.default;
    }
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
            // For "market" category (Wallet Market Data), add wallet_ prefix to display name
            const displayName = cat.id === 'market' && tool.name.startsWith('market_')
                ? `wallet_${tool.name}`
                : tool.name;
            
            const toolData = {
                name: tool.name, // Keep original name for API compatibility
                type: tool.type,
                desc: tool.description,
                args: convertInputSchemaToArgs(tool.inputSchema),
                exampleArgs: tool.exampleArgs,
                response: tool.exampleResponse,
                responseSchema: tool.responseSchema // Include response schema for field descriptions
            };
            
            // Only add displayName if it's different from name
            if (displayName !== tool.name) {
                toolData.displayName = displayName;
            }
            
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
 * Generate response schema documentation
 */
function generateResponseSchemaDocs(responseSchema, indent = 0) {
    if (!responseSchema) {
        return '';
    }

    let content = '';
    const prefix = '  '.repeat(indent);

    if (responseSchema.type === 'object' && responseSchema.properties) {
        for (const [fieldName, fieldSchema] of Object.entries(responseSchema.properties)) {
            const isRequired = responseSchema.required?.includes(fieldName);
            const requiredMark = isRequired ? ' **(required)**' : '';
            
            content += `${prefix}- **\`${fieldName}\`** (${fieldSchema.type || 'unknown'})${requiredMark}`;
            
            if (fieldSchema.description) {
                content += `: ${fieldSchema.description}`;
            }
            
            if (fieldSchema.enum) {
                content += `\n${prefix}  - Possible values: ${fieldSchema.enum.map(v => `\`"${v}"\``).join(', ')}`;
            }
            
            if (fieldSchema.nullable) {
                content += `\n${prefix}  - Can be \`null\``;
            }
            
            if (fieldSchema.format) {
                content += `\n${prefix}  - Format: \`${fieldSchema.format}\``;
            }
            
            if (fieldSchema.example !== undefined) {
                content += `\n${prefix}  - Example: \`${JSON.stringify(fieldSchema.example)}\``;
            }
            
            // Handle nested objects
            if (fieldSchema.type === 'object' && fieldSchema.properties) {
                content += '\n' + generateResponseSchemaDocs(fieldSchema, indent + 1);
            }
            
            // Handle arrays
            if (fieldSchema.type === 'array' && fieldSchema.items) {
                content += `\n${prefix}  - Array items:`;
                if (fieldSchema.items.type === 'object' && fieldSchema.items.properties) {
                    content += '\n' + generateResponseSchemaDocs(fieldSchema.items, indent + 2);
                } else {
                    content += ` ${fieldSchema.items.type || 'unknown'}`;
                    if (fieldSchema.items.enum) {
                        content += ` (values: ${fieldSchema.items.enum.map(v => `\`"${v}"\``).join(', ')})`;
                    }
                }
            }
            
            content += `\n`;
        }
    } else if (responseSchema.type === 'array' && responseSchema.items) {
        content += `${prefix}- Array of ${responseSchema.items.type || 'objects'}\n`;
        if (responseSchema.items.type === 'object' && responseSchema.items.properties) {
            content += generateResponseSchemaDocs(responseSchema.items, indent + 1);
        }
    }

    return content;
}

/**
 * Generate SCHEMA_MAPPING.md
 */
function generateSchemaMapping(metadata) {
    let content = `# Tool Response Schemas

Este documento muestra la estructura JSON exacta que devuelve cada tool del MCP Bit2Me, incluyendo descripciones detalladas de cada campo y sus posibles valores.

## Tool Count (${metadata.categories.reduce((sum, cat) => sum + cat.tools.length, 0)} total)

`;

    // Count tools per category
    for (const cat of metadata.categories) {
        content += `- ${cat.tools.length} ${cat.name} Tools\n`;
    }

    content += `\n_Nota: Las herramientas de operaciones (write actions) están incluidas en sus respectivas categorías._\n\n---\n\n`;

    // Generate sections for each category
    for (const cat of metadata.categories) {
        const categoryTitle = cat.name;
        content += `## ${categoryTitle} Tools (${cat.tools.length} tools)\n\n`;
        
        if (cat.description) {
            content += `> **Note:** ${cat.description}\n\n`;
        }

        for (const tool of cat.tools) {
            content += `### ${tool.name}\n\n`;
            
            // Add response schema documentation if available
            if (tool.responseSchema) {
                content += `#### Response Fields\n\n`;
                const schemaDocs = generateResponseSchemaDocs(tool.responseSchema);
                if (schemaDocs) {
                    content += schemaDocs + '\n';
                } else {
                    content += `_Schema definition available but no properties documented._\n\n`;
                }
            }
            
            // Add example response
            if (tool.exampleResponse) {
                content += `#### Example Response\n\n`;
                content += `\`\`\`json\n${JSON.stringify(tool.exampleResponse, null, 4)}\n\`\`\`\n\n`;
            } else {
                content += `_No example response available._\n\n`;
            }
        }

        content += `---\n\n`;
    }

    return content;
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

    // Generate SCHEMA_MAPPING.md
    const schemaMapping = generateSchemaMapping(metadata);
    const schemaPath = join(rootDir, 'docs', 'SCHEMA_MAPPING.md');
    writeFileSync(schemaPath, schemaMapping);
    console.log(`✅ Generated ${schemaPath}`);

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

