import { ValidationError } from "../errors.js";
import { smartRound, normalizeStatus } from "../format.js";
import { asFiniteNumber, asRecord, asString, firstDefined, isValidObject } from "./guards.js";
import type {
    LoanConfigResponse,
    GuaranteeCurrencyConfig,
    LoanCurrencyConfig,
    LoanSimulationResponse,
    LoanOrderDetailsResponse,
} from "../schemas.js";

export function mapLoanConfigResponse(raw: unknown): LoanConfigResponse {
    if (!isValidObject(raw)) {
        return {
            guarantee_currencies: [],
            loan_currencies: [],
        };
    }

    const loanCurrencies = Array.isArray(raw.loanCurrencies) ? raw.loanCurrencies : [];
    const guaranteeCurrencies = Array.isArray(raw.guaranteeCurrencies) ? raw.guaranteeCurrencies : [];

    return {
        guarantee_currencies: guaranteeCurrencies
            .map((entry) => {
                const item = asRecord(entry);
                const symbol = asString(item.currency).toUpperCase();
                if (!symbol) return null;
                return {
                    symbol,
                    enabled: item.enabled == null ? true : Boolean(item.enabled),
                    liquidation_ltv: asString(firstDefined(item, "liquidationLtv", "liquidation_ltv"), "0"),
                    initial_ltv: asString(firstDefined(item, "initialLtv", "initial_ltv"), "0"),
                    created_at: asString(firstDefined(item, "createdAt", "created_at")),
                    updated_at: asString(firstDefined(item, "updatedAt", "updated_at")),
                };
            })
            .filter((item): item is GuaranteeCurrencyConfig => item !== null),
        loan_currencies: loanCurrencies
            .map((entry) => {
                const item = asRecord(entry);
                const symbol = asString(item.currency).toUpperCase();
                if (!symbol) return null;
                return {
                    symbol,
                    enabled: item.enabled == null ? true : Boolean(item.enabled),
                    liquidity: asString(item.liquidity, "0"),
                    liquidity_status: asString(firstDefined(item, "liquidityStatus", "liquidity_status")),
                    apr: asString(item.apr, "0"),
                    minimum_amount: asString(firstDefined(item, "minimumAmount", "minimum_amount"), "0"),
                    maximum_amount: asString(firstDefined(item, "maximumAmount", "maximum_amount"), "0"),
                    created_at: asString(firstDefined(item, "createdAt", "created_at")),
                    updated_at: asString(firstDefined(item, "updatedAt", "updated_at")),
                };
            })
            .filter((item): item is LoanCurrencyConfig => item !== null),
    };
}

export function mapLoanSimulationResponse(raw: unknown): LoanSimulationResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan simulation response structure");
    }

    return {
        guarantee_symbol: asString(raw.guaranteeCurrency).toUpperCase(),
        guarantee_amount: asString(raw.guaranteeAmount, "0"),
        guarantee_amount_converted: smartRound(asFiniteNumber(raw.guaranteeAmountConverted)).toString(),
        loan_symbol: asString(raw.loanCurrency).toUpperCase(),
        loan_amount: asString(raw.loanAmount, "0"),
        loan_amount_converted: smartRound(asFiniteNumber(raw.loanAmountConverted)).toString(),
        user_symbol: asString(raw.userCurrency).toUpperCase(),
        ltv: smartRound(asFiniteNumber(raw.ltv)).toString(),
        apr: smartRound(asFiniteNumber(raw.apr)).toString(),
    };
}

export function mapLoanOrderDetailsResponse(raw: unknown): LoanOrderDetailsResponse {
    if (!isValidObject(raw)) {
        throw new ValidationError("Invalid loan order details response structure");
    }

    const aprDetails = asRecord(raw.aprDetails);
    return {
        id: asString(firstDefined(raw, "orderId", "id")),
        status: (normalizeStatus(asString(raw.status)) || "active") as "active" | "completed" | "expired",
        guarantee_symbol: asString(raw.guaranteeCurrency),
        guarantee_amount: asString(raw.guaranteeAmount, "0"),
        loan_symbol: asString(raw.loanCurrency),
        loan_amount: asString(raw.loanAmount, "0"),
        remaining_amount: asString(firstDefined(raw, "remainingAmount", "remaining"), "0"),
        ltv: asString(raw.ltv, "0"),
        apr: asString(raw.apr, "0"),
        liquidation_price: asString(firstDefined(raw, "liquidationPriceReference", "liquidationPrice"), "0"),
        created_at: asString(firstDefined(raw, "createdAt", "created_at")),
        expires_at: asString(firstDefined(raw, "expiresAt", "expires_at")),
        apr_details: raw.aprDetails
            ? {
                  base_apr: asString(aprDetails.baseApr, "0"),
                  final_apr: asString(aprDetails.finalApr, "0"),
                  user_discount: asString(aprDetails.userDiscount, "0"),
                  total_discount: asString(aprDetails.totalDiscount, "0"),
              }
            : undefined,
    };
}
