# 📋 خطة الاستخراج التدريجي للمكونات - ProjectsPage.tsx

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** مسودة أولية  
**الهدف:** تحسين معماري مع الحفاظ الكامل على التصميم الأصلي

---

## 🎯 النهج الجديد - بعد تحليل الإخفاق السابق

### ❌ ما الذي فشل في المحاولة السابقة؟

**المشكلة الرئيسية:**

- تم تقليل الأسطر من **947 LOC → 207 LOC** (تحسين 78%)
- لكن فُقدت مكونات أساسية من التصميم:
  - ✗ 4 بطاقات DetailCard (أداء الميزانية، الجدولة، الجودة، رضا العملاء)
  - ✗ 6 أيقونات StatusBadge في الهيدر
  - ✗ نظام Tabs كامل مع animations
  - ✗ Gradients و shadows المخصصة
  - ✗ حقل إدخال التكلفة للمشاريع المكتملة
  - ✗ التقسيم الثنائي grid للمعلومات المالية

**السبب:**

- التركيز كان على **تقليل الأسطر** بدلاً من **الحفاظ على التصميم**
- استخراج مكونات "عامة" بدلاً من نسخ التصميم الأصلي بدقة

### ✅ الاستراتيجية الجديدة

**المبادئ الأساسية:**

1. **الحفاظ على كل pixel من التصميم**

   - نسخ CSS classes بالكامل (gradients, shadows, borders, colors)
   - نسخ Framer Motion animations بنفس التوقيت
   - نسخ Grid layouts والمسافات بدقة

2. **استخراج تدريجي خطوة بخطوة**

   - استخراج مكون واحد فقط في كل مرة
   - اختبار بصري فوري بعد كل خطوة
   - Git commit لكل مكون ناجح

3. **هدف واقعي**
   - الوصول إلى **~500 LOC** (تحسين 50% بدلاً من 78%)
   - الجودة أهم من الكمية
   - الحفاظ على جميع الميزات > تقليل الأسطر

---

## 🔍 تحليل البنية الحالية - ProjectsPage.tsx (947 LOC)

### القسم 1: Imports & Types (40 LOC)

```typescript
// Lines 1-40
- 8 component imports من shadcn/ui
- 3 layout components (PageLayout, EmptyState, DetailCard)
- 2 feature components (NewProjectForm, Clients)
- 14 Lucide icons
- Type definitions: ProjectWithLegacyFields, ProjectStatusBadgeStatus
- Props interface: ProjectsViewProps
```

**قرار:** لا حاجة للاستخراج - هذا standard imports

---

### القسم 2: Component State & Hooks (90 LOC)

```typescript
// Lines 61-150
- useState hooks (8 state variables)
- useNavigate, useFinancialState
- formatCurrencyValue callback
- projectAggregates useMemo (مالية)
- دوال التعامل مع العمليات (handleDeleteProject, handleEditProject, handleNewProject...)
- دوال إدارة التكاليف (handleCostInputChange, handleSaveCosts)
```

**قرار الاستخراج:**

- ✅ **استخراج** `formatCurrencyValue` → hook مخصص `useProjectCurrencyFormatter`
- ✅ **استخراج** `projectAggregates` → hook `useProjectAggregates`
- ✅ **استخراج** cost management → hook `useProjectCostManagement`
- ⚠️ **الإبقاء** على state management داخل الصفحة (لتجنب prop drilling)

---

### القسم 3: Filtering Logic (40 LOC)

```typescript
// Lines 240-280
- getFilteredProjects callback
- stats useMemo (total, active, completed, planning, paused, averageProgress)
```

**قرار الاستخراج:**

- ✅ **استبدال** بـ `useProjectListStore` (موجود بالفعل!)
- هذا سيحذف ~40 LOC ويستخدم البنية التحتية الموجودة

---

### القسم 4: Project Management Data (60 LOC)

```typescript
// Lines 280-340
- projectsManagementData useMemo
  - overview: totalValue, monthlyProgress, averageProjectValue, teamUtilization...
  - performance: budgetVariance, scheduleVariance, qualityScore, clientSatisfaction...
  - resources: availableTeams, busyTeams, equipmentUtilization...
```

**قرار الاستخراج:**

