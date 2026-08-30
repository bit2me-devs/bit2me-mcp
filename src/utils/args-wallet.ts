import type { WriteToolArgs } from "./args-write.js";

export interface WalletGetPocketsArgs {
    pocket_id?: string;
    symbol?: string;
}

export interface WalletPocketAddressesArgs {
    pocket_id: string;
    network: string;
}

export interface WalletNetworksArgs {
    symbol: string;
}

export interface WalletCardsArgs {
    card_id?: string;
    limit?: number;
    offset?: number;
}

export interface WalletMovementsArgs {
    movement_id?: string;
    symbol?: string;
    limit?: number;
    offset?: number;
}

export interface WalletBuyCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletSellCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletSwapCryptoArgs {
    origin_pocket_id: string;
    destination_pocket_id: string;
    amount: string;
}

export interface WalletBuyCryptoWithCardArgs {
    card_id: string;
    destination_pocket_id: string;
    amount: string;
    currency: string;
}

export interface WalletConfirmOperationArgs {
    proforma_id: string;
    idempotency_key?: string;
}

export type { WriteToolArgs };
