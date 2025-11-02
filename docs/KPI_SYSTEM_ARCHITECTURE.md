# معمارية نظام مؤشرات الأداء (KPI System)

## نظرة عامة

تم تصميم نظام مؤشرات الأداء ليكون مصدراً واحداً للحقيقة لجميع المؤشرات في التطبيق، مع فصل واضح للمسؤوليات وسهولة الصيانة والاختبار.

## البنية المعمارية

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (Presentation)                                    │
│  ├─ DashboardKPICards: عرض البطاقات في لوحة التحكم         │
│  ├─ AnnualKPICards: عرض المؤشرات السنوية                   │
│  └─ UnifiedKPICard: مكون موحد لعرض البطاقة                │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Application Layer (Hooks)                                  │
│  ├─ useKPIs: دمج الأهداف مع القيم الفعلية                 │
│  │   • يقرأ الأهداف من useDevelopment                       │
│  │   • يقرأ البيانات الفعلية من useFinancialState          │
│  │   • يحسب التقدم والحالة                                  │
│  │   • يرجع مصفوفة موحدة من KPICardData                     │
│  │                                                            │
│  ├─ useDevelopment: إدارة الأهداف                           │
│  │   • يقرأ/يكتب من LocalStorage                            │
│  │   • يوفر CRUD للأهداف                                    │
│  │                                                            │
│  └─ useFinancialState: البيانات المركزية                    │
│      • يجمع بيانات المشاريع والمنافسات                      │
│      • يوفر isLoading state                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Domain Layer (Business Logic)                              │
│  ├─ kpiSelectors.ts: حسابات نقية للقيم الفعلية            │
│  │   • selectTotalRevenue(projects)                         │
│  │   • selectTotalProfit(projects)                          │
│  │   • selectTenderWinRate(tenders)                         │
│  │   • selectAverageProjectProgress(projects)               │
│  │   • selectAllKPIMetrics(projects, tenders)               │
│  │                                                            │
│  └─ kpiRegistry.ts: تعريفات المؤشرات                        │
│      • KPIMetadata: بيانات وصفية لكل مؤشر                  │
│      • determineKPIStatus: تحديد الحالة                     │
│      • calculateKPIProgress: حساب النسبة                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Data Layer (Repositories)                                  │
│  ├─ LocalProjectRepository: مستودع المشاريع                │
│  ├─ LocalTenderRepository: مستودع المنافسات                │
│  └─ LocalStorage: تخزين الأهداف                            │
└─────────────────────────────────────────────────────────────┘
```

## مسار تدفق البيانات

### 1. الأهداف (Targets)

```
إدارة التطوير (Development Page)
    ↓
useDevelopment Hook
    ↓
LocalStorage (development_goals)
    ↓
useKPIs Hook
    ↓
UnifiedKPICard
```

**مثال:** المستخدم يسجل هدف "25 مشروع سنوياً" في صفحة إدارة التطوير → يُحفظ في LocalStorage → يُقرأ بواسطة useKPIs → يُعرض كهدف في البطاقة.

### 2. القيم الفعلية (Actuals)

```
صفحة المشاريع/المنافسات
    ↓
LocalRepository (add/update/delete)
    ↓
useFinancialState Hook
    ↓
kpiSelectors (حسابات)
    ↓
useKPIs Hook
    ↓
UnifiedKPICard
```

**مثال:** المستخدم يضيف مشروع جديد في صفحة المشاريع → يُحفظ في LocalProjectRepository → يُحمّل بواسطة useFinancialState → يُحسب العدد الإجمالي بواسطة selectTotalProjectsCount → يُعرض كقيمة فعلية في البطاقة.

## المكونات الرئيسية

### 1. UnifiedKPICard

مكون موحد لعرض بطاقة مؤشر أداء:

```tsx
<UnifiedKPICard
  title="عدد المشاريع"
  icon={<Building2 className="h-4 w-4" />}
  current={12}
  target={25}
  unit="number"
  colorClass="text-primary"
  bgClass="bg-primary/10"
  onClick={() => navigate('projects')}
