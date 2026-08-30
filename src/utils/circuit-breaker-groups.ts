import { allEndpointGroups, type EndpointGroup } from "./endpoint-groups.js";
import { apiCircuitBreaker, CircuitBreaker, type CircuitBreakerOptions } from "./circuit-breaker-core.js";

const GROUP_BREAKER_OPTIONS: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
    successThreshold: 2,
    timeout: 30000,
};

const groupBreakers = new Map<EndpointGroup, CircuitBreaker>();

/** Per-group breaker. `"default"` uses the shared global instance. */
export function getGroupCircuitBreaker(group: EndpointGroup): CircuitBreaker {
    if (group === "default") return apiCircuitBreaker;
    let breaker = groupBreakers.get(group);
    if (!breaker) {
        breaker = new CircuitBreaker(GROUP_BREAKER_OPTIONS);
        groupBreakers.set(group, breaker);
    }
    return breaker;
}

export function getGroupCircuitBreakerStats(): Record<string, ReturnType<CircuitBreaker["getStats"]>> {
    const out: Record<string, ReturnType<CircuitBreaker["getStats"]>> = {};
    out["global"] = apiCircuitBreaker.getStats();
    for (const group of allEndpointGroups()) {
        if (group === "default") continue;
        out[group] = getGroupCircuitBreaker(group).getStats();
    }
    return out;
}

/** Tests only. */
export function resetGroupCircuitBreakers(): void {
    groupBreakers.clear();
}
