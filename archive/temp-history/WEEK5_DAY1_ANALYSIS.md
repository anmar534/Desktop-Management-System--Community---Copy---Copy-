# Week 5, Day 1: تحليل TenderPricingPage للـ Migration

**التاريخ:** 24 أكتوبر 2025
**الهدف:** استبدال useUnifiedTenderPricing بـ Zustand Store

---

## 📋 الوضع الحالي - الهوكات الثلاثة

### 1️⃣ useUnifiedTenderPricing

**الاستيراد:**
```typescript
import { useUnifiedTenderPricing } from '@/application/hooks/useUnifiedTenderPricing'
```

**الاستخدام (سطر 138):**
```typescript
const unifiedPricing = useUnifiedTenderPricing(tender)
const { items: unifiedItems, source: unifiedSource, status: unifiedStatus } = unifiedPricing
```

**نقاط الاستخدام:**
- `unifiedItems` → يُستخدم في `parseQuantityItems()` (سطر 172)
- `unifiedSource` → يُستخدم في `parseQuantityItems()` (سطر 172)
- `unifiedStatus` → يُستخدم في `parseQuantityItems()` (سطر 172)

**الغرض:** قراءة بيانات BOQ من مصدر موحد (BOQ Repository)

---

### 2️⃣ useEditableTenderPricing

**الاستيراد:**
```typescript
import { useEditableTenderPricing } from '@/application/hooks/useEditableTenderPricing'
```

**الاستخدام (سطر 136):**
```typescript
const editablePricing = useEditableTenderPricing(tender)
```

**نقاط الاستخدام:**
- يُمرر كـ prop لـ `useTenderPricingState` (سطر 140)
- يُستخدم لإدارة المسودة vs النسخة الرسمية

**الغرض:** إدارة حالة التعديل (Draft/Official)

---

### 3️⃣ useTenderPricingPersistence

**الاستيراد:**
```typescript
import { useTenderPricingPersistence } from '@/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence'
```

**الاستخدام (سطر 308-320):**
```typescript
const { notifyPricingUpdate, persistPricingAndBOQ, updateTenderStatus, debouncedSave } =
  useTenderPricingPersistence({
    tender,
    pricingData,
    quantityItems,
    defaultPercentages,
    pricingViewItems,
    domainPricing,
    calculateProjectTotal,
    isLoaded,
    currentItemId,
    setPricingData,
    formatCurrencyValue,
  })
```

**الغرض:** إدارة الحفظ والمزامنة مع Repository

---

## 🎯 خطة الاستبدال - المرحلة الأولى (Day 1)

### الخطوة 1: استبدال useUnifiedTenderPricing فقط

**ما سنستبدله:**

```typescript
// ❌ القديم
const unifiedPricing = useUnifiedTenderPricing(tender)
const { items: unifiedItems, source: unifiedSource, status: unifiedStatus } = unifiedPricing

// ✅ الجديد
const { boqItems, isLoading } = useTenderPricingStore()

useEffect(() => {
  if (tender.id) {
    loadPricing(tender.id)
  }
}, [tender.id])
```

**التحديات:**
1. `parseQuantityItems()` تتوقع `unifiedItems, unifiedSource, unifiedStatus`
2. نحتاج لتعديل `parseQuantityItems` أو تمرير البيانات بطريقة مختلفة

**الحل المقترح:**
- نستخدم `boqItems` من Store مباشرة
- نزيل الاعتماد على `unifiedSource` و `unifiedStatus` (لم تعد ضرورية)

---

### الخطوة 2: تحديث parseQuantityItems

**الوضع الحالي:**
```typescript
const quantityItems: QuantityItem[] = useMemo(
  () => parseQuantityItems(tender, unifiedItems, unifiedSource, unifiedStatus),
  [tender, unifiedItems, unifiedSource, unifiedStatus],
)
```

**الجديد:**
```typescript
const quantityItems: QuantityItem[] = useMemo(
  () => {
    // استخدام boqItems من Store
    return boqItems.map(item => ({
      id: item.id,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      // ... باقي الحقول
    }))
  },
  [boqItems],
)
```

---

## 📊 التأثير المتوقع

### الملفات التي ستتغير:

1. **TenderPricingPage.tsx**
   - حذف import useUnifiedTenderPricing
   - إضافة import useTenderPricingStore
   - استبدال استدعاء الهوك
   - تحديث quantityItems computation

2. **parseQuantityItems.ts** (محتمل)
   - تبسيط signature
   - حذف parameters غير ضرورية

### القراءات:

- **قبل:** ~40 سطر (useUnifiedTenderPricing + usage)
- **بعد:** ~15 سطر (Zustand + useEffect)
- **التوفير:** ~25 سطر (-62.5%)

---

## ✅ Checklist - Day 1

- [x] قراءة TenderPricingPage
- [x] توثيق استخدام الهوكات الثلاثة
- [ ] قراءة parseQuantityItems implementation
- [ ] إنشاء خطة تفصيلية للاستبدال
- [ ] تنفيذ الاستبدال
- [ ] اختبار TypeScript errors
- [ ] اختبار يدوي
- [ ] Commit

---

## 🔍 الخطوات التالية

1. **الآن:** قراءة `parseQuantityItems` لفهم الاعتمادية
2. **ثم:** تنفيذ الاستبدال الفعلي
3. **أخيراً:** الاختبار والـ commit

---

**الملاحظات:**
- نركز على Day 1 فقط (useUnifiedTenderPricing)
- لن نمس useEditableTenderPricing أو useTenderPricingPersistence اليوم
- نريد تغيير تدريجي وآمن
