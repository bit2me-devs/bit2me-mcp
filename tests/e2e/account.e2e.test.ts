import { it, expect } from "vitest";
import { describeE2E, E2E_TIMEOUT } from "./setup.js";
import { handleAccountTool } from "../../src/tools/account.js";

describeE2E("E2E: Account Tools", () => {
    it(
        "should get account information",
        async () => {
            const result = await handleAccountTool("account_get_info", {});
            const account = JSON.parse(result.content[0].text);

            expect(typeof account).toBe("object");
            expect(account).toHaveProperty("id");
            // Account structure may vary based on verification level
        },
        E2E_TIMEOUT
    );
});
