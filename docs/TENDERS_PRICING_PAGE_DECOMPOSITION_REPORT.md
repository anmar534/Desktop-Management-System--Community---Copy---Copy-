# تقرير تفكيك TenderPricingPage - Decomposition Report

**التاريخ:** 25 أكتوبر 2025  
**الملف المستهدف:** `src/presentation/pages/Tenders/TenderPricingPage.tsx`  
**الحالة الأولية:** 807 أسطر  
**الهدف:** تقليل إلى ~200 سطر + استخدام Zustand Store

---

## 📊 التحليل الأولي

### الوضع الحالي (قبل التفكيك)

```
TenderPricingPage.tsx: 807 LOC
├── Imports: 42 lines
├── Types: 26 lines
├── State Management: ~150 lines (useState duplicates!)
├── Formatters: ~30 lines (inline callbacks)
├── Business Logic: ~400 lines
└── Render: ~160 lines
```

### المشاكل المكتشفة

#### 1. تكرار State (Duplication with Store)

```typescript
❌ PROBLEM:
- useState<PricingData> في الملف
- tenderPricingStore لديه نفس البيانات
- عدم تزامن محتمل

✅ SOLUTION:
- استخدام Store مباشرة
- حذف useState duplicates
- Single source of truth
```

#### 2. formatQuantity مكرر 5 مرات

```typescript
❌ PROBLEM:
الملفات التالية لديها نفس الكود:
- TenderPricingPage.tsx
- MaterialsSection.tsx
- LaborSection.tsx
- EquipmentSection.tsx
- SubcontractorsSection.tsx

✅ SOLUTION:
- إنشاء useQuantityFormatter hook
- Reuse في جميع الملفات
- توفير ~40 سطر
```

#### 3. منطق معقد في ملف واحد

```typescript
❌ PROBLEM:
- defaultPercentages management (~90 LOC)
- Persistence logic (~70 LOC)
- View props preparation (~100 LOC)
- Completion stats (~20 LOC)

✅ SOLUTION:
- تفكيك إلى hooks منفصلة
- كل hook مسؤولية واحدة
- أسهل للاختبار والصيانة
```

---

## 🎯 خطة التنفيذ

### المرحلة 1: Global Formatters (أولوية قصوى)

#### A) useQuantityFormatter Hook

```typescript
📂 المسار: src/application/hooks/useQuantityFormatter.ts
📝 الحجم: ~30 LOC
🎯 الهدف: إزالة duplication في 5 ملفات

الملفات المتأثرة:
✅ TenderPricingPage.tsx
✅ MaterialsSection.tsx
✅ LaborSection.tsx
✅ EquipmentSection.tsx
✅ SubcontractorsSection.tsx

التوفير المتوقع: ~40 سطر
```

---

### المرحلة 2: Local Hooks (TenderPricing/hooks/)

#### B) useCollapsedSections

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useCollapsedSections.ts
📝 الحجم: ~30 LOC
🎯 الهدف: إدارة حالة الطي/التوسيع

الاستخراج من:
- Lines 227-242 (useState + toggleCollapse)

الاستخدام: TenderPricingPage فقط (محلي)
```

#### C) useCompletionStats

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useCompletionStats.ts
📝 الحجم: ~20 LOC
🎯 الهدف: حساب نسبة الإكمال

الاستخراج من:
- Lines 402-413 (completedCount + completionPercentage)

الاستخدام: TenderPricingPage + sub-components
```

#### D) useBeforeUnloadWarning

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useBeforeUnloadWarning.ts
📝 الحجم: ~20 LOC
🎯 الهدف: تحذير عند المغادرة مع تغييرات غير محفوظة

الاستخراج من:
- Lines 590-602 (beforeunload event listener)

الاستخدام: TenderPricingPage فقط
```

#### E) usePricingDataManager

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/usePricingDataManager.ts
📝 الحجم: ~120 LOC
🎯 الهدف: إدارة تحميل وحفظ بيانات التسعير

الاستخراج من:
- Lines 132-133 (pricingData state)
- Lines 244 (isLoaded state)
- Lines 424-447 (loading effect)

الميزات:
- Load pricing from service
- Handle defaultPercentages
- isLoaded flag management
```

