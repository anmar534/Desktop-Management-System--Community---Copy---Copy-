# تحليل شامل لنظام التسعير - المشاكل والحلول

**التاريخ:** 24 أكتوبر 2025  
**المحلل:** خبير برمجة تطبيقات سطح المكتب  
**الهدف:** إصلاح وتوحيد نظام التسعير وحل مشاكل Flash والتحذيرات

---

## 📋 ملخص تنفيذي

تم تحليل نظام تسعير المنافسات بالكامل واكتشاف **3 مشاكل رئيسية**:

1. ✅ **حُلّت سابقاً:** `updateTenderStatus` لم يكن يحفظ البيانات (تم إصلاحه)
2. ❌ **مشكلة نشطة:** Event Loop لا نهائي يسبب Flash وإعادة تحميل متكررة
3. ⚠️ **مشكلة تجربة المستخدم:** رسالة "تغييرات غير معتمدة" تظهر حتى بعد الحفظ

---

## 🔍 التحليل التفصيلي

### 1. بنية نظام التسعير (Data Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                    TenderPricingPage                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ useTenderPricingPersistence                        │     │
│  │  ├─ notifyPricingUpdate() → emits events          │     │
│  │  ├─ persistPricingAndBOQ() → saves to BOQ repo    │     │
│  │  └─ updateTenderStatus() → saves to Tender repo   │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────┬──────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
 ┌─────────────────┐                          ┌─────────────────┐
 │  BOQ Repository │                          │ Tender Repository│
 │  (BOQ Data)     │                          │ (Metadata)       │
 └────────┬────────┘                          └────────┬─────────┘
          │                                            │
          │ emits: boqUpdated                         │ emits: TENDER_UPDATED
          │                                            │
        ┌─┴────────────────────────────────────────────┴─┐
        │                                                 │
        ▼                                                 ▼
 ┌─────────────────────┐                       ┌──────────────────┐
 │ useUnifiedTender    │                       │   TendersPage    │
 │ Pricing (refresh)   │                       │  (refreshTenders)│
 └─────────────────────┘                       └──────────────────┘
          │                                              │
          ▼                                              ▼
  ┌──────────────┐                              ┌─────────────────┐
  │TenderDetails │                              │EnhancedTenderCard│
  │QuantitiesTab │                              │  (shows progress)│
  └──────────────┘                              └─────────────────┘
```

#### نقاط الحفظ الرئيسية:

**A) Pricing Data (البيانات التفصيلية):**

- **المكان:** `pricingService` → localStorage → `PRICING_DATA` key
- **المحتوى:** Map<itemId, PricingData> (materials, labor, equipment, subcontractors)
- **متى يحفظ:**
  - Auto-save (debounced): كل تعديل بعد 2 ثانية
  - Manual save: عند الضغط على "حفظ"

**B) BOQ Data (جدول الكميات المُسعّر):**

- **المكان:** `BOQRepository` → electron-store → `app_boq_data`
- **المحتوى:** items[] مع unitPrice, totalPrice, breakdown
- **متى يحفظ:** عند `persistPricingAndBOQ()` - manual save فقط
- **Event:** `boqUpdated` + skipRefresh flag

**C) Tender Metadata (حالة المنافسة):**

- **المكان:** `TenderRepository` → electron-store → `app_tenders_data`
- **المحتوى:** status, pricedItems, totalItems, totalValue, completionPercentage
- **متى يحفظ:** عند `updateTenderStatus()` - manual save فقط
- **Event:** `TENDER_UPDATED`

**D) Draft System (نظام المسودات):**

- **المكان:** `pricingStorageAdapter` → localStorage → `pricing_snapshots`
- **المحتوى:** official vs draft snapshots
- **المحتوى:** { items[], totals, meta.savedAt }
- **استخدام:** `useEditableTenderPricing` hook

---

### 2. تدفق البيانات في TenderDetails

**كيف تُجلب بيانات التسعير في QuantitiesTab:**

```typescript
// في TenderDetails.tsx
const unified = useUnifiedTenderPricing(tender)
// ↓
// useUnifiedTenderPricing.ts:
// 1. يقرأ من BOQ Repository باستخدام getBOQRepository()
// 2. يستمع لـ event boqUpdated
// 3. يفضل central BOQ على legacy data
// 4. يعيد: { items[], totals, source: 'central-boq' | 'legacy' }

