# Tenders file decomposition plan

This plan translates the modernization strategy into concrete, per-file refactors with explicit targets to reduce lines per file, introduce clearer boundaries, and remove legacy hooks. It is data-driven using the current repository state.

## Scope and targets

- Goal: reduce oversized files (≥ 500 LOC) into focused modules (≤ 200–300 LOC each) with stable public APIs.
- Priority order (highest first): pricing wizard, new tender form, tenders page, pricing page, legacy hooks, unified pricing hook, store.
- Success criteria:
  - No file over 300 LOC in the target set (exceptions allowed: types-only files).
  - Unit and integration tests passing (Vitest runner).
  - No imports of legacy persistence hooks in presentation layer.
  - Selector-based reads from the store; no prop-drilling over 3 levels.

## Current sizes (baseline)

Measured with PowerShell Measure-Object:

- src/features/tenders/pricing/TenderPricingWizard.tsx → 1540 LOC
- src/presentation/pages/Tenders/components/NewTenderForm.tsx → 1102 LOC
- src/presentation/pages/Tenders/TendersPage.tsx → 892 LOC
- src/presentation/pages/Tenders/TenderPricingPage.tsx → 707 LOC
- src/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence.ts → 638 LOC
- src/presentation/components/pricing/tender-pricing-process/hooks/useTenderPricingPersistence.ts → 596 LOC
- src/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingCalculations.ts → 353 LOC
- src/stores/tenderPricingStore.ts → 311 LOC
- src/application/hooks/useUnifiedTenderPricing.ts → 274 LOC

## Overview of planned splits

| File                                | Current LOC | Target modules (new files)                                                   | Target LOC per module |
| ----------------------------------- | ----------: | ---------------------------------------------------------------------------- | --------------------: |
| TenderPricingWizard.tsx             |        1540 | wizard/Container.tsx; wizard/steps/_; wizard/hooks/_; wizard/services/\*     |               150–220 |
| NewTenderForm.tsx                   |        1102 | NewTenderForm/index.tsx; sections/\*; schema.ts; hooks/useNewTenderForm.ts   |               100–200 |
| TendersPage.tsx                     |         892 | TendersPage/index.tsx; sections/{Filters,Toolbar,Stats,List,Empty}.tsx       |               120–200 |
| TenderPricingPage.tsx               |         707 | pricing-page/{HeaderBar,ActionsBar,Table,Summary}.tsx                        |               120–200 |
| useTenderPricingPersistence.ts (x2) |     638/596 | stores/effects/persistence.ts; services/persistence/\* (pure)                |               120–200 |
| useTenderPricingCalculations.ts     |         353 | services/calculations.ts (pure); hooks/usePricingCalculations.ts (thin)      |                80–150 |
| tenderPricingStore.ts               |         311 | stores/tenderPricing/{uiSlice,dataSlice,effectsSlice}.ts                     |                80–140 |
| useUnifiedTenderPricing.ts          |         274 | selectors/tenderPricingSelectors.ts; hooks/useUnifiedTenderPricing.ts (thin) |                80–140 |

Paths below are relative to `src/`.

---

## 1) TenderPricingWizard.tsx → feature module decomposition

- Current: `features/tenders/pricing/TenderPricingWizard.tsx` (1540 LOC)
- Target structure:
  - `features/tenders/pricing/wizard/Container.tsx` (orchestrator + route/step wiring)
  - `features/tenders/pricing/wizard/steps/`
    - `ItemsImportStep.tsx`
    - `MappingStep.tsx`
    - `ReviewStep.tsx`
    - `PricingStep.tsx`
    - `SummaryStep.tsx`
  - `features/tenders/pricing/wizard/hooks/`
    - `useWizardNavigation.ts`
    - `useWizardState.ts` (thin; delegates to store/selectors)
  - `features/tenders/pricing/wizard/services/`
    - `fileParsers.ts` (CSV/Excel parsing; move logic out of components)
    - `mappingEngine.ts` (pure mapping functions)
  - `features/tenders/pricing/types.ts` (reuse existing TenderPricing/types.ts or consolidate domain types, see section 6)

