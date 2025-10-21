/**
 * مكون إدارة العقود
 * Contract Management Component
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
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { 
  SupplierContract, 
  Supplier} from '../../services/supplierManagementService';
import {
  supplierManagementService 
} from '../../services/supplierManagementService'
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter'

// ===========================
// 📊 Types & Interfaces
// ===========================

interface ContractStats {
  total: number
  active: number
  expired: number
  draft: number
  totalValue: number
  averageValue: number
}

interface ContractFormData {
  supplierId: string
  contractNumber: string
  title: string
  description: string
  startDate: string
  endDate: string
  value: number
  currency: string
  paymentTerms: string
  deliveryTerms: string
  qualityStandards: string
  penaltyClause: string
}

// ===========================
// 🎨 Component
// ===========================

export const ContractManagement: React.FC = () => {
  // ===========================
  // 📊 State Management
  // ===========================
  
  const [contracts, setContracts] = useState<SupplierContract[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<SupplierContract | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [formData, setFormData] = useState<ContractFormData>({
    supplierId: '',
    contractNumber: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    value: 0,
    currency: 'SAR',
    paymentTerms: '',
    deliveryTerms: '',
    qualityStandards: '',
    penaltyClause: ''
  })

  const { formatCurrency } = useCurrencyFormatter()

  // ===========================
  // 📊 Data Loading
  // ===========================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [contractsData, suppliersData] = await Promise.all([
        supplierManagementService.getAllContracts(),
        supplierManagementService.getAllSuppliers()
      ])
      setContracts(contractsData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ===========================
  // 📊 Computed Values
  // ===========================

  const stats = useMemo((): ContractStats => {
    const total = contracts.length
    const active = contracts.filter(c => c.status === 'active').length
    const expired = contracts.filter(c => c.status === 'expired').length
    const draft = contracts.filter(c => c.status === 'draft').length
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0)
    const averageValue = total > 0 ? totalValue / total : 0

    return { total, active, expired, draft, totalValue, averageValue }
  }, [contracts])

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const supplier = suppliers.find(s => s.id === contract.supplierId)
      const matchesSearch = 
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [contracts, suppliers, searchTerm, statusFilter])

  // ===========================
  // 🎯 Event Handlers
  // ===========================

  const handleCreateContract = async () => {
    try {
      const newContract = await supplierManagementService.createContract({
        ...formData,
        id: `contract_${Date.now()}`,
        status: 'draft' as const,
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setContracts(prev => [...prev, newContract])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('تم إنشاء العقد بنجاح')
    } catch (error) {
      console.error('خطأ في إنشاء العقد:', error)
      toast.error('فشل في إنشاء العقد')
    }
  }

  const handleEditContract = async () => {
    if (!selectedContract) return

    try {
      const updatedContract = await supplierManagementService.updateContract(
        selectedContract.id,
        {
          ...formData,
          updatedAt: new Date().toISOString()
        }
      )

      setContracts(prev => 
        prev.map(c => c.id === selectedContract.id ? updatedContract : c)
      )
      setIsEditDialogOpen(false)
      setSelectedContract(null)
      resetForm()
      toast.success('تم تحديث العقد بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث العقد:', error)
      toast.error('فشل في تحديث العقد')
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    try {
      await supplierManagementService.deleteContract(contractId)
      setContracts(prev => prev.filter(c => c.id !== contractId))
      toast.success('تم حذف العقد بنجاح')
    } catch (error) {
      console.error('خطأ في حذف العقد:', error)
      toast.error('فشل في حذف العقد')
    }
  }

  const resetForm = () => {
    setFormData({
      supplierId: '',
      contractNumber: '',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      value: 0,
      currency: 'SAR',
      paymentTerms: '',
      deliveryTerms: '',
      qualityStandards: '',
      penaltyClause: ''
    })
  }

  const openEditDialog = (contract: SupplierContract) => {
    setSelectedContract(contract)
    setFormData({
      supplierId: contract.supplierId,
      contractNumber: contract.contractNumber,
      title: contract.title,
      description: contract.description || '',
      startDate: contract.startDate,
      endDate: contract.endDate,
      value: contract.value,
      currency: contract.currency,
      paymentTerms: contract.paymentTerms,
      deliveryTerms: contract.deliveryTerms,
      qualityStandards: contract.qualityStandards || '',
      penaltyClause: contract.penaltyClause || ''
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (contract: SupplierContract) => {
    setSelectedContract(contract)
    setIsViewDialogOpen(true)
  }

  // ===========================
  // 🎨 Helper Functions
  // ===========================

  const getStatusBadge = (status: SupplierContract['status']) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const, icon: FileText },
      active: { label: 'نشط', variant: 'default' as const, icon: CheckCircle },
      expired: { label: 'منتهي', variant: 'destructive' as const, icon: AlertTriangle },
      terminated: { label: 'منهي', variant: 'destructive' as const, icon: AlertTriangle },
      renewed: { label: 'مجدد', variant: 'default' as const, icon: CheckCircle }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || 'غير محدد'
  }

  const isContractExpiringSoon = (endDate: string) => {
    const today = new Date()
    const contractEnd = new Date(endDate)
    const daysUntilExpiry = Math.ceil((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل العقود...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة العقود</h2>
          <p className="text-muted-foreground">إدارة عقود الموردين والمتابعة</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              عقد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء عقد جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل العقد الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractNumber">رقم العقد</Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                  placeholder="أدخل رقم العقد"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">عنوان العقد</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان العقد"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">وصف العقد</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="أدخل وصف العقد"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">قيمة العقد</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">العملة</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                    <SelectItem value="EUR">يورو</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">شروط الدفع</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="مثل: 30 يوم"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTerms">شروط التسليم</Label>
                <Input
                  id="deliveryTerms"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                  placeholder="أدخل شروط التسليم"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="qualityStandards">معايير الجودة</Label>
                <Textarea
                  id="qualityStandards"
                  value={formData.qualityStandards}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualityStandards: e.target.value }))}
                  placeholder="أدخل معايير الجودة المطلوبة"
                  rows={2}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="penaltyClause">بند الغرامات</Label>
                <Textarea
                  id="penaltyClause"
                  value={formData.penaltyClause}
                  onChange={(e) => setFormData(prev => ({ ...prev, penaltyClause: e.target.value }))}
                  placeholder="أدخل بنود الغرامات والجزاءات"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateContract}>
                إنشاء العقد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العقود</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                جميع العقود المسجلة
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
              <CardTitle className="text-sm font-medium">العقود النشطة</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                العقود السارية حالياً
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
              <CardTitle className="text-sm font-medium">العقود المنتهية</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">
                العقود المنتهية الصلاحية
              </p>
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
              <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                قيمة جميع العقود
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في العقود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="حالة العقد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="terminated">منهي</SelectItem>
                  <SelectItem value="renewed">مجدد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة العقود ({filteredContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">لا توجد عقود</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          {contract.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-48">
                              {contract.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getSupplierName(contract.supplierId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(contract.value)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.startDate).toLocaleDateString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.endDate).toLocaleDateString('ar-SA')}
                          {isContractExpiringSoon(contract.endDate) && (
                            <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contract.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(contract)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContract(contract.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل العقد</DialogTitle>
            <DialogDescription>
              تعديل تفاصيل العقد المحدد
            </DialogDescription>
          </DialogHeader>
          {/* Same form as create dialog */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">المورد</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contractNumber">رقم العقد</Label>
              <Input
                id="edit-contractNumber"
                value={formData.contractNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                placeholder="أدخل رقم العقد"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-title">عنوان العقد</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان العقد"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-value">قيمة العقد</Label>
              <Input
                id="edit-value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">العملة</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">ريال سعودي</SelectItem>
                  <SelectItem value="USD">دولار أمريكي</SelectItem>
                  <SelectItem value="EUR">يورو</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditContract}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل العقد</DialogTitle>
            <DialogDescription>
              عرض تفاصيل العقد كاملة
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">رقم العقد</Label>
                  <p className="text-sm">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">المورد</Label>
                  <p className="text-sm">{getSupplierName(selectedContract.supplierId)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">عنوان العقد</Label>
                  <p className="text-sm">{selectedContract.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">قيمة العقد</Label>
                  <p className="text-sm">{formatCurrency(selectedContract.value)} {selectedContract.currency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ البداية</Label>
                  <p className="text-sm">{new Date(selectedContract.startDate).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ النهاية</Label>
                  <p className="text-sm">{new Date(selectedContract.endDate).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              {selectedContract.description && (
                <div>
                  <Label className="text-sm font-medium">وصف العقد</Label>
                  <p className="text-sm mt-1">{selectedContract.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


