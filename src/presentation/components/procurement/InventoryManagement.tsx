/**
 * مكون إدارة المخزون الشامل
 * Comprehensive Inventory Management Component
 */

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/presentation/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import { Progress } from '@/presentation/components/ui/progress'

import {
  inventoryManagementService,
  type InventoryItem,
  type StockAlert,
  type StockMovement,
} from '@/services/inventoryManagementService'

interface InventoryStats {
  totalItems: number
  totalValue: number
  activeItems: number
  lowStockItems: number
  outOfStockItems: number
  totalMovements: number
  activeAlerts: number
  categories: { name: string; count: number; value: number }[]
  locations: { name: string; count: number; value: number }[]
}

export const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('items')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, alertsData, movementsData, statsData] = await Promise.all([
        inventoryManagementService.getAllItems(),
        inventoryManagementService.getActiveAlerts(),
        inventoryManagementService.getAllMovements(),
        inventoryManagementService.getInventoryStatistics(),
      ])

      setItems(itemsData)
      setAlerts(alertsData)
      setMovements(movementsData)
      setStats(statsData)
    } catch (error) {
      console.error('خطأ في تحميل بيانات المخزون:', error)
      toast.error('فشل في تحميل بيانات المخزون')
    } finally {
      setLoading(false)
    }
  }

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(search) ||
          item.itemCode.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search),
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter((item) => item.location === selectedLocation)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === selectedStatus)
    }

    return filtered
  }, [items, searchTerm, selectedCategory, selectedLocation, selectedStatus])

  // Get unique categories and locations
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map((item) => item.category))]
    return uniqueCategories.sort()
  }, [items])

  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(items.map((item) => item.location))]
    return uniqueLocations.sort()
  }, [items])

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) {
      return { status: 'نفاد المخزون', color: 'destructive' as const }
    } else if (item.currentStock <= item.reorderPoint) {
      return { status: 'مخزون منخفض', color: 'warning' as const }
    } else if (item.maximumStock && item.currentStock > item.maximumStock) {
      return { status: 'مخزون زائد', color: 'secondary' as const }
    } else {
      return { status: 'طبيعي', color: 'default' as const }
    }
  }

  const getStockLevel = (item: InventoryItem) => {
    if (item.maximumStock) {
      return (item.currentStock / item.maximumStock) * 100
    } else {
      return item.currentStock > item.reorderPoint
        ? 100
        : (item.currentStock / item.reorderPoint) * 100
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات المخزون...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المخزون</h2>
          <p className="text-muted-foreground">إدارة وتتبع المواد والمخزون</p>
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            عنصر جديد
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي العناصر</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">{stats.activeItems} نشط</p>
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
                <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground">قيمة المخزون الحالي</p>
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
                <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
                <p className="text-xs text-muted-foreground">يحتاج إعادة طلب</p>
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
                <CardTitle className="text-sm font-medium">نفاد المخزون</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
                <p className="text-xs text-muted-foreground">يحتاج شراء فوري</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              تنبيهات المخزون ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.severity === 'high'
                      ? 'border-red-200 bg-red-50'
                      : alert.severity === 'medium'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        alert.severity === 'high'
                          ? 'text-red-600'
                          : alert.severity === 'medium'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        المخزون الحالي: {alert.currentStock}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      alert.severity === 'high'
                        ? 'destructive'
                        : alert.severity === 'medium'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {alert.alertType === 'low_stock'
                      ? 'مخزون منخفض'
                      : alert.alertType === 'out_of_stock'
                        ? 'نفاد المخزون'
                        : alert.alertType === 'overstock'
                          ? 'مخزون زائد'
                          : 'تحذير انتهاء الصلاحية'}
                  </Badge>
                </div>
              ))}
              {alerts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  و {alerts.length - 5} تنبيهات أخرى...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items">العناصر</TabsTrigger>
          <TabsTrigger value="movements">الحركات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في العناصر..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="جميع الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="جميع المواقع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المواقع</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="discontinued">متوقف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة العناصر ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>كود العنصر</TableHead>
                      <TableHead>اسم العنصر</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المخزون الحالي</TableHead>
                      <TableHead>مستوى المخزون</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">لا توجد عناصر</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const stockStatus = getStockStatus(item)
                        const stockLevel = getStockLevel(item)

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.itemName}</p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <div className="text-center">
                                <p className="font-medium">
                                  {item.currentStock} {item.unit}
                                </p>
                                <Progress value={stockLevel} className="w-16 h-2 mt-1" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.color}>{stockStatus.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                {item.status === 'active'
                                  ? 'نشط'
                                  : item.status === 'inactive'
                                    ? 'غير نشط'
                                    : 'متوقف'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.totalValue)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">سيتم تطوير هذا القسم قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>تقارير المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">سيتم تطوير هذا القسم قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">سيتم تطوير هذا القسم قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
