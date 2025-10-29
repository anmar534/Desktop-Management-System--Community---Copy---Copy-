# 📋 خطة تحسين SimplifiedProjectCostView

## 🎯 الهدف العام

تحويل `SimplifiedProjectCostView.tsx` (1436 سطر) إلى مكون حديث يتوافق مع معمارية النظام الجديدة بعد إلغاء Draft System.

---

## 🔍 التحليل الأولي

### المشاكل الرئيسية المكتشفة:

#### 1. الاعتماد على Draft System الملغي ❌

```typescript
// الكود الحالي (خاطئ):
const { draft, loading, refresh, mergeFromTender, ensure } = useProjectBOQ(projectId)
const items = useMemo<ProjectCostItem[]>(() => draft?.items ?? [], [draft?.items])
```

- `projectCostService` يستخدم draft/envelope system
- يحاول الكتابة على storage بطريقة خاطئة (السبب في الخطأ الحالي)
- **الحل**: استخدام `BOQRepository` مباشرة

#### 2. حجم الملف الضخم (1436 سطر) 📏

- **المكون الرئيسي**: 300+ سطر
- **Handlers**: 400+ سطر
- **Render Functions**: 700+ سطر
- **Types & Helpers**: 100+ سطر

#### 3. التكرار في الكود 🔄

- دوال formatting متعددة متشابهة (formatCurrency, formatDecimal, formatInteger)
- منطق validation مكرر في أماكن متعددة
- حسابات متشابهة في renderBreakdownAnalysis

#### 4. State Management غير منظم 🎛️

```typescript
// 7 useState مختلفة:
const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Set<string>>(new Set())
const [actionMessage, setActionMessage] = useState<string>('')
const [forceUpdateKey, setForceUpdateKey] = useState(0)
const [isImporting, setIsImporting] = useState(false)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
// + draft من useProjectBOQ
```

#### 5. منطق معقد مدمج في UI 🧩

- حسابات التكاليف داخل الكومبوننت
- منطق التحقق من البيانات مخلوط مع العرض
- عمليات CRUD مباشرة في event handlers

---

## 🏗️ خطة التنفيذ المرحلية

### المرحلة 1: إنشاء البنية التحتية الجديدة ✅

#### 1.1 إنشاء Custom Hooks المتخصصة

**Hook 1: `useProjectBOQData.ts`** - استبدال useProjectBOQ الحالي

```typescript
// src/application/hooks/useProjectBOQData.ts
export function useProjectBOQData(projectId: string, tenderId?: string) {
  const boqRepository = useRepository(getBOQRepository)
  const [items, setItems] = useState<BOQItem[]>([])
  const [loading, setLoading] = useState(true)

  // تحميل من Repository مباشرة
  // إزالة الاعتماد على draft system
  // استخدام actual.totalPrice كما في budgetComparator
}
```

**Hook 2: `useBreakdownCalculations.ts`** - منطق الحسابات

```typescript
// src/application/hooks/cost/useBreakdownCalculations.ts
export function useBreakdownCalculations(item: BOQItem) {
  // حساب materials, labor, equipment, subcontractors
  // حساب admin, operational, profit
  // حساب VAT (15%)
  // التحقق من صحة الحسابات
}
```

**Hook 3: `useCostItemActions.ts`** - العمليات على البنود

```typescript
// src/application/hooks/cost/useCostItemActions.ts
export function useCostItemActions(projectId: string) {
  // handleRecalculate
  // handleUpdateBreakdown
  // handleDelete
  // handleImportFromTender
  // جميع العمليات عبر Repository
}
```

**Hook 4: `useExpandableState.ts`** - إدارة التوسع/الطي (قابل لإعادة الاستخدام)

```typescript
// src/application/hooks/ui/useExpandableState.ts
export function useExpandableState() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => {
    /* ... */
  }
  const expandAll = () => {
    /* ... */
  }
  const collapseAll = () => {
    /* ... */
  }
  return { expanded, toggle, expandAll, collapseAll }
}
```

#### 1.2 إنشاء المكونات الفرعية

