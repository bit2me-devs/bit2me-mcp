/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { bit2meRequest } from "../services/bit2me.js";
import { MAX_PAGINATION_LIMIT } from "../constants.js";
import {
    normalizeSymbol,
    validatePaginationLimit,
    validatePaginationOffset,
    validateUUID,
    validateSymbol,
} from "../utils/format.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import {
    mapWalletPocketsResponse,
    mapWalletPocketDetailsResponse,
    mapWalletAddressesResponse,
    mapWalletMovementsResponse,
    mapWalletMovementDetailsResponse,
    mapWalletNetworksResponse,
    mapWalletCardsResponse,
    mapProformaResponse,
    mapOperationConfirmationResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import {
    WalletPocketDetailsArgs,
    WalletPocketAddressesArgs,
    WalletNetworksArgs,
    WalletCardsArgs,
    WalletMovementsArgs,
    WalletMovementDetailsArgs,
    WalletBuyCryptoArgs,
    WalletSellCryptoArgs,
    WalletSwapCryptoArgs,
    WalletBuyCryptoWithCardArgs,
    WalletConfirmOperationArgs,
} from "../utils/args.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";

export const walletTools: Tool[] = getCategoryTools("wallet");

/**
 * Handles wallet-related tool requests
 * @param name - Name of the tool to execute
 * @param args - Tool arguments
 * @returns Tool response with optimized data
 * @throws ValidationError if required parameters are missing or invalid
 * @throws NotFoundError if requested resource is not found
 */
