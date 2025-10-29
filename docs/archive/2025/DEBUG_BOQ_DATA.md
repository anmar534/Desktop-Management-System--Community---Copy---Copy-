# 🔍 تشخيص مشاكل SimplifiedProjectCostView

## المشاكل المُبلغ عنها:

1. ❌ **وصف البنود لا يظهر**
2. ❌ **التكاليف التقديرية لا تظهر**
3. ❌ **لا يوجد طريقة لإدخال التكاليف الفعلية**
4. ❌ **فشل استيراد من المنافسة**

## التحقق المطلوب:

### 1. فحص تحميل البيانات

افتح DevTools Console وابحث عن:

```
🧭 [SimplifiedProjectCostView] tenderId prop: ...
📊 [UI Render] البند X: ...
```

**الأسئلة:**

- هل يتم عرض `tenderId` بشكل صحيح؟
- هل يوجد بيانات في `items`؟
- هل تحتوي `item.description` على قيم؟
- هل تحتوي `item.estimated` على بيانات؟

### 2. فحص مصدر البيانات

الملف الحالي يستخدم:

```typescript
const { draft, loading, refresh, mergeFromTender } = useProjectBOQ(projectId)
const items = draft?.items ?? []
```

**التحقق:**

1. هل `useProjectBOQ` يُرجع بيانات؟
2. هل `draft.items` يحتوي على عناصر؟
3. هل البيانات تأتي من `projectCostService`?

### 3. فحص هيكل البيانات

الكود يتوقع:

```typescript
item.description // وصف البند
item.estimated.quantity // الكمية التقديرية
item.estimated.unitPrice // السعر التقديري
item.actual.quantity // الكمية الفعلية (input)
item.actual.unitPrice // السعر الفعلي (input)
```

### 4. فحص استيراد من المنافسة

الدالة:

```typescript
const handleImportFromTender = async () => {
  if (!tenderId) return
  await mergeFromTender(tenderId)
  refresh()
}
```

**السؤال:** هل `mergeFromTender` تعمل بشكل صحيح؟

## الحل المقترح:

### الخيار 1: استخدام `useBOQ` مباشرة

بدلاً من `useProjectBOQ` → استخدام `useBOQ` من application/hooks:

```typescript
import { useBOQ } from '@/application/hooks/useBOQ'

const { items, loading, error } = useBOQ({ projectId, tenderId })
```

هذا Hook يحمل البيانات من:

1. BOQRepository بشكل مباشر
2. يدعم `estimated` و `actual` structures
3. لا يعتمد على Draft System

### الخيار 2: إصلاح `projectCostService`

التحقق من أن `projectCostService`:

- يقرأ من BOQRepository بدلاً من projectCostDraft
- يُرجع البيانات بالهيكل الصحيح

### الخيار 3: استخدام المكون الموجود بدون تعديل

استخدام `src/components/cost/ProjectCostView.tsx` الذي يحتوي على:

- جدول كميات مُسعّر كامل
- إدخال الأسعار الفعلية
- تحليل التكاليف
- استيراد من المنافسة

## الإجراء الموصى به:

1. **فحص console.log** في المتصفح لتحديد سبب فقدان البيانات
2. **استبدال `useProjectBOQ`** بـ `useBOQ`
3. **التحقق من `importFromTender`** function

## التنفيذ التالي:

سأقوم بـ:

1. استبدال `useProjectBOQ` → `useBOQ`
2. إضافة تشخيص أفضل
3. إصلاح `importFromTender` إذا لزم الأمر
