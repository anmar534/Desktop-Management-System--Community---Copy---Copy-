# Pricing Engine – Phase 3 Consolidation Summary

Date: 2025-09-19  
Engine Version: `PRICING_ENGINE_VERSION` (see `src/services/pricingEngine.ts`)  
Scope: Centralization, configuration unification, analytics, parity hardening, and deprecation planning.

---

## 1. Executive Overview
Phase 3 focused on moving from “refactored but duplicated” to “central, observable, and stable”. We:
1. Centralized aliases, default percentages, and VAT into `pricingConstants.ts` with runtime configuration helpers.  
2. Aligned engine arithmetic semantics with legacy authoring logic (notably `unitPrice` meaning).  
3. Introduced an analytics layer (`pricingAnalytics.ts`) for summary + drift insights.  
4. Added regression & parity tests (`pricingConstants.test.ts`, `pricingAnalytics.test.ts`, `authoringEngineParity.test.ts`).  
5. Implemented version tagging to track semantic changes (`PRICING_ENGINE_VERSION`).  
6. Annotated and quarantined remaining legacy arithmetic (`legacyAuthoringCompute`) behind feature flag safety.  
7. Established a documented deprecation path with measurable criteria (diff tolerance & soak window).  

Result: Engine paths for both read & authoring are feature-flag protected, numerically aligned with legacy, and observable for future optimization.

---

## 2. Core Artifacts (Phase 3 Additions / Changes)
| Area | File(s) | Purpose |
|------|---------|---------|
| Engine Semantics | `src/services/pricingEngine.ts` | Canonical computation + version export |
| Constants & Config | `src/utils/pricingConstants.ts` | Single source of alias arrays, VAT, default percentages, mutable runtime config |
| Helpers / Flags | `src/utils/pricingHelpers.ts` | Facade: enrichment, diffing, gating (read + authoring) |
| Normalization | `src/utils/normalizePricing.ts` | Uses centralized alias arrays (removed duplication) |
| Analytics | `src/analytics/pricingAnalytics.ts` | Build pricing summary + drift metrics |
| Authoring Component | `src/components/TenderPricingProcess.tsx` | Dual path: legacy vs engine (flag) + diff logging |
| Display Component | `src/components/TenderDetails.tsx` | Engine enrichment (flag) with fallback |
| Tests (Parity / Regression) | `tests/pricing/authoringEngineParity.test.ts` | Ensures engine matches legacy within 0.01% threshold |
|  | `tests/pricing/pricingAnalytics.test.ts` | Validates summary math & drift computations |
|  | `tests/pricing/pricingConstants.test.ts` | Guards alias and default percentage drift |
| Audit / Reports | `PRICING_AUDIT_REPORT.md`, `DUPLICATION_CATALOG.json` | Earlier audit artifacts informing consolidation |

---

## 3. Feature Flags & Safety Nets
| Flag | Intent | Default | Notes |
|------|--------|---------|-------|
| `USE_ENGINE_DETAILS` | Control migration of read/render path | Enabled (target) | Fallback retains legacy if disabled |
| `USE_ENGINE_AUTHORING` | Control authoring calculations | Disabled or staged | Diff logging compares against legacy |
| `DIFF_LOGGING` | Emit per-item numeric divergence | On during soak | Turn off post-stabilization to reduce noise |
| `DIFF_THRESHOLD_PERCENT` | Alert threshold for drift | `0.5` (example) | Increase only after sustained stability |

Safety Strategy:
1. Side-by-side comparison for authoring until soak criteria met.  
2. Fail-fast parity test in CI stops accidental semantic regression.  
3. Central constants eliminate “silent percentage drift” class of bugs.  

---

## 4. Arithmetic Semantics Alignment
Legacy logic interpreted `unitPrice` as the already aggregated per-unit breakdown total; engine now mirrors this:
```
breakdown.total => unitPrice
totalPrice = unitPrice * quantity
```
VAT & overhead percentages (administrative / operational / profit) now sourced from centralized config, avoiding mismatch between code paths or tests.

---

## 5. Configuration & Constants
Defined in `pricingConstants.ts`:
* Alias arrays: `DESCRIPTION_ALIASES`, `UNIT_ALIASES`, `QUANTITY_ALIASES`, `TOTAL_ALIASES`, `UNIT_PRICE_ALIASES`.
* Percentages & VAT: `DEFAULT_PRICING_CONFIG` (includes admin/operational/profit percentages + `VAT_RATE`).
* Runtime accessors: `getPricingConfig()`, `updatePricingConfig(partial)` – supports safe future custom overrides (audit diff test protects accidental drift).

Guideline: Any new source of pricing-related renaming or percentage logic must extend these constants—never inline.

---

