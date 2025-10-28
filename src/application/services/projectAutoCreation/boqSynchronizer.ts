/**
 * BOQ Synchronizer Module
 * Responsible for BOQ data copying and synchronization between tender and project
 */

import { getBOQRepository } from '@/application/services/serviceRegistry'
import { buildPricingMap } from '@/shared/utils/pricing/normalizePricing'
import type { NormalizedPricingItem } from '@/shared/utils/pricing/normalizePricing'
import type { BOQData } from '@/shared/types/boq'
import { ProjectBuilder } from './projectBuilder'

export class BOQSynchronizer {
  /**
   * Copy pricing data from tender to project
   * Creates project BOQ with estimated/actual structure from tender pricing
   */
  static async copyPricingData(tenderId: string, projectId: string): Promise<void> {
    try {
      console.log(`🔄 نسخ بيانات التسعير من المنافسة: ${tenderId}`)

      const boqRepository = getBOQRepository()

      // محاولة جلب BOQ المنافسة من المستودع
      let boqData = await boqRepository.getByTenderId(tenderId)
      console.log(`🔍 BOQ من المستودع المباشر: ${boqData ? 'موجود' : 'غير موجود'}`)

      if (!boqData) {
        console.log('⚠️ المحاولة الثانية من pricingService (مصدر قديم)...')
        const { pricingService } = await import('@/application/services/pricingService')
        const pricingData = await pricingService.loadTenderPricing(tenderId)
        const pricingArray = pricingData?.pricing
        if (pricingArray && pricingArray.length > 0) {
          const pricingMap = buildPricingMap(pricingArray)
          const boqItems: NormalizedPricingItem[] = []
          let totalValue = 0
          for (const [, normalized] of pricingMap.entries()) {
            boqItems.push(normalized)
            totalValue += normalized.totalPrice
          }
          if (boqItems.length > 0) {
            const existingTenderBOQ = await boqRepository.getByTenderId(tenderId)
            const newBoqData: BOQData = {
              id: existingTenderBOQ?.id ?? `boq_tender_${tenderId}`,
              tenderId,
              projectId: undefined,
              items: boqItems,
              totalValue,
              lastUpdated: new Date().toISOString(),
            }
            await boqRepository.createOrUpdate(newBoqData)
            boqData = newBoqData
            console.log('✅ تم إنشاء BOQ من بيانات التسعير (استخدام normalizePricing)')
          }
        }
      }

      if (boqData) {
        // Enhanced project BOQ creation with proper estimated/actual structure
        const existingProjectBOQ = await boqRepository.getByProjectId(projectId)
        const projectBOQ: BOQData = {
          ...boqData,
          id: existingProjectBOQ?.id ?? `boq_project_${projectId}`,
          projectId,
          tenderId: undefined,
          items: boqData.items.map((item) => {
            const rawItem = item as Record<string, unknown>
            const description = ProjectBuilder.coalesceFromCandidates(
              [
                rawItem.description,
                rawItem.itemName,
                rawItem.desc,
                rawItem.name,
                rawItem.title,
                rawItem.specifications,
                rawItem.details,
                rawItem.itemDesc,
                rawItem.itemDescription,
                rawItem.label,
                rawItem.text,
              ],
              `بند رقم ${item.id}`,
            )

            const materials = item.materials ?? []
            const labor = item.labor ?? []
            const equipment = item.equipment ?? []
            const subcontractors = item.subcontractors ?? []
            const additionalPercentages = item.additionalPercentages ?? {}

            // Create estimated values from tender data
            const estimated = {
              quantity: item.quantity ?? 0,
              unitPrice: item.unitPrice ?? 0,
              totalPrice: item.totalPrice ?? 0,
              materials,
              labor,
              equipment,
              subcontractors,
              additionalPercentages,
            }

            return {
              // Preserve original identification
              id: `proj_${item.id}`,
              originalId: item.id, // Keep reference to original tender item
              description,
              unit: this.coalesceString(item.unit, 'وحدة'),
              category: this.coalesceString(rawItem.category as string | undefined, 'BOQ'),

              // Store all tender data as estimated values
              estimated,

              // Initialize actual values to match estimated (user can modify these)
              actual: {
                quantity: estimated.quantity,
                unitPrice: estimated.unitPrice,
                totalPrice: estimated.totalPrice,
                materials: [...estimated.materials],
                labor: [...estimated.labor],
                equipment: [...estimated.equipment],
                subcontractors: [...estimated.subcontractors],
                additionalPercentages: { ...estimated.additionalPercentages },
              },

              // Keep backward compatibility fields
              quantity: estimated.quantity,
              unitPrice: estimated.unitPrice,
              totalPrice: estimated.totalPrice,
              actualQuantity: estimated.quantity,
              actualUnitPrice: estimated.unitPrice,
              materials: estimated.materials,
              labor: estimated.labor,
              equipment: estimated.equipment,
              subcontractors: estimated.subcontractors,

              // Preserve any additional metadata
              ...Object.fromEntries(
                Object.entries(item).filter(
                  ([key]) =>
                    ![
                      'id',
                      'quantity',
                      'unitPrice',
                      'totalPrice',
                      'materials',
                      'labor',
                      'equipment',
                      'subcontractors',
                    ].includes(key),
                ),
              ),
            }
          }),
        }
        await boqRepository.createOrUpdate(projectBOQ)
        console.log('✅ تم نسخ بيانات التسعير إلى المشروع مع هيكل estimated/actual')
      } else {
        console.warn('⚠️ لم يتوفر بيانات للنسخ')
      }
    } catch (error) {
      console.warn('Error copying pricing data:', error)
    }
  }