- ✅ **استخراج** → hook `useProjectsManagementData`
- أو → مباشرة من `projectListStore` إذا أمكن

---

### القسم 5: Quick Actions (25 LOC)

```typescript
// Lines 340-365
- quickActions array (4 actions)
  - إدارة العملاء
  - تقارير المشاريع
  - إحصائيات الأداء
  - مشروع جديد
```

**قرار الاستخراج:**

- ✅ **استخراج** → مكون `<ProjectQuickActions />`
- سيحتفظ بجميع الأيقونات والألوان

---

### القسم 6: Header Metadata - StatusBadges (50 LOC)

```typescript
// Lines 365-415
- headerMetadata useMemo → 6 StatusBadge components
  - الكل، نشطة، مكتملة، متوقفة، معدل الإنجاز، صافي الربح
- كل badge له icon خاص و status color
```

**قرار الاستخراج:**

- ✅ **استخراج** → مكون `<ProjectHeaderBadges />`
- **أولوية عالية:** يجب نسخ جميع الألوان والأيقونات بدقة
- الحفاظ على className="shadow-none"

---

### القسم 7: Analysis Cards - DetailCard (80 LOC)

```typescript
// Lines 415-495
- projectsAnalysisCards useMemo → 4 DetailCard components
  1. أداء الميزانية (DollarSign, success)
  2. أداء الجدولة (Calendar, primary)
  3. درجة الجودة (Award, accent)
  4. رضا العملاء (Users, warning)
- كل بطاقة:
  - title, value, subtitle
  - icon, color, bgColor
  - trend (value, direction)
```

**قرار الاستخراج:**

- ✅ **استخراج** → مكون `<ProjectAnalysisCards />`
- **أولوية قصوى:** هذه البطاقات فُقدت في المحاولة السابقة!
- يجب نسخ:
  - grid gap-4 sm:grid-cols-2 xl:grid-cols-4
  - جميع الألوان (text-success, bg-success/10, etc.)
  - جميع الأيقونات
  - trend arrows

---

### القسم 8: Header Extra Content - Wrapper (20 LOC)

```typescript
// Lines 495-515
- headerExtraContent useMemo
  - wrapper div مع rounded-3xl border gradients
  - يحتوي على headerMetadata + projectsAnalysisCards
```

**قرار الاستخراج:**

- ✅ **دمج** مع المكونات السابقة
- أو → إنشاء `<ProjectHeaderExtras />` wrapper

---

### القسم 9: Status Utilities (40 LOC)

```typescript
// Lines 515-555
- getStatusIcon function
- getProjectStatusBadge function
```

**قرار الاستخراج:**

- ✅ **نقل** إلى utils/projectStatusHelpers.ts
- هذه pure functions لا علاقة لها بالعرض

---

### القسم 10: Tabs Configuration (110 LOC)

```typescript
// Lines 555-665
- tabs array (5 tabs)
  - كل tab له: id, label, count, icon, color, bgColor, hoverColor, activeColor...
  - all, active, completed, planning, paused
```

**قرار الاستخراج:**

- ✅ **استخراج** → const `PROJECT_TABS_CONFIG`
- نقله إلى config/projectTabsConfig.ts
- **يجب الحفاظ على:**
  - جميع الألوان (10+ color variants لكل tab)
  - جميع الأيقونات
  - badgeStatus mapping

---

### القسم 11: ProjectCard Component (200 LOC) ⭐ الأهم

```typescript
// Lines 665-865
- ProjectCard = ({ project, index }) => { ... }
- البنية:
  1. motion.div مع animation (delay: index * 0.05)
  2. Card wrapper
  3. العنوان والحالة (icon + name + health indicator)
  4. المعلومات الأساسية - grid 2 columns
     - العميل (Users)
     - التاريخ (Calendar)
     - النوع (Building2)
     - StatusBadge
  5. المعلومات المالية - grid 2 columns
     - قيمة العقد (DollarSign, text-success)
     - التكلفة التقديرية (BarChart3, text-warning)
  6. عرض الربح المتوقع (conditional)
  7. ملخص البيانات للمشاريع المكتملة (conditional)
  8. شريط التقدم (Progress)
  9. حقل إدخال التكلفة للمشاريع المكتملة (InlineAlert + Input + Button)
  10. EntityActions (View, Edit, Delete)
```