Refactor steps:

- Extract step UIs one by one; keep Container.tsx rendering and passing only IDs/keys to selectors.
- Move parsing/mapping/calculation utilities from components into `services/` pure functions.
- Replace local React state with store selectors and actions.

Acceptance:

- **LOC:** Container ≤ 150 LOC; each step ≤ 200 LOC; hooks ≤ 120 LOC
- **Imports:** No direct imports of legacy persistence hooks
- **Tests:**
  - Unit test coverage ≥ 80% for services/hooks
  - Integration test for complete wizard flow: `tests/integration/tenders/wizard-flow.test.ts`
- **Performance:**
  - Wizard step navigation < 50ms
  - Step validation < 100ms
  - File parsing (1000 rows) < 500ms
- **Accessibility:**
  - WCAG 2.1 AA compliance
  - axe-core 0 violations
  - Keyboard navigation fully functional
- **TypeScript:** 0 errors, 0 warnings
- **Build:** Successful with no console errors

---

## 2) NewTenderForm.tsx → form module decomposition

- Current: `presentation/pages/Tenders/components/NewTenderForm.tsx` (1102 LOC)
- Target structure:
  - `presentation/pages/Tenders/NewTenderForm/index.tsx` (composition only)
  - `presentation/pages/Tenders/NewTenderForm/sections/`
    - `MetaSection.tsx` (basic details)
    - `AttachmentsSection.tsx`
    - `BOQUploadSection.tsx`
    - `ValidationErrors.tsx`
  - `presentation/pages/Tenders/NewTenderForm/hooks/useNewTenderForm.ts`
  - `presentation/pages/Tenders/NewTenderForm/schema.ts` (Zod/Yup schema; pure)
  - `presentation/pages/Tenders/NewTenderForm/fields/` (Input/Select wrappers if repeated)

Refactor steps:

- Lift schema and validation into `schema.ts`.
- Extract sections incrementally; index.tsx orchestrates and wires submit/cancel.
- Hoist imperative effects to store actions where applicable.

Acceptance:

- **LOC:** index.tsx ≤ 150 LOC; each section ≤ 180 LOC; hook ≤ 120 LOC
- **Tests:**
  - Unit tests for schema validation (all edge cases)
  - Integration test for form submission flow
  - Mock file upload scenarios
- **Performance:**
  - Form rendering < 100ms
  - Validation (on submit) < 200ms
- **Validation:**
  - All required fields enforced
  - Error messages clear and in Arabic
- **TypeScript:** 0 errors; schema types exported correctly

---

## 3) TendersPage.tsx → page sections

- Current: `presentation/pages/Tenders/TendersPage.tsx` (892 LOC)
- Target structure:
  - `presentation/pages/Tenders/TendersPage/index.tsx`
  - `presentation/pages/Tenders/TendersPage/sections/Filters.tsx`
  - `presentation/pages/Tenders/TendersPage/sections/Toolbar.tsx`
  - `presentation/pages/Tenders/TendersPage/sections/Stats.tsx`
  - `presentation/pages/Tenders/TendersPage/sections/List.tsx`
  - `presentation/pages/Tenders/TendersPage/sections/Empty.tsx`

Refactor steps:

- Extract Filters, Toolbar, Stats, List, Empty sequentially.
- Replace prop-drilling with store selectors for read-only data.

Acceptance:

- **LOC:** index.tsx ≤ 150 LOC; each section ≤ 150–200 LOC
- **Performance:**
  - Render count ≤ 5 for common interactions (measured with React Profiler)
  - Filter application < 100ms
  - List rendering (100 items) < 200ms
- **Tests:**
  - Unit tests for filter/sort logic
  - Integration test for list + filters interaction
- **UX:**
  - No flickering during updates
  - Smooth scrolling (virtual list if needed)
- **TypeScript:** 0 errors

---

## 4) TenderPricingPage.tsx → sections + table

