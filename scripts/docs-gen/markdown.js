import { ENDPOINT_MAPPINGS } from "./endpoints.js";

function formatSchemaProperty(key, prop, required, indent = "") {
    if (prop._internal === true) {
        return "";
    }

    let typeStr = prop.type || "any";
    if (prop.format) typeStr += ` (${prop.format})`;

    const requiredStr = required ? " **(required)**" : "";
    const description = prop.description || "";

    let line = `${indent}- **\`${key}\`** (${typeStr})${requiredStr}: ${description}`;

    if (prop.enum && prop.enum.length > 0) {
        line += `\n${indent}    - Possible values: ${prop.enum.map((v) => `\`"${v}"\``).join(", ")}`;
    }

    if (prop.nullable) {
        line += `\n${indent}    - Can be \`null\``;
    }

    if (prop.type === "array" && prop.items) {
        if (prop.items.type === "object" && prop.items.properties) {
            line += `\n${indent}    - Array items:`;
            const itemRequired = prop.items.required || [];
            for (const [itemKey, itemProp] of Object.entries(prop.items.properties)) {
                line += "\n" + formatSchemaProperty(itemKey, itemProp, itemRequired.includes(itemKey), indent + "        ");
            }
        } else {
            line += `\n${indent}    - Array items: ${prop.items.type || "any"}`;
        }
    }

    if (prop.type === "object" && prop.properties) {
        const nestedRequired = prop.required || [];
        for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
            line += "\n" + formatSchemaProperty(nestedKey, nestedProp, nestedRequired.includes(nestedKey), indent + "    ");
        }
    }

    return line;
}

function generateToolResponseDocs(tool) {
    let doc = `> ${tool.description}\n\n`;

    if (tool.responseSchema && tool.responseSchema.properties) {
        doc += "#### Response Fields\n\n";
        const required = tool.responseSchema.required || [];
        for (const [key, prop] of Object.entries(tool.responseSchema.properties)) {
            doc += formatSchemaProperty(key, prop, required.includes(key)) + "\n";
        }
        doc += "\n";
    }

    if (tool.exampleResponse) {
        doc += "#### Example Response\n\n";
        doc += "```json\n";
        doc += JSON.stringify(tool.exampleResponse, null, 4);
        doc += "\n```\n\n";
    }

    const endpoint = ENDPOINT_MAPPINGS[tool.name] || "N/A";
    doc += `**Bit2Me API:** \`${endpoint.replace(/\n/g, "` | `")}\`\n`;
    return doc;
}

export function generateToolsDocumentation(metadata) {
    let doc = "# Tool Response Schemas\n\n";
    doc += "This document shows the exact JSON structure returned by each Bit2Me MCP tool, including detailed descriptions of each field and their possible values.\n\n";

    const counts = metadata.categories.map((cat) => `- ${cat.tools.length} ${cat.name} Tools`);
    const total = metadata.categories.reduce((sum, cat) => sum + cat.tools.length, 0);

    doc += `## Tool Count (${total} total)\n\n`;
    doc += counts.join("\n") + "\n\n";
    doc += "_Note: Write operation tools are included in their respective categories._\n\n";
    doc += "---\n\n";

    for (const category of metadata.categories) {
        doc += `## ${category.name} (${category.tools.length} tools)\n\n`;
        if (category.description) {
            doc += `> **Note:** ${category.description}\n\n`;
        }
        for (const tool of category.tools) {
            doc += `### ${tool.name}\n\n`;
            doc += generateToolResponseDocs(tool);
            doc += "\n";
        }
        doc += "---\n\n";
    }

    doc += "## Additional Resources\n\n";
    doc += "- **Source of truth**: [`data/tools.json`](./data/tools.json) contains all tool definitions, input schemas, response schemas and examples.\n";
    doc += "- **Landing page**: The [landing site](./landing/index.html) is auto-generated from the same source.\n";
    doc += "- **Regenerate docs**: Run `pnpm run build:docs` after modifying `data/tools.json`.\n\n";
    doc += `---\n\n_Auto-generated on ${new Date().toISOString().split("T")[0]}._\n`;

    return doc;
}
