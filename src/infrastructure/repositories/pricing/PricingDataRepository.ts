/**
 * Pricing Data Repository
 *
 * @module infrastructure/repositories/pricing/PricingDataRepository
 * @description Focused repository for pricing data persistence
 *
 * Responsibilities:
 * - Load pricing data from storage
 * - Save pricing data to storage
 * - Handle serialization/deserialization
 * - Audit logging for pricing operations
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
 */
export class PricingDataRepository {
  private static instance: PricingDataRepository

  private constructor() {}

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
   */
  async savePricing(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    try {
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

// Export singleton instance
export const pricingDataRepository = PricingDataRepository.getInstance()
