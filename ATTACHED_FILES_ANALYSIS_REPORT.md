# تقرير فحص الملفات المرفقة

**التاريخ:** 4 نوفمبر 2025  
**الهدف:** تحليل الملفات المرفقة - الغرض، المخرجات، الاستخدام، الحسابات، والتعارضات

---

## 📊 ملخص تنفيذي

تم فحص **10 ملفات** من مكونات نظام إدارة المنافسات:

| الحالة            | العدد  | التفاصيل                 |
| ----------------- | ------ | ------------------------ |
| **مستخدم حالياً** | 7      | ملفات نشطة في النظام     |
| **غير مستخدم**    | 3      | مكونات قديمة غير موصولة  |
| **يحتوي حسابات**  | 3      | ملفات بها منطق حسابات    |
| **تعارضات**       | ⚠️ نعم | تعارضات مع النظام الموحد |

---

## 1️⃣ TenderMetricsDisplay.tsx

### 📍 الموقع

```
src/presentation/components/tenders/TenderMetricsDisplay.tsx
```

### 🎯 الغرض

عرض ملخص مقاييس المنافسات باستخدام `FinancialSummaryCard` من الأسبوع الأول.

### 📤 المخرجات

- **المكون:** `TenderMetricsDisplay`
- **النوع:** React Component (Presentation)
- **المخرج:** عرض 4 مقاييس مالية:
  1. معدل الفوز (percentage)
  2. القيمة الإجمالية (currency)
  3. المنافسات النشطة (number)
  4. قيمة الكراسات (currency)

### 📥 المدخلات

```typescript
interface TenderMetricsDisplayProps {
  summary: TenderSummary // من tenderSummaryCalculator
}
```

### 🔍 الاستخدام الحالي

**❌ غير مستخدم في النظام**

- تم البحث في الكود: لا توجد استيرادات لهذا المكون
- لم يتم العثور على `import.*TenderMetricsDisplay`
- **السبب:** تم استبداله بمكونات أخرى

### 🧮 الحسابات الداخلية

**✅ لا توجد حسابات** - يستقبل البيانات جاهزة من `TenderSummary`

**البيانات المستخدمة:**

```typescript
;-summary.winRate - // نسبة الفوز
  summary.wonValue - // القيمة الإجمالية
  summary.underAction - // قيد الإجراء
  summary.readyToSubmit - // جاهز للإرسال
  summary.urgent - // العاجلة
  summary.totalDocumentValue -
  summary.documentBookletsCount -
  summary.submittedValue -
  summary.averageWinChance
```

### ⚠️ التعارضات

**تعارض مع النظام الموحد:**

- يستقبل `TenderSummary` من `computeTenderSummary` (دالة قديمة)
- النظام الموحد يستخدم `useTenders().stats`
- بعض الحقول غير موجودة في `useTenders`:
  - `underAction` → يجب `underActionTenders`
  - `readyToSubmit` → غير موجود في stats
  - `totalDocumentValue` → غير موجود في stats
  - `documentBookletsCount` → غير موجود في stats

### 📋 التوصيات

1. ❌ **حذف الملف** - غير مستخدم ويعتمد على دالة قديمة
2. أو ✅ **تحديث** ليستخدم `useTenders().stats` بدلاً من `TenderSummary`

---

## 2️⃣ UnifiedKPICard.tsx

### 📍 الموقع

```
src/presentation/components/kpi/UnifiedKPICard.tsx
```

### 🎯 الغرض

بطاقة موحدة لعرض مؤشرات الأداء الرئيسية (KPI) مع شريط تقدم ونسبة إنجاز.

### 📤 المخرجات

- **المكون:** `UnifiedKPICard`
- **النوع:** React Component (Reusable UI)
- **المخرج:** بطاقة KPI تعرض:
  - العنوان والأيقونة
  - القيمة الحالية
  - القيمة المستهدفة
  - شريط تقدم
  - نسبة الإنجاز
  - حالة الأداء (ممتاز، على المسار، متوسط، يحتاج تحسين)

### 📥 المدخلات

```typescript
interface UnifiedKPICardProps {
  title: string
  icon: React.ReactNode
  current: number
  target: number
  unit: 'number' | 'percentage' | 'currency' | string
  colorClass?: string
  bgClass?: string
  onClick?: () => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

1. `DashboardKPICards.tsx` - عرض مؤشرات لوحة التحكم
2. `AnnualKPICards.tsx` - عرض المؤشرات السنوية

**عدد الاستخدامات:** 2 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات بسيطة:**

#### 1. حساب نسبة التقدم

```typescript
const progress =
  safeTarget > 0 ? Math.min(Math.round((current / safeTarget) * 100), 100) : current > 0 ? 100 : 0
