#!/usr/bin/env node
/* eslint-disable */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import crypto from "crypto";

// --- CONFIGURACIÓN ---
const BIT2ME_BASE_URL = "https://gateway.bit2me.com";

// --- 1. UTILIDADES DE SEGURIDAD & API ---

/**
 * Genera la firma HMAC-SHA512 requerida por Bit2Me.
 * Sigue el estándar: hash256(nonce + endpoint + body) firmado con secret.
 */
function generateSignature(nonce: number, endpoint: string, body: any, apiSecret: string): string {
    const hasBody = !!body && Object.keys(body).length > 0;
    // IMPORTANTE: El mensaje a firmar debe coincidir exactamente con lo que espera el servidor
    const message = hasBody
        ? `${nonce}:${endpoint}:${JSON.stringify(body)}`
        : `${nonce}:${endpoint}`;

    const hash = crypto.createHash("sha256").update(message).digest("binary");
    return crypto.createHmac("sha512", apiSecret).update(hash, "binary").digest("base64");
}

/**
 * Wrapper centralizado para llamadas a la API.
 * Maneja headers, firma, nonce y errores.
 */
async function bit2meRequest(method: "GET" | "POST" | "DELETE", endpoint: string, params?: any) {
    const apiKey = process.env.BIT2ME_API_KEY;
    const apiSecret = process.env.BIT2ME_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("Faltan las credenciales BIT2ME_API_KEY y BIT2ME_API_SECRET en las variables de entorno.");
    }

    const nonce = Date.now();

    const requestConfig: any = {
        method,
        url: `${BIT2ME_BASE_URL}${endpoint}`,
        headers: {
            "x-api-key": apiKey,
            "x-nonce": nonce.toString(),
            "Content-Type": "application/json",
        }
    };

    // Lógica de firma dependiendo del método
    let signatureData = undefined;

    if (method === "GET" && params) {
        requestConfig.params = params;
        // En GET, Bit2Me v1/v2 generalmente firma solo el path + nonce, no los query params en el body string.
    } else if ((method === "POST" || method === "DELETE") && params) {
        requestConfig.data = params;
        signatureData = params; // En POST, el body JSON sí se firma
    }

    const signature = generateSignature(nonce, endpoint, signatureData, apiSecret);
    requestConfig.headers["api-signature"] = signature;

    try {
        const response = await axios(requestConfig);
        return response.data;
    } catch (error: any) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMsg = data?.message || JSON.stringify(data) || error.message;
        console.error(`[Bit2Me API Error ${status}]: ${errorMsg}`);
        throw new Error(`Bit2Me API Error (${status}): ${errorMsg}`);
    }
}

/**
 * Helper para obtener el precio actual de mercado (Ticker)
 * Se usa en la valoración de portfolio.
 */
async function getMarketPrice(cryptoSymbol: string, fiatCurrency: string): Promise<number> {
    if (cryptoSymbol.toUpperCase() === fiatCurrency.toUpperCase()) return 1;

    // Filtrar símbolos extraños o 'LP' tokens que no tienen ticker público
    if (cryptoSymbol.length > 5 && !cryptoSymbol.includes("TEST")) return 0;

    try {
        // Endpoint v3 público
        const response = await axios.get(`${BIT2ME_BASE_URL}/v3/currency/ticker/${cryptoSymbol}`, {
            params: { rateCurrency: fiatCurrency }
        });

        // La estructura puede variar según la moneda, intentamos capturar el precio
        const priceData = response.data?.currency?.cryptoCurrency?.[0]?.price || response.data?.price;
        return parseFloat(priceData) || 0;
    } catch (e) {
        // Silencioso para no saturar logs si una moneda exótica falla
        return 0;
    }
}

// --- 2. DEFINICIÓN DEL SERVIDOR MCP ---

const server = new Server(
    { name: "bit2me-mcp-server", version: "2.0.0" },
    { capabilities: { tools: {} } }
);

