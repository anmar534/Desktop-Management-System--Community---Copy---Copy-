# Week 3: Testing & Quality Assurance Plan

**Start Date:** October 26, 2025  
**Status:** 🚀 In Progress  
**Focus:** Comprehensive testing for refactored tender system

---

## 🎯 Objectives

After 3 weeks of intensive refactoring (reducing ~6,000 LOC, creating ~4,000 LOC reusable infrastructure), Week 3 ensures:

1. ✅ All refactored pages work correctly
2. ✅ Store integrations function properly
3. ✅ No regressions introduced
4. ✅ Performance maintained or improved
5. ✅ E2E workflows complete successfully

---

## 📋 Testing Strategy

### Phase 1: Integration Tests (Days 1-3)

**Target:** Test refactored pages with their stores and utilities

#### Day 1: TendersPage Integration Tests ✅

**File:** `tests/integration/tenders-page.test.tsx`

**Test Coverage:**

- ✅ Store integration (useTendersStore)
- ✅ Filters functionality (tenderFilters.ts)
- ✅ Tab switching (tenderTabHelpers.ts)
- ✅ Quick actions (tenderQuickActions.ts)
- ✅ Dialogs (create, submit, delete)
- ✅ Summary calculations (tenderSummaryCalculator.ts)
- ✅ Performance cards rendering
- ✅ Metrics display

**Test Scenarios:**

1. Load tenders from store
2. Apply filters (status, category, search)
3. Switch between tabs
4. Execute quick actions
5. Open/close dialogs
6. Verify calculations
7. Test empty states
8. Test error states

---

#### Day 2: NewTenderForm Integration Tests ⏳

**File:** `tests/integration/new-tender-form.test.tsx`

**Test Coverage:**

- Form validation (tenderFormValidators.ts)
- Default values (tenderFormDefaults.ts)
- BOQ calculations (tenderInsightCalculator.ts)
- Sections rendering (BasicInfo, QuantityTable, Attachments)
- Form submission
- Store updates
- Error handling

**Test Scenarios:**

1. Render form with defaults
2. Validate required fields
3. Add/remove BOQ items
4. Calculate insights (total value, complexity)
5. Upload attachments
6. Submit form successfully
7. Handle validation errors
8. Test field dependencies

---

#### Day 3: TenderPricingPage Integration Tests ⏳

**File:** `tests/integration/tender-pricing-page.test.tsx`

**Test Coverage:**

- Store integration (useTenderPricingStore)
- Pricing calculations (useTenderPricingCalculations)
- BOQ item pricing
- Percentage inputs (administrative, operational, profit)
- Export functionality
- Helpers (tenderPricingHelpers.ts)
- Audit logging

**Test Scenarios:**

1. Load BOQ items for tender
2. Set unit prices
3. Calculate totals
4. Apply percentage costs
5. Export to Excel
6. Verify calculations accuracy
7. Test dirty state tracking
8. Test unsaved changes warning

---

### Phase 2: Store Unit Tests (Day 4)

**Target:** Test Zustand stores in isolation

#### useTendersStore Tests ⏳

**File:** `tests/stores/useTendersStore.test.ts`

**Test Coverage:**

- State initialization
- Tender CRUD operations
- Filter state management
- Tab state management
- Calculations (getTendersByStatus, summaries)
- Store reset

---

#### useTenderPricingStore Tests ⏳

**File:** `tests/stores/useTenderPricingStore.test.ts` (already exists, needs update)

**Test Coverage:**

- Pricing state management
- BOQ item updates
- Calculations (totals, percentages)
- Dirty state tracking
- Backup/restore functionality

---

### Phase 3: Utility Tests (Day 5)

**Target:** Test utility functions in isolation

#### Utility Files to Test:

1. **tenderFilters.ts** ⏳

   - applyFilters()
   - filterByStatus()
   - filterByCategory()
   - searchTenders()

2. **tenderSummaryCalculator.ts** ⏳

   - calculateSummaries()
   - getTotalValue()
   - getAverageWinChance()

3. **tenderFormValidators.ts** ⏳

   - validateRequiredFields()
   - validateDates()
   - validateBOQItems()

4. **tenderInsightCalculator.ts** ⏳

   - calculateTotalValue()
   - calculateComplexity()
   - generateInsights()

5. **tenderPricingHelpers.ts** ⏳
   - createQuantityFormatter()
   - createPricingAuditLogger()
   - getErrorMessage()

---

### Phase 4: E2E Tests (Days 6-7)

**Target:** Test complete user workflows

#### E2E Scenarios:

1. **Complete Tender Lifecycle** ⏳

   - Create new tender
   - Add BOQ items
   - Set pricing
   - Submit tender
   - Verify in list

2. **Tender Pricing Workflow** ⏳

   - Open tender pricing page
   - Load BOQ items
   - Set unit prices for all items
   - Apply percentages
   - Export to Excel
   - Verify calculations

3. **Filter & Search** ⏳

   - Apply status filter
   - Apply category filter
   - Search by name
   - Combine filters
   - Clear filters

4. **Quick Actions** ⏳
   - Test each quick action
   - Verify dialogs open
   - Complete actions
   - Verify results

---

## 🧪 Testing Tools & Setup

### Current Infrastructure

**Unit/Integration Tests:**

- **Framework:** Vitest
- **React Testing:** @testing-library/react
- **Matchers:** @testing-library/jest-dom
- **Environment:** jsdom
- **Setup:** tests/setup.ts
- **Config:** vitest.config.ts

**E2E Tests:**

- **Framework:** Playwright
- **Config:** playwright.desktop.config.ts
- **Location:** tests/e2e/desktop/
- **Timeout:** 120s
- **Workers:** 1 (sequential)