```

#### 2. تحديد الحالة

```typescript
function getStatus(progress: number): { label: string; className: string } {
  if (progress >= 100) return { label: 'ممتاز', ... }
  if (progress >= 80) return { label: 'على المسار', ... }
  if (progress >= 50) return { label: 'متوسط', ... }
  return { label: 'يحتاج تحسين', ... }
}
```

#### 3. تنسيق القيم

```typescript
function formatValue(value: number, unit: string): string {
  if (unit === 'percentage') return `${Math.round(value)}%`
  if (unit === 'number') return `${Math.round(value)}`
  return `${value}`
}
```

### ⚠️ التعارضات

**❌ لا توجد تعارضات**

- مكون عرض بحت (Pure Presentation)
- يستقبل البيانات جاهزة
- الحسابات الداخلية للعرض فقط (تنسيق)

### 📋 التوصيات

✅ **إبقاء الملف** - مكون مستخدم وجيد التصميم

---

## 3️⃣ EnhancedTenderCard.tsx

### 📍 الموقع

```
src/presentation/components/tenders/EnhancedTenderCard.tsx
```

### 🎯 الغرض

بطاقة محسّنة لعرض معلومات المنافسة الواحدة مع:

- مؤشرات احتمالية الفوز
- شارات الحالة والأولوية
- تصميم محسّن مع رسوم متحركة
- أزرار الإجراءات
- تنسيق العملة
- تحليلات تنبؤية (اختيارية)

### 📤 المخرجات

- **المكون:** `EnhancedTenderCard`
- **النوع:** React Component (Complex Card)
- **المخرج:** بطاقة منافسة كاملة مع جميع الإجراءات

### 📥 المدخلات

```typescript
interface EnhancedTenderCardProps {
  tender: Tender
  index: number
  onOpenDetails: (tender: Tender) => void
  onStartPricing: (tender: Tender) => void
  onSubmitTender: (tender: Tender) => void
  onEdit: (tender: Tender) => void
  onDelete: (tender: Tender) => void
  onOpenResults?: (tender: Tender) => void
  onRevertStatus?: (tender: Tender, newStatus: Tender['status']) => void
  formatCurrencyValue: (amount, options?) => string
  enablePredictiveAnalytics?: boolean
  onViewAnalytics?: (tender: Tender) => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `VirtualizedTenderList.tsx` - عرض البطاقات في القائمة

**عدد الاستخدامات:** 1 ملف (مكون رئيسي)

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات:**

#### 1. حساب سعر الوثيقة

```typescript
const parseNumericValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

const getTenderDocumentPrice = (tender: Tender): number => {
  const price = parseNumericValue(tender.documentPrice)
  return price > 0 ? price : parseNumericValue(tender.bookletPrice)
}
```

#### 2. حساب قيمة العقد

```typescript
const contractValue =
  typeof tender.totalValue === 'number' && Number.isFinite(tender.totalValue)
    ? tender.totalValue
    : typeof tender.value === 'number' && Number.isFinite(tender.value)
      ? tender.value
      : 0
```

#### 3. حساب التقدم

```typescript
const progress = calculateTenderProgress(tender)
```

#### 4. التحليلات التنبؤية (Predictive Analytics)

```typescript
const [predictiveData, setPredictiveData] = useState({
  winProbability: null,
  confidence: null,
  recommendedBid: null,
  riskLevel: null,
  competitorCount: 0,
  marketTrend: null,
  loading: false,
})

useEffect(
  () => {
    // تحميل بيانات التحليلات التنبؤية
    // محاكاة بيانات ذكاء اصطناعي
  },
  [
    /* dependencies */
  ],
)
```

### ⚠️ التعارضات

**✅ لا توجد تعارضات كبيرة**

- يستخدم `calculateTenderProgress` (دالة خارجية)
- الحسابات الأخرى للعرض فقط (parsing، formatting)
- لا يتعارض مع النظام الموحد

### 📋 التوصيات

✅ **إبقاء الملف** - مكون رئيسي مستخدم بكثافة

---

## 4️⃣ TenderPerformanceCards.tsx

### 📍 الموقع

```
src/presentation/components/tenders/TenderPerformanceCards.tsx
```

### 🎯 الغرض

عرض 4 بطاقات أداء للمنافسات:

1. أداء الميزانية (Budget Performance)
2. أداء الجدولة (Schedule Performance)
3. رضا العملاء (Client Satisfaction)
4. درجة الجودة (Quality Score)

### 📤 المخرجات

- **المكون:** `TenderPerformanceCards`
- **النوع:** React Component (Dashboard Cards)
- **المخرج:** شبكة 4 بطاقات DetailCard

### 📥 المدخلات

```typescript
interface TenderPerformanceCardsProps {
  tenderSummary: TenderSummary // من tenderSummaryCalculator
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `TendersHeaderSection.tsx` - عرض بطاقات الأداء في الشريط العلوي

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات:**

#### 1. أداء الميزانية (معدل الفوز)

```typescript
value: `${tenderSummary.winRate.toFixed(1)}%`
```

#### 2. أداء الجدولة (نسبة الفوز من المقدمة)

```typescript
value: `${((tenderSummary.won / Math.max(tenderSummary.submitted, 1)) * 100).toFixed(1)}%`
```

#### 3. رضا العملاء

```typescript
value: '96.2%' // قيمة ثابتة (مزيفة)
```

#### 4. درجة الجودة

```typescript
value: '94.5%' // قيمة ثابتة (مزيفة)
```

### ⚠️ التعارضات

**⚠️ تعارض مع النظام الموحد:**

1. **يستقبل `TenderSummary`** من `computeTenderSummary` (دالة قديمة)
2. **قيم ثابتة مزيفة:**
   - رضا العملاء: 96.2% (ليس من البيانات الحقيقية)
   - درجة الجودة: 94.5% (ليس من البيانات الحقيقية)
3. **يستخدم `tenderSummary.won` و `tenderSummary.submitted`**
   - النظام الموحد يوفر: `tenderStats.wonTenders` و `tenderStats.submittedTenders`

### 📋 التوصيات

⚠️ **يحتاج تحديث:**

1. استبدال `TenderSummary` بـ `useTenders().stats`
2. إزالة القيم الثابتة المزيفة أو ربطها ببيانات حقيقية
3. تحديث الحسابات لاستخدام `tenderStats`

**الكود المقترح:**

```typescript
interface TenderPerformanceCardsProps {
  // استخدام stats بدلاً من summary
  tenderStats: ReturnType<typeof useTenders>['stats']
}

// في المكون
const schedulePerformance = (
  (tenderStats.wonTenders / Math.max(tenderStats.submittedTenders, 1)) *
  100
).toFixed(1)
```

---

## 5️⃣ AnnualKPICards.tsx

### 📍 الموقع

```
src/presentation/pages/Dashboard/components/AnnualKPICards.tsx
```

### 🎯 الغرض

عرض 4 بطاقات مؤشرات أداء سنوية:

1. نسبة فوز المنافسات
2. عدد المشاريع
3. الإيرادات (مليون ريال)
4. أداء المشاريع

### 📤 المخرجات

- **المكون:** `AnnualKPICards`
- **النوع:** React Component (Dashboard Cards)
- **المخرج:** شبكة 4 بطاقات `UnifiedKPICard`

### 📥 المدخلات

```typescript
interface AnnualKPICardsProps {
  onSectionChange: (section: string) => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `DashboardPage.tsx` - عرض البطاقات السنوية في لوحة التحكم

**عدد الاستخدامات:** 1 ملف (مكون رئيسي)

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات كثيرة:**

#### 1. إحصائيات المنافسات

```typescript
const tenderKpi = () => {
  if (tendersLoading || !tenders) {
    return { winRate: 0, total: 0, won: 0, details: 'لا توجد بيانات' }
  }
  return {
    winRate: tenderStatsFromHook.winRate,
    total: tenderStatsFromHook.totalTenders,
    won: tenderStatsFromHook.wonTenders,
    details: `${tenderStatsFromHook.wonTenders} فوز من ${tenderStatsFromHook.totalTenders} منافسة`,
  }
}
```

#### 2. إحصائيات المشاريع

```typescript
const calculateProjectStats = () => {
  if (projectsLoading || !projects) {
    return { total: 0, active: 0, completed: 0, details: 'لا توجد بيانات' }
  }

  const totalProjects = projects.length
  const activeStatuses: Project['status'][] = ['active', 'delayed', 'planning']
  const activeProjects = projects.filter((project) =>
    activeStatuses.includes(project.status),
  ).length
  const completedProjects = projects.filter((project) => project.status === 'completed').length

  return {
    total: totalProjects,
    active: activeProjects,
    completed: completedProjects,
    details: `${activeProjects} نشط، ${completedProjects} مكتمل`,
  }
}
```

#### 3. حساب الإيرادات

```typescript
const calculateRevenue = () => {
  if (tendersLoading || !tenders) {
    return { current: 0, details: 'لا توجد بيانات' }
  }

  const wonTendersValue = tenders
    .filter((tender: Tender) => tender.status === 'won')
    .reduce((sum, tender) => sum + (tender.value ?? tender.totalValue ?? 0), 0)

  const currentRevenue = wonTendersValue / 1_000_000 // تحويل إلى ملايين
  const growth = currentRevenue > 0 ? Math.round(((currentRevenue - 32.8) / 32.8) * 100) : 0

  return {
    current: currentRevenue,
    details:
      growth > 0 ? `نمو ${growth}% عن العام الماضي` : `انخفاض ${Math.abs(growth)}% عن العام الماضي`,
  }
}
```

#### 4. أداء المشاريع

```typescript
const calculateProjectPerformance = () => {
  if (projectsLoading || !projects) {
    return { performance: 0, details: 'لا توجد بيانات' }
  }

  const projectsWithProgress = projects.filter((project) => typeof project.progress === 'number')
  if (projectsWithProgress.length === 0) {
    return { performance: 0, details: 'لا توجد بيانات كافية' }
  }

  const averageProgress = Math.round(
    projectsWithProgress.reduce((sum, project) => sum + (project.progress ?? 0), 0) /
      projectsWithProgress.length,
  )

  const excellentProjects = projects.filter((project) => (project.progress ?? 0) >= 90).length

  return {
    performance: averageProgress,
    details: `${excellentProjects} مشروع فوق التوقعات`,
  }
}
```

#### 5. جلب الأهداف السنوية

```typescript
const getYearlyTarget = (category: string, fallback: number) => {
  const year = new Date().getFullYear()
  const key = `targetValue${year}` as keyof (typeof goals)[number]
  const goal = goals.find((g) => g.category === category && g.type === 'yearly')
  const value = goal && typeof goal[key] === 'number' ? (goal[key] as number) : undefined

  return typeof value === 'number' && value >= 0 ? value : fallback
}
```

### ⚠️ التعارضات

**✅ موحد بالفعل - لا توجد تعارضات**

- ✅ يستخدم `useTenders().stats`
- ✅ جميع إحصائيات المنافسات من النظام الموحد
- ❌ لكن يحسب بعض الإيرادات يدوياً بدلاً من استخدام `tenderStats.wonValue`

### 📋 التوصيات

⚠️ **تحسين بسيط:**

استبدال حساب الإيرادات اليدوي:

```typescript
// بدلاً من هذا:
const wonTendersValue = tenders
  .filter((tender: Tender) => tender.status === 'won')
  .reduce((sum, tender) => sum + (tender.value ?? tender.totalValue ?? 0), 0)

// استخدم هذا:
const wonTendersValue = tenderStatsFromHook.wonValue
```

---

## 6️⃣ DashboardKPICards.tsx

### 📍 الموقع

```
src/presentation/pages/Dashboard/components/DashboardKPICards.tsx
```

### 🎯 الغرض

عرض بطاقات مؤشرات الأداء في لوحة التحكم مع معالجة حالات:

- التحميل
- عدم وجود أهداف
- عدم وجود بطاقات

### 📤 المخرجات

- **المكون:** `DashboardKPICards`
- **النوع:** React Component (Smart Container)
- **المخرج:** شبكة بطاقات KPI أو رسائل حالة

### 📥 المدخلات

```typescript
interface DashboardKPICardsProps {
  kpis: KPICardData[]
  isLoading: boolean
  maxCards: number
  hasGoals: boolean
  onSectionChange: (section: string) => void
  onAddGoals: () => void
  onCustomize: () => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `DashboardPage.tsx` - المكون الرئيسي لعرض KPIs

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**❌ لا توجد حسابات**

- مكون عرض بحت (Pure Presentation)
- يستقبل البيانات جاهزة من `useKPIs` hook
- يعرض البيانات فقط

### ⚠️ التعارضات

**❌ لا توجد تعارضات**

- لا يحسب شيئاً
- يستقبل البيانات من الخارج
- مكون UI فقط

### 📋 التوصيات

✅ **إبقاء الملف** - مكون جيد التصميم ومستخدم

---

## 7️⃣ TenderResultsManager.tsx

### 📍 الموقع

```
src/presentation/pages/Tenders/components/TenderResultsManager.tsx
```

### 🎯 الغرض

إدارة تحديث نتائج المنافسة (فوز/خسارة) مع:

- حوارات تأكيدية
- تحديث حالة المنافسة
- إنشاء مشروع تلقائي عند الفوز
- تحديث إحصائيات التطوير

### 📤 المخرجات

- **المكون:** `TenderResultsManager`
- **النوع:** React Component (Business Logic)
- **المخرج:** واجهة لإدارة النتائج

### 📥 المدخلات

```typescript
interface TenderResultsManagerProps {
  tender: Tender
  onUpdate?: () => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `TendersPage.tsx` - عرض واجهة النتائج عند اختيار منافسة

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات:**

#### 1. تحديث إحصائيات التطوير

```typescript
const updateDevelopmentStats = async (eventType: DevelopmentStatsEvent, tender: Tender) => {
  try {
    const { developmentStatsService } = await import(
      '@/application/services/developmentStatsService'
    )

    switch (eventType) {
      case 'won_tender':
        developmentStatsService.updateStatsForTenderWon(tender)
        break
      case 'lost_tender':
        developmentStatsService.updateStatsForTenderLost(tender)
        break
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات التطوير:', error)
  }
}
```

#### 2. تحديث حالة الفوز

```typescript
const confirmMarkAsWon = async () => {
  const currentDate = new Date().toISOString()
  const updatePayload: Partial<Tender> = {
    status: 'won',
    winDate: currentDate,
    resultDate: currentDate,
    lastAction: 'تم الفوز بالمنافسة! 🎉',
    lastUpdate: currentDate,
  }

  const updatedTender = await updateTender(tender.id, updatePayload)

  // تحديث إحصائيات التطوير
  await updateDevelopmentStats('won_tender', updatedTender)

  // إنشاء مشروع تلقائياً
  const projectCreationResult = await ProjectAutoCreationService.createProjectFromWonTender(
    updatedTender,
    {
      copyPricingData: true,
      copyQuantityTable: true,
      autoGenerateTasks: true,
      notifyTeam: true,
    },
  )
}
```

#### 3. تحديث حالة الخسارة

```typescript
const confirmMarkAsLost = async () => {
  const parsedWinningBidValue = Number.parseFloat(winningBidValue)

  if (!Number.isFinite(parsedWinningBidValue) || parsedWinningBidValue <= 0) {
    toast.error('يرجى إدخال قيمة العرض الفائز')
    return
  }

  const updatePayload: Partial<Tender> = {
    status: 'lost',
    lostDate: currentDate,
    resultDate: currentDate,
    lastAction: 'لم يتم الفوز بالمنافسة',
    lastUpdate: currentDate,
    winningBidValue: parsedWinningBidValue,
  }

  const updatedTender = await updateTender(tender.id, updatePayload)

  // تحديث إحصائيات التطوير
  await updateDevelopmentStats('lost_tender', updatedTender)
}
```

### ⚠️ التعارضات

**❌ لا توجد تعارضات**

- يستخدم `updateTender` من النظام
- يتكامل مع `developmentStatsService`
- يتكامل مع `ProjectAutoCreationService`
- لا يحسب الإحصائيات بنفسه

### 📋 التوصيات

✅ **إبقاء الملف** - مكون أساسي للعمليات

---

## 8️⃣ TendersHeaderSection.tsx

### 📍 الموقع

```
src/presentation/pages/Tenders/components/TendersHeaderSection.tsx
```

### 🎯 الغرض

عرض قسم الشريط العلوي في صفحة المنافسات مع:

- شارات الحالات المختلفة
- بطاقات الأداء

### 📤 المخرجات

- **المكون:** `TendersHeaderSection`
- **النوع:** React Component (Header Section)
- **المخرج:**
  - شريط شارات الحالات (8 شارات)
  - بطاقات الأداء (4 بطاقات)

### 📥 المدخلات

```typescript
interface TendersHeaderSectionProps {
  tenderSummary: TenderSummary // من tenderSummaryCalculator
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `TendersPage.tsx` - عرض الشريط العلوي

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات:**

#### 1. حساب معدل الفوز الآمن

```typescript
const safeWinRate = Number.isFinite(tenderSummary.winRate) ? tenderSummary.winRate : null
```

#### 2. تحديد حالة معدل الفوز

```typescript
const getWinRateStatus = (rate: number | null): 'success' | 'info' | 'warning' => {
  if (rate === null) return 'warning'
  if (rate >= 70) return 'success'
  if (rate >= 40) return 'info'
  return 'warning'
}
```

#### 3. عرض معدل الفوز

```typescript
const winRateDisplay = safeWinRate !== null ? `${safeWinRate.toFixed(1)}%` : '-'
```

### ⚠️ التعارضات

**⚠️ تعارض مع النظام الموحد:**

1. **يستقبل `TenderSummary`** من `computeTenderSummary` (دالة قديمة)
2. **يستخدم حقول `TenderSummary`:**

   - `tenderSummary.total`
   - `tenderSummary.urgent`
   - `tenderSummary.new`
   - `tenderSummary.underAction`
   - `tenderSummary.waitingResults`
   - `tenderSummary.won`
   - `tenderSummary.lost`
   - `tenderSummary.winRate`

3. **النظام الموحد يوفر نفس البيانات:**
   - `tenderStats.totalTenders`
   - `tenderStats.urgentTenders`
   - `tenderStats.newTenders`
   - `tenderStats.underActionTenders`
   - `tenderStats.submittedTenders`
   - `tenderStats.wonTenders`
   - `tenderStats.lostTenders`
   - `tenderStats.winRate`

### 📋 التوصيات

⚠️ **يحتاج تحديث:**

استبدال `TenderSummary` بـ `tenderStats`:

```typescript
interface TendersHeaderSectionProps {
  tenderStats: ReturnType<typeof useTenders>['stats']
}

// في المكون
<StatusBadge label={`الكل ${tenderStats.totalTenders}`} />
<StatusBadge label={`عاجل ${tenderStats.urgentTenders}`} />
// ... وهكذا
```

---

## 9️⃣ TenderStatusCards.tsx

### 📍 الموقع

```
src/presentation/pages/Tenders/components/TenderStatusCards.tsx
```

### 🎯 الغرض

عرض بطاقتين تفاعليتين:

1. المنافسات العاجلة (قائمة + تحذيرات)
2. تحليل أداء المنافسات (إحصائيات + مقارنات)

### 📤 المخرجات

- **المكون:** `TenderStatusCards`
- **النوع:** React Component (Dashboard Cards)
- **المخرج:** بطاقتان تفصيليتان

### 📥 المدخلات

```typescript
interface TenderStatusCardsProps {
  onSectionChange: (section: string) => void
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `DashboardPage.tsx` - عرض البطاقات في لوحة التحكم

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات كثيرة:**

#### 1. حساب المنافسات العاجلة

```typescript
const urgentTenders = useMemo(
  () =>
    tenders
      .filter((tender: Tender) => {
        if (!tender.deadline) return false
        const deadlineDate = new Date(tender.deadline)
        const today = new Date()
        const diffTime = deadlineDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7 && diffDays >= 0 && ['new', 'under_action'].includes(tender.status)
      })
      .slice(0, 4),
  [tenders],
)
```

#### 2. بيانات الأداء

```typescript
const performanceData = {
  thisMonth: {
    submitted: tenderStats.submittedTenders,
    won: tenderStats.wonTenders,
    lost: tenderStats.lostTenders,
    pending: tenderStats.submittedTenders,
    winRate: tenderStats.winRate,
    totalValue: tenderStats.submittedValue / 1000000,
  },
  lastMonth: {
    submitted: 6, // قيم ثابتة (مزيفة)
    won: 3,
    lost: 3,
    winRate: 50,
    totalValue: 32.1,
  },
}
```

#### 3. حساب التحسين

```typescript
const improvement = {
  winRate: performanceData.thisMonth.winRate - performanceData.lastMonth.winRate,
  value: performanceData.thisMonth.totalValue - performanceData.lastMonth.totalValue,
}
```

#### 4. حالة الأولوية

```typescript
const resolveUrgencyStatus = (daysLeft: number): UrgencyStatus => {
  if (daysLeft <= 1) return 'overdue'
  if (daysLeft <= 3) return 'dueSoon'
  return 'onTrack'
}
```

#### 5. حساب الأيام المتبقية

```typescript
const getDaysRemainingLocal = (deadline: string) => {
  if (!deadline) return 0
  const deadlineDate = new Date(deadline)
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}
```

### ⚠️ التعارضات

**⚠️ تعارضات جزئية:**

1. ✅ **يستخدم النظام الموحد:**