**Component 1: `CostSummaryCards.tsx`** (~100 سطر)

```typescript
// src/presentation/components/cost/components/CostSummaryCards.tsx
interface Props {
  estimatedTotal: number
  actualTotal: number
  varianceTotal: number
  variancePct: number
}
```

**Component 2: `CostItemRow.tsx`** (~150 سطر)

```typescript
// src/presentation/components/cost/components/CostItemRow.tsx
interface Props {
  item: BOQItem
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onRecalculate: () => void
  onDelete: () => void
}
```

**Component 3: `BreakdownSection.tsx`** (~200 سطر)

```typescript
// src/presentation/components/cost/components/breakdown/BreakdownSection.tsx
interface Props {
  section: 'materials' | 'labor' | 'equipment' | 'subcontractors'
  estimatedRows: BreakdownRow[]
  actualRows: BreakdownRow[]
  onAddRow: () => void
  onUpdateRow: (rowId: string, field: string, value: string) => void
  onDeleteRow: (rowId: string) => void
}
```

**Component 4: `PercentagesForm.tsx`** (~80 سطر)

```typescript
// src/presentation/components/cost/components/PercentagesForm.tsx
interface Props {
  administrative: number
  operational: number
  profit: number
  onChange: (type: string, value: number) => void
}
```

**Component 5: `CostActionButtons.tsx`** (~60 سطر)

```typescript
// src/presentation/components/cost/components/CostActionButtons.tsx
interface Props {
  hasPendingSync: boolean
  isValid: boolean
  onRecalculate: () => void
  onPurchaseOrder: () => void
  onDelete: () => void
}
```

**Component 6: `BreakdownAnalysis.tsx`** (~300 سطر)

```typescript
// src/presentation/components/cost/components/breakdown/BreakdownAnalysis.tsx
// تجميع BreakdownSection + PercentagesForm + الحسابات
```

#### 1.3 إنشاء Utilities المشتركة

**`costCalculations.ts`** - دوال الحسابات النقية

```typescript
// src/application/utils/cost/costCalculations.ts
export const calculateBaseAmount = (breakdown: CostBreakdownSet) => {
  /* ... */
}
export const calculateAdditionalCosts = (base: number, percentages: Percentages) => {
  /* ... */
}
export const calculateVAT = (subtotal: number, rate = 0.15) => {
  /* ... */
}
export const calculateUnitPrice = (total: number, quantity: number) => {
  /* ... */
}
```

**`costValidation.ts`** - التحقق من صحة البيانات

```typescript
// src/application/utils/cost/costValidation.ts
export const validateCalculationConsistency = (item: BOQItem) => {
  /* ... */
}
export const validateBreakdownData = (breakdown: CostBreakdownSet) => {
  /* ... */
}
```

---

### المرحلة 2: استبدال projectCostService ⚙️

#### 2.1 تحديث useProjectBOQ

```typescript
// src/application/hooks/useProjectBOQ.ts
// تعديل ليستخدم BOQRepository مباشرة بدلاً من projectCostService
export function useProjectBOQ(projectId: string) {
  const boqRepo = useRepository(getBOQRepository)

  const loadBOQ = async () => {
    // محاولة التحميل بـ projectId
    let boq = await boqRepo.getByProjectId(projectId)

    // إذا لم يوجد، جلب tenderId من المشروع
    if (!boq) {
      const project = await projectRepo.getById(projectId)
      if (project?.tenderId) {
        boq = await boqRepo.getByTenderId(project.tenderId)
      }
    }

    return boq
  }

  const saveBOQ = async (items: BOQItem[]) => {
    await boqRepo.save({
      id: `boq_project_${projectId}`,
      projectId,
      items,
      // ... باقي البيانات
    })
  }
}
```

#### 2.2 حذف الاعتمادات على Draft

- حذف `projectCostService.saveDraft`
- حذف `projectCostService.getEnvelope`
- حذف `projectCostService.initEnvelope`
- استبدالها بـ `boqRepository.save/get`

---

### المرحلة 3: تفكيك الكومبوننت الرئيسي 🔨

