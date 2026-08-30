export interface WalletPocketResponse {
    id: string;
    symbol: string;
    balance: string;
    available: string;
    blocked: string;
    name?: string;
    created_at: string;
}

export interface WalletMovementResponse {
    id: string;
    created_at: string | undefined;
    type: string | undefined;
    subtype?: string | undefined;
    status: "pending" | "completed" | "failed";
    amount: string;
    symbol: string;
    origin?:
        | {
              amount: string;
              symbol: string;
              class: string;
          }
        | undefined;
    destination?:
        | {
              amount: string;
              symbol: string;
              class: string;
          }
        | undefined;
    fee?:
        | {
              amount: string;
              symbol: string;
              class: string;
          }
        | undefined;
}

export interface WalletAddressResponse {
    id: string;
    address: string;
    network: string;
    symbol?: string | undefined;
    tag: string;
    created_at: string;
}

export interface WalletNetworkResponse {
    id: string;
    name: string;
    native_symbol: string;
    fee_symbol: string;
    has_tag: boolean;
}

export interface WalletCardResponse {
    card_id: string;
    type: string;
    brand: string;
    country: string;
    last4: string;
    expire_month: string;
    expire_year: string;
    alias: string;
    created_at: string;
}

export interface WalletMovementDetailsResponse {
    id: string;
    created_at: string;
    type: "deposit" | "withdrawal" | "swap" | "purchase" | "transfer" | "fee" | "other";
    subtype?: string | undefined;
    status: "pending" | "completed" | "failed";
    amount: string;
    symbol: string;
    origin?:
        | {
              amount: string;
              symbol: string;
              class: string;
              rate_applied?: string | undefined;
          }
        | undefined;
    destination?:
        | {
              amount: string;
              symbol: string;
              class: string;
          }
        | undefined;
    fee?:
        | {
              amount: string;
              symbol: string;
              class: string;
          }
        | undefined;
}
