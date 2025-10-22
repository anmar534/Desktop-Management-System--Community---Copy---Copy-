// useTenderActions Hook
// Manages tender actions (submit, update status, etc.)

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useTenderActions(
  tender: any,
  localTender: any,
  setLocalTender: (tender: any) => void,
  formatCurrencyValue: (value: number, options?: any) => string,
) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const handleSubmitTender = useCallback(() => {
    setShowSubmitDialog(true)
  }, [])

  const handleConfirmSubmit = useCallback(async () => {
    setShowSubmitDialog(false)

    try {
      const currentTender = localTender ?? tender
      console.log('🚀 بدء عملية إرسال المنافسة:', currentTender.id)

      const { tenderSubmissionService } = await import(
        '@/application/services/tenderSubmissionService'
      )
      const result = await tenderSubmissionService.submit(currentTender)

      setLocalTender(result.tender)

      const { created, purchaseOrder, bookletExpense, counts } = result

      console.log('✅ تم استكمال تدفق الإرسال', {
        tenderId: result.tender.id,
        purchaseOrderId: purchaseOrder.id,
        bookletExpenseId: bookletExpense?.id ?? null,
        created,
        counts,
      })

      const summary: string[] = []
      if (created.purchaseOrder) {
        summary.push('تم إنشاء أمر شراء للمنافسة')
      } else if (counts.after.ordersCount > 0) {
        summary.push('أمر الشراء موجود مسبقاً')
      }

      if (bookletExpense) {
        const amount = formatCurrencyValue(bookletExpense.amount, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        if (created.bookletExpense) {
          summary.push(`تم إنشاء مصروف الكراسة بقيمة ${amount}`)
        } else {
          summary.push(`مصروف الكراسة الحالي ${amount}`)
        }
      } else if (created.bookletExpense) {
        summary.push('تم تسجيل مصروف الكراسة')
      } else if (counts.after.expensesCount > 0) {
        summary.push('مصروف الكراسة موجود مسبقاً')
      }

      if (summary.length === 0) {
        summary.push('تم تحديث حالة المنافسة والإحصائيات بنجاح')
      }

      toast.success('تم تقديم العرض بنجاح', {
        description: summary.join(' • '),
      })
    } catch (error) {
      console.error('❌ خطأ في إرسال المنافسة:', error)
      toast.error('حدث خطأ أثناء تقديم العرض')
    }
  }, [localTender, tender, setLocalTender, formatCurrencyValue])

  return {
    showSubmitDialog,
    setShowSubmitDialog,
    handleSubmitTender,
    handleConfirmSubmit,
  }
}