#### 3.1 الهيكل الجديد لـ SimplifiedProjectCostView

```typescript
// src/presentation/components/cost/SimplifiedProjectCostView.tsx (~200 سطر)
export const SimplifiedProjectCostView: React.FC<Props> = ({ projectId, tenderId }) => {
  // Hooks
  const { items, loading, totals } = useProjectBOQData(projectId, tenderId)
  const { expanded, toggle } = useExpandableState()
  const actions = useCostItemActions(projectId)
  const { showMessage, showError } = useNotifications()

  // Render
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <CostHeader
        onImport={() => actions.importFromTender(tenderId)}
        loading={actions.importing}
      />

      {/* Summary Cards */}
      <CostSummaryCards {...totals} />

      {/* Items Table */}
      <CostItemsTable
        items={items}
        expanded={expanded}
        onToggle={toggle}
        onRecalculate={actions.recalculate}
        onDelete={actions.delete}
      />
    </div>
  )
}
```

#### 3.2 تقسيم CostItemsTable

```typescript
// src/presentation/components/cost/components/CostItemsTable.tsx (~150 سطر)
export const CostItemsTable: React.FC<Props> = ({ items, ... }) => {
  return (
    <table>
      <thead>{/* ... */}</thead>
      <tbody>
        {items.map((item, index) => (
          <CostItemRow
            key={item.id}
            item={item}
            index={index}
            {.../* props */}
          />
        ))}
      </tbody>
    </table>
  )
}
```

---

### المرحلة 4: تحسين إدارة الحالة 🎛️

#### 4.1 دمج State Management

```typescript
// قبل: 7 useState منفصلة
// بعد: hook واحد منظم

function useCostViewState() {
  const [ui, setUI] = useState({
    expandedItems: new Set<string>(),
    expandedSections: new Set<string>(),
    importing: false,
  })

  const [notifications, setNotifications] = useState({
    message: '',
    error: null as string | null,
  })

  return {
    ui,
    setUI,
    notifications,
    setNotifications,
  }
}
```

#### 4.2 إزالة forceUpdateKey

```typescript
// قبل:
const [forceUpdateKey, setForceUpdateKey] = useState(0)
setForceUpdateKey((prev) => prev + 1) // anti-pattern

// بعد: استخدام dependencies صحيحة في useMemo/useEffect
const items = useMemo(() => boq?.items ?? [], [boq?.items])
```

---

### المرحلة 5: حذف التكرار والتنظيف 🧹

#### 5.1 توحيد دوال التنسيق

```typescript
// قبل: 3 دوال منفصلة
const formatCurrency = (value) => {
  /* ... */
}
const formatDecimal = (value) => {
  /* ... */
}
const formatInteger = (value) => {
  /* ... */
}

// بعد: استخدام useCurrencyFormatter مباشرة
const { formatCurrency } = useCurrencyFormatter()
const formatQuantity = (value: number) => new Intl.NumberFormat('ar-SA').format(value)
```

#### 5.2 حذف console.log الزائد

```typescript
// حذف ~30 سطر من console.log
// الاحتفاظ فقط بـ console.error للأخطاء الحرجة
```

#### 5.3 تنظيف Types

```typescript
// قبل: أنواع مكررة في الملف
interface LegacyProjectCostItem extends ProjectCostItem {
  actualQuantity?: number
  actualUnitPrice?: number
  unitPrice?: number
  totalPrice?: number
}

// بعد: استخدام الأنواع من projectCostTypes أو إنشاء ملف types مشترك
```

---

### المرحلة 6: التكامل والاختبار ✅

#### 6.1 التأكد من التوافق مع budgetComparator

```typescript
// التأكد من استخدام نفس البنية:
const actualTotal = item.actual?.totalPrice ?? item.actual?.quantity * item.actual?.unitPrice
```

#### 6.2 اختبارات الوظائف الأساسية

- ✅ عرض البيانات من BOQRepository
- ✅ تعديل التكاليف وحفظها
- ✅ إعادة الحساب بناءً على breakdown
- ✅ استيراد من المنافسة
- ✅ حذف البنود
- ✅ مقارنة الميزانية

