import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { procurementReportingService, TrendAnalysisData } from '../../services/procurementReportingService'
import { toast } from 'sonner'

interface ProcurementTrendAnalysisProps {
  className?: string
}

export function ProcurementTrendAnalysis({ className }: ProcurementTrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TrendAnalysisData[]>([])
  const [forecasts, setForecasts] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('purchase_value')
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadTrendAnalysis()
  }, [selectedMetric, selectedPeriod, dateRange])

  const loadTrendAnalysis = async () => {
    try {
      setLoading(true)
      const report = await procurementReportingService.generateTrendAnalysisReport(
        selectedMetric,
        selectedPeriod,
        dateRange.startDate,
        dateRange.endDate
      )
      
      setTrendData(report.data.trends || [])
      setForecasts(report.data.forecasts || [])
      setInsights(report.data.insights || [])
    } catch (error) {
      console.error('خطأ في تحميل تحليل الاتجاهات:', error)
      toast.error('فشل في تحميل تحليل الاتجاهات')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'negative':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'purchase_value':
        return 'قيمة المشتريات'
      case 'order_count':
        return 'عدد الطلبات'
      case 'supplier_count':
        return 'عدد الموردين'
      case 'delivery_time':
        return 'وقت التسليم'
      default:
        return metric
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly':
        return 'شهرياً'
      case 'quarterly':
        return 'ربع سنوي'
      case 'yearly':
        return 'سنوياً'
      default:
        return period
    }
  }

  // حساب الإحصائيات الإجمالية
  const totalValue = trendData.reduce((sum, trend) => sum + trend.value, 0)
  const averageChange = trendData.length > 0 
    ? trendData.reduce((sum, trend) => sum + trend.changePercentage, 0) / trendData.length
    : 0
  const positiveChanges = trendData.filter(trend => trend.changePercentage > 0).length
  const negativeChanges = trendData.filter(trend => trend.changePercentage < 0).length

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            تحليل الاتجاهات
          </CardTitle>
          <CardDescription>
            تحليل اتجاهات المشتريات والتنبؤ بالأداء المستقبلي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                المؤشر
              </label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase_value">قيمة المشتريات</SelectItem>
                  <SelectItem value="order_count">عدد الطلبات</SelectItem>
                  <SelectItem value="supplier_count">عدد الموردين</SelectItem>
                  <SelectItem value="delivery_time">وقت التسليم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                الفترة
              </label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                من تاريخ
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={loadTrendAnalysis} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 ml-2" />
                  تحديث التحليل
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي القيمة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">متوسط التغيير</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(averageChange)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  {getTrendIcon(averageChange > 0 ? 'up' : averageChange < 0 ? 'down' : 'stable')}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">فترات إيجابية</p>
                  <p className="text-2xl font-bold text-green-600">{positiveChanges}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">فترات سلبية</p>
                  <p className="text-2xl font-bold text-red-600">{negativeChanges}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* تبويبات التحليل */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">بيانات الاتجاه</TabsTrigger>
          <TabsTrigger value="forecasts">التنبؤات</TabsTrigger>
          <TabsTrigger value="insights">الرؤى والتوصيات</TabsTrigger>
        </TabsList>

        {/* بيانات الاتجاه */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الاتجاه - {getMetricLabel(selectedMetric)}</CardTitle>
              <CardDescription>
                تحليل {getPeriodLabel(selectedPeriod)} للفترة من {dateRange.startDate} إلى {dateRange.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="mr-2 text-gray-600">جاري التحليل...</span>
                </div>
              ) : trendData.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد بيانات متاحة للفترة المحددة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendData.map((trend, index) => (
                    <motion.div
                      key={trend.period}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{trend.period}</p>
                          <p className="text-sm text-gray-600">{getMetricLabel(trend.metric)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">
                            {selectedMetric === 'purchase_value' 
                              ? formatCurrency(trend.value)
                              : trend.value.toLocaleString()
                            }
                          </p>
                          <p className="text-sm text-gray-600">القيمة الحالية</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(trend.trend)}
                            <span className={`font-bold ${
                              trend.changePercentage > 0 ? 'text-green-600' : 
                              trend.changePercentage < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {formatPercentage(trend.changePercentage)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">التغيير</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* التنبؤات */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                التنبؤات المستقبلية
              </CardTitle>
              <CardDescription>
                توقعات الأداء للفترات القادمة بناءً على الاتجاهات الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد تنبؤات متاحة</p>
                  <p className="text-sm text-gray-500 mt-2">
                    يتطلب الأمر بيانات كافية لإنشاء التنبؤات
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forecasts.map((forecast, index) => (
                    <motion.div
                      key={forecast.period}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">{forecast.period}</p>
                          <p className="text-sm text-blue-700">
                            مستوى الثقة: {(forecast.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <p className="text-lg font-bold text-blue-900">
                          {selectedMetric === 'purchase_value' 
                            ? formatCurrency(forecast.value)
                            : forecast.value.toLocaleString()
                          }
                        </p>
                        <p className="text-sm text-blue-700">القيمة المتوقعة</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الرؤى والتوصيات */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                الرؤى والتوصيات
              </CardTitle>
              <CardDescription>
                تحليل ذكي للاتجاهات مع توصيات للتحسين
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد رؤى متاحة حالياً</p>
                  <p className="text-sm text-gray-500 mt-2">
                    سيتم إنشاء الرؤى عند توفر بيانات كافية
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {insight.message}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {insight.recommendation}
                          </p>
                          <Badge variant={
                            insight.type === 'positive' ? 'default' :
                            insight.type === 'negative' ? 'destructive' :
                            insight.type === 'warning' ? 'secondary' : 'outline'
                          }>
                            {insight.type === 'positive' ? 'إيجابي' :
                             insight.type === 'negative' ? 'سلبي' :
                             insight.type === 'warning' ? 'تحذير' : 'معلومة'
                            }
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
