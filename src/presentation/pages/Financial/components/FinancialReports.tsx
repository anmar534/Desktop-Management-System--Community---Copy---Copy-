import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { PageLayout, EmptyState, DetailCard } from '@/presentation/components/layout/PageLayout'
import { DeleteConfirmation } from '@/presentation/components/ui/confirmation-dialog'
import { InlineAlert } from '@/presentation/components/ui/inline-alert'
import {
  FileBarChart,
  Plus,
  Download,
  Eye,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Trash2,
  Edit,
  FileText,
  Clock,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  RefreshCw,
  PieChart,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFinancialReports } from '@/application/hooks/useFinancialReports'
import type { FinancialReport } from '@/data/centralData'
import { formatDateValue } from '@/shared/utils/formatters/formatters'

interface FinancialReportStatusInfo {
  label: string
  status: StatusBadgeProps['status']
  icon: typeof CheckCircle
}

interface FinancialReportsProps {
  onSectionChange: (section: string) => void
}

const getStatusInfo = (status: FinancialReport['status']): FinancialReportStatusInfo => {
  switch (status) {
    case 'completed':
      return {
        label: 'مكتمل',
        status: 'success',
        icon: CheckCircle,
      }
    case 'pending':
      return {
        label: 'تحت المعالجة',
        status: 'warning',
        icon: Clock,
      }
    case 'generating':
      return {
        label: 'قيد التوليد',
        status: 'info',
        icon: Clock,
      }
    case 'failed':
      return {
        label: 'فشل',
        status: 'error',
        icon: AlertCircle,
      }
    default:
      return {
        label: status ?? 'غير محدد',
        status: 'default',
        icon: FileText,
      }
  }
}

const getTypeLabel = (type: string | undefined) => {
  switch (type) {
    case 'automatic':
      return 'آلي'
    case 'custom':
      return 'مخصص'
    case 'monthly':
      return 'شهري'
    case 'quarterly':
      return 'ربعي'
    case 'annual':
    case 'yearly':
      return 'سنوي'
    default:
      return type ?? 'غير محدد'
  }
}

const normalizeFrequency = (report: FinancialReport): string => {
  if (report.frequency) {
    return report.frequency
  }

  switch (report.type) {
    case 'monthly':
      return 'monthly'
    case 'quarterly':
      return 'quarterly'
    case 'annual':
      return 'yearly'
    default:
      return 'other'
  }
}

const formatMinutes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 'غير متوفر'
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} دقيقة`
}

const formatFileSize = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value) || value <= 0) {
    return undefined
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} MB`
  }

  return `${value.toFixed(0)} KB`
}

