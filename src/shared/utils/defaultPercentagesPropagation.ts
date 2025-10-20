// Utility to apply new default percentages to existing pricing map entries
// Only updates entries whose additionalPercentages exactly matched the previous defaults
// (i.e. items that were still using the old global defaults and not customized).
// Returns a new Map (does not mutate original) and the count of changed items.

export interface Percentages {
  administrative: number;
  operational: number;
  profit: number;
}

export interface PricingEntryLike {
  additionalPercentages?: Partial<Percentages>;
  [key: string]: unknown; // allow passthrough fields
}

export function applyDefaultsToPricingMap<TEntry extends PricingEntryLike>(
  pricingMap: Map<string, TEntry>,
  previousDefaults: Percentages,
  newDefaults: Percentages
): { updated: Map<string, TEntry>; changedCount: number } {
  let changedCount = 0;
  const updated = new Map<string, TEntry>();
  pricingMap.forEach((value, key) => {
    const ap = value.additionalPercentages;
    if (
      ap &&
      ap.administrative === previousDefaults.administrative &&
      ap.operational === previousDefaults.operational &&
      ap.profit === previousDefaults.profit
    ) {
      // Still tied to old defaults => update
      updated.set(key, {
        ...value,
        additionalPercentages: { ...newDefaults }
      });
      changedCount++;
    } else if (!ap) {
      // No percentages set; treat as default-bound as well
      updated.set(key, {
        ...value,
        additionalPercentages: { ...newDefaults }
      });
      changedCount++;
    } else {
      updated.set(key, value);
    }
  });
  return { updated, changedCount };
}
