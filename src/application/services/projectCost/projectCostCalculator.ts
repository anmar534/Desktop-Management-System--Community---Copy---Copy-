/**
 * Project Cost Calculator
 * Pure calculation logic for cost decomposition, totals, and variance
 */

import type {
  BreakdownRow,
  CostSideData,
  ProjectCostItem,
  ProjectBOQData,
} from './projectCostTypes'
import type { Project } from '@/data/centralData'
import type { ProjectCostEnvelope } from './projectCostTypes'

/**
 * Sum breakdown rows total costs
 */
export const sumBreakdownRows = (rows: BreakdownRow[]): number =>
  Array.isArray(rows) ? rows.reduce((sum, row) => sum + (row.totalCost || 0), 0) : 0

/**
 * Clone breakdown rows
 */
export const cloneBreakdownRows = (rows: BreakdownRow[]): BreakdownRow[] =>
  rows.map((row) => ({ ...row }))

/**
 * Compute variance between actual and estimated
 */
export function computeItemVariance(item: ProjectCostItem) {
  const value = item.actual.totalPrice - item.estimated.totalPrice
  const pct =
    item.estimated.totalPrice > 0
      ? (value / item.estimated.totalPrice) * 100
      : item.actual.totalPrice > 0
        ? 100
        : 0
  item.variance = { value, pct }
}

/**
 * Recompute totals for entire BOQ
 * - Recalculates actual side from breakdown + percentages
 * - Updates totals and variance
 */
export function recomputeTotals(boq: ProjectBOQData) {
  let estimatedTotal = 0
  let actualTotal = 0

  for (const it of boq.items) {
    // التقديري: لا يُعاد حسابه هنا (يُعرض كما ورد من صفحة التسعير)
    // الفعلي فقط يُعاد حسابه من التحليل (breakdown) + النسب لأن هذه الصفحة مسؤولة عنه
    const recomputeActual = (side: CostSideData) => {
      if (!side?.breakdown) return

      const sumRows = (rows: BreakdownRow[]) => sumBreakdownRows(rows)

      // اختيار: إذا وُجدت breakdownTables نأخذ مجموعها، وإلا نستخدم breakdown الأحادي
      let base = 0
      if (Array.isArray(side.breakdownTables) && side.breakdownTables.length > 0) {
        for (const tbl of side.breakdownTables) {
          if (!tbl?.breakdown) continue
          base +=
            sumRows(tbl.breakdown.materials) +
            sumRows(tbl.breakdown.labor) +
            sumRows(tbl.breakdown.equipment) +
            sumRows(tbl.breakdown.subcontractors)
        }
      } else {
        base =
          sumRows(side.breakdown.materials) +
          sumRows(side.breakdown.labor) +
          sumRows(side.breakdown.equipment) +
          sumRows(side.breakdown.subcontractors)
      }

      if (base > 0) {
        const adminPct = side.additionalPercentages?.administrative ?? 0
        const opPct = side.additionalPercentages?.operational ?? 0
        const profitPct = side.additionalPercentages?.profit ?? 0

        const administrativeValue = base * (adminPct / 100)
        const operationalValue = base * (opPct / 100)
        const profitValue = base * (profitPct / 100)

        const totalBeforeTax = base + administrativeValue + operationalValue + profitValue

        if (!side.quantity || side.quantity <= 0) side.quantity = 1

        const calculatedUnitPrice = totalBeforeTax / side.quantity
        side.unitPrice = +calculatedUnitPrice.toFixed(4)
        side.totalPrice = +totalBeforeTax.toFixed(2)
      }
    }

    recomputeActual(it.actual)
    computeItemVariance(it)

    estimatedTotal += it.estimated.totalPrice
    actualTotal += it.actual.totalPrice
  }

  const varianceTotal = actualTotal - estimatedTotal
  const variancePct =
    estimatedTotal > 0 ? (varianceTotal / estimatedTotal) * 100 : actualTotal > 0 ? 100 : 0

  boq.totals = { estimatedTotal, actualTotal, varianceTotal, variancePct }
  boq.lastUpdated = new Date().toISOString()
}

/**
 * Recompute profit metrics for a project based on cost envelope
 */
export function recomputeProfitMetrics(project: Project, envelope: ProjectCostEnvelope) {
  if (!envelope.draft) return

  const estimatedCost = envelope.draft.totals.estimatedTotal
  const actualCost = envelope.draft.totals.actualTotal

  project.estimatedCost = estimatedCost
  project.actualCost = actualCost
  project.spent = actualCost
  project.remaining = project.contractValue - actualCost
  project.actualProfit = project.contractValue - actualCost
}

/**
 * Decompose actual cost into breakdown components
 */
export function computeActualCostDecomposition(item: ProjectCostItem) {
  // This would analyze actual breakdown tables and compute detailed cost decomposition
  // For now, placeholder for future enhancement
  return {
    materials: sumBreakdownRows(item.actual.breakdown.materials),
    labor: sumBreakdownRows(item.actual.breakdown.labor),
    equipment: sumBreakdownRows(item.actual.breakdown.equipment),
    subcontractors: sumBreakdownRows(item.actual.breakdown.subcontractors),
  }
}
