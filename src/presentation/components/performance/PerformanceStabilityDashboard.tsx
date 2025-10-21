/**
 * لوحة تحكم الأداء والاستقرار
 * Performance and Stability Dashboard
 * 
 * مراقبة وتحسين أداء النظام واستقراره
 * Monitor and optimize system performance and stability
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  HardDrive,
  Cpu
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'

import type {
  SystemHealth,
  PerformanceMetrics,
  OptimizationRule
} from '../../services/performanceOptimizationService';
import { 
  performanceOptimizationService
} from '../../services/performanceOptimizationService'

interface PerformanceStabilityDashboardProps {
  className?: string
}

const PerformanceStabilityDashboard: React.FC<PerformanceStabilityDashboardProps> = ({
  className = ''
}) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [optimizations, setOptimizations] = useState<OptimizationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setIsRefreshing(true)
      
      // تهيئة الخدمة إذا لم تكن مهيأة
      await performanceOptimizationService.initialize()
      
      // الحصول على تقرير الأداء الشامل
      const report = await performanceOptimizationService.getPerformanceReport()
      
      setSystemHealth(report.health)
      setMetrics(report.metrics)
      setOptimizations(report.optimizations)
      
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'good': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <TrendingDown className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getHealthText = (health: string) => {
    switch (health) {
      case 'excellent': return 'ممتاز'
      case 'good': return 'جيد'
      case 'warning': return 'تحذير'
      case 'critical': return 'حرج'
      default: return 'غير معروف'
    }
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`} dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>جاري تحميل بيانات الأداء...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم الأداء والاستقرار</h1>
          <p className="text-muted-foreground">
            مراقبة وتحسين أداء النظام واستقراره
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-2" />
            إعدادات
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Overall Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصحة العامة</CardTitle>
              {getHealthIcon(systemHealth.overall)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getHealthColor(systemHealth.overall)}>
                  {getHealthText(systemHealth.overall)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                آخر فحص: {new Date(systemHealth.lastCheck).toLocaleTimeString('ar-SA')}
              </p>
            </CardContent>
          </Card>

          {/* Performance Score */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نقاط الأداء</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.performance.score}</div>
              <Progress value={systemHealth.performance.score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                متوسط الاستجابة: {systemHealth.performance.avgResponseTime.toFixed(0)}ms
              </p>
            </CardContent>
          </Card>

          {/* Stability Score */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نقاط الاستقرار</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.stability.score}</div>
              <Progress value={systemHealth.stability.score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                معدل الأخطاء: {systemHealth.stability.errorRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.memory.current.toFixed(0)} MB</div>
              <Progress 
                value={(systemHealth.memory.current / systemHealth.memory.peak) * 100} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                الذروة: {systemHealth.memory.peak.toFixed(0)} MB
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations */}
      {systemHealth?.recommendations && systemHealth.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">توصيات التحسين:</div>
              <ul className="list-disc list-inside space-y-1">
                {systemHealth.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Detailed Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">المقاييس</TabsTrigger>
            <TabsTrigger value="optimizations">التحسينات</TabsTrigger>
            <TabsTrigger value="errors">الأخطاء</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 ml-2" />
                  مقاييس الأداء الحديثة
                </CardTitle>
                <CardDescription>
                  آخر {metrics.length} مقياس أداء
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.slice(-10).map((metric, index) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge variant={metric.status === 'success' ? 'default' : 'destructive'}>
                          {metric.operation}
                        </Badge>
                        <span className="text-sm">{metric.component}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{metric.duration.toFixed(0)}ms</span>
                        <HardDrive className="h-3 w-3" />
                        <span>{metric.memoryUsage.toFixed(0)}MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 ml-2" />
                  قواعد التحسين
                </CardTitle>
                <CardDescription>
                  قواعد التحسين المطبقة على النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizations.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{opt.name}</div>
                        <div className="text-sm text-muted-foreground">{opt.description}</div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge variant={opt.enabled ? 'default' : 'secondary'}>
                          {opt.enabled ? 'مفعل' : 'معطل'}
                        </Badge>
                        <Badge variant="outline">{opt.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 ml-2" />
                  سجل الأخطاء
                </CardTitle>
                <CardDescription>
                  الأخطاء الحديثة والمعلقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth?.errors.recent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>لا توجد أخطاء حديثة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {systemHealth?.errors.recent.map((error) => (
                      <div key={error.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive">{error.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(error.timestamp).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-sm">{error.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{error.component}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 ml-2" />
                  تحليلات الأداء
                </CardTitle>
                <CardDescription>
                  تحليلات مفصلة لأداء النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">إحصائيات الكاش</h4>
                    <div className="text-2xl font-bold">
                      {systemHealth?.performance.cacheHitRate.toFixed(1)}%
                    </div>
                    <Progress value={systemHealth?.performance.cacheHitRate} />
                    <p className="text-xs text-muted-foreground">معدل إصابة الكاش</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">الاستعلامات البطيئة</h4>
                    <div className="text-2xl font-bold">
                      {systemHealth?.performance.slowQueries}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      من أصل {systemHealth?.performance.optimizedQueries} استعلام
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default PerformanceStabilityDashboard


