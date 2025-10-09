# 📖 التوثيق الفني الشامل
## نظام إدارة شركة المقاولات المتطور

---

## 📋 فهرس التوثيق

1. [معمارية النظام](#-معمارية-النظام)
2. [هيكل المشروع](#-هيكل-المشروع)
3. [المكونات الأساسية](#-المكونات-الأساسية)
4. [إدارة البيانات](#-إدارة-البيانات)
5. [نظام التصميم](#-نظام-التصميم)
6. [التحسينات والأداء](#-التحسينات-والأداء)
7. [الأمان والحماية](#-الأمان-والحماية)
8. [الاختبارات](#-الاختبارات)
9. [النشر والصيانة](#-النشر-والصيانة)
10. [إرشادات التطوير](#-إرشادات-التطوير)

**ملاحظة مهمة**: تم تنظيف التطبيق بالكامل من جميع آثار Electron وأصبح تطبيق ويب خالص.

---

## 🏛️ معمارية النظام

### نمط التصميم المستخدم

#### Component-Based Architecture
```
┌─────────────────────────────────────┐
│            App.tsx                  │
│         (Main Container)            │
├──────────────���──────────────────────┤
│  Header  │    Sidebar   │  Main     │
│          │              │  Content  │
├─────────────────────────────────────┤
│        Shared Components            │
│   (Cards, Charts, Forms, etc.)     │
├─────────────────────────────────────┤
│           UI Components             │
│     (Shadcn/UI + Custom)           │
├─────────────────────────────────────┤
│          Data Layer                 │
│    (centralData.ts + Utils)        │
└─────────────────────────────────────┘
```

#### Atomic Design Methodology
```
Atoms → Molecules → Organisms → Templates → Pages
  ↓         ↓          ↓           ↓        ↓
Button   Card      Dashboard   PageLayout Projects
Input    Badge     Header      Settings   Tenders
Icon     Table     Sidebar                Clients
```

### تدفق البيانات

#### Unidirectional Data Flow
```
State Management:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Parent    │ => │   Child     │ => │ Grandchild  │
│ Components  │    │ Components  │    │ Components  │
└─────────────┘    └─────────────┘    └─────────────┘
       ↑                  ↑                  ↑
       └─────── Event Callbacks ─────────────┘
```

#### Data Processing Pipeline
```
Raw Data → Validation → Processing → Normalization → Display
    ↓           ↓            ↓            ↓          ↓
Excel File → Validation → ExcelProcessor → centralData → UI Components
```

---

## 🗂️ هيكل المشروع

### التنظيم العام

```
advanced-construction-management/
├── 📁 components/                 # المكونات الرئيسية
│   ├── 📁 ui/                    # مكونات UI الأساسية (Shadcn)
│   ├── 📁 figma/                 # مكونات خاصة بـ Figma
│   ├── 📄 *.tsx                  # مكونات التطبيق الرئيسية
│   └── 📄 index.ts               # فهرس المكونات
├── 📁 data/                      # إدارة البيانات
│   └── 📄 centralData.ts         # البيانات المركزية
├── 📁 styles/                    # التنسيقات
│   └── 📄 globals.css            # التنسيقات الأساسية
├── 📁 figma-design-system/       # نظام التصميم
│   ├── 📄 design-system-guide.md
│   ├── 📄 design-tokens.json
│   └── 📄 *.md                   # توثيق التصميم
├── 📁 guidelines/                # الإرشادات
├── 📄 App.tsx                    # المكون الرئيسي
├── 📄 package.json               # إعدادات المشروع
├── 📄 README.md                  # دليل المشروع
└── 📄 *.md                       # ملفات التوثيق
```

### تنظيم المكونات

#### حسب الوظيفة
```
components/
├── 🏠 Layout Components          # التخطيط العام
│   ├── Header.tsx               # الهيدر العلوي
│   ├── Sidebar.tsx              # الشريط الجانبي
│   └── PageLayout.tsx           # تخطيط الصفحات
├── 📊 Dashboard Components       # لوحة التحكم
│   ├── Dashboard.tsx            # اللوحة الرئيسية
│   ├── StatsCards.tsx           # بطاقات الإحصائيات
│   └── KPIBar.tsx               # شريط المؤشرات
├── 🏗️ Project Management        # إدارة المشاريع
│   ├── Projects.tsx             # قائمة المشاريع
│   ├── NewProjectForm.tsx       # نموذج مشروع جديد
│   └── ProjectChart.tsx         # مخططات المشاريع
├── 📋 Tender Management         # إدارة المنافسات
│   ├── Tenders.tsx              # قائمة المنافسات
│   └── NewTenderForm.tsx        # نموذج منافسة جديدة
├── 👥 Client Management         # إدارة العملاء
│   ├── Clients.tsx              # قائمة العملاء
│   └── NewClientForm.tsx        # نموذج عميل جديد
├── 💰 Financial Management      # الإدارة المالية
│   ├── Financial.tsx            # الصفحة المالية
│   ├── BankStatementAnalyzer.tsx# محلل كشوف البنك
│   └── BankStatementProcessor.tsx# معالج البيانات المصرفية
├── 🛒 Procurement & Inventory   # المشتريات والمخزون
│   ├── Purchases.tsx            # المشتريات
│   ├── NewPurchaseOrder.tsx     # طلب شراء جديد
│   └── Inventory.tsx            # المخزون
├── 📊 Reports & Analytics       # التقارير والتحليلات
│   ├── Reports.tsx              # التقارير
│   └── AdvancedCharts.tsx       # الرسوم البيانية المتقدمة
├── ⚙️ Settings & Tools          # الإعدادات والأدوات
│   ├── Settings.tsx             # الإعدادات
│   ├── ExcelDataProcessor.tsx   # معالج بيانات Excel
│   ├── ExcelUploadHelper.tsx    # مساعد رفع Excel
│   └── SystemHealthChecker.tsx  # فاحص صحة النظام
└── 🎨 UI Components             # مكونات الواجهة
    └── ui/                      # مكتبة Shadcn/UI
```

---

## 🧩 المكونات الأساسية

### 1. App.tsx - المكون الجذر

#### الوظائف الأساسية
```typescript
interface AppState {
  isDarkMode: boolean        // حالة الوضع الليلي
  activeSection: string      // القسم النشط حالياً
}

interface AppMethods {
  toggleDarkMode(): void     // تبديل الوضع الليلي
  setActiveSection(section: string): void  // تغيير القسم النشط
  renderContent(): JSX.Element  // عرض المحتوى المناسب
}
```

#### معالجة الحالة
```typescript
// إدارة الوضع الليلي
useEffect(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode) {
    setIsDarkMode(JSON.parse(savedDarkMode))
  }
}, [])

// تطبيق التغييرات على DOM
useEffect(() => {
  document.documentElement.classList.toggle('dark', isDarkMode)
  document.documentElement.setAttribute('dir', 'rtl')
  document.documentElement.setAttribute('lang', 'ar')
  localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
}, [isDarkMode])
```

### 2. PageLayout - نظام التخطيط الموحد

#### البنية الأساسية
```typescript
interface PageLayoutProps {
  title: string                    // عنوان الصفحة
  description?: string             // وصف الصفحة
  icon?: React.ComponentType       // أيقونة الصفحة
  gradientFrom?: string            // لون البداية للتدرج
  gradientTo?: string              // لون النهاية للتدرج
  quickStats?: QuickStat[]         // إحصائيات سريعة
  quickActions?: QuickAction[]     // إجراءات سريعة
  headerExtra?: React.ReactNode    // محتوى إضافي في الهيدر
  showSearch?: boolean             // إظهار شريط البحث
  children: React.ReactNode        // محتوى الصفحة
}
```

#### التنفيذ
```typescript
export function PageLayout({ 
  title, 
  description, 
  icon: Icon, 
  children,
  ...props 
}: PageLayoutProps) {
  return (
    <div className="h-full bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          {Icon && (
            <div className={`p-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        {quickStats && <QuickStatsRow stats={quickStats} />}
        
        {/* Quick Actions */}
        {quickActions && <QuickActionsRow actions={quickActions} />}
        
        {/* Extra Content */}
        {headerExtra}
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
```

### 3. نظام البطاقات المتطور

#### DetailCard - بطاقة التفاصيل
```typescript
interface DetailCardProps {
  title: string                   // العنوان
  value: string | number          // القيمة الأساسية
  subtitle?: string               // العنوان الفرعي
  icon?: React.ComponentType      // الأيقونة
  color?: string                  // لون الأيقونة
  bgColor?: string                // لون الخلفية
  trend?: {                       // اتجاه التغيير
    value: string
    direction: 'up' | 'down' | 'stable'
  }
  onClick?: () => void            // دالة النقر
  loading?: boolean               // حالة التحميل
}
```

#### التنفيذ المتقدم
```typescript
export function DetailCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  trend,
  onClick,
  loading = false
}: DetailCardProps) {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : 
                   Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "card-compact cursor-pointer transition-all duration-200",
        onClick && "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? formatCurrency(value) : value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={cn("p-2 rounded-lg", bgColor)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              trend.direction === 'up' && "text-green-600 bg-green-50",
              trend.direction === 'down' && "text-red-600 bg-red-50",
              trend.direction === 'stable' && "text-gray-600 bg-gray-50"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
```

---

## 🗄️ إدارة البيانات

### البيانات المركزية (centralData.ts)

#### هيكل البيانات
```typescript
// البيانات الأساسية المخزَّنة محلياً (سكان افتراضيون فقط)
export const projectsData: Project[] = []
export const tendersData: Tender[] = []
export const clientsData: Client[] = []

// تمت إزالة inventory/equipment/purchases لأن الصفحات المقابلة لم تعد موجودة
// أي استخدام فعلي يعتمد الآن على centralDataService + Electron Store
```

> **مهم:** لم تعد الإحصائيات السريعة تُشتق من هذه المصفوفات الثابتة. مزود الحالة المركزي `FinancialStateProvider` (عبر الهوك `useFinancialState`) أصبح المصدر الوحيد للبيانات المباشرة من المستودعات، بينما يتولى `useFinancialData` حساب مؤشرات الأداء انطلاقًا من تلك البيانات.

#### الحصول على الإحصائيات الآن

- استهلاك البيانات يتم عبر `useFinancialState()` للحصول على الفواتير، الموازنات، التقارير، المشاريع، المناقصات، والعملاء مع عمليات التحديث الموحدة (`refreshAll`). تم دمج قدرات `useClients()` داخل المزود، ويبقى الهوك متاحاً فقط للحالات الخاصة أو الاختبارات المعزولة.
- المؤشرات المالية تأتي من `useFinancialData()` والتي تحتسب الهوامش، التدفقات النقدية، الذمم، وغيرها بالاعتماد على المصروفات والمشاريع الحقيقية، ثم تُحقن داخل قيمة السياق (`financial`).
- أي مكوّن يحتاج أرقاماً تجميعية (مثل Sidebar أو Reports أو Tenders) يعتمد الآن على القوائم والمقاييس الجاهزة المقدمة من `FinancialStateProvider` بدلاً من متغيرات ثابتة أو `useCentralData`.
- `useCentralData` أُحيل للتقاعد نهائيًا؛ أي استدعاء له الآن سيرمي خطأ إرشاديًا لإجبار التحديث إلى `useFinancialState`.

هذه التغييرات جاءت ضمن مرحلة تنظيف Phase 5 لإزالة الطبقات الوهمية وتوحيد مصدر الحقيقة.

### معالجة بيانات Excel

#### ExcelDataProcessor

```typescript
export class ExcelDataProcessor {
  // معالجة المشاريع
  static processProjectsData(rawData: any[]): Project[] {
    return rawData.map((row, index) => ({
      id: `PRJ-IMP-${String(index + 1).padStart(3, '0')}`,
      name: row.name || row['اسم المشروع'] || `مشروع مستورد ${index + 1}`,
      client: row.client || row['العميل'] || 'عميل غير محدد',
      status: this.normalizeStatus(row.status || row['الحالة'] || 'planning'),
      priority: this.normalizePriority(row.priority || row['الأولوية'] || 'medium'),
      progress: this.normalizeNumber(row.progress || row['التقدم'], 0, 100),
      budget: this.normalizeNumber(row.budget || row['الميزانية'], 0),
      // ... باقي الحقول
    }))
  }
  
  // معالجة كشف الحساب البنكي
  static processBankStatementData(rawData: any[]): BankTransaction[] {
    return BankStatementProcessor.processBankStatement(rawData)
  }
  
  // دوال التطبيع
  private static normalizeStatus(status: string): ProjectStatus {
    const statusMap: Record<string, ProjectStatus> = {
      'نشط': 'active',
      'مكتمل': 'completed',
      'متأخر': 'delayed',
      'متوقف': 'paused',
      'تخطيط': 'planning'
    }
    return statusMap[status?.toLowerCase()] || 'planning'
  }
  
  private static normalizeNumber(value: any, min: number = 0, max?: number): number {
    if (value === undefined || value === null || value === '') return min
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value)
    if (isNaN(num)) return min
    if (max !== undefined) return Math.min(Math.max(num, min), max)
    return Math.max(num, min)
  }
}
```

#### BankStatementProcessor

```typescript
export class BankStatementProcessor {
  // معالجة كشف الحساب
  static processBankStatement(rawData: any[]): BankTransaction[] {
    return rawData.map((row, index) => ({
      id: `TXN-${Date.now()}-${index + 1}`,
      date: this.normalizeDate(row['التاريخ'] || row['Date']),
      balance: this.normalizeNumber(row['الرصيد'] || row['Balance']),
      debit: this.normalizeNumber(row['مدين'] || row['Debit']),
      credit: this.normalizeNumber(row['دائن'] || row['Credit']),
      description: this.cleanDescription(row['تفاصيل العملية'] || row['Description']),
      category: this.normalizeCategory(row['التصنيف'] || row['Category']),
      subcategory: this.normalizeSubcategory(row['التصنيف الفرعي'] || row['Subcategory']),
      project: this.normalizeProject(row['المشروع'] || row['Project']),
      transactionType: this.determineTransactionType(debit, credit),
      isReconciled: false,
      processedAt: new Date().toISOString()
    }))
  }
  
  // تحليل البيانات
  static analyzeBankStatement(transactions: BankTransaction[]): BankStatementSummary {
    const summary: BankStatementSummary = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      projectBreakdown: {},
      categoryBreakdown: {},
      monthlyBreakdown: {},
      dateRange: { startDate: '', endDate: '' }
    }
    
    // معالجة كل معاملة
    transactions.forEach(transaction => {
      const amount = transaction.transactionType === 'income' ? 
        transaction.credit : transaction.debit
      
      // تجميع الإحصائيات
      if (transaction.transactionType === 'income') {
        summary.totalIncome += amount
      } else {
        summary.totalExpenses += amount
      }
      
      // تحليل حسب المشروع
      if (transaction.project && transaction.project !== 'غير محدد') {
        if (!summary.projectBreakdown[transaction.project]) {
          summary.projectBreakdown[transaction.project] = {
            projectName: transaction.project,
            totalIncome: 0,
            totalExpenses: 0,
            netFlow: 0,
            transactionCount: 0
          }
        }
        
        const projectData = summary.projectBreakdown[transaction.project]
        if (transaction.transactionType === 'income') {
          projectData.totalIncome += amount
        } else {
          projectData.totalExpenses += amount
        }
        projectData.netFlow = projectData.totalIncome - projectData.totalExpenses
        projectData.transactionCount++
      }
      
      // ... المزيد من التحليلات
    })
    
    summary.netFlow = summary.totalIncome - summary.totalExpenses
    return summary
  }
  
  // التصنيف التلقائي
  static autoClassifyTransactions(transactions: BankTransaction[]): BankTransaction[] {
    const classificationRules = this.getClassificationRules()
    
    return transactions.map(transaction => {
      if (!transaction.category || transaction.category === 'غير محدد') {
        const description = transaction.description.toLowerCase()
        
        for (const rule of classificationRules) {
          if (rule.keywords.some(keyword => description.includes(keyword.toLowerCase()))) {
            transaction.category = rule.category
            transaction.subcategory = rule.subcategory
            break
          }
        }
      }
      
      return transaction
    })
  }
  
  // قواعد التصنيف
  private static getClassificationRules() {
    return [
      {
        keywords: ['إسمنت', 'حديد', 'رمل', 'بلوك', 'خرسانة'],
        category: 'مواد البناء',
        subcategory: 'مواد أساسية'
      },
      {
        keywords: ['راتب', 'مرتب', 'أجور', 'عمالة'],
        category: 'الرواتب والأجور',
        subcategory: 'رواتب الموظفين'
      },
      {
        keywords: ['كهرباء', 'ماء', 'اتصالات'],
        category: 'المرافق',
        subcategory: 'خدمات أساسية'
      },
      {
        keywords: ['معدات', 'آلات', 'حفارة', 'رافعة'],
        category: 'المعدات',
        subcategory: 'معدات ثقيلة'
      },
      {
        keywords: ['وقود', 'بنزين', 'ديزل'],
        category: 'الوقود',
        subcategory: 'وقود المعدات'
      },
      {
        keywords: ['دفعة', 'سداد', 'مستحقات'],
        category: 'إيرادات المشاريع',
        subcategory: 'دفعات العملاء'
      }
      // ... المزيد من القواعد
    ]
  }
}
```

---

## 🎨 نظام التصميم

### Tailwind CSS 4.0 Configuration

#### المتغيرات الأساسية

```css
:root {
  /* الألوان الأساسية */
  --background: #fafbfc;
  --foreground: #0f172a;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  
  /* ألوان المقاولات المتخصصة */
  --construction-orange: #f97316;
  --construction-green: #10b981;
  --construction-purple: #8b5cf6;
  --construction-red: #ef4444;
  --construction-cyan: #06b6d4;
  
  /* نظام المسافات */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* أحجام البطاقات */
  --card-height-sm: 120px;
  --card-height-md: 180px;
  --card-height-lg: 240px;
  
  /* الانتقالات */
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### الوضع الليلي

```css
.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: rgba(30, 41, 59, 0.8);
  --border: rgba(71, 85, 105, 0.4);
  
  /* تحسينات للرؤية الليلية */
  --shadow-glow-blue: 0 0 30px rgba(59, 130, 246, 0.3);
  --shadow-glow-green: 0 0 30px rgba(16, 185, 129, 0.3);
}
```

### نظام التبويبات العربية

#### CSS للتبويبات

```css
.arabic-tabs {
  direction: rtl;
  font-family: 'Cairo', 'Tajawal', sans-serif;
}

.arabic-tabs-list {
  background: rgba(248, 250, 252, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: var(--radius-lg);
  padding: 0.375rem;
  display: flex;
  gap: 0.25rem;
}

.arabic-tabs-trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  transition: var(--transition-normal);
  cursor: pointer;
}

.arabic-tabs-trigger:hover {
  color: var(--foreground);
  background: rgba(59, 130, 246, 0.05);
  transform: scale(1.02);
}

.arabic-tabs-trigger[data-state="active"] {
  color: white;
  background: var(--primary);
  box-shadow: var(--shadow-glow-blue);
  transform: scale(0.98);
}

/* انتقال المحتوى */
.arabic-tabs-content[data-state="active"] {
  animation: arabic-tabs-content-show 0.3s ease-out;
}

@keyframes arabic-tabs-content-show {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### نظام الشبكة المضغوط

#### CSS للتخطيط المضغوط

```css
.dashboard-compact {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--grid-gap-sm);
  padding: var(--dashboard-padding);
  max-height: 100vh;
  overflow: hidden;
}

.card-compact {
  background: var(--card);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  transition: var(--transition-fast);
  padding: 0.75rem;
  min-height: auto;
}

.card-compact:hover {
  box-shadow: var(--card-shadow-md);
  transform: translateY(-1px);
}

/* استجابة التخطيط */
@media (max-width: 1024px) {
  .dashboard-compact {
    grid-template-columns: 1fr;
    gap: var(--grid-gap-sm);
    padding: var(--dashboard-padding-sm);
  }
}
```

---

## ⚡ التحسينات والأداء

### تحسينات React

#### Lazy Loading للمكونات

```typescript
// تحميل المكونات عند الحاجة
const Projects = lazy(() => import('./components/Projects'))
const Tenders = lazy(() => import('./components/Tenders'))
const Financial = lazy(() => import('./components/Financial'))

// مع Suspense للتحكم في التحميل
<Suspense fallback={<LoadingSpinner />}>
  <Projects />
</Suspense>
```

#### Memoization للحسابات المعقدة

```typescript
// حفظ نتائج الحسابات المكلفة
const expensiveCalculation = useMemo(() => {
  return calculateComplexStats(data)
}, [data])

// تحسين عرض القوائم الطويلة
const MemoizedListItem = memo(({ item }: { item: Project }) => {
  return <ProjectCard project={item} />
})
```

#### Virtual Scrolling للقوائم الطويلة

```typescript
// تحسين عرض القوائم الكبيرة
import { FixedSizeList as List } from 'react-window'

const VirtualizedProjectList = ({ projects }: { projects: Project[] }) => {
  const Row = ({ index, style }: { index: number, style: CSSProperties }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### تحسينات CSS

#### Critical CSS Extraction

```css
/* الأنماط الحيوية للتحميل السريع */
@layer critical {
  .app-container {
    height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: 'Cairo', sans-serif;
    direction: rtl;
  }
  
  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}
```

#### CSS Grid Optimizations

```css
/* شبكة محسنة للأداء */
.optimized-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  contain: layout style;
}

/* تحسين الرسم */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

### إدارة الذاكرة

#### تنظيف Event Listeners

```typescript
useEffect(() => {
  const handleResize = () => {
    // معالجة تغيير حجم النافذة
  }
  
  window.addEventListener('resize', handleResize)
  
  // تنظيف المستمعين
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])
```

#### تحسين re-renders

```typescript
// استخدام useCallback لتجنب إعادة الرسم غير الضرورية
const handleProjectClick = useCallback((projectId: string) => {
  // معالجة النقر على المشروع
}, [])

// استخدام useMemo للكائنات المعقدة
const chartConfig = useMemo(() => ({
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'إحصائيات المشاريع' }
  }
}), [])
```

---

## 🔒 الأمان والحماية

### حماية البيانات

#### Input Validation

```typescript
// التحقق من صحة المدخلات
const validateProjectData = (data: Partial<Project>): ValidationResult => {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length < 3) {
    errors.push('اسم المشروع يجب أن يكون 3 أحرف على الأقل')
  }
  
  if (!data.client || data.client.trim().length < 2) {
    errors.push('اسم العميل مطلوب')
  }
  
  if (data.budget && data.budget < 0) {
    errors.push('الميزانية لا يمكن أن تكون سالبة')
  }
  
  if (data.progress && (data.progress < 0 || data.progress > 100)) {
    errors.push('نسبة التقدم يجب أن تكون بين 0 و 100')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

#### Data Sanitization

```typescript
// تنظيف البيانات من المحتوى الضار
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // إزالة JavaScript
    .replace(/[<>]/g, '') // إزالة HTML tags
    .trim()
}

// تنظيف بيانات Excel
const sanitizeExcelData = (data: any[]): any[] => {
  return data.map(row => {
    const sanitizedRow: any = {}
    
    Object.keys(row).forEach(key => {
      const value = row[key]
      if (typeof value === 'string') {
        sanitizedRow[key] = sanitizeInput(value)
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitizedRow[key] = Math.max(0, value) // منع القيم السالبة غير المنطقية
      } else {
        sanitizedRow[key] = value
      }
    })
    
    return sanitizedRow
  })
}
```

### Content Security Policy

#### CSP Headers

```typescript
// سياسة أمان المحتوى
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
`
```

### Local Storage Security

#### تشفير البيانات المحلية

```typescript
// تشفير بسيط للبيانات الحساسة
const encryptData = (data: any): string => {
  return btoa(JSON.stringify(data))
}

const decryptData = (encryptedData: string): any => {
  try {
    return JSON.parse(atob(encryptedData))
  } catch {
    return null
  }
}

// حفظ البيانات بشكل آمن
const saveSecureData = (key: string, data: any) => {
  const encrypted = encryptData(data)
  localStorage.setItem(key, encrypted)
}

const loadSecureData = (key: string): any => {
  const encrypted = localStorage.getItem(key)
  if (!encrypted) return null
  return decryptData(encrypted)
}
```

---

## 🧪 الاختبارات

### Unit Tests

#### اختبار المكونات

```typescript
// __tests__/components/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectCard from '../ProjectCard'

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: 'PRJ-001',
    name: 'مشروع اختباري',
    client: 'عميل اختباري',
    status: 'active',
    progress: 75,
    budget: 1000000,
    // ... باقي الخصائص
  }

  it('يعرض معلومات المشروع بشكل صحيح', () => {
    render(<ProjectCard project={mockProject} />)
    
    expect(screen.getByText('مشروع اختباري')).toBeInTheDocument()
    expect(screen.getByText('عميل اختباري')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('يستجيب للنقر بشكل صحيح', () => {
    const mockClick = jest.fn()
    render(<ProjectCard project={mockProject} onClick={mockClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockClick).toHaveBeenCalledWith(mockProject.id)
  })
})
```

#### اختبار دوال البيانات

```typescript
// __tests__/data/ExcelDataProcessor.test.ts
import { ExcelDataProcessor } from '../../components/ExcelDataProcessor'

describe('ExcelDataProcessor', () => {
  describe('processProjectsData', () => {
    it('يعالج بيانات المشاريع بشكل صحيح', () => {
      const rawData = [
        {
          'اسم المشروع': 'مشروع تجريبي',
          'العميل': 'عميل تجريبي',
          'الميزانية': '1000000',
          'الحالة': 'نشط'
        }
      ]

      const result = ExcelDataProcessor.processProjectsData(rawData)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('مشروع تجريبي')
      expect(result[0].client).toBe('عميل تجريبي')
      expect(result[0].budget).toBe(1000000)
      expect(result[0].status).toBe('active')
    })

    it('يتعامل مع البيانات المفقودة بشكل صحيح', () => {
      const rawData = [{ 'اسم المشروع': 'مشروع ناقص' }]
      const result = ExcelDataProcessor.processProjectsData(rawData)

      expect(result[0].client).toBe('عميل غير محدد')
      expect(result[0].status).toBe('planning')
      expect(result[0].budget).toBe(0)
    })
  })
})
```

### Integration Tests

#### اختبار التكامل

```typescript
// __tests__/integration/Dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../../components/Dashboard'

describe('Dashboard Integration', () => {
  it('يحمل ويعرض جميع الإحصائيات', async () => {
    render(<Dashboard onSectionChange={jest.fn()} />)

    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(screen.getByText(/إجمالي المشاريع/)).toBeInTheDocument()
    })

    // التحقق من وجود جميع البطاقات
    expect(screen.getByText(/المشاريع النشطة/)).toBeInTheDocument()
    expect(screen.getByText(/المنافسات الجارية/)).toBeInTheDocument()
    expect(screen.getByText(/العملاء النشطون/)).toBeInTheDocument()
  })

  it('يتفاعل مع النقر على البطاقات', async () => {
    const mockSectionChange = jest.fn()
    render(<Dashboard onSectionChange={mockSectionChange} />)

    const projectsCard = await screen.findByTestId('projects-card')
    fireEvent.click(projectsCard)

    expect(mockSectionChange).toHaveBeenCalledWith('projects')
  })
})
```

### E2E Tests (Cypress)

#### اختبارات شاملة

```typescript
// cypress/e2e/project-management.cy.ts
describe('إدارة المشاريع', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-testid="sidebar-projects"]').click()
  })

  it('يعرض قائمة المشاريع', () => {
    cy.get('[data-testid="projects-list"]').should('be.visible')
    cy.get('[data-testid="project-card"]').should('have.length.greaterThan', 0)
  })

  it('يمكن إنشاء مشروع جديد', () => {
    cy.get('[data-testid="new-project-button"]').click()
    
    cy.get('[data-testid="project-name-input"]').type('مشروع اختباري جديد')
    cy.get('[data-testid="project-client-input"]').type('عميل اختباري')
    cy.get('[data-testid="project-budget-input"]').type('1000000')
    
    cy.get('[data-testid="save-project-button"]').click()
    
    cy.get('[data-testid="success-message"]').should('contain', 'تم إنشاء المشروع بنجاح')
  })

  it('يمكن تحديث بيانات المشروع', () => {
    cy.get('[data-testid="project-card"]').first().click()
    cy.get('[data-testid="edit-project-button"]').click()
    
    cy.get('[data-testid="project-progress-input"]').clear().type('85')
    cy.get('[data-testid="save-changes-button"]').click()
    
    cy.get('[data-testid="project-progress"]').should('contain', '85%')
  })
})
```

---

## 🚀 النشر والصيانة

### بناء الإنتاج

#### تحسين البناء

```bash
# بناء محسن للإنتاج
npm run build

# تحليل حجم الحزم
npm run analyze

# معاينة البناء
npm run preview
```

#### Webpack Configuration

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@data': resolve(__dirname, './src/data'),
      '@styles': resolve(__dirname, './src/styles')
    }
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['date-fns', 'clsx']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
```

### Docker Configuration

#### Dockerfile

```dockerfile
# الصورة الأساسية
FROM node:18-alpine AS builder

WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./
RUN npm ci --only=production

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# الصورة النهائية
FROM nginx:alpine

# نسخ الملفات المبنية
COPY --from=builder /app/dist /usr/share/nginx/html

# تكوين nginx للـ SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # دعم SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # تحسين التخزين المؤقت
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ضغط الملفات
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

### Monitoring والمراقبة

#### Performance Monitoring

```typescript
// utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }
  
  // قياس وقت تحميل المكونات
  measureComponentLoad(componentName: string) {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`)
      
      // إرسال البيانات لخدمة المراقبة
      this.sendMetrics('component_load_time', {
        component: componentName,
        duration: loadTime
      })
    }
  }
  
  // قياس استجابة واجهة المستخدم
  measureUserInteraction(action: string) {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      this.sendMetrics('user_interaction', {
        action,
        response_time: responseTime
      })
    }
  }
  
  private sendMetrics(event: string, data: any) {
    // إرسال المقاييس لخدمة المراقبة
    if (process.env.NODE_ENV === 'production') {
      // analytics.track(event, data)
    }
  }
}
```

#### Error Tracking

```typescript
// utils/errorTracking.ts
export class ErrorTracker {
  static captureError(error: Error, context?: any) {
    console.error('Application Error:', error)
    
    if (process.env.NODE_ENV === 'production') {
      // إرسال الخطأ لخدمة تتبع الأخطاء
      // Sentry.captureException(error, { extra: context })
    }
  }
  
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console[level]('Application Message:', message)
    
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureMessage(message, level)
    }
  }
}

// Error Boundary
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorTracker.captureError(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              نعتذر عن هذا الخطأ. تم إرسال تقرير للفريق التقني.
            </p>
            <Button onClick={() => window.location.reload()}>
              إعادة تحميل الصفحة
            </Button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

---

## 📝 إرشادات التطوير

### معايير الكود

#### TypeScript Guidelines

```typescript
// استخدام الواجهات بدلاً من الأنواع للكائنات
interface ProjectProps {
  project: Project
  onEdit?: (project: Project) => void
  className?: string
}

// استخدام الأنواع للقيم البسيطة
type ProjectStatus = 'active' | 'completed' | 'delayed' | 'paused' | 'planning'

// استخدام Generic Types للمرونة
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// استخدام Utility Types
type PartialProject = Partial<Project>
type ProjectKeys = keyof Project
type RequiredProjectFields = Pick<Project, 'name' | 'client' | 'status'>
```

#### Component Patterns

```typescript
// نمط المكون المعياري
interface ComponentProps {
  // الخصائص الإلزامية أولاً
  title: string
  data: any[]
  
  // الخصائص الاختيارية
  className?: string
  loading?: boolean
  
  // دوال الاستدعاء
  onItemClick?: (item: any) => void
  onError?: (error: Error) => void
}

export function Component({ 
  title, 
  data, 
  className,
  loading = false,
  onItemClick,
  onError
}: ComponentProps) {
  // Hooks في الأعلى
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // دوال المعالجة
  const handleItemClick = useCallback((item: any) => {
    setSelectedItem(item)
    onItemClick?.(item)
  }, [onItemClick])
  
  // تقديم المحتوى المشروط
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!data.length) {
    return <EmptyState message="لا توجد بيانات" />
  }
  
  // العرض الرئيسي
  return (
    <div className={cn("component-container", className)}>
      <h2>{title}</h2>
      {data.map(item => (
        <ItemCard 
          key={item.id}
          item={item}
          selected={selectedItem?.id === item.id}
          onClick={() => handleItemClick(item)}
        />
      ))}
    </div>
  )
}
```

### Git Workflow

#### Commit Message Convention

```bash
# نوع التغيير: وصف مختصر
feat: إضافة معالج كشف الحساب البنكي
fix: إصلاح مشكلة في حساب الإحصائيات  
docs: تحديث دليل التطوير
style: تحسين تنسيق مكون البطاقات
refactor: إعادة هيكلة مكون المشاريع
test: إضافة اختبارات لمكون العملاء
chore: تحديث التبعيات

# أنواع التغيير:
# feat: ميزة جديدة
# fix: إصلاح خطأ
# docs: تحديث التوثيق
# style: تغييرات في التنسيق
# refactor: إعادة هيكلة الكود
# test: إضافة أو تحديث الاختبارات
# chore: مهام الصيانة
```

#### Branch Strategy

```bash
# الفروع الرئيسية
main          # الإنتاج المستقر
develop       # التطوير النشط
staging       # الاختبار النهائي

# فروع الميزات
feature/bank-statement-analyzer
feature/advanced-charts
feature/excel-import

# فروع الإصلاحات
hotfix/critical-calculation-bug
hotfix/security-vulnerability

# فروع الإصدارات
release/v3.0.0
release/v3.1.0
```

### Code Review Guidelines

#### ما يجب فحصه

1. **الوظيفية**: هل الكود يحقق المطلوب؟
2. **الأداء**: هل هناك تحسينات ممكنة؟
3. **الأمان**: هل هناك ثغرات أمنية؟
4. **التوافق**: هل يتوافق مع معايير المشروع؟
5. **الاختبارات**: هل الاختبارات كافية؟
6. **التوثيق**: هل التوثيق محدث؟

#### قائمة المراجعة

```markdown
## Code Review Checklist

### General
- [ ] الكود يتبع معايير المشروع
- [ ] لا توجد أخطاء في وحدة التحكم
- [ ] الكود محسن للأداء
- [ ] لا توجد تبعيات غير ضرورية

### Components
- [ ] المكونات معرفة بواجهات TypeScript
- [ ] استخدام صحيح للـ Props
- [ ] معالجة صحيحة للحالات الاستثنائية
- [ ] تنظيف مناسب للموارد

### Styling
- [ ] استخدام نظام التصميم المعياري
- [ ] دعم الوضع الليلي
- [ ] دعم RTL
- [ ] تجاوب مع جميع الأحجام

### Testing
- [ ] اختبارات وحدة مكتوبة
- [ ] تغطية كود مناسبة
- [ ] اختبارات تكامل حيث مطلوبة
```

---

## 🔮 خطة التطوير المستقبلية

### الإصدار 3.1.0 (Q2 2024)

#### ميزات جديدة

- **تطبيق PWA**: تحويل النظام لتطبيق ويب تقدمي
- **إشعارات فورية**: نظام إشعارات في الوقت الفعلي
- **التصدير المتقدم**: تصدير PDF مخصص للتقارير
- **API Integration**: تكامل مع أنظمة ERP خارجية

#### تحسينات

- **أداء محسن**: تحسينات إضافية للسرعة
- **UI/UX**: تحسينات واجهة المستخدم
- **إمكانية الوصول**: دعم WCAG 2.1 AA كامل
- **الأمان**: تشفير قاعدة البيانات المحلية

### الإصدار 3.2.0 (Q3 2024)

#### ميزات متقدمة

- **الذكاء الاصطناعي**: تحليل ذكي للبيانات
- **التنبؤ**: توقعات مالية ذكية
- **الأتمتة**: أتمتة المهام الروتينية
- **التكامل السحابي**: مزامنة سحابية اختيارية

#### تحسينات التطوير

- **Micro Frontends**: تقسيم التطبيق لوحدات منفصلة
- **GraphQL**: API موحد للبيانات
- **Web Workers**: معالجة البيانات في الخلفية
- **Service Workers**: تحسين التخزين المؤقت

---

## 📞 الدعم والمساعدة

### الدعم الفني

- **المطورون**: فريق نظام إدارة المقاولات
- **البريد الإلكتروني**: [dev@construction-system.com](mailto:dev@construction-system.com)
- **التوثيق**: [docs.construction-system.com](https://docs.construction-system.com)
- **المجتمع**: [community.construction-system.com](https://community.construction-system.com)

### الإبلاغ عن الأخطاء

1. تحقق من قائمة الأخطاء المعروفة
2. أنشئ Issue جديد مع:
   - وصف تفصيلي للمشكلة
   - خطوات إعادة الإنتاج
   - لقطات شاشة إن أمكن
   - معلومات البيئة (المتصفح، نظام التشغيل)

### طلب الميزات

1. تحقق من خارطة الطريق
2. ناقش الفكرة في المجتمع
3. أنشئ Feature Request مع:
   - وصف الميزة المطلوبة
   - حالة الاستخدام
   - الفائدة المتوقعة

---

**آخر تحديث**: فبراير 2024  
**الإصدار**: 3.0.0  
**المطورون**: فريق نظام إدارة المقاولات

---

**تطوير متقدم للمجتمع العربي** 🚀✨

---
