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
 */

import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

import { pricingDataRepository } from './PricingDataRepository'
import { boqSyncRepository } from './BOQSyncRepository'
import { tenderStatusRepository } from './TenderStatusRepository'

/**
 * Save options for pricing operations
 */
export interface SavePricingOptions {
  /** Skip emitting update event (prevent loops) */
  skipEvent?: boolean
}

/**
 * Pricing Orchestrator
 * Coordinates multi-step pricing operations across specialized repositories
 */
export class PricingOrchestrator {
  private static instance: PricingOrchestrator

  private constructor() {}

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
   * Delegates to PricingDataRepository
   */
  async loadPricing(tenderId: string): Promise<Map<string, PricingData>> {
    return pricingDataRepository.loadPricing(tenderId)
  }

  // ===========================
  // 💾 Save Operations (Delegate)
  // ===========================

  /**
   * Save pricing data for a tender
   * Delegates to PricingDataRepository
   */
  async savePricing(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    return pricingDataRepository.savePricing(tenderId, pricingData, defaultPercentages)
  }

  // ===========================
  // 🔄 Orchestrated Operations
  // ===========================

  /**
   * Persist pricing data and sync with BOQ repository
   * This is the core "persistence" operation that:
   * 1. Saves pricing data to storage
   * 2. Updates BOQ repository with calculated totals
   * 3. Updates tender status and progress
   * 4. Emits update events (unless skipEvent is true)
   *
   * This method orchestrates multiple repositories in a transaction-like manner
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

      // Step 1: Save pricing data
      await pricingDataRepository.savePricing(tenderId, pricingData, defaultPercentages)

      // Step 2: Update BOQ repository
      await boqSyncRepository.syncPricingToBOQ(
        tenderId,
        pricingData,
        quantityItems,
        defaultPercentages,
        options,
      )

      // Step 3: Update tender status and progress
      const completedCount = Array.from(pricingData.values()).filter(
        (p) => p?.completed === true,
      ).length

      // Calculate total value using TenderStatusRepository helper
      const totalValue = tenderStatusRepository.calculateTotalValue(
        pricingData,
        quantityItems,
        defaultPercentages,
      )

      console.log('[PricingOrchestrator] Calculated totalValue:', {
        totalValue,
        completedCount,
        totalCount: quantityItems.length,
      })

      await tenderStatusRepository.updateTenderStatus(
        tenderId,
        completedCount,
        quantityItems.length,
        totalValue,
        { allowRefresh: true }, // Allow refresh from Save button
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

  // ===========================
  // 🔧 Status Operations (Delegate)
  // ===========================

  /**
   * Update tender status based on pricing completion
   * Delegates to TenderStatusRepository
   */
  async updateTenderStatus(
    tenderId: string,
    completedCount: number,
    totalCount: number,
    totalValue: number,
    options?: { allowRefresh?: boolean },
  ): Promise<void> {
    return tenderStatusRepository.updateTenderStatus(
      tenderId,
      completedCount,
      totalCount,
      totalValue,
      options,
    )
  }

  // ===========================
  // 📈 Percentages Operations (Delegate)
  // ===========================

  /**
   * Get default percentages for a tender
   * Delegates to PricingDataRepository
   */
  async getDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
    return pricingDataRepository.getDefaultPercentages(tenderId)
  }

  /**
   * Update default percentages for a tender
   * Delegates to PricingDataRepository
   */
  async updateDefaultPercentages(tenderId: string, percentages: PricingPercentages): Promise<void> {
    return pricingDataRepository.updateDefaultPercentages(tenderId, percentages)
  }
}

// Export singleton instance
export const pricingOrchestrator = PricingOrchestrator.getInstance()
