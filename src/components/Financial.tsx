import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import { ProjectCostAnalyzer } from './ProjectCostAnalyzer'
import { Invoices } from './Invoices'
import { Budgets } from './Budgets'
import { BankAccounts } from './BankAccounts'
import { FinancialReports } from './FinancialReports'
import { formatCurrency, formatDateValue, formatTime, type CurrencyOptions } from '../utils/formatters' // استخدام المنسق الموحد
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
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
 
interface FinancialProps {
  onSectionChange: (section: string) => void
}

export function Financial({ onSectionChange }: FinancialProps) {
  const [searchTerm, setSearchTerm] = useState('')

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
  const isLoading = financialLoading || aggregatedLoading

  const baseCurrency = currency?.baseCurrency ?? 'SAR'
  const formatCurrencyValue = useCallback(
    (amount: number, options?: CurrencyOptions) =>
      formatCurrency(amount, {
        currency: baseCurrency,
        ...options,
      }),
    [baseCurrency]
  )

  const lastRefreshLabel = useMemo(() => (
    lastRefreshAt ? ` • آخر تحديث ${formatTime(lastRefreshAt, { locale: 'ar-EG' })}` : ''
  ), [lastRefreshAt])

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

  const handleRefresh = useCallback(async () => {
    await refreshAll()
  }, [refreshAll])

  const quickStats = useMemo(() => {
    const suppliersOutstanding = suppliersData.reduce((sum, supplier) => sum + supplier.outstandingBalance, 0)

    return [
      {
        label: 'إجمالي الإيرادات',
        value: formatCurrencyValue(financialData.revenue.total),
        trend: 'up' as const,
        trendValue: `+${financialData.revenue.growth}%`,
        color: 'text-success',
        bgColor: 'bg-success/10'
      },
      {
        label: 'صافي الربح',
        value: formatCurrencyValue(financialData.revenue.total - financialData.expenses.total),
        trend: 'up' as const,
        trendValue: '+8.2%',
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      },
      {
        label: 'السيولة النقدية',
        value: formatCurrencyValue(financialData.cashFlow.current),
        trend: 'up' as const,
        trendValue: '+15.3%',
        color: 'text-secondary-foreground',
        bgColor: 'bg-secondary/10'
      },
      {
        label: 'المستحقات المفتوحة',
        value: formatCurrencyValue(metrics.summary.outstandingInvoices),
        trend: metrics.summary.outstandingInvoices > 0 ? ('down' as const) : ('up' as const),
        trendValue: metrics.summary.outstandingInvoices > 0 ? '-3.8%' : '+0%',
        color: 'text-warning',
        bgColor: 'bg-warning/10'
      },
      {
        label: 'الموازنة المتاحة',
        value: formatCurrencyValue(metrics.summary.availableBudget),
        trend: 'up' as const,
        trendValue: '+1.5%',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        label: 'كفاءة التكلفة',
        value: `${financialData.kpis.costEfficiency.toFixed(1)}%`,
        trend: 'up' as const,
        trendValue: '+1.5%',
        color: 'text-success',
        bgColor: 'bg-success/10'
      },
      {
        label: 'مستحقات الموردين',
        value: formatCurrencyValue(suppliersOutstanding),
        trend: 'down' as const,
        trendValue: '-5.2%',
        color: 'text-warning',
        bgColor: 'bg-warning/10'
      },
      {
        label: 'تقارير قيد التوليد',
        value: metrics.reports.generatingCount.toString(),
        trend: metrics.reports.generatingCount > 0 ? ('up' as const) : ('down' as const),
        trendValue: metrics.reports.generatingCount > 0 ? '+1' : '0',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        label: 'مشاريع تحت التنفيذ',
        value: metrics.projects.activeCount.toString(),
        trend: metrics.projects.activeCount === 0 || metrics.projects.onTrackCount >= metrics.projects.activeCount ? ('up' as const) : ('down' as const),
        trendValue: metrics.projects.activeCount === 0 ? 'لا مشاريع نشطة' : `${metrics.projects.onTrackCount}/${metrics.projects.activeCount} على المسار`,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      },
      {
        label: 'منافسات نشطة',
        value: metrics.tenders.activeCount.toString(),
        trend: metrics.tenders.upcomingDeadlines > 0 ? ('down' as const) : ('up' as const),
        trendValue: metrics.tenders.upcomingDeadlines > 0 ? `${metrics.tenders.upcomingDeadlines} خلال 14 يوماً` : 'لا مواعيد قريبة',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ]
  }, [financialData, suppliersData, metrics, formatCurrencyValue])

  // الإجراءات السريعة
  const quickActions = useMemo(() => {
    const formatCount = (count: number, loadingState: boolean) => (loadingState ? '…' : count.toString())

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
        onClick: () => onSectionChange('invoices'),
        variant: 'outline' as const,
      },
      {
        label: `المشاريع (${formatCount(metrics.projects.totalCount, projectsState.isLoading)})`,
        icon: BarChart3,
        onClick: () => onSectionChange('projects'),
        variant: 'outline' as const,
      },
      {
        label: `المنافسات (${formatCount(metrics.tenders.totalCount, tendersState.isLoading)})`,
        icon: CalendarDays,
        onClick: () => onSectionChange('tenders'),
        variant: 'outline' as const,
      },
      {
        label: 'الحسابات المصرفية',
        icon: CreditCard,
        onClick: () => onSectionChange('bank-accounts'),
        variant: 'outline' as const,
      },
      {
        label: budgetsState.isLoading
          ? 'إدارة الموازنة (جارٍ التحميل...)'
          : `إدارة الموازنة (متاح ${formatCurrencyValue(metrics.summary.availableBudget)})`,
        icon: PieChart,
        onClick: () => onSectionChange('budgets'),
        variant: 'outline' as const,
      },
      {
        label: `التقارير المالية (${formatCount(metrics.reports.totalCount, reportsState.isLoading)})`,
        icon: BarChart3,
        onClick: () => onSectionChange('financial-reports'),
        variant: 'outline' as const,
      },
    ]
  }, [handleRefresh, metrics, invoicesState.isLoading, budgetsState.isLoading, reportsState.isLoading, projectsState.isLoading, tendersState.isLoading, onSectionChange, formatCurrencyValue])

  // عرض حالة التحميل
  if (isLoading) {
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

  // بطاقات التحليل المالي السريع
  const FinancialAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="الإيرادات الشهرية"
        value={formatCurrencyValue(financialData.revenue.monthly)}
        subtitle={`من ${financialData.revenue.projects} مشاريع`}
        icon={TrendingUp}
        color="text-success"
        bgColor="bg-success/10"
        trend={{ value: `+${financialData.revenue.growth}%`, direction: 'up' }}
      />
      <DetailCard
        title="المصروفات الشهرية"
        value={formatCurrencyValue(financialData.expenses.monthly)}
        subtitle="تشغيلية ومشاريع"
        icon={TrendingDown}
        color="text-destructive"
        bgColor="bg-destructive/10"
        trend={{ value: '-2.8%', direction: 'down' }}
      />
      <DetailCard
        title="التدفق النقدي"
        value={formatCurrencyValue(financialData.cashFlow.incoming - financialData.cashFlow.outgoing)}
        subtitle="صافي التدفق"
        icon={Wallet}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: '+12.5%', direction: 'up' }}
      />
      <DetailCard
        title="دورة الدفع"
        value={`${financialData.kpis.paymentCycle} يوم`}
        subtitle="متوسط التحصيل"
        icon={Clock}
        color="text-secondary-foreground"
        bgColor="bg-secondary/10"
        trend={{ value: '-3 أيام', direction: 'down' }}
      />
    </div>
  )

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
    { id: 1, type: 'revenue', description: 'دفعة مشروع برج الأعمال', amount: 750000, date: '2024-02-15', status: 'completed' },
    { id: 2, type: 'expense', description: 'شراء معدات إنشائية', amount: -180000, date: '2024-02-14', status: 'completed' },
    { id: 3, type: 'revenue', description: 'دفعة منافسة المجمع السكني', amount: 950000, date: '2024-02-13', status: 'pending' },
    { id: 4, type: 'expense', description: 'رواتب العمالة - فبراير', amount: -320000, date: '2024-02-12', status: 'completed' },
    { id: 5, type: 'revenue', description: 'دفعة مشروع الطريق السريع', amount: 1200000, date: '2024-02-11', status: 'completed' },
    { id: 6, type: 'expense', description: 'صيانة المعدات', amount: -85000, date: '2024-02-10', status: 'completed' }
  ]

  const getTransactionIcon = (type: TransactionType) => {
    return type === 'revenue' ? 
      <TrendingUp className="h-4 w-4 text-success" /> : 
      <TrendingDown className="h-4 w-4 text-destructive" />
  }

  const getTransactionStatus = (
    status: TransactionStatus
  ): { text: string; variant: 'success' | 'warning' } => {
    return status === 'completed'
      ? { text: 'مكتملة', variant: 'success' }
      : { text: 'معلقة', variant: 'warning' }
  }

  const TransactionCard = ({
    transaction,
    index
  }: {
    transaction: FinancialTransaction
    index: number
  }) => {
    const statusInfo = getTransactionStatus(transaction.status)
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
                  <p className="text-sm text-muted-foreground">
                    {transaction.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${isRevenue ? 'text-success' : 'text-destructive'}`}>
                  {isRevenue ? '+' : ''}{formatCurrencyValue(Math.abs(transaction.amount))}
                </div>
                <Badge variant={statusInfo.variant}>
                  {statusInfo.text}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {isRevenue ? 'إيراد' : 'مصروف'} • {transaction.id}#
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
      title="الإدارة المالية"
      description={`متابعة وإدارة الوضع المالي والتدفقات النقدية${lastRefreshLabel}${currencyRefreshLabel}`}
      icon={DollarSign}
      gradientFrom="from-primary"
      gradientTo="to-primary/80"
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في المعاملات المالية..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      headerExtra={FinancialAnalysisCards}
    >
      {/* نظام التبويبات المحسّن */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
            <span className="sm:hidden">عامة</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الفواتير</span>
            <span className="sm:hidden">فواتير</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">الموازنات</span>
            <span className="sm:hidden">موازنات</span>
          </TabsTrigger>
          <TabsTrigger value="bank-accounts" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">الحسابات البنكية</span>
            <span className="sm:hidden">حسابات</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">التقارير المالية</span>
            <span className="sm:hidden">تقارير</span>
          </TabsTrigger>
          <TabsTrigger value="cost-analysis" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">تحليل التكاليف</span>
            <span className="sm:hidden">تحليل</span>
          </TabsTrigger>
        </TabsList>

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
                  <span className="font-bold text-success">{formatCurrencyValue(financialData.revenue.total * 0.85)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">من المنافسات</span>
                  <span className="font-bold text-primary">{formatCurrencyValue(financialData.revenue.total * 0.15)}</span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">النمو الشهري</span>
                    <span className="font-bold text-success">+{financialData.revenue.growth}%</span>
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
                  <span className="font-bold text-destructive">{formatCurrencyValue(financialData.expenses.operational)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">مشاريع</span>
                  <span className="font-bold text-warning">{formatCurrencyValue(financialData.expenses.projects)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                  <span className="text-sm text-muted-foreground">إدارية</span>
                  <span className="font-bold text-secondary-foreground">{formatCurrencyValue(financialData.expenses.overhead)}</span>
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
                    <Input
                      placeholder="البحث في الموردين..."
                      className="pr-10"
                    />
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
                            <div className="text-xs text-muted-foreground">{supplier.contact}</div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className="text-xs">
                            {supplier.category}
                          </Badge>
                        </td>
                        <td className="py-4 font-medium">
                          {formatCurrencyValue(supplier.totalPurchases)}
                        </td>
                        <td className="py-4">
                          <span className={supplier.outstandingBalance > 0 ? 'text-warning font-medium' : 'text-success'}>
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
                            <span className="text-xs text-muted-foreground">{supplier.rating}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge 
                            variant={supplier.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {supplier.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
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
                  عرض {suppliersData.length} من {suppliersData.length} مورد
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
                  <TransactionCard key={transaction.id} transaction={transaction} index={index} />
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
                  topOutstandingInvoices.map(invoice => {
                    const isOverdue = invoice.status === 'overdue'

                    return (
                      <div key={invoice.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                          </div>
                          <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                            {invoice.status === 'sent' ? 'مرسلة' : invoice.status === 'draft' ? 'مسودة' : invoice.status === 'overdue' ? 'متأخرة' : 'أخرى'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>تاريخ الاستحقاق: {formatDateValue(invoice.dueDate ?? invoice.issueDate, { locale: 'ar-EG' })}</span>
                          <span className="font-medium text-foreground">{formatCurrencyValue(invoice.total)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onSectionChange('invoices')}>
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
                  budgetsAtRisk.map(budget => (
                    <div key={budget.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{budget.name}</p>
                          <p className="text-xs text-muted-foreground">القسم: {budget.department}</p>
                        </div>
                        <Badge variant="destructive">{budget.utilizationPercentage}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>المخصص: {formatCurrencyValue(budget.totalAmount)}</span>
                        <span className="font-medium text-destructive">المصروف: {formatCurrencyValue(budget.spentAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onSectionChange('budgets')}>
                  إدارة الموازنات
                </Button>
              </CardContent>
            </Card>

            {/* المشاريع عالية المخاطر */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
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
                  projectsAtRisk.map(project => (
                    <div key={project.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{project.name}</p>
                          <p className="text-xs text-muted-foreground">المدير: {project.manager}</p>
                        </div>
                        <Badge variant="destructive">{project.health === 'red' ? 'حرجة' : 'عالية المخاطر'}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>نسبة الإنجاز: {project.progress.toFixed(0)}%</span>
                        <span className="font-medium text-foreground">قيمة العقد: {formatCurrencyValue(project.contractValue)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onSectionChange('projects')}>
                  إدارة المشاريع
                </Button>
              </CardContent>
            </Card>

            {/* المنافسات التي تقترب مواعيدها */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
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
                  tendersClosingSoon.map(tender => {
                    const deadline = tender.deadline ? new Date(tender.deadline) : null
                    const daysLeft = Number.isFinite(tender.daysLeft) ? Number(tender.daysLeft) : (deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null)

                    return (
                      <div key={tender.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{tender.name}</p>
                            <p className="text-xs text-muted-foreground">العميل: {tender.client}</p>
                          </div>
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                            {daysLeft !== null && daysLeft !== undefined ? `${daysLeft} يوم` : 'غير محدد'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>الحالة: {tender.status === 'ready_to_submit' ? 'جاهزة للتقديم' : tender.status === 'submitted' ? 'تم التقديم' : 'قيد الإعداد'}</span>
                          <span className="font-medium text-foreground">قيمة متوقعة: {formatCurrencyValue(tender.value ?? 0)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onSectionChange('tenders')}>
                  إدارة المنافسات
                </Button>
              </CardContent>
            </Card>

            {/* حالة التقارير المالية */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
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
                  latestReports.map(report => (
                    <div key={report.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{report.name}</p>
                        <Badge variant={report.status === 'completed' ? 'success' : report.status === 'failed' ? 'destructive' : 'secondary'}>
                          {report.status === 'completed'
                            ? 'مكتمل'
                            : report.status === 'generating'
                              ? 'جاري التوليد'
                              : report.status === 'failed'
                                ? 'فشل'
                                : 'قيد الانتظار'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>النوع: {report.type}</span>
                        <span>أنشئ في {formatDateValue(report.createdAt, { locale: 'ar-EG' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onSectionChange('financial-reports')}>
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
                  <span className="font-medium">{financialData.profitability.gross.toFixed(1)}%</span>
                </div>
                <Progress value={financialData.profitability.gross} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">هامش الربح الصافي</span>
                  <span className="font-medium">{financialData.profitability.net}%</span>
                </div>
                <Progress value={financialData.profitability.net} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">كفاءة التكلفة</span>
                  <span className="font-medium">{financialData.kpis.costEfficiency}%</span>
                </div>
                <Progress value={financialData.kpis.costEfficiency} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">عائد الاستثمار</span>
                  <span className="font-medium">{financialData.profitability.roi}%</span>
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
                  <span className="font-medium text-success">{formatCurrencyValue(financialData.cashFlow.incoming)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">متوقع الصرف</span>
                  <span className="font-medium text-destructive">{formatCurrencyValue(financialData.cashFlow.outgoing)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-sm font-medium">التوقع النهائي</span>
                  <span className="font-bold text-primary">{formatCurrencyValue(financialData.cashFlow.projected)}</span>
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
                <span className="font-bold text-destructive">{formatCurrencyValue(financialData.receivables.overdue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="text-sm text-muted-foreground">حالية</span>
                <span className="font-bold text-primary">{formatCurrencyValue(financialData.receivables.current)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-sm text-muted-foreground">قادمة</span>
                <span className="font-bold text-success">{formatCurrencyValue(financialData.receivables.upcoming)}</span>
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