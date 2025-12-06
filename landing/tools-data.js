// Auto-generated from data/tools.json
// Do not edit manually - run: npm run build:docs

const toolsData = [
    {
        "category": "General",
        "id": "cat-general",
        "icon": "ℹ️",
        "description": "General information tools including asset details, account information, and portfolio valuation.",
        "tools": [
            {
                "name": "general_get_assets_config",
                "type": "READ",
                "desc": "Gets asset configuration for Bit2Me. Optional symbol filter. Returns symbol, name, type (crypto/fiat), network, trading status, loan availability, and pro_trading_pairs. Use to discover symbols or verify if an asset is tradeable/loanable. [PUBLIC]",
                "args": {
                    "symbol": {
                        "type": "string",
                        "desc": "Filter by specific asset symbol (e.g., BTC, ETH). If not provided, returns all assets.",
                        "required": false
                    },
                    "include_testnet": {
                        "type": "boolean",
                        "desc": "Include testnet/sandbox assets in response",
                        "required": false,
                        "default": false
                    },
                    "show_exchange": {
                        "type": "boolean",
                        "desc": "Include exchange-specific properties in response",
                        "required": false,
                        "default": false
                    }
                },
                "exampleArgs": {
                    "symbol": "BTC",
                    "include_testnet": false,
                    "show_exchange": true
                },
                "response": {
                    "request": {
                        "symbol": "BTC",
                        "include_testnet": false,
                        "show_exchange": true
                    },
                    "result": {
                        "symbol": "BTC",
                        "name": "Bitcoin",
                        "type": "crypto",
                        "network": "bitcoin",
                        "enabled": true,
                        "tradeable": true,
                        "loanable": true,
                        "pro_trading_pairs": [
                            "BTC-EUR"
                        ]
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "symbol": {
                            "type": "string",
                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                        },
                        "name": {
                            "type": "string",
                            "description": "Human-readable pocket name or currency name"
                        },
                        "type": {
                            "type": "string",
                            "description": "Asset type: \"crypto\" for cryptocurrencies, \"fiat\" for traditional currencies",
                            "enum": [
                                "crypto",
                                "fiat"
                            ]
                        },
                        "network": {
                            "type": "string",
                            "description": "Blockchain network name in lowercase (e.g., bitcoin, ethereum, binance_smart_chain)",
                            "nullable": true
                        },
                        "enabled": {
                            "type": "boolean",
                            "description": "Whether the asset is enabled for use"
                        },
                        "tradeable": {
                            "type": "boolean",
                            "description": "Whether the asset can be traded"
                        },
                        "loanable": {
                            "type": "boolean",
                            "description": "Whether the asset can be used as collateral for loans"
                        },
                        "pro_trading_pairs": {
                            "type": "array",
                            "description": "List of complete trading pairs available for Pro Trading in BASE-QUOTE format (e.g., BTC-EUR, BTC-USD)",
                            "items": {
                                "type": "string",
                                "pattern": "^[A-Z0-9]+-[A-Z0-9]+$"
                            }
                        }
                    },
                    "required": [
                        "symbol",
                        "name",
                        "type",
                        "enabled",
                        "tradeable",
                        "loanable",
                        "pro_trading_pairs"
                    ]
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "portfolio_get_valuation",
                "type": "READ",
                "desc": "Calculates the total portfolio value by aggregating all assets across Wallet, Pro Trading, Earn/Staking, and Loans. Converts all holdings to the specified fiat symbol (default: EUR) using current market prices. Returns total value, breakdown by asset, and individual asset valuations. Filters out dust amounts below minimum threshold. [PRIVATE]",
                "args": {
                    "fiat_symbol": {
                        "type": "string",
                        "desc": "Base fiat symbol (e.g., EUR, USD)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "fiat_symbol": "EUR"
                },
                "response": {
                    "request": {
                        "fiat_symbol": "EUR"
                    },
                    "result": {
                        "quote_symbol": "EUR",
                        "total_balance": "12500.50",
                        "by_service": {
                            "wallet_balance": "5000.00",
                            "pro_balance": "3000.00",
                            "earn_balance": "4000.00",
                            "loan_guarantees_balance": "500.50"
                        },
                        "details": [
                            {
                                "symbol": "BTC",
                                "balance": "0.5",
                                "price_unit": "90000.00",
                                "converted_balance": "45000.00"
                            }
                        ]
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "quote_symbol": {
                            "type": "string",
                            "description": "Quote currency symbol in uppercase (e.g., EUR, USD)"
                        },
                        "total_balance": {
                            "type": "string",
                            "description": "Total portfolio balance in fiat currency"
                        },
                        "by_service": {
                            "type": "object",
                            "description": "Breakdown by service with balance suffix",
                            "properties": {
                                "wallet_balance": {
                                    "type": "string",
                                    "description": "Total balance in Wallet"
                                },
                                "pro_balance": {
                                    "type": "string",
                                    "description": "Total balance in Pro Trading"
                                },
                                "earn_balance": {
                                    "type": "string",
                                    "description": "Total balance in Earn/Staking"
                                },
                                "loan_guarantees_balance": {
                                    "type": "string",
                                    "description": "Total balance in loan guarantees"
                                }
                            }
                        },
                        "details": {
                            "type": "array",
                            "description": "Individual asset valuations with breakdown per cryptocurrency",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "symbol": {
                                        "type": "string",
                                        "description": "Cryptocurrency symbol in uppercase (e.g., BTC, ETH)"
                                    },
                                    "balance": {
                                        "type": "string",
                                        "description": "Total amount of this asset across all services (as string for precision)"
                                    },
                                    "price_unit": {
                                        "type": "string",
                                        "description": "Current price of one unit in the quote currency (as string for precision)"
                                    },
                                    "converted_balance": {
                                        "type": "string",
                                        "description": "Total value of this asset in the quote currency (balance × price_unit)"
                                    }
                                }
                            }
                        }
                    },
                    "required": [
                        "quote_symbol",
                        "total_balance",
                        "by_service",
                        "details"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "medium"
                }
            }
        ]
    },
    {
        "category": "Broker (Simple Trading)",
        "id": "cat-broker",
        "icon": "💱",
        "description": "Tools for simple trading operations and broker prices. Includes market data (prices, charts) and trading actions (buy, sell, swap) for the Wallet/Broker service. These prices include spread and are different from Pro Trading prices.",
        "tools": [
            {
                "name": "broker_get_asset_price",
                "type": "READ",
                "desc": "Get Wallet exchange rates for cryptocurrencies in a specific quote symbol and date. Returns the price of one unit of the base symbol in the requested quote symbol (default: EUR) as used by the Wallet/Broker service. Optional base_symbol filter and date for historical rates. Response is a list of prices. [PUBLIC]",
                "args": {
                    "quote_symbol": {
                        "type": "string",
                        "desc": "Target quote symbol (e.g., EUR, USD)",
                        "required": false
                    },
                    "base_symbol": {
                        "type": "string",
                        "desc": "Filter by specific base symbol (e.g., BTC)",
                        "required": false
                    },
                    "date": {
                        "type": "string",
                        "desc": "Timestamp or date string (ISO 8601) for historical rates",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "quote_symbol": "EUR",
                    "base_symbol": "BTC"
                },
                "response": {
                    "request": {
                        "quote_symbol": "EUR",
                        "base_symbol": "BTC"
                    },
                    "result": [
                        {
                            "base_symbol": "BTC",
                            "price": "90000",
                            "quote_symbol": "EUR",
                            "date": "2024-11-25T10:30:00.000Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "base_symbol": {
                                "type": "string",
                                "description": "Base cryptocurrency symbol in uppercase (e.g., BTC, ETH)"
                            },
                            "quote_symbol": {
                                "type": "string",
                                "description": "Quote currency symbol in uppercase (e.g., EUR, USD)"
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the rate was recorded",
                                "format": "date-time"
                            },
                            "price": {
                                "type": "string",
                                "description": "Price of one unit of base_symbol in quote_symbol (as string for precision)"
                            }
                        },
                        "required": [
                            "base_symbol",
                            "quote_symbol",
                            "date",
                            "price"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "broker_get_asset_data",
                "type": "READ",
                "desc": "Gets comprehensive market ticker data for a cryptocurrency from the Wallet/Broker service (not Pro Trading). These prices include spread and differ from Pro Trading prices. Requires base_symbol (e.g., BTC) and optional quote_symbol (default: EUR). [PUBLIC]",
                "args": {
                    "base_symbol": {
                        "type": "string",
                        "desc": "Base symbol (e.g., BTC, ETH, DOGE, SOL)",
                        "required": true
                    },
                    "quote_symbol": {
                        "type": "string",
                        "desc": "Quote symbol for prices (default: EUR)",
                        "required": false,
                        "default": "EUR"
                    }
                },
                "exampleArgs": {
                    "base_symbol": "BTC",
                    "quote_symbol": "EUR"
                },
                "response": {
                    "request": {
                        "base_symbol": "BTC",
                        "quote_symbol": "EUR"
                    },
                    "result": {
                        "base_symbol": "BTC",
                        "quote_symbol": "EUR",
                        "date": "2025-11-25T10:30:00.258Z",
                        "price": "75869.89",
                        "market_cap": "1510730550631.13",
                        "volume_24h": "62022281357.81",
                        "max_supply": "21000000",
                        "total_supply": "19953446"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "base_symbol": {
                            "type": "string",
                            "description": "Base cryptocurrency symbol in uppercase (e.g., BTC, ETH)"
                        },
                        "quote_symbol": {
                            "type": "string",
                            "description": "Quote currency symbol in uppercase (e.g., EUR, USD)"
                        },
                        "date": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the data was recorded",
                            "format": "date-time"
                        },
                        "price": {
                            "type": "string",
                            "description": "Current price of base_symbol in quote_symbol (as string for precision)"
                        },
                        "market_cap": {
                            "type": "string",
                            "description": "Total market capitalization in quote_symbol (as string for precision)"
                        },
                        "volume_24h": {
                            "type": "string",
                            "description": "24-hour trading volume in quote_symbol (as string for precision)"
                        },
                        "max_supply": {
                            "type": "string",
                            "description": "Maximum supply of the cryptocurrency (as string, nullable)",
                            "nullable": true
                        },
                        "total_supply": {
                            "type": "string",
                            "description": "Total current supply of the cryptocurrency (as string, nullable)",
                            "nullable": true
                        }
                    },
                    "required": [
                        "base_symbol",
                        "quote_symbol",
                        "date",
                        "price",
                        "market_cap",
                        "volume_24h"
                    ]
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "broker_get_asset_chart",
                "type": "READ",
                "desc": "Gets Wallet price history (candles/chart) with date and price in the quote symbol. These prices reflect the Wallet/Broker service, not Pro Trading. Requires pair (e.g., BTC-USD) and timeframe. Returns data points with ISO 8601 date/time and price in the quote symbol from the pair. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Trading pair in BASE-QUOTE format (e.g., BTC-USD, ETH-EUR)",
                        "required": true
                    },
                    "timeframe": {
                        "type": "string",
                        "desc": "Chart timeframe: 1h (1 hour), 1d (1 day), 1w (1 week), 1M (1 month), 1y (1 year). Returns data points for the selected period.",
                        "required": true,
                        "enum": [
                            "1h",
                            "1d",
                            "1w",
                            "1M",
                            "1y"
                        ]
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD",
                    "timeframe": "1d"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD",
                        "timeframe": "1d"
                    },
                    "result": [
                        {
                            "date": "2024-11-25T10:30:00.000Z",
                            "price": "72145.32"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time for this data point",
                                "format": "date-time"
                            },
                            "price": {
                                "type": "string",
                                "description": "Price at this point in time in the quote symbol from the pair (as string for precision)"
                            }
                        },
                        "required": [
                            "date",
                            "price"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "broker_quote_buy",
                "type": "WRITE",
                "desc": "STEP 1: Buy cryptocurrency using fiat balance from a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]",
                "args": {
                    "origin_pocket_id": {
                        "type": "string",
                        "desc": "Source pocket UUID containing fiat currency (e.g., EUR pocket)",
                        "required": true
                    },
                    "destination_pocket_id": {
                        "type": "string",
                        "desc": "Target pocket UUID to receive cryptocurrency (e.g., BTC pocket)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to spend from origin pocket (in origin currency)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "origin_pocket_id": "pocket-eur-uuid",
                    "destination_pocket_id": "pocket-btc-uuid",
                    "amount": "100.00"
                },
                "response": {
                    "request": {
                        "origin_pocket_id": "pocket-eur-uuid",
                        "destination_pocket_id": "pocket-btc-uuid",
                        "amount": "100.00"
                    },
                    "result": {
                        "proforma_id": "proforma123-...",
                        "origin_amount": "100.00",
                        "origin_symbol": "EUR",
                        "destination_amount": "0.00131579",
                        "destination_symbol": "BTC",
                        "rate": "75869.89",
                        "fee": "0.50",
                        "expires_at": "2024-11-25T10:35:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "proforma_id": {
                            "type": "string",
                            "description": "Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation"
                        },
                        "origin_amount": {
                            "type": "string",
                            "description": "Amount being spent from the source pocket (in origin currency, as string for precision)"
                        },
                        "origin_symbol": {
                            "type": "string",
                            "description": "Currency symbol of the source pocket (e.g., EUR for buy, BTC for sell)"
                        },
                        "destination_amount": {
                            "type": "string",
                            "description": "Amount to be received in the destination pocket (in destination currency, as string for precision)"
                        },
                        "destination_symbol": {
                            "type": "string",
                            "description": "Currency symbol of the destination pocket (e.g., BTC for buy, EUR for sell)"
                        },
                        "rate": {
                            "type": "string",
                            "description": "Exchange rate applied to this quote (as string for precision)"
                        },
                        "fee": {
                            "type": "string",
                            "description": "Transaction fee amount in origin currency (as string for precision)"
                        },
                        "expires_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when this quote expires. Must confirm before this time",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "proforma_id",
                        "origin_amount",
                        "origin_symbol",
                        "destination_amount",
                        "destination_symbol",
                        "rate",
                        "fee",
                        "expires_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "broker_quote_sell",
                "type": "WRITE",
                "desc": "STEP 1: Sell cryptocurrency to receive fiat balance in a pocket. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]",
                "args": {
                    "origin_pocket_id": {
                        "type": "string",
                        "desc": "Source pocket UUID containing cryptocurrency (e.g., BTC pocket)",
                        "required": true
                    },
                    "destination_pocket_id": {
                        "type": "string",
                        "desc": "Target pocket UUID to receive fiat currency (e.g., EUR pocket)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to sell from origin pocket (in origin cryptocurrency)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "origin_pocket_id": "pocket-btc-uuid",
                    "destination_pocket_id": "pocket-eur-uuid",
                    "amount": "0.001"
                },
                "response": {
                    "request": {
                        "origin_pocket_id": "pocket-btc-uuid",
                        "destination_pocket_id": "pocket-eur-uuid",
                        "amount": "0.001"
                    },
                    "result": {
                        "proforma_id": "proforma123-...",
                        "origin_amount": "0.001",
                        "origin_symbol": "BTC",
                        "destination_amount": "75.87",
                        "destination_symbol": "EUR",
                        "rate": "75869.89",
                        "fee": "0.50",
                        "expires_at": "2024-11-25T10:35:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "proforma_id": {
                            "type": "string",
                            "description": "Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation"
                        },
                        "origin_amount": {
                            "type": "string",
                            "description": "Amount of cryptocurrency being sold (as string for precision)"
                        },
                        "origin_symbol": {
                            "type": "string",
                            "description": "Symbol of the cryptocurrency being sold (e.g., BTC)"
                        },
                        "destination_amount": {
                            "type": "string",
                            "description": "Amount of fiat currency to be received (as string for precision)"
                        },
                        "destination_symbol": {
                            "type": "string",
                            "description": "Symbol of the fiat currency to receive (e.g., EUR)"
                        },
                        "rate": {
                            "type": "string",
                            "description": "Exchange rate applied to this quote (as string for precision)"
                        },
                        "fee": {
                            "type": "string",
                            "description": "Transaction fee amount (as string for precision)"
                        },
                        "expires_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when this quote expires. Must confirm before this time",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "proforma_id",
                        "origin_amount",
                        "origin_symbol",
                        "destination_amount",
                        "destination_symbol",
                        "rate",
                        "fee",
                        "expires_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "broker_quote_swap",
                "type": "WRITE",
                "desc": "STEP 1: Swap/exchange one cryptocurrency for another between pockets. Creates a proforma quote. Use wallet_get_pockets to find pocket IDs. REQUIRES subsequent confirmation with broker_confirm_quote. [PRIVATE]",
                "args": {
                    "origin_pocket_id": {
                        "type": "string",
                        "desc": "Source pocket UUID containing cryptocurrency to swap (e.g., BTC pocket)",
                        "required": true
                    },
                    "destination_pocket_id": {
                        "type": "string",
                        "desc": "Target pocket UUID to receive different cryptocurrency (e.g., ETH pocket)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to swap from origin pocket (in origin cryptocurrency)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "origin_pocket_id": "pocket-btc-uuid",
                    "destination_pocket_id": "pocket-eth-uuid",
                    "amount": "0.001"
                },
                "response": {
                    "request": {
                        "origin_pocket_id": "pocket-btc-uuid",
                        "destination_pocket_id": "pocket-eth-uuid",
                        "amount": "0.001"
                    },
                    "result": {
                        "proforma_id": "proforma123-...",
                        "origin_amount": "0.001",
                        "origin_symbol": "BTC",
                        "destination_amount": "0.025",
                        "destination_symbol": "ETH",
                        "rate": "0.04",
                        "fee": "0.0001",
                        "expires_at": "2024-11-25T10:35:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "proforma_id": {
                            "type": "string",
                            "description": "Unique identifier for the quote. Use this with broker_confirm_quote to execute the operation"
                        },
                        "origin_amount": {
                            "type": "string",
                            "description": "Amount of cryptocurrency being swapped from (as string for precision)"
                        },
                        "origin_symbol": {
                            "type": "string",
                            "description": "Symbol of the cryptocurrency being swapped from (e.g., BTC)"
                        },
                        "destination_amount": {
                            "type": "string",
                            "description": "Amount of cryptocurrency to be received (as string for precision)"
                        },
                        "destination_symbol": {
                            "type": "string",
                            "description": "Symbol of the cryptocurrency to receive (e.g., ETH)"
                        },
                        "rate": {
                            "type": "string",
                            "description": "Exchange rate between the two cryptocurrencies (as string for precision)"
                        },
                        "fee": {
                            "type": "string",
                            "description": "Transaction fee amount in origin currency (as string for precision)"
                        },
                        "expires_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when this quote expires. Must confirm before this time",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "proforma_id",
                        "origin_amount",
                        "origin_symbol",
                        "destination_amount",
                        "destination_symbol",
                        "rate",
                        "fee",
                        "expires_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "broker_confirm_quote",
                "type": "WRITE",
                "desc": "STEP 2: Confirms and executes a previously created proforma from broker_quote_buy, broker_quote_sell, or broker_quote_swap. Final action. [PRIVATE]",
                "args": {
                    "proforma_id": {
                        "type": "string",
                        "desc": "Proforma UUID returned by broker_quote_* operations",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "proforma_id": "proforma-uuid-1234-5678"
                },
                "response": {
                    "request": {
                        "proforma_id": "proforma-uuid-1234-5678"
                    },
                    "result": {
                        "movement_id": "movement-uuid-1234-5678",
                        "type": "swap",
                        "status": "completed",
                        "origin_amount": "0.001",
                        "origin_symbol": "BTC",
                        "destination_amount": "0.025",
                        "destination_symbol": "ETH",
                        "fee": "0.0001",
                        "created_at": "2024-11-25T10:35:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "movement_id": {
                            "type": "string",
                            "description": "Unique identifier for the executed movement. Use this to track the transaction"
                        },
                        "type": {
                            "type": "string",
                            "description": "Type of movement executed: deposit (incoming funds), withdrawal (outgoing funds), swap (crypto exchange), purchase (buy crypto with fiat), transfer (internal move), fee (charged fee)",
                            "enum": [
                                "deposit",
                                "withdrawal",
                                "swap",
                                "purchase",
                                "transfer",
                                "fee",
                                "other"
                            ]
                        },
                        "status": {
                            "type": "string",
                            "description": "Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                            "enum": [
                                "pending",
                                "completed",
                                "failed"
                            ]
                        },
                        "origin_amount": {
                            "type": "string",
                            "description": "Amount spent from the source pocket (as string for precision)"
                        },
                        "origin_symbol": {
                            "type": "string",
                            "description": "Currency symbol that was spent (e.g., EUR, BTC)"
                        },
                        "destination_amount": {
                            "type": "string",
                            "description": "Amount received in the destination pocket (as string for precision)"
                        },
                        "destination_symbol": {
                            "type": "string",
                            "description": "Currency symbol that was received (e.g., BTC, EUR)"
                        },
                        "fee": {
                            "type": "string",
                            "description": "Transaction fee charged (as string for precision)"
                        },
                        "created_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the movement was executed",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "movement_id",
                        "type",
                        "status",
                        "origin_amount",
                        "origin_symbol",
                        "destination_amount",
                        "destination_symbol",
                        "fee",
                        "created_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "wallet_get_cards",
                "type": "READ",
                "desc": "List credit/debit cards registered in Bit2Me. Returns card details including card ID, brand, last 4 digits, expiration date, and alias. Optional card_id filter to retrieve a specific card. Use limit and offset for pagination. [PRIVATE]",
                "args": {
                    "card_id": {
                        "type": "string",
                        "desc": "Card UUID to retrieve details for a specific card (optional, if not specified returns all cards)",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Maximum number of cards to return (default: 10, max: 150)",
                        "required": false,
                        "default": 10
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Number of cards to skip for pagination (default: 0)",
                        "required": false,
                        "default": 0
                    }
                },
                "exampleArgs": {
                    "limit": 10,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "limit": 10,
                        "offset": 0
                    },
                    "result": [
                        {
                            "card_id": "card-uuid-1234",
                            "type": "credit",
                            "brand": "VISA",
                            "country": "ES",
                            "last4": "1234",
                            "expire_month": "12",
                            "expire_year": "2025",
                            "alias": "My Visa Card",
                            "created_at": "2025-12-04T01:31:14.303Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1,
                        "limit": 10,
                        "offset": 0,
                        "has_more": false
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "card_id": {
                                "type": "string",
                                "description": "Unique identifier for the payment card"
                            },
                            "type": {
                                "type": "string",
                                "description": "Card type (e.g., \"credit\", \"debit\")"
                            },
                            "brand": {
                                "type": "string",
                                "description": "Card network brand (e.g., \"visa\", \"mastercard\")"
                            },
                            "country": {
                                "type": "string",
                                "description": "Country code where the card was issued"
                            },
                            "last4": {
                                "type": "string",
                                "description": "Last 4 digits of the card number for identification"
                            },
                            "expire_month": {
                                "type": "string",
                                "description": "Card expiration month (01-12)"
                            },
                            "expire_year": {
                                "type": "string",
                                "description": "Card expiration year (4 digits)"
                            },
                            "alias": {
                                "type": "string",
                                "description": "User-defined alias for the card"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the card was registered",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "card_id",
                            "type",
                            "brand",
                            "country",
                            "last4",
                            "expire_month",
                            "expire_year",
                            "alias",
                            "created_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            }
        ]
    },
    {
        "category": "Wallet (Storage)",
        "id": "cat-wallet",
        "icon": "👛",
        "description": "Tools for managing wallet balances, movements, and addresses. For trading operations and cards, see Broker Tools.",
        "tools": [
            {
                "name": "wallet_get_pockets",
                "type": "READ",
                "desc": "Gets balances, UUIDs, and available funds from Simple Wallet (Broker). Does not include Pro/Earn balance. Returns all pockets of the user. If pocket_id is provided, returns only that specific pocket. IMPORTANT: Users often have MULTIPLE pockets for the same symbol (e.g. multiple EUR pockets). ALWAYS check ALL pockets for a specific symbol to find the one with a positive balance. [PRIVATE]",
                "args": {
                    "pocket_id": {
                        "type": "string",
                        "desc": "Filter by specific pocket UUID. If provided, returns only that pocket.",
                        "required": false
                    },
                    "symbol": {
                        "type": "string",
                        "desc": "Filter by cryptocurrency or fiat symbol (e.g., BTC, EUR)",
                        "required": false
                    }
                },
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": [
                        {
                            "id": "abc123-def456-...",
                            "symbol": "EUR",
                            "balance": "1250.50",
                            "available": "1200.00",
                            "blocked": "50.50",
                            "name": "EUR Wallet",
                            "created_at": "2021-01-19T20:24:59.209Z"
                        },
                        {
                            "id": "def456-abc123-...",
                            "symbol": "BTC",
                            "balance": "0.5",
                            "available": "0.5",
                            "blocked": "0",
                            "name": "BTC Wallet",
                            "created_at": "2021-01-19T20:24:59.209Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 2
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "balance": {
                                "type": "string",
                                "description": "Current balance as string for precision"
                            },
                            "available": {
                                "type": "string",
                                "description": "Available balance as string for precision"
                            },
                            "blocked": {
                                "type": "string",
                                "description": "Blocked balance as string for precision"
                            },
                            "name": {
                                "type": "string",
                                "description": "Human-readable pocket name or currency name"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the pocket was created",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "symbol",
                            "balance",
                            "available",
                            "blocked",
                            "name",
                            "created_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "wallet_get_pocket_addresses",
                "type": "READ",
                "desc": "Lists deposit addresses for a wallet (Pocket) on a specific network. Use wallet_get_networks first to see available networks for a currency. Each network may have different addresses. Returns address, network, and creation date. Use this address to receive deposits on the specified network. [PRIVATE]",
                "args": {
                    "pocket_id": {
                        "type": "string",
                        "desc": "Pocket UUID from wallet_get_pockets",
                        "required": true
                    },
                    "network": {
                        "type": "string",
                        "desc": "Address network (e.g., bitcoin, ethereum, bsc)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "pocket_id": "pocket-uuid-1234-5678",
                    "network": "bitcoin"
                },
                "response": {
                    "request": {
                        "pocket_id": "pocket-uuid-1234-5678",
                        "network": "bitcoin"
                    },
                    "result": [
                        {
                            "id": "addr123-...",
                            "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
                            "network": "bitcoin",
                            "symbol": "BTC",
                            "tag": "",
                            "created_at": "2021-01-19T20:24:59.209Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "address": {
                                "type": "string",
                                "description": "Blockchain address for receiving deposits on the specified network"
                            },
                            "network": {
                                "type": "string",
                                "description": "Blockchain network for deposits/withdrawals (e.g., bitcoin, ethereum, polygon)"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "tag": {
                                "type": "string",
                                "description": "Memo/tag required by some networks (e.g., XRP, XLM)"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was created",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "address",
                            "network",
                            "symbol",
                            "created_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "wallet_get_networks",
                "type": "READ",
                "desc": "Lists available networks for a specific currency. Use this before wallet_get_pocket_addresses to see which networks support deposits for a currency (e.g., bitcoin, ethereum, binanceSmartChain). Returns network ID, name, native currency, fee currency, and whether it requires a tag/memo. [PRIVATE]",
                "args": {
                    "symbol": {
                        "type": "string",
                        "desc": "Cryptocurrency symbol (e.g., BTC, ETH)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "symbol": "BTC"
                },
                "response": {
                    "request": {
                        "symbol": "BTC"
                    },
                    "result": [
                        {
                            "id": "bitcoin",
                            "name": "bitcoin",
                            "native_currency_code": "BTC",
                            "fee_currency_code": "BTC",
                            "has_tag": false
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "name": {
                                "type": "string",
                                "description": "Human-readable pocket name or currency name"
                            },
                            "native_currency_code": {
                                "type": "string",
                                "description": "Symbol of the native currency for this network (e.g., ETH for Ethereum)"
                            },
                            "fee_currency_code": {
                                "type": "string",
                                "description": "Symbol of the currency used to pay network fees"
                            },
                            "has_tag": {
                                "type": "boolean",
                                "description": "If true, deposits require a memo/tag in addition to the address (common for XRP, XLM)"
                            }
                        },
                        "required": [
                            "id",
                            "name",
                            "native_currency_code",
                            "fee_currency_code",
                            "has_tag"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "wallet_get_movements",
                "type": "READ",
                "desc": "History of Wallet operations. Optional movement_id for specific details, symbol filter, limit/offset for pagination. Returns type, amount, symbol, status, date. Status ENUM: pending, completed, failed. [PRIVATE]",
                "args": {
                    "movement_id": {
                        "type": "string",
                        "desc": "Filter by specific movement UUID. If provided, returns only that movement with full details.",
                        "required": false
                    },
                    "symbol": {
                        "type": "string",
                        "desc": "Filter by cryptocurrency or fiat symbol (e.g., BTC, EUR)",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Number of records to return (default: 10)",
                        "required": false,
                        "default": 10
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Offset for pagination (default: 0)",
                        "required": false,
                        "default": 0
                    }
                },
                "exampleArgs": {
                    "symbol": "EUR",
                    "limit": 10,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "symbol": "EUR",
                        "limit": 10,
                        "offset": 0
                    },
                    "result": [
                        {
                            "id": "tx123-...",
                            "date": "2024-11-25T10:30:00.000Z",
                            "type": "deposit",
                            "subtype": "bank_transfer",
                            "status": "completed",
                            "amount": "1000.00",
                            "symbol": "EUR",
                            "origin": {
                                "amount": "1000.00",
                                "symbol": "EUR",
                                "class": "bank"
                            },
                            "destination": {
                                "amount": "1000.00",
                                "symbol": "EUR",
                                "class": "pocket"
                            },
                            "fee": {
                                "amount": "0.00",
                                "symbol": "EUR",
                                "class": "fee"
                            }
                        }
                    ],
                    "metadata": {
                        "total_records": 150,
                        "limit": 10,
                        "offset": 0,
                        "has_more": true
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            },
                            "type": {
                                "type": "string",
                                "description": "Movement type: deposit (incoming funds), withdrawal (outgoing funds), swap (crypto exchange), purchase (buy with fiat), transfer (internal move), fee (charged fee), other",
                                "enum": [
                                    "deposit",
                                    "withdrawal",
                                    "swap",
                                    "purchase",
                                    "transfer",
                                    "fee",
                                    "other"
                                ]
                            },
                            "subtype": {
                                "type": "string",
                                "description": "Specific subtype of the movement for more detail"
                            },
                            "status": {
                                "type": "string",
                                "description": "Movement status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                                "enum": [
                                    "pending",
                                    "completed",
                                    "failed"
                                ]
                            },
                            "amount": {
                                "type": "string",
                                "description": "Amount as string for precision"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "origin": {
                                "type": "object",
                                "description": "Source of the operation (pocket ID or address)"
                            },
                            "destination": {
                                "type": "object",
                                "description": "Destination of the operation (pocket ID or address)"
                            },
                            "fee": {
                                "type": "object",
                                "description": "Fee amount as string for precision"
                            }
                        },
                        "required": [
                            "id",
                            "date",
                            "type",
                            "subtype",
                            "status",
                            "amount",
                            "symbol",
                            "origin",
                            "destination",
                            "fee"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            }
        ]
    },
    {
        "category": "Pro (Advanced Trading)",
        "id": "cat-pro",
        "icon": "📈",
        "description": "Advanced trading tools for Pro Trading. Includes order management, market data (order book, candles, tickers), and fund transfers between Wallet and Pro Trading. Pro Trading offers lower fees and more control than Broker.",
        "tools": [
            {
                "name": "pro_get_balance",
                "type": "READ",
                "desc": "Gets balances from PRO Trading account. This is separate from Simple Wallet - funds must be transferred using pro_deposit/pro_withdraw. Returns available and blocked balances per symbol for trading. [PRIVATE]",
                "args": {},
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": [
                        {
                            "symbol": "BTC",
                            "balance": "0.00689471",
                            "blocked": "0.00011102",
                            "available": "0.00689471"
                        },
                        {
                            "symbol": "EUR",
                            "balance": "27812.0234142",
                            "blocked": "0",
                            "available": "27812.0234142"
                        }
                    ],
                    "metadata": {
                        "total_records": 2
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "balance": {
                                "type": "string",
                                "description": "Current balance as string for precision"
                            },
                            "blocked": {
                                "type": "string",
                                "description": "Amount blocked/reserved for pending operations (as string)"
                            },
                            "available": {
                                "type": "string",
                                "description": "Available balance as string for precision"
                            }
                        },
                        "required": [
                            "symbol",
                            "balance",
                            "blocked",
                            "available"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_open_orders",
                "type": "READ",
                "desc": "View open trading orders in PRO. Returns all active orders (pending, partially filled). If order_id is provided, returns details for that specific order. Optional pair filter to see orders for a specific market. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Filter by specific order UUID. If provided, returns only that order with full details.",
                        "required": false
                    },
                    "pair": {
                        "type": "string",
                        "desc": "Filter by trading pair (e.g., BTC-USD)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD"
                    },
                    "result": [
                        {
                            "id": "order123",
                            "pair": "BTC-USD",
                            "side": "buy",
                            "type": "limit",
                            "amount": "0.1",
                            "price": "75000.00",
                            "status": "pending",
                            "filled_amount": "0",
                            "created_at": "2024-11-25T10:00:00.000Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "pair": {
                                "type": "string",
                                "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                            },
                            "side": {
                                "type": "string",
                                "description": "Order direction: \"buy\" to purchase base currency, \"sell\" to dispose base currency",
                                "enum": [
                                    "buy",
                                    "sell"
                                ]
                            },
                            "type": {
                                "type": "string",
                                "description": "Order type: limit (executes at specified price), market (executes immediately at best price), stop-limit (triggers at stop price)",
                                "enum": [
                                    "limit",
                                    "market",
                                    "stop-limit"
                                ]
                            },
                            "amount": {
                                "type": "string",
                                "description": "Order amount in base currency (as string for precision)"
                            },
                            "price": {
                                "type": "string",
                                "description": "Order price in quote currency (as string for precision). For limit orders, this is the target price"
                            },
                            "status": {
                                "type": "string",
                                "description": "Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)",
                                "enum": [
                                    "open",
                                    "filled",
                                    "cancelled"
                                ]
                            },
                            "filled_amount": {
                                "type": "string",
                                "description": "Amount of the order that has been executed (as string for precision)"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was created",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "pair",
                            "side",
                            "type",
                            "amount",
                            "price",
                            "status",
                            "filled_amount",
                            "created_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_trades",
                "type": "READ",
                "desc": "Gets the user's trade history in Pro Trading. Returns executed trades with price, amount, side (buy/sell), fees, and date. Optional filters: trading pair, side, order type, date range, limit (max 50), offset, and sort order. Use this to review past trading activity. Response is a paginated list with metadata. [PRIVATE]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Filter by trading pair (e.g., BTC-USD)",
                        "required": false
                    },
                    "side": {
                        "type": "string",
                        "desc": "Filter by order direction: buy (purchase) or sell (dispose)",
                        "required": false,
                        "enum": [
                            "buy",
                            "sell"
                        ]
                    },
                    "order_type": {
                        "type": "string",
                        "desc": "Filter by order type (limit, stop-limit, market)",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Maximum number of trades to fetch (max 50, default 50)",
                        "required": false,
                        "default": 50
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Number of records to skip for pagination",
                        "required": false
                    },
                    "sort": {
                        "type": "string",
                        "desc": "Sort order by date (ASC, DESC)",
                        "required": false
                    },
                    "start_date": {
                        "type": "string",
                        "desc": "Filter trades from this date (ISO 8601 format)",
                        "required": false
                    },
                    "end_date": {
                        "type": "string",
                        "desc": "Filter trades until this date (ISO 8601 format)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD",
                    "limit": 10,
                    "offset": 0,
                    "sort": "DESC"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD",
                        "limit": 10,
                        "offset": 0,
                        "sort": "DESC"
                    },
                    "result": [
                        {
                            "id": "trade123",
                            "order_id": "order456",
                            "pair": "BTC-USD",
                            "price": "75869.89",
                            "amount": "0.1",
                            "side": "buy",
                            "order_type": "limit",
                            "fee": "0.75",
                            "fee_symbol": "EUR",
                            "cost": "7586.99",
                            "is_maker": false,
                            "date": "2024-11-25T10:30:00.258Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 150,
                        "limit": 10,
                        "offset": 0,
                        "has_more": true
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "order_id": {
                                "type": "string",
                                "description": "Unique identifier (UUID) for the order",
                                "format": "uuid"
                            },
                            "pair": {
                                "type": "string",
                                "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                            },
                            "price": {
                                "type": "string",
                                "description": "Order price in quote currency (as string for precision). For limit orders, this is the target price"
                            },
                            "amount": {
                                "type": "string",
                                "description": "Amount as string for precision"
                            },
                            "side": {
                                "type": "string",
                                "description": "Order direction: \"buy\" to purchase base currency, \"sell\" to dispose base currency",
                                "enum": [
                                    "buy",
                                    "sell"
                                ]
                            },
                            "order_type": {
                                "type": "string",
                                "description": "Type of order: limit, market, or stop-limit"
                            },
                            "fee": {
                                "type": "string",
                                "description": "Fee amount as string for precision"
                            },
                            "fee_symbol": {
                                "type": "string",
                                "description": "Currency symbol in which the fee was charged"
                            },
                            "cost": {
                                "type": "string",
                                "description": "Total cost of executed trades in quote currency (price × filled_amount)"
                            },
                            "is_maker": {
                                "type": "boolean",
                                "description": "true if the order added liquidity (maker), false if it removed liquidity (taker). Makers typically get lower fees"
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "order_id",
                            "pair",
                            "price",
                            "amount",
                            "side",
                            "order_type",
                            "fee",
                            "fee_symbol",
                            "cost",
                            "is_maker",
                            "date"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_order_trades",
                "type": "READ",
                "desc": "Gets all individual trades (executions) associated with a specific order. Returns detailed execution data including price, amount, fees, and date for each fill. Useful for analyzing how a large order was executed across multiple trades. [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Order UUID to filter or retrieve specific order details",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "order_id": "order-uuid-1234-5678"
                },
                "response": {
                    "request": {
                        "order_id": "order-uuid-1234-5678"
                    },
                    "result": [
                        {
                            "id": "trade123",
                            "order_id": "order456",
                            "pair": "BTC-USD",
                            "price": "75869.89",
                            "amount": "0.1",
                            "fee": "0.75",
                            "date": "2024-11-25T10:30:00.258Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "order_id": {
                                "type": "string",
                                "description": "Unique identifier (UUID) for the order",
                                "format": "uuid"
                            },
                            "pair": {
                                "type": "string",
                                "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                            },
                            "price": {
                                "type": "string",
                                "description": "Order price in quote currency (as string for precision). For limit orders, this is the target price"
                            },
                            "amount": {
                                "type": "string",
                                "description": "Amount as string for precision"
                            },
                            "fee": {
                                "type": "string",
                                "description": "Fee amount as string for precision"
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "order_id",
                            "pair",
                            "price",
                            "amount",
                            "fee",
                            "date"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_create_order",
                "type": "WRITE",
                "desc": "Create Limit/Market/Stop order in PRO Trading. Returns order ID. For Limit orders, 'price' is required. For Stop-Limit orders, both 'price' and 'stop_price' are required. Market orders execute immediately at current price. Use pro_get_open_orders to check order status. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Trading pair in BASE-QUOTE format (e.g., BTC-USD, ETH-EUR)",
                        "required": true
                    },
                    "side": {
                        "type": "string",
                        "desc": "Order direction: buy (purchase base currency) or sell (dispose base currency)",
                        "required": true,
                        "enum": [
                            "buy",
                            "sell"
                        ]
                    },
                    "type": {
                        "type": "string",
                        "desc": "Order type: limit (at specified price), market (immediate at best price), stop-limit (triggers at stop price)",
                        "required": true,
                        "enum": [
                            "limit",
                            "market",
                            "stop-limit"
                        ]
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Order amount in base currency (as string for decimal precision)",
                        "required": true
                    },
                    "price": {
                        "type": "string",
                        "desc": "Limit price in quote currency (required for limit/stop-limit orders)",
                        "required": false
                    },
                    "stop_price": {
                        "type": "string",
                        "desc": "Trigger price for stop-limit orders (order activates when market reaches this price)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD",
                    "side": "buy",
                    "type": "limit",
                    "amount": "0.1",
                    "price": "60000"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD",
                        "side": "buy",
                        "type": "limit",
                        "amount": "0.1",
                        "price": "60000"
                    },
                    "result": {
                        "id": "order123",
                        "pair": "BTC-USD",
                        "side": "buy",
                        "type": "limit",
                        "amount": "0.1",
                        "price": "75000.00",
                        "status": "pending",
                        "created_at": "2024-11-25T10:00:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "pair": {
                            "type": "string",
                            "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                        },
                        "side": {
                            "type": "string",
                            "description": "Order direction: \"buy\" to purchase base currency, \"sell\" to dispose base currency",
                            "enum": [
                                "buy",
                                "sell"
                            ]
                        },
                        "type": {
                            "type": "string",
                            "description": "Order type: limit (executes at specified price), market (executes immediately at best price), stop-limit (triggers at stop price)",
                            "enum": [
                                "limit",
                                "market",
                                "stop-limit"
                            ]
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount as string for precision"
                        },
                        "price": {
                            "type": "string",
                            "description": "Order price in quote currency (as string for precision). For limit orders, this is the target price"
                        },
                        "status": {
                            "type": "string",
                            "description": "Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)",
                            "enum": [
                                "open",
                                "filled",
                                "cancelled"
                            ]
                        },
                        "created_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the resource was created",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "id",
                        "pair",
                        "side",
                        "type",
                        "amount",
                        "price",
                        "status",
                        "created_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "pro_cancel_order",
                "type": "WRITE",
                "desc": "Cancel a specific PRO order by ID. Only open/pending orders can be cancelled. Returns cancellation status. Use pro_get_open_orders first to see which orders can be cancelled. Order status ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired). [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Order UUID to filter or retrieve specific order details",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "order_id": "order-uuid-1234-5678"
                },
                "response": {
                    "request": {
                        "order_id": "order-uuid-1234-5678"
                    },
                    "result": {
                        "id": "order123",
                        "status": "cancelled",
                        "message": "Order cancelled successfully"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "status": {
                            "type": "string",
                            "description": "Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)",
                            "enum": [
                                "open",
                                "filled",
                                "cancelled"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_cancel_all_orders",
                "type": "WRITE",
                "desc": "Cancel all open orders in Pro Trading. Optional pair filter to cancel only orders for a specific market. Returns count of cancelled orders. Use with caution as this affects all pending orders. [PRIVATE]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Filter by trading pair (e.g., BTC-USD)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD"
                    },
                    "result": {
                        "cancelled": 5,
                        "message": "5 orders cancelled successfully"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "cancelled": {
                            "type": "number",
                            "description": "Number of orders cancelled by this operation"
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "cancelled",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_deposit",
                "type": "WRITE",
                "desc": "Deposit funds from Simple Wallet to Pro Trading account. Funds must be available in Simple Wallet first (check with wallet_get_pockets). Transfer is immediate. Use pro_get_balance to verify the deposit. Transfer status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]",
                "args": {
                    "symbol": {
                        "type": "string",
                        "desc": "Symbol - can be cryptocurrency or fiat (e.g., BTC, EUR)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to transfer (as string for decimal precision)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "symbol": "EUR",
                    "amount": "500.00"
                },
                "response": {
                    "request": {
                        "symbol": "EUR",
                        "amount": "500.00"
                    },
                    "result": {
                        "id": "transfer123-...",
                        "symbol": "EUR",
                        "amount": "500.00",
                        "status": "completed",
                        "message": "Deposit successful"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount as string for precision"
                        },
                        "status": {
                            "type": "string",
                            "description": "Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                            "enum": [
                                "pending",
                                "completed",
                                "failed"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "symbol",
                        "amount",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_withdraw",
                "type": "WRITE",
                "desc": "Withdraw funds from Pro Trading account back to Simple Wallet. Funds must be available in Pro Trading (check with pro_get_balance). Transfer is immediate. Use wallet_get_pockets to verify the withdrawal. Transfer status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]",
                "args": {
                    "symbol": {
                        "type": "string",
                        "desc": "Symbol - can be cryptocurrency or fiat (e.g., BTC, EUR)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to transfer (as string for decimal precision)",
                        "required": true
                    },
                    "to_pocket_id": {
                        "type": "string",
                        "desc": "Destination pocket UUID in Simple Wallet (optional)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "symbol": "EUR",
                    "amount": "500.00",
                    "to_pocket_id": "pocket-uuid-1234"
                },
                "response": {
                    "request": {
                        "symbol": "EUR",
                        "amount": "500.00",
                        "to_pocket_id": "pocket-uuid-1234"
                    },
                    "result": {
                        "id": "transfer123-...",
                        "symbol": "EUR",
                        "amount": "500.00",
                        "status": "completed",
                        "message": "Withdrawal successful"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount as string for precision"
                        },
                        "status": {
                            "type": "string",
                            "description": "Transfer status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                            "enum": [
                                "pending",
                                "completed",
                                "failed"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "symbol",
                        "amount",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_market_config",
                "type": "READ",
                "desc": "Gets full market configuration including precision, amounts, prices, fees, and trading status. Use this before placing orders to validate amounts, prices, and understand fee structure. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Filter by trading pair (e.g., BTC-EUR)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-EUR"
                },
                "response": {
                    "request": {
                        "pair": "BTC-EUR"
                    },
                    "result": [
                        {
                            "id": "31fdfac9-a5b2-4efd-ae3f-b578532294e7",
                            "pair": "BTC-EUR",
                            "base_precision": "8",
                            "quote_precision": "2",
                            "min_amount": "0.0001",
                            "max_amount": "100",
                            "min_price": "1000",
                            "max_price": "500000",
                            "min_order_size": "10",
                            "tick_size": "0.01",
                            "fee_maker": "0.1",
                            "fee_taker": "0.2",
                            "status": "active"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "format": "uuid",
                                "description": "Unique market identifier (UUID)"
                            },
                            "pair": {
                                "type": "string",
                                "description": "Trading pair in BASE-QUOTE format (e.g., BTC-EUR)"
                            },
                            "base_precision": {
                                "type": "string",
                                "description": "Decimal places for base currency amounts (e.g., '8' for BTC)"
                            },
                            "quote_precision": {
                                "type": "string",
                                "description": "Decimal places for quote currency prices (e.g., '2' for EUR)"
                            },
                            "min_amount": {
                                "type": "string",
                                "description": "Minimum order amount in base currency"
                            },
                            "max_amount": {
                                "type": "string",
                                "description": "Maximum order amount in base currency"
                            },
                            "min_price": {
                                "type": "string",
                                "description": "Minimum allowed price for limit orders"
                            },
                            "max_price": {
                                "type": "string",
                                "description": "Maximum allowed price for limit orders"
                            },
                            "min_order_size": {
                                "type": "string",
                                "description": "Minimum order value in quote currency"
                            },
                            "tick_size": {
                                "type": "string",
                                "description": "Minimum price increment for limit orders"
                            },
                            "fee_maker": {
                                "type": "string",
                                "description": "Fee percentage for maker orders (adds liquidity)"
                            },
                            "fee_taker": {
                                "type": "string",
                                "description": "Fee percentage for taker orders (removes liquidity)"
                            },
                            "status": {
                                "type": "string",
                                "description": "Market status: active (trading enabled), inactive (trading disabled)",
                                "enum": [
                                    "active",
                                    "inactive"
                                ]
                            }
                        },
                        "required": [
                            "id",
                            "pair",
                            "base_precision",
                            "quote_precision",
                            "min_amount",
                            "max_amount",
                            "min_price",
                            "max_price",
                            "min_order_size",
                            "tick_size",
                            "fee_maker",
                            "fee_taker",
                            "status"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_order_book",
                "type": "READ",
                "desc": "Gets the order book (market depth) for a market showing current buy and sell orders. Requires trading pair (e.g., BTC-USD). Returns bids (buy orders) and asks (sell orders) with prices and amounts. Useful for analyzing market liquidity and determining optimal order prices. Response is a single object. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Trading pair in BASE-QUOTE format (e.g., BTC-USD, ETH-EUR)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD"
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD"
                    },
                    "result": {
                        "pair": "BTC-USD",
                        "bids": [
                            {
                                "price": "75800.00",
                                "amount": "0.5"
                            }
                        ],
                        "asks": [
                            {
                                "price": "75900.00",
                                "amount": "0.8"
                            }
                        ],
                        "date": "2025-11-25T10:30:00.258Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "pair": {
                            "type": "string",
                            "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                        },
                        "bids": {
                            "type": "array",
                            "description": "Array of buy orders sorted by price (highest first). Each bid represents demand at that price level",
                            "items": {
                                "type": {
                                    "type": "object",
                                    "properties": {
                                        "price": {
                                            "type": "string",
                                            "description": "Price as string for precision"
                                        },
                                        "amount": {
                                            "type": "string",
                                            "description": "Amount as string for precision"
                                        }
                                    },
                                    "required": [
                                        "price",
                                        "amount"
                                    ]
                                }
                            }
                        },
                        "asks": {
                            "type": "array",
                            "description": "Array of sell orders sorted by price (lowest first). Each ask represents supply at that price level",
                            "items": {
                                "type": {
                                    "type": "object",
                                    "properties": {
                                        "price": {
                                            "type": "string",
                                            "description": "Price as string for precision"
                                        },
                                        "amount": {
                                            "type": "string",
                                            "description": "Amount as string for precision"
                                        }
                                    },
                                    "required": [
                                        "price",
                                        "amount"
                                    ]
                                }
                            }
                        },
                        "date": {
                            "type": "string",
                            "description": "ISO 8601 date/time when this event occurred",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "pair",
                        "bids",
                        "asks",
                        "date"
                    ]
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_public_trades",
                "type": "READ",
                "desc": "Gets the latest public trades (executed orders) for a market. Requires trading pair (e.g., BTC-USD). Returns recent transactions with price, amount, side (buy/sell), and date. Optional limit (max 50, default: 50) and sort order (ASC/DESC). Useful for seeing recent market activity. Response is a list of trades with metadata. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Trading pair in BASE-QUOTE format (e.g., BTC-USD, ETH-EUR)",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Result limit (max 50, default: 50)",
                        "required": false,
                        "default": 50
                    },
                    "sort": {
                        "type": "string",
                        "desc": "Sort order: ASC (oldest first) or DESC (newest first)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-USD",
                    "limit": 5
                },
                "response": {
                    "request": {
                        "pair": "BTC-USD",
                        "limit": 5
                    },
                    "result": [
                        {
                            "id": "12345",
                            "pair": "BTC-USD",
                            "price": "75869.89",
                            "amount": "0.5",
                            "side": "buy",
                            "date": "2024-11-25T10:30:00.258Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 100,
                        "limit": 5,
                        "sort": "DESC"
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "pair": {
                                "type": "string",
                                "description": "Trading pair in BASE-QUOTE format (e.g., BTC-USD)"
                            },
                            "price": {
                                "type": "string",
                                "description": "Order price in quote currency (as string for precision). For limit orders, this is the target price"
                            },
                            "amount": {
                                "type": "string",
                                "description": "Amount as string for precision"
                            },
                            "side": {
                                "type": "string",
                                "description": "Order direction: \"buy\" to purchase base currency, \"sell\" to dispose base currency",
                                "enum": [
                                    "buy",
                                    "sell"
                                ]
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "id",
                            "pair",
                            "price",
                            "amount",
                            "side",
                            "date"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_candles",
                "type": "READ",
                "desc": "Gets OHLCV (Open, High, Low, Close, Volume) candles for Pro (Advanced Trading). Requires trading pair (e.g., BTC-EUR) and timeframe. Returns price data in specified timeframe with timestamp and date. Optional limit (default: 1000, max: 1000), startTime and endTime (Unix epoch milliseconds). If startTime/endTime not provided, defaults to last 24 hours. Essential for technical analysis and charting. Response is a list of candles with metadata. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Trading pair in BASE-QUOTE format (e.g., BTC-EUR, ETH-USD)",
                        "required": true
                    },
                    "timeframe": {
                        "type": "string",
                        "desc": "Candle interval: 1m (1 min), 5m (5 min), 15m (15 min), 30m (30 min), 1h (1 hour), 4h (4 hours), 1d (1 day), 1w (1 week), 1M (1 month)",
                        "required": true,
                        "enum": [
                            "1m",
                            "5m",
                            "15m",
                            "30m",
                            "1h",
                            "4h",
                            "1d",
                            "1w",
                            "1M"
                        ]
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Maximum number of candles to return (default: 1000, max: 1000)",
                        "required": false,
                        "default": 1000
                    },
                    "startTime": {
                        "type": "number",
                        "desc": "Start time in Unix epoch milliseconds (default: 24 hours before endTime)",
                        "required": false
                    },
                    "endTime": {
                        "type": "number",
                        "desc": "End time in Unix epoch milliseconds (default: current time)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-EUR",
                    "timeframe": "1h",
                    "limit": 100
                },
                "response": {
                    "request": {
                        "pair": "BTC-EUR",
                        "timeframe": "1h",
                        "limit": 100,
                        "startTime": 1715081606087,
                        "endTime": 1715168006087
                    },
                    "result": [
                        {
                            "date": "2024-11-25T10:00:00.000Z",
                            "open": "75800.00",
                            "high": "76100.00",
                            "low": "75600.00",
                            "close": "75869.89",
                            "volume": "125.5"
                        }
                    ],
                    "metadata": {
                        "total_records": 100,
                        "limit": 5,
                        "timeframe": "1h",
                        "pair": "BTC-USD"
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            },
                            "open": {
                                "type": "string",
                                "description": "Opening price at the start of the time period"
                            },
                            "high": {
                                "type": "string",
                                "description": "Highest price reached during the time period"
                            },
                            "low": {
                                "type": "string",
                                "description": "Lowest price reached during the time period"
                            },
                            "close": {
                                "type": "string",
                                "description": "Closing price at the end of the time period"
                            },
                            "volume": {
                                "type": "string",
                                "description": "Total volume traded during the time period"
                            }
                        },
                        "required": [
                            "date",
                            "open",
                            "high",
                            "low",
                            "close",
                            "volume"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "pro_get_ticker",
                "type": "READ",
                "desc": "Get ticker information (OHLCV, current best bid and ask, percentage versus price 24 hours ago) for all markets or by requested market symbol. The data refers to the last 24 hours from the date indicated. Optional pair filter for a specific market. Returns ticker data with open, close, bid, ask, high, low, volumes, and percentage change. [PUBLIC]",
                "args": {
                    "pair": {
                        "type": "string",
                        "desc": "Filter by trading pair (e.g., BTC-EUR). If not provided, returns all markets.",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "pair": "BTC-EUR"
                },
                "response": {
                    "request": {
                        "pair": "BTC-EUR"
                    },
                    "result": [
                        {
                            "symbol": "BTC/EUR",
                            "open": "59692.2",
                            "close": "59459.3",
                            "bid": "59459.3",
                            "ask": "59459.4",
                            "high": "59807.8",
                            "low": "58259",
                            "baseVolume": "506.2471485105999",
                            "percentage": "-0.39",
                            "quoteVolume": "30160053.557880376",
                            "date": "2024-05-07T10:00:06.087Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "Market symbol in BASE/QUOTE format (e.g., BTC/EUR)"
                            },
                            "open": {
                                "type": "string",
                                "description": "Opening price (price 24 hours ago)"
                            },
                            "close": {
                                "type": "string",
                                "description": "Closing price (last trade price)"
                            },
                            "bid": {
                                "type": "string",
                                "description": "Highest price a buyer will pay for order"
                            },
                            "ask": {
                                "type": "string",
                                "description": "Lowest price a seller will take for order"
                            },
                            "high": {
                                "type": "string",
                                "description": "Highest price in the last 24 hours"
                            },
                            "low": {
                                "type": "string",
                                "description": "Lowest price in the last 24 hours"
                            },
                            "baseVolume": {
                                "type": "string",
                                "description": "Volume traded in terms of the base currency"
                            },
                            "percentage": {
                                "type": "string",
                                "description": "Percentage of current price versus opening price"
                            },
                            "quoteVolume": {
                                "type": "string",
                                "description": "Volume traded in terms of the quote currency"
                            },
                            "date": {
                                "type": "string",
                                "description": "ISO 8601 date/time when this event occurred",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "symbol",
                            "open",
                            "close",
                            "bid",
                            "ask",
                            "high",
                            "low",
                            "baseVolume",
                            "percentage",
                            "quoteVolume",
                            "date"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            }
        ]
    },
    {
        "category": "Earn (Staking)",
        "id": "cat-earn",
        "icon": "💰",
        "description": "Staking and yield generation tools. Deposit crypto to earn rewards, view positions, track movements, and manage reward configurations. Positions represent locked funds generating yield, different from Wallet pockets.",
        "tools": [
            {
                "name": "earn_get_summary",
                "type": "READ",
                "desc": "View summary of accumulated rewards in Staking/Earn. Returns total rewards earned across all Earn positions, breakdown by symbol, and overall performance. Use this to see your total staking rewards. [PRIVATE]",
                "args": {},
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": [
                        {
                            "symbol": "BTC",
                            "total_balance": "0.5",
                            "total_rewards": "0.0001"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "total_balance": {
                                "type": "string",
                                "description": "Total balance across all positions (as string for precision)"
                            },
                            "total_rewards": {
                                "type": "string",
                                "description": "Total rewards earned (as string for precision)"
                            }
                        },
                        "required": [
                            "symbol",
                            "total_balance",
                            "total_rewards"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_positions",
                "type": "READ",
                "desc": "List active Earn positions/strategies. Optional position_id filter for specific position. Returns position_id, symbol, balance, strategy (fixed/flexible), lock_period, converted_balance, and timestamps. Use earn_get_assets for APY rates. Note: Positions are locked/yielding funds, different from Pockets (liquid funds). [PRIVATE]",
                "args": {
                    "position_id": {
                        "type": "string",
                        "desc": "Filter by specific position UUID. If provided, returns only that position.",
                        "required": false
                    }
                },
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": [
                        {
                            "position_id": "ce2bb790-f538-4d04-8acd-f3473044e703",
                            "symbol": "B2M",
                            "balance": "25865004.93005867",
                            "strategy": "fixed",
                            "lock_period": {
                                "lock_period_id": "bfbc04b5-b7f8-4060-8ec0-bb2c924851b5",
                                "months": 12
                            },
                            "converted_balance": {
                                "value": "269293.50",
                                "symbol": "EUR"
                            },
                            "created_at": "2024-06-24T11:59:28.905Z",
                            "updated_at": "2025-12-04T11:05:54.389Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "position_id": {
                                "type": "string",
                                "description": "Earn position unique identifier"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, B2M)"
                            },
                            "balance": {
                                "type": "string",
                                "description": "Current balance as string for precision"
                            },
                            "strategy": {
                                "type": "string",
                                "description": "Staking strategy (e.g., flexible, fixed)"
                            },
                            "lock_period": {
                                "type": "object",
                                "description": "Lock period information (if applicable)",
                                "properties": {
                                    "lock_period_id": {
                                        "type": "string",
                                        "description": "Unique identifier for this lock period configuration"
                                    },
                                    "months": {
                                        "type": "number",
                                        "description": "Duration of the lock period in months"
                                    }
                                }
                            },
                            "converted_balance": {
                                "type": "object",
                                "description": "Balance converted to fiat currency",
                                "properties": {
                                    "value": {
                                        "type": "string",
                                        "description": "Balance converted to fiat currency (as string for precision)"
                                    },
                                    "symbol": {
                                        "type": "string",
                                        "description": "Fiat currency symbol (e.g., EUR, USD)"
                                    }
                                }
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the wallet was created",
                                "format": "date-time"
                            },
                            "updated_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the wallet was last updated",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "position_id",
                            "symbol",
                            "balance",
                            "strategy"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_position_movements",
                "type": "READ",
                "desc": "Get movement history of a specific Earn position. Returns movements with type (deposit, withdrawal, reward, fee), amounts, dates, and status. Optional limit and offset for pagination. Use earn_get_positions first to get the position ID. Response is a paginated list with metadata. [PRIVATE]",
                "args": {
                    "position_id": {
                        "type": "string",
                        "desc": "Earn position UUID from earn_get_positions",
                        "required": true
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Maximum number of records to return",
                        "required": false
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Number of records to skip for pagination",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "position_id": "earn-position-uuid-1234",
                    "limit": 10,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "position_id": "earn-position-uuid-1234",
                        "limit": 10,
                        "offset": 0
                    },
                    "result": [
                        {
                            "id": "mov123-...",
                            "type": "deposit",
                            "symbol": "BTC",
                            "amount": "0.1",
                            "created_at": "2024-11-25T10:30:00.000Z",
                            "position_id": "earn123-...",
                            "status": "completed"
                        }
                    ],
                    "metadata": {
                        "total_records": 25,
                        "limit": 10,
                        "offset": 0,
                        "has_more": true
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "type": {
                                "type": "string",
                                "description": "Earn movement type: deposit (funds added to staking), withdrawal (funds removed), reward (yield earned), fee (charged fee)",
                                "enum": [
                                    "deposit",
                                    "withdrawal",
                                    "reward",
                                    "fee"
                                ]
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "amount": {
                                "type": "string",
                                "description": "Amount as string for precision"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was created",
                                "format": "date-time"
                            },
                            "position_id": {
                                "type": "string",
                                "description": "Unique identifier (UUID) for the Earn position",
                                "format": "uuid"
                            },
                            "status": {
                                "type": "string",
                                "description": "Market/position status: open (active), filled (completed), cancelled (terminated), inactive (paused)",
                                "enum": [
                                    "open",
                                    "filled",
                                    "cancelled",
                                    "inactive"
                                ]
                            }
                        },
                        "required": [
                            "id",
                            "type",
                            "symbol",
                            "amount",
                            "created_at",
                            "position_id",
                            "status"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_movements",
                "type": "READ",
                "desc": "Get movement history across all Earn positions. Returns movements with type (deposit, reward, withdrawal, discount-funds, discount-rewards, fee), amounts, dates, rates, source, and issuer information. Supports filtering by symbol, position_id, type (deposit, reward, withdrawal, discount-funds, discount-rewards), date range, and pagination. All parameters are optional. Response is a paginated list with metadata. [PRIVATE]",
                "args": {
                    "user_symbol": {
                        "type": "string",
                        "desc": "User's symbol for conversion",
                        "required": false
                    },
                    "symbol": {
                        "type": "string",
                        "desc": "Filter by specific symbol",
                        "required": false
                    },
                    "related_symbol": {
                        "type": "string",
                        "desc": "Filter by related asset symbol (e.g., BTC, ETH)",
                        "required": false
                    },
                    "position_id": {
                        "type": "string",
                        "desc": "Filter by Earn position UUID",
                        "required": false
                    },
                    "start_date": {
                        "type": "string",
                        "desc": "Start date-time (ISO 8601)",
                        "required": false
                    },
                    "end_date": {
                        "type": "string",
                        "desc": "End date filter (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)",
                        "required": false
                    },
                    "type": {
                        "type": "string",
                        "desc": "Filter by movement type. Valid values: deposit, reward, withdrawal, discount-funds, discount-rewards",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Maximum results (default: 20, max: 100)",
                        "required": false,
                        "default": 20
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Pagination offset (default: 0)",
                        "required": false,
                        "default": 0
                    },
                    "sort_by": {
                        "type": "string",
                        "desc": "Field to sort results by (default: createdAt)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "symbol": "BTC",
                    "limit": 20,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "symbol": "BTC",
                        "limit": 20,
                        "offset": 0
                    },
                    "result": [
                        {
                            "id": "mov123-...",
                            "type": "deposit",
                            "created_at": "2024-11-25T10:30:00.000Z",
                            "position_id": "earn123-...",
                            "amount": {
                                "value": "0.1",
                                "symbol": "BTC"
                            },
                            "rate": {
                                "amount": {
                                    "value": "75869.89",
                                    "symbol": "EUR"
                                },
                                "pair": "BTC-USD"
                            },
                            "converted_amount": {
                                "value": "7586.99",
                                "symbol": "EUR"
                            },
                            "source": {
                                "pocket_id": "pocket123-...",
                                "symbol": "BTC"
                            },
                            "issuer": {
                                "id": "issuer123",
                                "name": "Bit2Me",
                                "integrator": "bit2me"
                            }
                        }
                    ],
                    "metadata": {
                        "total_records": 100,
                        "limit": 20,
                        "offset": 0,
                        "has_more": true
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique identifier (UUID)",
                                "format": "uuid"
                            },
                            "type": {
                                "type": "string",
                                "description": "Earn movement type: deposit (funds added), reward (yield earned), withdrawal (funds removed), discount-funds, discount-rewards, fee (charged fee)",
                                "enum": [
                                    "deposit",
                                    "reward",
                                    "withdrawal",
                                    "discount-funds",
                                    "discount-rewards",
                                    "fee"
                                ]
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was created",
                                "format": "date-time"
                            },
                            "position_id": {
                                "type": "string",
                                "description": "Unique identifier (UUID) for the Earn position",
                                "format": "uuid"
                            },
                            "amount": {
                                "type": "object",
                                "description": "Amount as string for precision"
                            },
                            "rate": {
                                "type": "object",
                                "description": "Exchange rate as string for precision"
                            },
                            "converted_amount": {
                                "type": "object",
                                "description": "Amount converted to fiat currency (as string for precision)"
                            },
                            "source": {
                                "type": "object",
                                "description": "Source or origin of the operation"
                            },
                            "issuer": {
                                "type": "object",
                                "description": "Entity that issued or initiated the operation"
                            }
                        },
                        "required": [
                            "id",
                            "type",
                            "created_at",
                            "wallet_id",
                            "amount",
                            "rate",
                            "converted_amount",
                            "source",
                            "issuer"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_movements_summary",
                "type": "READ",
                "desc": "Get summary statistics of Earn movements filtered by type. Valid type values: deposit, reward, withdrawal, discount-funds, discount-rewards. Returns total count, total amounts, and aggregated data for the specified movement type across all Earn positions. [PRIVATE]",
                "args": {
                    "type": {
                        "type": "string",
                        "desc": "Movement type. Valid values: deposit, reward, withdrawal, discount-funds, discount-rewards",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "type": "deposit"
                },
                "response": {
                    "request": {
                        "type": "deposit"
                    },
                    "result": {
                        "type": "deposit",
                        "total_amount": "1.5",
                        "total_count": 10,
                        "symbol": "BTC"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "description": "Movement type for this summary: deposit (funds added), reward (earned yield), withdrawal (funds removed), discount-funds, discount-rewards",
                            "enum": [
                                "deposit",
                                "reward",
                                "withdrawal",
                                "discount-funds",
                                "discount-rewards"
                            ]
                        },
                        "total_amount": {
                            "type": "string",
                            "description": "Sum of all amounts in this summary (as string for precision)"
                        },
                        "total_count": {
                            "type": "number",
                            "description": "Total number of items in this summary"
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                        }
                    },
                    "required": [
                        "type",
                        "total_amount",
                        "total_count",
                        "symbol"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_rewards_config",
                "type": "READ",
                "desc": "Get global rewards configuration for Earn/Staking. Returns position rewards configuration including position_id, user_id, symbol, lock_period_id, reward_symbol, and timestamps. Use this to understand reward configuration for all positions. [PRIVATE]",
                "args": {},
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": [
                        {
                            "wallet_id": "990467e1-c815-4f5c-a09b-23d0e85f6039",
                            "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                            "symbol": "B2M",
                            "lock_period_id": null,
                            "reward_symbol": "B2M",
                            "created_at": "2021-12-29T11:05:05.376Z",
                            "updated_at": "2025-07-02T13:37:26.141Z"
                        },
                        {
                            "wallet_id": "d3841daf-b619-4903-838c-032f31fbd593",
                            "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                            "symbol": "B3X",
                            "lock_period_id": null,
                            "reward_symbol": "B3X",
                            "created_at": "2022-09-13T20:36:21.065Z",
                            "updated_at": "2025-07-02T13:37:26.141Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 2
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "position_id": {
                                "type": "string",
                                "description": "Unique identifier (UUID) for the Earn position",
                                "format": "uuid"
                            },
                            "user_id": {
                                "type": "string",
                                "description": "User identifier who owns the wallet"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                            },
                            "lock_period_id": {
                                "type": "string",
                                "description": "Identifier for the staking lock period configuration",
                                "nullable": true
                            },
                            "reward_symbol": {
                                "type": "string",
                                "description": "Currency symbol in which staking rewards are paid"
                            },
                            "created_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was created",
                                "format": "date-time"
                            },
                            "updated_at": {
                                "type": "string",
                                "description": "ISO 8601 date/time when the resource was last updated",
                                "format": "date-time"
                            }
                        },
                        "required": [
                            "position_id",
                            "user_id",
                            "symbol",
                            "reward_symbol",
                            "created_at",
                            "updated_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_position_rewards_config",
                "type": "READ",
                "desc": "Get rewards configuration for a specific Earn position. Returns reward calculation rules, APY details, and position-specific staking parameters. Use earn_get_positions first to get the position ID. [PRIVATE]",
                "args": {
                    "position_id": {
                        "type": "string",
                        "desc": "Earn position UUID from earn_get_positions",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "position_id": "earn-position-uuid-1234"
                },
                "response": {
                    "request": {
                        "position_id": "earn-position-uuid-1234"
                    },
                    "result": {
                        "wallet_id": "f482981e-6f8e-4d43-841d-8585a1021f94",
                        "user_id": "ff8c6ea1-5783-4a86-beca-3b44e40e7d0b",
                        "symbol": "DOT",
                        "lock_period_id": null,
                        "reward_symbol": "B2M",
                        "created_at": "2025-04-23T04:00:32.551Z",
                        "updated_at": "2025-07-02T13:37:26.141Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "position_id": {
                            "type": "string",
                            "description": "Unique identifier (UUID) for the Earn position",
                            "format": "uuid"
                        },
                        "user_id": {
                            "type": "string",
                            "description": "User identifier who owns the wallet"
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                        },
                        "lock_period_id": {
                            "type": "string",
                            "description": "Identifier for the staking lock period configuration",
                            "nullable": true
                        },
                        "reward_symbol": {
                            "type": "string",
                            "description": "Currency symbol in which staking rewards are paid"
                        },
                        "created_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the resource was created",
                            "format": "date-time"
                        },
                        "updated_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the resource was last updated",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "wallet_id",
                        "user_id",
                        "symbol",
                        "reward_symbol",
                        "created_at",
                        "updated_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_get_position_rewards_summary",
                "type": "READ",
                "desc": "Get rewards summary for a specific Earn position. Returns reward symbol, reward amount, and converted reward amount in fiat currency. Use earn_get_positions first to get the position ID. Optional user_currency parameter to specify the fiat currency for conversion (default: EUR). [PRIVATE]",
                "args": {
                    "position_id": {
                        "type": "string",
                        "desc": "Earn position UUID from earn_get_positions",
                        "required": true
                    },
                    "user_currency": {
                        "type": "string",
                        "desc": "Fiat currency for conversion (e.g., EUR, USD). Optional, defaults to EUR.",
                        "required": false,
                        "default": "EUR"
                    }
                },
                "exampleArgs": {
                    "position_id": "earn-position-uuid-1234",
                    "user_currency": "EUR"
                },
                "response": {
                    "request": {
                        "position_id": "earn-position-uuid-1234",
                        "user_currency": "EUR"
                    },
                    "result": {
                        "reward_symbol": "B2M",
                        "reward_amount": "3861562.41527785",
                        "reward_converted_symbol": "EUR",
                        "reward_converted_amount": "46361.57588988"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "reward_symbol": {
                            "type": "string",
                            "description": "Currency symbol in which staking rewards are paid"
                        },
                        "reward_amount": {
                            "type": "string",
                            "description": "Total accumulated rewards amount (as string for precision)"
                        },
                        "reward_converted_symbol": {
                            "type": "string",
                            "description": "Fiat currency symbol for the converted reward amount"
                        },
                        "reward_converted_amount": {
                            "type": "string",
                            "description": "Reward amount converted to fiat currency (as string for precision)"
                        }
                    },
                    "required": [
                        "reward_symbol",
                        "reward_amount",
                        "reward_converted_symbol",
                        "reward_converted_amount"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "earn_deposit",
                "type": "WRITE",
                "desc": "Deposit funds from Simple Wallet pocket to Earn (Staking). Funds will start earning rewards based on the asset's APY. Returns operation details with type: deposit. Use wallet_get_pockets to find your pocket ID and earn_get_positions to see available Earn strategies. Operation status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]",
                "args": {
                    "pocket_id": {
                        "type": "string",
                        "desc": "Source pocket UUID from Simple Wallet",
                        "required": true
                    },
                    "symbol": {
                        "type": "string",
                        "desc": "Cryptocurrency symbol (e.g., BTC, ETH)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to deposit into Earn (as string for decimal precision)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "pocket_id": "pocket-uuid-1234",
                    "symbol": "BTC",
                    "amount": "0.1"
                },
                "response": {
                    "request": {
                        "pocket_id": "pocket-uuid-1234",
                        "symbol": "BTC",
                        "amount": "0.1"
                    },
                    "result": {
                        "id": "mov123-...",
                        "type": "deposit",
                        "symbol": "BTC",
                        "amount": "0.1",
                        "status": "completed",
                        "message": "Deposit successful"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID) for this deposit operation",
                            "format": "uuid"
                        },
                        "type": {
                            "type": "string",
                            "description": "Operation type: always 'deposit' for this endpoint",
                            "enum": [
                                "deposit"
                            ]
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Cryptocurrency symbol deposited (e.g., BTC, ETH)"
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount deposited (as string for precision)"
                        },
                        "status": {
                            "type": "string",
                            "description": "Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                            "enum": [
                                "pending",
                                "completed",
                                "failed"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "type",
                        "symbol",
                        "amount",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "earn_withdraw",
                "type": "WRITE",
                "desc": "Withdraw funds from Earn (Staking) back to Simple Wallet pocket. Funds will stop earning rewards after withdrawal. Returns operation details with type: withdrawal. Use earn_get_positions to check your Earn balance. Operation status ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled). [PRIVATE]",
                "args": {
                    "pocket_id": {
                        "type": "string",
                        "desc": "Destination pocket UUID in Simple Wallet",
                        "required": true
                    },
                    "symbol": {
                        "type": "string",
                        "desc": "Cryptocurrency symbol (e.g., BTC, ETH)",
                        "required": true
                    },
                    "amount": {
                        "type": "string",
                        "desc": "Amount to withdraw from Earn (as string for decimal precision)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "pocket_id": "pocket-uuid-1234",
                    "symbol": "BTC",
                    "amount": "0.1"
                },
                "response": {
                    "request": {
                        "pocket_id": "pocket-uuid-1234",
                        "symbol": "BTC",
                        "amount": "0.1"
                    },
                    "result": {
                        "id": "mov123-...",
                        "type": "withdrawal",
                        "symbol": "BTC",
                        "amount": "0.1",
                        "status": "completed",
                        "message": "Withdrawal successful"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID) for this withdrawal operation",
                            "format": "uuid"
                        },
                        "type": {
                            "type": "string",
                            "description": "Operation type: always 'withdrawal' for this endpoint",
                            "enum": [
                                "withdrawal"
                            ]
                        },
                        "symbol": {
                            "type": "string",
                            "description": "Cryptocurrency symbol withdrawn (e.g., BTC, ETH)"
                        },
                        "amount": {
                            "type": "string",
                            "description": "Amount withdrawn (as string for precision)"
                        },
                        "status": {
                            "type": "string",
                            "description": "Operation status. ENUM: pending (operation in progress), completed (successfully finished), failed (operation failed or was cancelled)",
                            "enum": [
                                "pending",
                                "completed",
                                "failed"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "type",
                        "symbol",
                        "amount",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "earn_get_assets",
                "type": "READ",
                "desc": "Get list of assets (cryptocurrencies) supported in Earn/Staking with full details. Returns symbols, APY rates, availability status, lock period options, and reward currencies. Use this to discover stakeable assets, verify availability before deposit/withdrawal, and compare returns. [PUBLIC]",
                "args": {},
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": {
                        "assets": [
                            {
                                "symbol": "BTC",
                                "name": "Bitcoin",
                                "disabled": false,
                                "deposit_disabled": false,
                                "withdrawal_disabled": false,
                                "is_new": false,
                                "lock_periods": [
                                    {
                                        "id": "flexible",
                                        "months": 0
                                    },
                                    {
                                        "id": "3m",
                                        "months": 3
                                    }
                                ],
                                "reward_currencies": [
                                    "BTC",
                                    "B2M"
                                ],
                                "apy": {
                                    "daily_yield_ratio": "0.0001",
                                    "weekly_yield_ratio": "0.0007",
                                    "monthly_yield_ratio": "0.0030"
                                }
                            }
                        ]
                    },
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "assets": {
                            "type": "array",
                            "description": "List of cryptocurrencies available for staking with full details",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "symbol": {
                                        "type": "string",
                                        "description": "Cryptocurrency symbol in uppercase (e.g., BTC, ETH)"
                                    },
                                    "name": {
                                        "type": "string",
                                        "description": "Full name of the cryptocurrency (e.g., Bitcoin, Ethereum)"
                                    },
                                    "disabled": {
                                        "type": "boolean",
                                        "description": "Whether the asset is globally disabled for staking"
                                    },
                                    "deposit_disabled": {
                                        "type": "boolean",
                                        "description": "Whether deposits are currently disabled. Check before attempting earn_deposit."
                                    },
                                    "withdrawal_disabled": {
                                        "type": "boolean",
                                        "description": "Whether withdrawals are currently disabled. Check before attempting earn_withdraw."
                                    },
                                    "is_new": {
                                        "type": "boolean",
                                        "description": "Whether this is a newly added asset"
                                    },
                                    "lock_periods": {
                                        "type": "array",
                                        "description": "Available lock period options. months=0 means flexible (no lock).",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "id": {
                                                    "type": "string",
                                                    "description": "Lock period identifier"
                                                },
                                                "months": {
                                                    "type": "number",
                                                    "description": "Lock duration in months (0 = flexible/no lock)"
                                                }
                                            }
                                        }
                                    },
                                    "reward_currencies": {
                                        "type": "array",
                                        "description": "Currencies in which rewards can be received (e.g., same token or B2M)",
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "level_extra_yield_percentage": {
                                        "type": "number",
                                        "description": "Extra yield percentage based on user level"
                                    },
                                    "apy": {
                                        "type": "object",
                                        "description": "Annual Percentage Yield rates",
                                        "properties": {
                                            "daily_yield_ratio": {
                                                "type": "string",
                                                "description": "Daily yield as decimal (1.0 = 100%)"
                                            },
                                            "weekly_yield_ratio": {
                                                "type": "string",
                                                "description": "Weekly yield as decimal (1.0 = 100%)"
                                            },
                                            "monthly_yield_ratio": {
                                                "type": "string",
                                                "description": "Monthly yield as decimal (1.0 = 100%)"
                                            }
                                        }
                                    }
                                },
                                "required": [
                                    "symbol",
                                    "disabled",
                                    "deposit_disabled",
                                    "withdrawal_disabled",
                                    "is_new"
                                ]
                            }
                        }
                    }
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            }
        ]
    },
    {
        "category": "Loans",
        "id": "cat-loan",
        "icon": "🏦",
        "description": "Crypto-backed loan tools. Use cryptocurrency as collateral to borrow funds. Manage loans, simulate LTV scenarios, track movements, and adjust guarantees. Lower LTV means lower risk.",
        "tools": [
            {
                "name": "loan_get_simulation",
                "type": "READ",
                "desc": "Simulate loan LTV and APR. Provide guarantee_amount OR loan_amount (other is calculated). Requires guarantee_symbol (crypto), loan_symbol, user_symbol (fiat). Returns amounts, LTV ratio (1.0=100%, lower=safer), and APR. Use before loan_create. [PUBLIC]",
                "args": {
                    "guarantee_symbol": {
                        "type": "string",
                        "desc": "Guarantee cryptocurrency symbol (e.g., BTC)",
                        "required": false
                    },
                    "loan_symbol": {
                        "type": "string",
                        "desc": "Loan currency symbol (e.g., USDC, EURC, EUR). Can be any supported currency.",
                        "required": false
                    },
                    "user_symbol": {
                        "type": "string",
                        "desc": "User's symbol (e.g., EUR)",
                        "required": false
                    },
                    "guarantee_amount": {
                        "type": "string",
                        "desc": "Guarantee amount (optional if loan_amount is given)",
                        "required": false
                    },
                    "loan_amount": {
                        "type": "string",
                        "desc": "Loan amount (optional if guarantee_amount is given)",
                        "required": false
                    }
                },
                "exampleArgs": {
                    "guarantee_symbol": "BTC",
                    "loan_symbol": "EUR",
                    "user_symbol": "EUR",
                    "guarantee_amount": "1.0"
                },
                "response": {
                    "request": {
                        "guarantee_symbol": "BTC",
                        "loan_symbol": "EUR",
                        "user_symbol": "EUR",
                        "guarantee_amount": "1.0"
                    },
                    "result": {
                        "guarantee_symbol": "BTC",
                        "guarantee_amount": "0.5678",
                        "guarantee_amount_converted": "57000.34",
                        "loan_symbol": "USDC",
                        "loan_amount": "1250.34",
                        "loan_amount_converted": "1300.34",
                        "user_symbol": "EUR",
                        "ltv": "0.5",
                        "apr": "13.12"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "guarantee_symbol": {
                            "type": "string",
                            "description": "Cryptocurrency symbol used as collateral (e.g., BTC, ETH)"
                        },
                        "guarantee_amount": {
                            "type": "string",
                            "description": "Amount of collateral deposited (as string for precision)"
                        },
                        "guarantee_amount_converted": {
                            "type": "string",
                            "description": "guarantee amount converted"
                        },
                        "loan_symbol": {
                            "type": "string",
                            "description": "Currency symbol in which the loan is denominated (e.g., USDC, EUR)"
                        },
                        "loan_amount": {
                            "type": "string",
                            "description": "Principal loan amount (as string for precision)"
                        },
                        "loan_amount_converted": {
                            "type": "string",
                            "description": "Loan amount converted to user currency (as string for precision)"
                        },
                        "user_symbol": {
                            "type": "string",
                            "description": "User's preferred fiat currency symbol for conversions"
                        },
                        "ltv": {
                            "type": "string",
                            "description": "Loan-to-Value ratio as string (1.0 = 100%)"
                        },
                        "apr": {
                            "type": "string",
                            "description": "Annual Percentage Rate as string"
                        }
                    },
                    "required": [
                        "guarantee_symbol",
                        "guarantee_amount",
                        "guarantee_amount_converted",
                        "loan_symbol",
                        "loan_amount",
                        "loan_amount_converted",
                        "user_symbol",
                        "ltv",
                        "apr"
                    ]
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "loan_get_config",
                "type": "READ",
                "desc": "Get currency configuration for loans. Returns two separate arrays: guarantee_currencies (cryptocurrencies that can be used as collateral with LTV limits) and loan_currencies (currencies available for borrowing with APR, liquidity, and min/max amounts). Use guarantee currencies as collateral to receive loan currencies. Use this before creating a loan to understand available options and limits. [PUBLIC]",
                "args": {},
                "exampleArgs": {},
                "response": {
                    "request": {},
                    "result": {
                        "guarantee_currencies": [
                            {
                                "symbol": "BTC",
                                "enabled": true,
                                "liquidation_ltv": "0.8500",
                                "initial_ltv": "0.5000",
                                "created_at": "2024-07-16T15:49:30.646Z",
                                "updated_at": "2024-07-16T15:49:30.646Z"
                            },
                            {
                                "symbol": "ETH",
                                "enabled": true,
                                "liquidation_ltv": "0.8000",
                                "initial_ltv": "0.4500",
                                "created_at": "2024-07-16T15:49:30.646Z",
                                "updated_at": "2024-07-16T15:49:30.646Z"
                            }
                        ],
                        "loan_currencies": [
                            {
                                "symbol": "USDC",
                                "enabled": true,
                                "liquidity": "250000.000000000000000000",
                                "liquidity_status": "high",
                                "apr": "0.130000000000000000",
                                "minimum_amount": "100.000000000000000000",
                                "maximum_amount": "250000.000000000000000000",
                                "created_at": "2024-07-16T15:49:30.646Z",
                                "updated_at": "2024-07-16T15:49:30.646Z"
                            },
                            {
                                "symbol": "EURC",
                                "enabled": true,
                                "liquidity": "150000.000000000000000000",
                                "liquidity_status": "medium",
                                "apr": "0.120000000000000000",
                                "minimum_amount": "50.000000000000000000",
                                "maximum_amount": "150000.000000000000000000",
                                "created_at": "2024-07-16T15:49:30.646Z",
                                "updated_at": "2024-07-16T15:49:30.646Z"
                            }
                        ]
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "guarantee_currencies": {
                            "type": "array",
                            "description": "List of cryptocurrencies that can be used as loan collateral",
                            "items": {
                                "type": {
                                    "type": "object",
                                    "properties": {
                                        "symbol": {
                                            "type": "string",
                                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                                        },
                                        "enabled": {
                                            "type": "boolean",
                                            "description": "Whether the resource is enabled"
                                        },
                                        "liquidation_ltv": {
                                            "type": "string",
                                            "description": "liquidation ltv"
                                        },
                                        "initial_ltv": {
                                            "type": "string",
                                            "description": "initial ltv"
                                        },
                                        "created_at": {
                                            "type": "string",
                                            "description": "ISO 8601 date/time when the resource was created",
                                            "format": "date-time"
                                        },
                                        "updated_at": {
                                            "type": "string",
                                            "description": "ISO 8601 date/time when the resource was last updated",
                                            "format": "date-time"
                                        }
                                    },
                                    "required": [
                                        "symbol",
                                        "enabled",
                                        "liquidation_ltv",
                                        "initial_ltv",
                                        "created_at",
                                        "updated_at"
                                    ]
                                }
                            }
                        },
                        "loan_currencies": {
                            "type": "array",
                            "description": "List of currencies available for borrowing",
                            "items": {
                                "type": {
                                    "type": "object",
                                    "properties": {
                                        "symbol": {
                                            "type": "string",
                                            "description": "Asset symbol in uppercase (e.g., BTC, ETH, EUR)"
                                        },
                                        "enabled": {
                                            "type": "boolean",
                                            "description": "Whether the resource is enabled"
                                        },
                                        "liquidity": {
                                            "type": "string",
                                            "description": "liquidity"
                                        },
                                        "liquidity_status": {
                                            "type": "string",
                                            "description": "liquidity status"
                                        },
                                        "apr": {
                                            "type": "string",
                                            "description": "Annual Percentage Rate as string"
                                        },
                                        "minimum_amount": {
                                            "type": "string",
                                            "description": "minimum amount"
                                        },
                                        "maximum_amount": {
                                            "type": "string",
                                            "description": "maximum amount"
                                        },
                                        "created_at": {
                                            "type": "string",
                                            "description": "ISO 8601 date/time when the resource was created",
                                            "format": "date-time"
                                        },
                                        "updated_at": {
                                            "type": "string",
                                            "description": "ISO 8601 date/time when the resource was last updated",
                                            "format": "date-time"
                                        }
                                    },
                                    "required": [
                                        "symbol",
                                        "enabled",
                                        "liquidity",
                                        "liquidity_status",
                                        "apr",
                                        "minimum_amount",
                                        "maximum_amount",
                                        "created_at",
                                        "updated_at"
                                    ]
                                }
                            }
                        }
                    },
                    "required": [
                        "guarantee_currencies",
                        "loan_currencies"
                    ]
                },
                "attributes": {
                    "requires_auth": false,
                    "complexity": "low"
                }
            },
            {
                "name": "loan_get_movements",
                "type": "READ",
                "desc": "Get loan movement history with full details. Returns movements with type (approve, repay, liquidate, interest), loan/guarantee amounts with fiat values, and LTV tracking. Optional order_id filter. Use to track loan lifecycle events. [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Filter by loan order UUID",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Number of records to return (default: 10)",
                        "required": false,
                        "default": 10
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Number of records to skip for pagination (default: 0)",
                        "required": false,
                        "default": 0
                    }
                },
                "exampleArgs": {
                    "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
                    "limit": 10,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
                        "limit": 10,
                        "offset": 0
                    },
                    "result": [
                        {
                            "id": "1b3aa379-0262-48eb-970d-da6b89882c67",
                            "order_id": "fb930f0c-8e90-403a-95e4-112394183cf2",
                            "type": "approve",
                            "status": "completed",
                            "loan_amount": "50750.0",
                            "loan_symbol": "EUR",
                            "loan_amount_fiat": "50749.95",
                            "guarantee_amount": "1.0",
                            "guarantee_symbol": "BTC",
                            "guarantee_amount_fiat": "101499.9",
                            "ltv": "0.5000",
                            "previous_ltv": "0.5000",
                            "created_at": "2025-07-27T16:24:00.118Z",
                            "updated_at": "2025-07-27T16:24:00.118Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 28,
                        "limit": 10,
                        "offset": 0,
                        "has_more": true
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "format": "uuid",
                                "description": "Movement unique identifier"
                            },
                            "order_id": {
                                "type": "string",
                                "format": "uuid",
                                "description": "Loan order UUID this movement belongs to"
                            },
                            "type": {
                                "type": "string",
                                "description": "Movement type: approve (loan approved), repay (payment made), liquidate (forced liquidation), interest (interest accrual)"
                            },
                            "status": {
                                "type": "string",
                                "enum": [
                                    "pending",
                                    "completed",
                                    "failed"
                                ],
                                "description": "Movement status"
                            },
                            "loan_amount": {
                                "type": "string",
                                "description": "Loan amount at time of movement"
                            },
                            "loan_symbol": {
                                "type": "string",
                                "description": "Loan currency symbol (e.g., EUR, USDC)"
                            },
                            "loan_amount_fiat": {
                                "type": "string",
                                "description": "Loan amount converted to EUR (rounded to 2 decimals)"
                            },
                            "guarantee_amount": {
                                "type": "string",
                                "description": "Guarantee/collateral amount at time of movement"
                            },
                            "guarantee_symbol": {
                                "type": "string",
                                "description": "Guarantee currency symbol (e.g., BTC, ETH)"
                            },
                            "guarantee_amount_fiat": {
                                "type": "string",
                                "description": "Guarantee amount converted to EUR (rounded to 2 decimals)"
                            },
                            "ltv": {
                                "type": "string",
                                "description": "Loan-to-Value ratio after this movement (0.5 = 50%)"
                            },
                            "previous_ltv": {
                                "type": "string",
                                "description": "Loan-to-Value ratio before this movement"
                            },
                            "created_at": {
                                "type": "string",
                                "format": "date-time",
                                "description": "When the movement was created"
                            },
                            "updated_at": {
                                "type": "string",
                                "format": "date-time",
                                "description": "When the movement was last updated"
                            }
                        },
                        "required": [
                            "id",
                            "order_id",
                            "type",
                            "status",
                            "loan_amount",
                            "loan_symbol",
                            "loan_amount_fiat",
                            "guarantee_amount",
                            "guarantee_symbol",
                            "guarantee_amount_fiat",
                            "ltv",
                            "previous_ltv",
                            "created_at",
                            "updated_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "loan_get_orders",
                "type": "READ",
                "desc": "Get all loan orders with full details including LTV, APR, interest, and fiat values. Use this to monitor loan health (LTV), track payments, and calculate costs. Optional order_id filter for specific loan. [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Filter by specific order UUID to get a single loan.",
                        "required": false
                    },
                    "limit": {
                        "type": "number",
                        "desc": "Number of records to return (default: 10)",
                        "required": false,
                        "default": 10
                    },
                    "offset": {
                        "type": "number",
                        "desc": "Number of records to skip for pagination (default: 0)",
                        "required": false,
                        "default": 0
                    }
                },
                "exampleArgs": {
                    "limit": 5,
                    "offset": 0
                },
                "response": {
                    "request": {
                        "limit": 5,
                        "offset": 0
                    },
                    "result": [
                        {
                            "id": "fb930f0c-8e90-403a-95e4-112394183cf2",
                            "status": "active",
                            "guarantee_symbol": "BTC",
                            "guarantee_amount": "1.0",
                            "guarantee_amount_fiat": "76854.8",
                            "loan_symbol": "EUR",
                            "loan_amount": "52220.14",
                            "loan_original_amount": "50750.0",
                            "loan_amount_fiat": "52214.92",
                            "ltv": "0.6791",
                            "apr": "0.17",
                            "interest_amount": "1470.14",
                            "remaining_amount": "52220.14",
                            "payback_amount": "0",
                            "created_at": "2025-07-27T16:23:59.876Z",
                            "started_at": "2025-07-27T16:24:00.119Z",
                            "expires_at": "2025-07-30T16:23:59.872Z"
                        }
                    ],
                    "metadata": {
                        "total_records": 1
                    }
                },
                "responseSchema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "description": "Unique loan order identifier (UUID)",
                                "format": "uuid"
                            },
                            "status": {
                                "type": "string",
                                "description": "Loan status: active (ongoing), completed (fully repaid), expired (term ended)",
                                "enum": [
                                    "active",
                                    "completed",
                                    "expired"
                                ]
                            },
                            "guarantee_symbol": {
                                "type": "string",
                                "description": "Cryptocurrency symbol used as collateral (e.g., BTC)"
                            },
                            "guarantee_amount": {
                                "type": "string",
                                "description": "Amount of collateral deposited"
                            },
                            "guarantee_amount_fiat": {
                                "type": "string",
                                "description": "Collateral value in fiat (EUR). Rounded to 2 decimals."
                            },
                            "loan_symbol": {
                                "type": "string",
                                "description": "Currency of the loan (e.g., EUR, USDC)"
                            },
                            "loan_amount": {
                                "type": "string",
                                "description": "Current loan amount including accrued interest"
                            },
                            "loan_original_amount": {
                                "type": "string",
                                "description": "Original principal amount (before interest)"
                            },
                            "loan_amount_fiat": {
                                "type": "string",
                                "description": "Loan value in fiat (EUR). Rounded to 2 decimals."
                            },
                            "ltv": {
                                "type": "string",
                                "description": "Loan-to-Value ratio (0.67 = 67%). Higher = more risk of liquidation."
                            },
                            "apr": {
                                "type": "string",
                                "description": "Annual Percentage Rate (0.17 = 17% annual interest)"
                            },
                            "interest_amount": {
                                "type": "string",
                                "description": "Total accrued interest amount"
                            },
                            "remaining_amount": {
                                "type": "string",
                                "description": "Total amount remaining to repay (principal + interest)"
                            },
                            "payback_amount": {
                                "type": "string",
                                "description": "Amount already repaid"
                            },
                            "created_at": {
                                "type": "string",
                                "format": "date-time",
                                "description": "When the loan order was created"
                            },
                            "started_at": {
                                "type": "string",
                                "format": "date-time",
                                "description": "When the loan became active"
                            },
                            "expires_at": {
                                "type": "string",
                                "format": "date-time",
                                "description": "When the loan term expires"
                            }
                        },
                        "required": [
                            "id",
                            "status",
                            "guarantee_symbol",
                            "guarantee_amount",
                            "guarantee_amount_fiat",
                            "loan_symbol",
                            "loan_amount",
                            "loan_original_amount",
                            "loan_amount_fiat",
                            "ltv",
                            "apr",
                            "interest_amount",
                            "remaining_amount",
                            "payback_amount",
                            "created_at",
                            "started_at",
                            "expires_at"
                        ]
                    }
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "read",
                    "complexity": "low"
                }
            },
            {
                "name": "loan_create",
                "type": "WRITE",
                "desc": "Create a new loan by providing cryptocurrency as guarantee (collateral) to receive loan currency (can be any supported currency like USDC, EURC, or fiat). Specify amount_type to determine calculation mode: 'fixed_collateral' (guarantee amount is fixed, loan amount is calculated) or 'fixed_loan' (loan amount is fixed, guarantee amount is calculated). This avoids mathematical errors where the model tries to guess the exact LTV manually. Returns loan order details with status. [PRIVATE]",
                "args": {
                    "guarantee_symbol": {
                        "type": "string",
                        "desc": "Guarantee cryptocurrency symbol (e.g., BTC)",
                        "required": true
                    },
                    "loan_symbol": {
                        "type": "string",
                        "desc": "Loan currency symbol (e.g., USDC, EURC, EUR). Can be any supported currency.",
                        "required": true
                    },
                    "amount_type": {
                        "type": "string",
                        "desc": "Calculation mode: 'fixed_collateral' means guarantee amount is fixed and loan amount will be calculated; 'fixed_loan' means loan amount is fixed and guarantee amount will be calculated",
                        "required": true,
                        "enum": [
                            "fixed_collateral",
                            "fixed_loan"
                        ]
                    },
                    "guarantee_amount": {
                        "type": "string",
                        "desc": "Guarantee amount (required when amount_type is 'fixed_collateral')",
                        "required": false
                    },
                    "loan_amount": {
                        "type": "string",
                        "desc": "Loan amount (required when amount_type is 'fixed_loan')",
                        "required": false
                    },
                    "user_symbol": {
                        "type": "string",
                        "desc": "User's fiat currency symbol for conversion (e.g., EUR, USD). Optional, defaults to EUR. Used internally for calculations.",
                        "required": false,
                        "default": "EUR"
                    }
                },
                "exampleArgs": {
                    "guarantee_symbol": "BTC",
                    "loan_symbol": "EUR",
                    "amount_type": "fixed_collateral",
                    "guarantee_amount": "0.5"
                },
                "response": {
                    "request": {
                        "guarantee_symbol": "BTC",
                        "loan_symbol": "EUR",
                        "amount_type": "fixed_collateral",
                        "guarantee_amount": "0.5"
                    },
                    "result": {
                        "id": "loan123-...",
                        "status": "active",
                        "guarantee_symbol": "BTC",
                        "guarantee_amount": "0.5",
                        "loan_symbol": "EUR",
                        "loan_amount": "15000.00",
                        "ltv": "0.65",
                        "apr": "0.15",
                        "created_at": "2024-11-25T10:00:00.000Z"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "status": {
                            "type": "string",
                            "description": "Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)",
                            "enum": [
                                "open",
                                "filled",
                                "cancelled"
                            ]
                        },
                        "guarantee_symbol": {
                            "type": "string",
                            "description": "Cryptocurrency symbol used as collateral (e.g., BTC, ETH)"
                        },
                        "guarantee_amount": {
                            "type": "string",
                            "description": "Amount of collateral deposited (as string for precision)"
                        },
                        "loan_symbol": {
                            "type": "string",
                            "description": "Currency symbol in which the loan is denominated (e.g., USDC, EUR)"
                        },
                        "loan_amount": {
                            "type": "string",
                            "description": "Principal loan amount (as string for precision)"
                        },
                        "ltv": {
                            "type": "string",
                            "description": "Loan-to-Value ratio as string (1.0 = 100%)"
                        },
                        "apr": {
                            "type": "string",
                            "description": "Annual Percentage Rate as string"
                        },
                        "created_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the resource was created",
                            "format": "date-time"
                        }
                    },
                    "required": [
                        "id",
                        "status",
                        "guarantee_symbol",
                        "guarantee_amount",
                        "loan_symbol",
                        "loan_amount",
                        "ltv",
                        "apr",
                        "created_at"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "high"
                }
            },
            {
                "name": "loan_increase_guarantee",
                "type": "WRITE",
                "desc": "Increase the guarantee (collateral) amount for an existing loan. This improves the LTV ratio and reduces risk. Returns updated loan details. Use loan_get_orders first to get the order ID. [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Loan order UUID from loan_get_orders",
                        "required": true
                    },
                    "guarantee_amount": {
                        "type": "string",
                        "desc": "Additional collateral amount to add (as string for decimal precision)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "order_id": "loan-order-uuid-1234",
                    "guarantee_amount": "0.5"
                },
                "response": {
                    "request": {
                        "order_id": "loan-order-uuid-1234",
                        "guarantee_amount": "0.5"
                    },
                    "result": {
                        "id": "loan123-...",
                        "guarantee_amount": "1.5",
                        "new_ltv": "0.43",
                        "updated_at": "2024-11-25T10:30:00.000Z",
                        "message": "Guarantee increased successfully"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "guarantee_amount": {
                            "type": "string",
                            "description": "Amount of collateral deposited (as string for precision)"
                        },
                        "new_ltv": {
                            "type": "string",
                            "description": "New Loan-to-Value ratio after the operation (lower is safer)"
                        },
                        "updated_at": {
                            "type": "string",
                            "description": "ISO 8601 date/time when the resource was last updated",
                            "format": "date-time"
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "guarantee_amount",
                        "new_ltv",
                        "updated_at",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            },
            {
                "name": "loan_payback",
                "type": "WRITE",
                "desc": "Pay back (return) part or all of a loan. Reduces the loan amount and may release guarantee if fully paid. Returns updated loan details. Use loan_get_orders to get the order ID, or loan_get_orders with order_id filter to check current loan amount and details. [PRIVATE]",
                "args": {
                    "order_id": {
                        "type": "string",
                        "desc": "Loan order UUID from loan_get_orders",
                        "required": true
                    },
                    "payback_amount": {
                        "type": "string",
                        "desc": "Amount to repay (as string for decimal precision)",
                        "required": true
                    }
                },
                "exampleArgs": {
                    "order_id": "loan-order-uuid-1234",
                    "payback_amount": "10000.00"
                },
                "response": {
                    "request": {
                        "order_id": "loan-order-uuid-1234",
                        "payback_amount": "10000.00"
                    },
                    "result": {
                        "id": "loan123-...",
                        "remaining_amount": "40000.00",
                        "status": "active",
                        "message": "Payback successful"
                    }
                },
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "Unique identifier (UUID)",
                            "format": "uuid"
                        },
                        "remaining_amount": {
                            "type": "string",
                            "description": "Outstanding loan balance including interest"
                        },
                        "status": {
                            "type": "string",
                            "description": "Order status. ENUM: open (order is active and waiting to be filled), filled (order was completely executed), cancelled (order was cancelled or expired)",
                            "enum": [
                                "open",
                                "filled",
                                "cancelled"
                            ]
                        },
                        "message": {
                            "type": "string",
                            "description": "Human-readable status or confirmation message"
                        }
                    },
                    "required": [
                        "id",
                        "remaining_amount",
                        "status",
                        "message"
                    ]
                },
                "attributes": {
                    "requires_auth": true,
                    "scope": "write",
                    "complexity": "medium"
                }
            }
        ]
    }
];

// Package version
const packageVersion = '3.0.2';

// Export for use in landing page
if (typeof window !== 'undefined') {
    window.toolsData = toolsData;
    window.packageVersion = packageVersion;
}