  /**
   * Copy BOQ data from tender to project
   * Creates project BOQ with estimated/actual structure
   */
  static async copyBOQData(tenderId: string, projectId: string): Promise<void> {
    try {
      console.log(`🔄 نسخ بيانات BOQ من المنافسة: ${tenderId}`)

      const boqRepository = getBOQRepository()

      // محاولة الحصول على BOQ المنافسة من المستودع
      let tenderBOQ = await boqRepository.getByTenderId(tenderId)

      // إذا لم يتم العثور عليه، حاول إنشاءه من بيانات التسعير
      if (!tenderBOQ) {
        console.log('⚠️ لم يتم العثور على BOQ للمنافسة، محاولة إنشائه من التسعير...')
        const { pricingService } = await import('@/application/services/pricingService')
        const pricingData = await pricingService.loadTenderPricing(tenderId)
        const pricingArray = pricingData?.pricing

        if (pricingArray && pricingArray.length > 0) {
          const pricingMap = buildPricingMap(pricingArray)
          const boqItems: NormalizedPricingItem[] = []
          let totalValue = 0

          for (const [, normalized] of pricingMap.entries()) {
            boqItems.push(normalized)
            totalValue += normalized.totalPrice
          }

          if (boqItems.length > 0) {
            const newBOQ: BOQData = {
              id: `boq_tender_${tenderId}`,
              tenderId,
              projectId: undefined,
              items: boqItems,
              totalValue,
              lastUpdated: new Date().toISOString(),
            }
            await boqRepository.createOrUpdate(newBOQ)
            tenderBOQ = newBOQ
            console.log('✅ تم إنشاء BOQ من بيانات التسعير')
          }
        }
      }

      if (!tenderBOQ || tenderBOQ.items.length === 0) {
        console.warn('⚠️ لا توجد بيانات BOQ للنسخ')
        return
      }

      // إنشاء BOQ للمشروع مع هيكل estimated/actual
      const projectBOQ: BOQData = {
        id: `boq_project_${projectId}`,
        projectId,
        tenderId: undefined,
        items: tenderBOQ.items.map((item) => {
          const rawItem = item as Record<string, unknown>

          // استخراج الوصف من عدة مصادر محتملة
          const description = ProjectBuilder.coalesceFromCandidates(
            [
              rawItem.description,
              rawItem.itemName,
              rawItem.desc,
              rawItem.name,
              rawItem.canonicalDescription,
              rawItem.specifications,
            ],
            `بند ${item.id}`,
          )

          // استخراج البيانات المالية
          const quantity = item.quantity ?? 0
          const unitPrice = item.unitPrice ?? 0
          const totalPrice = item.totalPrice ?? quantity * unitPrice

          // استخراج التفاصيل
          const materials = item.materials ?? []
          const labor = item.labor ?? []
          const equipment = item.equipment ?? []
          const subcontractors = item.subcontractors ?? []
          const additionalPercentages = item.additionalPercentages ?? {}

          // إنشاء القيم المقدرة (من المنافسة)
          const estimated = {
            quantity,
            unitPrice,
            totalPrice,
            materials,
            labor,
            equipment,
            subcontractors,
            additionalPercentages,
          }

          // إنشاء القيم الفعلية (نسخة قابلة للتعديل)
          const actual = {
            quantity: estimated.quantity,
            unitPrice: estimated.unitPrice,
            totalPrice: estimated.totalPrice,
            materials: [...estimated.materials],
            labor: [...estimated.labor],
            equipment: [...estimated.equipment],
            subcontractors: [...estimated.subcontractors],
            additionalPercentages: { ...estimated.additionalPercentages },
          }

          return {
            id: `proj_${item.id}`,
            originalId: item.id, // مرجع للبند الأصلي
            description,
            unit: this.coalesceString(item.unit, 'وحدة'),
            category: this.coalesceString(rawItem.category as string, 'BOQ'),
            estimated,
            actual,
            // حقول التوافق للخلف
            quantity: estimated.quantity,
            unitPrice: estimated.unitPrice,
            totalPrice: estimated.totalPrice,
            actualQuantity: estimated.quantity,
            actualUnitPrice: estimated.unitPrice,
            materials: estimated.materials,
            labor: estimated.labor,
            equipment: estimated.equipment,
            subcontractors: estimated.subcontractors,
          }
        }),
        totalValue: tenderBOQ.totalValue,
        totals: tenderBOQ.totals,
        lastUpdated: new Date().toISOString(),
      }

      await boqRepository.createOrUpdate(projectBOQ)
      console.log(`✅ تم نسخ ${projectBOQ.items.length} بند من BOQ المنافسة إلى المشروع`)
    } catch (error) {
      console.error('❌ خطأ في نسخ بيانات BOQ:', error)
      throw error
    }
  }

  /**
   * Helper: Coalesce string value
   */
  private static coalesceString(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }
}
