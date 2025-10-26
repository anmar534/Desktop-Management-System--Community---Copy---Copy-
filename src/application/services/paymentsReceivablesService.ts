/**
 * خدمة إدارة المدفوعات والمستحقات
 * Payments and Receivables Management Service
 */

import { asyncStorage } from '@/shared/utils/storage/storage'

// أنواع البيانات
export interface Invoice {
  id: string
  invoiceNumber: string
  invoiceNumberEn: string
  projectId: string
  projectName: string
  projectNameEn: string
  clientId: string
  clientName: string
  clientNameEn: string
  amount: number
  vatAmount: number
  totalAmount: number
  currency: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentTerms: number // عدد الأيام
  description: string
  descriptionEn: string
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface InvoiceItem {
  id: string
  description: string
  descriptionEn: string
  quantity: number
  unitPrice: number
  totalPrice: number
  vatRate: number
  vatAmount: number
}

export interface Payment {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other'
  reference: string
  notes: string
  notesEn: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface Receivable {
  id: string
  invoiceId: string
  invoiceNumber: string
  clientId: string
  clientName: string
  clientNameEn: string
  originalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  daysOverdue: number
  status: 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'overdue_120_plus'
  agingCategory: string
  agingCategoryEn: string
  createdAt: string
  updatedAt: string
}

export interface PaymentAlert {
  id: string
  type: 'due_soon' | 'overdue' | 'payment_received'
  invoiceId: string
  invoiceNumber: string
  clientName: string
  clientNameEn: string
  amount: number
  dueDate: string
  daysOverdue?: number
  message: string
  messageEn: string
  isRead: boolean
  createdAt: string
}

export interface PaymentReport {
  id: string
  reportType: 'aging' | 'collection' | 'cash_flow' | 'payment_history'
  title: string
  titleEn: string
  period: {
    startDate: string
    endDate: string
  }
  data: any
  generatedAt: string
  generatedBy: string
}

export interface CollectionMetrics {
  totalReceivables: number
  currentReceivables: number
  overdueReceivables: number
  averageCollectionPeriod: number
  collectionEfficiency: number
  daysInAR: number // Days in Accounts Receivable
  agingBreakdown: {
    current: number
    overdue30: number
    overdue60: number
    overdue90: number
    overdue120Plus: number
  }
}

export class PaymentsReceivablesService {
  private readonly INVOICES_KEY = 'invoices'
  private readonly PAYMENTS_KEY = 'payments'
  private readonly RECEIVABLES_KEY = 'receivables'
  private readonly PAYMENT_ALERTS_KEY = 'payment_alerts'
  private readonly PAYMENT_REPORTS_KEY = 'payment_reports'

  // إدارة الفواتير
  async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
  ): Promise<Invoice> {
    try {
      const invoice: Invoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...invoiceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      const invoices = await this.getAllInvoices()
      invoices.push(invoice)
      await asyncStorage.setItem(this.INVOICES_KEY, invoices)

      // إنشاء مستحق جديد إذا كانت الفاتورة مرسلة
      if (invoice.status === 'sent') {
        await this.createReceivable(invoice)
      }

      return invoice
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw new Error('فشل في إنشاء الفاتورة')
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const invoices = await this.getAllInvoices()
      const index = invoices.findIndex((inv) => inv.id === id)

      if (index === -1) {
        throw new Error('الفاتورة غير موجودة')
      }

      const updatedInvoice = {
        ...invoices[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: invoices[index].version + 1,
      }

      invoices[index] = updatedInvoice
      await asyncStorage.setItem(this.INVOICES_KEY, invoices)

      // تحديث المستحق المرتبط
      if (updatedInvoice.status === 'sent' || updatedInvoice.status === 'overdue') {
        await this.updateReceivableFromInvoice(updatedInvoice)
      } else if (updatedInvoice.status === 'paid') {
        await this.removeReceivable(updatedInvoice.id)
      }

      return updatedInvoice
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw new Error('فشل في تحديث الفاتورة')
    }
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const invoices = await this.getAllInvoices()
      return invoices.find((inv) => inv.id === id) || null
    } catch (error) {
      console.error('Error getting invoice:', error)
      return null
    }
  }

  async getAllInvoices(): Promise<Invoice[]> {
    try {
      return (await asyncStorage.getItem(this.INVOICES_KEY)) || []
    } catch (error) {
      console.error('Error getting invoices:', error)
      return []
    }
  }