**Test Structure:**

```
tests/
├── integration/      # Page integration tests
├── stores/          # Store unit tests
├── unit/            # Utility unit tests
├── e2e/             # End-to-end tests
├── fixtures/        # Test data
└── setup.ts         # Global setup
```

---

## 📊 Success Criteria

### Coverage Targets

- **Integration Tests:** 90%+ for refactored pages
- **Store Tests:** 100% for critical stores
- **Utility Tests:** 95%+ for helper functions
- **E2E Tests:** 100% for critical workflows

### Quality Metrics

- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ All tests passing
- ✅ No console errors in E2E tests
- ✅ Performance maintained (no regressions)

---

## 📅 Daily Schedule

### Day 1: TendersPage Tests (Oct 26) ✅

- [x] Create integration test file
- [x] Test store integration
- [x] Test filters
- [x] Test tabs
- [x] Test quick actions
- [x] Test dialogs
- [ ] Run tests and fix issues

### Day 2: NewTenderForm Tests (Oct 27)

- [ ] Create integration test file
- [ ] Test form validation
- [ ] Test sections
- [ ] Test submission
- [ ] Test calculations
- [ ] Run tests and fix issues

### Day 3: TenderPricingPage Tests (Oct 28)

- [ ] Create integration test file
- [ ] Test pricing calculations
- [ ] Test BOQ operations
- [ ] Test export
- [ ] Test helpers
- [ ] Run tests and fix issues

### Day 4: Store Tests (Oct 29)

- [ ] Update useTendersStore tests
- [ ] Update useTenderPricingStore tests
- [ ] Test all store methods
- [ ] Run tests and fix issues

### Day 5: Utility Tests (Oct 30)

- [ ] Test tenderFilters
- [ ] Test tenderSummaryCalculator
- [ ] Test tenderFormValidators
- [ ] Test tenderInsightCalculator
- [ ] Test tenderPricingHelpers
- [ ] Run all tests

### Days 6-7: E2E Tests (Oct 31 - Nov 1)

- [ ] Update tender-pricing.spec.ts
- [ ] Create new E2E scenarios
- [ ] Test complete workflows
- [ ] Fix any issues
- [ ] Final validation

---

## 🎯 Expected Outcomes

By end of Week 3:

1. ✅ **Comprehensive test coverage** for all refactored code
2. ✅ **Confidence in stability** - no hidden bugs
3. ✅ **Regression prevention** - tests catch future breaks
4. ✅ **Documentation** - tests serve as usage examples
5. ✅ **Production ready** - fully validated system

---

## 🧪 Current Test Status (Oct 26, 2025)

### Test Suite Results

```
✅ Total Tests: 748
✅ Passing: 731 (97.9%)
❌ Failing: 16 (2.1%)
⏭️  Skipped: 1

Test Files: 65 total (42 passed, 23 failed)
Duration: 68.96s
```

### Passing Test Categories ✅

1. **Storage Tests** - All passing
2. **Repository Tests** - All passing
3. **Integration Tests** - Mostly passing
4. **Smoke Tests** - All passing
5. **Analytics Tests** - All passing
6. **Hooks Tests** - All passing

### Failing Test Categories ❌

#### 1. EnhancedTenderCard Tests (13 failures)

**File:** `tests/ui/enhancedTenderCard.test.tsx`

**Issues:**

- Missing status badges ("ارسال", "جاهزة للإرسال")
- Missing completion indicators
- Missing progress percentages
- Text content not rendering as expected

**Root Cause:** Component refactoring may have changed UI structure/text

---

#### 2. TenderPricingStore Tests (3 failures)

**File:** `tests/unit/tenderPricingStore.test.ts`

**Failing Tests:**

1. ❌ `should load pricing for a tender`
   - Expected `currentTenderId` to be 'tender-123', got ''
2. ❌ `should set isDirty to true when updating`
   - Expected `isDirty` to be true, got false
3. ❌ `should auto-calculate totalPrice`

   - Expected `totalPrice` to be 500, got undefined

4. ❌ `should calculate completion percentage correctly`

   - Expected 70%, got 0%

5. ❌ `should count priced items correctly`

   - Expected 1, got 0

6. ❌ `should calculate total value correctly`

   - Expected 1100, got 0

7. ❌ `should rehydrate from storage`

   - Expected `currentTenderId` to be 'tender-123', got ''

8. ❌ `should save with skipRefresh flag` - **Storage Error**

   - Error: No storage adapter set. Call setAdapter() before initialize()

9. ❌ `should NOT trigger auto-save` - **Timeout**
   - Test timed out in 5000ms

**Root Cause:** Store implementation changed, tests need update

---

## � Updated Week 3 Schedule

### Day 1: Fix Failing Tests & Run Smoke Tests ✅

**Morning (2-3 hours):**

- [x] Run existing test suite ✅
- [x] Analyze failures ✅
- [ ] Fix EnhancedTenderCard tests (13 failures)
- [ ] Document UI changes from refactoring

**Afternoon (2-3 hours):**

- [ ] Fix TenderPricingStore tests (9 failures)
- [ ] Mock storage adapter properly
- [ ] Update test expectations

**Evening:**

- [ ] Run smoke tests
- [ ] Verify critical flows work
- [ ] Document Day 1 results

---

- Tests are written **after** refactoring to validate correctness
- Focus on **integration tests** first (highest value)
- **E2E tests** ensure real-world workflows work
- All tests follow **AAA pattern** (Arrange, Act, Assert)
- Use **fixtures** for consistent test data
- **Mock external dependencies** (file system, network)

---

**Status:** Day 1 Starting 🚀  
**Next:** Create TendersPage integration tests
