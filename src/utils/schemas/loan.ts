export interface LoanOrderResponse {
    id: string;
    status: "active" | "completed" | "expired";
    // Guarantee (collateral)
    guarantee_symbol: string;
    guarantee_amount: string;
    guarantee_amount_fiat: string;
    // Loan
    loan_symbol: string;
    loan_amount: string;
    loan_original_amount: string;
    loan_amount_fiat: string;
    // Interest & Risk
    ltv: string;
    apr: string;
    interest_amount: string;
    // Payback tracking
    remaining_amount: string;
    payback_amount: string;
    // Dates
    created_at: string;
    started_at: string;
    expires_at: string;
}

/**
 * Loan simulation response.
 * LTV (Loan-to-Value) is a ratio where 1.0 = 100%.
 * Example: "0.75" means 75% LTV.
 */
export interface LoanSimulationResponse {
    guarantee_symbol: string;
    guarantee_amount: string;
    guarantee_amount_converted: string;
    loan_symbol: string;
    loan_amount: string;
    loan_amount_converted: string;
    user_symbol: string;
    /** LTV ratio as string (1.0 = 100%) */
    ltv: string;
    /** APR as string (e.g., "13.12" means 13.12%) */
    apr: string;
}

export interface GuaranteeCurrencyConfig {
    symbol: string;
    enabled: boolean;
    liquidation_ltv: string;
    initial_ltv: string;
    created_at: string;
    updated_at: string;
}

export interface LoanCurrencyConfig {
    symbol: string;
    enabled: boolean;
    liquidity: string;
    liquidity_status: string;
    apr: string;
    minimum_amount: string;
    maximum_amount: string;
    created_at: string;
    updated_at: string;
}

export interface LoanConfigResponse {
    guarantee_currencies: GuaranteeCurrencyConfig[];
    loan_currencies: LoanCurrencyConfig[];
}

/**
 * Nested amount object for loan movements
 */
export interface LoanMovementAmount {
    amount: string;
    symbol: string;
    amount_fiat: string;
}

export interface LoanMovementResponse {
    id: string;
    order_id: string;
    type: "approve" | "repay" | "liquidate" | "interest";
    status: "pending" | "completed" | "failed";
    // Nested objects for cleaner structure
    loan: LoanMovementAmount;
    guarantee: LoanMovementAmount;
    // LTV tracking (as decimal, e.g., "0.50" = 50%)
    ltv: string;
    previous_ltv: string;
    // Date
    created_at: string;
}

export interface LoanOrderDetailsResponse {
    id: string;
    status: "active" | "completed" | "expired";
    guarantee_symbol: string;
    guarantee_amount: string;
    loan_symbol: string;
    loan_amount: string;
    remaining_amount: string;
    ltv: string;
    apr: string;
    liquidation_price: string;
    created_at: string;
    expires_at: string;
    apr_details?:
        | {
              base_apr: string;
              final_apr: string;
              user_discount: string;
              total_discount: string;
          }
        | undefined;
}

export interface LoanCreateResponse {
    id: string;
    guarantee_symbol: string;
    guarantee_amount: string;
    loan_symbol: string;
    loan_amount: string;
    ltv: string;
    apr: string;
    status: string;
    created_at: string;
}

export interface LoanIncreaseGuaranteeResponse {
    id: string;
    new_guarantee_amount: string;
    new_ltv: string;
    status: string;
    message: string;
}

export interface LoanPaybackResponse {
    id: string;
    payback_amount: string;
    remaining_amount: string;
    status: string;
    message: string;
}
