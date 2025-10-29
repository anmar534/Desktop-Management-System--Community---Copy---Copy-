/**
 * useCostItemActions Hook
 *
 * منطق العمليات على بنود التكاليف
 * (إعادة حساب، تحديث، حذف، استيراد)
 */

import { useCallback, useState } from 'react'

interface CostItemActionsResult {
  // حالة التحميل
  isProcessing: boolean
  isImporting: boolean

  // العمليات
  recalculateItem: (
    item: any,
    onUpdate: (itemId: string, updates: any) => Promise<void>,
  ) => Promise<void>

  handleBreakdownUpdate: (
    item: any,
    section: string,
    rowId: string,
    field: string,
    value: string,
    onUpdate: (itemId: string, updates: any) => Promise<void>,
  ) => Promise<void>
}

/**
 * Hook للعمليات على بنود التكاليف
 */
export function useCostItemActions(): CostItemActionsResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting] = useState(false)

  /**
   * إعادة حساب البند من breakdown
   */
  const recalculateItem = useCallback(
    async (item: any, onUpdate: (itemId: string, updates: any) => Promise<void>) => {
      setIsProcessing(true)

      try {
        const breakdown = item.actual?.breakdown
        if (!breakdown) {
          console.warn(`⚠️ [useCostItemActions] لا يوجد breakdown للبند: ${item.id}`)
          return
        }

        // استخدام hook الحسابات (نحتاج استدعاءه مباشرة هنا)
        const materialsTotal = sumRows(breakdown.materials)
        const laborTotal = sumRows(breakdown.labor)
        const equipmentTotal = sumRows(breakdown.equipment)
        const subcontractorsTotal = sumRows(breakdown.subcontractors)
        const baseAmount = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

        if (baseAmount <= 0) {
          console.warn(
            `⚠️ [useCostItemActions] البند ${item.id} لا يحتوي على بيانات تكلفة (base = 0)`,
          )
          return
        }

        // النسب الافتراضية
        const percentages = item.actual?.additionalPercentages || {
          administrative: 5,
          operational: 3,
          profit: 10,
        }

        const administrativeAmount = baseAmount * (percentages.administrative / 100)
        const operationalAmount = baseAmount * (percentages.operational / 100)
        const profitAmount = baseAmount * (percentages.profit / 100)

        const totalPrice = baseAmount + administrativeAmount + operationalAmount + profitAmount
        const quantity =
          item.actual?.quantity && item.actual.quantity > 0 ? item.actual.quantity : 1
        const unitPrice = totalPrice / quantity

        // التحديث
        await onUpdate(item.id, {
          ...item,
          actual: {
            ...item.actual,
            quantity,
            unitPrice: +unitPrice.toFixed(4),
            totalPrice: +totalPrice.toFixed(2),
          },
        })

        console.log(`✅ [useCostItemActions] تم إعادة حساب البند ${item.id}:`, {
          baseAmount: baseAmount.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          unitPrice: unitPrice.toFixed(4),
        })
      } catch (error) {
        console.error('❌ [useCostItemActions] خطأ في إعادة الحساب:', error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [],
  )

  /**
   * تحديث صف في breakdown
   */
  const handleBreakdownUpdate = useCallback(
    async (
      item: any,
      section: string,
      rowId: string,
      field: string,
      value: string,
      onUpdate: (itemId: string, updates: any) => Promise<void>,
    ) => {
      try {
        const breakdown = { ...item.actual.breakdown }
        const rows = [...breakdown[section as keyof typeof breakdown]]
        let row = rows.find((r: any) => r.id === rowId)

        if (!row) {
          // إنشاء صف جديد
          row = {
            id: rowId,
            name: 'عنصر جديد',
            quantity: 0,
            unitCost: 0,
            totalCost: 0,
            origin: 'actual-only',
          }
          rows.push(row)
        }

        // تحديث الحقل
        if (field === 'quantity' || field === 'unitCost') {
          const numericValue = parseFloat(value) || 0
          row[field] = numericValue
          row.totalCost = row.quantity * row.unitCost
        } else {
          row[field] = value
        }

        breakdown[section as keyof typeof breakdown] = rows

        await onUpdate(item.id, {
          ...item,
          actual: {
            ...item.actual,
            breakdown,
          },
        })
      } catch (error) {
        console.error('❌ [useCostItemActions] خطأ في تحديث breakdown:', error)
        throw error
      }
    },
    [],
  )

  return {
    isProcessing,
    isImporting,
    recalculateItem,
    handleBreakdownUpdate,
  }
}

/**
 * دالة مساعدة لحساب مجموع الصفوف
 */
function sumRows(rows: any[] | undefined): number {
  if (!rows?.length) return 0

  return rows.reduce((sum, row) => {
    const total = row.totalCost ?? row.quantity * row.unitCost
    return sum + (Number.isFinite(total) ? total : 0)
  }, 0)
}