/>
```

**المميزات:**

- تصميم موحد وبسيط
- شريط تقدم ديناميكي
- شارة حالة (ممتاز، جيد، متوسط، يحتاج تحسين)
- قابل للنقر للانتقال للصفحة المسؤولة

### 2. useKPIs Hook

Hook موحد لجلب جميع مؤشرات الأداء:

```tsx
const { kpis, isLoading, isEmpty } = useKPIs({
  categories: ['revenue', 'profit', 'tender-win-rate', 'projects-count'],
})

// kpis: KPICardData[] - مصفوفة موحدة من المؤشرات
// isLoading: boolean - حالة التحميل
// isEmpty: boolean - هل المصفوفة فارغة
```

**الفوائد:**

- مصدر واحد للحقيقة
- دمج تلقائي للأهداف والقيم الفعلية
- حساب تلقائي للتقدم والحالة
- تصفية حسب الفئات (اختياري)

### 3. kpiSelectors

دوال نقية لحساب القيم الفعلية:

```ts
// حساب إجمالي الإيرادات
const revenue = selectTotalRevenue(projects)

// حساب معدل فوز المنافسات
const winRate = selectTenderWinRate(tenders)

// حساب جميع المؤشرات دفعة واحدة
const metrics = selectAllKPIMetrics(projects, tenders)
```

**المميزات:**

- دوال نقية بدون side effects
- قابلة للاختبار بسهولة
- قابلة لإعادة الاستخدام في أي مكان
- مستقلة عن React

### 4. kpiRegistry

سجل مركزي لتعريفات المؤشرات:

```ts
const metadata = getKPIMetadata('tender-win-rate')
// {
//   id: 'tender-win-rate',
//   title: 'نسبة فوز المنافسات',
//   category: 'tenders',
//   unit: 'percentage',
//   icon: Trophy,
//   colorClass: 'text-warning',
//   thresholds: { exceeded: 100, onTrack: 80, warning: 50 }
// }
```

## الاستخدام

### إضافة مؤشر جديد

1. **إضافة التعريف في kpiRegistry.ts:**

```ts
export const KPI_REGISTRY: Record<string, KPIMetadata> = {
  // ... existing KPIs
  'customer-satisfaction': {
    id: 'customer-satisfaction',
    title: 'رضا العملاء',
    category: 'customers',
    unit: 'percentage',
    icon: Users,
    colorClass: 'text-purple',
    bgClass: 'bg-purple/10',
    link: 'clients',
    thresholds: { exceeded: 100, onTrack: 80, warning: 50 },
  },
}
```

2. **إضافة Selector في kpiSelectors.ts:**

```ts
export function selectCustomerSatisfaction(clients: Client[]): number {
  const satisfiedClients = clients.filter((c) => c.rating >= 4).length
  return clients.length > 0 ? Math.round((satisfiedClients / clients.length) * 100) : 0
}
```

3. **إضافة الحساب في useKPIs.ts:**

```ts
// في useMemo داخل useKPIs
const customerSatisfaction = selectCustomerSatisfaction(clients)
const satisfactionTarget = getYearlyTarget(goals, 'customers', 85)

cards.push({
  id: 'customer-satisfaction',
  title: 'رضا العملاء',
  current: customerSatisfaction,
  target: satisfactionTarget,
  progress: calculateProgress(customerSatisfaction, satisfactionTarget),
  status: determineStatus(calculateProgress(customerSatisfaction, satisfactionTarget)),
  unit: 'percentage',
  icon: null as any,
  colorClass: 'text-purple',
  bgClass: 'bg-purple/10',
  link: 'clients',
})
```

4. **استخدام المؤشر في UI:**

```tsx
const { kpis } = useKPIs({
  categories: ['customer-satisfaction'],
})

