# Legacy Pricing Compute Removal PR Template

Use this template when submitting the PR that deletes `legacyAuthoringCompute` and related legacy pricing paths.

## Summary

Briefly describe what was removed and why now (reference soak period & zero mismatch metrics window).

## Scope Removed

- [ ] `legacyAuthoringCompute` function
- [ ] Any legacy-specific helper utilities
- [ ] Parity tests referencing legacy implementation
- [ ] Feature flags no longer needed (list)

## Artifacts Retained

- [ ] Domain `PricingEngine`
- [ ] `dualWritePricing` (or successor observation if still needed)
- [ ] Golden domain snapshot test
- [ ] Metrics collection (attempts / mismatches)

## Preconditions (verify before merge)

- [ ] Golden snapshot test passing
- [ ] Mismatch metrics == zero (or <= 1 cent rounding noise) for last 7 consecutive prod days
- [ ] Fallback flag not used in last 14 days
- [ ] No open "pricing-legacy-gap" issues
- [ ] Architecture doc updated (legacy section removed or archived)
- [ ] Removal checklist items 1–9 complete

## Risk & Rollback

- Tag created: `pre-legacy-compute-removal`
- Rollback plan: revert this PR (restores legacy code) OR reintroduce minimal shim if needed
- Expected blast radius: UI pricing display (unit & total) and downstream export relying on totals

## Observability After Merge

- Confirm no increase in pricing error logs
- Monitor mismatch metrics (should remain zero; consider disabling dual-write if code removed but metrics still referencing)

## Additional Notes

Add any migration notes or unexpected deltas addressed before merge.

---
Checklist auto-generated: adapt as needed.
