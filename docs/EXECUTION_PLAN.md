# خطة تحسين نظام المنافسات - التنفيذ

# Tenders System Improvement - Execution Plan

**التاريخ:** 25 أكتوبر 2025  
**الفرع:** `feature/tenders-system-quality-improvement`  
**المدة الإجمالية:** 26 يوم (~5 أسابيع)

---

## 📊 الملخص التنفيذي

### الأهداف

```
✅ تفكيك الملفات الكبيرة: 4,784 → 1,380 LOC (-71%)
✅ إزالة التكرار: ~1,650 LOC
✅ التحول إلى Store: 35 useState → 6 Stores
✅ مكونات مشتركة: 5 global hooks + 14 components
✅ أفضل الممارسات: 100% compliance
```

### الملفات المستهدفة

| الملف                   | الحالي | الهدف | التحسين | Store              |
| ----------------------- | ------ | ----- | ------- | ------------------ |
| TenderDetails.tsx       | 443    | 380   | -15%    | tenderDetailsStore |
| TenderPricingPage.tsx   | 807    | 200   | -75%    | tenderPricingStore |
| TendersPage.tsx         | 892    | 250   | -72%    | tendersStore       |
| NewTenderForm.tsx       | 1,102  | 300   | -73%    | tenderFormStore    |
| TenderPricingWizard.tsx | 1,540  | 250   | -84%    | wizardStore        |

---

## Week -1: BOQ Infrastructure (5 أيام)

### Day -5: boqStore.ts ⭐⭐⭐ CRITICAL

**الهدف:** إنشاء Store مركزي لجداول الكميات

**الملف:** `src/stores/boqStore.ts`

**المواصفات:**

```typescript
interface BOQStore {
  // Cache: tenderId → BOQ data
  cache: Map<
    string,
    {
      items: BOQItem[]
      pricedItems: PricedBOQItem[] | null
      isApproved: boolean
      lastUpdated: number
    }
  >

  // Current
  currentTenderId: string | null

  // Actions
  setBOQ(tenderId: string, items: BOQItem[]): void
  setPricedBOQ(tenderId: string, items: PricedBOQItem[]): void
  approveBOQ(tenderId: string): void
  invalidateCache(tenderId: string): void

  // Selectors
  getBOQ(tenderId: string): BOQItem[] | null
  getPricedBOQ(tenderId: string): PricedBOQItem[] | null
  isApproved(tenderId: string): boolean
}
```

**المخرجات:**

- [ ] boqStore.ts (~200 LOC)
- [ ] Unit tests
- [ ] TypeScript: 0 errors
- [ ] Documentation

**التبعيات:** لا شيء (Foundation)

---

### Day -4: useTenderBOQ.ts ⭐⭐⭐ CRITICAL

**الهدف:** Hook مركزي لإدارة BOQ عبر جميع الصفحات

**الملف:** `src/application/hooks/useTenderBOQ.ts`

**المواصفات:**

```typescript
interface UseTenderBOQReturn {
  // Data
  boq: BOQItem[] | null
  pricedBOQ: PricedBOQItem[] | null
  isApproved: boolean

  // Loading
  isLoading: boolean
  isSaving: boolean

  // Actions
  loadBOQ(tenderId: string): Promise<void>
  saveBOQ(items: BOQItem[]): Promise<void>
  approveBOQ(tenderId: string): Promise<void>

  // Computed (ESTIMATED)
  estimatedTotalCost: number
  estimatedProfit: number
  estimatedProfitMargin: number
}
```

**المخرجات:**

- [ ] useTenderBOQ.ts (~150 LOC)
- [ ] Unit tests
- [ ] Documentation (⚠️ ESTIMATED values)

**التبعيات:** boqStore (Day -5)

---

### Day -3: useFinancialCalculations.ts ⭐⭐ HIGH

**الهدف:** حسابات مالية مشتركة

**الملف:** `src/application/hooks/useFinancialCalculations.ts`

**المواصفات:**

```typescript
interface UseFinancialCalculationsReturn {
  // Costs (ESTIMATED)
  estimatedMaterialsCost: number
  estimatedLaborCost: number
  estimatedEquipmentCost: number
  estimatedSubcontractorsCost: number
  estimatedDirectCost: number

  // Overheads (ESTIMATED)
  estimatedAdministrativeCost: number
  estimatedOperationalCost: number
  estimatedProfitAmount: number

  // Totals (ESTIMATED)
  estimatedTotalCost: number
  estimatedTotalPrice: number
  estimatedProfitMargin: number

  // Breakdown
  estimatedCostBreakdown: CostBreakdown
  estimatedProfitBreakdown: ProfitBreakdown
}
```

**المخرجات:**

- [ ] useFinancialCalculations.ts (~200 LOC)
- [ ] Unit tests
- [ ] Documentation (⚠️ ESTIMATED - Actual from Projects)

