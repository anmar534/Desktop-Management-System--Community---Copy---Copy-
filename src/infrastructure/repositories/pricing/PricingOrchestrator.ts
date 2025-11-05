/**
 * Pricing Orchestrator
 *
 * @module infrastructure/repositories/pricing/PricingOrchestrator
 * @description Orchestrator (Facade) for coordinating pricing operations
 *
 * Responsibilities:
 * - Coordinate between specialized repositories
 * - Provide high-level operations (persistPricingAndBOQ)
 * - Transaction-like coordination of multi-step operations
 * - Maintain backward compatibility with TenderPricingRepository API
 *
 * Architecture Pattern: Facade/Orchestrator
 * - Delegates persistence to PricingDataRepository
 * - Delegates BOQ sync to BOQSyncRepository
 * - Delegates status updates to TenderStatusRepository
 *
 * @see {@link https://github.com/anmar534/Desktop-Management-System/docs/TENDER_SYSTEM_ARCHITECTURE.md}
 *
 * @example
 * ```typescript
 * import { pricingOrchestrator } from '@/infrastructure/repositories/pricing'
 *
 * // Persist pricing and BOQ in one transaction
 * await pricingOrchestrator.persistPricingAndBOQ(
 *   tenderId,
 *   pricingDataMap,
 *   quantityItems,
 *   defaultPercentages
 * )
 * ```
 */

import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

import {
  loadPricingData,
  savePricingData,
  loadDefaultPercentages as fetchDefaultPercentages,
  updateDefaultPercentages as persistDefaultPercentages,
} from './PricingDataRepository'
import { syncPricingToBOQ } from './BOQSyncRepository'
import {
  updateTenderStatus as persistTenderStatus,
  calculateTotalValue,
} from './TenderStatusRepository'

/**
 * Save options for pricing operations
 *
 * @interface SavePricingOptions
 * @property {boolean} [skipEvent] - Skip emitting update event to prevent loops
 */
export interface SavePricingOptions {
  /** Skip emitting update event (prevent loops) */
  skipEvent?: boolean
}

/**
 * Pricing Orchestrator
 * Coordinates multi-step pricing operations across specialized repositories
 *
 * @class PricingOrchestrator
 * @description
 * This class implements the Facade/Orchestrator pattern to coordinate
 * complex pricing operations that span multiple repositories.
 *
 * Pattern: Singleton
 * - Use `PricingOrchestrator.getInstance()` to get the instance
 * - Or import the pre-created `pricingOrchestrator` instance
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const orchestrator = PricingOrchestrator.getInstance()
 *
 * // Or use the exported instance
 * import { pricingOrchestrator } from './PricingOrchestrator'
 * ```
 */
export class PricingOrchestrator {
  private static instance: PricingOrchestrator

  private constructor() {}

  /**
   * Get the singleton instance of PricingOrchestrator
   *
   * @static
   * @returns {PricingOrchestrator} The singleton instance
   */
  public static getInstance(): PricingOrchestrator {
    if (!PricingOrchestrator.instance) {
      PricingOrchestrator.instance = new PricingOrchestrator()
    }
    return PricingOrchestrator.instance
  }

  // ===========================
  // 📊 Load Operations (Delegate)
  // ===========================

  /**
   * Load pricing data for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @returns {Promise<Map<string, PricingData>>} Map of item IDs to pricing data
   * @description Delegates to PricingDataRepository
   *
   * @example
   * ```typescript
   * const pricingData = await pricingOrchestrator.loadPricing('tender-123')
   * console.log('Loaded pricing for', pricingData.size, 'items')
   * ```
   */
  async loadPricing(tenderId: string): Promise<Map<string, PricingData>> {
    return loadPricingData(tenderId)
  }

  // ===========================
  // 💾 Save Operations (Delegate)
  // ===========================

  /**
   * Save pricing data for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {Map<string, PricingData>} pricingData - Map of item IDs to pricing data
   * @param {PricingPercentages} defaultPercentages - Default percentages for calculations
   * @returns {Promise<void>}
   * @description Delegates to PricingDataRepository
   *
   * @example
   * ```typescript
   * await pricingOrchestrator.savePricing(
   *   'tender-123',
   *   pricingDataMap,
   *   defaultPercentages
   * )
   * ```
   */
  async savePricing(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    return savePricingData(tenderId, pricingData, defaultPercentages)
  }