  async getInvoicesByStatus(status: Invoice['status']): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices()
      return invoices.filter((inv) => inv.status === status)
    } catch (error) {
      console.error('Error getting invoices by status:', error)
      return []
    }
  }

  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices()
      return invoices.filter((inv) => inv.clientId === clientId)
    } catch (error) {
      console.error('Error getting invoices by client:', error)
      return []
    }
  }

  // إدارة المدفوعات
  async recordPayment(
    paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
  ): Promise<Payment> {
    try {
      const payment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...paymentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      const payments = await this.getAllPayments()
      payments.push(payment)
      await asyncStorage.setItem(this.PAYMENTS_KEY, payments)

      // تحديث حالة الفاتورة
      await this.updateInvoicePaymentStatus(payment.invoiceId, payment.amount)

      // إنشاء تنبيه استلام دفعة
      await this.createPaymentAlert({
        type: 'payment_received',
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
      })

      return payment
    } catch (error) {
      console.error('Error recording payment:', error)
      throw new Error('فشل في تسجيل الدفعة')
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      return (await asyncStorage.getItem(this.PAYMENTS_KEY)) || []
    } catch (error) {
      console.error('Error getting payments:', error)
      return []
    }
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    try {
      const payments = await this.getAllPayments()
      return payments.filter((pay) => pay.invoiceId === invoiceId)
    } catch (error) {
      console.error('Error getting payments by invoice:', error)
      return []
    }
  }

  // إدارة المستحقات
  private async createReceivable(invoice: Invoice): Promise<void> {
    try {
      const receivable: Receivable = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        clientNameEn: invoice.clientNameEn,
        originalAmount: invoice.totalAmount,
        paidAmount: 0,
        remainingAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        daysOverdue: this.calculateDaysOverdue(invoice.dueDate),
        status: this.getAgingStatus(invoice.dueDate),
        agingCategory: this.getAgingCategory(invoice.dueDate),
        agingCategoryEn: this.getAgingCategoryEn(invoice.dueDate),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const receivables = await this.getAllReceivables()
      receivables.push(receivable)
      await asyncStorage.setItem(this.RECEIVABLES_KEY, receivables)
    } catch (error) {
      console.error('Error creating receivable:', error)
    }
  }

  async getAllReceivables(): Promise<Receivable[]> {
    try {
      return (await asyncStorage.getItem(this.RECEIVABLES_KEY)) || []
    } catch (error) {
      console.error('Error getting receivables:', error)
      return []
    }
  }

  // وظائف مساعدة
  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  private getAgingStatus(dueDate: string): Receivable['status'] {
    const daysOverdue = this.calculateDaysOverdue(dueDate)

    if (daysOverdue <= 0) return 'current'
    if (daysOverdue <= 30) return 'overdue_30'
    if (daysOverdue <= 60) return 'overdue_60'
    if (daysOverdue <= 90) return 'overdue_90'
    return 'overdue_120_plus'
  }

  private getAgingCategory(dueDate: string): string {
    const status = this.getAgingStatus(dueDate)
    const categories = {
      current: 'جاري',
      overdue_30: 'متأخر 1-30 يوم',
      overdue_60: 'متأخر 31-60 يوم',
      overdue_90: 'متأخر 61-90 يوم',
      overdue_120_plus: 'متأخر أكثر من 90 يوم',
    }
    return categories[status]
  }

  private getAgingCategoryEn(dueDate: string): string {
    const status = this.getAgingStatus(dueDate)
    const categories = {
      current: 'Current',
      overdue_30: '1-30 Days Overdue',
      overdue_60: '31-60 Days Overdue',
      overdue_90: '61-90 Days Overdue',
      overdue_120_plus: '90+ Days Overdue',
    }
    return categories[status]
  }

  private async updateInvoicePaymentStatus(
    invoiceId: string,
    paymentAmount: number,
  ): Promise<void> {
    try {
      const invoice = await this.getInvoice(invoiceId)
      if (!invoice) return

      const payments = await this.getPaymentsByInvoice(invoiceId)
      const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)

      if (totalPaid >= invoice.totalAmount) {
        await this.updateInvoice(invoiceId, { status: 'paid' })
      }
    } catch (error) {
      console.error('Error updating invoice payment status:', error)
    }
  }

  private async updateReceivableFromInvoice(invoice: Invoice): Promise<void> {
    try {
      const receivables = await this.getAllReceivables()
      const index = receivables.findIndex((rec) => rec.invoiceId === invoice.id)

      if (index !== -1) {
        const payments = await this.getPaymentsByInvoice(invoice.id)
        const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)

        receivables[index] = {
          ...receivables[index],
          paidAmount: totalPaid,
          remainingAmount: invoice.totalAmount - totalPaid,
          daysOverdue: this.calculateDaysOverdue(invoice.dueDate),
          status: this.getAgingStatus(invoice.dueDate),
          agingCategory: this.getAgingCategory(invoice.dueDate),
          agingCategoryEn: this.getAgingCategoryEn(invoice.dueDate),
          updatedAt: new Date().toISOString(),
        }

        await asyncStorage.setItem(this.RECEIVABLES_KEY, receivables)
      }
    } catch (error) {
      console.error('Error updating receivable:', error)
    }
  }

  private async removeReceivable(invoiceId: string): Promise<void> {
    try {
      const receivables = await this.getAllReceivables()
      const filtered = receivables.filter((rec) => rec.invoiceId !== invoiceId)
      await asyncStorage.setItem(this.RECEIVABLES_KEY, filtered)
    } catch (error) {
      console.error('Error removing receivable:', error)
    }
  }

  private async createPaymentAlert(alertData: Partial<PaymentAlert>): Promise<void> {
    try {
      const invoice = await this.getInvoice(alertData.invoiceId!)
      if (!invoice) return

      const alert: PaymentAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertData.type!,
        invoiceId: alertData.invoiceId!,
        invoiceNumber: alertData.invoiceNumber || invoice.invoiceNumber,
        clientName: alertData.clientName || invoice.clientName,
        clientNameEn: alertData.clientNameEn || invoice.clientNameEn,
        amount: alertData.amount || invoice.totalAmount,
        dueDate: alertData.dueDate || invoice.dueDate,
        daysOverdue: alertData.daysOverdue,
        message: this.generateAlertMessage(alertData.type!, invoice),
        messageEn: this.generateAlertMessageEn(alertData.type!, invoice),
        isRead: false,
        createdAt: new Date().toISOString(),
      }

      const alerts = await this.getAllPaymentAlerts()
      alerts.push(alert)
      await asyncStorage.setItem(this.PAYMENT_ALERTS_KEY, alerts)
    } catch (error) {
      console.error('Error creating payment alert:', error)
    }
  }

  async getAllPaymentAlerts(): Promise<PaymentAlert[]> {
    try {
      return (await asyncStorage.getItem(this.PAYMENT_ALERTS_KEY)) || []
    } catch (error) {
      console.error('Error getting payment alerts:', error)
      return []
    }
  }

  private generateAlertMessage(type: PaymentAlert['type'], invoice: Invoice): string {
    switch (type) {
      case 'due_soon':
        return `الفاتورة ${invoice.invoiceNumber} مستحقة خلال 3 أيام`
      case 'overdue':
        return `الفاتورة ${invoice.invoiceNumber} متأخرة عن موعد الاستحقاق`
      case 'payment_received':
        return `تم استلام دفعة للفاتورة ${invoice.invoiceNumber}`
      default:
        return 'تنبيه مالي'
    }
  }

  private generateAlertMessageEn(type: PaymentAlert['type'], invoice: Invoice): string {
    switch (type) {
      case 'due_soon':
        return `Invoice ${invoice.invoiceNumberEn} is due in 3 days`
      case 'overdue':
        return `Invoice ${invoice.invoiceNumberEn} is overdue`
      case 'payment_received':
        return `Payment received for invoice ${invoice.invoiceNumberEn}`
      default:
        return 'Financial alert'
    }
  }

  // تقارير وتحليلات
  async generateAgingReport(): Promise<PaymentReport> {
    try {
      const receivables = await this.getAllReceivables()

      const agingData = {
        current: receivables.filter((r) => r.status === 'current'),
        overdue30: receivables.filter((r) => r.status === 'overdue_30'),
        overdue60: receivables.filter((r) => r.status === 'overdue_60'),
        overdue90: receivables.filter((r) => r.status === 'overdue_90'),
        overdue120Plus: receivables.filter((r) => r.status === 'overdue_120_plus'),
      }

      const report: PaymentReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportType: 'aging',
        title: 'تقرير أعمار المستحقات',
        titleEn: 'Accounts Receivable Aging Report',
        period: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        data: agingData,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
      }

      const reports = await this.getAllReports()
      reports.push(report)
      await asyncStorage.setItem(this.PAYMENT_REPORTS_KEY, reports)

      return report
    } catch (error) {
      console.error('Error generating aging report:', error)
      throw new Error('فشل في إنشاء تقرير أعمار المستحقات')
    }
  }

  async calculateCollectionMetrics(): Promise<CollectionMetrics> {
    try {
      const receivables = await this.getAllReceivables()
      const invoices = await this.getAllInvoices()
      const payments = await this.getAllPayments()

      const totalReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0)
      const currentReceivables = receivables
        .filter((r) => r.status === 'current')
        .reduce((sum, r) => sum + r.remainingAmount, 0)
      const overdueReceivables = totalReceivables - currentReceivables

      // حساب متوسط فترة التحصيل
      const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
      let totalCollectionDays = 0
      let collectionCount = 0

      for (const invoice of paidInvoices) {
        const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id)
        if (invoicePayments.length > 0) {
          const lastPayment = invoicePayments.sort(
            (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
          )[0]

          const issueDate = new Date(invoice.issueDate)
          const paymentDate = new Date(lastPayment.paymentDate)
          const collectionDays = Math.ceil(
            (paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24),
          )

          totalCollectionDays += collectionDays
          collectionCount++
        }
      }

      const averageCollectionPeriod =
        collectionCount > 0 ? totalCollectionDays / collectionCount : 0

      // حساب كفاءة التحصيل
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0)
      const collectionEfficiency = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0

      // حساب أيام المستحقات
      const dailySales = totalInvoiced / 365
      const daysInAR = dailySales > 0 ? totalReceivables / dailySales : 0

      const agingBreakdown = {
        current: receivables
          .filter((r) => r.status === 'current')
          .reduce((sum, r) => sum + r.remainingAmount, 0),
        overdue30: receivables
          .filter((r) => r.status === 'overdue_30')
          .reduce((sum, r) => sum + r.remainingAmount, 0),
        overdue60: receivables
          .filter((r) => r.status === 'overdue_60')
          .reduce((sum, r) => sum + r.remainingAmount, 0),
        overdue90: receivables
          .filter((r) => r.status === 'overdue_90')
          .reduce((sum, r) => sum + r.remainingAmount, 0),
        overdue120Plus: receivables
          .filter((r) => r.status === 'overdue_120_plus')
          .reduce((sum, r) => sum + r.remainingAmount, 0),
      }

      return {
        totalReceivables,
        currentReceivables,
        overdueReceivables,
        averageCollectionPeriod,
        collectionEfficiency,
        daysInAR,
        agingBreakdown,
      }
    } catch (error) {
      console.error('Error calculating collection metrics:', error)
      throw new Error('فشل في حساب مؤشرات التحصيل')
    }
  }

  async getAllReports(): Promise<PaymentReport[]> {
    try {
      return (await asyncStorage.getItem(this.PAYMENT_REPORTS_KEY)) || []
    } catch (error) {
      console.error('Error getting reports:', error)
      return []
    }
  }

  // تحديث التنبيهات
  async updateOverdueAlerts(): Promise<void> {
    try {
      const invoices = await this.getAllInvoices()
      const today = new Date()

      for (const invoice of invoices) {
        if (invoice.status === 'sent') {
          const dueDate = new Date(invoice.dueDate)
          const daysUntilDue = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
          const daysOverdue = this.calculateDaysOverdue(invoice.dueDate)

          // تنبيه قبل الاستحقاق بـ 3 أيام
          if (daysUntilDue === 3) {
            await this.createPaymentAlert({
              type: 'due_soon',
              invoiceId: invoice.id,
              dueDate: invoice.dueDate,
            })
          }

          // تنبيه عند التأخير
          if (daysOverdue > 0) {
            await this.updateInvoice(invoice.id, { status: 'overdue' })
            await this.createPaymentAlert({
              type: 'overdue',
              invoiceId: invoice.id,
              daysOverdue,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error updating overdue alerts:', error)
    }
  }

  // تحديث جميع البيانات
  async refreshAllData(): Promise<void> {
    try {
      await this.updateOverdueAlerts()

      // تحديث المستحقات
      const invoices = await this.getAllInvoices()
      for (const invoice of invoices) {
        if (invoice.status === 'sent' || invoice.status === 'overdue') {
          await this.updateReceivableFromInvoice(invoice)
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
      throw new Error('فشل في تحديث البيانات')
    }
  }

  // البحث والتصفية
  async searchInvoices(query: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices()
      const searchTerm = query.toLowerCase()

      return invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
          invoice.invoiceNumberEn.toLowerCase().includes(searchTerm) ||
          invoice.clientName.toLowerCase().includes(searchTerm) ||
          invoice.clientNameEn.toLowerCase().includes(searchTerm) ||
          invoice.description.toLowerCase().includes(searchTerm) ||
          invoice.descriptionEn.toLowerCase().includes(searchTerm),
      )
    } catch (error) {
      console.error('Error searching invoices:', error)
      return []
    }
  }

  async getInvoicesByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices()
      const start = new Date(startDate)
      const end = new Date(endDate)

      return invoices.filter((invoice) => {
        const issueDate = new Date(invoice.issueDate)
        return issueDate >= start && issueDate <= end
      })
    } catch (error) {
      console.error('Error getting invoices by date range:', error)
      return []
    }
  }

  // إحصائيات سريعة
  async getQuickStats(): Promise<{
    totalInvoices: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    overdueAmount: number
    overdueCount: number
  }> {
    try {
      const invoices = await this.getAllInvoices()
      const payments = await this.getAllPayments()

      const totalInvoices = invoices.length
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const paidAmount = payments.reduce((sum, pay) => sum + pay.amount, 0)
      const pendingInvoices = invoices.filter((inv) => inv.status === 'sent')
      const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue')

      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const overdueCount = overdueInvoices.length

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        overdueCount,
      }
    } catch (error) {
      console.error('Error getting quick stats:', error)
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        overdueCount: 0,
      }
    }
  }
}
