// CostAnalysisTable Component
// Displays cost breakdown for a priced item

import type { PricingData } from '../types'

interface CostAnalysisTableProps {
  pricingData: PricingData
  formatCurrency: (value: number) => string
}

export function CostAnalysisTable({ pricingData, formatCurrency }: CostAnalysisTableProps) {
  const calculateSectionTotal = (
    rows: Array<{ total?: number; price?: number; quantity?: number }>,
  ): number => {
    return rows.reduce((sum, row) => sum + (row.total || row.price || 0), 0)
  }

  const materialsTotal = calculateSectionTotal(pricingData.materials || [])
  const laborTotal = calculateSectionTotal(pricingData.labor || [])
  const equipmentTotal = calculateSectionTotal(pricingData.equipment || [])
  const subcontractorsTotal = calculateSectionTotal(pricingData.subcontractors || [])
  const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">المواد:</span>
        <span className="font-medium">{formatCurrency(materialsTotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">العمالة:</span>
        <span className="font-medium">{formatCurrency(laborTotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">المعدات:</span>
        <span className="font-medium">{formatCurrency(equipmentTotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">المقاولين:</span>
        <span className="font-medium">{formatCurrency(subcontractorsTotal)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>الإجمالي:</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  )
}
