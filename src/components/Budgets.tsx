'use client'

import { useMemo, useState } from 'react'
import type { ComponentProps } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import { DeleteConfirmation } from './ui/confirmation-dialog'
import {
  Target,
  Plus,
  Eye,
  Edit,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '../data/centralData'
import { formatDateValue } from '@/utils/formatters'
import { getProgressColor } from '../utils/statusColors'
import { useBudgets } from '@/application/hooks/useBudgets'

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>

interface BudgetStatusInfo {
  text: string
  variant: BadgeVariant
  color: string
  bgColor: string
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'المبالغ المصروفة',
      value: formatCurrency(budgetsData.overview.totalSpent),
      trend: 'up' as const,
      trendValue: '+6.2%',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'المتبقي من الموازنة',
      value: formatCurrency(budgetsData.overview.totalRemaining),
      trend: 'down' as const,
      trendValue: '-2.3%',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'معدل الاستخدام',
      value: `${budgetsData.overview.utilizationRate}%`,
      trend: 'up' as const,
      trendValue: '+1.8%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'موازنات نشطة',
      value: budgetsData.overview.activeBudgets.toString(),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'موازنات تحتاج انتباه',
      value: budgetsData.overview.overBudget.toString(),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
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

  const getStatusInfo = (status: string, utilization: number): BudgetStatusInfo => {
    if (utilization > 100) {
      return { text: 'متجاوزة للحد', variant: 'destructive', color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    if (utilization < 50 && status === 'active') {
      return { text: 'استخدام منخفض', variant: 'outline', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }

    switch (status) {
      case 'draft':
        return { text: 'مسودة', variant: 'secondary', color: 'text-gray-600', bgColor: 'bg-gray-50' }
      case 'active':
        return { text: 'نشطة', variant: 'default', color: 'text-purple-600', bgColor: 'bg-purple-50' }
      case 'completed':
        return { text: 'مكتملة', variant: 'success', color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'cancelled':
        return { text: 'ملغاة', variant: 'outline', color: 'text-gray-500', bgColor: 'bg-gray-50' }
      default:
        return { text: 'غير محددة', variant: 'outline', color: 'text-gray-500', bgColor: 'bg-gray-50' }
    }
  }

  const BudgetAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="إجمالي المخصص"
        value={formatCurrency(budgetsData.overview.totalAllocated)}
        subtitle="جميع الموازنات المعتمدة"
        icon={Target}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
      <DetailCard
        title="معدل الاستخدام"
        value={`${budgetsData.overview.utilizationRate}%`}
        subtitle="نسبة الصرف إلى المخصص"
        icon={PieChart}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <DetailCard
        title="موازنات متجاوزة"
        value={budgetsData.overview.overBudget.toString()}
        subtitle="تحتاج معالجة عاجلة"
        icon={AlertTriangle}
        color="text-red-600"
        bgColor="bg-red-50"
      />
      <DetailCard
        title="استخدام منخفض"
        value={budgetsData.overview.underUtilized.toString()}
        subtitle="فرص لإعادة التوزيع"
        icon={TrendingDown}
        color="text-yellow-600"
        bgColor="bg-yellow-50"
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
      title="إدارة الموازنة"
      description="إدارة ومتابعة الموازنات والمخصصات المالية"
      icon={Target}
      gradientFrom="from-purple-600"
      gradientTo="to-purple-700"
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
              const statusInfo = getStatusInfo(budget.status, budget.utilizationPercentage)
              const remainingAmount = budget.totalAmount - budget.spentAmount

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
                                <Badge variant={statusInfo.variant} className={statusInfo.color}>
                                  {statusInfo.text}
                                </Badge>
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
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm text-muted-foreground">المخصص</div>
                              <div className="text-lg font-semibold text-blue-600">
                                {formatCurrency(budget.totalAmount)}
                              </div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <div className="text-sm text-muted-foreground">المصروف</div>
                              <div className="text-lg font-semibold text-orange-600">
                                {formatCurrency(budget.spentAmount)}
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg ${remainingAmount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                              <div className="text-sm text-muted-foreground">المتبقي</div>
                              <div className={`text-lg font-semibold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                budget.utilizationPercentage > 100 ? 'text-red-600' :
                                budget.utilizationPercentage > 90 ? 'text-orange-600' :
                                budget.utilizationPercentage < 50 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {budget.utilizationPercentage}%
                              </span>
                            </div>

                            <Progress
                              value={Math.min(budget.utilizationPercentage, 100)}
                              className="h-3 bg-gray-200"
                              indicatorClassName={`${getProgressColor(budget.utilizationPercentage)} transition-all duration-300`}
                            />

                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg mb-4 ${statusInfo.bgColor}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {budget.utilizationPercentage > 100 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : budget.utilizationPercentage < 50 ? (
                                <TrendingDown className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              <span className={`text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {budget.utilizationPercentage > 100
                                ? `تجاوز الموازنة بـ ${formatCurrency(Math.abs(remainingAmount))}`
                                : budget.utilizationPercentage < 50
                                  ? `استخدام منخفض: ${100 - budget.utilizationPercentage}% غير مستغل`
                                  : 'في المسار الصحيح'}
                            </div>
                          </div>

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
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
