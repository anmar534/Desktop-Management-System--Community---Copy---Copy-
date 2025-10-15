import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Star, 
  Clock, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react'
import { procurementReportingService, SupplierPerformanceMetrics, ProcurementKPI } from '../../services/procurementReportingService'

interface SupplierPerformanceReportProps {
  className?: string
  supplierIds?: string[]
  startDate?: string
  endDate?: string
}

export function SupplierPerformanceReport({ 
  className, 
  supplierIds, 
  startDate = '', 
  endDate = '' 
}: SupplierPerformanceReportProps) {
  const [metrics, setMetrics] = useState<SupplierPerformanceMetrics[]>([])
  const [kpis, setKpis] = useState<ProcurementKPI[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierPerformanceMetrics | null>(null)

  useEffect(() => {
    loadPerformanceData()
  }, [supplierIds, startDate, endDate])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      const report = await procurementReportingService.generateSupplierPerformanceReport(
        startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0],
        supplierIds
      )
      setMetrics(report.data.metrics || [])
      setKpis(report.data.kpis || [])
    } catch (error) {
      console.error('خطأ في تحميل بيانات الأداء:', error)
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

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'ممتاز'
    if (score >= 80) return 'جيد جداً'
    if (score >= 70) return 'جيد'
    if (score >= 60) return 'مقبول'
    return 'ضعيف'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getKPIStatus = (status: string) => {
    switch (status) {
      case 'excellent':
        return { color: 'text-green-600 bg-green-100', icon: <CheckCircle className="h-4 w-4" /> }
      case 'good':
        return { color: 'text-blue-600 bg-blue-100', icon: <Target className="h-4 w-4" /> }
      case 'warning':
        return { color: 'text-yellow-600 bg-yellow-100', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'critical':
        return { color: 'text-red-600 bg-red-100', icon: <AlertTriangle className="h-4 w-4" /> }
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: <Target className="h-4 w-4" /> }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الأداء...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const status = getKPIStatus(kpi.status)
          const percentage = (kpi.value / kpi.target) * 100
          
          return (
            <motion.div
              key={kpi.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${status.color}`}>
                      {status.icon}
                    </div>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpi.value.toFixed(1)} {kpi.unit}
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>الهدف: {kpi.target} {kpi.unit}</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{kpi.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* تبويبات التقرير */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="detailed">تفاصيل الموردين</TabsTrigger>
          <TabsTrigger value="comparison">مقارنة الأداء</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* إحصائيات عامة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  إحصائيات عامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">إجمالي الموردين</span>
                    <span className="font-bold text-lg">{metrics.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">متوسط النقاط</span>
                    <span className="font-bold text-lg">
                      {metrics.length > 0 
                        ? (metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length).toFixed(1)
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">إجمالي القيمة</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(metrics.reduce((sum, m) => sum + m.totalValue, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">متوسط التسليم في الوقت</span>
                    <span className="font-bold text-lg">
                      {metrics.length > 0 
                        ? (metrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) / metrics.length).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* توزيع الأداء */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'ممتاز (90+)', count: metrics.filter(m => m.overallScore >= 90).length, color: 'bg-green-500' },
                    { label: 'جيد جداً (80-89)', count: metrics.filter(m => m.overallScore >= 80 && m.overallScore < 90).length, color: 'bg-blue-500' },
                    { label: 'جيد (70-79)', count: metrics.filter(m => m.overallScore >= 70 && m.overallScore < 80).length, color: 'bg-yellow-500' },
                    { label: 'ضعيف (<70)', count: metrics.filter(m => m.overallScore < 70).length, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أفضل الموردين */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                أفضل 5 موردين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .slice(0, 5)
                  .map((supplier, index) => (
                    <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{supplier.supplierName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPerformanceColor(supplier.overallScore)}>
                              {getPerformanceLabel(supplier.overallScore)}
                            </Badge>
                            {getTrendIcon(supplier.trend)}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold">{supplier.overallScore.toFixed(1)}</p>
                        <p className="text-sm text-gray-600">نقطة</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تفاصيل الموردين */}
        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل أداء الموردين</CardTitle>
              <CardDescription>
                تقييم شامل لجميع الموردين مع المؤشرات الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المورد</TableHead>
                      <TableHead>النقاط الإجمالية</TableHead>
                      <TableHead>التسليم في الوقت</TableHead>
                      <TableHead>تقييم الجودة</TableHead>
                      <TableHead>إجمالي الطلبات</TableHead>
                      <TableHead>إجمالي القيمة</TableHead>
                      <TableHead>الاتجاه</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((supplier) => (
                      <TableRow 
                        key={supplier.supplierId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.supplierName}</p>
                            <Badge className={getPerformanceColor(supplier.overallScore)} variant="secondary">
                              {getPerformanceLabel(supplier.overallScore)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{supplier.overallScore.toFixed(1)}</span>
                            <Progress value={supplier.overallScore} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{supplier.onTimeDeliveryRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {supplier.qualityRating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{supplier.totalOrders}</TableCell>
                        <TableCell>{formatCurrency(supplier.totalValue)}</TableCell>
                        <TableCell>{getTrendIcon(supplier.trend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* مقارنة الأداء */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة الأداء</CardTitle>
              <CardDescription>
                مقارنة أداء الموردين مع المعايير المرجعية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">مخططات المقارنة قيد التطوير</p>
                <p className="text-sm text-gray-500 mt-2">
                  ستتضمن مقارنات تفاعلية مع معايير الصناعة
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
