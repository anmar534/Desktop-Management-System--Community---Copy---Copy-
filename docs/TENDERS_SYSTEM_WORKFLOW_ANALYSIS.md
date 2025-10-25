# تحليل سير العمل - نظام المنافسات

# Tenders System Workflow Analysis

**التاريخ:** 25 أكتوبر 2025  
**الحالة:** 🔍 تحليل معماري بناءً على دورة حياة المنافسة

---

## 📊 فهم دورة حياة المنافسة

### المراحل الأساسية

```
1. إنشاء المنافسة (NewTenderForm)
   ├── معلومات أساسية
   ├── جدول الكميات (BOQ)
   ├── سعر شراء الكراسة
   └── المرفقات

2. التسعير (TenderPricingPage)
   ├── جلب جدول الكميات
   ├── تسعير البنود
   ├── حساب التكاليف
   └── اعتماد التسعير

3. التفاصيل (TenderDetails)
   ├── عرض المعلومات
   ├── جدول الكميات المُسعّر (مرجع!)
   ├── الأرباح المتوقعة
   ├── التكاليف المتوقعة
   └── الإيرادات

4. الإرسال (TendersPage)
   ├── رفع ملفات التقييم الفني
   ├── تحديث الحالة
   └── إرسال لإدارة المشتريات

5. النتائج (TenderResults)
   ├── إدخال النتيجة
   ├── إرسال للمشاريع (إذا فائزة)
   └── حفظ للدراسة (إذا خاسرة)
```

---

## 🔍 التحليل الحرج - البيانات المشتركة

### ⚠️ المشكلة الرئيسية المكتشفة

**جدول الكميات المُسعّر** هو **المحور الأساسي** للنظام!

```typescript
// دورة حياة BOQ (Bill of Quantities):

1. إنشاء BOQ (NewTenderForm)
   └── BOQItem[] (quantities only)

2. تسعير BOQ (TenderPricingPage)
   └── BOQItem[] + PricingData (مُسعّر)

3. ✅ اعتماد التسعير
   └── BOQItem[] + PricingData (final - مرجع!)

4. استخدام في صفحات متعددة:
   ├── TenderDetails (عرض)
   ├── Projects (نسخ البيانات)
   ├── Reports (الأرباح، التكاليف، الإيرادات)
   ├── Purchases (سعر شراء الكراسة)
   └── Analytics (تحليل الأسعار)
```

### 🚨 الفجوة المعمارية

**الوضع الحالي:**

```typescript
❌ كل صفحة تُحمّل BOQ بشكل مستقل
❌ لا يوجد "Single Source of Truth" للـ BOQ المُسعّر
❌ Duplication في تحميل البيانات
❌ لا يوجد cache للـ BOQ المُعتمد
```

**المطلوب:**

```typescript
✅ Centralized BOQ Store (Zustand)
✅ Single source of truth
✅ Automatic cache/sync
✅ Shared across pages
```

---

## 🎯 المكونات والـ Hooks المشتركة المطلوبة

### 1. BOQ Management (حرج جداً!)

#### A. useTenderBOQ (Global Hook - NEW!)

**الموقع:** `src/application/hooks/useTenderBOQ.ts`

**الغرض:** إدارة جدول الكميات عبر جميع مراحل المنافسة

```typescript
/**
 * Centralized BOQ Management Hook
 *
 * استخدام:
 * - NewTenderForm: إنشاء/تعديل BOQ
 * - TenderPricingPage: جلب + تسعير BOQ
 * - TenderDetails: عرض BOQ المُسعّر
 * - Projects: نسخ BOQ للمشروع
 * - Reports: حساب التكاليف/الأرباح
 */
interface UseTenderBOQReturn {
  // Data
  boq: BOQItem[] | null
  pricedBOQ: PricedBOQItem[] | null
  isApproved: boolean

  // Loading States
  isLoading: boolean
  isSaving: boolean

  // Actions
  loadBOQ: (tenderId: string) => Promise<void>
  saveBOQ: (items: BOQItem[]) => Promise<void>
  approveBOQ: (tenderId: string) => Promise<void>

  // Computed
  totalQuantity: number
  totalEstimatedCost: number
  totalPricedCost: number
  profit: number
  profitMargin: number
}

export function useTenderBOQ(tenderId: string): UseTenderBOQReturn {
  // Uses boqStore internally
  // Handles caching, sync, optimistic updates
  // Single source of truth
}
```

