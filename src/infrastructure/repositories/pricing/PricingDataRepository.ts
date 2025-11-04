/**
 * Pricing Data Repository
 *
 * @module infrastructure/repositories/pricing/PricingDataRepository
 * @description Focused repository for pricing data persistence
 *
 * Responsibilities:
 * - Load pricing data from storage
 * - Save pricing data to storage
 * - Handle serialization/deserialization of Map to Array
 * - Manage default percentages (administrative, operational, profit)
 * - Audit logging for all pricing operations
 *
 * Architecture Pattern: Repository
 * - Isolates storage logic from business logic
 * - Provides clean API for pricing data access
 * - Handles data transformation (Map ↔ Array)
 *
 * @see {@link https://github.com/anmar534/Desktop-Management-System/docs/TENDER_SYSTEM_ARCHITECTURE.md}
 *
 * @example
 * ```typescript
 * import { pricingDataRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Load pricing data
 * const pricingMap = await pricingDataRepository.loadPricing('tender-123')
 *
 * // Save pricing data
 * await pricingDataRepository.savePricing(
 *   'tender-123',
 *   pricingMap,
 *   { administrative: 0.15, operational: 0.05, profit: 0.10 }
 * )
 * ```
 */

import {
  pricingStorage,
  type TenderPricingPayload,
} from '@/infrastructure/storage/modules/PricingStorage'
import type { PricingData } from '@/shared/types/pricing'
import type { PricingPercentages } from '@/shared/types/pricing'
import { isPricingEntry } from '@/shared/utils/pricing/pricingHelpers'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Pricing Data Repository
 * Handles loading and saving pricing data for tenders
 *
 * @class PricingDataRepository
 * @description
 * Repository for pricing data persistence with the following features:
 * - Type-safe data loading and saving
 * - Map to Array serialization for storage
 * - Default percentages management
 * - Comprehensive audit logging
 * - Error handling with recovery
 *
 * Pattern: Singleton
 * - Use `PricingDataRepository.getInstance()` to get the instance
 * - Or import the pre-created `pricingDataRepository` instance
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const repository = PricingDataRepository.getInstance()
 *
 * // Or use the exported instance
 * import { pricingDataRepository } from './PricingDataRepository'
 * ```
 */
export class PricingDataRepository {
  private static instance: PricingDataRepository

  private constructor() {}

  /**
   * Get the singleton instance of PricingDataRepository
   *
   * @static
   * @returns {PricingDataRepository} The singleton instance
   */
  public static getInstance(): PricingDataRepository {
    if (!PricingDataRepository.instance) {
      PricingDataRepository.instance = new PricingDataRepository()
    }
    return PricingDataRepository.instance
  }

  // ===========================
  // 📊 Load Operations
  // ===========================

  /**
   * Load pricing data for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @returns {Promise<Map<string, PricingData>>} Map of item IDs to pricing data
   *
   * @description
   * Loads pricing data from storage and transforms it from array format to Map.
   * Steps:
   * 1. Load raw payload from storage
   * 2. Validate and filter valid pricing entries
   * 3. Convert array to Map for efficient access
   * 4. Record audit event
   * 5. Return Map or empty Map if no data exists
   *
   * @throws {Error} If storage operation fails
   *
   * @example
   * ```typescript
   * const pricingData = await pricingDataRepository.loadPricing('tender-123')
   * console.log('Loaded pricing for', pricingData.size, 'items')
   *
   * // Access specific item
   * const itemPricing = pricingData.get('item-456')
   * if (itemPricing) {
   *   console.log('Unit price:', itemPricing.directUnitPrice)
   * }
   * ```
   */
  async loadPricing(tenderId: string): Promise<Map<string, PricingData>> {
    try {
      const payload = await pricingStorage.loadTenderPricing(tenderId)

      if (!payload || !payload.pricing) {
        return new Map()
      }

      // Convert array of entries to Map
      const pricingMap = new Map<string, PricingData>(
        payload.pricing.filter(isPricingEntry).map(([id, data]) => [id, data as PricingData]),
      )

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'load-pricing',
        key: tenderId,
        level: 'info',
        metadata: { itemsCount: pricingMap.size },
      })

      return pricingMap
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'load-pricing-failed',
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

  // ===========================
  // 💾 Save Operations
  // ===========================

  /**
   * Save pricing data for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {Map<string, PricingData>} pricingData - Map of item IDs to pricing data
   * @param {PricingPercentages} defaultPercentages - Default percentages for calculations
   * @returns {Promise<void>}
   *
   * @description
   * Saves pricing data to storage with the following steps:
   * 1. Serialize Map to array of entries
   * 2. Filter valid pricing entries
   * 3. Create payload with pricing data and percentages
   * 4. Save to storage via pricingStorage
   * 5. Record audit event with timestamp
   *
   * @throws {Error} If storage operation fails
   *
   * @example
   * ```typescript
   * const pricingMap = new Map([
   *   ['item-1', { directUnitPrice: 100, completed: true, ... }],
   *   ['item-2', { directUnitPrice: 200, completed: false, ... }]
   * ])
   *
   * await pricingDataRepository.savePricing(
   *   'tender-123',
   *   pricingMap,
   *   { administrative: 0.15, operational: 0.05, profit: 0.10 }
   * )
   * ```
   */
  async savePricing(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    try {
      console.log('[PricingDataRepository.savePricing] Saving with percentages:', {
        tenderId,
        defaultPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
        pricingDataSize: pricingData.size,
      })

      const serializedPricing = Array.from(pricingData.entries()).filter(isPricingEntry)

      const payload: TenderPricingPayload = {
        pricing: serializedPricing,
        defaultPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
        lastSavedAt: new Date().toISOString(),
      }

      await pricingStorage.saveTenderPricing(tenderId, payload)

      console.log('[PricingDataRepository.savePricing] Saved successfully:', {
        tenderId,
        savedPercentages: payload.defaultPercentages || 'undefined',
      })

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'save-pricing',
        key: tenderId,
        level: 'info',
        metadata: {
          itemsCount: serializedPricing.length,
          timestamp: payload.lastSavedAt,
        },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'save-pricing-failed',
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

  // ===========================
  // 🔄 Percentages Operations
  // ===========================

  /**
   * Get default percentages for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @returns {Promise<PricingPercentages | null>} Default percentages or null if not found
   *
   * @description
   * Retrieves the default percentages stored for a tender.
   * Returns null if tender has no saved pricing data or percentages.
   *
   * @example
   * ```typescript
   * const percentages = await pricingDataRepository.getDefaultPercentages('tender-123')
   * if (percentages) {
   *   console.log('Administrative:', percentages.administrative)
   *   console.log('Operational:', percentages.operational)
   *   console.log('Profit:', percentages.profit)
   * }
   * ```
   */
  async getDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
    try {
      const payload = await pricingStorage.loadTenderPricing(tenderId)
      return payload?.defaultPercentages || null
    } catch (error) {
      console.error('[PricingDataRepository] Failed to get default percentages:', error)
      return null
    }
  }

  /**
   * Update default percentages for a tender
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {PricingPercentages} percentages - New default percentages
   * @returns {Promise<void>}
   *
   * @description
   * Updates only the default percentages without modifying pricing data.
   * Steps:
   * 1. Load existing payload
   * 2. Merge with new percentages
   * 3. Save updated payload
   * 4. Record audit event
   *
   * @throws {Error} If storage operation fails
   *
   * @example
   * ```typescript
   * await pricingDataRepository.updateDefaultPercentages('tender-123', {
   *   administrative: 0.18,  // Updated from 0.15
   *   operational: 0.05,
   *   profit: 0.12           // Updated from 0.10
   * })
   * ```
   */
  async updateDefaultPercentages(tenderId: string, percentages: PricingPercentages): Promise<void> {
    try {
      // Load existing payload
      const existingPayload = await pricingStorage.loadTenderPricing(tenderId)

      // Update percentages
      const updatedPayload: TenderPricingPayload = {
        pricing: existingPayload?.pricing || [],
        defaultPercentages: percentages,
        lastSavedAt: new Date().toISOString(),
      }

      await pricingStorage.saveTenderPricing(tenderId, updatedPayload)

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'update-default-percentages',
        key: tenderId,
        level: 'info',
        metadata: { percentages },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'update-percentages-failed',
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
}

/**
 * Singleton instance of PricingDataRepository
 *
 * @type {PricingDataRepository}
 * @description Pre-instantiated repository instance ready for use
 *
 * @example
 * ```typescript
 * import { pricingDataRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Load pricing
 * const pricing = await pricingDataRepository.loadPricing('tender-123')
 *
 * // Save pricing
 * await pricingDataRepository.savePricing(
 *   'tender-123',
 *   pricingMap,
 *   defaultPercentages
 * )
 *
 * // Get percentages
 * const percentages = await pricingDataRepository.getDefaultPercentages('tender-123')
 *
 * // Update percentages
 * await pricingDataRepository.updateDefaultPercentages('tender-123', {
 *   administrative: 0.15,
 *   operational: 0.05,
 *   profit: 0.10
 * })
 * ```
 */
export const pricingDataRepository = PricingDataRepository.getInstance()
