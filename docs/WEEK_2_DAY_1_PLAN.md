# Week 2 Day 1: TendersPage Refactoring Plan

**Target:** 999 LOC → ~250 LOC (75% reduction)  
**Strategy:** Replace custom components with Week 1 components

---

## Analysis of Current TendersPage.tsx (999 LOC)

### Components to Replace:

1. **TenderHeaderSummary** (lines 850-940, ~90 LOC)

   - Currently: Custom layout with StatusBadges + 4x DetailCard
   - Replace with: **FinancialSummaryCard** (from Week 1)
   - Metrics:
     - معدل الفوز (Win Rate %)
     - القيمة الإجمالية (Total Won Value)
     - المنافسات النشطة (Active Tenders Count)
     - قيمة الكراسات (Document Booklets Value)
   - Benefits: -70 LOC, consistent styling, trend indicators

2. **Inline Financial Calculations** (lines 206-289, ~84 LOC)

   - Currently: computeTenderSummary function with manual calculations
   - Can use: **useFinancialCalculations** hook patterns
   - Keep: Custom logic for urgent/expired tenders (domain-specific)

3. **Helper Functions** (lines 117-202, ~86 LOC)
   - Keep: parseNumericValue, getTenderDocumentPrice, matchesSearchQuery, matchesTabFilter
   - Move to: shared/utils/tender/ directory (reusable)

### Components to Keep:

1. **TenderTabs** (lines 952-999) - Custom tab navigation (domain-specific)
2. **Main Tenders component** - Core logic remains
3. **Alert Dialogs** - Delete and Submit confirmation
4. **EnhancedTenderCard** - Already a component

---

## Refactoring Steps:

### Step 1: Create TenderMetricsDisplay Component (NEW)

- Use **FinancialSummaryCard** from Week 1
- Props: tenderSummary, formatCurrencyValue
- Metrics:
  - Win Rate (percentage type)
  - Total Value (currency type)
  - Active Tenders (number type)
  - Documents Value (currency type)
- Add trend indicators (comparison with averages)

### Step 2: Extract Utility Functions

- Move to: `src/shared/utils/tender/tenderFilters.ts`
- Functions:
  - parseNumericValue
  - getTenderDocumentPrice
  - normaliseSearchQuery
  - matchesSearchQuery
  - matchesTabFilter
  - computeFilteredTenders

### Step 3: Extract TenderSummary Calculation

- Move to: `src/shared/utils/tender/tenderSummaryCalculator.ts`
- Function: computeTenderSummary
- Keep domain-specific logic

### Step 4: Replace TenderHeaderSummary

- Replace 90-line component with FinancialSummaryCard
- Use compact mode for top status badges
- Main metrics in grid layout

### Step 5: Simplify Main Component

- Remove unused helper functions
- Import extracted utilities
- Use new TenderMetricsDisplay component

---

## Expected LOC Breakdown After Refactoring:

| Section              | Before  | After   | Reduction            |
| -------------------- | ------- | ------- | -------------------- |
| Imports              | 50      | 30      | -20                  |
| Helper Functions     | 86      | 10      | -76 (moved to utils) |
| computeTenderSummary | 84      | 10      | -74 (moved to utils) |
| TenderHeaderSummary  | 90      | 0       | -90 (replaced)       |
| TenderMetricsDisplay | 0       | 20      | +20 (new)            |
| TenderTabs           | 48      | 48      | 0                    |
| Main Component       | 641     | 132     | -509                 |
| **TOTAL**            | **999** | **250** | **-749 (-75%)**      |

---

## Files to Create:

1. `src/shared/utils/tender/tenderFilters.ts` (~100 LOC)
2. `src/shared/utils/tender/tenderSummaryCalculator.ts` (~120 LOC)
3. `src/presentation/components/tenders/TenderMetricsDisplay.tsx` (~50 LOC)
4. `tests/shared/utils/tender/tenderFilters.test.ts` (~150 LOC)
5. `tests/shared/utils/tender/tenderSummaryCalculator.test.ts` (~180 LOC)

---

## Success Criteria:

- ✅ TendersPage.tsx reduced to ~250 LOC
- ✅ All functionality preserved (no regressions)
- ✅ Uses FinancialSummaryCard from Week 1
- ✅ Utility functions tested (100% coverage)
- ✅ TypeScript: 0 errors
- ✅ All existing tests still pass

---

## Implementation Order:

1. ✅ Create plan document (this file)
2. Create utility files (tenderFilters.ts, tenderSummaryCalculator.ts)
3. Write tests for utilities
4. Create TenderMetricsDisplay component
5. Refactor TendersPage.tsx to use new structure
6. Run tests and verify
7. Commit changes

---

**Next:** Start implementation with utility files extraction
