# Legacy Pricing Compute Deprecation Checklist

This document defines the structured plan to safely retire the legacy `legacyAuthoringCompute` pricing path after successful Phase 2 (domain pricing, SQLite persistence, dual-write, metrics, parity validation).

## 1. Current State Summary

Domain pricing engine + dual-write are feature-flagged and fully parity-aligned under Semantics A (category totals are line totals). All tests (72) pass. Dual-write mismatch metrics presently report negligible or zero deltas (<= 1 cent tolerance). Legacy path still executes first; domain path enriches UI (flag) and dual-write persists parallel copy (flag).

## 2. Preconditions (Must Be True Before Removal)

- [ ] Stable Observation Window completed (recommend: ≥ 7 consecutive days or ≥ N production pricing sessions) with:
  - Max total price delta ≤ 1 cent across all priced tenders.
  - 0 fatal domain pricing errors (engine failures / persistence errors) OR < 0.1% error rate with automatic fallback validated.
  - No divergence in VAT calculations (delta ≤ 1 cent).
- [ ] Metrics dashboard / logs confirm: mismatch counters remain at 0 (or within tolerance) after last functional change.
- [ ] No active debug investigations depending on legacy-specific intermediate values.
- [ ] Stakeholder sign‑off (Product + Engineering) acknowledging semantic decision (line totals) and parity evidence.
- [ ] Performance baseline collected (legacy vs domain) to ensure no significant regression (target: p95 pricing operation time within +10%).

## 3. Safety Nets (Must Exist Before Removal)

- [ ] Persistent snapshot / backup of last N priced tenders (already via SQLite + snapshot JSON) is verified restorable.
- [ ] Toggle strategy defined:
  - Primary: `FEATURE_PRICING_DUAL_WRITE` (keep during transition, then remove last)
  - (Retired) Temporary emergency kill switch (`FEATURE_PRICING_LEGACY_FALLBACK`) was used only during observation window; removed 2025-09-20.
- [ ] Runbook section added (Rollback procedure) to operations doc.
- [ ] Alerting rule: raise alert if domain pricing error rate > threshold OR unexpected deltas reappear (> 1 cent) post-removal.

## 4. Code Removal Steps

1. Remove legacy compute invocation from pricing save/enrichment flow.
2. Delete `legacyAuthoringCompute` implementation file(s) and associated types ONLY after confirming tests have replacement coverage.
3. Remove transformation glue that existed solely to feed legacy arrays if now redundant.
4. Update hook parity tests:
  - Replace legacy-vs-domain parity test with a pure domain integrity test (structure + rounding + idempotence) OR keep a historical regression fixture derived from final accepted outputs.
5. Remove dual-write mismatch logic OR repurpose it to become a self-consistency audit (optional): compare base recomputation vs persisted values periodically.
6. Remove feature flags:
  - Eliminate `USE_DOMAIN_PRICING_UI` gating if always-on now.
  - Eliminate `USE_PRICING_DUAL_WRITE` once legacy persistence path gone.
7. Delete obsolete metrics counters tracking mismatches; retain core pricing metrics (attempts, successes, failures) under new names if needed.
8. Run full test suite; ensure no skip / orphaned tests referencing removed symbols.
9. Search repo for legacy symbol names to confirm no lingering references (`legacyAuthoringCompute`, `legacy*Totals`, etc.).

## 5. Data & Migration Considerations

- No schema change required; domain schema already canonical.
- Confirm no external consumer (export, reporting) still reading legacy in-memory structures. If any:
  - Migrate consumer to domain repository API.
  - Provide compatibility adapter (thin mapping) for one release if needed.

## 6. Observability Adjustments

- Promote domain pricing metrics to primary dashboard.
- Add new metric: pricing_recompute_drift (periodic recompute of a random tender vs stored domain values) to detect silent drift.
- Log once per process start: domain pricing version / schema migration level.

## 7. Rollback Plan

If a critical defect discovered post-removal:

1. (Historical) Previously: toggle `FEATURE_PRICING_LEGACY_FALLBACK`. This mechanism was removed after stabilization.
2. If legacy removed from bundle entirely: hotfix branch reverts commit that deleted legacy code (keep git tag before removal: `pre-legacy-removal`).
3. Use latest snapshots / SQLite data to re-run pricing if needed (domain outputs deterministic under Semantics A).

## 8. Communication Plan

- Engineering: Send deprecation notice email/slack 1 sprint before removal with evidence (mismatch metrics, performance).
- Product / Support: Provide FAQ on semantic clarification (line totals) and assurance of unchanged user-visible totals.
- Post-Removal: Announce completion + how to monitor new metrics.

## 9. Test Strategy Evolution

Replace removed parity tests with:

- Deterministic golden file test: Domain pricing on fixture set yields exact JSON snapshot (stable rounding + ordering).
- Property tests (optional): scaling quantity by K scales totalPrice by K (except fixed overhead components) and unitPrice remains invariant where expected.
- Edge case tests: zero quantity guard, extreme large quantities (performance), rounding boundaries (fractions of cent just below/above .5).

## 10. Acceptance Criteria To Declare Legacy Fully Removed

- [ ] All preconditions satisfied (Section 2) and signed-off.
- [ ] PR merging removal yields green CI; no test referencing legacy names.
- [ ] Runtime (staging) smoke test: pricing flow completes for representative tender set with no errors.
- [ ] Post-deploy observation window (e.g., 24 hours) shows zero unexpected pricing anomalies.
- [ ] Documentation updated: architecture file + README reference only domain engine.

## 11. Timeline Template (Adjustable)

| Phase | Duration | Outcome |
|-------|----------|---------|
| Observation | 7 days | Confirm stability & metrics thresholds met |
| Prep | 1–2 days | Implement fallback flag, update docs/tests |
| Removal PR | 1 day | Code deletion + test refactor |
| Staging Bake | 1 day | No anomalies |
| Production Deploy | 1 day | Legacy removed |
| Post-Deploy Monitor | 1 day | Confirm no regressions |

## 12. Tracking Metadata

- Git tag before removal: `pre-legacy-removal`
- Issues / Tickets: Link tasks 13 (retire legacy) & 26 (this checklist) to removal PR.
- Owner: Pricing domain lead (assign in project tracker).

---
Prepared automatically as part of Phase 2 wrap-up. Update checklist statuses inline during execution.
