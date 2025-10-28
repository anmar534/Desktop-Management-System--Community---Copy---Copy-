/**
 * Budget Comparator Module
 * Compares estimated vs actual budget data
 */

import type { ProjectBudgetComparison } from './types'
import { DataLoader } from './dataLoader'
import { EstimatedPricingExtractor } from './estimatedPricingExtractor'
import { ResourceCalculator } from './resourceCalculator'

export class BudgetComparator {
  /**
   * Compare project budget: estimated vs actual
   */
  static async compareProjectBudget(projectId: string): Promise<ProjectBudgetComparison[]> {
    try {
      // البحث عن المنافسة المرتبطة بالمشروع
      const relatedTender = await DataLoader.resolveTenderForProject(projectId)
      if (!relatedTender) {
        console.warn('لم يتم العثور على منافسة مرتبطة بالمشروع')
        return []
      }

      // استخراج البيانات التقديرية من المنافسة
      const estimatedData = await EstimatedPricingExtractor.extractEstimatedPricing(
        relatedTender.id,
      )

      // استخراج البيانات الفعلية من المشروع
      const projectBOQ = await DataLoader.loadProjectBOQ(projectId)
      if (!projectBOQ) {
        console.warn('لم يتم العثور على BOQ للمشروع')
        return []
      }

      const comparisons: ProjectBudgetComparison[] = []

      const items = Array.isArray(projectBOQ.items) ? projectBOQ.items : []
      for (const boqItem of items) {
        const estimatedItem = estimatedData.get(boqItem.id)

        if (estimatedItem) {
          // حساب البيانات التقديرية
          const estimatedMaterials = estimatedItem.materials.reduce((sum, m) => sum + m.total, 0)
          const estimatedLabor = estimatedItem.labor.reduce((sum, l) => sum + l.total, 0)
          const estimatedEquipment = estimatedItem.equipment.reduce((sum, e) => sum + e.total, 0)
          const estimatedSubcontractors = estimatedItem.subcontractors.reduce(
            (sum, s) => sum + s.total,
            0,
          )
          const estimatedSubtotal =
            estimatedMaterials + estimatedLabor + estimatedEquipment + estimatedSubcontractors

          const estimatedAdmin =
            (estimatedSubtotal * estimatedItem.additionalPercentages.administrative) / 100
          const estimatedOperational =
            (estimatedSubtotal * estimatedItem.additionalPercentages.operational) / 100
          const estimatedProfit =
            (estimatedSubtotal * estimatedItem.additionalPercentages.profit) / 100
          const estimatedTotal =
            estimatedSubtotal + estimatedAdmin + estimatedOperational + estimatedProfit

          // حساب البيانات الفعلية
          const actualMaterials = ResourceCalculator.sumLegacyResourceTotals(boqItem.materials)
          const actualLabor = ResourceCalculator.sumLegacyResourceTotals(boqItem.labor)
          const actualEquipment = ResourceCalculator.sumLegacyResourceTotals(boqItem.equipment)
          const actualSubcontractors = ResourceCalculator.sumLegacyResourceTotals(
            boqItem.subcontractors,
          )
          const actualTotal =
            boqItem.actualQuantity && boqItem.actualUnitPrice
              ? boqItem.actualQuantity * boqItem.actualUnitPrice
              : actualMaterials + actualLabor + actualEquipment + actualSubcontractors

          // حساب الفرق
          const varianceAmount = actualTotal - estimatedTotal
          const variancePercentage =
            estimatedTotal > 0 ? (varianceAmount / estimatedTotal) * 100 : 0

          // تحديد الحالة والتنبيهات
          let status: 'over-budget' | 'under-budget' | 'on-budget' = 'on-budget'
          const alerts: string[] = []

          if (Math.abs(variancePercentage) > 5) {
            if (varianceAmount > 0) {
              status = 'over-budget'
              alerts.push(`تجاوز الميزانية بنسبة ${variancePercentage.toFixed(1)}%`)

              if (variancePercentage > 20) {
                alerts.push('⚠️ تجاوز خطير للميزانية - يتطلب مراجعة فورية')
              } else if (variancePercentage > 10) {
                alerts.push('⚠️ تجاوز متوسط للميزانية - يتطلب متابعة')
              }
            } else {
              status = 'under-budget'
              alerts.push(`توفير في الميزانية بنسبة ${Math.abs(variancePercentage).toFixed(1)}%`)
            }
          }

          comparisons.push({
            itemId: boqItem.id,
            description: boqItem.description,
            unit: boqItem.unit ?? '',
            quantity: boqItem.quantity ?? 0,
            estimated: {
              materials: estimatedMaterials,
              labor: estimatedLabor,
              equipment: estimatedEquipment,
              subcontractors: estimatedSubcontractors,
              administrative: estimatedAdmin,
              operational: estimatedOperational,
              profit: estimatedProfit,
              total: estimatedTotal,
              unitPrice: (boqItem.quantity ?? 0) > 0 ? estimatedTotal / (boqItem.quantity ?? 0) : 0,
            },
            actual: {
              materials: actualMaterials,
              labor: actualLabor,
              equipment: actualEquipment,
              subcontractors: actualSubcontractors,
              total: actualTotal,
              unitPrice: (boqItem.quantity ?? 0) > 0 ? actualTotal / (boqItem.quantity ?? 0) : 0,
            },
            variance: {
              amount: varianceAmount,
              percentage: variancePercentage,
              status,
              alerts,
            },
          })
        }
      }

      return comparisons
    } catch (error) {
      console.error('خطأ في مقارنة ميزانية المشروع:', error)
      return []
    }
  }
}
