'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge'
import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import type { LucideIcon } from 'lucide-react'
import { 
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Trophy,
  Clock,
  Target,
  Plus,
  Eye,
  AlertTriangle,
  Share
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency, calculateDaysLeft } from '../data/centralData'
import { calculateTenderStats } from '../calculations/tender'
import { useFinancialState } from '@/application/context'

type ReportType = 'projects' | 'financial' | 'tenders' | 'clients' | 'kpi' | 'risk' | 'unknown'
type ReportStatus = 'ready' | 'generating' | 'outdated' | 'unknown'
type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

interface AvailableReport {
  id: string
  title: string
  description: string
  type: ReportType
  period: ReportPeriod
  size: string
  lastGenerated: string
  status: ReportStatus
}

interface QuickActionItem {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline'
  primary?: boolean
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('')

  const { projects: projectsState, tenders: tendersState, financial, isLoading: providerLoading, clients: clientsState } = useFinancialState()
  const { projects } = projectsState
  const { tenders } = tendersState
  const { financialData, loading: financialLoading } = financial
  const { clients, isLoading: clientsLoading } = clientsState

  const tenderStats = useMemo(() => calculateTenderStats(tenders), [tenders])

  const systemStats = useMemo(() => {
    const totalProjects = projects.length
    const activeProjects = projects.filter(project => project.status === 'active').length
    const completedProjects = projects.filter(project => project.status === 'completed').length
    const delayedProjects = projects.filter(project => project.status === 'delayed').length

    const totalTenders = tenders.length
    const activeStatuses = new Set(['new', 'under_action', 'ready_to_submit'])
    const activeTenders = tenders.filter(tender => activeStatuses.has(tender.status)).length
    const urgentTenders = tenders.reduce((count, tender) => {
      if (!tender.deadline) return count
      if (!activeStatuses.has(tender.status)) return count
      const daysLeft = calculateDaysLeft(tender.deadline)
      return daysLeft <= 7 && daysLeft >= 0 ? count + 1 : count
    }, 0)
    const wonTenders = tenders.filter(tender => tender.status === 'won').length

    const totalClients = clients.length
    const activeClients = clients.filter(client => client.status === 'active').length

    const cashFlow = financialData?.cashFlow ?? {
      current: 0,
      incoming: 0,
      outgoing: 0,
      projected: 0,
    }

    const receivables = financialData?.receivables ?? {
      total: 0,
      overdue: 0,
      current: 0,
      upcoming: 0,
    }

    const profitability = Math.round(financialData?.profitability?.margin ?? 0)

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        delayed: delayedProjects,
      },
      tenders: {
        total: totalTenders,
        active: activeTenders,
        urgent: urgentTenders,
        won: wonTenders,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      financial: {
        cashFlow,
        receivables,
        profitability,
      },
    }
  }, [projects, tenders, clients, financialData])

  const isLoading = providerLoading || clientsLoading || financialLoading
  
  // Mock function for navigation
  const onSectionChange = (section: string) => {
    console.log('Navigate to:', section)
  }

  // تقارير متاحة
  const availableReports: AvailableReport[] = [
    {
      id: 'projects-summary',
      title: 'تقرير المشاريع الشامل',
      description: 'تقرير شامل عن حالة جميع المشاريع والإنجازات',
      type: 'projects',
      period: 'monthly',
      size: '2.3 MB',
      lastGenerated: '2024-02-15',
      status: 'ready'
    },
    {
      id: 'financial-analysis',
      title: 'التحليل المالي الشهري',
      description: 'تحليل مفصل للوضع المالي والتدفقات النقدية',
      type: 'financial',
      period: 'monthly',
      size: '1.8 MB',
      lastGenerated: '2024-02-14',
      status: 'ready'
    },
    {
      id: 'tenders-performance',
      title: 'أداء المنافسات والعطاءات',
      description: 'تقرير مفصل عن نتائج المنافسات ونسب الفوز',
      type: 'tenders',
      period: 'quarterly',
      size: '1.5 MB',
      lastGenerated: '2024-02-10',
      status: 'ready'
    },
    {
      id: 'clients-analysis',
      title: 'تحليل العملاء والشراكات',
      description: 'تقرير عن العلاقات مع العملاء والفرص الجديدة',
      type: 'clients',
      period: 'monthly',
      size: '950 KB',
      lastGenerated: '2024-02-12',
      status: 'generating'
    },
    {
      id: 'kpi-dashboard',
      title: 'لوحة مؤشرات الأداء',
      description: 'مؤشرات الأداء الرئيسية وأهداف الشركة',
      type: 'kpi',
      period: 'weekly',
      size: '720 KB',
      lastGenerated: '2024-02-16',
      status: 'ready'
    },
    {
      id: 'risk-assessment',
      title: 'تقييم المخاطر والفرص',
      description: 'تحليل المخاطر المحتملة والفرص الاستثمارية',
      type: 'risk',
      period: 'quarterly',
      size: '1.2 MB',
      lastGenerated: '2024-01-30',
      status: 'outdated'
    }
  ]

  const handleExportAllReports = () => {
    console.info('Export all reports requested')
  }

  const handleScheduleReport = () => {
    console.info('Schedule report dialog requested')
  }

  const handleCreateCustomReport = () => {
    console.info('Custom report builder requested')
  }

  // فلترة التقارير
  const filteredReports = availableReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // إحصائيات التقارير
  const reportStats = {
    total: availableReports.length,
    ready: availableReports.filter(r => r.status === 'ready').length,
    generating: availableReports.filter(r => r.status === 'generating').length,
    outdated: availableReports.filter(r => r.status === 'outdated').length,
    thisMonth: availableReports.filter(r => r.period === 'monthly').length,
    totalSize: '8.4 MB'
  }

  // الإحصائيات السريعة للمدير
  const quickStats = [
    {
      label: 'إجمالي التقارير',
      value: reportStats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'تقارير جاهزة',
      value: reportStats.ready,
      trend: 'up' as const,
      trendValue: '+2',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'قيد الإنشاء',
      value: reportStats.generating,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'تحتاج تحديث',
      value: reportStats.outdated,
      trend: 'down' as const,
      trendValue: '-1',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      label: 'تقارير شهرية',
      value: reportStats.thisMonth,
      color: 'text-secondary-foreground',
      bgColor: 'bg-secondary/20'
    },
    {
      label: 'حجم البيانات',
      value: reportStats.totalSize,
      trend: 'up' as const,
      trendValue: '+0.8MB',
      color: 'text-info',
      bgColor: 'bg-info/10'
    }
  ]

  // الإجراءات السريعة
  const quickActions: QuickActionItem[] = [
    {
      label: 'تصدير الكل',
      icon: Download,
      onClick: handleExportAllReports,
      variant: 'outline'
    },
    {
      label: 'جدولة تقرير',
      icon: Calendar,
      onClick: handleScheduleReport,
      variant: 'outline'
    },
    {
      label: 'تقرير مخصص',
      icon: Plus,
      onClick: handleCreateCustomReport,
      primary: true
    }
  ]

  const getReportTypeIcon = (type: ReportType | string) => {
    switch (type) {
      case 'projects':
        return <Building2 className="h-5 w-5 text-primary" />
      case 'financial':
        return <DollarSign className="h-5 w-5 text-success" />
      case 'tenders':
        return <Trophy className="h-5 w-5 text-warning" />
      case 'clients':
        return <Users className="h-5 w-5 text-secondary-foreground" />
      case 'kpi':
        return <Target className="h-5 w-5 text-info" />
      case 'risk':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getReportTypeColor = (type: ReportType | string) => {
    switch (type) {
      case 'projects':
        return 'bg-primary/10'
      case 'financial':
        return 'bg-success/10'
      case 'tenders':
        return 'bg-warning/10'
      case 'clients':
        return 'bg-secondary/20'
      case 'kpi':
        return 'bg-info/10'
      case 'risk':
        return 'bg-destructive/10'
      default:
        return 'bg-muted/10'
    }
  }

  const getStatusBadge = (status: ReportStatus | string) => {
    const map: Record<string, { status: StatusBadgeProps['status']; label: string }> = {
      ready: { status: 'success', label: 'جاهز' },
      generating: { status: 'info', label: 'قيد الإنشاء' },
      outdated: { status: 'error', label: 'يحتاج تحديث' },
    }

    const resolved = map[status] ?? { status: 'default', label: 'غير محدد' }

    return (
      <StatusBadge
        status={resolved.status}
        label={resolved.label}
        size="sm"
        className="shadow-none"
      />
    )
  }

  const getPeriodText = (period: ReportPeriod | string) => {
    switch (period) {
      case 'weekly':
        return 'أسبوعي'
      case 'monthly':
        return 'شهري'
      case 'quarterly':
        return 'ربع سنوي'
      case 'yearly':
        return 'سنوي'
      default:
        return 'غير محدد'
    }
  }

  // مكون إحصائيات الأعمال السريعة
  const BusinessStatsCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="المشاريع النشطة"
        value={isLoading ? '—' : systemStats.projects.active}
        subtitle="من إجمالي المشاريع"
        icon={Building2}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: '+5%', direction: 'up' }}
        onClick={() => onSectionChange('projects')}
      />
      <DetailCard
        title="المنافسات الفائزة"
        value={isLoading ? '—' : systemStats.tenders.won}
        subtitle={isLoading ? 'نسبة فوز —' : `نسبة فوز ${tenderStats.winRate}%`}
        icon={Trophy}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{ value: '+12%', direction: 'up' }}
        onClick={() => onSectionChange('tenders')}
      />
      <DetailCard
        title="العملاء النشطون"
        value={isLoading ? '—' : systemStats.clients.active}
        subtitle="عملاء استراتيجيون"
        icon={Users}
        color="text-success"
        bgColor="bg-success/10"
        trend={{ value: '+8%', direction: 'up' }}
        onClick={() => onSectionChange('clients')}
      />
      <DetailCard
        title="الربحية"
        value={isLoading ? '—' : `${systemStats.financial.profitability}%`}
        subtitle="نسبة الربح الحالية"
        icon={TrendingUp}
        color="text-secondary-foreground"
        bgColor="bg-secondary/20"
        trend={{ value: '+3%', direction: 'up' }}
        onClick={() => onSectionChange('financial')}
      />
    </div>
  )

  const ReportCard = ({ report, index }: { report: AvailableReport; index: number }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="transition-all duration-300 cursor-pointer group hover:border-primary">
          <CardContent className="p-6">
            
            {/* الصف العلوي */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${getReportTypeColor(report.type)} rounded-lg group-hover:scale-110 transition-transform`}>
                  {getReportTypeIcon(report.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {report.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>
              {getStatusBadge(report.status)}
            </div>

            {/* تفاصيل التقرير */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getPeriodText(report.period)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{report.size}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Calendar className="h-4 w-4" />
                <span>آخر تحديث: {report.lastGenerated}</span>
              </div>
            </div>

            {/* الإجراءات */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {report.status === 'ready' && (
                  <Button size="sm" className="h-8">
                    <Download className="h-4 w-4 ml-2" />
                    تحميل
                  </Button>
                )}
                {report.status === 'generating' && (
                  <Button variant="outline" size="sm" className="h-8" disabled>
                    جاري الإنشاء...
                  </Button>
                )}
                {report.status === 'outdated' && (
                  <Button variant="destructive" size="sm" className="h-8">
                    تحديث
                  </Button>
                )}
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
      title="التقارير والتحليلات"
      description="تقارير شاملة ومؤشرات أداء الشركة"
      icon={FileText}
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في التقارير..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      headerExtra={BusinessStatsCards}
    >
      
      {/* تقارير أخرى مخصصة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* تقرير سريع للمشاريع */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              ملخص المشاريع السريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <div className="text-2xl font-bold text-success">{isLoading ? '—' : systemStats.projects.active}</div>
                <div className="text-sm text-muted-foreground">مشاريع نشطة</div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{isLoading ? '—' : systemStats.projects.completed}</div>
                <div className="text-sm text-muted-foreground">مشاريع مكتملة</div>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <div className="text-2xl font-bold text-warning">{isLoading ? '—' : systemStats.projects.delayed}</div>
                <div className="text-sm text-muted-foreground">مشاريع متأخرة</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground">
                  {isLoading
                    ? '—'
                    : `${systemStats.projects.total > 0 
                      ? Math.round((systemStats.projects.completed / systemStats.projects.total) * 100)
                      : 0}%`}
                </div>
                <div className="text-sm text-muted-foreground">متوسط الإنجاز</div>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => onSectionChange('projects')}>
              <BarChart3 className="h-4 w-4 ml-2" />
              عرض تفاصيل المشاريع
            </Button>
          </CardContent>
        </Card>

        {/* تقرير سريع للمالية */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              الملخص المالي السريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-sm text-muted-foreground">السيولة الحالية</span>
                <span className="font-bold text-success">{isLoading ? '—' : formatCurrency(systemStats.financial.cashFlow.current)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="text-sm text-muted-foreground">المطلوبات</span>
                <span className="font-bold text-primary">{isLoading ? '—' : formatCurrency(systemStats.financial.receivables.total)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm text-muted-foreground">نسبة الربحية</span>
                <span className="font-bold text-secondary-foreground">{isLoading ? '—' : `${systemStats.financial.profitability}%`}</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => onSectionChange('financial')}>
              <PieChart className="h-4 w-4 ml-2" />
              عرض التفاصيل المالية
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* شبكة التقارير المتاحة */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          التقارير المتاحة
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report, index) => (
            <ReportCard key={report.id} report={report} index={index} />
          ))}
        </div>
      </div>

      {/* حالة فارغة */}
      {filteredReports.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchTerm ? "لا توجد نتائج للتقارير" : "لا توجد تقارير بعد"}
          description={
            searchTerm
              ? "لم يتم العثور على تقارير مطابقة لبحثك. جرّب تعديل الكلمات المفتاحية أو إعادة التعيين."
              : "ابدأ بإنشاء تقرير جديد لتتبع الأداء المالي والتشغيلي."
          }
          actionLabel={searchTerm ? "مسح البحث" : undefined}
          onAction={searchTerm ? () => setSearchTerm("") : undefined}
        />
      )}
    </PageLayout>
  )
}