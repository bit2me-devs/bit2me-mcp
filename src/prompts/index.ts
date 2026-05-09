/**
 * MCP prompt catalog.
 *
 * Each prompt is a small, deterministic instruction template. Some accept
 * arguments (e.g. `tax_report` takes a year and a fiat currency); the
 * `handleGetPrompt` function performs explicit interpolation so the LLM
 * receives a fully resolved prompt with no remaining placeholders.
 */

export interface PromptArgument {
    name: string;
    description: string;
    required: boolean;
}

export interface PromptDefinition {
    name: string;
    description: string;
    arguments: PromptArgument[];
}

export const prompts: PromptDefinition[] = [
    {
        name: "analyze_portfolio",
        description: "Analyze the current Bit2Me portfolio breakdown and total value.",
        arguments: [
            {
                name: "fiat",
                description: "Fiat currency to value the portfolio in (default: EUR).",
                required: false,
            },
        ],
    },
    {
        name: "market_summary",
        description: "Provide a market summary for one or more crypto assets.",
        arguments: [
            {
                name: "symbols",
                description: "Comma-separated list of base symbols (default: BTC,ETH,SOL).",
                required: false,
            },
            {
                name: "fiat",
                description: "Fiat quote currency (default: EUR).",
                required: false,
            },
        ],
    },
    {
        name: "check_earn_opportunities",
        description: "Check wallet balances and suggest Earn strategies based on current APYs.",
        arguments: [],
    },
    {
        name: "tax_report",
        description: "Build a tax-oriented summary of trades, deposits and withdrawals for a given year.",
        arguments: [
            {
                name: "year",
                description: "Calendar year (YYYY) to report on.",
                required: true,
            },
            {
                name: "fiat",
                description: "Reporting fiat currency (default: EUR).",
                required: false,
            },
        ],
    },
    {
        name: "dca_plan",
        description: "Design a Dollar-Cost-Average plan for a target asset over a budget and horizon.",
        arguments: [
            {
                name: "asset",
                description: "Target asset symbol (e.g. BTC).",
                required: true,
            },
            {
                name: "budget",
                description: "Total budget to spread, e.g. \"3000 EUR\".",
                required: true,
            },
            {
                name: "horizon_weeks",
                description: "Number of weeks to spread the budget over (default: 12).",
                required: false,
            },
        ],
    },
    {
        name: "loan_health_check",
        description: "Audit current Bit2Me loans, compute LTV margins and flag any liquidation risk.",
        arguments: [],
    },
];

function arg(args: Record<string, string> | undefined, key: string, fallback: string): string {
    const v = args?.[key];
    return v && v.trim() ? v : fallback;
}

export function handleGetPrompt(name: string, args?: Record<string, string>): {
    messages: Array<{ role: "user"; content: { type: "text"; text: string } }>;
} {
    let text: string;

    switch (name) {
        case "analyze_portfolio": {
            const fiat = arg(args, "fiat", "EUR");
            text = [
                `Please analyze the current portfolio in ${fiat}.`,
                `1. Call portfolio_get_valuation with ${fiat}.`,
                `2. Summarize total value and asset distribution.`,
                `3. If there are loans, mention LTV and liquidation buffer.`,
            ].join(" ");
            break;
        }
        case "market_summary": {
            const symbols = arg(args, "symbols", "BTC,ETH,SOL");
            const fiat = arg(args, "fiat", "EUR");
            text = [
                `Please provide a market summary for: ${symbols} priced in ${fiat}.`,
                `1. Get the ticker for each pair.`,
                `2. Get 24h volume, high and low for each.`,
                `3. Summarize the current market trend.`,
            ].join(" ");
            break;
        }
        case "check_earn_opportunities":
            text =
                "I want to optimize my holdings. 1. Get my wallet pockets to see what assets I have. 2. Get the current Earn APYs. 3. Suggest which of my assets could be moved to Earn for better returns, including risk caveats.";
            break;
        case "tax_report": {
            const year = arg(args, "year", String(new Date().getFullYear() - 1));
            const fiat = arg(args, "fiat", "EUR");
            text = [
                `Build a tax-oriented summary for the calendar year ${year}, valued in ${fiat}.`,
                `1. List every trade (broker + pro) executed during ${year}.`,
                `2. List every deposit, withdrawal and transfer during ${year}.`,
                `3. For each disposal, compute the realised P&L in ${fiat} when possible.`,
                `4. Output a single table grouped by asset, plus an overall total.`,
                `Disclaimer: this is not legal/tax advice; the user must validate with a qualified accountant.`,
            ].join(" ");
            break;
        }
        case "dca_plan": {
            const asset = arg(args, "asset", "BTC");
            const budget = arg(args, "budget", "1000 EUR");
            const horizon = arg(args, "horizon_weeks", "12");
            text = [
                `Design a Dollar-Cost-Average plan to acquire ${asset} with a total budget of ${budget} over ${horizon} weeks.`,
                `1. Inspect the current ticker for ${asset}.`,
                `2. Compute the per-week budget allocation.`,
                `3. Suggest order types, time-of-week, and any volatility-driven adjustments.`,
                `4. Highlight fees, slippage and any minimum-order constraints.`,
            ].join(" ");
            break;
        }
        case "loan_health_check":
            text = [
                "Audit my Bit2Me loans.",
                "1. List all active loans (loan_get_orders).",
                "2. For each loan, compute the current LTV using the latest market price for the collateral.",
                "3. Highlight any loan within 10% of its liquidation threshold.",
                "4. Suggest concrete actions: top-up collateral, partial repayment, or refinance.",
            ].join(" ");
            break;
        default:
            throw new Error(`Prompt not found: ${name}`);
    }

    return {
        messages: [{ role: "user", content: { type: "text", text } }],
    };
}
