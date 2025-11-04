/**
 * Pricing Storage Module
 *
 * @module storage/modules/PricingStorage
 * @description Specialized storage module for tender pricing data
 */

import { StorageManager } from '../core/StorageManager'
import type { IStorageModule } from '../core/types'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'

/**
 * Default percentages for pricing calculations
 */
export interface DefaultPercentages {
  administrative: number
  operational: number
  profit: number
}

/**
 * Single pricing entry (key-value pair)
 */
type PricingEntry = [string, unknown]

/**
 * Tender pricing payload
 */
export interface TenderPricingPayload {
  pricing: PricingEntry[]
  defaultPercentages?: DefaultPercentages
  lastUpdated?: string // When data was last modified
  lastSavedAt?: string // When data was last persisted to storage
  version?: number
}

/**
 * Store structure (tenderId -> pricing data)
 */
type PricingStore = Record<string, TenderPricingPayload>

/**
 * Pricing Storage Module
 * Handles all tender pricing data operations
 */
export class PricingStorage implements IStorageModule {
  readonly name = 'PricingStorage'
  readonly keys = [
    STORAGE_KEYS.PRICING_DATA,
    'tender-pricing-', // Legacy prefix (for migration)
  ] as const

  private manager: StorageManager
  private legacyMigrationCount = 0

  constructor() {
    this.manager = StorageManager.getInstance()
  }

  /**
   * Initialize pricing storage
   */
  async initialize(): Promise<void> {
    await this.manager.waitForReady()
  }

  /**
   * Load pricing data for a tender
   * @param tenderId Tender ID
   */
  async loadTenderPricing(tenderId: string): Promise<TenderPricingPayload | null> {
    const store = await this.manager.get<PricingStore | null>(STORAGE_KEYS.PRICING_DATA, null)
    const existing = store?.[tenderId]

    if (existing) {
      return existing
    }

    // Try legacy migration
    const migrated = await this.migrateLegacyPricing(tenderId)
    if (migrated) {
      return migrated
    }

    return null
  }

  /**
   * Save pricing data for a tender
   * @param tenderId Tender ID
   * @param payload Pricing payload
   */
  async saveTenderPricing(tenderId: string, payload: TenderPricingPayload): Promise<void> {
    const data: TenderPricingPayload = {
      ...payload,
      lastUpdated: payload.lastUpdated ?? new Date().toISOString(),
      version: payload.version ?? 1,
    }

    const store = await this.manager.get<PricingStore>(STORAGE_KEYS.PRICING_DATA, {})
    const previous = store[tenderId]

    // Check if data changed (skip lastUpdated and lastSavedAt in comparison)
    let isSame = false
    if (previous) {
      try {
        const normalize = (value: TenderPricingPayload): string => {
          return JSON.stringify(value, (key, val) =>
            key === 'lastUpdated' || key === 'lastSavedAt' ? undefined : val,
          )
        }
        isSame = normalize(previous) === normalize(data)
      } catch (error) {
        console.warn('⚠️ تعذر مقارنة بيانات التسعير السابقة', error)
      }
    }

    // Only save if data changed
    if (!isSame) {
      // Set lastSavedAt to current time when actually persisting
      data.lastSavedAt = new Date().toISOString()
      store[tenderId] = data
      await this.manager.set(STORAGE_KEYS.PRICING_DATA, store)
    }
  }

  /**
   * Delete pricing data for a tender
   * @param tenderId Tender ID
   */
  async deleteTenderPricing(tenderId: string): Promise<void> {
    const store = await this.manager.get<PricingStore>(STORAGE_KEYS.PRICING_DATA, {})
    delete store[tenderId]
    await this.manager.set(STORAGE_KEYS.PRICING_DATA, store)
  }

  /**
   * Get default percentages for a tender
   * @param tenderId Tender ID
   */
  async getDefaultPercentages(tenderId: string): Promise<DefaultPercentages | null> {
    const data = await this.loadTenderPricing(tenderId)
    return data?.defaultPercentages ?? null
  }

