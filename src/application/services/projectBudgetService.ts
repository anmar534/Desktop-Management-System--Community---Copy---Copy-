/**
 * 🔗 خدمة ربط بيانات التسعير بين المنافسات والمشاريع
 * 
 * الهدف: ربط جداول المواد والعمالة والمعدات ومقاولي الباطن من صفحة التسعير
 * مع صفحة المشاريع لعرض الأسعار التقديرية ومقارنتها بالفعلية
 */

import type { Tender } from '@/data/centralData'
import type { BOQData } from '@/types/boq'
import type { PricingResource, PricingItemInput } from '@/shared/utils/pricing/pricingHelpers'
import { getBOQRepository, getRelationRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import { pricingService } from './pricingService'

export interface EstimatedPricingData {
  materials: {
    id: string
    name: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
    wastePercentage?: number
  }[]
  labor: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  equipment: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subcontractors: {
    id: string
    description: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  additionalPercentages: {
    administrative: number
    operational: number
    profit: number
  }
  finalPrice: number
  estimatedTotal: number
}

export interface ProjectBudgetComparison {
  itemId: string
  description: string
  unit: string
  quantity: number
  
  // البيانات التقديرية من المنافسة
  estimated: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    administrative: number
    operational: number
    profit: number
    total: number
    unitPrice: number
  }
  
  // البيانات الفعلية من المشروع
  actual: {
    materials: number
    labor: number
    equipment: number
    subcontractors: number
    total: number
    unitPrice: number
  }
  
  // الفرق والتحليل
  variance: {
    amount: number
    percentage: number
    status: 'over-budget' | 'under-budget' | 'on-budget'
    alerts: string[]
  }
}

export class ProjectBudgetService {
  private readonly toResourceArray = (value: unknown): PricingResource[] => {
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is PricingResource => entry !== null && typeof entry === 'object')
  }

  private readonly sumResourceTotals = (resources: PricingResource[]): number => {
    return resources.reduce((accumulator, resource) => {
      const total = typeof resource.total === 'number' ? resource.total : undefined
      if (total !== undefined) return accumulator + total
      const price = typeof resource.price === 'number' ? resource.price : typeof resource.unitPrice === 'number' ? resource.unitPrice : undefined
      const quantity = typeof resource.quantity === 'number' ? resource.quantity : undefined
      if (price !== undefined && quantity !== undefined) return accumulator + price * quantity
      return accumulator
    }, 0)
  }

  private readonly sumLegacyResourceTotals = (value: unknown): number => {
    const array = this.toResourceArray(value)
    return this.sumResourceTotals(array)
  }

  private async resolveTenderForProject(projectId: string): Promise<Tender | null> {
    try {
      const tenderRepository = getTenderRepository()
      const relationRepository = getRelationRepository()
      const tenderIdFromRelations = relationRepository.getTenderIdByProjectId(projectId)

      if (tenderIdFromRelations) {
        const related = await tenderRepository.getById(tenderIdFromRelations)
        if (related) return related
      }

      if (typeof tenderRepository.getByProjectId === 'function') {
        return await tenderRepository.getByProjectId(projectId)
      }

      return null
    } catch (error) {
      console.error('تعذر تحديد المنافسة المرتبطة بالمشروع عبر المستودع', error)
      return null
    }
  }

  private async loadProjectBOQ(projectId: string): Promise<BOQData | null> {
    try {
      const boqRepository = getBOQRepository()
      return await boqRepository.getByProjectId(projectId)
    } catch (error) {
      console.error('تعذر تحميل بيانات BOQ للمشروع من المستودع', error)
      return null
    }
  }

  
  /**
   * استخراج بيانات التسعير التقديرية من المنافسة
   */
  async getEstimatedPricingData(tenderId: string): Promise<Map<string, EstimatedPricingData>> {
    try {
      const pricingData = await pricingService.loadTenderPricing(tenderId)
      const result = new Map<string, EstimatedPricingData>()
      
      if (pricingData?.pricing) {
  const pricingEntries = pricingData.pricing as [string, PricingItemInput][]
        for (const [itemId, itemPricing] of pricingEntries) {
          if (itemPricing) {
            // حساب الإجماليات
            const materialsTotal = this.sumResourceTotals(this.toResourceArray(itemPricing.materials))
            const laborTotal = this.sumResourceTotals(this.toResourceArray(itemPricing.labor))
            const equipmentTotal = this.sumResourceTotals(this.toResourceArray(itemPricing.equipment))
            const subcontractorsTotal = this.sumResourceTotals(this.toResourceArray(itemPricing.subcontractors))
            
            const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal
            
            // حساب النسب الإضافية
            const adminPercentage = itemPricing.additionalPercentages?.administrative ?? 0
            const operationalPercentage = itemPricing.additionalPercentages?.operational ?? 0
            const profitPercentage = itemPricing.additionalPercentages?.profit ?? 0
            
            const administrative = subtotal * adminPercentage / 100
            const operational = subtotal * operationalPercentage / 100
            const profit = subtotal * profitPercentage / 100
            
            const finalPrice = typeof itemPricing.finalPrice === 'number'
              ? itemPricing.finalPrice
              : subtotal + administrative + operational + profit
            
            result.set(itemId, {
              materials: this.toResourceArray(itemPricing.materials) as EstimatedPricingData['materials'],
              labor: this.toResourceArray(itemPricing.labor) as EstimatedPricingData['labor'],
              equipment: this.toResourceArray(itemPricing.equipment) as EstimatedPricingData['equipment'],
              subcontractors: this.toResourceArray(itemPricing.subcontractors) as EstimatedPricingData['subcontractors'],
              additionalPercentages: {
                administrative: adminPercentage,
                operational: operationalPercentage,
                profit: profitPercentage
              },
              finalPrice,
              estimatedTotal: finalPrice
            })
          }
        }
      }
      
      return result
    } catch (error) {
      console.error('خطأ في استخراج بيانات التسعير التقديرية:', error)
      return new Map()
    }
  }
  
  /**
   * مقارنة البيانات التقديرية مع الفعلية
   */
  async compareProjectBudget(projectId: string): Promise<ProjectBudgetComparison[]> {
    try {
      // البحث عن المنافسة المرتبطة بالمشروع
      const relatedTender = await this.resolveTenderForProject(projectId)
      if (!relatedTender) {
        console.warn('لم يتم العثور على منافسة مرتبطة بالمشروع')
        return []
      }
      
      // استخراج البيانات التقديرية من المنافسة
      const estimatedData = await this.getEstimatedPricingData(relatedTender.id)
      
      // استخراج البيانات الفعلية من المشروع
      const projectBOQ = await this.loadProjectBOQ(projectId)
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
          const estimatedSubcontractors = estimatedItem.subcontractors.reduce((sum, s) => sum + s.total, 0)
          const estimatedSubtotal = estimatedMaterials + estimatedLabor + estimatedEquipment + estimatedSubcontractors
          
          const estimatedAdmin = estimatedSubtotal * estimatedItem.additionalPercentages.administrative / 100
          const estimatedOperational = estimatedSubtotal * estimatedItem.additionalPercentages.operational / 100
          const estimatedProfit = estimatedSubtotal * estimatedItem.additionalPercentages.profit / 100
          const estimatedTotal = estimatedSubtotal + estimatedAdmin + estimatedOperational + estimatedProfit
          
          // حساب البيانات الفعلية
          const actualMaterials = this.sumLegacyResourceTotals(boqItem.materials)
          const actualLabor = this.sumLegacyResourceTotals(boqItem.labor)
          const actualEquipment = this.sumLegacyResourceTotals(boqItem.equipment)
          const actualSubcontractors = this.sumLegacyResourceTotals(boqItem.subcontractors)
          const actualTotal = boqItem.actualQuantity && boqItem.actualUnitPrice 
            ? boqItem.actualQuantity * boqItem.actualUnitPrice 
            : (actualMaterials + actualLabor + actualEquipment + actualSubcontractors)
          
          // حساب الفرق
          const varianceAmount = actualTotal - estimatedTotal
          const variancePercentage = estimatedTotal > 0 ? (varianceAmount / estimatedTotal) * 100 : 0
          
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
              unitPrice: (boqItem.quantity ?? 0) > 0 ? estimatedTotal / (boqItem.quantity ?? 0) : 0
            },
            actual: {
              materials: actualMaterials,
              labor: actualLabor,
              equipment: actualEquipment,
              subcontractors: actualSubcontractors,
              total: actualTotal,
              unitPrice: (boqItem.quantity ?? 0) > 0 ? actualTotal / (boqItem.quantity ?? 0) : 0
            },
            variance: {
              amount: varianceAmount,
              percentage: variancePercentage,
              status,
              alerts
            }
          })
        }
      }
      
      return comparisons
    } catch (error) {
      console.error('خطأ في مقارنة ميزانية المشروع:', error)
      return []
    }
  }
  
  /**
   * الحصول على تلخيص إجمالي لميزانية المشروع
   */
  async getProjectBudgetSummary(projectId: string) {
    const comparisons = await this.compareProjectBudget(projectId)
    
    const summary = {
      totalItems: comparisons.length,
      estimatedTotal: comparisons.reduce((sum, c) => sum + c.estimated.total, 0),
      actualTotal: comparisons.reduce((sum, c) => sum + c.actual.total, 0),
      totalVariance: 0,
      totalVariancePercentage: 0,
      overBudgetItems: comparisons.filter(c => c.variance.status === 'over-budget').length,
      underBudgetItems: comparisons.filter(c => c.variance.status === 'under-budget').length,
      onBudgetItems: comparisons.filter(c => c.variance.status === 'on-budget').length,
      criticalAlerts: comparisons.filter(c => c.variance.alerts.some(a => a.includes('خطير'))).length
    }
    
    summary.totalVariance = summary.actualTotal - summary.estimatedTotal
    summary.totalVariancePercentage = summary.estimatedTotal > 0 
      ? (summary.totalVariance / summary.estimatedTotal) * 100 
      : 0
    
    return summary
  }
}

// إنشاء instance مشترك
export const projectBudgetService = new ProjectBudgetService()