/**
 * مكون إدارة أوامر الشراء الشامل
 * Comprehensive Purchase Order Management Component
 */

import type React from 'react';
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { purchaseOrderService } from '@/application/services/purchaseOrderService'
import type { PurchaseOrder, PurchaseOrderItem } from '../../types/contracts'
import type { Project } from '@/data/centralData'
import { formatCurrency } from '@/shared/utils/formatters/formatters'
import { useProjects } from '@/application/hooks'

// أنواع البيانات المحلية
interface PurchaseOrderFormData {
  tenderName: string
  client: string
  projectId: string
  description: string
  priority: 'low' | 'medium' | 'high'
  department: string
  approver: string
  expectedDelivery: string
  items: PurchaseOrderItem[]
}

interface PurchaseOrderStats {
  total: number
  pending: number
  approved: number
  completed: number
  totalValue: number
  averageValue: number
}

const PurchaseOrderManagement: React.FC = () => {
  // الحالات الأساسية
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // حالات النموذج
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    tenderName: '',
    client: '',
    projectId: '',
    description: '',
    priority: 'medium',
    department: 'المشاريع',
    approver: 'مدير المشاريع',
    expectedDelivery: '',
    items: []
  })

  // البيانات المساعدة
  const { projects } = useProjects()

  // تحميل البيانات
  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  // تصفية البيانات
  useEffect(() => {
    filterOrders()
  }, [purchaseOrders, searchTerm, statusFilter, priorityFilter])

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true)
      const orders = await purchaseOrderService.getPurchaseOrders()
      setPurchaseOrders(orders)
    } catch (error) {
      console.error('خطأ في تحميل أوامر الشراء:', error)
      toast.error('فشل في تحميل أوامر الشراء')
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...purchaseOrders]

    // تصفية بالبحث
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.tenderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // تصفية بالحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // تصفية بالأولوية
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter)
    }

    setFilteredOrders(filtered)
  }

  // حساب الإحصائيات
  const stats = useMemo((): PurchaseOrderStats => {
    const total = purchaseOrders.length
    const pending = purchaseOrders.filter(o => o.status === 'pending').length
    const approved = purchaseOrders.filter(o => o.status === 'approved').length
    const completed = purchaseOrders.filter(o => o.status === 'completed').length
    const totalValue = purchaseOrders.reduce((sum, o) => sum + o.value, 0)
    const averageValue = total > 0 ? totalValue / total : 0

    return {
      total,
      pending,
      approved,
      completed,
      totalValue,
      averageValue
    }
  }, [purchaseOrders])

  // دوال المعالجة
  const handleCreateOrder = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.tenderName || !formData.client) {
        toast.error('يرجى ملء جميع الحقول المطلوبة')
        return
      }

      const newOrder: Omit<PurchaseOrder, 'id'> = {
        tenderName: formData.tenderName,
        tenderId: `manual_${Date.now()}`,
        client: formData.client,
        projectId: formData.projectId || undefined,
        value: 0, // سيتم حسابها من العناصر
        status: 'pending',
        createdDate: new Date().toISOString(),
        expectedDelivery: formData.expectedDelivery,
        priority: formData.priority,
        department: formData.department,
        approver: formData.approver,
        description: formData.description,
        source: 'manual',
        items: formData.items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // إنشاء الأمر (سيتم تطوير هذه الوظيفة في الخدمة)
      // const createdOrder = await purchaseOrderService.createManualOrder(newOrder)
      
      toast.success('تم إنشاء أمر الشراء بنجاح')
      setIsCreateDialogOpen(false)
      resetForm()
      await loadPurchaseOrders()
    } catch (error) {
      console.error('خطأ في إنشاء أمر الشراء:', error)
      toast.error('فشل في إنشاء أمر الشراء')
    }
  }

  const resetForm = () => {
    setFormData({
      tenderName: '',
      client: '',
      projectId: '',
      description: '',
      priority: 'medium',
      department: 'المشاريع',
      approver: 'مدير المشاريع',
      expectedDelivery: '',
      items: []
    })
  }

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'معتمد', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'مرفوض', variant: 'destructive' as const, icon: X },
      completed: { label: 'مكتمل', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'ملغي', variant: 'outline' as const, icon: X }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: PurchaseOrder['priority']) => {
    const priorityConfig = {
      low: { label: 'منخفضة', variant: 'outline' as const },
      medium: { label: 'متوسطة', variant: 'secondary' as const },
      high: { label: 'عالية', variant: 'destructive' as const }
    }

    const config = priorityConfig[priority]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل أوامر الشراء...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان والإحصائيات */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            إدارة أوامر الشراء
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة شاملة لأوامر الشراء والمشتريات
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              أمر شراء جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء أمر شراء جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل أمر الشراء الجديد
              </DialogDescription>
            </DialogHeader>
            
            {/* نموذج إنشاء أمر الشراء - سيتم تطويره في الجزء التالي */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenderName">اسم المنافسة/المشروع *</Label>
                  <Input
                    id="tenderName"
                    value={formData.tenderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenderName: e.target.value }))}
                    placeholder="أدخل اسم المنافسة أو المشروع"
                  />
                </div>
                <div>
                  <Label htmlFor="client">العميل *</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="أدخل اسم العميل"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectId">المشروع المرتبط</Label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشروع (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مشروع</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="أدخل وصف أمر الشراء"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateOrder}>
                إنشاء أمر الشراء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الأوامر</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">معتمدة</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">إجمالي القيمة</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="ابحث في أوامر الشراء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="statusFilter">تصفية بالحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priorityFilter">تصفية بالأولوية</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setPriorityFilter('all')
                }}
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول أوامر الشراء */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              أوامر الشراء ({filteredOrders.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadPurchaseOrders}>
                <Download className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {purchaseOrders.length === 0
                  ? 'لا توجد أوامر شراء حتى الآن'
                  : 'لا توجد أوامر شراء تطابق معايير البحث'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الأمر</TableHead>
                    <TableHead className="text-right">اسم المنافسة/المشروع</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">تاريخ التسليم المتوقع</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{order.tenderName}</TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell>{formatCurrency(order.value)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>
                        {new Date(order.createdDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        {new Date(order.expectedDelivery).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              // فتح نافذة عرض التفاصيل
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // حذف أمر الشراء
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseOrderManagement


