/**
 * Optimization Dashboard Component
 * مكون لوحة تحكم التحسين
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react'
import { performanceOptimizationService } from '@/services/performanceOptimizationService'
import { systemIntegrationService } from '@/services/systemIntegrationService'

interface OptimizationDashboardProps {
  className?: string
}

export const OptimizationDashboard: React.FC<OptimizationDashboardProps> = ({ 
  className = '' 
}) => {
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  const [tenderSystems, setTenderSystems] = useState<any[]>([])
  const [financialSystems, setFinancialSystems] = useState<any[]>([])
  const [syncHistory, setSyncHistory] = useState<any[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // جلب تقرير الأداء
      const report = performanceOptimizationService.getPerformanceReport()
      setPerformanceReport(report)

      // جلب أنظمة التكامل
      const [tenders, financials, history] = await Promise.all([
        systemIntegrationService.getTenderSystems(),
        systemIntegrationService.getFinancialSystems(),
        systemIntegrationService.getSyncHistory(10)
      ])

      setTenderSystems(tenders)
      setFinancialSystems(financials)
      setSyncHistory(history)

    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizePerformance = async () => {
    try {
      setIsOptimizing(true)
      
      // تشغيل تحسين الذاكرة
      performanceOptimizationService.optimizeMemory()
      
      // إعادة تحميل التقرير
      await new Promise(resolve => setTimeout(resolve, 1000))
      const report = performanceOptimizationService.getPerformanceReport()
      setPerformanceReport(report)

    } catch (error) {
      console.error('خطأ في تحسين الأداء:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleSyncSystem = async (systemType: 'tender' | 'financial', systemId: string) => {
    try {
      setIsSyncing(true)
      
      if (systemType === 'tender') {
        await systemIntegrationService.syncProjectsFromTender(systemId)
      } else {
        // مزامنة النظام المالي لجميع المشاريع
        console.log('مزامنة النظام المالي...')
      }
      
      // إعادة تحميل البيانات
      await loadDashboardData()

    } catch (error) {
      console.error('خطأ في المزامنة:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'نجح'
      case 'error': return 'فشل'
      case 'pending': return 'قيد التنفيذ'
      default: return 'غير معروف'
    }
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`} dir="rtl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="mr-2 text-lg">جاري تحميل بيانات التحسين...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم التحسين والتكامل</h1>
          <p className="text-gray-600 mt-1">مراقبة الأداء وإدارة التكامل مع الأنظمة الخارجية</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOptimizePerformance}
            disabled={isOptimizing}
            variant="outline"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Zap className="h-4 w-4 ml-2" />
            )}
            تحسين الأداء
          </Button>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="integration">التكامل</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceReport && (
            <>
              {/* Performance Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">متوسط وقت الاستعلام</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceReport.metrics.averageQueryTime.toFixed(0)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceReport.metrics.totalQueries} استعلام
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">معدل نجاح الكاش</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceReport.cacheStats.hitRate.toFixed(1)}%
                    </div>
                    <Progress value={performanceReport.cacheStats.hitRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceReport.metrics.errorRate.toFixed(1)}%
                    </div>
                    <Progress 
                      value={performanceReport.metrics.errorRate} 
                      className="mt-2"
                      // @ts-ignore
                      indicatorClassName={performanceReport.metrics.errorRate > 5 ? "bg-red-500" : "bg-green-500"}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(performanceReport.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceReport.cacheStats.totalEntries} عنصر في الكاش
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Recommendations */}
              {performanceReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 ml-2" />
                      توصيات التحسين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceReport.recommendations.map((recommendation: string, index: number) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{recommendation}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          {/* Tender Systems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 ml-2" />
                أنظمة المنافسات
              </CardTitle>
              <CardDescription>
                إدارة التكامل مع أنظمة المنافسات الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenderSystems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد أنظمة منافسات مكونة</p>
              ) : (
                <div className="space-y-3">
                  {tenderSystems.map((system) => (
                    <div key={system.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(system.syncStatus)}`} />
                        <div>
                          <p className="font-medium">{system.name}</p>
                          <p className="text-sm text-gray-500">
                            آخر مزامنة: {new Date(system.lastSync).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={system.isActive ? 'default' : 'secondary'}>
                          {system.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Badge variant="outline">
                          {getStatusText(system.syncStatus)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleSyncSystem('tender', system.id)}
                          disabled={isSyncing || !system.isActive}
                        >
                          {isSyncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'مزامنة'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Systems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 ml-2" />
                الأنظمة المالية
              </CardTitle>
              <CardDescription>
                إدارة التكامل مع الأنظمة المالية والمحاسبية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialSystems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد أنظمة مالية مكونة</p>
              ) : (
                <div className="space-y-3">
                  {financialSystems.map((system) => (
                    <div key={system.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(system.syncStatus)}`} />
                        <div>
                          <p className="font-medium">{system.name}</p>
                          <p className="text-sm text-gray-500">
                            آخر مزامنة: {new Date(system.lastSync).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={system.isActive ? 'default' : 'secondary'}>
                          {system.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Badge variant="outline">
                          {getStatusText(system.syncStatus)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleSyncSystem('financial', system.id)}
                          disabled={isSyncing || !system.isActive}
                        >
                          {isSyncing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'مزامنة'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 ml-2" />
                سجل المزامنة
              </CardTitle>
              <CardDescription>
                تاريخ عمليات المزامنة مع الأنظمة الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد عمليات مزامنة سابقة</p>
              ) : (
                <div className="space-y-3">
                  {syncHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {entry.result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            مزامنة {entry.type === 'tender' ? 'المنافسات' : 'النظام المالي'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.timestamp).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm">
                          <span className="text-green-600">{entry.result.recordsCreated} جديد</span>
                          {' • '}
                          <span className="text-blue-600">{entry.result.recordsUpdated} محدث</span>
                          {entry.result.errors.length > 0 && (
                            <>
                              {' • '}
                              <span className="text-red-600">{entry.result.errors.length} خطأ</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.result.duration}ms
                        </p>
                      </div>
                    </div>
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

export default OptimizationDashboard


