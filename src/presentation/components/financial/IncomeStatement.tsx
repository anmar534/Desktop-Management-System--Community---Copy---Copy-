/**
 * مكون قائمة الدخل
 * يعرض قائمة الدخل الشاملة مع التحليلات المالية
 */

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  financialStatementsService,
  type IncomeStatement as IncomeStatementType,
} from '@/application/services/financialStatementsService'
import { formatCurrency } from '@/shared/utils/formatters/formatters'

// ===========================
// 📊 Types & Interfaces
// ===========================

interface IncomeStatementProps {
  period?: string
  onPeriodChange?: (period: string) => void
  showComparison?: boolean
}

interface FinancialMetric {
  label: string
  value: number
  percentage?: number
  trend?: 'up' | 'down' | 'stable'
  isGood?: boolean
}

// ===========================
// 🎨 Component
// ===========================

export const IncomeStatement: React.FC<IncomeStatementProps> = ({
  period = new Date().getFullYear().toString(),
  onPeriodChange,
  showComparison = true,
}) => {
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatementType[]>([])
  const [currentStatement, setCurrentStatement] = useState<IncomeStatementType | null>(null)
  const [previousStatement, setPreviousStatement] = useState<IncomeStatementType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ===========================
  // 🔄 Data Loading
  // ===========================

  const loadIncomeStatements = async () => {
    try {
      setIsLoading(true)
      const statements = await financialStatementsService.getIncomeStatements()
      setIncomeStatements(statements)

      // البحث عن القائمة الحالية والسابقة
      const current = statements.find((stmt) => stmt.period === period)
      const previous = statements.find((stmt) => stmt.period === (parseInt(period) - 1).toString())

      setCurrentStatement(current || null)
      setPreviousStatement(previous || null)
    } catch (error) {
      console.error('خطأ في تحميل قوائم الدخل:', error)
      toast.error('فشل في تحميل قوائم الدخل')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await loadIncomeStatements()
    setIsRefreshing(false)
    toast.success('تم تحديث البيانات بنجاح')
  }

  useEffect(() => {
    loadIncomeStatements()
  }, [period])

  // ===========================
  // 📊 Calculations
  // ===========================

  const metrics = useMemo((): FinancialMetric[] => {
    if (!currentStatement) return []

    const metrics: FinancialMetric[] = [
      {
        label: 'إجمالي الإيرادات',
        value: currentStatement.revenue.totalRevenue,
        percentage: 100,
        trend: previousStatement
          ? currentStatement.revenue.totalRevenue > previousStatement.revenue.totalRevenue
            ? 'up'
            : 'down'
          : 'stable',
        isGood: true,
      },
      {
        label: 'إجمالي الربح',
        value: currentStatement.grossProfit,
        percentage: currentStatement.grossProfitMargin,
        trend: previousStatement
          ? currentStatement.grossProfit > previousStatement.grossProfit
            ? 'up'
            : 'down'
          : 'stable',
        isGood: currentStatement.grossProfitMargin > 20,
      },
      {
        label: 'الدخل التشغيلي',
        value: currentStatement.operatingIncome,
        percentage: currentStatement.operatingMargin,
        trend: previousStatement
          ? currentStatement.operatingIncome > previousStatement.operatingIncome
            ? 'up'
            : 'down'
          : 'stable',
        isGood: currentStatement.operatingMargin > 15,
      },
      {
        label: 'صافي الدخل',
        value: currentStatement.netIncome,
        percentage: currentStatement.netProfitMargin,
        trend: previousStatement
          ? currentStatement.netIncome > previousStatement.netIncome
            ? 'up'
            : 'down'
          : 'stable',
        isGood: currentStatement.netProfitMargin > 10,
      },
    ]

    return metrics
  }, [currentStatement, previousStatement])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (isGood: boolean) => {
    return isGood ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        جيد
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        يحتاج تحسين
      </Badge>
    )
  }

  // ===========================
  // 🎨 Render
  // ===========================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!currentStatement) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            لا توجد قائمة دخل للفترة {period}
          </h3>
          <p className="text-gray-500 text-center mb-4">لم يتم إنشاء قائمة دخل لهذه الفترة بعد</p>
          <Button
            onClick={() => {
              /* TODO: إضافة وظيفة إنشاء قائمة دخل جديدة */
            }}
          >
            إنشاء قائمة دخل جديدة
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">قائمة الدخل - {period}</h2>
          <p className="text-gray-600 mt-1">
            من {new Date(currentStatement.startDate).toLocaleDateString('ar-SA')}
            إلى {new Date(currentStatement.endDate).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metric.value)}
                  </div>
                  {metric.percentage !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{metric.percentage.toFixed(1)}%</span>
                      {getStatusBadge(metric.isGood || false)}
                    </div>
                  )}
                  {metric.percentage !== undefined && (
                    <Progress value={Math.min(metric.percentage, 100)} className="h-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Statement */}
      <Tabs defaultValue="statement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statement">قائمة الدخل التفصيلية</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المالي</TabsTrigger>
          {showComparison && previousStatement && (
            <TabsTrigger value="comparison">المقارنة السنوية</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="statement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                قائمة الدخل التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* الإيرادات */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">الإيرادات</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>إيرادات المشاريع</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.revenue.projectRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إيرادات المنافسات</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.revenue.tenderRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إيرادات أخرى</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.revenue.otherRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>إجمالي الإيرادات</span>
                      <span className="text-green-600">
                        {formatCurrency(currentStatement.revenue.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* تكلفة البضاعة المباعة */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    تكلفة البضاعة المباعة
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>المواد المباشرة</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.costOfGoodsSold.directMaterials)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>العمالة المباشرة</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.costOfGoodsSold.directLabor)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>المصروفات المباشرة</span>
                      <span className="font-medium">
                        {formatCurrency(currentStatement.costOfGoodsSold.directExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>إجمالي تكلفة البضاعة المباعة</span>
                      <span className="text-red-600">
                        {formatCurrency(currentStatement.costOfGoodsSold.totalCOGS)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* الربح الإجمالي */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-800">الربح الإجمالي</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(currentStatement.grossProfit)}
                      </div>
                      <div className="text-sm text-green-600">
                        هامش الربح: {currentStatement.grossProfitMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>التحليل المالي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                سيتم إضافة التحليل المالي المتقدم قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showComparison && previousStatement && (
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>المقارنة السنوية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  سيتم إضافة المقارنة السنوية قريباً
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default IncomeStatement
