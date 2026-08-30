import { describe, expect, it, vi } from "vitest";
import { handleGeneralTool } from "../../src/tools/general.js";

vi.mock("../../src/config.js", () => ({
    getConfig: () => ({ INCLUDE_RAW_RESPONSE: false }),
}));

describe("general_describe_tool / general_health", () => {
    it("describes an enabled catalogue tool", async () => {
        const result = await handleGeneralTool("general_describe_tool", { tool_name: "wallet_get_pockets" });
        const parsed = JSON.parse(result.content[0].text) as {
            name: string;
            type: string;
            inputSchema: unknown;
        };
        expect(parsed.name).toBe("wallet_get_pockets");
        expect(parsed.type).toBe("READ");
        expect(parsed.inputSchema).toEqual(expect.any(Object));
    });

    it("requires tool_name", async () => {
        await expect(handleGeneralTool("general_describe_tool", {})).rejects.toThrow(/tool_name is required/);
    });

    it("rejects a name that is not in the catalogue", async () => {
        await expect(handleGeneralTool("general_describe_tool", { tool_name: "not_a_real_tool" })).rejects.toThrow(
            /Unknown tool: not_a_real_tool/
        );
    });

    it("returns local process health without calling Bit2Me", async () => {
        const result = await handleGeneralTool("general_health", {});
        const parsed = JSON.parse(result.content[0].text) as {
            status: string;
            version: string;
            runtime: { circuit_breaker: { lastFailureTime: number | null; timeSinceLastFailure: number | null } };
        };
        expect(parsed.status).toMatch(/^(ok|degraded)$/);
        expect(parsed.version.length).toBeGreaterThan(0);
        expect(parsed.runtime.circuit_breaker.lastFailureTime).toBeNull();
        expect(parsed.runtime.circuit_breaker.timeSinceLastFailure).toBeNull();
    });
});
