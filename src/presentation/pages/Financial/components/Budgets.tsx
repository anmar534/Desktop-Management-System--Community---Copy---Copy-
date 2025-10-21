import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { InlineAlert, type InlineAlertVariant } from '@/presentation/components/ui/inline-alert'
import { StatusBadge, type StatusBadgeProps } from '@/presentation/components/ui/status-badge'
import { Progress } from '@/presentation/components/ui/progress'
import { PageLayout, DetailCard, EmptyState } from '@/presentation/components/layout/PageLayout'
import { DeleteConfirmation } from '@/presentation/components/ui/confirmation-dialog'
import {
  Target,
  Plus,
  Eye,
  Edit,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/data/centralData'
import { formatDateValue } from '@/shared/utils/formatters/formatters'
import { getProgressColor } from '@/shared/utils/ui/statusColors'
import { useBudgets } from '@/application/hooks/useBudgets'

interface BudgetStatusSummary {
  badgeStatus: StatusBadgeProps['status']
  badgeLabel: string
  alertVariant: InlineAlertVariant
  alertTitle: string
  alertDescription: string
}

interface BudgetsProps {
  onSectionChange: (section: string) => void
}

export function Budgets({ onSectionChange }: BudgetsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('2024')
  const { budgets, isLoading, deleteBudget: removeBudget } = useBudgets()

  const handleViewBudget = (budgetId: string) => {
    onSectionChange(`budget-details?id=${budgetId}`)
  }

  const handleEditBudget = (budgetId: string) => {
    onSectionChange(`edit-budget?id=${budgetId}`)
  }

  const budgetsData = useMemo(() => {
    const totalAllocated = budgets.reduce((sum, budget) => sum + budget.totalAmount, 0)
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
    const totalRemaining = budgets.reduce((sum, budget) => sum + (budget.totalAmount - budget.spentAmount), 0)
    const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0

    return {
      overview: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        utilizationRate,
        activeBudgets: budgets.filter(b => b.status === 'active').length,
        overBudget: budgets.filter(b => b.utilizationPercentage > 100).length,
        underUtilized: budgets.filter(b => b.utilizationPercentage < 50).length
      }
    }
  }, [budgets])

  const quickStats = useMemo(() => ([
    {
      label: 'إجمالي الموازنة المعتمدة',
      value: formatCurrency(budgetsData.overview.totalAllocated),
      trend: 'up' as const,
      trendValue: '+4.1%',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'المبالغ المصروفة',
      value: formatCurrency(budgetsData.overview.totalSpent),
      trend: 'up' as const,
      trendValue: '+6.2%',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'المتبقي من الموازنة',
      value: formatCurrency(budgetsData.overview.totalRemaining),
      trend: 'down' as const,
      trendValue: '-2.3%',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'معدل الاستخدام',
      value: `${budgetsData.overview.utilizationRate}%`,
      trend: 'up' as const,
      trendValue: '+1.8%',
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      label: 'موازنات نشطة',
      value: budgetsData.overview.activeBudgets.toString(),
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'موازنات تحتاج انتباه',
      value: budgetsData.overview.overBudget.toString(),
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ]), [budgetsData])

  const quickActions = [
    {
      label: 'إنشاء موازنة جديدة',
      icon: Plus,
      onClick: () => onSectionChange('new-budget'),
      primary: true
    },
    {
      label: 'تحليل الموازنات',
      icon: PieChart,
      onClick: () => onSectionChange('budget-analytics'),
      variant: 'outline' as const
    },
    {
      label: 'العودة للإدارة المالية',
      icon: ArrowRight,
      onClick: () => onSectionChange('financial'),
      variant: 'outline' as const
    }
  ]

  const resolveBudgetStatusSummary = (
    status: string,
    utilization: number,
    remainingAmount: number
  ): BudgetStatusSummary => {
    if (utilization > 100) {
      return {
        badgeStatus: 'error',
        badgeLabel: 'متجاوزة للحد',
        alertVariant: 'destructive',
        alertTitle: 'تم تجاوز السقف المالي',
        alertDescription: `تجاوزت الموازنة السقف المعتمد بمقدار ${formatCurrency(Math.abs(remainingAmount))}.`
      }
    }

    if (status === 'active' && utilization < 50) {
      return {
        badgeStatus: 'warning',
        badgeLabel: 'استخدام منخفض',
        alertVariant: 'warning',
        alertTitle: 'استخدام أقل من المتوقع',
        alertDescription: `ما يزال ${100 - utilization}% من الموازنة غير مستغل. راجع خطة الإنفاق.`
      }
    }

    switch (status) {
      case 'draft':
        return {
          badgeStatus: 'notStarted',
          badgeLabel: 'مسودة',
          alertVariant: 'neutral',
          alertTitle: 'الموازنة في وضع المسودة',
          alertDescription: 'لم يتم اعتماد هذه الموازنة بعد. أكمل تفاصيلها لاعتمادها.'
        }
      case 'active':
        return {
          badgeStatus: 'onTrack',
          badgeLabel: 'نشطة',
          alertVariant: 'info',
          alertTitle: 'الموازنة نشطة',
          alertDescription: remainingAmount >= 0
            ? `المتبقي ${formatCurrency(remainingAmount)} ضمن السقف المعتمد.`
            : 'تم استخدام معظم الموازنة وفق الخطة المعتمدة.'
        }
      case 'completed':
        return {
          badgeStatus: 'completed',
          badgeLabel: 'مكتملة',
          alertVariant: 'success',
          alertTitle: 'تم إكمال الموازنة',
          alertDescription: 'تم إغلاق الموازنة بعد الانتهاء من جميع عمليات الصرف.'
        }
      case 'cancelled':
        return {
          badgeStatus: 'default',
          badgeLabel: 'ملغاة',
          alertVariant: 'neutral',
          alertTitle: 'تم إيقاف الموازنة',
          alertDescription: 'لن تظهر هذه الموازنة في التقارير أو التحليلات المستقبلية.'
        }
      default:
        return {
          badgeStatus: 'default',
          badgeLabel: 'غير محدد',
          alertVariant: 'neutral',
          alertTitle: 'حالة غير معروفة',
          alertDescription: 'يرجى التحقق من بيانات الموازنة لتحديد حالتها الحالية.'
        }
    }
  }

  const BudgetAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="إجمالي المخصص"
        value={formatCurrency(budgetsData.overview.totalAllocated)}
        subtitle="جميع الموازنات المعتمدة"
        icon={Target}
        color="text-primary"
        bgColor="bg-primary/10"
      />
      <DetailCard
        title="معدل الاستخدام"
        value={`${budgetsData.overview.utilizationRate}%`}
        subtitle="نسبة الصرف إلى المخصص"
        icon={PieChart}
        color="text-info"
        bgColor="bg-info/10"
      />
      <DetailCard
        title="موازنات متجاوزة"
        value={budgetsData.overview.overBudget.toString()}
        subtitle="تحتاج معالجة عاجلة"
        icon={AlertTriangle}
        color="text-destructive"
        bgColor="bg-destructive/10"
      />
      <DetailCard
        title="استخدام منخفض"
        value={budgetsData.overview.underUtilized.toString()}
        subtitle="فرص لإعادة التوزيع"
        icon={TrendingDown}
        color="text-warning"
        bgColor="bg-warning/10"
      />
    </div>
  )

  const filteredBudgets = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase()

    return budgets.filter(budget => {
      const matchesSearch =
        budget.name.toLowerCase().includes(normalizedSearch) ||
        budget.department.toLowerCase().includes(normalizedSearch) ||
        budget.category.toLowerCase().includes(normalizedSearch)

      const budgetYear = new Date(budget.startDate).getFullYear().toString()
      const matchesYear = yearFilter === 'all' || budgetYear === yearFilter

      return matchesSearch && matchesYear
    })
  }, [budgets, searchTerm, yearFilter])

  return (
    <PageLayout
      tone="primary"
      title="إدارة الموازنة"
      description="إدارة ومتابعة الموازنات والمخصصات المالية"
      icon={Target}
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في الموازنات..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      headerExtra={BudgetAnalysisCards}
    >
      {/* فلاتر إضافية */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={yearFilter === '2024' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setYearFilter('2024')}
          >
            2024
          </Button>
          <Button
            variant={yearFilter === '2023' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setYearFilter('2023')}
          >
            2023
          </Button>
          <Button
            variant={yearFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setYearFilter('all')}
          >
            جميع السنوات
          </Button>
        </div>
      </div>

      {/* قائمة الموازنات */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          جاري تحميل بيانات الموازنات...
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredBudgets.map((budget, index) => {
              const remainingAmount = budget.totalAmount - budget.spentAmount
              const statusSummary = resolveBudgetStatusSummary(
                budget.status,
                budget.utilizationPercentage,
                remainingAmount
              )

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* معلومات الموازنة الأساسية */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {budget.name}
                                </h3>
                                <StatusBadge
                                  status={statusSummary.badgeStatus}
                                  label={statusSummary.badgeLabel}
                                  size="sm"
                                  className="shadow-none"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span>القسم: {budget.department}</span>
                                <span>الفئة: {budget.category}</span>
                                <span>السنة: {new Date(budget.startDate).getFullYear()}</span>
                              </div>
                            </div>
                          </div>

                          {/* المبالغ */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="p-3 bg-info/10 rounded-lg">
                              <div className="text-sm text-muted-foreground">المخصص</div>
                              <div className="text-lg font-semibold text-info">
                                {formatCurrency(budget.totalAmount)}
                              </div>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-lg">
                              <div className="text-sm text-muted-foreground">المصروف</div>
                              <div className="text-lg font-semibold text-warning">
                                {formatCurrency(budget.spentAmount)}
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg ${remainingAmount >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                              <div className="text-sm text-muted-foreground">المتبقي</div>
                              <div className={`text-lg font-semibold ${remainingAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {formatCurrency(remainingAmount)}
                              </div>
                            </div>
                          </div>

                          {/* معلومات إضافية */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block">تاريخ البداية</span>
                              <span className="font-medium">{formatDateValue(budget.startDate, {
                                locale: 'ar-SA',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">تاريخ النهاية</span>
                              <span className="font-medium">{formatDateValue(budget.endDate, {
                                locale: 'ar-SA',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">عدد الفئات</span>
                              <span className="font-medium">{budget.categories.length}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">آخر تحديث</span>
                              <span className="font-medium">{formatDateValue(Date.now(), {
                                locale: 'ar-SA',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </div>

                        {/* مؤشر الاستخدام والإجراءات */}
                        <div className="lg:w-64">
                          <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">نسبة الاستخدام</span>
                              <span className={`font-medium ${
                                budget.utilizationPercentage > 100 ? 'text-destructive' :
                                budget.utilizationPercentage > 90 ? 'text-warning' :
                                budget.utilizationPercentage < 50 ? 'text-warning' : 'text-success'
                              }`}>
                                {budget.utilizationPercentage}%
                              </span>
                            </div>

                            <Progress
                              value={Math.min(budget.utilizationPercentage, 100)}
                              className="h-3 bg-muted"
                              indicatorClassName={`${getProgressColor(budget.utilizationPercentage)} transition-all duration-300`}
                            />

                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <InlineAlert
                            className="mb-4"
                            variant={statusSummary.alertVariant}
                            title={statusSummary.alertTitle}
                            description={statusSummary.alertDescription}
                          />

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleViewBudget(budget.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              تفاصيل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleEditBudget(budget.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => onSectionChange(`budget-report?id=${budget.id}`)}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              تقرير تفصيلي
                            </Button>
                            <DeleteConfirmation
                              itemName={budget.name}
                              onConfirm={() => void removeBudget(budget.id)}
                              trigger={(
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/40"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  حذف
                                </Button>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {filteredBudgets.length === 0 && budgets.length > 0 && (
              <EmptyState
                icon={Target}
                title="لا توجد نتائج مطابقة"
                description="لا توجد موازنات تطابق معايير البحث الحالية. عدّل خيارات البحث أو أعد التعيين."
              />
            )}
          </div>

          {budgets.length === 0 && !isLoading && (
            <EmptyState
              icon={Target}
              title="لا توجد موازنات"
              description="لم يتم إنشاء أي موازنات حتى الآن. ابدأ بإضافة موازنة جديدة لتنظيم الإنفاق."
              actionLabel="إنشاء موازنة جديدة"
              onAction={() => onSectionChange('new-budget')}
            />
          )}
        </>
      )}
    </PageLayout>
  )
}