---

## 📊 التحسينات المتوقعة

### قبل التحسين:

- **عدد الأسطر**: 1436 سطر
- **useState**: 7 متغيرات حالة
- **المكونات**: مكون واحد ضخم
- **Performance**: إعادة render غير ضرورية
- **Maintainability**: صعب الصيانة

### بعد التحسين:

- **SimplifiedProjectCostView**: ~200 سطر
- **Hooks**: 4 hooks متخصصة (~400 سطر)
- **Components**: 6 مكونات فرعية (~800 سطر)
- **Utils**: 2 ملفات مساعدة (~100 سطر)
- **الإجمالي**: ~1500 سطر (موزعة على 13 ملف)

### الفوائد:

- ✅ سهولة الصيانة والتطوير
- ✅ إعادة استخدام الكود
- ✅ أداء أفضل (memoization صحيح)
- ✅ اختبار أسهل (كل وحدة منفصلة)
- ✅ توافق مع معمارية النظام

---

## 🚀 خطة التنفيذ التدريجي

### الأسبوع 1: البنية التحتية

- [ ] Day 1-2: إنشاء Hooks الجديدة
- [ ] Day 3-4: إنشاء المكونات الفرعية الأساسية
- [ ] Day 5: اختبار الـ hooks والمكونات منفصلة

### الأسبوع 2: التكامل

- [ ] Day 1-2: استبدال projectCostService
- [ ] Day 3-4: تفكيك SimplifiedProjectCostView
- [ ] Day 5: دمج المكونات الجديدة

### الأسبوع 3: التنظيف والاختبار

- [ ] Day 1-2: حذف التكرار والكود القديم
- [ ] Day 3-4: اختبار شامل لجميع الوظائف
- [ ] Day 5: مراجعة الكود وتحسين الأداء

---

## 📝 ملاحظات مهمة

### الأولويات:

1. **إصلاح الخطأ الحالي** (Cannot create property on string)

   - السبب: projectCostStorage يحاول الكتابة على string
   - الحل: استبدال بـ BOQRepository فوراً

2. **استبدال Draft System**

   - إزالة الاعتماد على useProjectBOQ القديم
   - استخدام BOQRepository مباشرة

3. **التفكيك التدريجي**
   - البدء بالمكونات الأصغر أولاً
   - اختبار كل جزء قبل الانتقال للتالي

### التحديات المتوقعة:

- ⚠️ التأكد من عدم فقدان البيانات أثناء الانتقال
- ⚠️ الحفاظ على التوافق مع budgetComparator
- ⚠️ ضمان عمل جميع الوظائف الحالية

### الحلول:

- ✅ الانتقال التدريجي مع الاحتفاظ بالنسخة القديمة
- ✅ اختبارات شاملة بعد كل مرحلة
- ✅ استخدام feature flags إذا لزم الأمر

---

## 🎯 النتيجة النهائية المتوقعة

```
src/presentation/components/cost/
├── SimplifiedProjectCostView.tsx         (~200 lines)
├── components/
│   ├── CostSummaryCards.tsx              (~100 lines)
│   ├── CostItemsTable.tsx                (~150 lines)
│   ├── CostItemRow.tsx                   (~150 lines)
│   ├── CostActionButtons.tsx             (~60 lines)
│   ├── CostHeader.tsx                    (~80 lines)
│   └── breakdown/
│       ├── BreakdownAnalysis.tsx         (~300 lines)
│       ├── BreakdownSection.tsx          (~200 lines)
│       └── PercentagesForm.tsx           (~80 lines)

src/application/hooks/cost/
├── useProjectBOQData.ts                  (~150 lines)
├── useBreakdownCalculations.ts           (~100 lines)
├── useCostItemActions.ts                 (~150 lines)

src/application/hooks/ui/
└── useExpandableState.ts                 (~50 lines)

src/application/utils/cost/
├── costCalculations.ts                   (~80 lines)
└── costValidation.ts                     (~50 lines)
```

**مكون نظيف، قابل للصيانة، متوافق مع معمارية النظام الحديثة** ✨