   - `const { stats: tenderStats } = useTenders()`
   - جميع الإحصائيات من `tenderStats`

2. ⚠️ **لكن يحسب العاجلة يدوياً:**

   - يفلتر `tenders` يدوياً بدلاً من استخدام `tenderStats.urgentTenders`
   - **السبب:** يحتاج قائمة المنافسات العاجلة (ليس العدد فقط)

3. ❌ **قيم ثابتة مزيفة للشهر الماضي:**
   ```typescript
   lastMonth: {
     submitted: 6,      // ثابت
     won: 3,            // ثابت
     lost: 3,           // ثابت
     winRate: 50,       // ثابت
     totalValue: 32.1,  // ثابت
   }
   ```

### 📋 التوصيات

⚠️ **يحتاج تحسين:**

1. ✅ **الاحتفاظ بحساب العاجلة يدوياً** - ضروري للحصول على القائمة
2. ❌ **إزالة القيم الثابتة** أو ربطها ببيانات تاريخية حقيقية
3. ⚠️ **إضافة خدمة للبيانات التاريخية:**

```typescript
// بدلاً من:
lastMonth: { submitted: 6, won: 3, ... }

// استخدم:
const { lastMonthStats } = useTenderHistoricalStats()
```

---

## 🔟 TenderStatusManager.tsx

### 📍 الموقع

```
src/presentation/pages/Tenders/components/TenderStatusManager.tsx
```

### 🎯 الغرض

إدارة تغيير حالة المنافسة مع حوار تفاعلي:

- تغيير الحالة (ملغاة، فائزة، خاسرة، مُرسلة)
- إدخال تفاصيل النتيجة
- تحديث إحصائيات التطوير

### 📤 المخرجات

- **المكون:** `TenderStatusManager`
- **النوع:** React Component (Dialog + Business Logic)
- **المخرج:** حوار لتغيير الحالة

### 📥 المدخلات

```typescript
interface TenderStatusManagerProps {
  tender: Tender
  trigger?: ReactNode
}
```

### 🔍 الاستخدام الحالي

**✅ مستخدم في النظام**

**الاستخدامات:**

- `TenderDetails.tsx` - زر تغيير الحالة في تفاصيل المنافسة

**عدد الاستخدامات:** 1 ملف

### 🧮 الحسابات الداخلية

**✅ يوجد حسابات:**

#### 1. تحديد الحالات المتاحة

```typescript
const getAvailableStatuses = (): StatusOption[] => {
  const baseOptions: StatusOption[] = [
    { value: 'cancelled', label: 'ملغاة', icon: X, color: 'text-muted-foreground' },
  ]

  if (tender.status === 'submitted') {
    return [
      ...baseOptions,
      { value: 'won', label: 'فائزة', icon: Trophy, color: 'text-success' },
      { value: 'lost', label: 'خاسرة', icon: XCircle, color: 'text-destructive' },
    ]
  }

  if (tender.status === 'ready_to_submit') {
    return [
      ...baseOptions,
      { value: 'submitted', label: 'تم التقديم', icon: FileText, color: 'text-info' },
    ]
  }

  return baseOptions
}
```

#### 2. تحديث إحصائيات التطوير

```typescript
const updateDevelopmentStats = async (eventType: DevelopmentStatsEvent, tender: Tender) => {
  const { developmentStatsService } = await import('@/application/services/developmentStatsService')

  switch (eventType) {
    case 'submitted_tender':
      developmentStatsService.updateStatsForTenderSubmission(tender)
      break
    case 'won_tender':
      developmentStatsService.updateStatsForTenderWon(tender)
      break
    case 'lost_tender':
      developmentStatsService.updateStatsForTenderLost(tender)
      break
  }
}
```

#### 3. معالجة تحديث الحالة

```typescript
const handleStatusUpdate = async () => {
  const currentDate = new Date().toISOString()
  const newStatus = selectedStatus

  const updatePayload: Partial<Tender> = {
    status: newStatus,
    lastUpdate: currentDate,
  }

  switch (newStatus) {
    case 'won':
      updatePayload.winDate = currentDate
      updatePayload.resultDate = currentDate
      updatePayload.lastAction = 'تم الفوز بالمنافسة! 🎉'
      break
    case 'lost':
      const parsedWinningBidValue = Number.parseFloat(winningBidValue)
      updatePayload.lostDate = currentDate
      updatePayload.resultDate = currentDate
      updatePayload.lastAction = 'لم يتم الفوز بالمنافسة'
      updatePayload.winningBidValue = parsedWinningBidValue
      break
    case 'submitted':
      updatePayload.lastAction = 'تم تقديم المنافسة'
      break
    case 'cancelled':
      updatePayload.lastAction = 'تم إلغاء المنافسة'
      break
  }

  const updatedTender = await updateTender(tender.id, updatePayload)

  // تحديث الإحصائيات
  if (newStatus === 'won') {
    await updateDevelopmentStats('won_tender', updatedTender)
  } else if (newStatus === 'lost') {
    await updateDevelopmentStats('lost_tender', updatedTender)
  } else if (newStatus === 'submitted') {
    await updateDevelopmentStats('submitted_tender', updatedTender)
  }
}
```

### ⚠️ التعارضات

**❌ لا توجد تعارضات**

- يستخدم `updateTender` من النظام
- يتكامل مع `developmentStatsService`
- لا يحسب الإحصائيات بنفسه
- منطق واضح ومنفصل

### 📋 التوصيات

✅ **إبقاء الملف** - مكون أساسي ومصمم جيداً

---

## 📊 تحليل التعارضات

### ⚠️ المشاكل الرئيسية

#### 1. استخدام `TenderSummary` القديم

**الملفات المتأثرة:**

- ❌ `TenderMetricsDisplay.tsx` (غير مستخدم)
- ⚠️ `TenderPerformanceCards.tsx` (مستخدم)
- ⚠️ `TendersHeaderSection.tsx` (مستخدم)

**المشكلة:**

```typescript
// النظام القديم
interface TenderSummary {
  total: number
  urgent: number
  underAction: number
  // ... 20+ حقل
}
const summary = computeTenderSummary(tenders, metrics, performance)

// النظام الموحد
const { stats } = useTenders()
// stats.totalTenders, stats.urgentTenders, etc.
```

**التأثير:**

- تكرار الحسابات
- عدم تطابق الأسماء
- اعتماد على دالة قديمة

#### 2. قيم ثابتة مزيفة

**الملفات المتأثرة:**

- `TenderPerformanceCards.tsx`:
  - رضا العملاء: 96.2%
  - درجة الجودة: 94.5%
- `TenderStatusCards.tsx`:
  - بيانات الشهر الماضي كلها ثابتة

**المشكلة:**

```typescript
// قيم مزيفة
value: "96.2%"  // ليست من البيانات الحقيقية

lastMonth: {
  submitted: 6,   // ثابت
  won: 3,         // ثابت
  // ...
}
```

**التأثير:**

- بيانات غير دقيقة
- تضليل المستخدم
- عدم فائدة المقارنات

#### 3. حسابات مكررة

**الملفات المتأثرة:**

- `AnnualKPICards.tsx`:
  - يحسب الإيرادات يدوياً بدلاً من استخدام `tenderStats.wonValue`
- `TenderStatusCards.tsx`:
  - يحسب العاجلة يدوياً (لكن ضروري للحصول على القائمة)

**المشكلة:**

```typescript
// في AnnualKPICards
const wonTendersValue = tenders
  .filter((tender) => tender.status === 'won')
  .reduce((sum, tender) => sum + (tender.value ?? tender.totalValue ?? 0), 0)

// النظام الموحد يوفرها
tenderStats.wonValue
```

**التأثير:**

- عدم اتساق البيانات
- تكرار المنطق
- صعوبة الصيانة

---

## 📋 جدول الملخص النهائي

| الملف                      | الغرض               | مستخدم؟ | حسابات؟      | تعارضات؟ | التوصية  |
| -------------------------- | ------------------- | ------- | ------------ | -------- | -------- |
| **TenderMetricsDisplay**   | عرض ملخص مقاييس     | ❌ لا   | ❌ لا        | ⚠️ نعم   | 🗑️ حذف   |
| **UnifiedKPICard**         | بطاقة KPI موحدة     | ✅ نعم  | ✅ تنسيق فقط | ❌ لا    | ✅ إبقاء |
| **EnhancedTenderCard**     | بطاقة منافسة محسّنة | ✅ نعم  | ✅ parsing   | ❌ لا    | ✅ إبقاء |
| **TenderPerformanceCards** | بطاقات الأداء       | ✅ نعم  | ✅ نعم       | ⚠️ نعم   | ⚠️ تحديث |
| **AnnualKPICards**         | البطاقات السنوية    | ✅ نعم  | ✅ كثيرة     | ⚠️ بسيط  | ⚠️ تحسين |
| **DashboardKPICards**      | عرض KPIs            | ✅ نعم  | ❌ لا        | ❌ لا    | ✅ إبقاء |
| **TenderResultsManager**   | إدارة النتائج       | ✅ نعم  | ✅ تحديثات   | ❌ لا    | ✅ إبقاء |
| **TendersHeaderSection**   | شريط علوي           | ✅ نعم  | ✅ بسيطة     | ⚠️ نعم   | ⚠️ تحديث |
| **TenderStatusCards**      | بطاقات الحالة       | ✅ نعم  | ✅ كثيرة     | ⚠️ بسيط  | ⚠️ تحسين |
| **TenderStatusManager**    | تغيير الحالة        | ✅ نعم  | ✅ منطق      | ❌ لا    | ✅ إبقاء |

---

## 🎯 التوصيات الإجمالية

### 🗑️ للحذف (1 ملف)

1. **TenderMetricsDisplay.tsx**
   - غير مستخدم في النظام
   - يعتمد على `TenderSummary` القديم
   - تم استبداله بمكونات أخرى

### ⚠️ للتحديث (3 ملفات)

#### 1. TenderPerformanceCards.tsx

**المطلوب:**

- استبدال `TenderSummary` بـ `tenderStats`
- إزالة القيم الثابتة المزيفة
- ربط البيانات بمصادر حقيقية

**الكود المقترح:**

```typescript
interface TenderPerformanceCardsProps {
  tenderStats: ReturnType<typeof useTenders>['stats']
}

// بدلاً من القيم الثابتة
const clientSatisfaction = calculateClientSatisfaction(projects, tenders)
const qualityScore = calculateQualityScore(projects)
```

#### 2. TendersHeaderSection.tsx

**المطلوب:**

- استبدال `TenderSummary` بـ `tenderStats`
- تحديث جميع الحقول

**الكود المقترح:**

```typescript
interface TendersHeaderSectionProps {
  tenderStats: ReturnType<typeof useTenders>['stats']
}

<StatusBadge label={`الكل ${tenderStats.totalTenders}`} />
<StatusBadge label={`عاجل ${tenderStats.urgentTenders}`} />
// ...
```

#### 3. TenderStatusCards.tsx

**المطلوب:**

- إضافة خدمة للبيانات التاريخية
- إزالة القيم الثابتة للشهر الماضي

**الكود المقترح:**

```typescript
const { currentMonth, lastMonth } = useTenderMonthlyComparison()

const performanceData = {
  thisMonth: currentMonth,
  lastMonth: lastMonth,
}
```

### ⚠️ للتحسين (1 ملف)

#### AnnualKPICards.tsx

**المطلوب:**

- استخدام `tenderStats.wonValue` بدلاً من الحساب اليدوي

**الكود المقترح:**

```typescript
const calculateRevenue = () => {
  if (tendersLoading) {
    return { current: 0, details: 'لا توجد بيانات' }
  }

  // استخدم القيمة الموحدة
  const currentRevenue = tenderStatsFromHook.wonValue / 1_000_000

  // ... باقي المنطق
}
```

### ✅ للإبقاء (5 ملفات)

1. **UnifiedKPICard.tsx** - مكون UI ممتاز
2. **EnhancedTenderCard.tsx** - مكون رئيسي
3. **DashboardKPICards.tsx** - مكون عرض جيد
4. **TenderResultsManager.tsx** - منطق أساسي
5. **TenderStatusManager.tsx** - منطق أساسي

---

## 🔍 ملخص التعارضات

### النوع الأول: تعارض مع النظام الموحد

**الملفات:**

- TenderMetricsDisplay.tsx (غير مستخدم)
- TenderPerformanceCards.tsx
- TendersHeaderSection.tsx

**المشكلة:**

```
يستخدمون: TenderSummary من computeTenderSummary()
النظام الموحد: tenderStats من useTenders()
```

**الحل:**

```typescript
// بدلاً من:
const summary = computeTenderSummary(tenders, metrics, performance)

// استخدم:
const { stats: tenderStats } = useTenders()
```

### النوع الثاني: قيم ثابتة مزيفة

**الملفات:**

- TenderPerformanceCards.tsx
- TenderStatusCards.tsx

**المشكلة:**

```typescript
value: "96.2%"  // قيمة ثابتة غير حقيقية

lastMonth: {
  submitted: 6,   // قيم ثابتة
  won: 3,
  // ...
}
```

**الحل:**

- إنشاء خدمة للبيانات التاريخية
- ربط البيانات بمصادر حقيقية
- أو إخفاء المقارنات حتى توفر البيانات

### النوع الثالث: حسابات مكررة

**الملفات:**

- AnnualKPICards.tsx

**المشكلة:**

```typescript
// حساب يدوي
const wonTendersValue = tenders.filter(...).reduce(...)

// بينما النظام الموحد يوفره
tenderStats.wonValue
```

**الحل:**

```typescript
const currentRevenue = tenderStatsFromHook.wonValue / 1_000_000
```

---

## ✅ الخلاصة

### الحالة الإجمالية

- **ملفات جيدة:** 5 ملفات (50%)
- **تحتاج تحديث:** 4 ملفات (40%)
- **للحذف:** 1 ملف (10%)

### الأولويات

1. 🔴 **عاجل:** حذف `TenderMetricsDisplay.tsx`
2. 🟡 **مهم:** تحديث الملفات الثلاثة التي تستخدم `TenderSummary`
3. 🟢 **تحسين:** استبدال الحسابات المكررة في `AnnualKPICards`

### التأثير

- بعد التحديث: **100% توافق مع النظام الموحد**
- تحسين الأداء: تقليل الحسابات المكررة
- زيادة الدقة: إزالة القيم المزيفة
- سهولة الصيانة: مصدر واحد للبيانات

---

**تاريخ التقرير:** 4 نوفمبر 2025  
**حالة النظام:** يعمل مع تعارضات جزئية  
**التوصية:** تنفيذ التحديثات المقترحة
