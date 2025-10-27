/**
 * لوحة أوامر الشراء للمشروع
 * تعرض أوامر الشراء المرتبطة بالمشروع مع إحصائيات التكلفة
 */

import { useState, useEffect } from 'react'
import { Package, DollarSign, Clock, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Badge } from '@/presentation/components/ui/badge'
import { useToastContext } from '@/presentation/components/toast/ToastProvider'
import {
  getEnhancedProjectRepository,
  getPurchaseOrderRepository,
} from '@/application/services/serviceRegistry'
import { ProjectCostTrackerService } from '@/application/services/projectCostTracker'
import type { PurchaseOrder } from '@/types/contracts'

interface PurchaseOrdersPanelProps {
  projectId: string
}

/**
 * لوحة عرض أوامر الشراء المرتبطة بالمشروع
 */
export function PurchaseOrdersPanel({ projectId }: PurchaseOrdersPanelProps) {
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [costStats, setCostStats] = useState<{
    totalAllocated: number
    totalActual: number
    totalRemaining: number
    variance: number
    variancePercentage: number
    linkedPOsCount: number
    purchaseOrdersValue: number
    isOverBudget: boolean
  }>({
    totalAllocated: 0,
    totalActual: 0,
    totalRemaining: 0,
    variance: 0,
    variancePercentage: 0,
    linkedPOsCount: 0,
    purchaseOrdersValue: 0,
    isOverBudget: false,
  })

  const toast = useToastContext()

  /**
   * تحميل أوامر الشراء وإحصائيات التكلفة
   */
  const loadPurchaseOrders = async () => {
    setIsLoading(true)
    try {
      const projectRepo = getEnhancedProjectRepository()
      const poRepo = getPurchaseOrderRepository()

      // جلب IDs الـ POs المرتبطة
      const poIds = await projectRepo.getPurchaseOrdersByProject(projectId)

      // جلب تفاصيل كل PO
      const posDetails = await Promise.all(
        poIds.map(async (id: string) => {
          const po = await poRepo.getById(id)
          return po
        }),
      )

      // فلترة القيم null
      const validPOs = posDetails.filter(
        (po: PurchaseOrder | null): po is PurchaseOrder => po !== null,
      )
      setPOs(validPOs)

      // جلب إحصائيات التكلفة
      const stats = await ProjectCostTrackerService.getCostStats(projectId)
      if (stats) {
        setCostStats(stats)
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error)
      toast.error('فشل في تحميل أوامر الشراء')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPurchaseOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  /**
   * تنسيق التاريخ
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  /**
   * تنسيق المبلغ
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * الحصول على نوع Badge حسب حالة PO
   */
  const getStatusBadgeVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'default'
      case 'pending':
      case 'approved':
        return 'secondary'
      case 'cancelled':
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  /**
   * ترجمة الحالة
   */
  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      pending: 'قيد الانتظار',
      approved: 'موافق عليه',
      completed: 'مكتمل',
      delivered: 'تم التسليم',
      cancelled: 'ملغى',
      rejected: 'مرفوض',
    }
    return translations[status] || status
  }

  // حساب إحصائيات إضافية
  const pendingPOs = pos.filter((po) => po.status === 'pending').length
  const completedPOs = pos.filter((po) => po.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{pos.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{formatCurrency(costStats.totalActual)}</div>
              <div className="text-sm text-muted-foreground">التكلفة الفعلية</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold">{pendingPOs}</div>
              <div className="text-sm text-muted-foreground">قيد الانتظار</div>
            </div>
          </CardContent>
        </Card>

        <Card className={costStats.isOverBudget ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              {costStats.isOverBudget ? (
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              ) : (
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-info" />
              )}
              <div className="text-2xl font-bold">{formatCurrency(costStats.totalRemaining)}</div>
              <div className="text-sm text-muted-foreground">
                {costStats.isOverBudget ? 'تجاوز الميزانية' : 'المتبقي من الميزانية'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل التكلفة */}
      {costStats.variance !== 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تحليل التكلفة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">الميزانية المخصصة</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(costStats.totalAllocated)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">الفرق</div>
                <div
                  className={`text-lg font-semibold ${
                    costStats.variance < 0 ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {formatCurrency(Math.abs(costStats.variance))} (
                  {costStats.variancePercentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة أوامر الشراء */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>أوامر الشراء</CardTitle>
              <CardDescription>
                {completedPOs} مكتملة من أصل {pos.length}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : pos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد أوامر شراء</h3>
              <p className="text-sm text-muted-foreground mb-4">
                لم يتم ربط أي أوامر شراء بهذا المشروع بعد
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>معرف الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>عدد الأصناف</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => {
                    const itemsCount = po.items?.length || 0
                    const totalAmount =
                      po.items?.reduce((sum: number, item) => sum + (item.totalPrice || 0), 0) || 0

                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">
                          {po.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>{po.client || '-'}</TableCell>
                        <TableCell>{formatDate(po.createdDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{itemsCount} صنف</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(po.status || 'pending')}>
                            {translateStatus(po.status || 'pending')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: فتح صفحة تفاصيل PO
                              toast.info('ستتمكن قريباً من عرض تفاصيل الطلب')
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
