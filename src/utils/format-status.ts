/**
 * Normalizes status values to a controlled vocabulary
 * @param status - Raw status string from API
 * @returns Normalized lowercase status
 */
export function normalizeStatus(status: string | undefined): string {
    if (!status) return "unknown";

    const normalized = status.toLowerCase().trim();

    // Map common variations to standard values
    const statusMap: Record<string, string> = {
        // Active states
        active: "active",
        enabled: "active",
        open: "active",
        // Pending states
        pending: "pending",
        processing: "pending",
        waiting: "pending",
        in_progress: "pending",
        inprogress: "pending",
        // Completed states
        completed: "completed",
        complete: "completed",
        done: "completed",
        success: "completed",
        successful: "completed",
        filled: "completed",
        executed: "completed",
        // Failed states
        failed: "failed",
        failure: "failed",
        error: "failed",
        rejected: "failed",
        // Cancelled states
        cancelled: "cancelled",
        canceled: "cancelled",
        cancel: "cancelled",
        // Expired states
        expired: "expired",
        // Closed states
        closed: "closed",
        // Partial states
        partial: "partial",
        partially_filled: "partial",
    };

    return statusMap[normalized] || normalized;
}

/**
 * Normalizes order status values for Pro Trading orders
 * Maps to unified enum: "open" | "filled" | "cancelled"
 * @param status - Raw status string from API
 * @returns Normalized order status
 */
export function normalizeOrderStatus(status: string | undefined): "open" | "filled" | "cancelled" {
    if (!status) return "open";

    const normalized = status.toLowerCase().trim();

    // Map to unified order statuses
    const statusMap: Record<string, "open" | "filled" | "cancelled"> = {
        // Open states
        open: "open",
        active: "open",
        pending: "open",
        partial: "open",
        partially_filled: "open",
        // Filled states
        filled: "filled",
        completed: "filled",
        complete: "filled",
        executed: "filled",
        done: "filled",
        success: "filled",
        successful: "filled",
        // Cancelled states
        cancelled: "cancelled",
        canceled: "cancelled",
        cancel: "cancelled",
        // Expired/inactive treated as cancelled
        expired: "cancelled",
        inactive: "cancelled",
        closed: "cancelled",
    };

    return statusMap[normalized] || "open";
}

/**
 * Normalizes movement status values for Wallet/Loan movements
 * Maps to unified enum: "pending" | "completed" | "failed"
 * @param status - Raw status string from API
 * @returns Normalized movement status
 */
export function normalizeMovementStatus(status: string | undefined): "pending" | "completed" | "failed" {
    if (!status) return "pending";

    const normalized = status.toLowerCase().trim();

    // Map to unified movement statuses
    const statusMap: Record<string, "pending" | "completed" | "failed"> = {
        // Pending states
        pending: "pending",
        processing: "pending",
        waiting: "pending",
        in_progress: "pending",
        inprogress: "pending",
        // Completed states
        completed: "completed",
        complete: "completed",
        done: "completed",
        success: "completed",
        successful: "completed",
        // Failed states
        failed: "failed",
        failure: "failed",
        error: "failed",
        rejected: "failed",
        // Cancelled/unknown treated as failed
        cancelled: "failed",
        canceled: "failed",
        cancel: "failed",
        unknown: "failed",
    };

    return statusMap[normalized] || "pending";
}

/**
 * Normalizes movement type to controlled vocabulary
 * @param type - Raw type string from API
 * @returns Normalized movement type
 */
export function normalizeMovementType(type: string | undefined): string {
    if (!type) return "other";

    const normalized = type.toLowerCase().trim();

    const typeMap: Record<string, string> = {
        deposit: "deposit",
        deposits: "deposit",
        withdrawal: "withdrawal",
        withdraw: "withdrawal",
        withdrawals: "withdrawal",
        swap: "swap",
        exchange: "swap",
        convert: "swap",
        purchase: "purchase",
        buy: "purchase",
        transfer: "transfer",
        send: "transfer",
        receive: "transfer",
        fee: "fee",
        commission: "fee",
        reward: "reward",
        interest: "interest",
        payment: "payment",
        guarantee_change: "guarantee_change",
        liquidation: "liquidation",
        "discount-funds": "discount-funds",
        "discount-rewards": "discount-rewards",
    };

    return typeMap[normalized] || "other";
}
