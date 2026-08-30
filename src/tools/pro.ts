import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { executeTool } from "../utils/tool-wrapper.js";
import { getCategoryTools } from "../utils/tool-metadata.js";
import { lookupHandler, type NamedToolHandler } from "./dispatch-map.js";
import {
    handleProGetBalance,
    handleProGetTrades,
    handleProGetOrderTrades,
    handleProGetOpenOrders,
} from "./pro-read.js";
import { handleProCreateOrder, handleProCancelOrder, handleProCancelAllOrders } from "./pro-write.js";
import { handleProDeposit, handleProWithdraw } from "./pro-transfer.js";
import { handleProGetMarketConfig, handleProGetOrderBook, handleProGetPublicTrades } from "./pro-market.js";
import { handleProGetCandles, handleProGetTicker } from "./pro-candles.js";

export const proTools: Tool[] = getCategoryTools("pro");

export const proHandlers = new Map<string, NamedToolHandler>([
    ["pro_get_balance", handleProGetBalance],
    ["pro_get_trades", handleProGetTrades],
    ["pro_get_order_trades", handleProGetOrderTrades],
    ["pro_get_open_orders", handleProGetOpenOrders],
    ["pro_create_order", handleProCreateOrder],
    ["pro_cancel_order", handleProCancelOrder],
    ["pro_cancel_all_orders", handleProCancelAllOrders],
    ["pro_deposit", handleProDeposit],
    ["pro_withdraw", handleProWithdraw],
    ["pro_get_market_config", handleProGetMarketConfig],
    ["pro_get_order_book", handleProGetOrderBook],
    ["pro_get_public_trades", handleProGetPublicTrades],
    ["pro_get_candles", handleProGetCandles],
    ["pro_get_ticker", handleProGetTicker],
]);

/**
 * Handles pro trading-related tool requests
 */
export async function handleProTool(name: string, args: Record<string, unknown>) {
    return executeTool(name, args, async () => {
        const handler = lookupHandler(proHandlers, name, "pro");
        return handler(args);
    });
}