export async function handleWalletTool(name: string, args: any) {
    return executeTool(name, args, async () => {
        if (name === "wallet_get_pockets") {
            const params = args as { symbol?: string };
            const data = await bit2meRequest("GET", "/v1/wallet/pocket", {});
            let optimized = mapWalletPocketsResponse(data);

            const requestContext: any = {};
            if (params.symbol) {
                const symbol = normalizeSymbol(params.symbol);
                requestContext.symbol = symbol;
                optimized = optimized.filter((p: any) => p.symbol === symbol);
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

        if (name === "wallet_get_pocket_details") {
            const params = args as WalletPocketDetailsArgs;
            if (!params.pocket_id) {
                throw new ValidationError("pocket_id is required", "pocket_id");
            }
            validateUUID(params.pocket_id, "pocket_id");
            const requestContext = {
                pocket_id: params.pocket_id,
            };
            const data = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.pocket_id });
            const pocket = Array.isArray(data) ? data[0] : data;

            if (!pocket) {
                throw new NotFoundError("/v1/wallet/pocket", `Pocket ${params.pocket_id}`);
            }

            const optimized = mapWalletPocketDetailsResponse(pocket);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, pocket);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_get_pocket_addresses") {
            const params = args as WalletPocketAddressesArgs;
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

        if (name === "wallet_get_networks") {
            const params = args as WalletNetworksArgs;
            if (!params.symbol) {
                throw new ValidationError("symbol is required", "symbol");
            }
            validateSymbol(params.symbol);
            const symbol = normalizeSymbol(params.symbol);
            const requestContext = {
                symbol,
            };
            const data = await bit2meRequest("GET", `/v1/wallet/currency/${encodeURIComponent(symbol)}/network`);
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

        if (name === "wallet_get_cards") {
            const params = args as WalletCardsArgs;
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: Record<string, any> = {};
            if (params.card_id) {
                validateUUID(params.card_id, "card_id");
                queryParams.id = params.card_id;
            }
            queryParams.limit = limit;
            queryParams.offset = offset;

            const data = await bit2meRequest("GET", "/v1/teller/card", queryParams);
            const optimized = mapWalletCardsResponse(data);

            // Extract total from response if available, otherwise use array length
            const rawData = data as any;
            const totalRecords = rawData.total || rawData.metadata?.total || optimized.length;

            const requestContext: any = {
                limit,
                offset,
            };
            if (params.card_id) {
                requestContext.card_id = params.card_id;
            }

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: totalRecords,
                    limit,
                    offset,
                    has_more: offset + limit < totalRecords,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_get_movements") {
            const params = args as WalletMovementsArgs;
            const limit = validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);
            const offset = validatePaginationOffset(params.offset);

            const queryParams: any = {};
            if (params.symbol) queryParams.currency = normalizeSymbol(params.symbol);
            queryParams.limit = limit;
            queryParams.offset = offset;

            const data = await bit2meRequest("GET", "/v2/wallet/transaction", queryParams);

            // v2 endpoint returns { data: [...], total: number } according to docs
            const rawData = data as any;
            const movementsArray = rawData.data || rawData.transactions || [];

            const optimized = mapWalletMovementsResponse(movementsArray);

            // Extract total from root 'total' or metadata
            const totalRecords =
                rawData.total || rawData.metadata?.total || rawData.metadata?.total_records || optimized.length;

            const requestContext: any = {
                limit,
                offset,
            };
            if (params.symbol) {
                requestContext.symbol = normalizeSymbol(params.symbol);
            }

            const contextual = buildPaginatedContextualResponse(
                requestContext,
                optimized,
                {
                    total_records: totalRecords,
                    limit,
                    offset,
                    has_more: offset + limit < totalRecords,
                },
                data
            );
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_get_movement_details") {
            const params = args as WalletMovementDetailsArgs;
            if (!params.movement_id) {
                throw new ValidationError("movement_id is required", "movement_id");
            }
            validateUUID(params.movement_id, "movement_id");
            const requestContext = {
                movement_id: params.movement_id,
            };
            const data = await bit2meRequest("GET", `/v1/wallet/transaction/${encodeURIComponent(params.movement_id)}`);
            const optimized = mapWalletMovementDetailsResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_buy_crypto") {
            const params = args as WalletBuyCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "buy",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_sell_crypto") {
            const params = args as WalletSellCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "sell",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_swap_crypto") {
            const params = args as WalletSwapCryptoArgs;
            if (!params.origin_pocket_id) {
                throw new ValidationError("origin_pocket_id is required", "origin_pocket_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            validateUUID(params.origin_pocket_id, "origin_pocket_id");
            validateUUID(params.destination_pocket_id, "destination_pocket_id");

            // Fetch origin pocket to get currency
            const originPocketData = await bit2meRequest("GET", "/v1/wallet/pocket", { id: params.origin_pocket_id });
            const originPocket = Array.isArray(originPocketData) ? originPocketData[0] : originPocketData;

            if (!originPocket || !originPocket.currency) {
                throw new NotFoundError("/v1/wallet/pocket", `Origin Pocket ${params.origin_pocket_id}`);
            }

            const body = {
                operation: "purchase",
                pocket: params.origin_pocket_id,
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(originPocket.currency),
            };
            const requestContext = {
                origin_pocket_id: params.origin_pocket_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_buy_crypto_with_card") {
            const params = args as WalletBuyCryptoWithCardArgs;
            if (!params.card_id) {
                throw new ValidationError("card_id is required", "card_id");
            }
            if (!params.destination_pocket_id) {
                throw new ValidationError("destination_pocket_id is required", "destination_pocket_id");
            }
            if (!params.amount) {
                throw new ValidationError("amount is required", "amount");
            }
            if (!params.currency) {
                throw new ValidationError("currency is required", "currency");
            }
            validateUUID(params.destination_pocket_id, "destination_pocket_id");
            validateSymbol(params.currency);

            const body = {
                operation: "buy",
                origin: { creditcard: { cardId: params.card_id } },
                destination: { pocket: params.destination_pocket_id },
                amount: params.amount,
                currency: normalizeSymbol(params.currency),
            };
            const requestContext = {
                card_id: params.card_id,
                destination_pocket_id: params.destination_pocket_id,
                amount: params.amount,
                currency: normalizeSymbol(params.currency),
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            const optimized = mapProformaResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        if (name === "wallet_confirm_operation") {
            const params = args as WalletConfirmOperationArgs;
            const requestContext = {
                proforma_id: params.proforma_id,
            };
            const body = { proforma: params.proforma_id };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction", body);
            const optimized = mapOperationConfirmationResponse(data);
            const contextual = buildSimpleContextualResponse(requestContext, optimized, data);
            return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
        }

        throw new Error(`Unknown wallet tool: ${name}`);
    });
}
