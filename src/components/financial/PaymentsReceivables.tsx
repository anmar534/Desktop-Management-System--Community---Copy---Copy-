/**
 * مكون إدارة المدفوعات والمستحقات
 * Payments and Receivables Management Component
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  FileText, Plus, Search, Filter, Download, AlertTriangle, 
  CheckCircle, Clock, DollarSign, TrendingUp, Calendar,
  Users, Receipt, CreditCard, Bell
} from 'lucide-react'
import {
  PaymentsReceivablesService,
  Invoice,
  Payment,
  Receivable,
  PaymentAlert,
  CollectionMetrics
} from '../../services/paymentsReceivablesService'

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

  // تحميل البيانات
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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
  }

  const handleRefresh = async () => {
    await service.refreshAllData()
    await loadData()
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'مسودة', labelEn: 'Draft', color: 'bg-gray-500' },
      sent: { label: 'مرسلة', labelEn: 'Sent', color: 'bg-blue-500' },
      paid: { label: 'مدفوعة', labelEn: 'Paid', color: 'bg-green-500' },
      overdue: { label: 'متأخرة', labelEn: 'Overdue', color: 'bg-red-500' },
      cancelled: { label: 'ملغاة', labelEn: 'Cancelled', color: 'bg-gray-400' }
    }
    
    const config = statusConfig[status]
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    )
  }

  const getAgingBadge = (status: Receivable['status']) => {
    const agingConfig = {
      current: { label: 'جاري', color: 'bg-green-500' },
      overdue_30: { label: '1-30 يوم', color: 'bg-yellow-500' },
      overdue_60: { label: '31-60 يوم', color: 'bg-orange-500' },
      overdue_90: { label: '61-90 يوم', color: 'bg-red-500' },
      overdue_120_plus: { label: '+90 يوم', color: 'bg-red-700' }
    }
    
    const config = agingConfig[status]
    return (
      <Badge className={`${config.color} text-white`}>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المدفوعات والمستحقات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المدفوعات والمستحقات</h1>
          <p className="text-gray-600 mt-1">إدارة شاملة للفواتير والمدفوعات والمستحقات</p>
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
                <p className="text-sm font-medium text-gray-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-gray-900">{quickStats.totalInvoices}</p>
                <p className="text-sm text-gray-500">{formatCurrency(quickStats.totalAmount)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المبلغ المحصل</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(quickStats.paidAmount)}</p>
                <p className="text-sm text-gray-500">
                  {quickStats.totalAmount > 0 
                    ? `${((quickStats.paidAmount / quickStats.totalAmount) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المبلغ المعلق</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(quickStats.pendingAmount)}</p>
                <p className="text-sm text-gray-500">في الانتظار</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المتأخرات</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(quickStats.overdueAmount)}</p>
                <p className="text-sm text-gray-500">{quickStats.overdueCount} فاتورة</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات */}
      {alerts.filter(alert => !alert.isRead).length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Bell className="h-5 w-5 ml-2" />
              التنبيهات المالية ({alerts.filter(alert => !alert.isRead).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(alert => !alert.isRead).slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ml-3 ${
                      alert.type === 'overdue' ? 'bg-red-500' :
                      alert.type === 'due_soon' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-500">{formatDate(alert.createdAt)}</p>
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
                    <span className="text-lg font-bold text-green-600">
                      {metrics.collectionEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.collectionEfficiency} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {metrics.averageCollectionPeriod.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-600">متوسط فترة التحصيل (يوم)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {metrics.daysInAR.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-600">أيام المستحقات</p>
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
                      <span className="font-medium text-red-600">{formatCurrency(metrics.agingBreakdown.overdue120Plus)}</span>
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
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الإصدار
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الاستحقاق
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.slice(0, 10).map(invoice => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الدفع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        طريقة الدفع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المرجع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.slice(0, 10).map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paymentMethod === 'cash' ? 'نقداً' :
                           payment.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                           payment.paymentMethod === 'check' ? 'شيك' :
                           payment.paymentMethod === 'credit_card' ? 'بطاقة ائتمان' : 'أخرى'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ الأصلي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ المتبقي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الاستحقاق
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        أيام التأخير
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        فئة العمر
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receivables.slice(0, 10).map(receivable => (
                      <tr key={receivable.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {receivable.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receivable.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(receivable.originalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(receivable.remainingAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(receivable.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير أعمار المستحقات</h3>
                <p className="text-sm text-gray-600 mb-4">تحليل المستحقات حسب فترات العمر</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير التحصيل</h3>
                <p className="text-sm text-gray-600 mb-4">أداء التحصيل والمؤشرات المالية</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير التدفق النقدي</h3>
                <p className="text-sm text-gray-600 mb-4">توقعات التدفقات النقدية</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير العملاء</h3>
                <p className="text-sm text-gray-600 mb-4">تحليل أداء العملاء في الدفع</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير المواعيد المالية</h3>
                <p className="text-sm text-gray-600 mb-4">مواعيد الاستحقاق والتنبيهات</p>
                <Button variant="outline" className="w-full">
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Receipt className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">تقرير تاريخ المدفوعات</h3>
                <p className="text-sm text-gray-600 mb-4">سجل شامل لجميع المدفوعات</p>
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
