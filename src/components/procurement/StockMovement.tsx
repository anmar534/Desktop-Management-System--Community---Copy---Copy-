/**
 * مكون إدارة حركات المخزون
 * Stock Movement Management Component
 */

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Package,
  User,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  inventoryManagementService,
  type StockMovement,
  type InventoryItem
} from '@/services/inventoryManagementService'

interface MovementFormData {
  itemId: string
  movementType: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  unitCost?: number
  reference: string
  referenceType: 'purchase_order' | 'project' | 'adjustment' | 'transfer' | 'return'
  fromLocation?: string
  toLocation?: string
  reason?: string
  performedBy: string
  movementDate: string
  notes?: string
}

export const StockMovement: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<MovementFormData>({
    itemId: '',
    movementType: 'in',
    quantity: 0,
    reference: '',
    referenceType: 'purchase_order',
    performedBy: 'المستخدم الحالي',
    movementDate: new Date().toISOString().split('T')[0]
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [movementsData, itemsData] = await Promise.all([
        inventoryManagementService.getAllMovements(),
        inventoryManagementService.getAllItems()
      ])

      setMovements(movementsData.sort((a, b) => 
        new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
      ))
      setItems(itemsData)
    } catch (error) {
      console.error('خطأ في تحميل بيانات الحركات:', error)
      toast.error('فشل في تحميل بيانات الحركات')
    } finally {
      setLoading(false)
    }
  }

  // Filter movements
  const filteredMovements = useMemo(() => {
    let filtered = movements

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(movement =>
        movement.reference.toLowerCase().includes(search) ||
        movement.reason?.toLowerCase().includes(search) ||
        movement.performedBy.toLowerCase().includes(search)
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(movement => movement.movementType === selectedType)
    }

    if (selectedItem !== 'all') {
      filtered = filtered.filter(movement => movement.itemId === selectedItem)
    }

    if (dateRange.from) {
      filtered = filtered.filter(movement => movement.movementDate >= dateRange.from)
    }

    if (dateRange.to) {
      filtered = filtered.filter(movement => movement.movementDate <= dateRange.to)
    }

    return filtered
  }, [movements, searchTerm, selectedType, selectedItem, dateRange])

  // Get movement statistics
  const movementStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().slice(0, 7)

    const todayMovements = movements.filter(m => m.movementDate === today)
    const monthMovements = movements.filter(m => m.movementDate.startsWith(thisMonth))

    const inMovements = movements.filter(m => m.movementType === 'in')
    const outMovements = movements.filter(m => m.movementType === 'out')
    const adjustments = movements.filter(m => m.movementType === 'adjustment')
    const transfers = movements.filter(m => m.movementType === 'transfer')

    return {
      total: movements.length,
      today: todayMovements.length,
      thisMonth: monthMovements.length,
      inMovements: inMovements.length,
      outMovements: outMovements.length,
      adjustments: adjustments.length,
      transfers: transfers.length
    }
  }, [movements])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />
      case 'out':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'وارد'
      case 'out':
        return 'صادر'
      case 'adjustment':
        return 'تعديل'
      case 'transfer':
        return 'نقل'
      default:
        return type
    }
  }

  const getReferenceTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return 'أمر شراء'
      case 'project':
        return 'مشروع'
      case 'adjustment':
        return 'تعديل'
      case 'transfer':
        return 'نقل'
      case 'return':
        return 'إرجاع'
      default:
        return type
    }
  }

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    return item ? item.itemName : 'عنصر غير معروف'
  }

  const handleCreateMovement = async () => {
    try {
      if (!formData.itemId || !formData.quantity || !formData.reference) {
        toast.error('يرجى ملء جميع الحقول المطلوبة')
        return
      }

      await inventoryManagementService.createMovement({
        ...formData,
        totalCost: formData.unitCost ? formData.quantity * formData.unitCost : undefined
      })

      toast.success('تم إنشاء الحركة بنجاح')
      setIsCreateDialogOpen(false)
      setFormData({
        itemId: '',
        movementType: 'in',
        quantity: 0,
        reference: '',
        referenceType: 'purchase_order',
        performedBy: 'المستخدم الحالي',
        movementDate: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      console.error('خطأ في إنشاء الحركة:', error)
      toast.error('فشل في إنشاء الحركة')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات الحركات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">حركات المخزون</h2>
          <p className="text-muted-foreground">تتبع وإدارة حركات دخول وخروج المخزون</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                حركة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء حركة مخزون جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">العنصر *</Label>
                  <Select value={formData.itemId} onValueChange={(value) => setFormData(prev => ({ ...prev, itemId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العنصر" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.itemName} ({item.itemCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="movementType">نوع الحركة *</Label>
                  <Select value={formData.movementType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, movementType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">وارد</SelectItem>
                      <SelectItem value="out">صادر</SelectItem>
                      <SelectItem value="adjustment">تعديل</SelectItem>
                      <SelectItem value="transfer">نقل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    placeholder="أدخل الكمية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitCost">التكلفة للوحدة</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="أدخل التكلفة"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">المرجع *</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="رقم أمر الشراء أو المشروع"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceType">نوع المرجع</Label>
                  <Select value={formData.referenceType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, referenceType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase_order">أمر شراء</SelectItem>
                      <SelectItem value="project">مشروع</SelectItem>
                      <SelectItem value="adjustment">تعديل</SelectItem>
                      <SelectItem value="transfer">نقل</SelectItem>
                      <SelectItem value="return">إرجاع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.movementType === 'transfer' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fromLocation">من الموقع</Label>
                      <Input
                        id="fromLocation"
                        value={formData.fromLocation || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, fromLocation: e.target.value }))}
                        placeholder="الموقع المصدر"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="toLocation">إلى الموقع</Label>
                      <Input
                        id="toLocation"
                        value={formData.toLocation || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, toLocation: e.target.value }))}
                        placeholder="الموقع المستهدف"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="movementDate">تاريخ الحركة *</Label>
                  <Input
                    id="movementDate"
                    type="date"
                    value={formData.movementDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, movementDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performedBy">المنفذ</Label>
                  <Input
                    id="performedBy"
                    value={formData.performedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, performedBy: e.target.value }))}
                    placeholder="اسم المنفذ"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="reason">السبب</Label>
                  <Input
                    id="reason"
                    value={formData.reason || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="سبب الحركة"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateMovement}>
                  إنشاء الحركة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
              <CardTitle className="text-sm font-medium">إجمالي الحركات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movementStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {movementStats.today} اليوم
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
              <CardTitle className="text-sm font-medium">حركات الوارد</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{movementStats.inMovements}</div>
              <p className="text-xs text-muted-foreground">
                إضافة للمخزون
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
              <CardTitle className="text-sm font-medium">حركات الصادر</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{movementStats.outMovements}</div>
              <p className="text-xs text-muted-foreground">
                خصم من المخزون
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
              <CardTitle className="text-sm font-medium">التعديلات</CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{movementStats.adjustments}</div>
              <p className="text-xs text-muted-foreground">
                تعديل الكميات
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الحركات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="نوع الحركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="in">وارد</SelectItem>
                <SelectItem value="out">صادر</SelectItem>
                <SelectItem value="adjustment">تعديل</SelectItem>
                <SelectItem value="transfer">نقل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="العنصر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العناصر</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full md:w-40"
              placeholder="من تاريخ"
            />
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full md:w-40"
              placeholder="إلى تاريخ"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحركات ({filteredMovements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>العنصر</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>المنفذ</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>السبب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">لا توجد حركات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(movement.movementDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movementType)}
                          <Badge variant={
                            movement.movementType === 'in' ? 'default' :
                            movement.movementType === 'out' ? 'destructive' :
                            movement.movementType === 'adjustment' ? 'secondary' :
                            'outline'
                          }>
                            {getMovementTypeLabel(movement.movementType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getItemName(movement.itemId)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          movement.movementType === 'in' ? 'text-green-600' :
                          movement.movementType === 'out' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {movement.movementType === 'in' ? '+' : 
                           movement.movementType === 'out' ? '-' : ''}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.reference}</p>
                          <p className="text-sm text-muted-foreground">
                            {getReferenceTypeLabel(movement.referenceType)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {movement.performedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.totalCost ? formatCurrency(movement.totalCost) : '-'}
                      </TableCell>
                      <TableCell>
                        {movement.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