// --- 3. LISTADO DE HERRAMIENTAS ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // === META-TOOL (Agregador) ===
            {
                name: "get_portfolio_valuation",
                description: "TOOL MAESTRA: Calcula el valor total de todo el patrimonio (Wallet + Pro + Earn + Loans) en la divisa elegida.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fiat_currency: { type: "string", description: "Divisa base (ej: EUR, USD)", default: "EUR" }
                    }
                }
            },

            // === ANÁLISIS DE MERCADO ===
            {
                name: "get_market_ticker",
                description: "Obtiene precio actual y datos de mercado 24h.",
                inputSchema: {
                    type: "object",
                    properties: { symbol: { type: "string", description: "Par (ej: BTC/EUR)" } },
                    required: ["symbol"]
                }
            },
            {
                name: "get_crypto_chart",
                description: "Obtiene histórico de precios (velas/chart) para análisis técnico.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ticker: { type: "string", description: "Par (ej: BTC/EUR)" },
                        timeframe: { type: "string", enum: ["one-hour", "one-day", "one-week", "one-month", "one-year"] }
                    },
                    required: ["ticker", "timeframe"]
                }
            },

            // === WALLET (Simple Broker) ===
            {
                name: "get_wallet_pockets",
                description: "Obtiene saldos y UUIDs del Wallet Simple (Broker).",
                inputSchema: {
                    type: "object",
                    properties: { currency: { type: "string" } }
                }
            },
            {
                name: "create_wallet_proforma",
                description: "PASO 1: Prepara una operación en Wallet Simple. Devuelve ID Proforma y coste.",
                inputSchema: {
                    type: "object",
                    properties: {
                        origin_pocket_id: { type: "string" },
                        destination_pocket_id: { type: "string" },
                        amount: { type: "string" },
                        currency: { type: "string" }
                    },
                    required: ["origin_pocket_id", "destination_pocket_id", "amount", "currency"]
                }
            },
            {
                name: "confirm_transaction",
                description: "PASO 2: Ejecuta la operación usando el ID de Proforma. Acción final.",
                inputSchema: {
                    type: "object",
                    properties: { proforma_id: { type: "string" } },
                    required: ["proforma_id"]
                }
            },
            {
                name: "get_transaction_history",
                description: "Historial de operaciones pasadas del Wallet.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: { type: "string", description: "Cantidad a mostrar (default: 10)" },
                        currency: { type: "string" }
                    }
                }
            },

            // === PRO TRADING (Advanced) ===
            {
                name: "get_pro_balance",
                description: "Obtiene saldos específicos de la cuenta PRO Trading.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "get_open_orders",
                description: "Ver órdenes de trading abiertas en PRO.",
                inputSchema: {
                    type: "object",
                    properties: { symbol: { type: "string" } }
                }
            },
            {
                name: "place_pro_order",
                description: "Crear orden Limit/Market/Stop en PRO Trading.",
                inputSchema: {
                    type: "object",
                    properties: {
                        symbol: { type: "string" },
                        side: { type: "string", enum: ["buy", "sell"] },
                        type: { type: "string", enum: ["limit", "market", "stop-limit"] },
                        amount: { type: "number" },
                        price: { type: "number", description: "Requerido para Limit/Stop" },
                        stopPrice: { type: "number", description: "Requerido para Stop-Limit" }
                    },
                    required: ["symbol", "side", "type", "amount"]
                }
            },
            {
                name: "cancel_pro_order",
                description: "Cancelar una orden PRO por ID.",
                inputSchema: {
                    type: "object",
                    properties: { orderId: { type: "string" } },
                    required: ["orderId"]
                }
            },

            // === EARN & ACCOUNT ===
            {
                name: "get_account_info",
                description: "Ver perfil de usuario y niveles.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "get_earn_summary",
                description: "Ver recompensas de Staking/Earn.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "get_active_loans",
                description: "Ver préstamos activos.",
                inputSchema: { type: "object", properties: {} }
            }
        ] as Tool[]
    };
});

