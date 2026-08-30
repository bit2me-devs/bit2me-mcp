export enum CacheCategory {
    STATIC = "static",
    MARKET_DATA = "market_data",
    BALANCE = "balance",
    TRANSACTION = "transaction",
    ORDER = "order",
    USER_DATA = "user_data",
}

export const DEFAULT_TTLS: Record<CacheCategory, number> = {
    [CacheCategory.STATIC]: 3600,
    [CacheCategory.MARKET_DATA]: 30,
    [CacheCategory.BALANCE]: 60,
    [CacheCategory.TRANSACTION]: 120,
    [CacheCategory.ORDER]: 15,
    [CacheCategory.USER_DATA]: 60,
};
