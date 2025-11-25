
export const prompts = [
    {
        name: "analyze_portfolio",
        description: "Analyze my current Bit2Me portfolio breakdown and total value in EUR.",
        arguments: []
    },
    {
        name: "market_summary",
        description: "Give me a market summary for BTC, ETH, and SOL in EUR.",
        arguments: []
    },
    {
        name: "check_earn_opportunities",
        description: "Check my wallet balances and suggest Earn strategies based on current APYs.",
        arguments: []
    }
];

export function handleGetPrompt(name: string) {
    if (name === "analyze_portfolio") {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "Please analyze my current portfolio. 1. Call get_portfolio_valuation with EUR. 2. Summarize the total value and the distribution of assets. 3. If there are any loans, mention the LTV."
                    }
                }
            ]
        };
    }
    if (name === "market_summary") {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "Please provide a market summary. 1. Get the ticker for BTC, ETH, and SOL in EUR. 2. Get the 24h volume and high/low for each. 3. Summarize the current market trend for these assets."
                    }
                }
            ]
        };
    }
    if (name === "check_earn_opportunities") {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "I want to optimize my holdings. 1. Get my wallet pockets to see what assets I have. 2. Get the current Earn APYs (get_earn_apy). 3. Suggest which of my assets could be moved to Earn for better returns."
                    }
                }
            ]
        };
    }
    throw new Error(`Prompt not found: ${name}`);
}