## 6. Analytics Layer
`pricingAnalytics.ts` introduces:
* `buildPricingSummary(items)`: category totals, percentage shares, extremes, averages.  
* `computeDrift(current, baseline)`: structured divergence metrics.  
Use Cases: Reporting dashboards, regression baselining, alerting on anomalous shifts after configuration changes.

---

## 7. Parity & Regression Testing
| Test | Purpose |
|------|---------|
| `authoringEngineParity.test.ts` | Guarantees numerical match to legacy path (`< 0.01%` tolerance) |
| `pricingConstants.test.ts` | Detects unintended alias / percentage changes |
| `pricingAnalytics.test.ts` | Validates analytics math correctness |

Rationale: Establish an enforceable “contract” before removing legacy branch.

---

## 8. Remaining Controlled Duplication & Deprecation Plan
`legacyAuthoringCompute` (in `TenderPricingProcess.tsx`) is the only intentional arithmetic duplication now.

Removal Preconditions:
1. Soak Period: Minimum 2 weeks of production (or staging) with `USE_ENGINE_AUTHORING` enabled for at least 1 representative tender dataset.  
2. Zero material diffs: No logged divergence above `DIFF_THRESHOLD_PERCENT` for 7 consecutive days.  
3. No open issues labeled `pricing-legacy-gap`.  
4. Parity test green after any config change.  

Removal Steps:
1. Disable diff logging (`DIFF_LOGGING = false`).  
2. Delete legacy function + associated diff wrapper.  
3. Remove parity test OR rewrite to assert core invariants (turn from “legacy vs engine” into “engine internal consistency”).  
4. Increment `PRICING_ENGINE_VERSION` and record in Change Log (below).  

---

## 9. Quality Gates (Current Status)
* Test Suite: 42 passing (integration + pricing-specific).  
* Parity Delta: < 0.01% (enforced).  
* Centralization: 100% of alias / VAT / default percentage duplication removed.  
* Observability: Diff logs + analytics summary available.  

---

## 10. Operational Playbook
| Scenario | Action |
|----------|--------|
| Adjust VAT | `updatePricingConfig({ VAT_RATE: 0.17 })` then run full test suite |
| Add new alias column | Extend appropriate `*_ALIASES`, update constants test snapshot if intentional |
| Investigate drift | Enable `DIFF_LOGGING`, inspect console / logs, run analytics drift comparison |
| Add new overhead type | Add field to config & engine breakdown, update analytics + tests |

---

## 11. Extension Guidelines
When adding pricing-related features:
1. Normalize inputs early (reuse `normalizePricing`).  
2. Extend engine (avoid ad-hoc arithmetic in components).  
3. Add parity or invariant test before refactoring semantics.  
4. Update engine version if external observable numbers can change (even slightly).  

---

## 12. Change Log (Phase 3)
| Version | Nature | Notes |
|---------|--------|-------|
| current | Semantic alignment | `unitPrice` alignment with legacy semantics |
| current | Centralization | Added `pricingConstants.ts` & migrated all alias lookups |
| current | Analytics | Added structured pricing summary & drift computation |
| current | Safety | Parity + constants regression tests introduced |

Future version bumps should enumerate: reason, migration steps (if any), expected numerical impact.

---

## 13. Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Silent config drift | Constants regression test + single source file |
| Undetected arithmetic regression | Parity test + feature flag fallback |
| Overhead changes altering business assumptions | Version tagging + analytics drift measurement |
| Premature legacy removal | Formal criteria checklist (Section 8) |

---

## 14. Pending / Future Phases
Planned (Phase 4+):
* Remove `legacyAuthoringCompute` post-soak.
* Introduce discounting / scenario analysis layer (extend config + analytics).
* Persist engine metrics for historical trend reporting.
* Optional: Move diff logging into structured telemetry emitter.

---

## 15. Quick Start (Developers)
```
// Access current config
import { getPricingConfig, updatePricingConfig } from '.../pricingConstants'

const cfg = getPricingConfig()
updatePricingConfig({ VAT_RATE: 0.18 }) // triggers new test baseline validation

// Enrich items (engine path)
import { enrichPricingItems } from '.../pricingHelpers'
const enriched = enrichPricingItems(rawItems)

// Analytics snapshot
import { buildPricingSummary } from '.../pricingAnalytics'
const summary = buildPricingSummary(enriched)
```

---

## 16. Summary
Phase 3 converted prior refactors into a robust, configurable platform with explicit safety guarantees. The system is now prepared for feature evolution (discount models, scenario projections) without reintroducing duplication or silent numerical drift.

---

Maintainer Owner: Pricing Module Team (or designate)  
Please update this document upon any semantic change (version bump) or after legacy path removal.
