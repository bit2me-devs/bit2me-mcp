const JWT_PARAMETER = {
    type: "string",
    description: "Optional session token for authentication. API keys are recommended for most use cases.",
};

/**
 * Convert inputSchema to simplified args for landing.
 * Excludes `_internal` properties. Injects jwt only when the tool requires auth.
 */
export function convertInputSchemaToArgs(inputSchema, requiresAuth = false) {
    const args = {};

    if (inputSchema.properties) {
        const requiredFields = inputSchema.required || [];
        for (const [key, value] of Object.entries(inputSchema.properties)) {
            if (value._internal === true) {
                continue;
            }
            args[key] = {
                type: value.type || "string",
                desc: value.description || "",
                required: requiredFields.includes(key),
            };
            if (value.enum) args[key].enum = value.enum;
            if (value.examples) args[key].examples = value.examples;
            if (value.default !== undefined) args[key].default = value.default;
        }
    }

    if (requiresAuth) {
        args.jwt = {
            type: JWT_PARAMETER.type,
            desc: JWT_PARAMETER.description,
            required: false,
        };
    }

    return args;
}

export function generateLandingToolsData(metadata, version) {
    const categories = metadata.categories.map((cat) => ({
        category: cat.name,
        id: `cat-${cat.id}`,
        icon: cat.icon,
        description: cat.description || "",
        tools: cat.tools.map((tool) => {
            const requiresAuth = tool.attributes?.requires_auth || false;
            return {
                name: tool.name,
                type: tool.type,
                desc: tool.description,
                args: convertInputSchemaToArgs(tool.inputSchema, requiresAuth),
                exampleArgs: tool.exampleArgs,
                response: tool.exampleResponse,
                responseSchema: tool.responseSchema,
                attributes: tool.attributes || { requires_auth: false },
            };
        }),
    }));

    return `// Auto-generated from data/tools.json
// Do not edit manually - run: pnpm run build:docs

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
