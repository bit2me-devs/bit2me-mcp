import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ValidationError } from "../utils/errors.js";
import { getLivenessStatus, getReadinessStatus } from "../utils/health.js";
import { PACKAGE_VERSION } from "../package-version.js";
import { CATALOG_URI, catalogPayload } from "./catalog.js";

export const HEALTH_URI = "bit2me://health";
export const SERVER_URI = "bit2me://server";
export { CATALOG_URI };

/** Same identity as the stdio Server in `src/index.ts`. */
export const SERVER_NAME = "bit2me-mcp-server";
export const SERVER_VERSION = PACKAGE_VERSION;

export const RESOURCES: Resource[] = [
    {
        uri: HEALTH_URI,
        name: "health",
        description: "Local process liveness and readiness (no upstream Bit2Me calls)",
        mimeType: "application/json",
    },
    {
        uri: SERVER_URI,
        name: "server",
        description: "MCP server name and package version",
        mimeType: "application/json",
    },
    {
        uri: CATALOG_URI,
        name: "catalog",
        description: "Enabled tools (name, category, read_only). Honours BIT2ME_ENABLED_CATEGORIES. No Bit2Me I/O.",
        mimeType: "application/json",
    },
];

export function listResources(): { resources: Resource[] } {
    return { resources: RESOURCES };
}

function jsonContents(uri: string, payload: unknown) {
    return {
        contents: [
            {
                uri,
                mimeType: "application/json" as const,
                text: JSON.stringify(payload, null, 2),
            },
        ],
    };
}

/**
 * Read a resource. Health uses in-process probes only (no Bit2Me I/O).
 */
export function readResource(uri: string) {
    if (uri === HEALTH_URI) {
        return jsonContents(uri, {
            liveness: getLivenessStatus(),
            readiness: getReadinessStatus(),
        });
    }
    if (uri === SERVER_URI) {
        return jsonContents(uri, {
            name: SERVER_NAME,
            version: SERVER_VERSION,
        });
    }
    if (uri === CATALOG_URI) {
        return jsonContents(uri, catalogPayload());
    }
    throw new ValidationError(`Unknown resource: ${uri}`, "uri", uri);
}
