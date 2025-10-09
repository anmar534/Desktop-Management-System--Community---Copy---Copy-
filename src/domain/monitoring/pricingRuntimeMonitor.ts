// Lightweight in-memory runtime monitoring counters for pricing pipeline.
// Will be reset on app reload. Intended for observability & legacy removal readiness.

export interface PricingRuntimeSnapshot {
  domainComputations: number;
}

const counters: PricingRuntimeSnapshot = {
  domainComputations: 0
};

export function pricingRuntimeMonitor() {
  return {
    incDomain() {
      counters.domainComputations++;
    },
    snapshot(): PricingRuntimeSnapshot {
      return { ...counters };
    },
    reset() {
      const keys = Object.keys(counters) as (keyof PricingRuntimeSnapshot)[];
      keys.forEach(key => {
        counters[key] = 0;
      });
    }
  };
}

// Singleton accessor (simple; avoids extra DI wiring for now)
export const pricingRuntime = pricingRuntimeMonitor();