**الفائدة:**

```diff
+ ✅ Single source للـ BOQ في جميع الصفحات
+ ✅ Auto-sync بين الصفحات
+ ✅ Caching (لا نُحمّل من DB كل مرة)
+ ✅ Optimistic updates
+ ✅ Computed values جاهزة (total, profit, etc.)
```

**الملفات التي ستستخدمه:**

- ✅ NewTenderForm.tsx (إنشاء/تعديل)
- ✅ TenderPricingPage.tsx (تسعير)
- ✅ TenderDetails.tsx (عرض)
- ✅ Projects (عند الفوز)
- ✅ Reports/Analytics

---

#### B. boqStore (Zustand Store - NEW!)

**الموقع:** `src/stores/boqStore.ts`

```typescript
/**
 * BOQ Store - مخزن مركزي لجداول الكميات
 */
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
  setBOQ: (tenderId: string, items: BOQItem[]) => void
  setPricedBOQ: (tenderId: string, items: PricedBOQItem[]) => void
  approveBOQ: (tenderId: string) => void
  invalidateCache: (tenderId: string) => void

  // Selectors
  getBOQ: (tenderId: string) => BOQItem[] | null
  getPricedBOQ: (tenderId: string) => PricedBOQItem[] | null
  isApproved: (tenderId: string) => boolean
}
```

**الأولوية:** 🔥 **عالية جداً** (قبل كل شيء!)

---

### 2. Financial Calculations (مشترك!)

#### useFinancialCalculations (Global Hook - NEW!)

**الموقع:** `src/application/hooks/useFinancialCalculations.ts`

**الغرض:** حسابات مالية مشتركة (الأرباح، التكاليف، الإيرادات)

```typescript
/**
 * Financial Calculations Hook
 *
 * استخدام:
 * - TenderDetails: عرض الأرباح/التكاليف
 * - TenderPricingPage: حساب التكاليف الفورية
 * - Reports: تقارير مالية
 * - Analytics: تحليل الأرباح
 */
interface UseFinancialCalculationsReturn {
  // Costs
  totalMaterialsCost: number
  totalLaborCost: number
  totalEquipmentCost: number
  totalSubcontractorsCost: number
  totalDirectCost: number

  // Overheads & Profit
  administrativeCost: number
  operationalCost: number
  profitAmount: number

  // Totals
  totalCost: number
  totalPrice: number
  profitMargin: number

  // Breakdown
  costBreakdown: CostBreakdown
  profitBreakdown: ProfitBreakdown
}

export function useFinancialCalculations(
  pricedBOQ: PricedBOQItem[],
  percentages?: PricingPercentages,
): UseFinancialCalculationsReturn {
  // Pure calculations (no state)
  // Memoized (useMemo)
  // Used across multiple pages
}
```

**الملفات التي ستستخدمه:**

- ✅ TenderPricingPage.tsx
- ✅ TenderDetails.tsx
- ✅ SummaryView.tsx
- ✅ Reports/Analytics
- ✅ Projects (للنسخ)

---

### 3. Tender Status Management (مشترك!)

#### useTenderStatus (Global Hook - NEW!)

**الموقع:** `src/application/hooks/useTenderStatus.ts`

**الغرض:** إدارة حالة المنافسة عبر دورة الحياة

```typescript
/**
 * Tender Status Management Hook
 *
 * استخدام:
 * - TendersPage: تحديث الحالة
 * - TenderDetails: عرض الحالة
 * - Workflows: تتبع التقدم
 */
interface UseTenderStatusReturn {
  currentStatus: TenderStatus
  canTransitionTo: (status: TenderStatus) => boolean
  transitionTo: (status: TenderStatus) => Promise<void>

  // Workflow checks
  canStartPricing: boolean
  canSubmit: boolean
  canEnterResult: boolean

  // Status history
  statusHistory: StatusHistoryItem[]

  // Validations
  validateTransition: (to: TenderStatus) => ValidationResult
}

export function useTenderStatus(tenderId: string): UseTenderStatusReturn {
  // Manages tender status lifecycle
  // Validates transitions (draft → pricing → submitted → result)
  // Used across multiple pages
}
```

