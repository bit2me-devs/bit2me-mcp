import type { WriteToolArgs } from "./args-write.js";

export interface ProTradesArgs {
    pair?: string;
    side?: "buy" | "sell";
    order_type?: "limit" | "stop-limit" | "market";
    limit?: number;
    offset?: number;
    sort?: "ASC" | "DESC";
    start_date?: string;
    end_date?: string;
}

export interface ProOrderTradesArgs {
    order_id: string;
}

export interface ProOpenOrdersArgs {
    order_id?: string;
    pair?: string;
}

export interface ProCreateOrderArgs extends WriteToolArgs {
    pair: string;
    side: "buy" | "sell";
    type: "limit" | "market" | "stop-limit";
    amount: string;
    price?: string;
    stop_price?: string;
}

export interface ProCancelOrderArgs extends WriteToolArgs {
    order_id: string;
}

export interface ProCancelAllOrdersArgs extends WriteToolArgs {
    pair?: string;
}

export interface ProDepositArgs extends WriteToolArgs {
    symbol: string;
    amount: string;
}

export interface ProWithdrawArgs extends WriteToolArgs {
    symbol: string;
    amount: string;
    to_pocket_id?: string;
}

export interface ProMarketConfigArgs {
    pair?: string;
}

export interface ProOrderBookArgs {
    pair: string;
}

export interface ProPublicTradesArgs {
    pair: string;
    limit?: number;
    sort?: "ASC" | "DESC";
}

export interface ProCandlesArgs {
    pair: string;
    timeframe: string;
    limit?: number;
    startTime?: number;
    endTime?: number;
}

export interface ProTickerArgs {
    pair?: string;
}