export function FinancialReports({ onSectionChange }: FinancialReportsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const { reports, isLoading, deleteReport: removeReport } = useFinancialReports()
  const [deleteTarget, setDeleteTarget] = useState<FinancialReport | null>(null)

  const reportsData = useMemo(() => {
    if (reports.length === 0) {
      return {
        overview: {
          totalReports: 0,
          completedReports: 0,
          pendingReports: 0,
          failedReports: 0,
          generatedThisMonth: 0,
          automaticReports: 0,
          customReports: 0,
          averageGenerationTime: 0,
        },
      }
    }

    const currentDate = new Date()
    const durations: number[] = []

    const overview = reports.reduce(
      (acc, report) => {
        const createdAt = new Date(report.createdAt)
        const completedAt = report.completedAt ? new Date(report.completedAt) : undefined

        if (report.status === 'completed') {
          acc.completedReports += 1
        }
        if (report.status === 'pending' || report.status === 'generating') {
          acc.pendingReports += 1
        }
        if (report.status === 'failed') {
          acc.failedReports += 1
        }
        if (
          createdAt.getMonth() === currentDate.getMonth() &&
          createdAt.getFullYear() === currentDate.getFullYear()
        ) {
          acc.generatedThisMonth += 1
        }
        if (report.type === 'automatic') {
          acc.automaticReports += 1
        }
        if (report.type === 'custom') {
          acc.customReports += 1
        }

        if (report.status === 'completed' && completedAt) {
          const durationMinutes = (completedAt.getTime() - createdAt.getTime()) / 60000
          if (durationMinutes > 0) {
            durations.push(durationMinutes)
          }
        }

        return acc
      },
      {
        totalReports: reports.length,
        completedReports: 0,
        pendingReports: 0,
        failedReports: 0,
        generatedThisMonth: 0,
        automaticReports: 0,
        customReports: 0,
        averageGenerationTime: 0,
      },
    )

    if (durations.length > 0) {
      overview.averageGenerationTime =
        durations.reduce((sum, val) => sum + val, 0) / durations.length
    }

    return { overview }
  }, [reports])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return reports.filter((report) => {
      const name = report.name?.toLowerCase() ?? ''
      const description = report.description?.toLowerCase() ?? ''

      const matchesSearch =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch)

      const matchesType = typeFilter === 'all' || report.type === typeFilter
      const matchesPeriod = periodFilter === 'all' || normalizeFrequency(report) === periodFilter

      return matchesSearch && matchesType && matchesPeriod
    })
  }, [reports, searchTerm, typeFilter, periodFilter])

  const reportsAlert = useMemo(() => {
    const failedReports = reports.filter((report) => report.status === 'failed')
    const generatingReports = reports.filter((report) => report.status === 'generating')

    if (failedReports.length > 0) {
      return {
        variant: 'destructive' as const,
        title: 'تقارير فاشلة تحتاج متابعة',
        description: `${failedReports.length} تقرير لم يكتمل إنتاجه. راجع مصادر البيانات أو أعد تشغيل المهمة قبل مشاركة النتائج.`,
      }
    }

    if (generatingReports.length > 0) {
      return {
        variant: 'info' as const,
        title: 'تقارير قيد التوليد',
        description: `${generatingReports.length} تقرير قيد الإنتاج حالياً. سيتم إشعارك عند اكتمالها.`,
      }
    }

    return null
  }, [reports])

  const completionRate =
    reportsData.overview.totalReports > 0
      ? Math.round(
          (reportsData.overview.completedReports / reportsData.overview.totalReports) * 100,
        )
      : 0
  const pendingRate =
    reportsData.overview.totalReports > 0
      ? Math.round((reportsData.overview.pendingReports / reportsData.overview.totalReports) * 100)
      : 0
  const failedCount = reportsData.overview.failedReports
  const averageGenerationTimeLabel = formatMinutes(reportsData.overview.averageGenerationTime)

  const headerMetadata = (
    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground md:gap-3">
      <StatusBadge
        status="default"
        label="إجمالي التقارير"
        value={reportsData.overview.totalReports}
        icon={ListChecks}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="success"
        label="التقارير المكتملة"
        value={reportsData.overview.completedReports}
        icon={CheckCircle2}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={reportsData.overview.pendingReports > 0 ? 'info' : 'default'}
        label="قيد التوليد"
        value={reportsData.overview.pendingReports}
        icon={Clock}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status={failedCount > 0 ? 'error' : 'success'}
        label="حالات فشل"
        value={failedCount}
        icon={AlertTriangle}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="info"
        label="تقارير هذا الشهر"
        value={reportsData.overview.generatedThisMonth}
        icon={Calendar}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="success"
        label="تلقائي"
        value={reportsData.overview.automaticReports}
        icon={RefreshCw}
        size="sm"
        className="shadow-none"
      />
      <StatusBadge
        status="warning"
        label="مخصص"
        value={reportsData.overview.customReports}
        icon={PieChart}
        size="sm"
        className="shadow-none"
      />
    </div>
  )

  const overviewCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <DetailCard
        title="إجمالي التقارير"
        value={reportsData.overview.totalReports}
        subtitle="كل التقارير المسجلة"
        icon={FileText}
        color="text-primary"
        bgColor="bg-primary/10"
        trend={{ value: `+${reportsData.overview.generatedThisMonth} هذا الشهر`, direction: 'up' }}
      />
      <DetailCard
        title="جاهزة للتحميل"
        value={reportsData.overview.completedReports}
        subtitle="تقارير مكتملة"
        icon={CheckCircle2}
        color="text-success"
        bgColor="bg-success/10"
        trend={{ value: `${completionRate}% نسبة الاكتمال`, direction: 'up' }}
      />
      <DetailCard
        title="قيد التنفيذ"
        value={reportsData.overview.pendingReports}
        subtitle="تحت المعالجة أو التوليد"
        icon={Clock}
        color="text-info"
        bgColor="bg-info/10"
        trend={{ value: `${pendingRate}% من الإجمالي`, direction: 'stable' }}
      />
      <DetailCard
        title="متوسط زمن التوليد"
        value={averageGenerationTimeLabel}
        subtitle="لكل تقرير مكتمل"
        icon={BarChart3}
        color="text-warning"
        bgColor="bg-warning/10"
        trend={{
          value: `${reportsData.overview.failedReports} حالات فشل`,
          direction: failedCount > 0 ? 'down' : 'up',
        }}
      />
    </div>
  )

  const headerExtraContent = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-accent/20 bg-gradient-to-l from-accent/10 via-card/40 to-background p-5 shadow-sm">
        {headerMetadata}
      </div>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-accent/10 backdrop-blur-sm">
        {overviewCards}
      </div>
    </div>
  )

  const handleViewReport = (reportId: string) => {
    onSectionChange(`report-details?id=${reportId}`)
  }

  const handleEditReport = (reportId: string) => {
    onSectionChange(`edit-report?id=${reportId}`)
  }

  const handleDeleteRequest = (report: FinancialReport) => {
    setDeleteTarget(report)
  }

  const confirmDeleteReport = async () => {
    if (!deleteTarget) {
      return
    }

    await removeReport(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleDownloadReport = (reportId: string) => {
    console.log('تحميل التقرير:', reportId)
    // TODO: ربط التحميل بموفر الملفات عند توفره
  }

  const quickActions = [
    {
      label: 'العودة للإدارة المالية',
      icon: ArrowRight,
      onClick: () => onSectionChange('financial'),
      variant: 'outline' as const,
    },
    {
      label: 'تقرير جديد',
      icon: Plus,
      onClick: () => onSectionChange('new-report'),
      primary: true,
    },
    {
      label: 'تقرير شهري',
      icon: Calendar,
      onClick: () => onSectionChange('monthly-report'),
      variant: 'outline' as const,
    },
    {
      label: 'تحليل مالي',
      icon: BarChart3,
      onClick: () => onSectionChange('financial-analysis'),
      variant: 'outline' as const,
    },
  ]

  const hasReports = reports.length > 0

  return (
    <PageLayout
      tone="accent"
      title="التقارير المالية"
      description="إدارة ومراقبة التقارير المالية"
      icon={FileBarChart}
      quickActions={quickActions}
      quickStats={[]}
      headerExtra={headerExtraContent}
      showSearch={false}
      showLastUpdate={false}
    >
      {reportsAlert && (
        <div className="mb-6">
          <InlineAlert
            variant={reportsAlert.variant}
            title={reportsAlert.title}
            description={reportsAlert.description}
          />
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                بحث في التقارير
              </label>
              <input
                type="text"
                placeholder="ابحث عن تقرير..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                نوع التقرير
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="نوع التقرير"
              >
                <option value="all">جميع الأنواع</option>
                <option value="automatic">تلقائي</option>
                <option value="custom">مخصص</option>
                <option value="monthly">شهري</option>
                <option value="quarterly">ربعي</option>
                <option value="annual">سنوي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                الفترة الزمنية
              </label>
              <select
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="الفترة الزمنية"
              >
                <option value="all">جميع الفترات</option>
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="yearly">سنوي</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          جاري تحميل التقارير المالية...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, index) => {
            const statusInfo = getStatusInfo(report.status)
            const StatusIcon = statusInfo.icon
            const formattedSize = formatFileSize(report.size)

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                          <StatusBadge
                            status={statusInfo.status}
                            label={statusInfo.label}
                            size="sm"
                            icon={StatusIcon}
                            className="shadow-none"
                          />
                        </div>
                        <p className="text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80">
                          <span>النوع: {getTypeLabel(report.type)}</span>
                          <span>الفترة: {getTypeLabel(normalizeFrequency(report))}</span>
                          <span>
                            التاريخ: {formatDateValue(report.createdAt, { locale: 'ar-SA' })}
                          </span>
                          {formattedSize && <span>الحجم: {formattedSize}</span>}
                          {report.format && <span>التنسيق: {report.format.toUpperCase()}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReport(report.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {report.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(report)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {!isLoading && filteredReports.length === 0 && hasReports && (
            <EmptyState
              icon={FileText}
              title="لا توجد نتائج مطابقة"
              description="لا توجد تقارير تطابق معايير البحث الحالية. جرّب تعديل المرشحات أو إعادة التعيين."
            />
          )}

          {!isLoading && !hasReports && (
            <EmptyState
              icon={FileText}
              title="لا توجد تقارير مالية"
              description="ابدأ بإنشاء تقرير مالي لمتابعة الأداء والمؤشرات الرئيسية."
              actionLabel="إنشاء تقرير جديد"
              onAction={() => onSectionChange('new-report')}
            />
          )}
        </div>
      )}
      <DeleteConfirmation
        itemName={deleteTarget?.name ?? 'هذا التقرير'}
        onConfirm={confirmDeleteReport}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />
    </PageLayout>
  )
}
