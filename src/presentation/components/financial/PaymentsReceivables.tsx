/**
 * مكون إدارة المدفوعات والمستحقات
 * Payments and Receivables Management Component
 */

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  FileText, Plus, Search, Filter, Download, AlertTriangle, 
  CheckCircle, Clock, DollarSign, TrendingUp, Calendar,
  Users, Receipt, Bell
} from 'lucide-react'
import type {
  Invoice,
  Payment,
  Receivable,
  PaymentAlert,
  CollectionMetrics
} from '../../services/paymentsReceivablesService';
import {
  PaymentsReceivablesService
} from '../../services/paymentsReceivablesService'

const INVOICE_STATUS_VARIANTS: Record<Invoice['status'], { label: string; labelEn: string; badgeClass: string }> = {
  draft: { label: 'مسودة', labelEn: 'Draft', badgeClass: 'bg-muted text-muted-foreground border-none' },
  sent: { label: 'مرسلة', labelEn: 'Sent', badgeClass: 'bg-info/10 text-info border-none' },
  paid: { label: 'مدفوعة', labelEn: 'Paid', badgeClass: 'bg-success/10 text-success border-none' },
  overdue: { label: 'متأخرة', labelEn: 'Overdue', badgeClass: 'bg-destructive/10 text-destructive border-none' },
  cancelled: { label: 'ملغاة', labelEn: 'Cancelled', badgeClass: 'bg-muted text-muted-foreground border-none' }
}

const RECEIVABLE_AGING_VARIANTS: Record<Receivable['status'], { label: string; badgeClass: string }> = {
  current: { label: 'جاري', badgeClass: 'bg-success/10 text-success border-none' },
  overdue_30: { label: '1-30 يوم', badgeClass: 'bg-warning/10 text-warning border-none' },
  overdue_60: { label: '31-60 يوم', badgeClass: 'bg-accent/10 text-accent border-none' },
  overdue_90: { label: '61-90 يوم', badgeClass: 'bg-destructive/10 text-destructive border-none' },
  overdue_120_plus: { label: '+90 يوم', badgeClass: 'bg-destructive text-destructive-foreground border-destructive/50' }
}

const ALERT_TYPE_INDICATORS: Record<PaymentAlert['type'], string> = {
  overdue: 'bg-destructive',
  due_soon: 'bg-warning',
  payment_received: 'bg-success'
}

