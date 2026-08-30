export interface MarketTickerArgs {
    base_symbol: string;
    quote_symbol?: string;
}

export interface MarketChartArgs {
    pair: string;
    timeframe: string;
}

export interface MarketAssetsDetailsArgs {
    symbol?: string;
    include_testnet?: boolean;
    show_exchange?: boolean;
}

export interface MarketCurrencyRateArgs {
    base_symbol?: string;
    quote_symbol?: string;
    date?: string;
}

export interface PortfolioValuationArgs {
    quote_symbol?: string;
    /** Catalogue alias of `quote_symbol` (kept so existing clients still work). */
    fiat_symbol?: string;
    /** Bypass the portfolio cache after a deposit/withdraw. */
    force_refresh?: boolean;
}
