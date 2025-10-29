/**
 * Estimated Pricing Extractor Module
 * Extracts estimated pricing data from tender pricing service
 */

import type { PricingItemInput } from '@/shared/utils/pricing/pricingHelpers'
import { pricingService } from '@/application/services/pricingService'
import type { EstimatedPricingData } from './types'
import { ResourceCalculator } from './resourceCalculator'

export class EstimatedPricingExtractor {
  /**
   * Extract estimated pricing data from tender
   */
  static async extractEstimatedPricing(
    tenderId: string,
  ): Promise<Map<string, EstimatedPricingData>> {
    try {
      console.log('📋 [EstimatedPricingExtractor] Loading pricing for tender:', tenderId)
      const pricingData = await pricingService.loadTenderPricing(tenderId)

      console.log('📋 [EstimatedPricingExtractor] Pricing data loaded:', {
        hasPricingData: !!pricingData,
        hasPricing: !!pricingData?.pricing,
        pricingLength: pricingData?.pricing?.length ?? 0,
        isArray: Array.isArray(pricingData?.pricing),
      })

      const result = new Map<string, EstimatedPricingData>()

      if (pricingData?.pricing && Array.isArray(pricingData.pricing)) {
        const pricingEntries = pricingData.pricing as [string, PricingItemInput][]

        console.log('📋 [EstimatedPricingExtractor] Processing entries:', pricingEntries.length)

        for (const [itemId, itemPricing] of pricingEntries) {
          if (itemPricing) {
            // حساب الإجماليات
            const materialsTotal = ResourceCalculator.sumResourceTotals(
              ResourceCalculator.toResourceArray(itemPricing.materials),
            )
            const laborTotal = ResourceCalculator.sumResourceTotals(
              ResourceCalculator.toResourceArray(itemPricing.labor),
            )
            const equipmentTotal = ResourceCalculator.sumResourceTotals(
              ResourceCalculator.toResourceArray(itemPricing.equipment),
            )
            const subcontractorsTotal = ResourceCalculator.sumResourceTotals(
              ResourceCalculator.toResourceArray(itemPricing.subcontractors),
            )

            const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

            // حساب النسب الإضافية
            const adminPercentage = itemPricing.additionalPercentages?.administrative ?? 0
            const operationalPercentage = itemPricing.additionalPercentages?.operational ?? 0
            const profitPercentage = itemPricing.additionalPercentages?.profit ?? 0

            const administrative = (subtotal * adminPercentage) / 100
            const operational = (subtotal * operationalPercentage) / 100
            const profit = (subtotal * profitPercentage) / 100

            const finalPrice =
              typeof itemPricing.finalPrice === 'number'
                ? itemPricing.finalPrice
                : subtotal + administrative + operational + profit

            result.set(itemId, {
              materials: ResourceCalculator.toResourceArray(
                itemPricing.materials,
              ) as EstimatedPricingData['materials'],
              labor: ResourceCalculator.toResourceArray(
                itemPricing.labor,
              ) as EstimatedPricingData['labor'],
              equipment: ResourceCalculator.toResourceArray(
                itemPricing.equipment,
              ) as EstimatedPricingData['equipment'],
              subcontractors: ResourceCalculator.toResourceArray(
                itemPricing.subcontractors,
              ) as EstimatedPricingData['subcontractors'],
              additionalPercentages: {
                administrative: adminPercentage,
                operational: operationalPercentage,
                profit: profitPercentage,
              },
              finalPrice,
              estimatedTotal: finalPrice,
            })
          }
        }
      } else {
        console.warn('⚠️ [EstimatedPricingExtractor] No pricing data found for tender:', tenderId)
        console.info('ℹ️ This tender was likely created before the pricing system was implemented.')
      }

      console.log(
        '✅ [EstimatedPricingExtractor] Extraction complete. Items extracted:',
        result.size,
      )
      return result
    } catch (error) {
      console.error(
        '❌ [EstimatedPricingExtractor] خطأ في استخراج بيانات التسعير التقديرية:',
        error,
      )
      return new Map()
    }
  }
}
