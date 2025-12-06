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
import { ValidationError } from "../utils/errors.js";
import {
    mapWalletPocketsResponse,
    mapWalletAddressesResponse,
    mapWalletMovementsResponse,
    mapWalletMovementDetailsResponse,
    mapWalletNetworksResponse,
} from "../utils/response-mappers.js";
import {
    buildSimpleContextualResponse,
    buildFilteredContextualResponse,
    buildPaginatedContextualResponse,
} from "../utils/contextual-response.js";
import { WalletPocketAddressesArgs, WalletNetworksArgs, WalletMovementsArgs } from "../utils/args.js";
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
            const params = args as { symbol?: string; pocket_id?: string };
            const requestContext: any = {};

            // If pocket_id is provided, filter to that specific pocket
            if (params.pocket_id) {
                validateUUID(params.pocket_id, "pocket_id");
                requestContext.pocket_id = params.pocket_id;
            }

            const data = await bit2meRequest("GET", "/v1/wallet/pocket", {});
            let optimized = mapWalletPocketsResponse(data);

            // Filter by pocket_id if provided
            if (params.pocket_id) {
                optimized = optimized.filter((p: any) => p.id === params.pocket_id);
            }

            // Filter by symbol if provided
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

        if (name === "wallet_get_movements") {
            const params = args as WalletMovementsArgs;
            const requestContext: any = {};

            // If movement_id is provided, get details for that specific movement
            if (params.movement_id) {
                validateUUID(params.movement_id, "movement_id");
                requestContext.movement_id = params.movement_id;
                const data = await bit2meRequest(
                    "GET",
                    `/v1/wallet/transaction/${encodeURIComponent(params.movement_id)}`
                );
                const optimized = mapWalletMovementDetailsResponse(data);
                // Return as array for consistency
                const contextual = buildFilteredContextualResponse(
                    requestContext,
                    [optimized],
                    {
                        total_records: 1,
                    },
                    data
                );
                return { content: [{ type: "text", text: JSON.stringify(contextual, null, 2) }] };
            }

            // Otherwise, get paginated list of movements
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

            requestContext.limit = limit;
            requestContext.offset = offset;
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

        throw new Error(`Unknown wallet tool: ${name}`);
    });
}
