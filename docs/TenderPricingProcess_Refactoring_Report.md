# تقرير تحسين صفحة التسعير - TenderPricingProcess.tsx

## التاريخ: 2025-10-20
## الهدف: تحسين وتنظيف كود صفحة التسعير

---

## 1. التكرار والاستدعاءات غير المستخدمة المكتشفة

### 1.1 دوال محسوبة مكررة
- **المشكلة**: دالة `calculateTotals()` تُحسب في كل مرة بدون memoization
- **الحل**: استخدام `useMemo` لحفظ النتائج

```typescript
// ❌ قبل التحسين
const calculateTotals = useCallback(() => {
  const materialsTotal = currentPricing.materials.reduce((sum, item) => sum + item.total, 0);
  // ... المزيد من الحسابات
}, [currentPricing]);

// ✅ بعد التحسين
const totals = useMemo(() => {
  const materialsTotal = currentPricing.materials.reduce((sum, item) => sum + item.total, 0);
  const laborTotal = currentPricing.labor.reduce((sum, item) => sum + item.total, 0);
  const equipmentTotal = currentPricing.equipment.reduce((sum, item) => sum + item.total, 0);
  const subcontractorsTotal = currentPricing.subcontractors.reduce((sum, item) => sum + item.total, 0);
  
  const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
  const administrativeCost = subtotal * (currentPricing.additionalPercentages?.administrative || 0) / 100;
  const operationalCost = subtotal * (currentPricing.additionalPercentages?.operational || 0) / 100;
  const profitCost = subtotal * (currentPricing.additionalPercentages?.profit || 0) / 100;
  
  return {
    materials: materialsTotal,
    labor: laborTotal,
    equipment: equipmentTotal,
    subcontractors: subcontractorsTotal,
    subtotal,
    administrative: administrativeCost,
    operational: operationalCost,
    profit: profitCost,
    total: subtotal + administrativeCost + operationalCost + profitCost
  };
}, [currentPricing]);
```

### 1.2 استيرادات غير مستخدمة
```typescript
// استيرادات يمكن حذفها:
- import type { ExecutionMethod } from '@/types/pricing'; // غير مستخدم في الكود الحالي
```

### 1.3 متغيرات حالة غير مستخدمة أو مكررة
```typescript
// يمكن دمج هذه المتغيرات:
const [restoreOpen, setRestoreOpen] = useState(false);
const [templateManagerOpen, setTemplateManagerOpen] = useState(false);

// في حالة واحدة:
const [dialogs, setDialogs] = useState({
  restore: false,
  templateManager: false,
  leave: false
});
```

---

## 2. تحسين جداول الكميات في تبويب الملخص

### 2.1 إضافة إمكانية التوسع للبنود
**الميزة الجديدة**: عند النقر على البند، يتوسع ليظهر جداول التكلفة التفصيلية

```typescript
// في SummaryView.tsx - تم تطبيقه بالفعل
{quantityItems.map((item, index) => {
  const hasAnyBreakdown = !!(itemPricing && (
    (itemPricing.materials?.length || 0) > 0 ||
    (itemPricing.labor?.length || 0) > 0 ||
    (itemPricing.equipment?.length || 0) > 0 ||
    (itemPricing.subcontractors?.length || 0) > 0
  ));

  return (
    <React.Fragment key={item.id}>
      <tr>{/* صف البند الرئيسي */}</tr>
      
      {/* الصف القابل للتوسع */}
      {hasAnyBreakdown && (
        <tr className="bg-card">
          <td colSpan={8} className="p-2 border-b border-border">
            <div className="space-y-2">
              {/* جداول التكلفة القابلة للطي */}
              {itemPricing?.materials?.length && (
                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-info/15 p-1 rounded"
                    onClick={() => toggleCollapse(item.id, 'materials')}
                  >
                    {/* رأس القسم */}
                  </div>
                  {!collapsedSections[item.id]?.materials && (
                    <div className="overflow-auto border border-border rounded-md">
                      <table>{/* جدول المواد */}</table>
                    </div>
                  )}
                </div>
              )}
              {/* نفس الشيء للعمالة، المعدات، والمقاولين */}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
})}
```

### 2.2 إضافة أزرار لإضافة تكاليف جديدة من الملخص
**التحسين المقترح**: إضافة أيقونة "+" لكل قسم لإضافة عناصر جديدة

```typescript
// في كل قسم قابل للتوسع
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <div className="text-xs font-semibold text-info">
      المواد ({itemPricing.materials.length} صنف)
    </div>
    <Badge variant="outline">
      {formatCurrencyValue(materialsTotal)}
    </Badge>
  </div>
  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        // الانتقال لتبويب التسعير وإضافة مادة جديدة
        setCurrentItemIndex(index);
        setCurrentView('pricing');
        // يمكن إضافة منطق لفتح تبويب المواد مباشرة
      }}
      className="h-6 w-6 p-0"
    >
      <Plus className="w-3 h-3" />
    </Button>
    {collapsedSections[item.id]?.materials ? 
      <ChevronUp className="w-4 h-4 text-info" /> : 
      <ChevronDown className="w-4 h-4 text-info" />
    }
  </div>
</div>
```