  /**
   * Update default percentages for a tender
   * @param tenderId Tender ID
   * @param percentages Default percentages
   */
  async updateDefaultPercentages(tenderId: string, percentages: DefaultPercentages): Promise<void> {
    const existing = await this.loadTenderPricing(tenderId)

    if (!existing) {
      // Create new pricing data with percentages
      await this.saveTenderPricing(tenderId, {
        pricing: [],
        defaultPercentages: percentages,
      })
    } else {
      // Update existing pricing data
      await this.saveTenderPricing(tenderId, {
        ...existing,
        defaultPercentages: percentages,
      })
    }
  }

  /**
   * Get all tender IDs with pricing data
   */
  async getAllTenderIds(): Promise<string[]> {
    const store = await this.manager.get<PricingStore>(STORAGE_KEYS.PRICING_DATA, {})
    return Object.keys(store)
  }

  /**
   * Clear all pricing data
   */
  async clear(): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PRICING_DATA, {})
  }

  /**
   * Import pricing data (replace existing)
   * @param store Pricing store
   */
  async import(store: PricingStore): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PRICING_DATA, store)
  }

  /**
   * Export all pricing data
   */
  async export(): Promise<PricingStore> {
    return this.manager.get<PricingStore>(STORAGE_KEYS.PRICING_DATA, {})
  }

  /**
   * Migrate legacy pricing data for a tender
   * @param tenderId Tender ID
   * @private
   */
  private async migrateLegacyPricing(tenderId: string): Promise<TenderPricingPayload | null> {
    const legacyKey = `tender-pricing-${tenderId}`

    try {
      // Try to load from legacy key via manager
      const legacyData = await this.manager.get<TenderPricingPayload | null>(legacyKey, null)

      if (!legacyData) {
        // Try direct localStorage access for very old data
        /* eslint-disable no-restricted-properties */
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(legacyKey)
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<TenderPricingPayload>
            const now = new Date().toISOString()
            const payload: TenderPricingPayload = {
              pricing: Array.isArray(parsed?.pricing) ? (parsed.pricing as PricingEntry[]) : [],
              defaultPercentages: parsed?.defaultPercentages,
              lastUpdated: parsed?.lastUpdated ?? now,
              lastSavedAt: now, // Migration time becomes save time
              version: 1,
            }

            // Save to new location
            await this.saveTenderPricing(tenderId, payload)

            // Clean up
            window.localStorage.removeItem(legacyKey)
            this.legacyMigrationCount += 1
            console.info(
              `✅ Migrated legacy pricing for tender ${tenderId} (total: ${this.legacyMigrationCount})`,
            )

            return payload
          }
        }
        /* eslint-enable no-restricted-properties */

        return null
      }

      // Migrate from manager
      const now = new Date().toISOString()
      const payload: TenderPricingPayload = {
        pricing: Array.isArray(legacyData?.pricing) ? legacyData.pricing : [],
        defaultPercentages: legacyData?.defaultPercentages,
        lastUpdated: legacyData?.lastUpdated ?? now,
        lastSavedAt: now, // Migration time becomes save time
        version: 1,
      }

      // Save to new location
      await this.saveTenderPricing(tenderId, payload)

      // Remove legacy key
      await this.manager.remove(legacyKey)
      this.legacyMigrationCount += 1
      console.info(
        `✅ Migrated legacy pricing for tender ${tenderId} (total: ${this.legacyMigrationCount})`,
      )

      return payload
    } catch (error) {
      console.warn(`⚠️ Failed to migrate legacy pricing for tender ${tenderId}:`, error)
      return null
    }
  }

  /**
   * Cleanup module resources
   */
  async cleanup(): Promise<void> {
    // Nothing to cleanup
  }
}

// Export singleton instance
export const pricingStorage = new PricingStorage()