**الملفات التي ستستخدمه:**

- ✅ TendersPage.tsx
- ✅ TenderDetails.tsx
- ✅ TenderStatusManager.tsx
- ✅ TenderResultsManager.tsx

---

### 4. Document/Attachment Management (مشترك!)

#### useTenderAttachments (Global Hook - NEW!)

**الموقع:** `src/application/hooks/useTenderAttachments.ts`

**الغرض:** إدارة المرفقات في جميع مراحل المنافسة

```typescript
/**
 * Tender Attachments Management Hook
 *
 * استخدام:
 * - NewTenderForm: رفع مرفقات أولية
 * - TenderDetails: رفع ملفات التقييم الفني
 * - Projects: نسخ المرفقات
 */
interface UseTenderAttachmentsReturn {
  attachments: AttachmentItem[]

  // Actions
  uploadAttachment: (file: File, type: AttachmentType) => Promise<void>
  deleteAttachment: (id: string) => Promise<void>
  downloadAttachment: (id: string) => Promise<void>

  // Filters
  getTechnicalFiles: () => AttachmentItem[]
  getInitialFiles: () => AttachmentItem[]

  // Validation
  canSubmit: boolean // all required attachments uploaded?
}

export function useTenderAttachments(tenderId: string): UseTenderAttachmentsReturn {
  // Centralized attachment management
  // Used across NewTenderForm, TenderDetails
}
```

**الملفات التي ستستخدمه:**

- ✅ NewTenderForm.tsx
- ✅ TenderDetails.tsx (AttachmentsTab)
- ✅ TechnicalFilesUpload.tsx

---

### 5. Integration Hooks (للتكامل مع الأنظمة الأخرى)

#### A. usePurchaseIntegration (Global Hook - NEW!)

**الموقع:** `src/application/hooks/integrations/usePurchaseIntegration.ts`

```typescript
/**
 * Purchase Department Integration Hook
 *
 * عند إرسال المنافسة → إرسال سعر شراء الكراسة لإدارة المشتريات
 */
interface UsePurchaseIntegrationReturn {
  sendPurchaseOrder: (tenderId: string, bookletPrice: number) => Promise<void>

  purchaseOrderStatus: 'pending' | 'sent' | 'confirmed'
}
```

#### B. useProjectIntegration (Global Hook - NEW!)

**الموقع:** `src/application/hooks/integrations/useProjectIntegration.ts`

```typescript
/**
 * Projects Department Integration Hook
 *
 * عند الفوز → إرسال كافة معلومات المنافسة لإدارة المشاريع
 */
interface UseProjectIntegrationReturn {
  createProjectFromTender: (tenderId: string) => Promise<void>

  // Copies:
  // - Tender info
  // - Priced BOQ
  // - Attachments
  // - Financial data
}
```

---

## 🏗️ البنية المعمارية المُحدّثة

### الطبقات (Layers)

```
┌─────────────────────────────────────────────────┐
│  UI Layer (Pages & Components)                  │
├─────────────────────────────────────────────────┤
│  Global Hooks Layer (Shared Business Logic)     │
│  ├── useTenderBOQ ⭐ (أهم hook!)                │
│  ├── useFinancialCalculations                   │
│  ├── useTenderStatus                            │
│  ├── useTenderAttachments                       │
│  ├── useQuantityFormatter                       │
│  └── integrations/                              │
│      ├── usePurchaseIntegration                 │
│      └── useProjectIntegration                  │
├─────────────────────────────────────────────────┤
│  Stores Layer (Zustand)                         │
│  ├── boqStore ⭐ (جديد - حرج!)                  │
│  ├── tenderDetailsStore                         │
│  ├── tendersStore                               │
│  ├── tenderFormStore                            │
│  ├── tenderWizardStore                          │
│  └── tenderPricingStore                         │
├─────────────────────────────────────────────────┤
│  Repository Layer (Data Access)                 │
│  ├── BOQRepository                              │
│  ├── TenderRepository                           │
│  └── AttachmentRepository                       │
└─────────────────────────────────────────────────┘
```

---

## 📋 الخطة المُحدّثة - الأولويات

### Week -1: BOQ Infrastructure (حرج!)