**التبعيات:** Types

---

### Day -2: useTenderStatus.ts ⭐ MEDIUM

**الهدف:** إدارة دورة حياة المنافسة

**الملف:** `src/application/hooks/useTenderStatus.ts`

**المواصفات:**

```typescript
interface UseTenderStatusReturn {
  currentStatus: TenderStatus
  canTransitionTo(status: TenderStatus): boolean
  transitionTo(status: TenderStatus): Promise<void>

  // Workflow checks
  canStartPricing: boolean
  canSubmit: boolean
  canEnterResult: boolean

  // History
  statusHistory: StatusHistoryItem[]

  // Validation
  validateTransition(to: TenderStatus): ValidationResult
}
```

**المخرجات:**

- [ ] useTenderStatus.ts (~150 LOC)
- [ ] Unit tests
- [ ] Documentation

**التبعيات:** Types

---

### Day -1: useTenderAttachments.ts ⭐ MEDIUM

**الهدف:** إدارة مركزية للمرفقات

**الملف:** `src/application/hooks/useTenderAttachments.ts`

**المواصفات:**

```typescript
interface UseTenderAttachmentsReturn {
  attachments: AttachmentItem[]

  // Actions
  uploadAttachment(file: File, type: AttachmentType): Promise<void>
  deleteAttachment(id: string): Promise<void>
  downloadAttachment(id: string): Promise<void>

  // Filters
  getTechnicalFiles(): AttachmentItem[]
  getInitialFiles(): AttachmentItem[]

  // Validation
  canSubmit: boolean
}
```

**المخرجات:**

- [ ] useTenderAttachments.ts (~120 LOC)
- [ ] Unit tests
- [ ] Documentation

**التبعيات:** Types

---

## Week 0: Page-Specific Stores (4 أيام)

### Day 0: tenderDetailsStore.ts

**الملف:** `src/stores/tenderDetailsStore.ts`

**المواصفات:**

```typescript
interface TenderDetailsStore {
  currentTender: Tender | null
  activeTab: string
  showSubmitDialog: boolean
  isLoading: boolean

  setTender(tender: Tender): void
  setActiveTab(tab: string): void
  toggleSubmitDialog(open: boolean): void
}
```

**المخرجات:**

- [ ] tenderDetailsStore.ts (~150 LOC)
- [ ] Migration: TenderDetails.tsx

---

### Day 1: tendersStore.ts

**الملف:** `src/stores/tendersStore.ts`

**المواصفات:**

```typescript
interface TendersStore {
  // Data
  tenders: Tender[]
  selectedTender: Tender | null

  // Filters
  searchTerm: string
  activeTab: TenderTabId
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Views
  currentView: 'list' | 'pricing' | 'details' | 'results'

  // Dialogs
  deleteDialog: { open: boolean; tender: Tender | null }
  submitDialog: { open: boolean; tender: Tender | null }
  statusDialog: DialogState
  resultDialog: DialogState

  // Actions (50+)
}
```

**المخرجات:**

- [ ] tendersStore.ts (~300 LOC)

---

### Day 2: tenderFormStore.ts

**الملف:** `src/stores/tenderFormStore.ts`

**المواصفات:**

```typescript
interface TenderFormStore {
  formData: TenderFormData | null
  quantities: QuantityItem[]
  attachments: AttachmentLike[]
  validationErrors: Record<string, string>
  isLoading: boolean
  saveDialogOpen: boolean

  // Actions
  setFormField(field: string, value: any): void
  addQuantity(item: QuantityItem): void
  validateForm(): boolean
  submitForm(): Promise<void>
}
```

**المخرجات:**

- [ ] tenderFormStore.ts (~250 LOC)

---

### Day 3: wizardStore.ts

**الملف:** `src/stores/wizardStore.ts`

**المواصفات:**

```typescript
interface TenderWizardStore {
  selectedTenderId: string
  activeStepIndex: number
  steps: WizardStep[]
  draft: TenderPricingWizardDraft | null
  isDraftLoading: boolean
  autoSaveState: AutoSaveState

  // Actions
  setActiveStep(index: number): void
  nextStep(): void
  previousStep(): void
  saveDraft(): Promise<void>
  submitWizard(): Promise<void>
}
```

**المخرجات:**

- [ ] wizardStore.ts (~250 LOC)

---

## Week 1: TenderPricingPage + Shared (5 أيام)

### Day 1: useQuantityFormatter + BOQTable

**Global Hook:**

- [ ] useQuantityFormatter.ts (~30 LOC)
  - يحل duplication في 5 ملفات
  - Savings: ~220 LOC

**Shared Component:**

- [ ] BOQTable.tsx (~200 LOC)
  - 3 modes: view, edit, pricing
  - Used by: 4+ pages
  - Savings: ~600 LOC

