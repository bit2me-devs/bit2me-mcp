import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import { mapAccountInfoResponse } from "../utils/response-mappers.js";

export const accountTools: Tool[] = [
    {
        name: "account_get_info",
        description:
            "Retrieves detailed profile information for the authenticated user. Returns user level, account limits, KYC status, and other account-related metadata. Use this to verify user identity and permissions.",
        inputSchema: { type: "object", properties: {} },
    },
];

export async function handleAccountTool(name: string, _args: unknown) {
    if (name === "account_get_info") {
        const data = await bit2meRequest("GET", "/v1/account");
        const optimized = mapAccountInfoResponse(data);
        return { content: [{ type: "text", text: JSON.stringify(optimized, null, 2) }] };
    }

    throw new Error(`Unknown account tool: ${name}`);
}
