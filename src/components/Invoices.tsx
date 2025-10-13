'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import { 
  FileText,
  Plus,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { EntityActions, ActionButton } from './ui/ActionButtons'
import { motion } from 'framer-motion'
import { formatCurrency } from '../data/centralData'
import { formatDateValue } from '@/utils/formatters'
import { toast } from 'sonner'
import { useInvoices } from '@/application/hooks/useInvoices'
import { DeleteConfirmation } from './ui/confirmation-dialog'
import { StatusBadge, type StatusBadgeProps } from './ui/status-badge'
import { InlineAlert } from './ui/inline-alert'

interface InvoiceStatusInfo {
  text: string;
  status: StatusBadgeProps['status'];
}

interface InvoicesProps {
  onSectionChange: (section: string) => void
}

export function Invoices({ onSectionChange }: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { invoices, isLoading, patchInvoice, deleteInvoice: removeInvoice } = useInvoices()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

  // وظائف التفاعل
  const handleViewInvoice = (invoiceId: string) => {
    console.log('عرض الفاتورة:', invoiceId)
    onSectionChange(`invoice-details?id=${invoiceId}`)
  }

  const handleEditInvoice = (invoiceId: string) => {
    console.log('تحرير الفاتورة:', invoiceId)
    onSectionChange(`edit-invoice?id=${invoiceId}`)
  }

  const handleSendInvoice = (invoiceId: string) => {
    console.log('إرسال الفاتورة:', invoiceId)
    void patchInvoice(invoiceId, { status: 'sent' })
  }

  // حساب البيانات الإحصائية من الفواتير الفعلية
  const invoicesData = useMemo(() => {
    const totalValue = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const sentInvoices = invoices.filter(inv => inv.status === 'sent')
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
    const currentDate = new Date()

    const issuedThisMonth = invoices.filter(inv => {
      const invoiceDate = new Date(inv.issueDate)
      return (
        invoiceDate.getMonth() === currentDate.getMonth() &&
        invoiceDate.getFullYear() === currentDate.getFullYear()
      )
    }).length

    const statusCounts = {
      draft: invoices.filter(inv => inv.status === 'draft').length,
      sent: sentInvoices.length,
      paid: paidInvoices.length,
      overdue: overdueInvoices.length,
      cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    }

    return {
      overview: {
        totalInvoices: invoices.length,
        totalValue,
        paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
        pendingAmount: sentInvoices.reduce((sum, inv) => sum + inv.total, 0),
        overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
        thisMonth: issuedThisMonth,
        averageValue: invoices.length > 0 ? totalValue / invoices.length : 0,
      },
      statusCounts,
    }
  }, [invoices])

  // الإحصائيات السريعة
  const quickStats = useMemo(() => ([
    {
      label: 'إجمالي الفواتير',
      value: invoicesData.overview.totalInvoices.toString(),
      trend: 'up' as const,
      trendValue: '+12',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'القيمة الإجمالية',
      value: formatCurrency(invoicesData.overview.totalValue),
      trend: 'up' as const,
      trendValue: '+8.5%',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'المبالغ المدفوعة',
      value: formatCurrency(invoicesData.overview.paidAmount),
      trend: 'up' as const,
      trendValue: '+15.2%',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'المعلقة للدفع',
      value: formatCurrency(invoicesData.overview.pendingAmount),
      trend: 'up' as const,
      trendValue: '+3',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'المتأخرة',
      value: formatCurrency(invoicesData.overview.overdueAmount),
      trend: 'down' as const,
      trendValue: '-8.1%',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      label: 'متوسط قيمة الفاتورة',
      value: formatCurrency(invoicesData.overview.averageValue),
      trend: 'up' as const,
      trendValue: '+2.3%',
      color: 'text-info',
      bgColor: 'bg-info/10'
    }
  ]), [invoicesData])

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'العودة للإدارة المالية',
      icon: ArrowRight,
      onClick: () => onSectionChange('financial'),
      variant: 'outline' as const
    },
    {
      label: 'فاتورة جديدة',
      icon: Plus,
      onClick: () => onSectionChange('new-invoice'),
      primary: true
    },
    {
      label: 'تقرير الفواتير',
      icon: FileText,
      onClick: () => onSectionChange('reports'),
      variant: 'outline' as const
    },
    {
      label: 'تصدير البيانات',
      icon: Download,
      onClick: () => toast.info('سيتم توفير التصدير قريباً'),
      variant: 'outline' as const
    }
  ]

  const getStatusInfo = (status: string): InvoiceStatusInfo => {
    switch (status) {
      case 'draft':
        return { text: 'مسودة', status: 'default' }
      case 'sent':
        return { text: 'مرسلة', status: 'info' }
      case 'paid':
        return { text: 'مدفوعة', status: 'success' }
      case 'overdue':
        return { text: 'متأخرة', status: 'overdue' }
      case 'cancelled':
        return { text: 'ملغاة', status: 'warning' }
      default:
        return { text: 'غير محددة', status: 'default' }
    }
  }

  // بطاقات تحليل الفواتير
  const InvoiceAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="معدل الدفع"
        value={`${invoicesData.overview.totalValue > 0 ? Math.round((invoicesData.overview.paidAmount / invoicesData.overview.totalValue) * 100) : 0}%`}
        subtitle="من إجمالي المبالغ"
        icon={CheckCircle}
        color="text-success"
        bgColor="bg-success/10"
      />
      <DetailCard
        title="متوسط مدة التحصيل"
        value="25 يوم"
        subtitle="من تاريخ الإصدار"
        icon={Clock}
        color="text-primary"
        bgColor="bg-primary/10"
      />
      <DetailCard
        title="المتأخرة عن الدفع"
        value={invoicesData.statusCounts.overdue.toString()}
        subtitle="فاتورة متأخرة"
        icon={AlertTriangle}
        color="text-destructive"
        bgColor="bg-destructive/10"
      />
      <DetailCard
        title="هذا الشهر"
        value={invoicesData.overview.thisMonth.toString()}
        subtitle="فاتورة جديدة"
        icon={Calendar}
        color="text-info"
        bgColor="bg-info/10"
      />
    </div>
  )

  const filteredInvoices = useMemo(() => (
    invoices.filter(invoice => {
      const normalizedSearch = searchTerm.toLowerCase()
      const matchesSearch =
        invoice.clientName.toLowerCase().includes(normalizedSearch) ||
        invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
        invoice.projectName.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
  ), [invoices, searchTerm, statusFilter])

  return (
    <PageLayout
      tone="primary"
      title="إدارة الفواتير"
      description="إدارة وتتبع الفواتير والمدفوعات"
      icon={FileText}
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في الفواتير..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      headerExtra={InvoiceAnalysisCards}
    >
      
      {/* فلاتر إضافية */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            الكل ({invoices.length})
          </Button>
          <Button
            variant={statusFilter === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('sent')}
          >
            مرسلة ({invoicesData.statusCounts.sent})
          </Button>
          <Button
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('paid')}
          >
            مدفوعة ({invoicesData.statusCounts.paid})
          </Button>
          <Button
            variant={statusFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('overdue')}
          >
            متأخرة ({invoicesData.statusCounts.overdue})
          </Button>
        </div>
      </div>

      {invoicesData.statusCounts.overdue > 0 && (
        <div className="mb-6">
          <InlineAlert
            variant={invoicesData.statusCounts.overdue > 2 ? 'destructive' : 'warning'}
            title="تنبيه الفواتير المتأخرة"
            description={`يوجد ${invoicesData.statusCounts.overdue} فاتورة متأخرة بإجمالي ${formatCurrency(invoicesData.overview.overdueAmount)}. يُنصح بمتابعة التحصيل خلال هذا الأسبوع.`}
          />
        </div>
      )}

      {/* قائمة الفواتير */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          جاري تحميل بيانات الفواتير...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice, index) => {
          const statusInfo = getStatusInfo(invoice.status)
          const paymentProgress = invoice.status === 'paid' ? 100 : 0

          return (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* معلومات الفاتورة الأساسية */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {invoice.invoiceNumber}
                            </h3>
                            <StatusBadge
                              status={statusInfo.status}
                              label={statusInfo.text}
                              size="sm"
                              showIcon={false}
                              className="shadow-none"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            العميل: {invoice.clientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            المشروع: {invoice.projectName}
                          </p>
                        </div>
                      </div>

                      {/* تواريخ ومبالغ */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">تاريخ الإصدار</span>
                          <span className="font-medium">{formatDateValue(invoice.issueDate, { locale: 'ar-EG' })}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">تاريخ الاستحقاق</span>
                          <span className="font-medium">{formatDateValue(invoice.dueDate, { locale: 'ar-EG' })}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">المبلغ الإجمالي</span>
                          <span className="font-medium text-primary">{formatCurrency(invoice.total)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">المبلغ المتبقي</span>
                          <span className={`font-medium ${invoice.status !== 'paid' ? 'text-warning' : 'text-success'}`}>
                            {invoice.status === 'paid' ? 'مدفوع بالكامل' : formatCurrency(invoice.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* شريط الدفع والإجراءات */}
                    <div className="lg:w-64">
                      {/* مؤشر الدفع */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">حالة الدفع</span>
                          <span className="font-medium">{Math.round(paymentProgress)}%</span>
                        </div>
                        <Progress value={paymentProgress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>القيمة: {formatCurrency(invoice.total)}</span>
                          <span>الحالة: {getStatusInfo(invoice.status).text}</span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex flex-wrap gap-2">
                        <EntityActions 
                          onView={() => handleViewInvoice(invoice.id)}
                          onEdit={() => handleEditInvoice(invoice.id)}
                          onDelete={() => setDeleteTarget({ id: invoice.id, label: invoice.invoiceNumber })}
                          showPrimary={false}
                        />
                        {invoice.status === 'draft' && (
                          <ActionButton
                            variant="primary"
                            onClick={() => handleSendInvoice(invoice.id)}
                            icon="Send"
                          >
                            إرسال
                          </ActionButton>
                        )}
                        <ActionButton
                          variant="secondary"
                          onClick={() => toast.info('سيتم دعم تصدير PDF قريباً')}
                          icon="Download"
                        >
                          PDF
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
          })}
          {filteredInvoices.length === 0 && invoices.length > 0 && (
            <EmptyState
              icon={FileText}
              title="لا توجد نتائج مطابقة"
              description="لا توجد فواتير تطابق معايير البحث الحالية. جرّب تعديل المرشحات أو إعادة التعيين."
            />
          )}
        </div>
      )}

      {invoices.length === 0 && !isLoading && (
        <EmptyState
          icon={FileText}
          title="لا توجد فواتير"
          description="لم يتم إنشاء أي فواتير بعد. ابدأ بإضافة فاتورة جديدة لتتبع المدفوعات."
          actionLabel="إنشاء فاتورة جديدة"
          onAction={() => onSectionChange('new-invoice')}
        />
      )}
      <DeleteConfirmation
        itemName={deleteTarget?.label ?? ''}
        onConfirm={() => {
          if (!deleteTarget) {
            return
          }
          void removeInvoice(deleteTarget.id)
          setDeleteTarget(null)
        }}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />
    </PageLayout>
  )
}