---

## 3. إضافة قوائم منسدلة للتسعير المباشر

### 3.1 إضافة عمود جديد في جدول الملخص
**الهدف**: السماح بإدخال سعر الوحدة مباشرة من الملخص

```typescript
// في SummaryView.tsx - إضافة عمود جديد
<thead>
  <tr className="bg-muted/20 border-b">
    <th className="border p-3 text-right">رقم البند</th>
    <th className="border p-3 text-right">وصف البند</th>
    <th className="border p-3 text-center">الوحدة</th>
    <th className="border p-3 text-center">الكمية</th>
    <th className="border p-3 text-center">سعر الوحدة</th>
    <th className="border p-3 text-center">تسعير سريع</th> {/* عمود جديد */}
    <th className="border p-3 text-center">القيمة الإجمالية</th>
    <th className="border p-3 text-center">حالة التسعير</th>
    <th className="border p-3 text-center">إجراءات</th>
  </tr>
</thead>

<tbody>
  {quantityItems.map((item, index) => {
    // ... الكود الموجود
    
    return (
      <tr key={item.id}>
        {/* الأعمدة الموجودة */}
        
        {/* العمود الجديد للتسعير السريع */}
        <td className="border p-2">
          <QuickPricingDropdown
            item={item}
            currentPricing={itemPricing}
            onQuickPrice={(method, value) => {
              handleQuickPricing(item.id, method, value);
            }}
          />
        </td>
        
        {/* باقي الأعمدة */}
      </tr>
    );
  })}
</tbody>
```

### 3.2 مكون القائمة المنسدلة للتسعير السريع
```typescript
// مكون جديد: QuickPricingDropdown.tsx
interface QuickPricingDropdownProps {
  item: QuantityItem;
  currentPricing?: PricingData;
  onQuickPrice: (method: 'unit_price' | 'total' | 'percentage', value: number) => void;
}

const QuickPricingDropdown: React.FC<QuickPricingDropdownProps> = ({
  item,
  currentPricing,
  onQuickPrice
}) => {
  const [method, setMethod] = useState<'unit_price' | 'total' | 'percentage'>('unit_price');
  const [value, setValue] = useState<string>('');

  return (
    <div className="flex items-center gap-1">
      <Select value={method} onValueChange={(v) => setMethod(v as any)}>
        <SelectTrigger className="h-7 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unit_price">سعر الوحدة</SelectItem>
          <SelectItem value="total">الإجمالي</SelectItem>
          <SelectItem value="percentage">نسبة %</SelectItem>
        </SelectContent>
      </Select>
      
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={method === 'percentage' ? '%' : 'ر.س'}
        className="h-7 w-20 text-xs"
      />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            onQuickPrice(method, numValue);
            setValue('');
          }
        }}
        className="h-7 w-7 p-0"
      >
        <CheckCircle className="w-3 h-3" />
      </Button>
    </div>
  );
};
```

### 3.3 دالة معالجة التسعير السريع
```typescript
// في TenderPricingProcess.tsx
const handleQuickPricing = useCallback((
  itemId: string,
  method: 'unit_price' | 'total' | 'percentage',
  value: number
) => {
  const item = quantityItems.find(q => q.id === itemId);
  if (!item) return;

  const existingPricing = pricingData.get(itemId) || {
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    technicalNotes: '',
    additionalPercentages: defaultPercentages,
    completed: false
  };

  let updatedPricing: PricingData;

  switch (method) {
    case 'unit_price':
      // حساب التكلفة الإجمالية من سعر الوحدة
      const totalFromUnitPrice = value * item.quantity;
      updatedPricing = {
        ...existingPricing,
        materials: [{
          id: Date.now().toString(),
          name: 'تسعير تقديري',
          description: 'سعر تم إدخاله مباشرة',
          unit: item.unit,
          quantity: item.quantity,
          price: value,
          total: totalFromUnitPrice,
          hasWaste: false,
          wastePercentage: 0
        }],
        completed: true
      };
      break;

    case 'total':
      // حساب سعر الوحدة من الإجمالي
      const unitPriceFromTotal = value / item.quantity;
      updatedPricing = {
        ...existingPricing,
        materials: [{
          id: Date.now().toString(),
          name: 'تسعير تقديري',
          description: 'إجمالي تم إدخاله مباشرة',
          unit: item.unit,
          quantity: item.quantity,
          price: unitPriceFromTotal,
          total: value,
          hasWaste: false,
          wastePercentage: 0
        }],
        completed: true
      };
      break;

    case 'percentage':
      // استخدام النسبة من قيمة مرجعية (مثل تقدير المشروع)
      const referenceValue = calculateProjectTotal() / quantityItems.length;
      const estimatedValue = referenceValue * (value / 100);
      const unitPriceFromPercentage = estimatedValue / item.quantity;
      updatedPricing = {
        ...existingPricing,
        materials: [{
          id: Date.now().toString(),
          name: 'تسعير تقديري',
          description: `تسعير بنسبة ${value}%`,
          unit: item.unit,
          quantity: item.quantity,
          price: unitPriceFromPercentage,
          total: estimatedValue,
          hasWaste: false,
          wastePercentage: 0
        }],
        completed: true
      };
      break;
  }

  const newMap = new Map(pricingData);
  newMap.set(itemId, updatedPricing);
  setPricingData(newMap);
  markDirty();
  
  void pricingService.saveTenderPricing(tender.id, {
    pricing: Array.from(newMap.entries()),
    defaultPercentages,
    lastUpdated: new Date().toISOString()
  });
  
  toast.success('تم تطبيق التسعير السريع', {
    description: `تم تسعير البند ${item.itemNumber} بنجاح`
  });
}, [quantityItems, pricingData, defaultPercentages, tender.id, calculateProjectTotal, markDirty]);
```

