/**
 * Tender Status Repository
 *
 * @module infrastructure/repositories/pricing/TenderStatusRepository
 * @description Focused repository for updating tender status based on pricing completion
 *
 * Responsibilities:
 * - Calculate completion percentage
 * - Update tender status (under_action, ready_to_submit)
 * - Update tender pricing metadata (pricedItems, totalValue, etc.)
 * - Emit tender update events
 */

import { getTenderRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Options for status updates
 */
export interface StatusUpdateOptions {
  /** Allow refresh of tender list (from Save button) */
  allowRefresh?: boolean
}

/**
 * Tender Status Repository
 * Handles updating tender status based on pricing progress
 */
export class TenderStatusRepository {
  private static instance: TenderStatusRepository

  private constructor() {}

  public static getInstance(): TenderStatusRepository {
    if (!TenderStatusRepository.instance) {
      TenderStatusRepository.instance = new TenderStatusRepository()
    }
    return TenderStatusRepository.instance
  }

  // ===========================
  // 🔄 Status Update Operations
  // ===========================

  /**
   * Update tender status based on pricing completion
   */
  async updateTenderStatus(
    tenderId: string,
    completedCount: number,
    totalCount: number,
    totalValue: number,
    options?: StatusUpdateOptions,
  ): Promise<void> {
    try {
      const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
      const tenderRepo = getTenderRepository()

      console.log('[TenderStatusRepository] updateTenderStatus:', {
        tenderId,
        completedCount,
        totalCount,
        totalValue,
        completionPercentage,
        allowRefresh: options?.allowRefresh,
      })

      // Determine tender status
      const newTenderStatus = completionPercentage === 100 ? 'ready_to_submit' : 'under_action'

      await tenderRepo.update(
        tenderId,
        {
          status: newTenderStatus,
          pricedItems: completedCount,
          totalItems: totalCount,
          totalValue: totalValue,
          completionPercentage: completionPercentage,
        },
        { skipRefresh: true },
      )

      // Emit event - skipRefresh depends on whether this is from Save button or internal update
      // If allowRefresh=true (from Save button), allow tender list to refresh
      // Otherwise, use skipRefresh to prevent page reload during editing
      if (typeof window !== 'undefined') {
        const skipRefresh = !options?.allowRefresh
        console.log('[TenderStatusRepository] Dispatching TENDER_UPDATED event:', {
          tenderId,
          skipRefresh,
          allowRefresh: options?.allowRefresh,
        })

        window.dispatchEvent(
          new CustomEvent(APP_EVENTS.TENDER_UPDATED, {
            detail: {
              tenderId,
              skipRefresh,
            },
          }),
        )
      }

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'update-tender-status',
        key: tenderId,
        level: 'info',
        metadata: {
          status: newTenderStatus,
          completionPercentage,
          totalValue,
        },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'update-tender-status-failed',
        key: tenderId,
        level: 'error',
        status: 'error',
        metadata: {
          message: error instanceof Error ? error.message : 'unknown-error',
        },
      })
      throw error
    }
  }

  /**
   * Calculate total value from pricing data and quantity items
   * This is a helper used by the orchestrator
   */
  calculateTotalValue(
    pricingData: Map<string, any>,
    quantityItems: any[],
    defaultPercentages: any,
  ): number {
    const round2 = (value: number): number => Math.round(value * 100) / 100

    const totalValue = quantityItems.reduce((sum, item) => {
      const itemPricing = pricingData.get(item.id)
      if (!itemPricing || !itemPricing.completed) return sum

      // For direct pricing, use directUnitPrice
      if (itemPricing.pricingMethod === 'direct' && itemPricing.directUnitPrice) {
        return sum + itemPricing.directUnitPrice * item.quantity
      }

      // For detailed pricing, calculate from materials + labor + equipment + subcontractors
      const materialsCost =
        itemPricing.materials?.reduce((s: number, m: any) => s + (m.total || 0), 0) || 0
      const laborCost = itemPricing.labor?.reduce((s: number, l: any) => s + (l.total || 0), 0) || 0
      const equipmentCost =
        itemPricing.equipment?.reduce((s: number, e: any) => s + (e.total || 0), 0) || 0
      const subcontractorsCost =
        itemPricing.subcontractors?.reduce((s: number, sc: any) => s + (sc.total || 0), 0) || 0

      const baseCost = materialsCost + laborCost + equipmentCost + subcontractorsCost
      const percentages = itemPricing.additionalPercentages || defaultPercentages
      const administrative = baseCost * (percentages.administrative / 100)
      const operational = baseCost * (percentages.operational / 100)
      const profit = baseCost * (percentages.profit / 100)

      return sum + baseCost + administrative + operational + profit
    }, 0)

    // Calculate total with VAT (15%)
    const vatRate = 0.15
    const vatAmount = totalValue * vatRate
    const totalWithVat = round2(totalValue + vatAmount)

    return totalWithVat
  }
}

// Export singleton instance
export const tenderStatusRepository = TenderStatusRepository.getInstance()
