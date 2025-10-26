/**
 * Event handlers for TendersPage
 */

import { toast } from 'sonner'
import type { Tender } from '@/data/centralData'

/**
 * Handles tender deletion
 */
export const createDeleteHandler = (
  deleteTender: (id: string) => Promise<boolean>,
  onSuccess: () => void,
) => {
  return async (tender: Tender) => {
    try {
      await deleteTender(tender.id)
      toast.success('تم حذف المنافسة بنجاح')
      onSuccess()
    } catch (error) {
      console.error('Error deleting tender:', error)
      toast.error('حدث خطأ أثناء حذف المنافسة')
    }
  }
}

/**
 * Handles tender submission
 */
export const createSubmitHandler = (
  formatCurrencyValue: (value: number, options?: Intl.NumberFormatOptions) => string,
  refreshTenders: () => Promise<void>,
) => {
  return async (tender: Tender) => {
    try {
      console.log('🚀 [Tenders] بدء تدفق تقديم المنافسة:', tender.id)
      const { tenderSubmissionService } = await import(
        '@/application/services/tenderSubmissionService'
      )
      const result = await tenderSubmissionService.submit(tender)

      await refreshTenders()

      const { created, purchaseOrder, bookletExpense, counts } = result

      console.log('✅ [Tenders] تم تحديث المنافسة وإجراءاتها المرتبطة', {
        tenderId: result.tender.id,
        purchaseOrderId: purchaseOrder.id,
        bookletExpenseId: bookletExpense?.id ?? null,
        createdFlags: created,
        counts,
      })

      const summaryParts: string[] = []
      if (created.purchaseOrder) {
        summaryParts.push('تم إنشاء أمر شراء للمنافسة')
      } else if (counts.after.ordersCount > 0) {
        summaryParts.push('أمر الشراء موجود مسبقاً')
      }

      if (bookletExpense) {
        const formattedBookletExpense = formatCurrencyValue(bookletExpense.amount, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        if (created.bookletExpense) {
          summaryParts.push(`تم إنشاء مصروف الكراسة بقيمة ${formattedBookletExpense}`)
        } else {
          summaryParts.push(`مصروف الكراسة الحالي ${formattedBookletExpense}`)
        }
      } else if (created.bookletExpense) {
        summaryParts.push('تم تسجيل مصروف الكراسة')
      } else if (counts.after.expensesCount > 0) {
        summaryParts.push('مصروف الكراسة موجود مسبقاً')
      }

      if (summaryParts.length === 0) {
        summaryParts.push('تم تحديث حالة المنافسة والإحصائيات بنجاح')
      }

      toast.success('تم تقديم العرض بنجاح', {
        description: summaryParts.join(' • '),
      })
    } catch (error) {
      console.error('Error submitting tender:', error)
      toast.error('حدث خطأ أثناء تقديم العرض')
      throw error
    }
  }
}

/**
 * Handles status revert
 */
export const createRevertHandler = (updateTender: (tender: Tender) => Promise<Tender>) => {
  return async (tender: Tender) => {
    try {
      let newStatus = tender.status

      if (tender.status === 'won' || tender.status === 'lost') {
        newStatus = 'submitted'
      } else if (tender.status === 'submitted') {
        newStatus = 'ready_to_submit'
      } else if (tender.status === 'ready_to_submit') {
        newStatus = 'under_action'
      } else {
        toast.error('لا يمكن التراجع عن الحالة الحالية')
        return
      }

      await updateTender({
        ...tender,
        status: newStatus,
        lastUpdate: new Date().toISOString(),
        lastAction:
          (tender.status === 'won' || tender.status === 'lost') && newStatus === 'submitted'
            ? 'تراجع من النتيجة النهائية - عودة لحالة مُرسلة'
            : newStatus === 'ready_to_submit'
              ? 'تراجع عن الإرسال - عودة لحالة جاهز للإرسال'
              : newStatus === 'under_action'
                ? 'تراجع للتسعير والتعديل'
                : 'تراجع عن الحالة',
      } as Tender)

      toast.success('تم التراجع بنجاح', {
        description: `تم إعادة المنافسة "${tender.name}" إلى الحالة السابقة`,
        duration: 3000,
      })
    } catch (error) {
      console.error('خطأ في التراجع:', error)
      toast.error('فشل في التراجع عن الحالة')
    }
  }
}