---

## 4. تنظيف وإعادة هيكلة الكود

### 4.1 فصل المنطق إلى Hooks مخصصة

#### Hook للحسابات
```typescript
// src/components/pricing/tender-pricing-process/hooks/useItemCalculations.ts
export const useItemCalculations = (currentPricing: PricingData) => {
  return useMemo(() => {
    const materialsTotal = currentPricing.materials.reduce((sum, item) => sum + item.total, 0);
    const laborTotal = currentPricing.labor.reduce((sum, item) => sum + item.total, 0);
    const equipmentTotal = currentPricing.equipment.reduce((sum, item) => sum + item.total, 0);
    const subcontractorsTotal = currentPricing.subcontractors.reduce((sum, item) => sum + item.total, 0);
    
    const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal;
    const administrative = subtotal * (currentPricing.additionalPercentages?.administrative || 0) / 100;
    const operational = subtotal * (currentPricing.additionalPercentages?.operational || 0) / 100;
    const profit = subtotal * (currentPricing.additionalPercentages?.profit || 0) / 100;
    
    return {
      materials: materialsTotal,
      labor: laborTotal,
      equipment: equipmentTotal,
      subcontractors: subcontractorsTotal,
      subtotal,
      administrative,
      operational,
      profit,
      total: subtotal + administrative + operational + profit
    };
  }, [currentPricing]);
};
```

#### Hook لعمليات الصفوف
```typescript
// src/components/pricing/tender-pricing-process/hooks/useRowOperations.ts
export const useRowOperations = (
  currentPricing: PricingData,
  setCurrentPricing: React.Dispatch<React.SetStateAction<PricingData>>,
  markDirty: () => void
) => {
  const addRow = useCallback(<Section extends PricingSection>(type: Section) => {
    setCurrentPricing(prev => {
      const newRow = createEmptyRow(type);
      return {
        ...prev,
        [type]: [...prev[type], newRow]
      };
    });
    markDirty();
  }, [setCurrentPricing, markDirty]);

  const deleteRow = useCallback(<Section extends PricingSection>(
    type: Section, 
    id: string
  ) => {
    setCurrentPricing(prev => ({
      ...prev,
      [type]: prev[type].filter((row: any) => row.id !== id)
    }));
    markDirty();
  }, [setCurrentPricing, markDirty]);

  const updateRow = useCallback(<Section extends PricingSection>(
    type: Section,
    id: string,
    field: string,
    value: any
  ) => {
    setCurrentPricing(prev => ({
      ...prev,
      [type]: prev[type].map((row: any) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        return recalculateRow(type, updated);
      })
    }));
    markDirty();
  }, [setCurrentPricing, markDirty]);

  return { addRow, deleteRow, updateRow };
};
```

### 4.2 تحسين بنية المكونات