export const PaymentsReceivables: React.FC = () => {
  const [service] = useState(() => new PaymentsReceivablesService())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  
  // البيانات
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [alerts, setAlerts] = useState<PaymentAlert[]>([])
  const [metrics, setMetrics] = useState<CollectionMetrics | null>(null)
  const [quickStats, setQuickStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    overdueCount: 0
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [
        invoicesData,
        paymentsData,
        receivablesData,
        alertsData,
        metricsData,
        statsData
      ] = await Promise.all([
        service.getAllInvoices(),
        service.getAllPayments(),
        service.getAllReceivables(),
        service.getAllPaymentAlerts(),
        service.calculateCollectionMetrics(),
        service.getQuickStats()
      ])

      setInvoices(invoicesData)
      setPayments(paymentsData)
      setReceivables(receivablesData)
      setAlerts(alertsData)
      setMetrics(metricsData)
      setQuickStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [service])

  // تحميل البيانات
  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleRefresh = async () => {
    await service.refreshAllData()
    await loadData()
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const config = INVOICE_STATUS_VARIANTS[status]
    return (
      <Badge variant="outline" className={config.badgeClass}>
        {config.label}
      </Badge>
    )
  }

  const getAgingBadge = (status: Receivable['status']) => {
    const config = RECEIVABLE_AGING_VARIANTS[status]
    return (
      <Badge variant="outline" className={config.badgeClass}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" dir="rtl">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-info"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المدفوعات والمستحقات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المدفوعات والمستحقات</h1>
          <p className="mt-1 text-muted-foreground">إدارة شاملة للفواتير والمدفوعات والمستحقات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <TrendingUp className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-foreground">{quickStats.totalInvoices}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(quickStats.totalAmount)}</p>
              </div>
              <FileText className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المبلغ المحصل</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(quickStats.paidAmount)}</p>
                <p className="text-sm text-muted-foreground">
                  {quickStats.totalAmount > 0 
                    ? `${((quickStats.paidAmount / quickStats.totalAmount) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المبلغ المعلق</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(quickStats.pendingAmount)}</p>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المتأخرات</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(quickStats.overdueAmount)}</p>
                <p className="text-sm text-muted-foreground">{quickStats.overdueCount} فاتورة</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات */}
      {alerts.filter(alert => !alert.isRead).length > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <Bell className="ml-2 h-5 w-5" />
              التنبيهات المالية ({alerts.filter(alert => !alert.isRead).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => !alert.isRead).slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center">
                    <div className={`ml-3 h-2 w-2 rounded-full ${ALERT_TYPE_INDICATORS[alert.type]}`} />
                    <div>
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(alert.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{formatCurrency(alert.amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="receivables">المستحقات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* مؤشرات التحصيل */}
              <Card>
                <CardHeader>
                  <CardTitle>مؤشرات التحصيل</CardTitle>
                  <CardDescription>أداء تحصيل المستحقات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">كفاءة التحصيل</span>
                    <span className="text-lg font-bold text-success">
                      {metrics.collectionEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.collectionEfficiency} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-info">
                        {metrics.averageCollectionPeriod.toFixed(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">متوسط فترة التحصيل (يوم)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent">
                        {metrics.daysInAR.toFixed(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">أيام المستحقات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* توزيع أعمار المستحقات */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع أعمار المستحقات</CardTitle>
                  <CardDescription>تحليل المستحقات حسب العمر</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">جاري</span>
                      <span className="font-medium">{formatCurrency(metrics.agingBreakdown.current)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">1-30 يوم</span>
                      <span className="font-medium">{formatCurrency(metrics.agingBreakdown.overdue30)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">31-60 يوم</span>
                      <span className="font-medium">{formatCurrency(metrics.agingBreakdown.overdue60)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">61-90 يوم</span>
                      <span className="font-medium">{formatCurrency(metrics.agingBreakdown.overdue90)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">+90 يوم</span>
                      <span className="font-medium text-destructive">{formatCurrency(metrics.agingBreakdown.overdue120Plus)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* تبويب الفواتير */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الفواتير..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 ml-2" />
                تصفية
              </Button>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        تاريخ الإصدار
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        تاريخ الاستحقاق
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 bg-card">
                    {invoices.slice(0, 10).map(invoice => (
                      <tr key={invoice.id} className="hover:bg-muted/40">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {invoice.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المدفوعات */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">سجل المدفوعات</h3>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              تسجيل دفعة
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        تاريخ الدفع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        طريقة الدفع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        المرجع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 bg-card">
                    {payments.slice(0, 10).map(payment => (
                      <tr key={payment.id} className="hover:bg-muted/40">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {payment.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {payment.paymentMethod === 'cash' ? 'نقداً' :
                           payment.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                           payment.paymentMethod === 'check' ? 'شيك' :
                           payment.paymentMethod === 'credit_card' ? 'بطاقة ائتمان' : 'أخرى'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {payment.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المستحقات */}
        <TabsContent value="receivables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">المستحقات حسب العمر</h3>
            <Button variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تقرير الأعمار
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        المبلغ الأصلي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        المبلغ المتبقي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        تاريخ الاستحقاق
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        أيام التأخير
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        فئة العمر
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 bg-card">
                    {receivables.slice(0, 10).map(receivable => (
                      <tr key={receivable.id} className="hover:bg-muted/40">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {receivable.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {receivable.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatCurrency(receivable.originalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {formatCurrency(receivable.remainingAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(receivable.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {receivable.daysOverdue > 0 ? `${receivable.daysOverdue} يوم` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAgingBadge(receivable.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التقارير */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-info" />
                <h3 className="font-semibold mb-2">تقرير أعمار المستحقات</h3>
                <p className="mb-4 text-sm text-muted-foreground">تحليل المستحقات حسب فترات العمر</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-success" />
                <h3 className="font-semibold mb-2">تقرير التحصيل</h3>
                <p className="mb-4 text-sm text-muted-foreground">أداء التحصيل والمؤشرات المالية</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="mx-auto mb-4 h-12 w-12 text-accent" />
                <h3 className="font-semibold mb-2">تقرير التدفق النقدي</h3>
                <p className="mb-4 text-sm text-muted-foreground">توقعات التدفقات النقدية</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-warning" />
                <h3 className="font-semibold mb-2">تقرير العملاء</h3>
                <p className="mb-4 text-sm text-muted-foreground">تحليل أداء العملاء في الدفع</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-destructive" />
                <h3 className="font-semibold mb-2">تقرير المواعيد المالية</h3>
                <p className="mb-4 text-sm text-muted-foreground">مواعيد الاستحقاق والتنبيهات</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Receipt className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h3 className="font-semibold mb-2">تقرير تاريخ المدفوعات</h3>
                <p className="mb-4 text-sm text-muted-foreground">سجل شامل لجميع المدفوعات</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