#### F) useCurrentPricing

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useCurrentPricing.ts
📝 الحجم: ~80 LOC
🎯 الهدف: إدارة بيانات التسعير للبند الحالي

الاستخراج من:
- Lines 285-297 (currentPricing state)
- Lines 449-473 (load current item effect)

الميزات:
- Load saved pricing or initialize defaults
- Sync with defaultPercentages
```

#### G) useDefaultPercentages

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useDefaultPercentages.ts
📝 الحجم: ~90 LOC
🎯 الهدف: إدارة النسب الافتراضية وتطبيقها

الاستخراج من:
- Lines 171-182 (defaultPercentages + input states)
- Lines 467-564 (applyDefaultPercentagesToExistingItems)

الميزات:
- Manage percentage state
- Apply to existing items
- Recalculate with new percentages
```

#### H) usePersistenceManager

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/usePersistenceManager.ts
📝 الحجم: ~70 LOC
🎯 الهدف: إدارة حفظ البيانات وتحديث الحالة

الاستخراج من:
- Line 337 (repository init)
- Lines 339-357 (persistPricingAndBOQ)
- Lines 359-378 (updateTenderStatus)

الميزات:
- Repository initialization
- Persist pricing and BOQ
- Update tender status
- Notify other components
```

#### I) useViewPropsBuilder

```typescript
📂 المسار: src/presentation/pages/Tenders/TenderPricing/hooks/useViewPropsBuilder.ts
📝 الحجم: ~100 LOC
🎯 الهدف: تجهيز props للمكونات الفرعية

الاستخراج من:
- Lines 694-750 (summaryViewProps, pricingViewProps, technicalViewProps)

الميزات:
- Build props objects
- Memoization for performance
- Type-safe props preparation
```

---

## 📋 نطاق الاستخدام (Reusability Analysis)

### Global Hooks (application/hooks/)

| Hook                 | Files Using | Scope     | Location                 |
| -------------------- | ----------- | --------- | ------------------------ |
| useCurrencyFormatter | 8+ files    | ✅ Global | application/hooks/       |
| useQuantityFormatter | 5 files     | ✅ Global | application/hooks/ (NEW) |

### Local Hooks (TenderPricing/hooks/)

| Hook                   | Files Using | Scope    | Location                   |
| ---------------------- | ----------- | -------- | -------------------------- |
| useCollapsedSections   | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| useCompletionStats     | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| useBeforeUnloadWarning | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| usePricingDataManager  | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| useCurrentPricing      | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| useDefaultPercentages  | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| usePersistenceManager  | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |
| useViewPropsBuilder    | 1 file      | 🔒 Local | TenderPricing/hooks/ (NEW) |

---

## 🔍 التحقق من الملفات الموجودة

### ✅ فحص الملفات القديمة

```bash
# تم التحقق - لا توجد ملفات legacy:
✅ لا يوجد TenderPricingPage.LEGACY.tsx
✅ لا يوجد TenderPricingPage_OLD.tsx
✅ لا يوجد TenderPricingPage.BEFORE_PHASE_2.5.tsx
✅ لا يوجد backup files

النتيجة: نظيف وجاهز للتفكيك
```

### ✅ فحص Hooks الموجودة

```bash
# الـ Hooks الحالية في TenderPricing/hooks/:
✅ useItemNavigation.ts
✅ usePricingEventHandlers.ts
✅ usePricingRowOperations.ts
✅ usePricingTemplates.ts
✅ useSummaryOperations.ts
✅ useTenderPricingBackup.ts
✅ useTenderPricingCalculations.ts
✅ useTenderPricingState.ts

# الـ Hooks الجديدة (لا تعارض):
🆕 useCollapsedSections.ts
🆕 useCompletionStats.ts
🆕 useBeforeUnloadWarning.ts
🆕 usePricingDataManager.ts
🆕 useCurrentPricing.ts
🆕 useDefaultPercentages.ts
🆕 usePersistenceManager.ts
🆕 useViewPropsBuilder.ts
🆕 useQuantityFormatter.ts (في application/hooks/)

