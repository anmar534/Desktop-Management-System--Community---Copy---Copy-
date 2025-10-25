# توضيح تدفق البيانات - جدول الكميات المُسعّر

# BOQ Data Flow Clarification

**التاريخ:** 25 أكتوبر 2025  
**الحالة:** ✅ تحديث حرج - توضيح الفرق بين التقديري والفعلي

---

## 🔍 التوضيح الحرج

### الفرق بين البيانات التقديرية والفعلية

```
┌─────────────────────────────────────────────────────────┐
│  نظام المنافسات (Tenders System)                       │
│  ↓                                                       │
│  جدول الكميات المُسعّر (Priced BOQ)                    │
│  ↓                                                       │
│  مبالغ تقديرية (Estimated Values) ⭐                   │
│  ├── الأرباح المتوقعة (Estimated Profit)               │
│  ├── التكاليف المتوقعة (Estimated Costs)               │
│  ├── الإيرادات المتوقعة (Estimated Revenue)            │
│  └── ميزانية المشروع (Project Budget)                  │
└─────────────────────────────────────────────────────────┘
                    ↓ (عند الفوز)
┌─────────────────────────────────────────────────────────┐
│  نظام المشاريع (Projects System)                       │
│  ↓                                                       │
│  نسخة BOQ (للمتابعة والمقارنة فقط!)                   │
│  +                                                      │
│  الربط مع المشتريات (Purchases Integration)            │
│  ↓                                                       │
│  مبالغ فعلية (Actual Values) ⭐⭐⭐                     │
│  ├── التكاليف الفعلية (Actual Costs) ← من المشتريات   │
│  ├── الإيرادات الفعلية (Actual Revenue) ← من المشروع  │
│  └── الأرباح الفعلية (Actual Profit) = Revenue - Cost │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 التحليل المُحدّث

### ما **لا يتغير** في الخطة

#### ✅ BOQ Infrastructure (يبقى كما هو)

```typescript
// boqStore & useTenderBOQ لا يزالان حرجين!
// السبب: جدول الكميات المُسعّر يُستخدم في:

1. TenderPricingPage
   └── تسعير البنود ✅

2. TenderDetails
   └── عرض التقديرات (Estimated) ✅

3. Projects (عند الفوز)
   └── نسخة للمقارنة مع الفعلي ✅

4. Reports/Analytics (داخل نظام المنافسات)
   └── تحليل التقديرات ✅
```

**القرار:** ✅ **boqStore + useTenderBOQ** يبقيان كما مخطط (حرجين!)

---

### ما **يتغير** في الخطة

#### 1. useFinancialCalculations (تحديث مهم!)

**قبل التوضيح:**

```typescript
// كنا نظن أن الحسابات المالية نهائية
interface UseFinancialCalculationsReturn {
  totalCost: number // ← ظننا نهائي
  profit: number // ← ظننا نهائي
  revenue: number // ← ظننا نهائي
}
```

**بعد التوضيح:**

```typescript
/**
 * Financial Calculations Hook - ESTIMATED VALUES ONLY
 *
 * ⚠️ هذه حسابات تقديرية فقط!
 * ⚠️ البيانات الفعلية تأتي من نظام المشاريع + المشتريات
 */
interface UseFinancialCalculationsReturn {
  // Estimated (تقديري) ⭐
  estimatedMaterialsCost: number
  estimatedLaborCost: number
  estimatedEquipmentCost: number
  estimatedSubcontractorsCost: number
  estimatedDirectCost: number

  estimatedAdministrativeCost: number
  estimatedOperationalCost: number
  estimatedProfitAmount: number

  estimatedTotalCost: number
  estimatedTotalPrice: number
  estimatedProfitMargin: number

  // Breakdown
  estimatedCostBreakdown: CostBreakdown
  estimatedProfitBreakdown: ProfitBreakdown
}
```

**التغيير:**

```diff
+ ✅ إضافة "estimated" لكل property
+ ✅ توضيح في التوثيق أن هذه تقديرات
+ ✅ الفعلي يأتي من Projects System
```

---

#### 2. TenderDetails Component (تحديث Labels)

**قبل:**

```typescript
// كانت Labels مضللة:
<div>الأرباح: {profit}</div>
<div>التكاليف: {totalCost}</div>
```

**بعد:**

```typescript
// Labels واضحة:
<div>الأرباح المتوقعة: {estimatedProfit}</div>
<div>التكاليف التقديرية: {estimatedTotalCost}</div>

// مع ملاحظة:
<Alert>
  ℹ️ هذه قيم تقديرية بناءً على التسعير.
  القيم الفعلية تظهر بعد تنفيذ المشروع.
</Alert>
```

---

#### 3. useProjectIntegration (تحديث مهم!)

**قبل التوضيح:**

```typescript
// كنا نظن ننسخ كل شيء
interface UseProjectIntegrationReturn {
  createProjectFromTender: (tenderId: string) => Promise<void>
  // ينسخ: tender + BOQ + financials ❌
}
```

**بعد التوضيح:**

```typescript
/**
 * Project Integration Hook
 *
 * عند الفوز:
 * 1. نسخ معلومات المنافسة الأساسية ✅
 * 2. نسخ BOQ المُسعّر (كمرجع/ميزانية) ✅
 * 3. ⚠️ لا ننسخ المبالغ المالية كـ "فعلية"
 * 4. ⚠️ التكاليف الفعلية تأتي من المشتريات
 */
