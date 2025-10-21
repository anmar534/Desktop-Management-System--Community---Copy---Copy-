import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Progress } from '@/presentation/components/ui/progress'
import { Input } from '@/presentation/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import { PageLayout, DetailCard, EmptyState } from '@/presentation/components/layout/PageLayout'
import { ProjectCostAnalyzer } from './components/ProjectCostAnalyzer'
import { Invoices } from './components/Invoices'
import { Budgets } from './components/Budgets'
import { BankAccounts } from './components/BankAccounts'
import { FinancialReports } from './components/FinancialReports'
import {
  formatCurrency,
  formatDateValue,
  formatNumber,
  formatInteger,
  formatPercentage,
  formatTime,
  type CurrencyOptions,
  type NumberFormatOptionsWithLocale,
} from '@/shared/utils/formatters/formatters' // استخدام المنسق الموحد
import {
  type LucideIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  ClipboardList,
  PieChart,
  BarChart3,
  CreditCard,
  Wallet,
  Clock,
  FileText,
  Download,
  Plus,
  Eye,
  Edit,
  Search,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
  Landmark,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFinancialState } from '@/application/context'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { InlineAlert, type InlineAlertVariant } from '@/presentation/components/ui/inline-alert'

const FINANCIAL_TABS = [
  'overview',
  'projects',
  'tenders',
  'invoices',
  'budgets',
  'bank-accounts',
  'reports',
  'cost-analysis',
] as const

const TAB_TO_SECTION: Record<FinancialTabValue, string> = {
  overview: 'financial',
  projects: 'projects',
  tenders: 'tenders',
  invoices: 'invoices',
  budgets: 'budgets',
  'bank-accounts': 'bank-accounts',
  reports: 'financial-reports',
  'cost-analysis': 'financial',
}

export type FinancialTabValue = (typeof FINANCIAL_TABS)[number]

const isFinancialTabValue = (value: string): value is FinancialTabValue =>
  FINANCIAL_TABS.includes(value as FinancialTabValue)

const FINANCIAL_TAB_CONFIG: Record<
  FinancialTabValue,
  { label: string; shortLabel: string; icon: LucideIcon }
> = {
  overview: {
    label: 'نظرة عامة',
    shortLabel: 'عامة',
    icon: BarChart3,
  },
  projects: {
    label: 'المشاريع',
    shortLabel: 'مشاريع',
    icon: ClipboardList,
  },
  tenders: {
    label: 'المنافسات',
    shortLabel: 'منافسات',
    icon: CalendarDays,
  },
  invoices: {
    label: 'الفواتير',
    shortLabel: 'فواتير',
    icon: FileText,
  },
  budgets: {
    label: 'الموازنات',
    shortLabel: 'موازنات',
    icon: PieChart,
  },
  'bank-accounts': {
    label: 'الحسابات البنكية',
    shortLabel: 'حسابات',
    icon: Landmark,
  },
  reports: {
    label: 'التقارير المالية',
    shortLabel: 'تقارير',
    icon: BarChart3,
  },
  'cost-analysis': {
    label: 'تحليل التكاليف',
    shortLabel: 'تحليل',
    icon: Calculator,
  },
}

interface FinancialProps {
  onSectionChange: (section: string) => void
  initialTab?: FinancialTabValue
}

