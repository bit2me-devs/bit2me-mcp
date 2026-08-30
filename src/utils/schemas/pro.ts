export interface ProBalanceResponse {
    symbol: string;
    balance: string;
    blocked: string;
    available: string;
}

export interface ProOrderResponse {
    id: string;
    pair: string;
    side: "buy" | "sell";
    type: "limit" | "market" | "stop-limit";
    status: "open" | "filled" | "cancelled";
    price?: string | undefined;
    amount: string;
    filled: string;
    remaining: string;
    created_at: string;
}

export interface ProTradeResponse {
    id: string;
    order_id: string;
    pair: string;
    side: "buy" | "sell";
    order_type: "limit" | "market" | "stop-limit";
    price: string;
    amount: string;
    cost: string;
    fee: string;
    fee_symbol: string;
    is_maker: boolean;
    date: string;
}

export interface ProOpenOrdersResponse {
    orders: ProOrderResponse[];
}

export interface ProTradesResponse {
    count: number;
    trades: ProTradeResponse[];
}

export interface ProOrderTradesResponse {
    order_id: string;
    trades: ProTradeResponse[];
}

// ============================================================================
// OPERATION TOOL RESPONSES (Extended)
// ============================================================================

export interface ProCancelOrderResponse {
    id: string;
    status: string;
    message: string;
}

export interface ProCancelAllOrdersResponse {
    cancelled: number;
    message: string;
}

export interface ProDepositResponse {
    id: string;
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}

export interface ProWithdrawResponse {
    id: string;
    symbol: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    message: string;
}