**Day -5: boqStore.ts**

```typescript
Priority: 🔥🔥🔥 CRITICAL

File: src/stores/boqStore.ts
Size: ~200 LOC

Features:
- BOQ caching
- Priced BOQ storage
- Approval status
- Cache invalidation

Impact: Foundation لكل شيء!
```

**Day -4: useTenderBOQ.ts**

```typescript
Priority: 🔥🔥🔥 CRITICAL

File: src/application/hooks/useTenderBOQ.ts
Size: ~150 LOC

Features:
- Load/save BOQ
- Approve BOQ
- Computed totals
- Auto-sync

Used by: 5+ pages
```

**Day -3: useFinancialCalculations.ts**

```typescript
Priority: 🔥🔥 HIGH

File: src/application/hooks/useFinancialCalculations.ts
Size: ~200 LOC

Features:
- Cost calculations
- Profit calculations
- Breakdown reports

Used by: 4+ pages
```

---

### Week 0: Other Stores (كما مخطط)

```
Day -2: tendersStore.ts
Day -1: tenderDetailsStore.ts
Day 0: tenderFormStore.ts
Day 1: tenderWizardStore.ts
```

---

### Week 1+: Decomposition (كما مخطط)

```
Week 1: TenderPricingPage
Week 2: TendersPage + Form
Week 3: Wizard + Testing
```

---

## 🎯 المكونات المشتركة المطلوبة

### 1. BOQTable (Shared Component - NEW!)

**الموقع:** `src/presentation/components/shared/BOQTable.tsx`

**الغرض:** عرض جدول الكميات (مع/بدون أسعار)

```typescript
interface BOQTableProps {
  items: BOQItem[] | PricedBOQItem[]
  mode: 'view' | 'edit' | 'pricing'
  showPrices?: boolean
  onItemChange?: (item: BOQItem | PricedBOQItem) => void
  editable?: boolean
}

// استخدام:
// - NewTenderForm (edit mode)
// - TenderPricingPage (pricing mode)
// - TenderDetails (view mode)
// - Projects (view mode - copy)
```

**الفائدة:**

```diff
+ ✅ Consistent UI across pages
+ ✅ Single component to maintain
+ ✅ Reusable logic (sorting, filtering, etc.)
```

---

### 2. FinancialSummary (Shared Component - NEW!)

**الموقع:** `src/presentation/components/shared/FinancialSummary.tsx`

**الغرض:** عرض ملخص مالي (تكاليف، أرباح، إيرادات)

```typescript
interface FinancialSummaryProps {
  calculations: UseFinancialCalculationsReturn
  showBreakdown?: boolean
  variant?: 'compact' | 'detailed'
}

// استخدام:
// - TenderPricingPage
// - TenderDetails
// - Reports
```

---

### 3. TenderStatusBadge (Shared Component - EXISTS?)

**الموقع:** `src/presentation/components/shared/TenderStatusBadge.tsx`

```typescript
interface TenderStatusBadgeProps {
  status: TenderStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

// استخدام في كل مكان:
// - TendersPage (cards)
// - TenderDetails (header)
// - Lists/Tables
```

---

## 📊 التحليل النهائي - ما يجب بنائه بشكل مختلف

### ✅ Global Hooks (يجب أن تكون مشتركة)

```typescript
Priority 1 (حرج - قبل كل شيء):
🔥 useTenderBOQ (Day -4)
🔥 useFinancialCalculations (Day -3)

Priority 2 (عالي):
⭐ useTenderStatus (Day -2)
⭐ useTenderAttachments (Day -1)
⭐ useQuantityFormatter (Day 1)

Priority 3 (متوسط):
📊 usePurchaseIntegration (Week 2)
📊 useProjectIntegration (Week 2)
```

### ✅ Shared Components

```typescript
Priority 1:
🔥 BOQTable (Week 1)
🔥 FinancialSummary (Week 1)

Priority 2:
⭐ TenderStatusBadge (Week 2)
⭐ AttachmentUploader (Week 2)
```

### ✅ Stores

```typescript
Priority 1 (حرج):
🔥 boqStore (Day -5) ← جديد!

Priority 2 (عالي):
⭐ tenderDetailsStore (Day -2)
⭐ tendersStore (Day -1)
⭐ tenderFormStore (Day 0)
⭐ tenderWizardStore (Day 1)
⭐ tenderPricingStore (موجود ✅)
```

