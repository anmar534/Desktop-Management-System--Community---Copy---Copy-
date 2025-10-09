# Legacy Pricing Compute Deprecation Plan

This plan operationalizes the removal of the legacy pricing computation path (legacyAuthoringCompute + related per-line transformations) now that domain pricing + dual-write + fallback guard are stable.

## 1. Scope

- Remove: any direct legacy pricing aggregation logic that duplicates domain PricingEngine semantics.
- Retain: domain layer (PricingEngine, dualWritePricing, metrics), snapshot handling, fallback flag (temporary), parity/golden tests (updated to domain-only).

## 2. Current Artifacts Referencing Legacy

- Comments / test helpers referencing `legacyAuthoringCompute`:
  - `test/hook.pricingDomainParity.test.ts` (will shift to domain integrity test)
  - `tests/pricing/authoringEngineParity.test.ts` (will be repurposed or removed)
  - Inline comment in `useDomainPricingEngine.ts` describing shape parity.

## 3. Phased Approach

| Phase | Action | Exit Criteria |
|-------|--------|---------------|
| P1 | Introduce golden domain snapshot test | Test passes & stored snapshot reviewed |
| P2 | Replace parity tests referencing legacy with domain assertions (structure + deterministic totals) | No test mentions legacy compute |
| P3 | Add one-time runtime warning if legacy path still reachable (defensive) | Warning observed once in staging |
| P4 | Remove any dead utility functions solely supporting legacy arrays | Bundle diff shows size reduction, tests green |
| P5 | Remove fallback flag (after observation window) | No rollback needed for ≥ X days |
| P6 | Final cleanup of docs (remove legacy references) | Architecture doc diff approved |

## 4. Golden Snapshot Strategy

- Create fixture input set (multi-line tender with varied percentages & zero-quantity edge case).
- Run domain transform -> capture canonical JSON (sorted by itemNumber, rounded to 2 decimals) under `tests/fixtures/domainPricingSnapshot.json`.
- Test: recompute and deep compare (excluding volatile timestamps). Fail if mismatch.

## 5. Observation & Metrics Gates

- Mismatch metrics remain zero (or ≤1 cent) for continuous 7 production days.
- No error spikes in dualWritePricing.
- Fallback flag unused (OFF) for entire observation window.

## 6. Risk Mitigation

- Fallback flag kept until just before P5.
- Git tag before deletion: `pre-legacy-compute-removal`.
- Rollback: revert PR or toggle fallback (if still present pre-P5).

## 7. Communication

- Pre-removal notice (engineering channel) 48h prior.
- Post-removal summary with metrics screenshot.

## 8. Acceptance Criteria for Completion

- All references to legacy compute removed (search yields zero matches for `legacyAuthoringCompute`).
- All tests pass (including golden snapshot).
- Architecture and removal checklist docs updated.
- Fallback flag removed (optional stretch) with explicit sign-off.

## 9. Open Decisions

- Whether to keep fallback flag beyond initial deprecation (default: remove after confidence window).
- Whether to add periodic recompute drift check (future enhancement; not blocking removal).

## 10. Tracking

- Owner: Pricing Domain Lead
- Target Start: (fill when scheduled)
- Target Completion: (fill when scheduled)

---
Prepared automatically. Update dates & owners before beginning P1.
