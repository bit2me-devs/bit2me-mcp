export interface MarketTickerResponse {
    base_symbol: string;
    quote_symbol: string;
    date: string;
    price: string;
    market_cap: string;
    volume_24h: string;
    max_supply?: string | undefined;
    total_supply?: string | undefined;
}

export interface MarketAssetResponse {
    symbol: string;
    name: string;
    type: "crypto" | "fiat";
    network?: string;
    enabled: boolean;
    tradeable: boolean;
    loanable: boolean;
    pro_trading_pairs: string[];
}

export interface ProMarketConfigResponse {
    id: string;
    pair: string;
    base_precision: string;
    quote_precision: string;
    min_amount: string;
    max_amount: string;
    min_price: string;
    max_price: string;
    min_order_size: string;
    tick_size: string;
    fee_maker: string;
    fee_taker: string;
    status: "active" | "inactive";
}

export interface OrderBookEntry {
    price: string;
    amount: string;
}

export interface MarketOrderBookResponse {
    pair: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    date: string;
}

export interface ProTickerResponse {
    symbol: string;
    open: string;
    close: string;
    bid: string;
    ask: string;
    high: string;
    low: string;
    baseVolume: string;
    percentage: string;
    quoteVolume: string;
    date: string;
}

export interface PublicTradeResponse {
    id: string;
    pair: string;
    price: string;
    amount: string;
    side: "buy" | "sell";
    date: string;
}

export interface CandleResponse {
    date: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string | number;
}

export interface CurrencyRateResponse {
    base_symbol: string;
    price: string;
    quote_symbol: string;
    date: string;
}