---

## 🚨 الفجوات الحرجة المكتشفة

### 1. BOQ Management (الأهم!)

```diff
! المشكلة:
  ❌ لا يوجد إدارة مركزية لجدول الكميات
  ❌ كل صفحة تُحمّل BOQ بشكل مستقل
  ❌ لا يوجد cache
  ❌ Duplication في الحسابات المالية

! الحل:
  ✅ boqStore (Zustand)
  ✅ useTenderBOQ (Global Hook)
  ✅ useFinancialCalculations (Global Hook)
  ✅ BOQTable (Shared Component)
```

### 2. Integration Points

```diff
! المشكلة:
  ❌ لا يوجد hooks للتكامل مع:
     - إدارة المشتريات
     - إدارة المشاريع

! الحل:
  ✅ usePurchaseIntegration
  ✅ useProjectIntegration
```

### 3. Status Management

```diff
! المشكلة:
  ❌ تحديث الحالة منتشر في أماكن متعددة
  ❌ لا توجد validation للـ transitions

! الحل:
  ✅ useTenderStatus (centralized)
  ✅ Status workflow validation
```

---

## 📅 Timeline المُحدّث النهائي

### Week -1: BOQ Infrastructure (5 أيام - **جديد!**)

```
Day -5: boqStore.ts (CRITICAL)
Day -4: useTenderBOQ.ts (CRITICAL)
Day -3: useFinancialCalculations.ts (HIGH)
Day -2: useTenderStatus.ts (HIGH)
Day -1: useTenderAttachments.ts (HIGH)
```

### Week 0: Other Stores (4 أيام)

```
Day 0: tenderDetailsStore.ts
Day 1: tendersStore.ts
Day 2: tenderFormStore.ts
Day 3: tenderWizardStore.ts
```

### Week 1-3: Decomposition (17 أيام)

```
Week 1: TenderPricingPage + Shared Components
Week 2: TendersPage + NewTenderForm + Integrations
Week 3: Wizard + Testing
```

**الإجمالي: 26 يوم (~5 أسابيع)**

---

## ✅ الخلاصة - الإجابة على سؤالك

### نعم! يوجد مكونات وهوكات يجب بنائها بطريقة مختلفة:

#### 🔥 Global Hooks (حرج):

```typescript
1. useTenderBOQ ⭐⭐⭐
   - أهم hook في النظام!
   - يُستخدم في 5+ صفحات
   - Single source للـ BOQ

2. useFinancialCalculations ⭐⭐⭐
   - حسابات مالية مشتركة
   - يُستخدم في 4+ صفحات

3. useTenderStatus ⭐⭐
   - إدارة دورة الحياة
   - يُستخدم في 3+ صفحات

4. useTenderAttachments ⭐⭐
   - إدارة المرفقات
   - يُستخدم في 2+ صفحات

5. useQuantityFormatter ⭐
   - تنسيق الكميات
   - يُستخدم في 5+ ملفات
```

#### 🔥 Shared Components:

```typescript
1. BOQTable ⭐⭐⭐
   - عرض جدول الكميات
   - 3+ modes (view, edit, pricing)
   - يُستخدم في 4+ صفحات

2. FinancialSummary ⭐⭐
   - ملخص مالي
   - يُستخدم في 3+ صفحات
```

#### 🔥 Stores:

```typescript
1. boqStore ⭐⭐⭐ (جديد - حرج!)
   - Cache للـ BOQ
   - Single source of truth
```

---

**التوصية النهائية:**

✅ **ابدأ بـ Week -1** (BOQ Infrastructure)  
✅ **ثم Week 0** (Other Stores)  
✅ **ثم Week 1-3** (Decomposition)

**السبب:**

- useTenderBOQ و boqStore هما **الأساس** للنظام بالكامل
- يجب بناؤهما **قبل** أي تفكيك
- كل الصفحات تعتمد عليهما

---

**التاريخ:** 2025-10-25  
**الحالة:** ✅ تحليل كامل بناءً على دورة حياة المنافسة  
**الأولوية:** Week -1 (BOQ Infrastructure) - **ابدأ الآن!**