**قرار الاستخراج:**

- ✅ **استخراج** → ملف مستقل `ProjectCard.refactored.tsx`
- ⚠️ **انتباه شديد:**
  - الحفاظ على grid grid-cols-2 gap-3
  - الحفاظ على جميع conditional renders
  - الحفاظ على text colors (text-success, text-warning, text-destructive)
  - الحفاظ على motion animation
  - الحفاظ على InlineAlert للتكاليف
  - الحفاظ على truncate في النصوص

---

### القسم 12: Tabs Component (100 LOC)

```typescript
// Lines 865-965
- TabsComponent
  - Header مع العنوان والعدد
  - Tabs navigation bar
    - flex bg-muted rounded-lg p-1.5
    - motion.button لكل tab
    - activeTab animation (layoutId="activeProjectTab")
    - StatusBadge لكل tab
  - Content area
    - motion.div مع key animation
    - grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
    - map ProjectCard
    - EmptyState للتبويبات الفارغة
```

**قرار الاستخراج:**

- ✅ **استخراج** → مكون `<ProjectTabs />`
- **يجب الحفاظ على:**
  - bg-muted wrapper
  - whileHover, whileTap animations
  - layoutId="activeProjectTab" للخط المتحرك
  - grid responsive breakpoints
  - EmptyState لكل حالة

---

### القسم 13: View Routing Logic (50 LOC)

```typescript
// Lines 965-1015
- if (currentView === 'new') → NewProjectForm
- if (currentView === 'edit') → NewProjectForm with editProject
- if (currentView === 'clients') → Clients component
```

**قرار:** لا حاجة للاستخراج - routing logic يبقى في الصفحة

---

### القسم 14: Main Return - PageLayout (20 LOC)

```typescript
// Lines 1015-1035
- PageLayout wrapper
  - tone="primary"
  - title, description, icon
  - quickStats=[]
  - quickActions
  - headerExtra
  - showSearch, showLastUpdate
  - children: TabsComponent + AlertDialog
```

**قرار:** لا حاجة للاستخراج - PageLayout يبقى كما هو

---

## 📦 خطة التنفيذ المرحلية

### Phase 1: Utilities & Pure Functions (يوم 1 - 2 ساعة)

**الهدف:** استخراج الـ pure functions بدون تأثير على UI

```
✅ المهام:
1. إنشاء utils/projectStatusHelpers.ts
   - نقل getStatusIcon
   - نقل getProjectStatusBadge
   - إضافة tests

2. إنشاء config/projectTabsConfig.ts
   - نقل tabs array بالكامل
   - export const PROJECT_TABS_CONFIG

3. اختبار: استيراد من الملفات الجديدة
   - لا تغيير في UI
   - الصفحة تعمل بنفس الطريقة

التخفيض المتوقع: ~150 LOC → ~800 LOC
```

---

### Phase 2: Custom Hooks (يوم 2 - 3 ساعات)

**الهدف:** استخراج business logic إلى hooks

```
✅ المهام:
1. إنشاء hooks/useProjectCurrencyFormatter.ts
   export function useProjectCurrencyFormatter() {
     const { currency } = useFinancialState()
     const baseCurrency = currency?.baseCurrency ?? 'SAR'

     const formatCurrencyValue = useCallback(
       (amount, options) => {
         const normalized = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
         return formatCurrency(normalized, { currency: baseCurrency, ...options })
       },
       [baseCurrency]
     )

     return { formatCurrencyValue, baseCurrency }
   }

2. إنشاء hooks/useProjectAggregates.ts
   - نقل projectAggregates useMemo
   - استخدام projectMetrics من useFinancialState

3. إنشاء hooks/useProjectsManagementData.ts
   - نقل projectsManagementData useMemo
   - يستخدم useProjectAggregates داخلياً

4. إنشاء hooks/useProjectCostManagement.ts
   - نقل handleCostInputChange
   - نقل handleSaveCosts
   - نقل costInputs, isSavingCosts state
   - return { costInputs, isSavingCosts, handleCostInputChange, handleSaveCosts }

5. استبدال getFilteredProjects بـ useProjectListStore
   - const { getFilteredProjects } = useProjectListStore()
   - حذف getFilteredProjects local function

التخفيض المتوقع: ~800 LOC → ~600 LOC
```

