/**
 * مكون التكامل الشامل للنظام
 * يعرض حالة التكامل بين جميع وحدات النظام
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import type {
  SystemModule,
  DataFlow,
  IntegrationSummary,
  ConflictResolution,
  RealTimeUpdate,
} from '@/application/services/unifiedSystemIntegrationService'
import { unifiedSystemIntegrationService } from '@/application/services/unifiedSystemIntegrationService'

const UnifiedSystemIntegration: React.FC = () => {
  const [modules, setModules] = useState<SystemModule[]>([])
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([])
  const [summary, setSummary] = useState<IntegrationSummary | null>(null)
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([])
  const [recentUpdates, setRecentUpdates] = useState<RealTimeUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await unifiedSystemIntegrationService.initialize()

      const [modulesData, dataFlowsData, summaryData, conflictsData, updatesData] =
        await Promise.all([
          unifiedSystemIntegrationService.getSystemModules(),
          unifiedSystemIntegrationService.getDataFlows(),
          unifiedSystemIntegrationService.getIntegrationSummary(),
          unifiedSystemIntegrationService.getPendingConflicts(),
          unifiedSystemIntegrationService.getRecentUpdates(20),
        ])

      setModules(modulesData)
      setDataFlows(dataFlowsData)
      setSummary(summaryData)
      setConflicts(conflictsData)
      setRecentUpdates(updatesData)
    } catch (error) {
      console.error('خطأ في تحميل بيانات التكامل:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      await unifiedSystemIntegrationService.syncAllData()
      await loadData()
    } catch (error) {
      console.error('خطأ في المزامنة:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'maintenance':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-2 text-lg">جاري تحميل بيانات التكامل...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">التكامل الشامل للنظام</h2>
          <p className="text-muted-foreground">مراقبة وإدارة التكامل بين جميع وحدات النظام</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={handleSyncAll} disabled={syncing}>
            <Database className={`h-4 w-4 ml-2 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'جاري المزامنة...' : 'مزامنة جميع البيانات'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">وحدات النظام</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.activeModules}/{summary.totalModules}
                </div>
                <p className="text-xs text-muted-foreground">
                  وحدة نشطة من إجمالي {summary.totalModules}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تدفقات البيانات</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.activeDataFlows}/{summary.totalDataFlows}
                </div>
                <p className="text-xs text-muted-foreground">
                  تدفق نشط من إجمالي {summary.totalDataFlows}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
                <Activity className={`h-4 w-4 ${getHealthColor(summary.systemHealth)}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(summary.systemHealth)}`}>
                  {summary.systemHealth === 'excellent'
                    ? 'ممتازة'
                    : summary.systemHealth === 'good'
                      ? 'جيدة'
                      : summary.systemHealth === 'warning'
                        ? 'تحذير'
                        : 'حرجة'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getSyncStatusIcon(summary.overallSyncStatus)}
                  <span className="text-xs text-muted-foreground">
                    {summary.overallSyncStatus === 'synced'
                      ? 'متزامن'
                      : summary.overallSyncStatus === 'syncing'
                        ? 'جاري المزامنة'
                        : 'خطأ في المزامنة'}
                  </span>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">اتساق البيانات</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(summary.dataConsistencyScore)}%
                </div>
                <Progress value={summary.dataConsistencyScore} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">نقاط الاتساق</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">وحدات النظام</TabsTrigger>
          <TabsTrigger value="dataflows">تدفقات البيانات</TabsTrigger>
          <TabsTrigger value="conflicts">التضاربات</TabsTrigger>
          <TabsTrigger value="updates">التحديثات الأخيرة</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(module.status)}`} />
                        <Badge variant="outline">{module.version}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.nameEn}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>عدد البيانات:</span>
                        <span className="font-medium">{module.dataCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الأخطاء:</span>
                        <span
                          className={`font-medium ${module.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {module.errorCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>آخر مزامنة:</span>
                        <span className="text-muted-foreground">
                          {new Date(module.lastSync).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      {module.dependencies.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">يعتمد على:</p>
                          <div className="flex flex-wrap gap-1">
                            {module.dependencies.map((dep) => (
                              <Badge key={dep} variant="secondary" className="text-xs">
                                {modules.find((m) => m.id === dep)?.name || dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedModule(module)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            تفاصيل
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{module.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4" dir="rtl">
                            <div>
                              <h4 className="font-medium mb-2">معلومات الوحدة</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>الاسم بالإنجليزية:</span>
                                  <span>{module.nameEn}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>الإصدار:</span>
                                  <span>{module.version}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>الحالة:</span>
                                  <Badge
                                    variant={module.status === 'active' ? 'default' : 'secondary'}
                                  >
                                    {module.status === 'active'
                                      ? 'نشط'
                                      : module.status === 'inactive'
                                        ? 'غير نشط'
                                        : 'صيانة'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 ml-1" />
                        إعدادات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dataflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dataFlows.map((flow, index) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {modules.find((m) => m.id === flow.sourceModule)?.name} →{' '}
                        {modules.find((m) => m.id === flow.targetModule)?.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getSyncStatusIcon(flow.status)}
                        <Badge variant={flow.status === 'active' ? 'default' : 'secondary'}>
                          {flow.status === 'active'
                            ? 'نشط'
                            : flow.status === 'paused'
                              ? 'متوقف'
                              : 'خطأ'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">نوع البيانات: {flow.dataType}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>تكرار المزامنة:</span>
                        <Badge variant="outline">
                          {flow.syncFrequency === 'realtime'
                            ? 'فوري'
                            : flow.syncFrequency === 'hourly'
                              ? 'كل ساعة'
                              : 'يومي'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>السجلات المعالجة:</span>
                        <span className="font-medium">
                          {flow.recordsProcessed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الأخطاء:</span>
                        <span
                          className={`font-medium ${flow.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {flow.errorCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>آخر مزامنة:</span>
                        <span className="text-muted-foreground">
                          {new Date(flow.lastSync).toLocaleString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          {conflicts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد تضاربات</h3>
                  <p className="text-muted-foreground">
                    جميع البيانات متسقة ولا توجد تضاربات تحتاج إلى حل
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          تضارب في البيانات
                        </CardTitle>
                        <Badge
                          variant={
                            conflict.severity === 'critical'
                              ? 'destructive'
                              : conflict.severity === 'high'
                                ? 'destructive'
                                : conflict.severity === 'medium'
                                  ? 'default'
                                  : 'secondary'
                          }
                        >
                          {conflict.severity === 'critical'
                            ? 'حرج'
                            : conflict.severity === 'high'
                              ? 'عالي'
                              : conflict.severity === 'medium'
                                ? 'متوسط'
                                : 'منخفض'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{conflict.description}</p>
                        <div className="flex justify-between text-sm">
                          <span>الوحدة المصدر:</span>
                          <span className="font-medium">
                            {modules.find((m) => m.id === conflict.sourceModule)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>الوحدة المستهدفة:</span>
                          <span className="font-medium">
                            {modules.find((m) => m.id === conflict.targetModule)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>تاريخ الإنشاء:</span>
                          <span className="text-muted-foreground">
                            {new Date(conflict.createdAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            حل التضارب
                          </Button>
                          <Button size="sm" variant="ghost">
                            تجاهل
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحديثات الأخيرة</CardTitle>
              <p className="text-sm text-muted-foreground">
                آخر {recentUpdates.length} تحديث في النظام
              </p>
            </CardHeader>
            <CardContent>
              {recentUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد تحديثات حديثة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUpdates.map((update, index) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            update.operation === 'create'
                              ? 'bg-green-500'
                              : update.operation === 'update'
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {update.operation === 'create'
                              ? 'إنشاء'
                              : update.operation === 'update'
                                ? 'تحديث'
                                : 'حذف'}{' '}
                            {update.dataType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            في {modules.find((m) => m.id === update.moduleId)?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleString('ar-SA')}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {update.propagated ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          )}
                          <span className="text-xs">
                            {update.propagated ? 'تم النشر' : 'في الانتظار'}
                          </span>
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

export default UnifiedSystemIntegration
