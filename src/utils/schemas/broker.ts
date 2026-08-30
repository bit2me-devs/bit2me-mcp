export interface FeeComponent {
    amount: string;
    currency: string;
    percentage?: string;
}

/**
 * Breakdown of all fee components from a proforma
 */
export interface FeeBreakdown {
    network?: FeeComponent;
    flip?: FeeComponent;
    teller_fixed?: FeeComponent;
    teller_variable?: FeeComponent;
}

/**
 * Proforma response with complete fee breakdown and correct rate extraction
 */
export interface ProformaResponse {
    proforma_id: string;
    origin_amount: string;
    origin_symbol: string;
    destination_amount: string;
    destination_symbol: string;
    rate: string;
    rate_pair?: string | undefined;
    total_fee: string;
    fee_currency: string;
    fee_breakdown?: FeeBreakdown | undefined;
    expires_at: string;
}

export interface OperationConfirmationResponse {
    id: string;
    status: string;
}
