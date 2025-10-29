/**
 * Budget Comparator Module
 * Compares estimated vs actual budget data
 */

import type { ProjectBudgetComparison } from './types'
import { DataLoader } from './dataLoader'
import { EstimatedPricingExtractor } from './estimatedPricingExtractor'

export class BudgetComparator {
  /**
   * Compare project budget: estimated vs actual
   */
  static async compareProjectBudget(projectId: string): Promise<ProjectBudgetComparison[]> {
    try {
      console.log('🔍 [BudgetComparator] Starting comparison for project:', projectId)

      // البحث عن المنافسة المرتبطة بالمشروع
      const relatedTender = await DataLoader.resolveTenderForProject(projectId)
      if (!relatedTender) {
        console.warn('⚠️ [BudgetComparator] لم يتم العثور على منافسة مرتبطة بالمشروع')
        return []
      }

      console.log(
        '✅ [BudgetComparator] Found related tender:',
        relatedTender.id,
        relatedTender.name,
      )

      // استخراج البيانات التقديرية من المنافسة
      const estimatedData = await EstimatedPricingExtractor.extractEstimatedPricing(
        relatedTender.id,
      )

      console.log('📊 [BudgetComparator] Extracted estimated data items:', estimatedData.size)

      // استخراج البيانات الفعلية من المشروع - نستخدم tenderId لأن BOQ مخزن بالمنافسة
      const projectBOQ = await DataLoader.loadProjectBOQ(relatedTender.id)
      if (!projectBOQ) {
        console.warn('❌ [BudgetComparator] لم يتم العثور على BOQ للمنافسة:', relatedTender.id)
        return []
      }

      console.log('✅ [BudgetComparator] Loaded BOQ with items:', projectBOQ.items?.length ?? 0)

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

          // حساب البيانات الفعلية - استخدام actual.totalPrice مباشرة
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actualQuantity = (boqItem as any).actual?.quantity ?? boqItem.quantity ?? 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actualUnitPrice = (boqItem as any).actual?.unitPrice ?? 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actualTotal =
            (boqItem as any).actual?.totalPrice ?? actualQuantity * actualUnitPrice

          console.log(`💰 [BudgetComparator] Item ${boqItem.id}:`, {
            description: (boqItem.canonicalDescription || boqItem.description || '').substring(
              0,
              40,
            ),
            estimated: {
              total: estimatedTotal,
              unitPrice: (boqItem.quantity ?? 0) > 0 ? estimatedTotal / (boqItem.quantity ?? 0) : 0,
            },
            actual: { total: actualTotal, unitPrice: actualUnitPrice, quantity: actualQuantity },
          })

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
            description:
              boqItem.canonicalDescription || boqItem.description || `بند رقم ${boqItem.id}`,
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
              materials: 0,
              labor: 0,
              equipment: 0,
              subcontractors: 0,
              total: actualTotal,
              unitPrice: actualUnitPrice,
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