interface UseProjectIntegrationReturn {
  createProjectFromTender: (tenderId: string) => Promise<{
    projectId: string
    copiedData: {
      tenderInfo: boolean
      estimatedBOQ: boolean // ← للمقارنة فقط
      budget: number // ← من BOQ المُسعّر
    }
  }>

  // جديد: للمقارنة
  compareBudgetVsActual: (projectId: string) => {
    budget: number // من BOQ (تقديري)
    actualCost: number // من المشتريات (فعلي)
    variance: number
    variancePercent: number
  }
}
```

**الهدف من نسخ BOQ:**

```typescript
// في نظام المشاريع:
interface ProjectWithBOQ {
  id: string

  // البيانات التقديرية (من المنافسة)
  estimatedBOQ: PricedBOQItem[] // ← للمقارنة
  budget: number // ← الميزانية المرصودة

  // البيانات الفعلية (من المشتريات)
  actualCosts: ActualCost[] // ← من نظام المشتريات
  actualRevenue: number // ← من تنفيذ المشروع

  // المقارنة
  budgetVariance: number // budget - actualCost
  isOverBudget: boolean
}
```

---

#### 4. Reports/Analytics (توضيح النطاق)

**في نظام المنافسات:**

```typescript
// Reports تعرض فقط التقديرات:

interface TenderReportsData {
  estimatedProfit: number // ← تقديري
  estimatedCost: number // ← تقديري
  estimatedRevenue: number // ← تقديري

  // مع ملاحظة:
  note: 'هذه قيم تقديرية. للقيم الفعلية راجع نظام المشاريع'
}
```

**في نظام المشاريع:**

```typescript
// Reports تعرض الفعلي:

interface ProjectReportsData {
  actualProfit: number // ← من المشاريع
  actualCost: number // ← من المشتريات
  actualRevenue: number // ← من المشروع

  // مع المقارنة:
  comparison: {
    estimatedProfit: number // من BOQ الأصلي
    actualProfit: number
    variance: number
  }
}
```

---

## ✅ ما يبقى كما هو في الخطة

### 1. boqStore (لا تغيير - حرج!)

```typescript
/**
 * BOQ Store - مخزن مركزي لجداول الكميات
 *
 * ✅ يبقى كما هو
 * السبب: نحتاجه لـ:
 * 1. Cache جداول الكميات
 * 2. التسعير (TenderPricingPage)
 * 3. عرض التقديرات (TenderDetails)
 * 4. نسخ للمشاريع (كمرجع)
 */
interface BOQStore {
  cache: Map<
    string,
    {
      items: BOQItem[]
      pricedItems: PricedBOQItem[] | null
      isApproved: boolean
      lastUpdated: number
    }
  >
  // ... بقية الـ actions
}
```

**القرار:** ✅ **لا تغيير** - نفذ كما مخطط

---

### 2. useTenderBOQ (لا تغيير - حرج!)

```typescript
/**
 * Centralized BOQ Management Hook
 *
 * ✅ يبقى كما هو
 */
interface UseTenderBOQReturn {
  boq: BOQItem[] | null
  pricedBOQ: PricedBOQItem[] | null
  isApproved: boolean

  loadBOQ: (tenderId: string) => Promise<void>
  saveBOQ: (items: BOQItem[]) => Promise<void>
  approveBOQ: (tenderId: string) => Promise<void>

  // هذه تقديرية (من BOQ المُسعّر)
  estimatedTotalCost: number
  estimatedProfit: number
  estimatedProfitMargin: number
}
```

**القرار:** ✅ **تحديث بسيط** - إضافة "estimated" للـ computed values

---

### 3. BOQTable Component (لا تغيير)

```typescript
/**
 * Shared BOQ Table Component
 *
 * ✅ يبقى كما هو
 * يُستخدم في:
 * 1. NewTenderForm (إنشاء)
 * 2. TenderPricingPage (تسعير)
 * 3. TenderDetails (عرض تقديري)
 * 4. Projects (عرض المرجع)
 */
```

**القرار:** ✅ **لا تغيير** - نفذ كما مخطط

---

## 🔄 التحديثات المطلوبة

### التحديثات البسيطة (لا تغير الخطة)

#### 1. Naming Convention

```typescript
// قبل:
totalCost: number
profit: number
revenue: number

// بعد:
estimatedTotalCost: number
estimatedProfit: number
estimatedRevenue: number
```

#### 2. UI Labels

```typescript
// قبل:
'الأرباح'
'التكاليف'
'الإيرادات'

// بعد:
'الأرباح المتوقعة'
'التكاليف التقديرية'
'الإيرادات المتوقعة'

// مع ملاحظة:
'* قيم تقديرية - للقيم الفعلية راجع نظام المشاريع'
```

#### 3. Documentation/Comments

```typescript
// إضافة توضيح في كل مكان:

/**
 * ⚠️ ESTIMATED VALUES ONLY
 * These are estimated values from tender pricing.
 * Actual values come from Projects + Purchases systems.
 */
```

---

## 📋 الخطة المُحدّثة

### Week -1: BOQ Infrastructure (5 أيام)

```typescript
✅ Day -5: boqStore.ts
   - لا تغيير
   - نفذ كما مخطط

✅ Day -4: useTenderBOQ.ts
   - تحديث بسيط: إضافة "estimated" للـ computed values
   - إضافة JSDoc comments

🔄 Day -3: useFinancialCalculations.ts
   - تحديث مهم: كل property تضاف "estimated"
   - إضافة توضيح في التوثيق
   - مثال:
     totalCost → estimatedTotalCost
     profit → estimatedProfit

✅ Day -2: useTenderStatus.ts
   - لا تغيير

✅ Day -1: useTenderAttachments.ts
   - لا تغيير
```

### Week 0: Page Stores (4 أيام)

```typescript
✅ لا تغييرات
   - نفذ كما مخطط
```

### Week 1: TenderPricingPage (5 أيام)

```typescript
✅ Day 1: useQuantityFormatter + BOQTable
   - لا تغيير

✅ Days 2-5: TenderPricingPage decomposition
   - تحديث: استخدام estimated* properties
   - تحديث UI labels
```

### Week 2: TendersPage + Form (6 أيام)

```typescript
✅ Days 6-8: TendersPage
   - لا تغيير

✅ Days 9-11: NewTenderForm
   - لا تغيير

🔄 Integration Hooks:
   - usePurchaseIntegration ← لا تغيير
   - useProjectIntegration ← تحديث:
     * نسخ BOQ كمرجع/budget
     * لا ننسخ المبالغ كـ "فعلية"
     * إضافة compareBudgetVsActual
```

### Week 3: Wizard + Testing (6 أيام)

```typescript
✅ لا تغييرات كبيرة
   - تحديث UI labels
   - تحديث documentation
```

---

## 📊 الخلاصة - التغييرات

### ✅ لا تتغير الخطة الأساسية

**السبب:**

- boqStore لا يزال حرجاً (cache + تسعير + مرجع)
- useTenderBOQ لا يزال حرجاً (single source)
- BOQTable لا يزال مشتركاً (4+ pages)
- Timeline يبقى 26 يوم

### 🔄 تحديثات بسيطة (تسميات فقط!)

```diff
التحديثات:
+ 1. Naming: إضافة "estimated" لكل المبالغ المالية
+ 2. UI Labels: توضيح "متوقع" / "تقديري"
+ 3. Documentation: ملاحظات عن الفعلي vs التقديري
+ 4. useProjectIntegration: نسخ BOQ كمرجع/budget فقط

Impact: بسيط (~2-3 ساعات إضافية للتحديثات)
```

### ⚠️ نقاط مهمة للتذكر

```typescript
// في نظام المنافسات:
const data = useFinancialCalculations(pricedBOQ)
console.log(data.estimatedProfit) // ← تقديري!

// في نظام المشاريع (مستقبلاً):
const project = useProjectData(projectId)
console.log(project.actualProfit) // ← فعلي (من المشتريات)

// المقارنة:
const variance = project.actualProfit - tender.estimatedProfit
```

---

## ✅ الإجابة على سؤالك

### هل يغير هذا شيئاً في الخطة؟

**الإجابة:** ✅ **لا - تغييرات بسيطة فقط!**

#### ما لا يتغير (90%):

- ✅ boqStore (حرج - نفذ كما مخطط)
- ✅ useTenderBOQ (حرج - نفذ كما مخطط)
- ✅ BOQTable component (نفذ كما مخطط)
- ✅ Timeline (26 يوم)
- ✅ الأولويات (Week -1 حرج)

#### ما يتغير (10%):

- 🔄 Naming: إضافة "estimated" للمبالغ المالية
- 🔄 UI Labels: توضيح "تقديري" / "متوقع"
- 🔄 Documentation: ملاحظات في التوثيق
- 🔄 useProjectIntegration: توضيح أن BOQ للمقارنة فقط

#### Impact:

```
وقت إضافي: ~2-3 ساعات
التعقيد: منخفض (تسميات فقط)
الأولوية: نفذ مع التحديثات العادية
```

---

## 🎯 التوصية النهائية

### ✅ **امضِ قدماً بالخطة كما هي**

**مع التحديثات البسيطة:**

```typescript
// أثناء التنفيذ:
1. استخدم "estimated" في كل naming
2. أضف labels واضحة في UI
3. وثّق الفرق بين estimated/actual
4. في useProjectIntegration: نسخ BOQ كـ budget reference

// النتيجة:
✅ كود واضح
✅ UI واضح للمستخدم
✅ لا confusion بين تقديري/فعلي
```

---

**التاريخ:** 2025-10-25  
**الحالة:** ✅ توضيح مُكتمل - الخطة سليمة مع تحديثات بسيطة  
**الخطوة التالية:** Week -1 Day -5 (boqStore) - **ابدأ الآن!**