- Current: `presentation/pages/Tenders/TenderPricingPage.tsx` (707 LOC)
- Target structure:
  - `presentation/pages/Tenders/pricing-page/HeaderBar.tsx`
  - `presentation/pages/Tenders/pricing-page/ActionsBar.tsx`
  - `presentation/pages/Tenders/pricing-page/Table.tsx`
  - `presentation/pages/Tenders/pricing-page/SummarySidebar.tsx`
  - Reuse `TenderPricing/components/PricingRow.tsx` (move under `pricing-page/table/` if cohesion improves)

Refactor steps:

- Extract UI-only sections first; isolate data reads in small selectors.
- Migrate persistence side effects into store effects (see section 5).

Acceptance:

- **LOC:** Page container ≤ 180 LOC; sections ≤ 150–200 LOC
- **Imports:** No direct persistence hook imports in page
- **Performance:**
  - Pricing table render (500 rows) < 300ms
  - Cell edit update < 50ms
  - Save operation < 200ms
- **Tests:**
  - Unit tests for calculation functions
  - Integration test for pricing + save flow
- **TypeScript:** 0 errors
- **Data integrity:** No data loss during edits/saves

---

## 5) Legacy persistence hooks → store effects + pure services

- Current heavy hooks:
  - `presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence.ts` (638 LOC)
  - `presentation/components/pricing/tender-pricing-process/hooks/useTenderPricingPersistence.ts` (596 LOC)

Plan:

- Extract all I/O and serialization into pure services:
  - `services/tenderPricing/persistence/boqPersistence.ts`
  - `services/tenderPricing/persistence/tenderPersistence.ts`
- Implement thin store-driven effects:
  - `stores/tenderPricing/effectsSlice.ts` (subscribe to state changes and call services)
- Replace all imports of legacy hooks in pages/components with store actions/selectors.

Acceptance:

- No direct imports of legacy hooks in presentation layer.
- effectsSlice ≤ 150 LOC; each service file ≤ 120–180 LOC.

---

## 6) Calculations and unified pricing hook → pure selectors

- `presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingCalculations.ts` (353 LOC)
  - Move pure math/aggregation to `services/tenderPricing/calculations.ts`.
  - Keep hook as glue only: input params → calls selectors/services.
- `application/hooks/useUnifiedTenderPricing.ts` (274 LOC)
  - Move derived views to `selectors/tenderPricingSelectors.ts`.
  - Keep hook thin; memoize selectors, not whole objects where possible.

Acceptance:

- Hook files ≤ 120 LOC; services/selectors are pure and covered by unit tests.

---

## 7) Store structure → slices

- Current: `stores/tenderPricingStore.ts` (311 LOC)
- Target structure:
  - `stores/tenderPricing/dataSlice.ts`
  - `stores/tenderPricing/uiSlice.ts`
  - `stores/tenderPricing/effectsSlice.ts`
  - `stores/tenderPricing/index.ts` (compose slices; export typed hooks/selectors)

Acceptance:

- Each slice ≤ 140 LOC; no direct persistence code in components.

---

## 8) Types consolidation

- Consolidate Tender types in `domain/tenders/types.ts`.
- Update imports from scattered `TenderPricing/types.ts` if overlapping.
- Prefer narrow exported types for UI.

Acceptance:

- Single source of truth for Tender/BOQ domain types.

---

## Execution checklist (incremental)

1. Create folders and placeholder files (no logic, exports only).
2. Move pure utilities/services first; add unit tests.
3. Extract UI sections/components; wire via store selectors/actions.
4. Replace legacy hook imports with store effects/selectors, delete hooks.
5. Run tests and profiling at each step.

## Validation gates

- Build: PASS must be maintained after every step.
- Lint/Typecheck: PASS; ensure code fences and headings conform in docs.
- Tests: PASS (Run unit tests (Vitest) task).

## Notes

- Use selector-based subscriptions to minimize re-renders.
- Keep each new file focused on a single responsibility.
- Maintain commit granularity: one logical extraction per commit for easy review.
