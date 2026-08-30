import type { WriteToolArgs } from "./args-write.js";

export interface LoanSimulationArgs {
    guarantee_symbol: string;
    loan_symbol: string;
    user_symbol: string;
    guarantee_amount?: string;
    loan_amount?: string;
}

export interface LoanMovementsArgs {
    order_id?: string;
    limit?: number;
    offset?: number;
}

export interface LoanOrdersArgs {
    order_id?: string;
    limit?: number;
    offset?: number;
}

export interface LoanCreateArgs extends WriteToolArgs {
    guarantee_symbol: string;
    loan_symbol: string;
    amount_type: "fixed_collateral" | "fixed_loan";
    guarantee_amount?: string;
    loan_amount?: string;
    user_symbol?: string;
}

export interface LoanIncreaseGuaranteeArgs extends WriteToolArgs {
    order_id: string;
    guarantee_amount: string;
}

export interface LoanPaybackArgs extends WriteToolArgs {
    order_id: string;
    payback_amount: string;
}