النتيجة: آمن للإنشاء - لا تعارض
```

---

## 📊 التوقعات بعد التفكيك

### الحجم المتوقع

```
قبل التفكيك:
├── TenderPricingPage.tsx: 807 LOC

بعد التفكيك:
├── TenderPricingPage.tsx: ~200-220 LOC ✅
├── application/hooks/
│   └── useQuantityFormatter.ts: ~30 LOC
└── TenderPricing/hooks/
    ├── useCollapsedSections.ts: ~30 LOC
    ├── useCompletionStats.ts: ~20 LOC
    ├── useBeforeUnloadWarning.ts: ~20 LOC
    ├── usePricingDataManager.ts: ~120 LOC
    ├── useCurrentPricing.ts: ~80 LOC
    ├── useDefaultPercentages.ts: ~90 LOC
    ├── usePersistenceManager.ts: ~70 LOC
    └── useViewPropsBuilder.ts: ~100 LOC

الإجمالي الجديد: ~760 LOC (منظمة في 10 ملفات)
التوفير الصافي: ~47 LOC
الفائدة الرئيسية: التنظيم + قابلية الصيانة
```

### الفوائد المتوقعة

#### 1. تحسين التنظيم

```
✅ Single Responsibility: كل hook مسؤولية واحدة
✅ Separation of Concerns: فصل المنطق عن العرض
✅ Easier Navigation: ملفات أصغر وأوضح
```

#### 2. تحسين القابلية للصيانة

```
✅ Easier Testing: hooks قابلة للاختبار منفصلة
✅ Easier Debugging: مشاكل محددة في ملفات محددة
✅ Easier Updates: تعديلات محلية لا تؤثر على الكل
```

#### 3. تحسين قابلية إعادة الاستخدام

```
✅ useQuantityFormatter: مشترك بين 5 ملفات
✅ إزالة duplication: ~40 سطر توفير
✅ Consistent formatting: نفس السلوك في كل مكان
```

#### 4. تحسين الأداء

```
✅ Better Memoization: hooks منفصلة تحسن re-rendering
✅ Cleaner Dependencies: تبعيات أوضح في useEffect/useMemo
✅ Optimized Re-renders: تحديثات محلية فقط
```

---

## ⚠️ المخاطر والتحديات

### التحديات المتوقعة

#### 1. Circular Dependencies

```
⚠️ المشكلة:
- hooks تعتمد على بعضها
- props passing معقد

✅ الحل:
- ترتيب hooks بعناية
- استخدام composition
- تجنب circular imports
```

#### 2. TypeScript Complexity

```
⚠️ المشكلة:
- generic types معقدة
- props typing متعدد المستويات

✅ الحل:
- types واضحة ومفصلة
- shared types في types.ts
- استخدام utility types
```

#### 3. Testing Complexity

```
⚠️ المشكلة:
- hooks متداخلة
- mocking معقد

✅ الحل:
- test utilities مشتركة
- mock factories
- integration tests
```

---

## 🔄 خطة الترحيل (Migration Plan)

### Phase 1: Preparation (يوم 1)

```bash
✅ إنشاء useQuantityFormatter
✅ تحديث 5 ملفات تستخدمه
✅ اختبار التوافق
✅ commit: "feat: add useQuantityFormatter hook"
```

### Phase 2: Simple Hooks (يوم 1-2)

```bash
✅ إنشاء useCollapsedSections
✅ إنشاء useCompletionStats
✅ إنشاء useBeforeUnloadWarning
✅ تحديث TenderPricingPage
✅ commit: "refactor: extract simple UI hooks"
```

### Phase 3: State Hooks (يوم 2-3)

```bash
✅ إنشاء usePricingDataManager
✅ إنشاء useCurrentPricing
✅ إنشاء useDefaultPercentages
✅ تحديث TenderPricingPage
✅ commit: "refactor: extract state management hooks"
```

### Phase 4: Business Logic Hooks (يوم 3-4)

```bash
✅ إنشاء usePersistenceManager
✅ إنشاء useViewPropsBuilder
✅ تحديث TenderPricingPage
✅ commit: "refactor: extract business logic hooks"
```

### Phase 5: Testing & Optimization (يوم 4-5)

```bash
✅ كتابة unit tests
✅ كتابة integration tests
✅ قياس الأداء
✅ optimization إن لزم
✅ commit: "test: add comprehensive tests for hooks"
```

---

## 📈 معايير النجاح

### Metrics

| Metric                       | Before | Target | Status |
| ---------------------------- | ------ | ------ | ------ |
| TenderPricingPage LOC        | 807    | ~200   | ⏳     |
| Files Count                  | 1      | 10     | ⏳     |
| Duplication (formatQuantity) | 5×     | 0×     | ⏳     |
| TypeScript Errors            | 0      | 0      | ✅     |
| Test Coverage                | ~40%   | 75%+   | ⏳     |
| Build Success                | ✅     | ✅     | ⏳     |

### Quality Gates

```
✅ 0 TypeScript errors
✅ 0 ESLint warnings
✅ All tests passing
✅ Build successful
✅ No runtime errors
✅ Performance maintained
```

---

## 🎯 التوصيات النهائية

### الأولويات

#### 1️⃣ أولوية قصوى (يجب تنفيذها)

```
🔥 useQuantityFormatter
   - يحل duplication في 5 ملفات
   - سهل وسريع (~15 دقيقة)
   - تأثير فوري
