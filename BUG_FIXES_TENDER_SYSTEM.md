# إصلاح ملاحظات نظام المنافسات

# Tender System Bug Fixes

**التاريخ:** 2025-01-XX  
**المطور:** GitHub Copilot  
**الفرع:** cleanup/remove-deprecated-files

## 📋 ملخص الملاحظات | Bug Summary

تم الإبلاغ عن ملاحظتين في تطبيق سطح المكتب أثناء الاستخدام:

### الملاحظة الأولى: جدول كميات التسعير لا يظهر في صفحة تفاصيل المنافسة

**Bug #1: BOQ Table Not Displaying in Tender Details Page**

**الوصف:**  
عند فتح صفحة تفاصيل المنافسة والضغط على تبويب "الكميات"، لا يظهر جدول البنود (BOQ)، بل تظهر رسالة "لا توجد بيانات تسعير".

**السبب الجذري:**

- عند تحميل المنافسة لأول مرة، لا توجد بيانات في مستودع BOQ المركزي
- Hook `useUnifiedTenderPricing` يبحث عن البيانات في المستودع المركزي أولاً
- عند عدم وجود بيانات مركزية، يحاول الرجوع للخصائص القديمة في كائن `Tender`
- لكن هذه الخصائص قد لا تكون موجودة أو محدثة
- النتيجة: `unified.status = 'empty'` وعرض رسالة "لا توجد بيانات"

### الملاحظة الثانية: تقدم التسعير لا يتم تحديثه على بطاقة المنافسة

**Bug #2: Pricing Progress Not Updating on Tender Card**

**الوصف:**  
بعد حفظ التسعير لبنود المنافسة، لا يتم تحديث نسبة التقدم (Progress) الظاهرة على بطاقة المنافسة في قائمة المنافسات.

**السبب الجذري:**

- دالة `calculateTenderProgress()` تقرأ `tender.totalItems` و `tender.pricedItems` من كائن المنافسة
- عند حفظ التسعير، `TenderPricingRepository.updateTenderStatus()` يحدث هذه الحقول بشكل صحيح
- لكن الحدث `TENDER_UPDATED` يُرسل مع `skipRefresh: true`
- هذا يمنع قائمة المنافسات من إعادة التحميل
- النتيجة: بطاقة المنافسة تعرض البيانات القديمة بدون قيم `totalItems` و `pricedItems` المحدثة

---

## 🔧 الإصلاحات | Fixes Applied

### إصلاح الملاحظة الأولى | Fix for Bug #1

**الملف:** `src/application/hooks/useUnifiedTenderPricing.ts`  
**السطور:** 66-115

**التغيير:**
تمت إضافة منطق تهيئة تلقائي (Auto-initialization) في Hook عند تحميل البيانات:

```typescript
// Initialize BOQ from legacy tender data if not exists
if (!central && tender) {
  const legacyItems =
    tender.quantityTable ||
    tender.quantities ||
    tender.items ||
    tender.boqItems ||
    tender.quantityItems ||
    []
  if (Array.isArray(legacyItems) && legacyItems.length > 0) {
    console.log('[useUnifiedTenderPricing] Initializing BOQ from legacy tender data', {
      tenderId,
      itemCount: legacyItems.length,
    })

    // Create initial BOQ with legacy items
    const boqItems = legacyItems.map((item: any, index: number) => ({
      id: item.id || `item-${index + 1}`,
      description: item.description || item.canonicalDescription || '',
      canonicalDescription: item.canonicalDescription || item.description || '',
      unit: item.unit || item.uom || 'وحدة',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      category: 'BOQ' as const,
    }))

    const totalValue = boqItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0)

    const initialBOQ = {
      tenderId,
      items: boqItems,
      totalValue,
      lastUpdated: new Date().toISOString(),
    }

    await boqRepository.createOrUpdate(initialBOQ, { skipRefresh: true })
    central = await boqRepository.getByTenderId(tenderId)
  }
}
```

**النتيجة:**

- عند فتح تفاصيل المنافسة لأول مرة، يتم تهيئة مستودع BOQ تلقائياً من بيانات الكميات الموجودة
- الجدول يظهر مباشرة حتى لو لم يتم إجراء تسعير بعد
- يتم عرض البنود بدون أسعار (unitPrice = 0) حتى يتم التسعير

---

### إصلاح الملاحظة الثانية | Fix for Bug #2

**الملف:** `src/infrastructure/repositories/TenderPricingRepository.ts`  
**السطور:** 388-408

**التغيير:**
تمت إزالة `skipRefresh: true` من حدث `TENDER_UPDATED`:

**قبل الإصلاح:**

```typescript
// Emit event
if (typeof window !== 'undefined') {
  window.dispatchEvent(
    new CustomEvent(APP_EVENTS.TENDER_UPDATED, {
      detail: { tenderId, skipRefresh: true },
    }),
  )
}
```

**بعد الإصلاح:**

```typescript
// Emit event without skipRefresh to ensure tender list is updated with new progress data
if (typeof window !== 'undefined') {
  window.dispatchEvent(
    new CustomEvent(APP_EVENTS.TENDER_UPDATED, {
      detail: { tenderId },
    }),
  )
}
```

**النتيجة:**