return <UnifiedKPICard {...kpis[0]} icon={<Users className={`h-4 w-4 ${kpis[0].colorClass}`} />} />
```

## الاختبارات

### اختبار Selectors

```ts
// tests/domain/selectors/kpiSelectors.test.ts
it('should calculate total revenue correctly', () => {
  const projects = [
    { id: '1', status: 'active', contractValue: 5000000 },
    { id: '2', status: 'active', contractValue: 3000000 },
  ]

  const revenue = selectTotalRevenue(projects)
  expect(revenue).toBe(8000000)
})
```

### اختبار Hook

```tsx
// tests/application/hooks/useKPIs.test.tsx
it('should merge targets with actuals', () => {
  const { result } = renderHook(() => useKPIs())

  expect(result.current.kpis).toHaveLength(5)
  expect(result.current.kpis[0].current).toBeDefined()
  expect(result.current.kpis[0].target).toBeDefined()
  expect(result.current.kpis[0].progress).toBeDefined()
})
```

## التوافق المستقبلي

### الانتقال إلى Store (Redux/Zustand)

البنية الحالية مُصممة لتسهيل الانتقال إلى Store مركزي:

```ts
// قبل (الآن)
const { kpis } = useKPIs()

// بعد (مع Store)
const kpis = useSelector(selectKPIs)
// أو
const kpis = useStore((state) => state.kpis)
```

**خطوات الانتقال:**

1. إنشاء Slice للمؤشرات في Store
2. نقل الحسابات من useKPIs إلى Slice
3. استخدام Selectors الموجودة كما هي
4. تحديث المكونات لاستخدام Store بدلاً من Hook

### إضافة Real-time Updates

```ts
// في useKPIs أو Store
useEffect(() => {
  const unsubscribe = subscribeToProjectUpdates((project) => {
    // إعادة حساب المؤشرات تلقائياً
    recalculateKPIs()
  })

  return unsubscribe
}, [])
```

## أفضل الممارسات

1. **فصل المخاوف:**

   - UI لا يحتوي على منطق حسابات
   - Selectors نقية ومستقلة
   - Hooks تجمع البيانات فقط

2. **مصدر واحد للحقيقة:**

   - جميع المؤشرات تمر عبر useKPIs
   - لا حسابات مكررة في المكونات

3. **قابلية الاختبار:**

   - Selectors قابلة للاختبار بدون React
   - Hooks قابلة للاختبار بـ renderHook
   - مكونات UI قابلة للاختبار بـ render

4. **الأداء:**
   - استخدام useMemo لتجنب الحسابات المكررة
   - Selectors تُحسب مرة واحدة فقط
   - تصفية حسب الفئات لتقليل الحسابات

## الملفات الرئيسية

```
src/
├── application/
│   └── hooks/
│       ├── useKPIs.ts              # Hook موحد للمؤشرات
│       └── useDevelopment.ts        # إدارة الأهداف
├── domain/
│   └── selectors/
│       └── kpiSelectors.ts          # حسابات القيم الفعلية
├── shared/
│   └── config/
│       └── kpiRegistry.ts           # تعريفات المؤشرات
├── presentation/
│   ├── components/
│   │   └── kpi/
│   │       └── UnifiedKPICard.tsx   # مكون البطاقة الموحد
│   └── pages/
│       └── Dashboard/
│           └── components/
│               ├── DashboardKPICards.tsx
│               └── AnnualKPICards.tsx
└── tests/
    ├── application/hooks/useKPIs.test.tsx
    ├── domain/selectors/kpiSelectors.test.ts
    └── shared/config/kpiRegistry.test.ts
```

## الخلاصة

نظام مؤشرات الأداء مُصمم ليكون:

- ✅ موحد وبسيط
- ✅ قابل للصيانة والتوسع
- ✅ قابل للاختبار
- ✅ متوافق مع أفضل الممارسات
- ✅ جاهز للمستقبل (Store, Real-time, etc.)