// --- 4. IMPLEMENTACIÓN DE HERRAMIENTAS ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const inputs = args as any;

    try {
        // --- AGREGADOR DE PORTFOLIO ---
        if (name === "get_portfolio_valuation") {
            const fiat = inputs.fiat_currency || "EUR";

            // 1. Llamada paralela a todos los servicios de saldo
            const [wallet, pro, earn, loans] = await Promise.all([
                bit2meRequest("GET", "/v1/wallet/pocket"),          //
                bit2meRequest("GET", "/v1/trading/wallet/balance"), //
                bit2meRequest("GET", "/v1/earn/summary"),           //
                bit2meRequest("GET", "/v1/loan/orders")             //
            ]);

            const assets: Record<string, number> = {};

            // Procesar Wallet
            if (Array.isArray(wallet)) wallet.forEach((p: any) => {
                const val = parseFloat(p.balance || "0");
                if (val > 0) assets[p.currency] = (assets[p.currency] || 0) + val;
            });

            // Procesar Pro
            if (Array.isArray(pro)) pro.forEach((w: any) => {
                const val = parseFloat(w.balance || "0") + parseFloat(w.blockedBalance || "0");
                if (val > 0) assets[w.currency] = (assets[w.currency] || 0) + val;
            });

            // Procesar Earn
            if (Array.isArray(earn)) earn.forEach((e: any) => {
                const val = parseFloat(e.totalBalance || "0");
                if (val > 0) assets[e.currency] = (assets[e.currency] || 0) + val;
            });

            // Procesar Loans
            if (loans?.data && Array.isArray(loans.data)) loans.data.forEach((l: any) => {
                const val = parseFloat(l.guaranteeAmount || "0");
                if (val > 0) assets[l.guaranteeCurrency] = (assets[l.guaranteeCurrency] || 0) + val;
            });

            // 2. Valoración
            const uniqueSymbols = Object.keys(assets);
            const prices = await Promise.all(uniqueSymbols.map(s => getMarketPrice(s, fiat)));

            const breakdown: any[] = [];
            let totalVal = 0;

            uniqueSymbols.forEach((symbol, idx) => {
                const price = prices[idx];
                const amount = assets[symbol];
                const val = amount * price;
                totalVal += val;

                if (val > 0.01) { // Filtrar dust
                    breakdown.push({
                        asset: symbol,
                        amount: amount,
                        price_unit: price,
                        value_fiat: parseFloat(val.toFixed(2))
                    });
                }
            });

            breakdown.sort((a, b) => b.value_fiat - a.value_fiat);

            return {
                content: [{
                    type: "text", text: JSON.stringify({
                        currency: fiat,
                        total_value: parseFloat(totalVal.toFixed(2)),
                        details: breakdown
                    }, null, 2)
                }]
            };
        }

        // --- RESTO DE TOOLS (Implementación directa) ---

        if (name === "get_market_ticker") {
            const res = await axios.get(`${BIT2ME_BASE_URL}/v3/currency/ticker/${inputs.symbol}`);
            return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
        }

        if (name === "get_crypto_chart") {
            const res = await axios.get(`${BIT2ME_BASE_URL}/v3/currency/chart`, {
                params: { ticker: inputs.ticker, temporality: inputs.timeframe }
            });
            // Recortamos datos para no saturar contexto
            const data = Array.isArray(res.data) ? res.data.slice(-30) : res.data;
            return { content: [{ type: "text", text: JSON.stringify(data) }] };
        }

        if (name === "get_wallet_pockets") {
            const data = await bit2meRequest("GET", "/v1/wallet/pocket");
            const clean = data
                .filter((p: any) => !inputs.currency || p.currency === inputs.currency)
                .map((p: any) => ({ id: p.id, currency: p.currency, balance: p.balance, name: p.name }));
            return { content: [{ type: "text", text: JSON.stringify(clean, null, 2) }] };
        }

        if (name === "create_wallet_proforma") {
            const body = {
                pocket: inputs.origin_pocket_id,
                destination: { pocket: inputs.destination_pocket_id },
                amount: inputs.amount,
                currency: inputs.currency
            };
            const data = await bit2meRequest("POST", "/v1/wallet/transaction/proforma", body);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "confirm_transaction") {
            const data = await bit2meRequest("POST", "/v1/wallet/transaction", { proforma: inputs.proforma_id });
            return { content: [{ type: "text", text: `✅ Transacción confirmada. ID: ${data.id}` }] };
        }

        if (name === "get_transaction_history") {
            const params: any = { limit: Number(inputs.limit) || 10 };
            if (inputs.currency) params.currency = inputs.currency;
            const data = await bit2meRequest("GET", "/v2/wallet/transaction", params);
            return { content: [{ type: "text", text: JSON.stringify(data.data || [], null, 2) }] };
        }

        if (name === "get_pro_balance") {
            const data = await bit2meRequest("GET", "/v1/trading/wallet/balance");
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "get_open_orders") {
            const params: any = { status: "open" };
            if (inputs.symbol) params.symbol = inputs.symbol;
            const data = await bit2meRequest("GET", "/v1/trading/order", params);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "place_pro_order") {
            const body: any = {
                symbol: inputs.symbol,
                side: inputs.side,
                orderType: inputs.type,
                amount: inputs.amount
            };
            if (inputs.price) body.price = inputs.price;
            if (inputs.stopPrice) body.stopPrice = inputs.stopPrice;

            const data = await bit2meRequest("POST", "/v1/trading/order", body);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "cancel_pro_order") {
            const data = await bit2meRequest("DELETE", `/v1/trading/order/${inputs.orderId}`);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "get_account_info") {
            const data = await bit2meRequest("GET", "/v1/account");
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "get_earn_summary") {
            const data = await bit2meRequest("GET", "/v1/earn/summary");
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "get_active_loans") {
            const data = await bit2meRequest("GET", "/v1/loan/orders");
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        throw new Error("Tool desconocida");

    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error ejecutando ${name}: ${error.message}` }],
            isError: true,
        };
    }
});

// --- START SERVER ---
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

run().catch(console.error);