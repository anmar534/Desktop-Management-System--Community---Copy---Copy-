/**
 * مكون إدارة تنبيهات الميزانية
 * يتعامل مع عرض وإدارة تنبيهات تجاوز الميزانية والانحرافات
 */

import type React from 'react';
import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Check,
  X,
  Filter,
  Bell,
  BellOff
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { procurementCostIntegrationService } from '../../services/procurementCostIntegrationService'
import type { BudgetAlert, BudgetCategory } from '../../services/procurementCostIntegrationService'
import { formatCurrency } from '../../utils/formatters'

interface BudgetAlertManagementProps {
  projectId?: string
  onAlertUpdate?: () => void
}

const BudgetAlertManagement: React.FC<BudgetAlertManagementProps> = ({ 
  projectId, 
  onAlertUpdate 
}) => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<BudgetAlert | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState<BudgetAlert['severity'] | 'all'>('all')
  const [filterType, setFilterType] = useState<BudgetAlert['type'] | 'all'>('all')
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  useEffect(() => {
    if (projectId) {
      loadData()
    }
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const [alertsData, categoriesData] = await Promise.all([
        procurementCostIntegrationService.getProjectBudgetAlerts(projectId),
        procurementCostIntegrationService.getProjectBudgetCategories(projectId)
      ])

      setAlerts(alertsData)
      setBudgetCategories(categoriesData)
    } catch (error) {
      console.error('خطأ في تحميل التنبيهات:', error)
      toast.error('فشل في تحميل التنبيهات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await procurementCostIntegrationService.acknowledgeBudgetAlert(alertId, 'المستخدم الحالي')
      toast.success('تم إقرار التنبيه بنجاح')
      loadData()
      onAlertUpdate?.()
    } catch (error) {
      console.error('خطأ في إقرار التنبيه:', error)
      toast.error('فشل في إقرار التنبيه')
    }
  }

  const handleViewAlertDetails = (alert: BudgetAlert) => {
    setSelectedAlert(alert)
    setIsDetailDialogOpen(true)
  }

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'budget_exceeded': return <AlertTriangle className="h-4 w-4" />
      case 'budget_warning': return <AlertCircle className="h-4 w-4" />
      case 'variance_high': return <TrendingUp className="h-4 w-4" />
      case 'commitment_high': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getAlertTypeText = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'budget_exceeded': return 'تجاوز الميزانية'
      case 'budget_warning': return 'تحذير الميزانية'
      case 'variance_high': return 'انحراف عالي'
      case 'commitment_high': return 'التزامات عالية'
      default: return 'غير محدد'
    }
  }

  const getSeverityColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityText = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'low': return 'منخفض'
      case 'medium': return 'متوسط'
      case 'high': return 'عالي'
      case 'critical': return 'حرج'
      default: return 'غير محدد'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (showActiveOnly && !alert.isActive) return false
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    if (filterType !== 'all' && alert.type !== filterType) return false
    return true
  })

  const activeAlerts = alerts.filter(alert => alert.isActive)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل التنبيهات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات التنبيهات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي التنبيهات النشطة</p>
                  <p className="text-2xl font-bold">{activeAlerts.length}</p>
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
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">تنبيهات حرجة</p>
                  <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
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
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">تنبيهات عالية</p>
                  <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* التنبيهات الحرجة */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 ml-2" />
              تنبيهات حرجة تتطلب اهتماماً فورياً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => {
                const category = budgetCategories.find(cat => cat.id === alert.categoryId)
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex items-center">
                      {getAlertIcon(alert.type)}
                      <div className="mr-3">
                        <p className="font-medium text-red-800">{alert.message}</p>
                        <p className="text-sm text-red-600">
                          {category?.name && `فئة: ${category.name} • `}
                          {getAlertTypeText(alert.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAlertDetails(alert)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول التنبيهات */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>جميع التنبيهات</CardTitle>
              <CardDescription>
                إدارة وتتبع تنبيهات الميزانية والانحرافات
              </CardDescription>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant={showActiveOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowActiveOnly(!showActiveOnly)}
              >
                {showActiveOnly ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {showActiveOnly ? 'النشطة فقط' : 'جميع التنبيهات'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>الرسالة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>الخطورة</TableHead>
                <TableHead>العتبة</TableHead>
                <TableHead>القيمة الحالية</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const category = budgetCategories.find(cat => cat.id === alert.categoryId)
                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getAlertIcon(alert.type)}
                        <span className="mr-2">{getAlertTypeText(alert.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate" title={alert.message}>
                        {alert.message}
                      </p>
                    </TableCell>
                    <TableCell>{category?.name || 'عام'}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.threshold}%</TableCell>
                    <TableCell>{alert.currentValue.toFixed(1)}%</TableCell>
                    <TableCell>
                      {new Date(alert.createdAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      {alert.isActive ? (
                        <Badge className="bg-green-100 text-green-800">نشط</Badge>
                      ) : (
                        <Badge variant="outline">مُقر</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAlertDetails(alert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة تفاصيل التنبيه */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل التنبيه</DialogTitle>
            <DialogDescription>
              معلومات مفصلة عن التنبيه المحدد
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">النوع</Label>
                  <p className="flex items-center mt-1">
                    {getAlertIcon(selectedAlert.type)}
                    <span className="mr-2">{getAlertTypeText(selectedAlert.type)}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الخطورة</Label>
                  <Badge className={`mt-1 ${getSeverityColor(selectedAlert.severity)}`}>
                    {getSeverityText(selectedAlert.severity)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">الرسالة</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                  {selectedAlert.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">العتبة</Label>
                  <p className="mt-1 font-medium">{selectedAlert.threshold}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">القيمة الحالية</Label>
                  <p className="mt-1 font-medium">{selectedAlert.currentValue.toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">تاريخ الإنشاء</Label>
                <p className="mt-1">
                  {new Date(selectedAlert.createdAt).toLocaleString('ar-SA')}
                </p>
              </div>

              {selectedAlert.acknowledgedBy && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">تم الإقرار بواسطة</Label>
                  <p className="mt-1">{selectedAlert.acknowledgedBy}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAlert.acknowledgedAt && 
                      new Date(selectedAlert.acknowledgedAt).toLocaleString('ar-SA')
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  إغلاق
                </Button>
                {selectedAlert.isActive && (
                  <Button onClick={() => {
                    handleAcknowledgeAlert(selectedAlert.id)
                    setIsDetailDialogOpen(false)
                  }}>
                    إقرار التنبيه
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// مكون Label بسيط
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => (
  <label className={`block text-sm font-medium ${className}`}>
    {children}
  </label>
)

export default BudgetAlertManagement

