# 🔧 ملخص التعديلات على SimplifiedProjectCostView

## المشكلة الأساسية:

المكون كان يستخدم `useProjectBOQ` + `projectCostService` (Draft System الملغي) مما أدى إلى:

- عدم ظهور وصف البنود
- عدم ظهور التكاليف التقديرية
- فشل استيراد من المنافسة

## الحل المُنفذ:

### 1. استبدال Hook البيانات ✅

```typescript
// قبل:
const { draft, loading, refresh, mergeFromTender } = useProjectBOQ(projectId)
const items = draft?.items ?? []

// بعد:
const { items, loading } = useBOQ({ projectId, tenderId })
const boqRepository = useRepository(getBOQRepository)
```

### 2. إصلاح استيراد من المنافسة ✅

```typescript
const handleImportFromTender = async () => {
  // الحصول على BOQ من المنافسة مباشرة
  const tenderBOQ = await boqRepository.getByTenderId(tenderId)

  // نسخ إلى المشروع
  const projectBOQ = {
    id: `boq_project_${projectId}`,
    projectId,
    items: tenderBOQ.items.map((item) => ({
      ...item,
      id: `${item.id}_project`,
      originalId: item.id,
    })),
    totalValue: tenderBOQ.totalValue,
    lastUpdated: new Date().toISOString(),
  }

  await boqRepository.createOrUpdate(projectBOQ)
}
```

### 3. المتبقي (يحتاج تعديل):

جميع استخدامات `projectCostService.saveDraft` يجب أن تُستبدل بـ:

```typescript
// احصل على BOQ الحالي
const currentBOQ = await boqRepository.getByProjectId(projectId)

// عدّل البند المطلوب
const updatedItems = currentBOQ.items.map((item) => {
  if (item.id === itemId) {
    return { ...item /* التعديلات */ }
  }
  return item
})

// احفظ
await boqRepository.createOrUpdate({
  ...currentBOQ,
  items: updatedItems,
  lastUpdated: new Date().toISOString(),
})
```

## الخطة البديلة الأفضل:

**نظراً لتعقيد الكود الحالي (1436 سطر + 12 استخدام لـ projectCostService):**

### الخيار A: استخدام المكون الموجود

استخدام مكون آخر جاهز إذا كان موجوداً ويعمل مع BOQRepository

### الخيار B: تبسيط المكون الحالي

- إزالة كل منطق التعديل المعقد
- عرض البيانات فقط (read-only)
- إضافة زر "تعديل" يفتح modal بسيط

### الخيار C (الموصى به): إنشاء مكون جديد بسيط

```typescript
// مكون بسيط يعرض BOQ فقط مع إمكانية إدخال الأسعار الفعلية
function ProjectBOQView({ projectId, tenderId }) {
  const { items } = useBOQ({ projectId, tenderId })

  return (
    <table>
      {items.map(item => (
        <tr>
          <td>{item.description}</td>
          <td>{item.estimated?.quantity}</td>
          <td>{item.estimated?.unitPrice}</td>
          <td>
            <input // إدخال الكمية الفعلية
              type="number"
              defaultValue={item.actual?.quantity}
              onBlur={(e) => updateActual(item.id, 'quantity', e.target.value)}
            />
          </td>
          <td>
            <input // إدخال السعر الفعلي
              type="number"
              defaultValue={item.actual?.unitPrice}
              onBlur={(e) => updateActual(item.id, 'unitPrice', e.target.value)}
            />
          </td>
        </tr>
      ))}
    </table>
  )
}
```

## القرار المطلوب:

هل تريد:

1. ✅ **المتابعة** في إصلاح الكود الحالي (استبدال 12 موضع لـ projectCostService)
2. 🔄 **التبسيط** - إنشاء مكون جديد بسيط يعرض البيانات مع inputs للأسعار الفعلية فقط
3. 🔍 **البحث** - البحث عن مكون آخر جاهز يعمل بشكل صحيح

**توصيتي: الخيار 2 (التبسيط)** - إنشاء مكون نظيف (~200 سطر) يعمل مع BOQRepository مباشرة دون Draft System