```

#### 2️⃣ أولوية عالية (موصى بها بشدة)

```
⭐ useCollapsedSections
⭐ useCompletionStats
⭐ useBeforeUnloadWarning
   - بسيطة ومستقلة
   - تحسن القراءة
   - آمنة للتنفيذ
```

#### 3️⃣ أولوية متوسطة (مهمة)

```
📊 usePricingDataManager
📊 useCurrentPricing
📊 useDefaultPercentages
📊 usePersistenceManager
   - معقدة قليلاً
   - تحتاج اختبار دقيق
   - فوائد كبيرة
```

#### 4️⃣ أولوية منخفضة (اختياري)

```
🔧 useViewPropsBuilder
   - يمكن تأجيلها
   - فائدة محدودة
   - تعقيد إضافي
```

---

## 📝 الملاحظات الإضافية

### مشاكل إضافية تم اكتشافها

#### 1. completionPercentage محسوب 3 مرات

```typescript
الملفات:
- TenderPricingPage.tsx (الأساسي)
- SummaryView.tsx (duplicate!)
- PricingHeader.tsx (duplicate!)

التوصية:
⏳ توحيد الحساب في useCompletionStats
⏳ مشاركة عبر Context أو Store
```

#### 2. defaultPercentages في TenderPricingWizard

```typescript
الوضع:
- TenderPricingWizard.tsx لديه logic منفصل
- لا تعارض (ملفات مختلفة)

القرار:
✅ لا مشكلة - كل صفحة مستقلة
```

---

## ✅ خلاصة التقرير

### النتائج الرئيسية

1. **✅ آمن للتنفيذ:**

   - لا توجد ملفات legacy متعارضة
   - لا توجد تبعيات خطيرة
   - خطة واضحة ومفصلة

2. **🔥 مشاكل مكتشفة:**

   - formatQuantity مكرر 5 مرات (حرج!)
   - completionPercentage محسوب 3 مرات (متوسط)
   - state duplication مع Store (حرج!)

3. **📈 فوائد متوقعة:**

   - تحسين التنظيم (كبير)
   - تحسين القابلية للصيانة (كبير)
   - إزالة duplication (متوسط)
   - تحسين قابلية الاختبار (كبير)

4. **⏱️ الوقت المتوقع:**
   - Phase 1: نصف يوم
   - Phase 2-3: يوم ونصف
   - Phase 4: يوم
   - Phase 5: يوم ونصف
   - **الإجمالي:** 4-5 أيام عمل

---

**التوصية النهائية:** ✅ **المضي قدماً في التنفيذ**

الفوائد تفوق المخاطر، والخطة واضحة ومفصلة، والتنفيذ آمن مع اتباع best practices.

---

**تاريخ التقرير:** 2025-10-25  
**الحالة:** ✅ جاهز للتنفيذ  
**المراجع التالي:** بعد Phase 2
