/**
 * مكون إدارة الموردين
 * Supplier Management Component
 */

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Phone,
  Mail,
  MapPin,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supplierManagementService } from '@/application/services/supplierManagementService'
import type { Supplier } from '@/application/services/supplierManagementService'
import { formatCurrency } from '@/shared/utils/formatters/formatters'

// أنواع البيانات المحلية
interface SupplierFormData {
  name: string
  nameEn: string
  category: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxNumber: string
  commercialRegister: string
  paymentTerms: string
  creditLimit: number
  rating: number
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted'
  notes: string
}

interface SupplierStats {
  total: number
  active: number
  inactive: number
  suspended: number
  averageRating: number
  totalPurchases: number
  categoriesCount: number
}

const SupplierManagement: React.FC = () => {
  // الحالات الأساسية
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // حالات النموذج
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    nameEn: '',
    category: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    commercialRegister: '',
    paymentTerms: '30 يوم',
    creditLimit: 0,
    rating: 5,
    status: 'active',
    notes: '',
  })

  // تحميل البيانات
  useEffect(() => {
    loadSuppliers()
  }, [])

  // تصفية البيانات
  useEffect(() => {
    filterSuppliers()
  }, [suppliers, searchTerm, statusFilter, categoryFilter])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const suppliersData = await supplierManagementService.getAllSuppliers()
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('خطأ في تحميل الموردين:', error)
      toast.error('فشل في تحميل الموردين')
    } finally {
      setLoading(false)
    }
  }

  const filterSuppliers = () => {
    let filtered = [...suppliers]

    // تصفية بالبحث
    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // تصفية بالحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((supplier) => supplier.status === statusFilter)
    }

    // تصفية بالفئة
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((supplier) => supplier.category === categoryFilter)
    }

    setFilteredSuppliers(filtered)
  }

  // حساب الإحصائيات
  const stats = useMemo((): SupplierStats => {
    const total = suppliers.length
    const active = suppliers.filter((s) => s.status === 'active').length
    const inactive = suppliers.filter((s) => s.status === 'inactive').length
    const suspended = suppliers.filter((s) => s.status === 'suspended').length
    const averageRating = total > 0 ? suppliers.reduce((sum, s) => sum + s.rating, 0) / total : 0
    const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
    const categories = new Set(suppliers.map((s) => s.category))
    const categoriesCount = categories.size

    return {
      total,
      active,
      inactive,
      suspended,
      averageRating,
      totalPurchases,
      categoriesCount,
    }
  }, [suppliers])

  // الحصول على الفئات المتاحة
  const availableCategories = useMemo(() => {
    const categories = new Set(suppliers.map((s) => s.category))
    return Array.from(categories).sort()
  }, [suppliers])

  // دوال المعالجة
  const handleCreateSupplier = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error('يرجى ملء جميع الحقول المطلوبة')
        return
      }

      const newSupplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        nameEn: formData.nameEn,
        category: formData.category,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        taxNumber: formData.taxNumber,
        commercialRegister: formData.commercialRegister,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit,
        currentBalance: 0,
        totalPurchases: 0,
        rating: formData.rating,
        qualityScore: 0,
        deliveryScore: 0,
        serviceScore: 0,
        status: formData.status,
        approvalStatus: 'approved',
        registrationDate: new Date().toISOString(),
        notes: formData.notes,
      }

      await supplierManagementService.createSupplier(newSupplier)

      toast.success('تم إنشاء المورد بنجاح')
      setIsCreateDialogOpen(false)
      resetForm()
      await loadSuppliers()
    } catch (error) {
      console.error('خطأ في إنشاء المورد:', error)
      toast.error('فشل في إنشاء المورد')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      category: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      commercialRegister: '',
      paymentTerms: '30 يوم',
      creditLimit: 0,
      rating: 5,
      status: 'active',
      notes: '',
    })
  }

  const getStatusBadge = (status: Supplier['status']) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const, icon: CheckCircle },
      inactive: { label: 'غير نشط', variant: 'secondary' as const, icon: Clock },
      suspended: { label: 'معلق', variant: 'destructive' as const, icon: AlertCircle },
      blacklisted: { label: 'محظور', variant: 'destructive' as const, icon: X },
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

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground mr-1">({rating.toFixed(1)})</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الموردين...</p>
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
            <Users className="w-8 h-8 text-primary" />
            إدارة الموردين
          </h1>
          <p className="text-muted-foreground mt-1">إدارة شاملة للموردين والعقود وتقييم الأداء</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              مورد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
              <DialogDescription>أدخل تفاصيل المورد الجديد</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم المورد *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم المورد"
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="Enter supplier name in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">الفئة *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="مثل: مواد بناء، حديد، خرسانة"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">الشخص المسؤول *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))
                    }
                    placeholder="اسم الشخص المسؤول"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="supplier@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966501234567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="أدخل عنوان المورد"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateSupplier}>إضافة المورد</Button>
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
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الموردين</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">الموردين النشطين</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">متوسط التقييم</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المشتريات</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalPurchases)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
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
                  placeholder="ابحث في الموردين..."
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
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                  <SelectItem value="blacklisted">محظور</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="categoryFilter">تصفية بالفئة</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول الموردين */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              الموردين ({filteredSuppliers.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSuppliers}>
                <TrendingUp className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {suppliers.length === 0
                  ? 'لا يوجد موردين مسجلين حتى الآن'
                  : 'لا يوجد موردين يطابقون معايير البحث'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المورد</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">الشخص المسؤول</TableHead>
                    <TableHead className="text-right">معلومات الاتصال</TableHead>
                    <TableHead className="text-right">التقييم</TableHead>
                    <TableHead className="text-right">إجمالي المشتريات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.nameEn && (
                            <p className="text-sm text-muted-foreground">{supplier.nameEn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier.category}</Badge>
                      </TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRatingStars(supplier.rating)}</TableCell>
                      <TableCell>{formatCurrency(supplier.totalPurchases)}</TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell>
                        {new Date(supplier.registrationDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              // فتح نافذة عرض التفاصيل
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // حذف المورد
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

export default SupplierManagement