// ثم يُمرر للـ tab:
<QuantitiesTab unified={unified} />
```

**مشكلة الفلاش:**

```typescript
// في useUnifiedTenderPricing.ts (السطر 130)
console.count('[useUnifiedTenderPricing] useMemo recalculation')
// ↑ يتكرر 32 مرة في الـ log!
```

**السبب:** `useMemo` dependencies تتغير باستمرار:

- `boqData` يتحدث من `version` state
- `version` يزيد كلما جاء `boqUpdated` event
- `legacyData` مستخرج من `tender` object properties
- كل تحديث في tender يسبب re-calculation

---

### 3. بطاقة المنافسة (EnhancedTenderCard)

**من أين تُجلب البيانات:**

```typescript
// في EnhancedTenderCard.tsx
const progress = calculateTenderProgress(tender)
// ↓
// tenderProgressCalculator.ts:
// 70% للتسعير = (pricedItems / totalItems) * 70
// 20% للملفات الفنية
// 10% لحالة submitted

// القيمة: tender.totalValue أو tender.value
// الحالة: tender.status
```

**كيف تُحدّث:**

1. `updateTenderStatus()` يحفظ في TenderRepository
2. TenderRepository.update() يُطلق `TENDER_UPDATED` event
3. TendersPage تستمع و تستدعي `refreshTenders()`
4. EnhancedTenderCard تعيد العرض ببيانات جديدة

---

## 🐛 المشاكل المكتشفة

### مشكلة #1: Event Loop لا نهائي ❌ CRITICAL

**الأعراض:**

```javascript
TendersPage.tsx:462 🔄 تم تحديث بيانات المناقصات - إعادة التحميل (×15 مرة)
useUnifiedTenderPricing.ts:130 [useUnifiedTenderPricing] useMemo recalculation: 32
storage.ts:450 ✅ Saved to electron-store: app_tenders_data (×4 مرات)
```

**السبب الجذري:**

```
1. User clicks "حفظ" في TenderPricingPage
   ↓
2. persistPricingAndBOQ() → BOQRepo.update()
   ↓
3. emits boqUpdated event (skipRefresh: true)
   ↓
4. updateTenderStatus() → TenderRepo.update()
   ↓
5. TenderRepo.update() → emits TENDER_UPDATED event
   ↓
6. TendersPage استمع → refreshTenders()
   ↓
7. refreshTenders() → getTenderRepository().getAll()
   ↓
8. تحديث state → re-render EnhancedTenderCard
   ↓
9. calculateTenderProgress() يقرأ tender.pricedItems
   ↓
10. TenderRepo قد يُطلق event مرة أخرى إذا كان هناك listener آخر
   ↓
11. يعود للخطوة 5 (Loop!)
```

**Evidence من الـ Log:**

```
storage.ts:450 ✅ Saved to electron-store: app_tenders_data
  ← حُفظ مرة واحدة
TendersPage.tsx:462 🔄 تم تحديث بيانات المناقصات - إعادة التحميل
  ← تكرر 15 مرة متتالية!
```

**الحل المقترح:**

```typescript
// في TendersPage.tsx - إضافة debounce + flag
const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
const isRefreshingRef = useRef(false)

useEffect(() => {
  if (typeof window === 'undefined') return undefined

  const onUpdated = () => {
    // منع re-entrance
    if (isRefreshingRef.current) {
      console.log('⏭️ تخطي إعادة التحميل - جاري التحميل بالفعل')
      return
    }

    // debounce متعدد updates في 500ms
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      isRefreshingRef.current = true
      console.log('🔄 تم تحديث بيانات المناقصات - إعادة التحميل')
      void refreshTenders().finally(() => {
        isRefreshingRef.current = false
      })
    }, 500)
  }

  window.addEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
  window.addEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)

  return () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, onUpdated)
    window.removeEventListener(APP_EVENTS.TENDER_UPDATED, onUpdated)
  }
}, [refreshTenders])
```

---

### مشكلة #2: useMemo re-calculation متكرر ⚠️

**الأعراض:**

```
useUnifiedTenderPricing.ts:130 [useUnifiedTenderPricing] useMemo recalculation: 23
useUnifiedTenderPricing.ts:130 [useUnifiedTenderPricing] useMemo recalculation: 24
... حتى 32!
```

**السبب:**

```typescript
// في useUnifiedTenderPricing.ts
const legacyData = useMemo(() => {
  return (
    tender.quantityTable ||
    tender.quantities ||
    tender.items ||
    tender.boqItems ||
    tender.quantityItems ||
    []
  )
}, [tender.quantityTable, tender.quantities, tender.items, tender.boqItems, tender.quantityItems])
```

المشكلة: هذه الـ dependencies تتغير كثيراً!

**الحل:**

```typescript
// استخدام tenderId فقط بدلاً من كل properties
const legacyData = useMemo(() => {
  if (!tender) return []

  return (
    tender.quantityTable ||
    tender.quantities ||
    tender.items ||
    tender.boqItems ||
    tender.quantityItems ||
    []
  )
}, [tender?.id]) // فقط tenderId!
```

---

### مشكلة #3: "تغييرات غير معتمدة" بعد الحفظ ⚠️

**الأعراض:**
رسالة تحذير تظهر حتى بعد الضغط على "اعتماد"

**السبب:**

```typescript
// في TenderPricingPage.tsx (السطر 630)
useEffect(() => {
  if (editablePricing.status !== 'ready') return
  if (typeof window !== 'undefined') {
    if (editablePricing.dirty || editablePricing.isDraftNewer) {
      //                             ^^^^^^^^^^^^^^^^^^^^^^^^
      //                             المشكلة هنا!
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }
  return undefined
}, [editablePricing])
```

**التحليل:**

`isDraftNewer` يبقى `true` حتى بعد `saveOfficial()` لأن:

```typescript
// في useEditableTenderPricing.ts
const saveOfficial = async (...) => {
  await pricingStorageAdapter.saveOfficial(...)
  // ✅ يحفظ official
  // ❌ لكن لا يُعيد تعيين isDraftNewer!
  // ❌ لا يحذف draft بعد approval
}
```

**الحل:**

```typescript
// في useEditableTenderPricing.ts
const saveOfficial = useCallback(
  async (itemsOverride?: PricingSnapshotItem[], totalsOverride?: PricingSnapshotTotals | null) => {
    if (!tenderId) return

    const itemsToSave = itemsOverride ?? items
    const totalsToSave = totalsOverride ?? totals

    await pricingStorageAdapter.saveOfficial(tenderId, itemsToSave, totalsToSave)

    // 🔧 إضافة: حذف draft بعد approval
    if (hasDraft) {
      await pricingStorageAdapter.deleteDraft(tenderId)
      setHasDraft(false)
      setIsDraftNewer(false)
      setDraftAt(undefined)
    }

    setDirty(false)
    setSource('official')
    const now = new Date().toISOString()
    setOfficialAt(now)
    lastSerializedRef.current = serialize(itemsToSave, totalsToSave)
  },
  [tenderId, items, totals, hasDraft],
)
```

---

### مشكلة #4: التبديل بين central-boq و legacy ⚠️

**الأعراض من الـ Log:**

```
useUnifiedTenderPricing.ts:201 Using central BOQ: {hasItems: true, hasPricing: false, ...}
useUnifiedTenderPricing.ts:213 Using legacy data (more complete): legacy count: 4 central count: 0
useUnifiedTenderPricing.ts:201 Using central BOQ: {hasItems: true, hasPricing: false, ...}
```

**السبب:**
Logic التبديل بين المصادر غير مستقر:

```typescript
// في useUnifiedTenderPricing.ts (السطر 195-215)
if (central && centralQualityCheck.hasItems && centralItems.length >= legacyCount) {
  source = 'central-boq'
  chosen = centralItems
  console.log('[useUnifiedTenderPricing] Using central BOQ:', centralQualityCheck, ...)
} else if (legacyCount > 0) {
  source = 'legacy'
  chosen = legacy
  console.log('[useUnifiedTenderPricing] Using legacy data (more complete):', ...)
}
```

المشكلة: الشرط `hasValidTotals: false` يسبب التبديل!

**الحل:**

```typescript
// إعطاء أولوية أعلى لـ central-boq إذا كان موجوداً
if (central && centralItems.length > 0) {
  // دائماً استخدم central إذا موجود
  source = 'central-boq'
  chosen = centralItems.map(...)

  // استخدم legacy فقط للـ fallback description
  if (!centralHasPricing && legacyCount > 0) {
    console.log('[useUnifiedTenderPricing] Using central structure with legacy pricing')
  }
} else if (legacyCount > 0) {
  // استخدم legacy فقط إذا لا يوجد central أبداً
  source = 'legacy'
  chosen = legacy
}
```

---

## ✅ الحلول المقترحة (خطة التنفيذ)

### Phase 1: إصلاح Event Loop (أولوية عالية 🔴)

**الملف:** `src/presentation/pages/Tenders/TendersPage.tsx`

1. ✅ إضافة debounce للـ refresh (500ms)
2. ✅ إضافة re-entrance guard
3. ✅ إضافة cleanup في return

**الكود:**

```typescript
// انظر "الحل المقترح" في المشكلة #1 أعلاه
```

**التأثير المتوقع:**

- ✅ تقليل TENDER_UPDATED events من 15 إلى 1
- ✅ إزالة Flash في الواجهة
- ✅ تحسين الأداء بنسبة 80%

---

### Phase 2: تحسين useMemo dependencies (أولوية متوسطة 🟡)

**الملف:** `src/application/hooks/useUnifiedTenderPricing.ts`

1. ✅ تغيير legacyData dependencies
2. ✅ إضافة memoization للـ quality check

**الكود:**

```typescript
const legacyData = useMemo(() => {
  if (!tender) return []
  return (
    tender.quantityTable ||
    tender.quantities ||
    tender.items ||
    tender.boqItems ||
    tender.quantityItems ||
    []
  )
}, [tender?.id]) // ← التغيير الرئيسي

const value = useMemo<UnifiedTenderPricingResult>(() => {
  // ... باقي الكود
}, [tenderId, loading, boqData, legacyData, refresh])
// ← إزالة tender.quantityTable, etc من dependencies
```

**التأثير المتوقع:**

- ✅ تقليل recalculations من 32 إلى ~5
- ✅ تحسين responsive في TenderDetails

---

### Phase 3: إصلاح Draft System (أولوية متوسطة 🟡)

**الملف:** `src/application/hooks/useEditableTenderPricing.ts`

1. ✅ حذف draft بعد saveOfficial()
2. ✅ إعادة تعيين isDraftNewer flag
3. ✅ تحديث UI بعد approval

**الكود:**

```typescript
// انظر "الحل" في المشكلة #3 أعلاه
```

**الملف الإضافي:** `src/application/services/pricingStorageAdapter.ts`

```typescript
// إضافة دالة deleteDraft
export const pricingStorageAdapter = {
  // ... الدوال الموجودة

  async deleteDraft(tenderId: string): Promise<void> {
    const key = `${PREFIX}${tenderId}_draft`
    await safeLocalStorage.removeItem(key)
  },
}
```

**التأثير المتوقع:**

- ✅ إزالة رسالة "تغييرات غير معتمدة" بعد الاعتماد
- ✅ تحسين UX

---

### Phase 4: توحيد source selection logic (أولوية منخفضة 🟢)

**الملف:** `src/application/hooks/useUnifiedTenderPricing.ts`

1. ✅ إعطاء أولوية ثابتة لـ central-boq
2. ✅ استخدام legacy للـ fallback فقط
3. ✅ إزالة التبديل المتكرر

**التأثير المتوقع:**

- ✅ source ثابت = 'central-boq' دائماً
- ✅ إزالة console.log المتكرر

---

## 📊 ملخص المشاكل والأولويات

| #   | المشكلة                | الخطورة       | الأولوية | الوقت المتوقع | الحالة |
| --- | ---------------------- | ------------- | -------- | ------------- | ------ |
| 1   | Event Loop لا نهائي    | 🔴 عالية جداً | P0       | 30 دقيقة      | ⏳     |
| 2   | useMemo re-calculation | 🟡 متوسطة     | P1       | 20 دقيقة      | ⏳     |
| 3   | "تغييرات غير معتمدة"   | 🟡 متوسطة     | P1       | 40 دقيقة      | ⏳     |
| 4   | source switching       | 🟢 منخفضة     | P2       | 30 دقيقة      | ⏳     |

**إجمالي الوقت:** ~2 ساعة

---

## 🎯 خطة الاختبار

### Test Case 1: Event Loop Fix

**الخطوات:**

1. فتح TenderPricingPage
2. تسعير بند واحد
3. الضغط على "حفظ"
4. فحص Console

**النتيجة المتوقعة:**

```
✅ Saved to electron-store: app_tenders_data (مرة واحدة فقط)
🔄 تم تحديث بيانات المناقصات - إعادة التحميل (مرة واحدة فقط)
```

---

### Test Case 2: useMemo Optimization

**الخطوات:**

1. فتح TenderDetails
2. التبديل بين tabs
3. فحص Console

**النتيجة المتوقعة:**

```
[useUnifiedTenderPricing] useMemo recalculation: 1 (فقط!)
[useUnifiedTenderPricing] useMemo recalculation: 2 (عند tab switch)
... ليس أكثر من 5 مرات
```

---

### Test Case 3: Draft System

**الخطوات:**

1. تسعير بند
2. مغادرة الصفحة → "تغييرات غير معتمدة"
3. الرجوع + الضغط "اعتماد"
4. محاولة المغادرة مرة أخرى

**النتيجة المتوقعة:**

```
❌ لا تظهر رسالة "تغييرات غير معتمدة"
✅ يتم المغادرة مباشرة
```

---

## 📝 ملاحظات إضافية

### نقاط القوة في النظام الحالي:

1. ✅ **فصل واضح للطبقات:** Presentation → Application → Domain
2. ✅ **Hooks منظمة جيداً:** useTenderPricingPersistence, useUnifiedTenderPricing
3. ✅ **Repository Pattern:** BOQRepository, TenderRepository
4. ✅ **Event-driven:** استخدام Custom Events للتواصل

### نقاط الضعف:

1. ❌ **Event Cascading:** Events تُطلق Events → Loop
2. ❌ **Over-memoization:** useMemo مع dependencies غير مستقرة
3. ❌ **Dual State:** draft vs official → confusion
4. ❌ **Source Switching:** التبديل بين central-boq و legacy

### توصيات طويلة المدى:

1. **استخدام State Management Library:**

   - Redux أو Zustand لإدارة global state
   - يمنع Event Loops
   - مركزية الـ updates

2. **إزالة Legacy Data Paths:**

   - الاعتماد الكامل على BOQ Repository
   - حذف tender.quantities, tender.items, etc

3. **Simplify Draft System:**

   - دمج draft و official في state واحد
   - استخدام `isDirty` flag بدلاً من 2 snapshots

4. **Add Integration Tests:**
   - اختبار full flow: pricing → save → display
   - منع regressions

---

**آخر تحديث:** 24 أكتوبر 2025  
**المحلل:** GitHub Copilot (خبير تطبيقات سطح المكتب)