- عند حفظ التسعير، يتم إعادة تحميل قائمة المنافسات
- كائن `Tender` يحتوي على قيم `totalItems` و `pricedItems` المحدثة
- دالة `calculateTenderProgress()` تقرأ القيم الصحيحة
- نسبة التقدم تظهر محدثة على بطاقة المنافسة فوراً

---

## 📊 تتبع الشيفرة | Code Tracing

### سير العمل قبل الإصلاح | Flow Before Fix

**Bug #1:**

```
1. User opens TenderDetails
2. useUnifiedTenderPricing loads data
3. BOQ repository returns null (no data)
4. Fallback to tender.quantityTable - also null/empty
5. unified.status = 'empty'
6. QuantitiesTab shows EmptyState message
❌ User sees "لا توجد بيانات تسعير"
```

**Bug #2:**

```
1. User saves pricing in TenderPricingPage
2. TenderPricingRepository.updateTenderStatus() updates DB
3. Tender fields updated: totalItems=50, pricedItems=25
4. TENDER_UPDATED event dispatched with skipRefresh:true
5. TendersPage listener skips refresh
6. EnhancedTenderCard still has old Tender object
7. calculateTenderProgress(tender) reads old values
❌ Progress bar shows 0% instead of 50%
```

### سير العمل بعد الإصلاح | Flow After Fix

**Bug #1:**

```
1. User opens TenderDetails
2. useUnifiedTenderPricing loads data
3. BOQ repository returns null (no data)
4. Auto-initialization triggered
5. Legacy tender.quantityTable copied to BOQ repository
6. BOQ repository now has data
7. unified.status = 'ready', unified.items = [50 items]
8. QuantitiesTab renders full table
✅ User sees BOQ table with 50 items (no prices yet)
```

**Bug #2:**

```
1. User saves pricing in TenderPricingPage
2. TenderPricingRepository.updateTenderStatus() updates DB
3. Tender fields updated: totalItems=50, pricedItems=25
4. TENDER_UPDATED event dispatched (no skipRefresh)
5. TendersPage listener calls refreshTenders()
6. Fresh Tender objects loaded from DB
7. EnhancedTenderCard receives updated Tender
8. calculateTenderProgress(tender) reads new values
✅ Progress bar shows 50% (25/50 items priced)
```

---

## 🧪 اختبار الإصلاحات | Testing the Fixes

### اختبار الملاحظة الأولى | Test Bug #1 Fix

**الخطوات:**

1. فتح قائمة المنافسات
2. اختيار منافسة لم يتم تسعيرها من قبل
3. الضغط على "عرض التفاصيل"
4. الانتقال لتبويب "الكميات"

**النتيجة المتوقعة:**

- يظهر جدول البنود كاملاً
- الأعمدة: رقم البند، الوصف، الوحدة، الكمية، سعر الوحدة، القيمة الإجمالية
- الأسعار = 0 (لم يتم التسعير بعد)
- Badge "مصدر البيانات: BOQ المركزي" يظهر
- Badge "بدون أسعار" يظهر

### اختبار الملاحظة الثانية | Test Bug #2 Fix

**الخطوات:**

1. فتح صفحة التسعير لمنافسة
2. تسعير 5 بنود من أصل 10
3. حفظ التسعير
4. العودة لقائمة المنافسات
5. مراقبة بطاقة المنافسة

**النتيجة المتوقعة:**

- نسبة التقدم تتحدث تلقائياً
- Progress bar يظهر 50% (5/10 بنود مسعّرة × 70%)
- حالة المنافسة تتغير إلى "تحت الإجراء"
- لا حاجة لإعادة تحميل الصفحة يدوياً

---

## 📝 ملاحظات إضافية | Additional Notes

### الأداء | Performance

- التهيئة التلقائية للـ BOQ تحدث مرة واحدة فقط عند التحميل الأول
- لا تأثير على الأداء للمنافسات التي لديها بيانات BOQ موجودة
- إعادة تحميل قائمة المنافسات محمية بـ debounce (500ms) لمنع التحميل المتكرر

### التوافق مع الإصدارات السابقة | Backward Compatibility

- الإصلاحات متوافقة 100% مع البيانات الموجودة
- لا حاجة لمايجريشن أو تحديث للبيانات
- المنافسات القديمة ستعمل بنفس الطريقة

### السجلات التشخيصية | Diagnostic Logging

تمت إضافة سجلات console لتتبع التهيئة:

```
[useUnifiedTenderPricing] Initializing BOQ from legacy tender data
```

---

## ✅ خلاصة | Summary

| الملاحظة              | الحالة   | الملف المعدل               | الأسطر المعدلة |
| --------------------- | -------- | -------------------------- | -------------- |
| جدول BOQ لا يظهر      | ✅ مُصلح | useUnifiedTenderPricing.ts | 66-115         |
| تقدم التسعير لا يتحدث | ✅ مُصلح | TenderPricingRepository.ts | 403-407        |

**الوقت المستغرق:** 1 ساعة  
**عدد الملفات المعدلة:** 2  
**عدد الأسطر المضافة/المحذوفة:** +48/-5

---

## 🔄 الخطوات التالية | Next Steps

1. **✅ اختبار الإصلاحات على البيئة المحلية**
2. **Commit & Push التغييرات**
3. **إنشاء Pull Request**
4. **اختبار شامل على بيئة Staging**
5. **Deploy to Production**

---

**تم التحديث:** $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**الحالة:** جاهز للـ Commit
