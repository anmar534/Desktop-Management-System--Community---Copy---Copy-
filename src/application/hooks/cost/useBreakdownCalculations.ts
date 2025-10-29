/**
 * useBreakdownCalculations Hook
 *
 * منطق حساب التكاليف من breakdown (materials, labor, equipment, subcontractors)
 * يشمل حساب النسب الإضافية (إدارية، تشغيلية، ربح) والضريبة
 */

import { useMemo } from 'react'

interface BreakdownRow {
  id: string
  name: string
  quantity: number
  unitCost: number
  totalCost?: number
  unit?: string
  origin?: string
}

interface CostBreakdownSet {
  materials: BreakdownRow[]
  labor: BreakdownRow[]
  equipment: BreakdownRow[]
  subcontractors: BreakdownRow[]
}

interface AdditionalPercentages {
  administrative: number
  operational: number
  profit: number
}

export interface BreakdownCalculations {
  // التكاليف الأساسية
  materialsTotal: number
  laborTotal: number
  equipmentTotal: number
  subcontractorsTotal: number
  baseAmount: number

  // النسب الإضافية
  administrativeAmount: number
  operationalAmount: number
  profitAmount: number

  // الإجماليات
  subtotalWithoutVAT: number
  vatAmount: number
  totalWithVAT: number

  // السعر للوحدة
  unitPrice: number
}

/**
 * حساب مجموع صفوف breakdown
 */
function sumRows(rows: BreakdownRow[] | undefined): number {
  if (!rows?.length) return 0

  return rows.reduce((sum, row) => {
    const total = row.totalCost ?? row.quantity * row.unitCost
    return sum + (Number.isFinite(total) ? total : 0)
  }, 0)
}

/**
 * Hook لحساب جميع التكاليف من breakdown
 */
export function useBreakdownCalculations(
  breakdown: CostBreakdownSet | undefined,
  percentages: AdditionalPercentages,
  quantity = 1,
  vatRate = 0.15,
): BreakdownCalculations {
  return useMemo(() => {
    if (!breakdown) {
      return {
        materialsTotal: 0,
        laborTotal: 0,
        equipmentTotal: 0,
        subcontractorsTotal: 0,
        baseAmount: 0,
        administrativeAmount: 0,
        operationalAmount: 0,
        profitAmount: 0,
        subtotalWithoutVAT: 0,
        vatAmount: 0,
        totalWithVAT: 0,
        unitPrice: 0,
      }
    }

    // 1. حساب التكاليف الأساسية
    const materialsTotal = sumRows(breakdown.materials)
    const laborTotal = sumRows(breakdown.labor)
    const equipmentTotal = sumRows(breakdown.equipment)
    const subcontractorsTotal = sumRows(breakdown.subcontractors)
    const baseAmount = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

    // 2. حساب النسب الإضافية
    const administrativeAmount = baseAmount * (percentages.administrative / 100)
    const operationalAmount = baseAmount * (percentages.operational / 100)
    const profitAmount = baseAmount * (percentages.profit / 100)

    // 3. حساب الإجمالي قبل الضريبة
    const subtotalWithoutVAT = baseAmount + administrativeAmount + operationalAmount + profitAmount

    // 4. حساب الضريبة
    const vatAmount = subtotalWithoutVAT * vatRate

    // 5. الإجمالي مع الضريبة
    const totalWithVAT = subtotalWithoutVAT + vatAmount

    // 6. سعر الوحدة (بدون ضريبة حسب المعادلة المستخدمة في التسعير)
    const normalizedQuantity = quantity > 0 ? quantity : 1
    const unitPrice = subtotalWithoutVAT / normalizedQuantity

    return {
      materialsTotal,
      laborTotal,
      equipmentTotal,
      subcontractorsTotal,
      baseAmount,
      administrativeAmount,
      operationalAmount,
      profitAmount,
      subtotalWithoutVAT,
      vatAmount,
      totalWithVAT,
      unitPrice,
    }
  }, [breakdown, percentages, quantity, vatRate])
}

/**
 * التحقق من صحة الحسابات - مقارنة مع القيم المحفوظة
 */
export function validateCalculationConsistency(
  calculatedTotal: number,
  savedTotal: number,
  tolerance = 0.01,
): boolean {
  return Math.abs(calculatedTotal - savedTotal) <= tolerance
}