export function Financial({ onSectionChange, initialTab }: FinancialProps) {
  const [activeTab, setActiveTab] = useState<FinancialTabValue>(initialTab ?? 'overview')
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    if (!initialTab) {
      return
    }
    if (initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab, activeTab])

  const DEFAULT_LOCALE: NumberFormatOptionsWithLocale['locale'] = 'ar-SA'

  const formatIntegerValue = useCallback(
    (value: number | string) => formatInteger(value, { locale: DEFAULT_LOCALE }),
    [DEFAULT_LOCALE],
  )

  const formatNumberValue = useCallback(
    (value: number, options?: NumberFormatOptionsWithLocale) =>
      formatNumber(value, { locale: DEFAULT_LOCALE, ...options }),
    [DEFAULT_LOCALE],
  )

  const formatPercentageValue = useCallback(
    (value: number, decimals = 1) => formatPercentage(value, decimals, { locale: DEFAULT_LOCALE }),
    [DEFAULT_LOCALE],
  )

  const formatSignedPercentage = useCallback(
    (value: number, decimals = 1) => {
      const formatted = formatPercentageValue(Math.abs(value), decimals)
      if (value > 0) return `+${formatted}`
      if (value < 0) return `-${formatted}`
      return formatted
    },
    [formatPercentageValue],
  )

  const activateTab = useCallback(
    (value: FinancialTabValue) => {
      setActiveTab(value)
      const targetSection = TAB_TO_SECTION[value]
      if (targetSection) {
        onSectionChange(targetSection)
      }
    },
    [onSectionChange],
  )

  const handleTabValueChange = useCallback(
    (value: string) => {
      if (!isFinancialTabValue(value)) {
        return
      }
      activateTab(value)
    },
    [activateTab],
  )

  const {
    metrics,
    refreshAll,
    isLoading: aggregatedLoading,
    lastRefreshAt,
    invoices: invoicesState,
    budgets: budgetsState,
    reports: reportsState,
    projects: projectsState,
    tenders: tendersState,
    financial: financialState,
    highlights,
    currency,
  } = useFinancialState()

  const { financialData, suppliersData, loading: financialLoading, error } = financialState

  useEffect(() => {
    if (!financialLoading && !hasLoadedOnce) {
      setHasLoadedOnce(true)
    }
  }, [financialLoading, hasLoadedOnce])

  const isLoading = financialLoading || aggregatedLoading
  const showInitialLoader = !hasLoadedOnce && isLoading
  const showRefreshingState = hasLoadedOnce && isLoading

  const baseCurrency = currency?.baseCurrency ?? 'SAR'
  const formatCurrencyValue = useCallback(
    (amount: number, options?: CurrencyOptions) =>
      formatCurrency(amount, {
        currency: baseCurrency,
        ...options,
      }),
    [baseCurrency],
  )

  const lastRefreshLabel = useMemo(
    () => (lastRefreshAt ? ` • آخر تحديث ${formatTime(lastRefreshAt, { locale: 'ar-EG' })}` : ''),
    [lastRefreshAt],
  )

  const currencyRefreshLabel = useMemo(() => {
    if (currency?.lastUpdated) {
      return ` • العملة الأساسية ${baseCurrency} (آخر تحديث ${formatTime(currency.lastUpdated, { locale: 'ar-EG' })})`
    }
    if (currency?.isFallback) {
      return ` • العملة الأساسية ${baseCurrency} (أسعار صرف احتياطية)`
    }
    return ` • العملة الأساسية ${baseCurrency}`
  }, [currency, baseCurrency])

  const topOutstandingInvoices = highlights.outstandingInvoices
  const budgetsAtRisk = highlights.budgetsAtRisk
  const latestReports = highlights.recentReports
  const projectsAtRisk = highlights.projectsAtRisk
  const tendersClosingSoon = highlights.tendersClosingSoon

  const financialAlert = useMemo<{
    variant: InlineAlertVariant
    title: string
    description: string
  } | null>(() => {
    if (budgetsAtRisk.length > 0) {
      const cumulativeOverage = budgetsAtRisk.reduce((sum, budget) => {
        const spent = Number(budget.spentAmount ?? 0)
        const total = Number(budget.totalAmount ?? 0)
        return sum + Math.max(0, spent - total)
      }, 0)
      const criticalBudget = budgetsAtRisk.some(
        (budget) => Number(budget.utilizationPercentage ?? 0) >= 110,
      )
      return {
        variant: criticalBudget ? 'destructive' : 'warning',
        title: 'موازنات تتجاوز الحدود المعتمدة',
        description: `يوجد ${formatIntegerValue(budgetsAtRisk.length)} موازنة تحتاج لتدخل، بإجمالي تجاوز ${formatCurrencyValue(cumulativeOverage)} عن الحدود الموضوعة.`,
      }
    }

    if (topOutstandingInvoices.length > 0) {
      const overdueCount = topOutstandingInvoices.filter(
        (invoice) => invoice.status === 'overdue',
      ).length
      const totalOutstanding = topOutstandingInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total ?? 0),
        0,
      )
      return {
        variant: overdueCount > 0 ? 'warning' : 'info',
        title: 'متابعة الفواتير المفتوحة',
        description: `${formatIntegerValue(topOutstandingInvoices.length)} فاتورة بقيمة ${formatCurrencyValue(totalOutstanding)} بانتظار التحصيل، منها ${formatIntegerValue(overdueCount)} متأخرة.`,
      }
    }

    if (projectsAtRisk.length > 0) {
      return {
        variant: 'warning',
        title: 'مشاريع عالية المخاطر',
        description: `${formatIntegerValue(projectsAtRisk.length)} مشاريع مصنفة عالية المخاطر حالياً. راجع خطط المعالجة قبل اجتماع المتابعة القادم.`,
      }
    }

    if (tendersClosingSoon.length > 0) {
      return {
        variant: 'info',
        title: 'منافسات تقترب من الإغلاق',
        description: `${formatIntegerValue(tendersClosingSoon.length)} منافسات تقترب من المواعيد النهائية. تأكد من اكتمال الملفات قبل الإرسال.`,
      }
    }

    return null
  }, [
    budgetsAtRisk,
    formatCurrencyValue,
    projectsAtRisk.length,
    tendersClosingSoon.length,
    topOutstandingInvoices,
    formatIntegerValue,
  ])

  const handleRefresh = useCallback(async () => {
    await refreshAll()
  }, [refreshAll])

  // الإجراءات السريعة
  const quickActions = useMemo(() => {
    const formatCount = (count: number, loadingState: boolean) =>
      loadingState ? '…' : formatIntegerValue(count)

    return [
      {
        label: 'تحديث البيانات',
        icon: RefreshCw,
        onClick: handleRefresh,
        primary: true,
      },
      {
        label: `الفواتير (${formatCount(metrics.invoices.totalCount, invoicesState.isLoading)})`,
        icon: FileText,
        onClick: () => activateTab('invoices'),
        variant: 'outline' as const,
      },
      {
        label: `المشاريع (${formatCount(metrics.projects.totalCount, projectsState.isLoading)})`,
        icon: BarChart3,
        onClick: () => activateTab('projects'),
        variant: 'outline' as const,
      },
      {
        label: `المنافسات (${formatCount(metrics.tenders.totalCount, tendersState.isLoading)})`,
        icon: CalendarDays,
        onClick: () => activateTab('tenders'),
        variant: 'outline' as const,
      },
      {
        label: 'الحسابات المصرفية',
        icon: CreditCard,
        onClick: () => activateTab('bank-accounts'),
        variant: 'outline' as const,
      },
      {
        label: budgetsState.isLoading
          ? 'إدارة الموازنة (جارٍ التحميل...)'
          : `إدارة الموازنة (متاح ${formatCurrencyValue(metrics.summary.availableBudget)})`,
        icon: PieChart,
        onClick: () => activateTab('budgets'),
        variant: 'outline' as const,
      },
      {
        label: `التقارير المالية (${formatCount(metrics.reports.totalCount, reportsState.isLoading)})`,
        icon: BarChart3,
        onClick: () => activateTab('reports'),
        variant: 'outline' as const,
      },
    ]
  }, [
    handleRefresh,
    activateTab,
    metrics,
    invoicesState.isLoading,
    budgetsState.isLoading,
    reportsState.isLoading,
    projectsState.isLoading,
    tendersState.isLoading,
    formatCurrencyValue,
    formatIntegerValue,
  ])

  const suppliersOutstanding = useMemo(
    () => suppliersData.reduce((sum, supplier) => sum + (supplier.outstandingBalance ?? 0), 0),
    [suppliersData],
  )

  const netProfit = useMemo(
    () => financialData.revenue.total - financialData.expenses.total,
    [financialData.expenses.total, financialData.revenue.total],
  )

  const netProfitStatus: StatusBadgeProps['status'] = netProfit >= 0 ? 'success' : 'warning'
  const netProfitColor = netProfit >= 0 ? 'text-success' : 'text-warning'
  const netProfitBg = netProfit >= 0 ? 'bg-success/10' : 'bg-warning/10'

  const cashFlowNet = useMemo(
    () => financialData.cashFlow.incoming - financialData.cashFlow.outgoing,
    [financialData.cashFlow.incoming, financialData.cashFlow.outgoing],
  )

  const paymentCycleDays = Math.round(financialData.kpis.paymentCycle ?? 0)
  const budgetVariance = financialData.kpis.budgetVariance ?? 0
  const costEfficiencyLabel = formatPercentageValue(financialData.kpis.costEfficiency, 1)
  const revenueGrowthLabel = formatSignedPercentage(financialData.revenue.growth ?? 0, 1)
  const budgetVarianceLabel = formatSignedPercentage(budgetVariance, 1)
  const paymentCycleLabel = `${formatNumberValue(paymentCycleDays, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} يوم`
  const outstandingInvoicesLabel = formatCurrencyValue(metrics.summary.outstandingInvoices)
  const suppliersOutstandingLabel = formatCurrencyValue(suppliersOutstanding)
  const availableBudgetLabel = formatCurrencyValue(metrics.summary.availableBudget)

  const headerMetadata = (
    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
      <StatusBadge
        status="success"
        label="إجمالي الإيرادات"
        value={formatCurrencyValue(financialData.revenue.total)}
        icon={TrendingUp}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={netProfitStatus}
        label="صافي الربح"
        value={formatCurrencyValue(netProfit)}
        icon={DollarSign}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="info"
        label="السيولة الحالية"
        value={formatCurrencyValue(financialData.cashFlow.current)}
        icon={Wallet}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="warning"
        label="مستحقات العملاء"
        value={outstandingInvoicesLabel}
        icon={FileText}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="warning"
        label="مستحقات الموردين"
        value={suppliersOutstandingLabel}
        icon={CreditCard}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={budgetVariance > 0 ? 'warning' : 'success'}
        label="انحراف الموازنة"
        value={budgetVarianceLabel}
        icon={PieChart}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="success"
        label="كفاءة التكلفة"
        value={costEfficiencyLabel}
        icon={BarChart3}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={budgetsAtRisk.length > 0 ? 'warning' : 'success'}
        label="موازنات تحتاج متابعة"
        value={formatIntegerValue(budgetsAtRisk.length)}
        icon={AlertTriangle}
        size="sm"
        className="shadow-none"
      />
    </div>
  )

  const headerSummaryCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <DetailCard
        title="الإيرادات الشهرية"
        value={formatCurrencyValue(financialData.revenue.monthly)}
        subtitle={`من ${formatIntegerValue(financialData.revenue.projects)} مشاريع نشطة`}
        icon={TrendingUp}
        color="text-success"
        bgColor="bg-success/10"
        trend={{
          value: revenueGrowthLabel,
          direction: financialData.revenue.growth >= 0 ? 'up' : 'down',
        }}
      />
      <DetailCard
        title="المصروفات الشهرية"
        value={formatCurrencyValue(financialData.expenses.monthly)}
        subtitle="تشغيلية ومشاريع"
        icon={TrendingDown}
        color="text-destructive"
        bgColor="bg-destructive/10"
      />
      <DetailCard
        title="صافي التدفق النقدي"
        value={formatCurrencyValue(cashFlowNet)}
        subtitle={formatCurrencyValue(financialData.cashFlow.projected ?? cashFlowNet) + ' متوقع'}
        icon={Wallet}
        color={netProfitColor}
        bgColor={netProfitBg}
        trend={{ value: availableBudgetLabel, direction: cashFlowNet >= 0 ? 'up' : 'down' }}
      />
      <DetailCard
        title="دورة التحصيل"
        value={paymentCycleLabel}
        subtitle="متوسط زمن التحصيل"
        icon={Clock}
        color="text-secondary-foreground"
        bgColor="bg-secondary/10"
      />
    </div>
  )

  const headerExtraContent = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card/40 to-background p-5 shadow-sm">
        {headerMetadata}
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-primary/10 backdrop-blur-sm">
        {headerSummaryCards}
      </div>
    </div>
  )
  // عرض حالة التحميل
  if (showInitialLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">جاري تحميل البيانات المالية...</span>
        </div>
      </div>
    )
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 border-destructive">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  type TransactionType = 'revenue' | 'expense'
  type TransactionStatus = 'completed' | 'pending'

  interface FinancialTransaction {
    id: number
    type: TransactionType
    description: string
    amount: number
    date: string
    status: TransactionStatus
  }

  // بيانات وهمية للمعاملات المالية
  const recentTransactions: FinancialTransaction[] = [
    {
      id: 1,
      type: 'revenue',
      description: 'دفعة مشروع برج الأعمال',
      amount: 750000,
      date: '2024-02-15',
      status: 'completed',
    },
    {
      id: 2,
      type: 'expense',
      description: 'شراء معدات إنشائية',
      amount: -180000,
      date: '2024-02-14',
      status: 'completed',
    },
    {
      id: 3,
      type: 'revenue',
      description: 'دفعة منافسة المجمع السكني',
      amount: 950000,
      date: '2024-02-13',
      status: 'pending',
    },
    {
      id: 4,
      type: 'expense',
      description: 'رواتب العمالة - فبراير',
      amount: -320000,
      date: '2024-02-12',
      status: 'completed',
    },
    {
      id: 5,
      type: 'revenue',
      description: 'دفعة مشروع الطريق السريع',
      amount: 1200000,
      date: '2024-02-11',
      status: 'completed',
    },
    {
      id: 6,
      type: 'expense',
      description: 'صيانة المعدات',
      amount: -85000,
      date: '2024-02-10',
      status: 'completed',
    },
  ]

  const projectItems = projectsState.projects ?? []
  const tenderItems = tendersState.tenders ?? []
  const displayedProjects = projectItems.slice(0, 8)
  const displayedTenders = tenderItems.slice(0, 8)

  type FinancialBadgeStatus = StatusBadgeProps['status']

  const resolveTransactionStatusBadge = (
    status: TransactionStatus,
  ): { status: FinancialBadgeStatus; label: string } =>
    status === 'completed'
      ? { status: 'success', label: 'مكتملة' }
      : { status: 'warning', label: 'معلقة' }

  const resolveSupplierStatusBadge = (
    status: string,
  ): { status: FinancialBadgeStatus; label: string } =>
    status === 'active'
      ? { status: 'success', label: 'نشط' }
      : { status: 'default', label: 'غير نشط' }

  const resolveInvoiceStatusBadge = (
    status: string,
  ): { status: FinancialBadgeStatus; label: string } => {
    switch (status) {
      case 'draft':
        return { status: 'default', label: 'مسودة' }
      case 'sent':
        return { status: 'info', label: 'مرسلة' }
      case 'paid':
        return { status: 'success', label: 'مدفوعة' }
      case 'overdue':
        return { status: 'overdue', label: 'متأخرة' }
      default:
        return { status: 'default', label: 'غير محددة' }
    }
  }

  const resolveBudgetUtilizationBadge = (
    utilization: number,
  ): { status: FinancialBadgeStatus; label: string } => {
    const label = formatPercentageValue(utilization, 0)
    if (utilization >= 110) {
      return { status: 'overBudget', label }
    }
    if (utilization >= 95) {
      return { status: 'nearBudget', label }
    }
    return { status: 'onBudget', label }
  }

  const resolveProjectRiskBadge = (
    health: string,
  ): { status: FinancialBadgeStatus; label: string } =>
    health === 'red'
      ? { status: 'overdue', label: 'حرجة' }
      : { status: 'warning', label: 'عالية المخاطر' }

  const resolveTenderDeadlineBadge = (
    daysLeft: number | null | undefined,
  ): { status: FinancialBadgeStatus; label: string } => {
    if (daysLeft === null || daysLeft === undefined) {
      return { status: 'default', label: 'غير محدد' }
    }
    if (daysLeft <= 0) {
      return { status: 'overdue', label: 'منتهية' }
    }
    if (daysLeft <= 3) {
      return { status: 'warning', label: `${formatIntegerValue(daysLeft)} يوم` }
    }
    return { status: 'info', label: `${formatIntegerValue(daysLeft)} يوم` }
  }

  const resolveProjectStatusBadge = (
    status: string,
  ): { status: FinancialBadgeStatus; label: string } => {
    switch (status) {
      case 'active':
        return { status: 'info', label: 'نشط' }
      case 'completed':
        return { status: 'success', label: 'مكتمل' }
      case 'delayed':
        return { status: 'warning', label: 'متأخر' }
      case 'paused':
        return { status: 'default', label: 'متوقف' }
      case 'planning':
        return { status: 'info', label: 'قيد التخطيط' }
      default:
        return { status: 'default', label: 'غير محدد' }
    }
  }

  const resolveTenderStatusBadge = (
    status: string,
  ): { status: FinancialBadgeStatus; label: string } => {
    switch (status) {
      case 'new':
        return { status: 'info', label: 'جديدة' }
      case 'under_action':
        return { status: 'info', label: 'تحت الإجراء' }
      case 'ready_to_submit':
        return { status: 'success', label: 'جاهزة للتقديم' }
      case 'submitted':
        return { status: 'info', label: 'مقدمة' }
      case 'won':
        return { status: 'success', label: 'فائزة' }
      case 'lost':
        return { status: 'overdue', label: 'خاسرة' }
      case 'expired':
        return { status: 'overdue', label: 'منتهية' }
      case 'cancelled':
        return { status: 'default', label: 'ملغاة' }
      default:
        return { status: 'default', label: 'غير محددة' }
    }
  }

  const resolveReportStatusBadge = (
    status: string,
  ): { status: FinancialBadgeStatus; label: string } => {
    switch (status) {
      case 'completed':
        return { status: 'success', label: 'مكتمل' }
      case 'generating':
        return { status: 'info', label: 'جاري التوليد' }
      case 'failed':
        return { status: 'error', label: 'فشل' }
      default:
        return { status: 'warning', label: 'قيد الانتظار' }
    }
  }

  const getTransactionIcon = (type: TransactionType) => {
    return type === 'revenue' ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" />
    )
  }

  const TransactionCard = ({
    transaction,
    index,
  }: {
    transaction: FinancialTransaction
    index: number
  }) => {
    const statusInfo = resolveTransactionStatusBadge(transaction.status)
    const isRevenue = transaction.type === 'revenue'

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {transaction.description}
                  </h4>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${isRevenue ? 'text-success' : 'text-destructive'}`}
                >
                  {isRevenue ? '+' : ''}
                  {formatCurrencyValue(Math.abs(transaction.amount))}
                </div>
                <StatusBadge
                  status={statusInfo.status}
                  label={statusInfo.label}
                  size="sm"
                  showIcon={false}
                  className="shadow-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {isRevenue ? 'إيراد' : 'مصروف'} • {formatIntegerValue(transaction.id)}#
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <PageLayout
      tone="primary"
      title="الإدارة المالية"
      description={`متابعة وإدارة الوضع المالي والتدفقات النقدية${lastRefreshLabel}${currencyRefreshLabel}`}
      icon={DollarSign}
      quickStats={[]}
      quickActions={quickActions}
      showSearch={false}
      headerExtra={headerExtraContent}
    >
      {showRefreshingState && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>يتم تحديث البيانات المالية في الخلفية...</span>
        </div>
      )}
      {/* نظام التبويبات المحسّن */}
      <Tabs value={activeTab} onValueChange={handleTabValueChange} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 mb-6">
          {FINANCIAL_TABS.map((tabKey) => {
            const { label, shortLabel, icon: Icon } = FINANCIAL_TAB_CONFIG[tabKey]
            return (
              <TabsTrigger key={tabKey} value={tabKey} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {financialAlert && (
          <div className="mb-6">
            <InlineAlert
              variant={financialAlert.variant}
              title={financialAlert.title}
              description={financialAlert.description}
            />
          </div>
        )}

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* العمود الأيسر - الملخص المالي */}
            <div className="lg:col-span-2 space-y-6">
              {/* تفاصيل الإيرادات والمصروفات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* بطاقة الإيرادات */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      تفصيل الإيرادات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">من المشاريع</span>
                      <span className="font-bold text-success">
                        {formatCurrencyValue(financialData.revenue.total * 0.85)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">من المنافسات</span>
                      <span className="font-bold text-primary">
                        {formatCurrencyValue(financialData.revenue.total * 0.15)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">النمو الشهري</span>
                        <span className="font-bold text-success">
                          {formatSignedPercentage(financialData.revenue.growth, 1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* بطاقة المصروفات */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      تفصيل المصروفات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">تشغيلية</span>
                      <span className="font-bold text-destructive">
                        {formatCurrencyValue(financialData.expenses.operational)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">مشاريع</span>
                      <span className="font-bold text-warning">
                        {formatCurrencyValue(financialData.expenses.projects)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">إدارية</span>
                      <span className="font-bold text-secondary-foreground">
                        {formatCurrencyValue(financialData.expenses.overhead)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إدارة الموردين */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    إدارة الموردين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="البحث في الموردين..." className="pr-10" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="التصنيف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع التصنيفات</SelectItem>
                          <SelectItem value="materials">مواد البناء</SelectItem>
                          <SelectItem value="equipment">معدات</SelectItem>
                          <SelectItem value="services">خدمات</SelectItem>
                          <SelectItem value="logistics">لوجستيات</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الحالات</SelectItem>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr className="text-right">
                          <th className="pb-3 font-semibold">المورد</th>
                          <th className="pb-3 font-semibold">التصنيف</th>
                          <th className="pb-3 font-semibold">إجمالي المشتريات</th>
                          <th className="pb-3 font-semibold">المستحقات</th>
                          <th className="pb-3 font-semibold">التقييم</th>
                          <th className="pb-3 font-semibold">الحالة</th>
                          <th className="pb-3 font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliersData.map((supplier, index) => (
                          <motion.tr
                            key={supplier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-border hover:bg-muted/50"
                          >
                            <td className="py-4">
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {supplier.contact}
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <StatusBadge
                                status="info"
                                label={supplier.category}
                                size="sm"
                                showIcon={false}
                                className="shadow-none"
                              />
                            </td>
                            <td className="py-4 font-medium">
                              {formatCurrencyValue(supplier.totalPurchases)}
                            </td>
                            <td className="py-4">
                              <span
                                className={
                                  supplier.outstandingBalance > 0
                                    ? 'text-warning font-medium'
                                    : 'text-success'
                                }
                              >
                                {formatCurrencyValue(supplier.outstandingBalance)}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-xs ${i < Math.floor(supplier.rating) ? 'text-warning' : 'text-muted-foreground'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatNumberValue(supplier.rating, {
                                    locale: DEFAULT_LOCALE,
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="py-4">
                              {(() => {
                                const { status, label } = resolveSupplierStatusBadge(
                                  supplier.status,
                                )
                                return (
                                  <StatusBadge
                                    status={status}
                                    label={label}
                                    size="sm"
                                    showIcon={false}
                                    className="shadow-none"
                                  />
                                )
                              })()}
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      عرض {formatIntegerValue(suppliersData.length)} من{' '}
                      {formatIntegerValue(suppliersData.length)} مورد
                    </div>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة مورد جديد
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* المعاملات الحديثة */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    المعاملات المالية الحديثة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.slice(0, 4).map((transaction, index) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        index={index}
                      />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    عرض جميع المعاملات
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* العمود الأيمن - المؤشرات والتحليلات */}
            <div className="space-y-6">
              {/* الفواتير غير المسددة */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-warning" />
                    الفواتير غير المسددة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topOutstandingInvoices.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="لا توجد فواتير مفتوحة"
                      description="كل الفواتير مسددة حالياً. سنقوم بتنبيهك عند ظهور فواتير جديدة."
                    />
                  ) : (
                    topOutstandingInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                          </div>
                          {(() => {
                            const { status, label } = resolveInvoiceStatusBadge(invoice.status)
                            return (
                              <StatusBadge
                                status={status}
                                label={label}
                                size="sm"
                                showIcon={false}
                                className="shadow-none"
                              />
                            )
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            تاريخ الاستحقاق:{' '}
                            {formatDateValue(invoice.dueDate ?? invoice.issueDate, {
                              locale: 'ar-EG',
                            })}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrencyValue(invoice.total)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSectionChange('invoices')}
                  >
                    إدارة الفواتير
                  </Button>
                </CardContent>
              </Card>

              {/* الموازنات المتجاوزة */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-destructive" />
                    موازنات بحاجة لمتابعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {budgetsAtRisk.length === 0 ? (
                    <EmptyState
                      icon={PieChart}
                      title="كل الموازنات تحت السيطرة"
                      description="لا توجد موازنات متجاوزة حالياً. راقب الأداء هنا وسيظهر أي إنذار مباشرة."
                    />
                  ) : (
                    budgetsAtRisk.map((budget) => (
                      <div
                        key={budget.id}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{budget.name}</p>
                            <p className="text-xs text-muted-foreground">
                              القسم: {budget.department}
                            </p>
                          </div>
                          {(() => {
                            const { status, label } = resolveBudgetUtilizationBadge(
                              budget.utilizationPercentage,
                            )
                            return (
                              <StatusBadge
                                status={status}
                                label={label}
                                size="sm"
                                showIcon={false}
                                className="shadow-none"
                              />
                            )
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>المخصص: {formatCurrencyValue(budget.totalAmount)}</span>
                          <span className="font-medium text-destructive">
                            المصروف: {formatCurrencyValue(budget.spentAmount)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSectionChange('budgets')}
                  >
                    إدارة الموازنات
                  </Button>
                </CardContent>
              </Card>

              {/* المشاريع عالية المخاطر */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    مشاريع بحاجة لمتابعة عاجلة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectsAtRisk.length === 0 ? (
                    <EmptyState
                      icon={AlertTriangle}
                      title="لا توجد مشاريع عالية المخاطر"
                      description="المشاريع تسير ضمن الحدود الآمنة حالياً. تابع التحذيرات هنا دائماً."
                    />
                  ) : (
                    projectsAtRisk.map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              المدير: {project.manager}
                            </p>
                          </div>
                          {(() => {
                            const { status, label } = resolveProjectRiskBadge(project.health)
                            return (
                              <StatusBadge
                                status={status}
                                label={label}
                                size="sm"
                                showIcon={false}
                                className="shadow-none"
                              />
                            )
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>نسبة الإنجاز: {formatPercentageValue(project.progress, 0)}</span>
                          <span className="font-medium text-foreground">
                            قيمة العقد: {formatCurrencyValue(project.contractValue)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSectionChange('projects')}
                  >
                    إدارة المشاريع
                  </Button>
                </CardContent>
              </Card>

              {/* المنافسات التي تقترب مواعيدها */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-accent" />
                    منافسات تقترب مواعيدها النهائية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tendersClosingSoon.length === 0 ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="لا توجد مواعيد نهائية قريبة"
                      description="كل المنافسات بعيدة عن موعد التسليم. ستظهر هنا أي منافسة تحتاج انتباهاً."
                    />
                  ) : (
                    tendersClosingSoon.map((tender) => {
                      const deadline = tender.deadline ? new Date(tender.deadline) : null
                      const daysLeft = Number.isFinite(tender.daysLeft)
                        ? Number(tender.daysLeft)
                        : deadline
                          ? Math.max(
                              0,
                              Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                            )
                          : null

                      return (
                        <div
                          key={tender.id}
                          className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{tender.name}</p>
                              <p className="text-xs text-muted-foreground">
                                العميل: {tender.client}
                              </p>
                            </div>
                            {(() => {
                              const { status, label } = resolveTenderDeadlineBadge(daysLeft)
                              return (
                                <StatusBadge
                                  status={status}
                                  label={label}
                                  size="sm"
                                  showIcon={false}
                                  className="shadow-none"
                                />
                              )
                            })()}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              الحالة:{' '}
                              {tender.status === 'ready_to_submit'
                                ? 'جاهزة للتقديم'
                                : tender.status === 'submitted'
                                  ? 'تم التقديم'
                                  : 'قيد الإعداد'}
                            </span>
                            <span className="font-medium text-foreground">
                              قيمة متوقعة: {formatCurrencyValue(tender.value ?? 0)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSectionChange('tenders')}
                  >
                    إدارة المنافسات
                  </Button>
                </CardContent>
              </Card>

              {/* حالة التقارير المالية */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-info" />
                    حالة التقارير المالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestReports.length === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="لا توجد تقارير مالية بعد"
                      description="أنشئ تقريراً جديداً لمتابعة الأداء المالي والتشغيلي."
                      actionLabel="إنشاء تقرير"
                      onAction={() => onSectionChange('financial-reports')}
                    />
                  ) : (
                    latestReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{report.name}</p>
                          {(() => {
                            const { status, label } = resolveReportStatusBadge(report.status)
                            return (
                              <StatusBadge
                                status={status}
                                label={label}
                                size="sm"
                                showIcon={false}
                                className="shadow-none"
                              />
                            )
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>النوع: {report.type}</span>
                          <span>
                            أنشئ في {formatDateValue(report.createdAt, { locale: 'ar-EG' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSectionChange('financial-reports')}
                  >
                    إدارة التقارير المالية
                  </Button>
                </CardContent>
              </Card>

              {/* مؤشرات الأداء المالي */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-secondary-foreground" />
                    مؤشرات الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">هامش الربح الإجمالي</span>
                      <span className="font-medium">
                        {formatPercentageValue(financialData.profitability.gross, 1)}
                      </span>
                    </div>
                    <Progress value={financialData.profitability.gross} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">هامش الربح الصافي</span>
                      <span className="font-medium">
                        {formatPercentageValue(financialData.profitability.net, 1)}
                      </span>
                    </div>
                    <Progress value={financialData.profitability.net} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">كفاءة التكلفة</span>
                      <span className="font-medium">
                        {formatPercentageValue(financialData.kpis.costEfficiency, 1)}
                      </span>
                    </div>
                    <Progress value={financialData.kpis.costEfficiency} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">عائد الاستثمار</span>
                      <span className="font-medium">
                        {formatPercentageValue(financialData.profitability.roi, 1)}
                      </span>
                    </div>
                    <Progress value={financialData.profitability.roi} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* حالة التدفق النقدي */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-success" />
                    التدفق النقدي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      {formatCurrencyValue(financialData.cashFlow.current)}
                    </div>
                    <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">متوقع الوصول</span>
                      <span className="font-medium text-success">
                        {formatCurrencyValue(financialData.cashFlow.incoming)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">متوقع الصرف</span>
                      <span className="font-medium text-destructive">
                        {formatCurrencyValue(financialData.cashFlow.outgoing)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="text-sm font-medium">التوقع النهائي</span>
                      <span className="font-bold text-primary">
                        {formatCurrencyValue(financialData.cashFlow.projected)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* المطلوبات */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    المطلوبات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">متأخرة</span>
                    <span className="font-bold text-destructive">
                      {formatCurrencyValue(financialData.receivables.overdue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">حالية</span>
                    <span className="font-bold text-primary">
                      {formatCurrencyValue(financialData.receivables.current)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">قادمة</span>
                    <span className="font-bold text-success">
                      {formatCurrencyValue(financialData.receivables.upcoming)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* إجراءات سريعة */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calculator className="h-4 w-4 ml-2" />
                    حاسبة الربحية
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <PieChart className="h-4 w-4 ml-2" />
                    تحليل التكاليف
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 ml-2" />
                    تصدير البيانات
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">المشاريع النشطة</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatIntegerValue(metrics.projects.activeCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    من {formatIntegerValue(metrics.projects.totalCount)} مشروعاً
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">متوسط التقدم</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatPercentageValue(metrics.projects.averageProgress, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatIntegerValue(metrics.projects.onTrackCount)} مشاريع على المسار الصحيح
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">قيمة العقود</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrencyValue(metrics.projects.totalContractValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">تشمل جميع المشاريع النشطة</div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">الربح المتوقع</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrencyValue(metrics.projects.totalExpectedProfit)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatIntegerValue(metrics.projects.criticalCount)} مشاريع بحاجة لعناية خاصة
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  قائمة المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectsState.isLoading ? (
                  <div className="text-sm text-muted-foreground">جارٍ تحميل بيانات المشاريع...</div>
                ) : projectItems.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="لا توجد مشاريع مسجلة"
                    description="ابدأ بإضافة مشروع جديد لمتابعة التنفيذ والعقود."
                    actionLabel="إضافة مشروع"
                    onAction={() => onSectionChange('projects')}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border text-right">
                        <tr>
                          <th className="pb-3 font-semibold">المشروع</th>
                          <th className="pb-3 font-semibold">الحالة</th>
                          <th className="pb-3 font-semibold">التقدم</th>
                          <th className="pb-3 font-semibold">قيمة العقد</th>
                          <th className="pb-3 font-semibold">الصحة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedProjects.map((project) => (
                          <tr key={project.id} className="border-b border-border hover:bg-muted/40">
                            <td className="py-3">
                              <div className="font-medium text-foreground">{project.name}</div>
                              <div className="text-xs text-muted-foreground">
                                العميل: {project.client ?? 'غير محدد'} • المدير:{' '}
                                {project.manager ?? '—'}
                              </div>
                            </td>
                            <td className="py-3">
                              {(() => {
                                const { status, label } = resolveProjectStatusBadge(project.status)
                                return (
                                  <StatusBadge
                                    status={status}
                                    label={label}
                                    size="sm"
                                    showIcon={false}
                                    className="shadow-none"
                                  />
                                )
                              })()}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-24">
                                  <Progress
                                    value={Math.min(
                                      100,
                                      Math.max(0, Number(project.progress ?? 0)),
                                    )}
                                    className="h-2"
                                  />
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                  {formatPercentageValue(Number(project.progress ?? 0), 0)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 font-medium text-foreground text-right">
                              {formatCurrencyValue(
                                Number(project.contractValue ?? project.value ?? 0),
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {(() => {
                                const { status, label } = resolveProjectRiskBadge(project.health)
                                return (
                                  <StatusBadge
                                    status={status}
                                    label={label}
                                    size="sm"
                                    showIcon={false}
                                    className="shadow-none"
                                  />
                                )
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {projectItems.length > 0 && !projectsState.isLoading && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      عرض {formatIntegerValue(displayedProjects.length)} من{' '}
                      {formatIntegerValue(projectItems.length)} مشروعاً
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSectionChange('projects')}
                      className="gap-2"
                    >
                      <ClipboardList className="h-4 w-4" />
                      الانتقال إلى إدارة المشاريع
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenders">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">المنافسات النشطة</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatIntegerValue(metrics.tenders.activeCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    من {formatIntegerValue(metrics.tenders.totalCount)} منافسة إجمالاً
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">مواعيد قريبة</div>
                  <div className="text-2xl font-bold text-warning mt-1">
                    {formatIntegerValue(metrics.tenders.upcomingDeadlines)}
                  </div>
                  <div className="text-xs text-muted-foreground">خلال الأسبوع القادم</div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">العروض المقدمة</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatIntegerValue(metrics.tenders.submittedCount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatIntegerValue(metrics.tenders.wonCount)} منافسات فائزة حتى الآن
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">متوسط فرص الفوز</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatPercentageValue(metrics.tenders.averageWinChance, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    أداء فرق التسعير خلال الفترة الحالية
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  سجل المنافسات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tendersState.isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    جارٍ تحميل بيانات المنافسات...
                  </div>
                ) : tenderItems.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="لا توجد منافسات مسجلة"
                    description="أضف منافسة جديدة لمتابعة حالة التسعير والمواعيد."
                    actionLabel="إضافة منافسة"
                    onAction={() => onSectionChange('tenders')}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border text-right">
                        <tr>
                          <th className="pb-3 font-semibold">المنافسة</th>
                          <th className="pb-3 font-semibold">الحالة</th>
                          <th className="pb-3 font-semibold">الموعد النهائي</th>
                          <th className="pb-3 font-semibold">القيمة التقديرية</th>
                          <th className="pb-3 font-semibold">فرصة الفوز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTenders.map((tender) => {
                          const deadlineLabel = formatDateValue(
                            tender.deadline ?? tender.submissionDate,
                            { locale: 'ar-EG' },
                          )
                          const winChanceValue = Number(
                            tender.winChance ?? tender.completionPercentage ?? 0,
                          )
                          return (
                            <tr
                              key={tender.id}
                              className="border-b border-border hover:bg-muted/40"
                            >
                              <td className="py-3">
                                <div className="font-medium text-foreground">{tender.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  العميل: {tender.client ?? 'غير محدد'}
                                </div>
                              </td>
                              <td className="py-3">
                                {(() => {
                                  const { status, label } = resolveTenderStatusBadge(tender.status)
                                  return (
                                    <StatusBadge
                                      status={status}
                                      label={label}
                                      size="sm"
                                      showIcon={false}
                                      className="shadow-none"
                                    />
                                  )
                                })()}
                              </td>
                              <td className="py-3">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-sm font-medium text-foreground">
                                    {deadlineLabel}
                                  </span>
                                  {(() => {
                                    const { status, label } = resolveTenderDeadlineBadge(
                                      tender.daysLeft,
                                    )
                                    return (
                                      <StatusBadge
                                        status={status}
                                        label={label}
                                        size="sm"
                                        showIcon={false}
                                        className="shadow-none"
                                      />
                                    )
                                  })()}
                                </div>
                              </td>
                              <td className="py-3 font-medium text-foreground text-right">
                                {formatCurrencyValue(
                                  Number(tender.value ?? tender.totalValue ?? 0),
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-3 justify-end">
                                  <div className="w-24">
                                    <Progress
                                      value={Math.min(100, Math.max(0, winChanceValue))}
                                      className="h-2"
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">
                                    {formatPercentageValue(winChanceValue, 0)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {tenderItems.length > 0 && !tendersState.isLoading && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      عرض {formatIntegerValue(displayedTenders.length)} من{' '}
                      {formatIntegerValue(tenderItems.length)} منافسة
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSectionChange('tenders')}
                      className="gap-2"
                    >
                      <CalendarDays className="h-4 w-4" />
                      الانتقال إلى إدارة المنافسات
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-info" />
                  تحليلات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>معدل الفوز:</span>
                  <span className="font-medium text-foreground">
                    {formatPercentageValue(
                      metrics.tenders.performance.winRate ?? metrics.tenders.averageWinChance,
                      0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>قيمة العروض المقدمة:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyValue(metrics.tenders.performance.submittedValue ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>قيمة العروض الفائزة:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyValue(metrics.tenders.performance.wonValue ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط مدة الدورة:</span>
                  <span className="font-medium text-foreground">
                    {metrics.tenders.performance.averageCycleDays
                      ? `${formatNumberValue(metrics.tenders.performance.averageCycleDays, {
                          locale: DEFAULT_LOCALE,
                          maximumFractionDigits: 0,
                        })} يوم`
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الفواتير */}
        <TabsContent value="invoices">
          <Invoices onSectionChange={onSectionChange} />
        </TabsContent>

        {/* تبويب الموازنات */}
        <TabsContent value="budgets">
          <Budgets onSectionChange={onSectionChange} />
        </TabsContent>

        {/* تبويب الحسابات البنكية */}
        <TabsContent value="bank-accounts">
          <BankAccounts onSectionChange={onSectionChange} />
        </TabsContent>

        {/* تبويب التقارير المالية */}
        <TabsContent value="reports">
          <FinancialReports onSectionChange={onSectionChange} />
        </TabsContent>

        {/* تبويب تحليل التكاليف */}
        <TabsContent value="cost-analysis">
          <ProjectCostAnalyzer />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}

export default Financial

