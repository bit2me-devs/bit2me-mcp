import { ValidationError } from "../errors.js";
import { normalizeNetwork } from "../format.js";
import { asRecord, asString, firstDefined, isValidArray } from "./guards.js";
import type {
    WalletPocketResponse,
    WalletAddressResponse,
    WalletNetworkResponse,
    WalletCardResponse,
} from "../schemas.js";

export function mapWalletPocketsResponse(raw: unknown): WalletPocketResponse[] {
    if (!isValidArray(raw)) {
        throw new ValidationError("Invalid wallet pockets response structure");
    }

    return raw.map((item) => {
        const p = asRecord(item);
        const name = typeof p.name === "string" ? p.name : undefined;
        return {
            id: asString(p.id),
            symbol: asString(p.currency).toUpperCase(),
            balance: asString(p.balance),
            available: asString(p.available),
            blocked: asString(firstDefined(p, "blocked", "blockedBalance"), "0"),
            created_at: asString(firstDefined(p, "createdAt", "created_at")),
            ...(name ? { name } : {}),
        };
    });
}

export function mapWalletAddressesResponse(raw: unknown): WalletAddressResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const addr = asRecord(item);
        return {
            id: asString(addr.id),
            address: asString(addr.address),
            network: normalizeNetwork(asString(addr.network)) || "",
            symbol: asString(addr.currency) || undefined,
            tag: asString(addr.tag),
            created_at: asString(firstDefined(addr, "createdAt", "created_at")),
        };
    });
}

export function mapWalletNetworksResponse(raw: unknown): WalletNetworkResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const network = asRecord(item);
        return {
            id: normalizeNetwork(asString(network.id)) || "",
            name: asString(network.name),
            native_symbol: asString(network.nativeCurrencyCode),
            fee_symbol: asString(network.feeCurrencyCode),
            has_tag: Boolean(network.hasTag),
        };
    });
}

export function mapWalletCardsResponse(raw: unknown): WalletCardResponse[] {
    if (!isValidArray(raw)) {
        return [];
    }

    return raw.map((item) => {
        const card = asRecord(item);
        return {
            card_id: asString(firstDefined(card, "cardId", "card_id")),
            type: asString(card.type),
            brand: asString(card.brand),
            country: asString(card.country),
            last4: asString(card.last4),
            expire_month: asString(firstDefined(card, "expireMonth", "expire_month")),
            expire_year: asString(firstDefined(card, "expireYear", "expire_year")),
            alias: asString(card.alias),
            created_at: asString(firstDefined(card, "createdAt", "created_at")),
        };
    });
}
