/**
 * مكون ربط المشتريات بالتكاليف
 * يتعامل مع ربط أوامر الشراء بميزانيات المشاريع وتحليل الانحرافات
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
  DialogTrigger,
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Link,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { procurementCostIntegrationService } from '@/services/procurementCostIntegrationService'
import type { 
  ProcurementCostLink, 
  BudgetCategory, 
  ProjectBudgetSummary,
  BudgetAlert,
  CostVarianceAnalysis
} from '@/services/procurementCostIntegrationService'
import { formatCurrency } from '@/shared/utils/formatters/formatters'

interface ProcurementCostIntegrationProps {
  projectId?: string
}

const ProcurementCostIntegration: React.FC<ProcurementCostIntegrationProps> = ({ projectId }) => {
  const [budgetSummary, setBudgetSummary] = useState<ProjectBudgetSummary | null>(null)
  const [procurementLinks, setProcurementLinks] = useState<ProcurementCostLink[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([])
  const [varianceAnalysis, setVarianceAnalysis] = useState<CostVarianceAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [isCreateLinkDialogOpen, setIsCreateLinkDialogOpen] = useState(false)
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false)

  // بيانات النموذج
  const [linkFormData, setLinkFormData] = useState({
    purchaseOrderId: '',
    budgetCategoryId: '',
    allocatedAmount: 0,
    notes: ''
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    nameEn: '',
    plannedAmount: 0,
    description: '',
    parentCategoryId: ''
  })

  useEffect(() => {
    if (selectedProjectId) {
      loadData()
    }
  }, [selectedProjectId])

  const loadData = async () => {
    if (!selectedProjectId) return

    setIsLoading(true)
    try {
      const [summary, links, categories, alerts, analysis] = await Promise.all([
        procurementCostIntegrationService.getProjectBudgetSummary(selectedProjectId),
        procurementCostIntegrationService.getProjectProcurementLinks(selectedProjectId),
        procurementCostIntegrationService.getProjectBudgetCategories(selectedProjectId),
        procurementCostIntegrationService.getProjectBudgetAlerts(selectedProjectId),
        procurementCostIntegrationService.analyzeCostVariance(selectedProjectId)
      ])

      setBudgetSummary(summary)
      setProcurementLinks(links)
      setBudgetCategories(categories)
      setBudgetAlerts(alerts.filter(alert => alert.isActive))
      setVarianceAnalysis(analysis)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!selectedProjectId || !linkFormData.purchaseOrderId || !linkFormData.budgetCategoryId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      await procurementCostIntegrationService.linkPurchaseOrderToBudget({
        purchaseOrderId: linkFormData.purchaseOrderId,
        projectId: selectedProjectId,
        budgetCategoryId: linkFormData.budgetCategoryId,
        allocatedAmount: linkFormData.allocatedAmount,
        notes: linkFormData.notes
      })

      toast.success('تم ربط أمر الشراء بالميزانية بنجاح')
      setIsCreateLinkDialogOpen(false)
      setLinkFormData({ purchaseOrderId: '', budgetCategoryId: '', allocatedAmount: 0, notes: '' })
      loadData()
    } catch (error) {
      console.error('خطأ في ربط أمر الشراء:', error)
      toast.error('فشل في ربط أمر الشراء')
    }
  }

  const handleCreateCategory = async () => {
    if (!selectedProjectId || !categoryFormData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      await procurementCostIntegrationService.createBudgetCategory({
        name: categoryFormData.name,
        nameEn: categoryFormData.nameEn,
        projectId: selectedProjectId,
        plannedAmount: categoryFormData.plannedAmount,
        description: categoryFormData.description,
        parentCategoryId: categoryFormData.parentCategoryId || undefined,
        isActive: true
      })

      toast.success('تم إنشاء فئة الميزانية بنجاح')
      setIsCreateCategoryDialogOpen(false)
      setCategoryFormData({ name: '', nameEn: '', plannedAmount: 0, description: '', parentCategoryId: '' })
      loadData()
    } catch (error) {
      console.error('خطأ في إنشاء فئة الميزانية:', error)
      toast.error('فشل في إنشاء فئة الميزانية')
    }
  }

  const getStatusIcon = (status: ProcurementCostLink['status']) => {
    switch (status) {
      case 'allocated': return <Clock className="h-4 w-4" />
      case 'committed': return <Package className="h-4 w-4" />
      case 'received': return <CheckCircle className="h-4 w-4" />
      case 'invoiced': return <DollarSign className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: ProcurementCostLink['status']) => {
    switch (status) {
      case 'allocated': return 'bg-blue-100 text-blue-800'
      case 'committed': return 'bg-yellow-100 text-yellow-800'
      case 'received': return 'bg-green-100 text-green-800'
      case 'invoiced': return 'bg-purple-100 text-purple-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: ProcurementCostLink['status']) => {
    switch (status) {
      case 'allocated': return 'مخصص'
      case 'committed': return 'ملتزم'
      case 'received': return 'مستلم'
      case 'invoiced': return 'مفوتر'
      case 'paid': return 'مدفوع'
      default: return 'غير محدد'
    }
  }

  const getAlertSeverityColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات الميزانية */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي الميزانية</p>
                    <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalBudget)}</p>
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
                  <Package className="h-8 w-8 text-green-600" />
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">المبلغ المخصص</p>
                    <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalAllocated)}</p>
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
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">المبلغ الفعلي</p>
                    <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalActual)}</p>
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
                <div className="flex items-center">
                  {budgetSummary.totalVariance >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-green-600" />
                  )}
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">الانحراف</p>
                    <p className={`text-2xl font-bold ${budgetSummary.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(budgetSummary.totalVariance))}
                    </p>
                    <p className="text-sm text-gray-500">
                      {budgetSummary.totalVariancePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* التنبيهات النشطة */}
      {budgetAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 ml-2" />
              التنبيهات النشطة ({budgetAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {budgetAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 ml-2" />
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity === 'low' && 'منخفض'}
                      {alert.severity === 'medium' && 'متوسط'}
                      {alert.severity === 'high' && 'عالي'}
                      {alert.severity === 'critical' && 'حرج'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links">روابط المشتريات</TabsTrigger>
          <TabsTrigger value="categories">فئات الميزانية</TabsTrigger>
          <TabsTrigger value="analysis">تحليل الانحرافات</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">روابط المشتريات بالميزانية</h3>
            <Dialog open={isCreateLinkDialogOpen} onOpenChange={setIsCreateLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  ربط جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>ربط أمر شراء بالميزانية</DialogTitle>
                  <DialogDescription>
                    اربط أمر شراء بفئة ميزانية محددة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purchaseOrderId">أمر الشراء</Label>
                    <Input
                      id="purchaseOrderId"
                      value={linkFormData.purchaseOrderId}
                      onChange={(e) => setLinkFormData(prev => ({ ...prev, purchaseOrderId: e.target.value }))}
                      placeholder="معرف أمر الشراء"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetCategoryId">فئة الميزانية</Label>
                    <Select
                      value={linkFormData.budgetCategoryId}
                      onValueChange={(value) => setLinkFormData(prev => ({ ...prev, budgetCategoryId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة الميزانية" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="allocatedAmount">المبلغ المخصص</Label>
                    <Input
                      id="allocatedAmount"
                      type="number"
                      value={linkFormData.allocatedAmount}
                      onChange={(e) => setLinkFormData(prev => ({ ...prev, allocatedAmount: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={linkFormData.notes}
                      onChange={(e) => setLinkFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات اختيارية"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button variant="outline" onClick={() => setIsCreateLinkDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateLink}>
                      إنشاء الربط
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>أمر الشراء</TableHead>
                    <TableHead>فئة الميزانية</TableHead>
                    <TableHead>المبلغ المخصص</TableHead>
                    <TableHead>المبلغ الفعلي</TableHead>
                    <TableHead>الانحراف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procurementLinks.map((link) => {
                    const category = budgetCategories.find(cat => cat.id === link.budgetCategoryId)
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.purchaseOrderId}</TableCell>
                        <TableCell>{category?.name || 'غير محدد'}</TableCell>
                        <TableCell>{formatCurrency(link.allocatedAmount)}</TableCell>
                        <TableCell>{formatCurrency(link.actualAmount)}</TableCell>
                        <TableCell>
                          <span className={link.variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(Math.abs(link.variance))}
                            {link.variance !== 0 && (
                              <span className="text-sm ml-1">
                                ({link.variancePercentage.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(link.status)}>
                            <div className="flex items-center">
                              {getStatusIcon(link.status)}
                              <span className="mr-1">{getStatusText(link.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">فئات الميزانية</h3>
            <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  فئة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء فئة ميزانية جديدة</DialogTitle>
                  <DialogDescription>
                    أنشئ فئة ميزانية جديدة للمشروع
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">اسم الفئة</Label>
                    <Input
                      id="categoryName"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="اسم فئة الميزانية"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryNameEn">الاسم بالإنجليزية</Label>
                    <Input
                      id="categoryNameEn"
                      value={categoryFormData.nameEn}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                      placeholder="Category Name (English)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plannedAmount">المبلغ المخطط</Label>
                    <Input
                      id="plannedAmount"
                      type="number"
                      value={categoryFormData.plannedAmount}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, plannedAmount: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف الفئة"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateCategory}>
                      إنشاء الفئة
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetCategories.map((category) => {
              const usagePercentage = category.plannedAmount > 0 
                ? (category.actualAmount / category.plannedAmount) * 100 
                : 0
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>المخطط:</span>
                          <span className="font-medium">{formatCurrency(category.plannedAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>المخصص:</span>
                          <span className="font-medium">{formatCurrency(category.allocatedAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>الفعلي:</span>
                          <span className="font-medium">{formatCurrency(category.actualAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>المتبقي:</span>
                          <span className={`font-medium ${category.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(category.remainingAmount))}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>الاستخدام:</span>
                            <span>{usagePercentage.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(usagePercentage, 100)} 
                            className={`h-2 ${usagePercentage > 100 ? 'bg-red-100' : 'bg-gray-100'}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {varianceAnalysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تحليل انحرافات التكلفة</CardTitle>
                  <CardDescription>
                    تحليل شامل للانحرافات بين التكاليف المخططة والفعلية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">التكلفة المخططة</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(varianceAnalysis.plannedCost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">التكلفة الفعلية</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(varianceAnalysis.actualCost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الانحراف</p>
                      <p className={`text-2xl font-bold ${varianceAnalysis.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(varianceAnalysis.variance))}
                      </p>
                      <p className="text-sm text-gray-500">
                        {varianceAnalysis.variancePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center mb-3">
                      {varianceAnalysis.trend === 'improving' && (
                        <TrendingDown className="h-5 w-5 text-green-600 ml-2" />
                      )}
                      {varianceAnalysis.trend === 'deteriorating' && (
                        <TrendingUp className="h-5 w-5 text-red-600 ml-2" />
                      )}
                      {varianceAnalysis.trend === 'stable' && (
                        <div className="h-5 w-5 bg-gray-400 rounded-full ml-2" />
                      )}
                      <span className="font-medium">
                        الاتجاه: {
                          varianceAnalysis.trend === 'improving' ? 'تحسن' :
                          varianceAnalysis.trend === 'deteriorating' ? 'تدهور' : 'مستقر'
                        }
                      </span>
                    </div>
                  </div>

                  {varianceAnalysis.factors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">العوامل المؤثرة:</h4>
                      <ul className="space-y-2">
                        {varianceAnalysis.factors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-blue-600 rounded-full mt-2 ml-2 flex-shrink-0" />
                            <span className="text-sm">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {varianceAnalysis.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">التوصيات:</h4>
                      <ul className="space-y-2">
                        {varianceAnalysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProcurementCostIntegration


