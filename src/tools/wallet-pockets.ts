import { bit2meRequest } from "../services/bit2me.js";
import { cachedGet } from "../services/cached-request.js";
import { CacheCategory } from "../utils/cache.js";
import { normalizeSymbol, validateUUID, validateSymbol } from "../utils/format.js";
import { ValidationError } from "../utils/errors.js";
import {
    mapWalletPocketsResponse,
    mapWalletAddressesResponse,
    mapWalletNetworksResponse,
} from "../utils/response-mappers.js";
import { buildFilteredContextualResponse } from "../utils/contextual-response.js";
import { WalletPocketAddressesArgs, WalletNetworksArgs } from "../utils/args.js";

export async function handleWalletGetPockets(args: Record<string, unknown>) {
    const params = args as unknown as { symbol?: string; pocket_id?: string };
    const requestContext: Record<string, unknown> = {};

    // If pocket_id is provided, filter to that specific pocket
    if (params.pocket_id) {
        validateUUID(params.pocket_id, "pocket_id");
        requestContext.pocket_id = params.pocket_id;
    }

    if (params.symbol) {
        validateSymbol(params.symbol);
    }

    const data = await bit2meRequest("GET", "/v1/wallet/pocket", {});
    let optimized = mapWalletPocketsResponse(data);

    // Filter by pocket_id if provided
    if (params.pocket_id) {
        optimized = optimized.filter((p) => p.id === params.pocket_id);
    }

    // Filter by symbol if provided
    if (params.symbol) {
        const symbol = normalizeSymbol(params.symbol);
        requestContext.symbol = symbol;
        optimized = optimized.filter((p) => p.symbol === symbol);
    }

    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleWalletGetPocketAddresses(args: Record<string, unknown>) {
    const params = args as unknown as WalletPocketAddressesArgs;
    if (!params.pocket_id) {
        throw new ValidationError("pocket_id is required", "pocket_id");
    }
    if (!params.network) {
        throw new ValidationError("network is required", "network");
    }
    validateUUID(params.pocket_id, "pocket_id");
    // Validate network format: lowercase, no spaces, alphanumeric with underscores/hyphens
    const networkPattern = /^[a-z][a-z0-9_-]*$/;
    const normalizedNetwork = params.network.toLowerCase().trim();
    if (!networkPattern.test(normalizedNetwork)) {
        throw new ValidationError(
            `Invalid network format: "${params.network}". Network should be lowercase (e.g., bitcoin, ethereum, binance_smart_chain). Use wallet_get_networks to see available networks.`,
            "network",
            params.network
        );
    }
    const { pocket_id } = params;
    const network = normalizedNetwork;
    const requestContext = {
        pocket_id,
        network,
    };
    const data = await bit2meRequest(
        "GET",
        `/v2/wallet/pocket/${encodeURIComponent(pocket_id)}/${encodeURIComponent(network)}/address`
    );
    const optimized = mapWalletAddressesResponse(data);
    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}

export async function handleWalletGetNetworks(args: Record<string, unknown>) {
    const params = args as unknown as WalletNetworksArgs;
    if (!params.symbol) {
        throw new ValidationError(
            'symbol is required. Pass the asset symbol you want to inspect (e.g. "BTC", "USDT"). Use general_get_assets_config to list every supported symbol.',
            "symbol"
        );
    }
    validateSymbol(params.symbol);
    const symbol = normalizeSymbol(params.symbol);
    const requestContext = {
        symbol,
    };
    // Network metadata is static catalog data; cache for 1 hour (STATIC).
    const data = await cachedGet(
        `/v1/wallet/currency/${encodeURIComponent(symbol)}/network`,
        undefined,
        CacheCategory.STATIC
    );
    const optimized = mapWalletNetworksResponse(data);
    const contextual = buildFilteredContextualResponse(
        requestContext,
        optimized,
        {
            total_records: optimized.length,
        },
        data
    );
    return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
}