---

### Day 2: Shared utilities

- [ ] Types (shared/types/boq.ts)
- [ ] Validation utilities
- [ ] Calculation utilities

---

### Day 3: Simple UI hooks

- [ ] useCollapsedSections.ts (~30 LOC)
- [ ] useCompletionStats.ts (~20 LOC)
- [ ] useBeforeUnloadWarning.ts (~20 LOC)

---

### Day 4: State hooks + Store integration

- [ ] usePricingDataManager.ts (~120 LOC)
- [ ] useCurrentPricing.ts (~80 LOC)
- [ ] useDefaultPercentages.ts (~90 LOC)
- [ ] إزالة useState من TenderPricingPage

---

### Day 5: Business logic + Testing

- [ ] usePersistenceManager.ts (~70 LOC)
- [ ] useViewPropsBuilder.ts (~100 LOC)
- [ ] Unit tests
- [ ] TenderPricingPage: 807 → ~200 LOC ✅

---

## Week 2: TendersPage + Form + Integrations (6 أيام)

### Days 6-8: TendersPage decomposition

**Hooks:**

- [ ] useFilteredTenders.ts (~100 LOC)
- [ ] useTendersSorting.ts (~80 LOC)
- [ ] useTenderActions.ts (~120 LOC)
- [ ] useDialogStates.ts (~60 LOC)
- [ ] useTendersSummary.ts (~80 LOC)

**Components:**

- [ ] TendersHeader.tsx (~100 LOC)
- [ ] TendersFilters.tsx (~120 LOC)
- [ ] TendersGrid.tsx (~150 LOC)
- [ ] TenderDialogs.tsx (~100 LOC)

**Result:** TendersPage: 892 → ~250 LOC ✅

---

### Days 9-11: NewTenderForm decomposition

**Hooks:**

- [ ] useFormState.ts (~150 LOC)
- [ ] useFormValidation.ts (~120 LOC)
- [ ] useBOQManagement.ts (~180 LOC)
- [ ] useExcelImport.ts (~150 LOC)
- [ ] useFormSubmit.ts (~100 LOC)

**Components:**

- [ ] BasicInfoSection.tsx (~150 LOC)
- [ ] BOQSection.tsx (uses BOQTable)
- [ ] ExcelImportSection.tsx (~100 LOC)
- [ ] AttachmentsSection.tsx (~80 LOC)

**Integration Hooks:**

- [ ] usePurchaseIntegration.ts
- [ ] useProjectIntegration.ts (⚠️ BOQ as budget reference)

**Result:** NewTenderForm: 1,102 → ~300 LOC ✅

---

## Week 3: Wizard + Testing (6 أيام)

### Days 12-15: TenderPricingWizard decomposition

**Step Components:**

- [ ] RegistrationStep.tsx (~300 LOC)
- [ ] TechnicalStep.tsx (~350 LOC)
- [ ] FinancialStep.tsx (~400 LOC)
- [ ] ReviewStep.tsx (~200 LOC)

**Hooks:**

- [ ] useWizardNavigation.ts (~100 LOC)
- [ ] useDraftManagement.ts (~150 LOC)
- [ ] useStepValidation.ts (~100 LOC)
- [ ] useWizardSubmit.ts (~120 LOC)

**Shared:**

- [ ] WizardHeader.tsx (~80 LOC)
- [ ] WizardNavigation.tsx (~100 LOC)

**Result:** TenderPricingWizard: 1,540 → ~250 LOC ✅

---

### Days 16-17: Integration Testing

- [ ] BOQ flow testing (across all pages)
- [ ] Store integration testing
- [ ] Performance testing
- [ ] E2E testing
- [ ] Documentation update

---

## 📊 Metrics & Success Criteria

### Code Quality

```
✅ TypeScript errors: 0
✅ ESLint warnings: 0
✅ Test coverage: >75%
✅ File size: <300 LOC each
✅ Duplication: removed ~1,650 LOC
```

### Performance

```
✅ Build time: same or better
✅ Bundle size: reduced (code splitting)
✅ Re-renders: optimized (Zustand)
```

### Store Migration

```
✅ useState migrated: 35/35
✅ Stores created: 6/6
✅ SSOT achieved: 100%
```

---

## 🎯 الأولويات

### Must Have (حرج)

- Week -1 Days -5 to -4: BOQ infrastructure
- Week 0: All stores
- Week 1: TenderPricingPage decomposition

### Should Have (مهم)

- Week 2: TendersPage + Form
- Integration hooks

### Could Have (جيد)

- Week 3: Wizard
- Advanced testing

---

**التاريخ:** 2025-10-25  
**الحالة:** جاهز للتنفيذ  
**البداية:** Week -1 Day -5 (boqStore)