---

### Phase 3: UI Components - Small Parts (يوم 3 - 4 ساعات)

**الهدف:** استخراج المكونات الصغيرة التي فُقدت في المحاولة السابقة

```
✅ المهام:
1. إنشاء components/ProjectHeaderBadges.tsx (60 LOC)
   interface ProjectHeaderBadgesProps {
     stats: { total, active, completed, paused, averageProgress }
     totalNetProfit: number
     formatCurrencyValue: (amount: number, options?) => string
   }

   - نسخ كامل من headerMetadata useMemo
   - الحفاظ على:
     ✓ جميع الـ 6 StatusBadge
     ✓ جميع الأيقونات (ListChecks, PlayCircle, CheckCircle, PauseCircle, BarChart3, DollarSign)
     ✓ جميع الألوان (info, success, warning, default)
     ✓ className="shadow-none"
     ✓ size="sm"

2. إنشاء components/ProjectAnalysisCards.tsx (100 LOC)
   interface ProjectAnalysisCardsProps {
     managementData: { performance: {...}, ... }
   }

   - نسخ كامل من projectsAnalysisCards useMemo
   - الحفاظ على:
     ✓ grid gap-4 sm:grid-cols-2 xl:grid-cols-4
     ✓ جميع الـ 4 DetailCard
     ✓ جميع الألوان (text-success bg-success/10, text-primary bg-primary/10, ...)
     ✓ جميع الأيقونات (DollarSign, Calendar, Award, Users)
     ✓ trend values و directions

3. إنشاء components/ProjectHeaderExtras.tsx (30 LOC)
   - wrapper component
   - يجمع ProjectHeaderBadges + ProjectAnalysisCards
   - الحفاظ على:
     ✓ rounded-3xl border border-primary/20
     ✓ bg-gradient-to-l from-primary/10 via-card/40 to-background
     ✓ p-5 shadow-sm
     ✓ rounded-3xl border border-border/40
     ✓ bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm

4. إنشاء components/ProjectQuickActions.tsx (40 LOC)
   - نسخ quickActions array
   - render Buttons
   - الحفاظ على جميع الأيقونات والـ variants

اختبار بصري بعد كل مكون!

التخفيض المتوقع: ~600 LOC → ~370 LOC
```

---

### Phase 4: ProjectCard Component (يوم 4 - 5 ساعات) ⭐

**الهدف:** استخراج أهم مكون - ProjectCard

```
✅ المهام:
1. إنشاء components/ProjectCard.refactored.tsx (220 LOC)

   interface ProjectCardProps {
     project: ProjectWithLegacyFields
     index: number
     onView: (projectId: string) => void
     onEdit: (project: ProjectWithLegacyFields) => void
     onDelete: (projectId: string) => void
     formatCurrencyValue: (amount: number, options?) => string
     costInputs: Record<string, string>
     isSavingCosts: Record<string, boolean>
     onCostInputChange: (projectId: string, value: string) => void
     onSaveCosts: (project: ProjectWithLegacyFields) => Promise<void>
   }

   - نسخ كامل ProjectCard function (lines 665-865)
   - **الحفاظ على كل شيء:**
     ✓ motion.div animation (delay: index * 0.05)
     ✓ Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group"
     ✓ grid grid-cols-2 gap-3 للمعلومات الأساسية
     ✓ grid grid-cols-2 gap-2 للمعلومات المالية
     ✓ text colors (text-success, text-warning, text-destructive, text-muted-foreground)
     ✓ conditional renders (isCompleted checks)
     ✓ InlineAlert للتكاليف
     ✓ Progress bar
     ✓ EntityActions
     ✓ truncate classes
     ✓ getHealthColor dot
     ✓ StatusBadge

2. اختبار بصري دقيق:
   - مقارنة pixel-by-pixel
   - اختبار جميع الحالات (active, completed, planning, paused)
   - اختبار حقل التكلفة للمشاريع المكتملة
   - اختبار hover effects
   - اختبار animations

التخفيض المتوقع: ~370 LOC → ~150 LOC (في الصفحة الرئيسية)
```

---

### Phase 5: Tabs System (يوم 5 - 4 ساعات)

**الهدف:** استخراج نظام التبويبات

