/**
 * Request context management with correlation IDs
 * Provides a way to track requests across the entire request lifecycle
 */

import { randomUUID } from "crypto";

/**
 * Global context storage interface
 */
interface GlobalContext {
    __currentCorrelationId?: string;
    __currentSessionToken?: string;
}

/**
 * Type-safe global context accessor
 */
const globalContext = global as unknown as GlobalContext;

/**
 * Request context interface
 */
export interface RequestContext {
    correlationId: string;
    toolName?: string;
    startTime: number;
    sessionToken?: string;
}

/**
 * AsyncLocalStorage for request context
 * This allows us to access context from anywhere in the call stack
 */
class ContextManager {
    private contexts: Map<string, RequestContext> = new Map();

    /**
     * Generate a new correlation ID
     */
    generateCorrelationId(): string {
        return randomUUID();
    }

    /**
     * Create a new request context
     */
    createContext(toolName?: string): RequestContext {
        const correlationId = this.generateCorrelationId();
        const context: RequestContext = {
            correlationId,
            toolName,
            startTime: Date.now(),
        };
        this.contexts.set(correlationId, context);
        return context;
    }

    /**
     * Get current context (if available)
     */
    getContext(correlationId: string): RequestContext | undefined {
        return this.contexts.get(correlationId);
    }

    /**
     * Clear context (cleanup)
     */
    clearContext(correlationId: string): void {
        this.contexts.delete(correlationId);
    }

    /**
     * Get all active contexts (for debugging)
     */
    getActiveContexts(): RequestContext[] {
        return Array.from(this.contexts.values());
    }
}

export const contextManager = new ContextManager();

/**
 * Get current correlation ID from context
 * Returns undefined if no context is set
 */
export function getCorrelationId(): string | undefined {
    // For now, we'll use a simple approach with a global variable
    // In a more complex setup, we could use AsyncLocalStorage
    return globalContext.__currentCorrelationId;
}

/**
 * Set current correlation ID
 */
export function setCorrelationId(correlationId: string): void {
    globalContext.__currentCorrelationId = correlationId;
}

/**
 * Clear current correlation ID
 */
export function clearCorrelationId(): void {
    globalContext.__currentCorrelationId = undefined;
}

// ============================================================================
// SESSION TOKEN MANAGEMENT (for web-like authentication)
// ============================================================================

/**
 * Get current session token from context
 * Returns undefined if no session is set
 */
export function getSessionToken(): string | undefined {
    return globalContext.__currentSessionToken;
}

/**
 * Set current session token
 */
export function setSessionToken(sessionToken: string | undefined): void {
    if (sessionToken) {
        globalContext.__currentSessionToken = sessionToken;
    } else {
        globalContext.__currentSessionToken = undefined;
    }
}

/**
 * Clear current session token
 */
export function clearSessionToken(): void {
    globalContext.__currentSessionToken = undefined;
}
