/**
 * Tender Status Repository
 *
 * @module infrastructure/repositories/pricing/TenderStatusRepository
 * @description Focused repository for updating tender status based on pricing completion
 *
 * Responsibilities:
 * - Calculate completion percentage from priced items
 * - Update tender status (under_action, ready_to_submit) based on completion
 * - Update tender pricing metadata (pricedItems, totalItems, totalValue, completionPercentage)
 * - Calculate total value from pricing data with VAT
 * - Emit tender update events with appropriate refresh control
 * - Audit logging for all status updates
 *
 * Architecture Pattern: Repository + Calculator
 * - Isolates tender status update logic
 * - Provides clean API for status management
 * - Handles event emission for UI updates
 *
 * @see {@link https://github.com/anmar534/Desktop-Management-System/docs/TENDER_SYSTEM_ARCHITECTURE.md}
 *
 * @example
 * ```typescript
 * import { tenderStatusRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Update tender status
 * await tenderStatusRepository.updateTenderStatus(
 *   'tender-123',
 *   15,  // 15 items completed
 *   20,  // out of 20 total
 *   1500000,  // total value
 *   { allowRefresh: true }
 * )
 * ```
 */

import { getTenderRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Options for status updates
 *
 * @interface StatusUpdateOptions
 * @property {boolean} [allowRefresh] - Allow refresh of tender list (from Save button)
 */
export interface StatusUpdateOptions {
  /** Allow refresh of tender list (from Save button) */
  allowRefresh?: boolean
}

/**
 * Tender Status Repository
 * Handles updating tender status based on pricing progress
 *
 * @class TenderStatusRepository
 * @description
 * Repository for managing tender status updates during pricing workflow.
 * Features:
 * - Automatic status determination (under_action vs ready_to_submit)
 * - Completion percentage calculation
 * - Total value calculation with VAT
 * - Event emission with refresh control
 * - Comprehensive audit logging
 *
 * Pattern: Singleton
 * - Use `TenderStatusRepository.getInstance()` to get the instance
 * - Or import the pre-created `tenderStatusRepository` instance
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const repository = TenderStatusRepository.getInstance()
 *
 * // Or use the exported instance
 * import { tenderStatusRepository } from './TenderStatusRepository'
 * ```
 */
export class TenderStatusRepository {
  private static instance: TenderStatusRepository

  private constructor() {}

  /**
   * Get the singleton instance of TenderStatusRepository
   *
   * @static
   * @returns {TenderStatusRepository} The singleton instance
   */
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
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {number} completedCount - Number of completed pricing items
   * @param {number} totalCount - Total number of pricing items
   * @param {number} totalValue - Total calculated value (including VAT)
   * @param {StatusUpdateOptions} [options] - Optional update settings
   * @returns {Promise<void>}
   *
   * @description
   * Updates tender status and metadata based on pricing progress.
   * Steps:
   * 1. Calculate completion percentage
   * 2. Determine tender status:
   *    - 100% complete → 'ready_to_submit'
   *    - < 100% complete → 'under_action'
   * 3. Update tender with new status and metadata
   * 4. Emit TENDER_UPDATED event for UI refresh
   * 5. Record audit event
   *
   * Refresh Control:
   * - If allowRefresh=true (Save button): UI refreshes tender list
   * - If allowRefresh=false (auto-save): UI stays on current page
   *
   * @throws {Error} If tender update fails
   *
   * @example
   * ```typescript
   * // From Save button - allow refresh
   * await tenderStatusRepository.updateTenderStatus(
   *   'tender-123',
   *   20,  // all items completed
   *   20,
   *   1500000,
   *   { allowRefresh: true }  // Will refresh tender list
   * )
   *
   * // From auto-save - prevent refresh
   * await tenderStatusRepository.updateTenderStatus(
   *   'tender-123',
   *   15,  // partial completion
   *   20,
   *   1200000,
   *   { allowRefresh: false }  // Stay on pricing page
   * )
   * ```
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
   *
   * @param {Map<string, PricingData>} pricingData - Map of item IDs to pricing data
   * @param {QuantityItem[]} quantityItems - Array of quantity items
   * @param {PricingPercentages} defaultPercentages - Default percentages
   * @returns {number} Total value including VAT
   *
   * @description
   * Calculates the total tender value from pricing data.
   * This is a helper method used by PricingOrchestrator.
   *
   * Calculation steps:
   * 1. For each completed item:
   *    - Direct pricing: use directUnitPrice × quantity
   *    - Detailed pricing: sum materials + labor + equipment + subcontractors
   * 2. Apply administrative, operational, and profit percentages
   * 3. Sum all item values
   * 4. Add VAT (15%)
   * 5. Round to 2 decimal places
   *
   * @example
   * ```typescript
   * const totalValue = tenderStatusRepository.calculateTotalValue(
   *   pricingDataMap,
   *   quantityItems,
   *   { administrative: 0.15, operational: 0.05, profit: 0.10 }
   * )
   * console.log('Total with VAT:', totalValue)
   * ```
   */
  calculateTotalValue(
    pricingData: Map<
      string,
      {
        pricingMethod?: string
        directUnitPrice?: number
        completed?: boolean
        materials?: { total: number }[]
        labor?: { total: number }[]
        equipment?: { total: number }[]
        subcontractors?: { total: number }[]
        additionalPercentages?: { administrative: number; operational: number; profit: number }
      }
    >,
    quantityItems: { id: string; quantity: number }[],
    defaultPercentages: { administrative: number; operational: number; profit: number },
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
        itemPricing.materials?.reduce((s: number, m: { total: number }) => s + (m.total || 0), 0) ||
        0
      const laborCost =
        itemPricing.labor?.reduce((s: number, l: { total: number }) => s + (l.total || 0), 0) || 0
      const equipmentCost =
        itemPricing.equipment?.reduce((s: number, e: { total: number }) => s + (e.total || 0), 0) ||
        0
      const subcontractorsCost =
        itemPricing.subcontractors?.reduce(
          (s: number, sc: { total: number }) => s + (sc.total || 0),
          0,
        ) || 0

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

/**
 * Singleton instance of TenderStatusRepository
 *
 * @type {TenderStatusRepository}
 * @description Pre-instantiated repository instance ready for use
 *
 * @example
 * ```typescript
 * import { tenderStatusRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Update tender status
 * await tenderStatusRepository.updateTenderStatus(
 *   'tender-123',
 *   15,
 *   20,
 *   1500000,
 *   { allowRefresh: true }
 * )
 *
 * // Calculate total value
 * const total = tenderStatusRepository.calculateTotalValue(
 *   pricingDataMap,
 *   quantityItems,
 *   defaultPercentages
 * )
 * ```
 */
export const tenderStatusRepository = TenderStatusRepository.getInstance()