```
✅ المهام:
1. إنشاء components/ProjectTabs.tsx (150 LOC)

   interface ProjectTabsProps {
     activeTab: string
     onTabChange: (tabId: string) => void
     tabs: typeof PROJECT_TABS_CONFIG
     projects: ProjectWithLegacyFields[]
     getFilteredProjects: (status: string) => ProjectWithLegacyFields[]
     stats: { total, active, completed, planning, paused }
     onSectionChange: (section: string) => void
     // ProjectCard props
     onViewProject: (id: string) => void
     onEditProject: (project) => void
     onDeleteProject: (id: string) => void
     formatCurrencyValue: (amount, options?) => string
     costInputs: Record<string, string>
     isSavingCosts: Record<string, boolean>
     onCostInputChange: (projectId: string, value: string) => void
     onSaveCosts: (project) => Promise<void>
   }

   - نسخ كامل TabsComponent (lines 865-965)
   - استخدام ProjectCard المستخرج
   - **الحفاظ على:**
     ✓ bg-card rounded-xl border
     ✓ flex bg-muted rounded-lg p-1.5 gap-1
     ✓ motion.button مع whileHover, whileTap
     ✓ layoutId="activeProjectTab"
     ✓ جميع الألوان لكل tab (activeColor, hoverColor, bgColor)
     ✓ StatusBadge لكل tab
     ✓ motion.div content animation
     ✓ grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
     ✓ EmptyState مع 5 رسائل مختلفة

2. اختبار:
   - التنقل بين التبويبات
   - animations سلسة
   - responsive grid
   - EmptyState لكل تبويب

التخفيض المتوقع: ~150 LOC → ~50 LOC (في الصفحة الرئيسية)
```

---

### Phase 6: Integration with Zustand (يوم 6 - 3 ساعات)

**الهدف:** استبدال props بـ stores

```
✅ المهام:
1. في ProjectsContainer.tsx:
   - إزالة props drilling
   - استخدام مباشر للـ stores

2. في المكونات الجديدة:
   - استخدام useProjectStore() مباشرة
   - استخدام useProjectListStore() مباشرة
   - تقليل props passing

3. تنظيف:
   - حذف wrapper functions غير الضرورية
   - حذف type casting
   - إزالة eslint-disable comments

لا تخفيض LOC لكن تحسين architecture
```

---

### Phase 7: Final Testing & Cleanup (يوم 7 - 4 ساعات)

**الهدف:** التأكد من أن كل شيء يعمل

```
✅ المهام:
1. اختبارات شاملة:
   - كل scenario للمشاريع
   - كل status (active, completed, planning, paused)
   - cost input للمشاريع المكتملة
   - routing (new, edit, view, clients)
   - delete confirmation

2. Visual regression testing:
   - مقارنة screenshots قبل/بعد
   - التأكد من عدم تغيير أي pixel

3. كتابة unit tests للمكونات الجديدة:
   - ProjectHeaderBadges.test.tsx
   - ProjectAnalysisCards.test.tsx
   - ProjectCard.refactored.test.tsx
   - ProjectTabs.test.tsx

4. تحديث documentation

5. Git commit نهائي + push
```

---

## 📊 النتيجة المتوقعة

### Before:

```
ProjectsPage.tsx: 947 LOC
```

### After:

```
src/presentation/pages/Projects/
├── ProjectsPage.refactored.tsx: ~50 LOC (PageLayout wrapper only)
│
src/presentation/components/Projects/
├── ProjectCard.refactored.tsx: 220 LOC
├── ProjectTabs.tsx: 150 LOC
├── ProjectHeaderBadges.tsx: 60 LOC
├── ProjectAnalysisCards.tsx: 100 LOC
├── ProjectHeaderExtras.tsx: 30 LOC
├── ProjectQuickActions.tsx: 40 LOC
│
src/shared/utils/
├── projectStatusHelpers.ts: 40 LOC
│
src/shared/config/
├── projectTabsConfig.ts: 110 LOC
│
src/application/hooks/
├── useProjectCurrencyFormatter.ts: 25 LOC
├── useProjectAggregates.ts: 35 LOC
├── useProjectsManagementData.ts: 40 LOC
├── useProjectCostManagement.ts: 50 LOC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
إجمالي: ~950 LOC (موزعة على 14 ملف)
```

**التحسينات:**

