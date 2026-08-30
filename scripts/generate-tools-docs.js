#!/usr/bin/env node
/**
 * Generates landing/tools-data.js and TOOLS_DOCUMENTATION.md from data/tools.json.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveVersion } from "./docs-gen/version.js";
import { generateLandingToolsData } from "./docs-gen/landing.js";
import { generateToolsDocumentation } from "./docs-gen/markdown.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function main() {
    console.log("🔄 Generating documentation artifacts...");

    const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
    const version = resolveVersion(packageJson.version);
    console.log(`📦 Using version: ${version}`);

    const metadata = JSON.parse(readFileSync(join(rootDir, "data", "tools.json"), "utf-8"));

    const landingPath = join(rootDir, "landing", "tools-data.js");
    writeFileSync(landingPath, generateLandingToolsData(metadata, version));
    console.log(`✅ Generated ${landingPath}`);

    const toolsDocsPath = join(rootDir, "TOOLS_DOCUMENTATION.md");
    writeFileSync(toolsDocsPath, generateToolsDocumentation(metadata));
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
