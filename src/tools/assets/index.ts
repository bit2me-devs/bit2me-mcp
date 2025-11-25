import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { walletTools, handleWalletTool } from "./wallet.js";
import { earnTools, handleEarnTool } from "./earn.js";
import { loanTools, handleLoanTool } from "./loan.js";
import { proTools, handleProTool } from "./pro.js";
import { accountTools, handleAccountTool } from "./account.js";

export const assetTools: Tool[] = [
    ...walletTools,
    ...earnTools,
    ...loanTools,
    ...proTools,
    ...accountTools
];

export async function handleAssetTool(name: string, args: any) {
    const walletResult = await handleWalletTool(name, args);
    if (walletResult) return walletResult;

    const earnResult = await handleEarnTool(name, args);
    if (earnResult) return earnResult;

    const loanResult = await handleLoanTool(name, args);
    if (loanResult) return loanResult;

    const proResult = await handleProTool(name, args);
    if (proResult) return proResult;

    const accountResult = await handleAccountTool(name, args);
    if (accountResult) return accountResult;

    throw new Error(`Unknown asset tool: ${name}`);
}