- ✅ **0% تخفيض في LOC** (لكن تحسين architecture)
- ✅ **100% preservation** للتصميم الأصلي
- ✅ **Reusability** - المكونات قابلة لإعادة الاستخدام
- ✅ **Testability** - كل مكون قابل للاختبار بشكل مستقل
- ✅ **Maintainability** - أسهل للقراءة والصيانة

---

## ⚠️ قواعد الأمان - يجب الالتزام بها

### قبل استخراج أي مكون:

1. ✅ **Git commit** للكود الحالي
2. ✅ **Screenshot** للصفحة الحالية (كل الحالات)
3. ✅ **نسخ exact CSS classes** (لا تعديل ولا اختصار)
4. ✅ **نسخ exact props** (لا تغيير في types)

### بعد استخراج المكون:

1. ✅ **اختبار بصري** - مقارنة مع الصفحة الأصلية
2. ✅ **اختبار وظيفي** - جميع الأزرار والحقول
3. ✅ **اختبار animations** - Framer Motion يعمل
4. ✅ **اختبار responsive** - mobile, tablet, desktop

### إذا فشل أي اختبار:

1. ❌ **لا تكمل** - توقف فوراً
2. 🔄 **تراجع** عن التغييرات
3. 🔍 **راجع** ما فُقد من التصميم
4. ♻️ **أعد المحاولة** بدقة أكثر

---

## 📝 ملاحظات مهمة

### ما يجب الحفاظ عليه بدقة:

1. **الألوان:**

   - text-success, text-warning, text-destructive, text-primary, text-accent
   - bg-success/10, bg-primary/10, bg-warning/10, etc.
   - border-primary/20, border-border/40, etc.

2. **Gradients:**

   - bg-gradient-to-l from-primary/10 via-card/40 to-background
   - shadow-lg shadow-primary/10

3. **Spacing:**

   - gap-4, gap-3, gap-2, gap-1.5, gap-1
   - p-5, p-4, px-4 py-2.5
   - mb-3, mt-3, pt-3

4. **Borders & Shadows:**

   - rounded-3xl, rounded-xl, rounded-lg, rounded-md
   - shadow-sm, shadow-md, shadow-lg
   - border, border-t, border-b

5. **Grid Layouts:**

   - grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
   - grid-cols-2
   - sm:grid-cols-2 xl:grid-cols-4

6. **Animations:**

   - motion.div initial, animate, transition
   - whileHover, whileTap
   - layoutId for shared animations
   - delay: index \* 0.05

7. **Icons:**

   - className="h-4 w-4" (size consistency)
   - color classes (text-success, text-muted-foreground, etc.)

8. **Conditional Renders:**
   - isCompleted checks
   - actualCost/spent checks
   - empty state checks

---

## 🎯 معايير النجاح

✅ **نجح التحسين إذا:**

- لا فرق بصري مع الصفحة الأصلية (0% pixel difference)
- جميع الميزات تعمل (100% functional parity)
- الكود أكثر قابلية للصيانة (better separation of concerns)
- المكونات قابلة لإعادة الاستخدام (reusable components)
- الاختبارات تمر (all tests passing)

❌ **فشل التحسين إذا:**

- تغير أي pixel في التصميم
- فُقدت أي ميزة (حتى لو صغيرة)
- animations أصبحت أبطأ/أسرع
- responsive behavior تغير
- المستخدم لاحظ أي فرق

---

## 📅 الجدول الزمني المقترح

- **يوم 1:** Phase 1 (Utilities)
- **يوم 2:** Phase 2 (Custom Hooks)
- **يوم 3:** Phase 3 (Small UI Components)
- **يوم 4:** Phase 4 (ProjectCard)
- **يوم 5:** Phase 5 (Tabs System)
- **يوم 6:** Phase 6 (Zustand Integration)
- **يوم 7:** Phase 7 (Testing & Cleanup)

**إجمالي:** 7 أيام عمل (2-5 ساعات يومياً)

---

## 🚀 البداية

**الخطوة الأولى - Phase 1 Day 1:**

1. إنشاء `src/shared/utils/projectStatusHelpers.ts`
2. نقل `getStatusIcon` و `getProjectStatusBadge`
3. Git commit: "refactor: extract project status helpers"

**هل نبدأ؟** 🎯