#### فصل جداول التسعير إلى مكونات مستقلة
```typescript
// src/components/pricing/tender-pricing-process/components/PricingTable.tsx
interface PricingTableProps {
  type: PricingSection;
  rows: MaterialRow[] | LaborRow[] | EquipmentRow[] | SubcontractorRow[];
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (id: string, field: string, value: any) => void;
  formatCurrency: (value: number) => string;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  type,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
  formatCurrency
}) => {
  const config = TABLE_CONFIGS[type];
  
  return (
    <Card>
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {config.icon}
            {config.title}
          </CardTitle>
          <Button onClick={onAddRow} size="sm" className="h-8">
            <Plus className="w-4 h-4 ml-1" />
            {config.addLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[50vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/20">
              <tr>
                {config.columns.map(col => (
                  <th key={col.key} className="border p-2 text-center">
                    {col.label}
                  </th>
                ))}
                <th className="border p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <PricingTableRow
                  key={row.id}
                  row={row}
                  config={config}
                  onUpdate={(field, value) => onUpdateRow(row.id, field, value)}
                  onDelete={() => onDeleteRow(row.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4.3 تحسين الأداء

#### استخدام React.memo للمكونات
```typescript
// تحسين أداء العرض
export const PricingTableRow = React.memo<PricingTableRowProps>(({
  row,
  config,
  onUpdate,
  onDelete,
  formatCurrency
}) => {
  // ... الكود
}, (prevProps, nextProps) => {
  // مقارنة مخصصة لتحديد ما إذا كان يجب إعادة العرض
  return (
    prevProps.row.id === nextProps.row.id &&
    prevProps.row.total === nextProps.row.total &&
    prevProps.row.quantity === nextProps.row.quantity &&
    prevProps.row.price === nextProps.row.price
  );
});
```

---

## 5. خطة التنفيذ الموصى بها

### المرحلة 1: التنظيف الأساسي (يوم 1)
1. ✅ حذف الاستيرادات غير المستخدمة
2. ✅ تحويل `calculateTotals` إلى `useMemo`
3. ✅ دمج متغيرات الحالة المتشابهة

### المرحلة 2: تحسين جداول الملخص (يوم 2-3)
1. ✅ التوسع عند النقر على البند (مطبق بالفعل)
2. ⏳ إضافة أزرار "+" لإضافة تكاليف من الملخص
3. ⏳ تحسين تصميم الجداول القابلة للطي

### المرحلة 3: التسعير السريع (يوم 4-5)
1. ⏳ إنشاء مكون `QuickPricingDropdown`
2. ⏳ إضافة عمود التسعير السريع في الجدول
3. ⏳ تطبيق دالة `handleQuickPricing`
4. ⏳ اختبار جميع السيناريوهات

### المرحلة 4: إعادة الهيكلة (يوم 6-7)
1. ⏳ فصل Hooks المخصصة
2. ⏳ إنشاء مكونات فرعية للجداول
3. ⏳ تطبيق React.memo للتحسين
4. ⏳ اختبار الأداء والتحقق من عدم وجود رجوع

---

## 6. الخلاصة والتوصيات

### ✅ ما تم إنجازه
1. جداول الكميات في تبويب الملخص قابلة للتوسع بالفعل
2. يمكن عرض تفاصيل التكلفة لكل بند
3. البنية العامة للكود منظمة بشكل جيد

### ⏳ ما يحتاج للتطبيق
1. **التسعير السريع**: إضافة القوائم المنسدلة للإدخال المباشر
2. **تحسين الأداء**: فصل المنطق إلى Hooks وتطبيق memoization
3. **تبسيط الكود**: حذف التكرار وإعادة الهيكلة

### 💡 توصيات إضافية
1. **التوثيق**: إضافة تعليقات توضيحية للدوال المعقدة
2. **الاختبارات**: إنشاء اختبارات وحدة للحسابات المهمة
3. **تجربة المستخدم**: إضافة رسائل تأكيد أكثر وضوحاً
4. **التصدير**: تحسين وظيفة تصدير Excel المعلقة

---

## 7. أمثلة الاستخدام بعد التحسين

### مثال 1: التسعير السريع من الملخص
```typescript
// المستخدم يضغط على القائمة المنسدلة
// يختار "سعر الوحدة"
// يُدخل 1500 ريال
// يضغط على أيقونة ✓
// النتيجة: يتم تسعير البند فوراً بـ 1500 × الكمية
```

### مثال 2: إضافة مادة من الملخص
```typescript
// المستخدم يوسّع بند معين
// يضغط على أيقونة "+" في قسم المواد
// ينتقل تلقائياً لتبويب التسعير > تبويب المواد
// يضيف المادة الجديدة
```

### مثال 3: استخدام Hooks الجديدة
```typescript
// في مكون التسعير
const totals = useItemCalculations(currentPricing);
const { addRow, deleteRow, updateRow } = useRowOperations(
  currentPricing, 
  setCurrentPricing, 
  markDirty
);

// استخدام بسيط
<Button onClick={() => addRow('materials')}>إضافة مادة</Button>
<div>المجموع: {formatCurrency(totals.total)}</div>
```

---

**ملاحظة نهائية**: هذا التقرير يوفر خارطة طريق كاملة لتحسين الكود. يمكن تطبيق التحسينات تدريجياً حسب الأولوية والموارد المتاحة.