  // ===========================
  // 🔄 Orchestrated Operations
  // ===========================

  /**
   * Persist pricing data and sync with BOQ repository
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {Map<string, PricingData>} pricingData - Map of item IDs to pricing data
   * @param {QuantityItem[]} quantityItems - Array of quantity items (BOQ)
   * @param {PricingPercentages} defaultPercentages - Default percentages for calculations
   * @param {SavePricingOptions} [options] - Optional save options
   * @param {boolean} [options.skipEvent] - If true, BOQSyncRepository skips emitting 'boqUpdated' event
   * @returns {Promise<void>}
   *
   * @description
   * This is the core "persistence" operation that performs the following steps:
   * 1. Saves pricing data to storage (via PricingDataRepository)
   * 2. Updates BOQ repository with calculated totals (via BOQSyncRepository)
   *    - BOQSyncRepository emits 'boqUpdated' event during this step (unless skipEvent is true)
   * 3. Updates tender status and progress (via TenderStatusRepository)
   * 4. Records audit events for success/failure
   *
   * This method orchestrates multiple repositories in a transaction-like manner.
   * If any step fails, an error is thrown and audit event is recorded.
   *
   * @throws {Error} If any persistence operation fails
   *
   * @example
   * ```typescript
   * try {
   *   await pricingOrchestrator.persistPricingAndBOQ(
   *     'tender-123',
   *     pricingDataMap,
   *     quantityItems,
   *     { overhead: 0.15, profit: 0.10 },
   *     { skipEvent: false }
   *   )
   *   console.log('Pricing saved and BOQ synced successfully')
   * } catch (error) {
   *   console.error('Failed to persist pricing:', error)
   * }
   * ```
   *
   * @see {@link PricingDataRepository}
   * @see {@link BOQSyncRepository}
   * @see {@link TenderStatusRepository}
   */
  async persistPricingAndBOQ(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    quantityItems: QuantityItem[],
    defaultPercentages: PricingPercentages,
    options?: SavePricingOptions,
  ): Promise<void> {
    try {
      console.log('[PricingOrchestrator] persistPricingAndBOQ called:', {
        tenderId,
        pricingDataSize: pricingData.size,
        quantityItemsCount: quantityItems.length,
        pricingDataPreview: Array.from(pricingData.entries())
          .slice(0, 2)
          .map(([id, p]) => ({
            id,
            pricingMethod: p.pricingMethod,
            directUnitPrice: p.directUnitPrice,
            completed: p.completed,
            materials: p.materials?.length || 0,
            labor: p.labor?.length || 0,
          })),
      })

      // ⚠️ REMOVED: Save pricing data with percentages
      // النسب تُحفظ في saveDefaultPercentages فقط
      // هنا نحفظ التسعير بدون لمس النسب الافتراضية

      // Step 1: Save pricing data ONLY (without touching percentages)
      // نحتاج pricingDataRepository جديد يحفظ التسعير فقط بدون النسب
      await this.savePricingDataOnly(tenderId, pricingData, defaultPercentages)

      // Step 2: Update BOQ repository
      await syncPricingToBOQ(tenderId, pricingData, quantityItems, defaultPercentages, options)

      // Step 3: Update tender status and metadata
      // ✅ تحديث البيانات مع منع إعادة تحميل الصفحة (allowRefresh: false)
      // هذا يضمن تحديث: totalValue, pricedItems, totalItems, completionPercentage
      // بدون إعادة تحميل صفحة التسعير أو قائمة المناقصات

      const completedCount = Array.from(pricingData.values()).filter(
        (p) => p?.completed === true,
      ).length

      const totalValue = calculateTotalValue(pricingData, quantityItems, defaultPercentages)

      await persistTenderStatus(
        tenderId,
        completedCount,
        quantityItems.length,
        totalValue,
        { allowRefresh: false }, // ✅ Don't reload page during pricing - just update data
      )

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'persist-pricing-and-boq',
        key: tenderId,
        level: 'info',
        metadata: { itemsCount: quantityItems.length },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'persist-pricing-and-boq-failed',
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
   * Save pricing data ONLY without touching default percentages
   *
   * @private
   * @async
   * @description
   * This method saves pricing data without modifying default percentages.
   * Default percentages are managed separately by saveDefaultPercentages.
   * This prevents race conditions and ensures percentages are not overwritten.
   */
  private async savePricingDataOnly(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    // ⚠️ CRITICAL: Load EXISTING percentages from storage, NOT the ones passed in
    // The passed percentages might be stale from closure
    const existingPercentages = await fetchDefaultPercentages(tenderId)

    console.log('[PricingOrchestrator.savePricingDataOnly] Using percentages:', {
      tenderId,
      existingPercentages,
      passedPercentages: defaultPercentages,
      willUse: existingPercentages || defaultPercentages,
    })

    // Save pricing with EXISTING percentages (don't overwrite)
    await savePricingData(
      tenderId,
      pricingData,
      existingPercentages || defaultPercentages, // Fallback to passed if none exist
    )
  }

  // ===========================
  // 🔧 Status Operations (Delegate)
  // ===========================

  /**
   * Update tender status based on pricing completion
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {number} completedCount - Number of completed pricing items
   * @param {number} totalCount - Total number of pricing items
   * @param {number} totalValue - Total calculated value of the tender
   * @param {Object} [options] - Optional settings
   * @param {boolean} [options.allowRefresh] - Allow refreshing tender data
   * @returns {Promise<void>}
   * @description Delegates to TenderStatusRepository to update tender status and progress
   *
   * @example
   * ```typescript
   * await pricingOrchestrator.updateTenderStatus(
   *   'tender-123',
   *   15,  // 15 items completed
   *   20,  // out of 20 total
   *   1500000,  // total value
   *   { allowRefresh: true }
   * )
   * ```
   */
  async updateTenderStatus(
    tenderId: string,
    completedCount: number,
    totalCount: number,
    totalValue: number,
    options?: { allowRefresh?: boolean },
  ): Promise<void> {
    return persistTenderStatus(tenderId, completedCount, totalCount, totalValue, options)
  }

  // ===========================
  // 📈 Percentages Operations (Delegate)
  // ===========================

  /**
   * Get default percentages for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @returns {Promise<PricingPercentages | null>} Default percentages or null if not found
   * @description Delegates to PricingDataRepository
   *
   * @example
   * ```typescript
   * const percentages = await pricingOrchestrator.getDefaultPercentages('tender-123')
   * if (percentages) {
   *   console.log('Overhead:', percentages.overhead)
   *   console.log('Profit:', percentages.profit)
   * }
   * ```
   */
  async getDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
    return fetchDefaultPercentages(tenderId)
  }

  /**
   * Update default percentages for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {PricingPercentages} percentages - New default percentages
   * @returns {Promise<void>}
   * @description Delegates to PricingDataRepository
   *
   * @example
   * ```typescript
   * await pricingOrchestrator.updateDefaultPercentages('tender-123', {
   *   overhead: 0.15,
   *   profit: 0.10,
   *   insurance: 0.02
   * })
   * ```
   */
  async updateDefaultPercentages(tenderId: string, percentages: PricingPercentages): Promise<void> {
    return persistDefaultPercentages(tenderId, percentages)
  }
}

/**
 * Singleton instance of PricingOrchestrator
 *
 * @type {PricingOrchestrator}
 * @description Pre-instantiated orchestrator instance ready for use
 *
 * @example
 * ```typescript
 * import { pricingOrchestrator } from '@/infrastructure/repositories/pricing'
 *
 * // Persist pricing and BOQ
 * await pricingOrchestrator.persistPricingAndBOQ(
 *   tenderId,
 *   pricingDataMap,
 *   quantityItems,
 *   defaultPercentages
 * )
 *
 * // Load pricing
 * const pricing = await pricingOrchestrator.loadPricing(tenderId)
 *
 * // Update status
 * await pricingOrchestrator.updateTenderStatus(
 *   tenderId,
 *   15,
 *   20,
 *   1500000,
 *   { allowRefresh: true }
 * )
 * ```
 */
export const pricingOrchestrator = PricingOrchestrator.getInstance()
