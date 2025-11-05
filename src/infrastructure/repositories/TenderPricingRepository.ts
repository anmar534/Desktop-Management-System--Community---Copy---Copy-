/**
 * Tender Pricing Repository (Facade)
 *
 * @module infrastructure/repositories/TenderPricingRepository
 * @description Facade pattern for tender pricing operations
 *
 * Architecture Pattern: FACADE
 * This class now delegates all operations to specialized repositories:
 * - Pricing data helpers: Pricing data persistence
 * - BOQ sync helpers: BOQ synchronization
 * - Tender status helpers: Tender status updates
 * - PricingOrchestrator: Coordinated multi-step operations
 *
 * Purpose:
 * - Maintain backward compatibility with existing code
 * - Provide simple, unified API
 * - Delegate to specialized, focused repositories
 *
 * Migration Note:
 * Original god-service (589 lines) split into 4 focused repositories
 * This facade maintains 100% API compatibility
 */

import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import type { QuantityItem } from '@/presentation/pages/Tenders/TenderPricing/types'
import {
  pricingOrchestrator,
  loadPricingData,
  savePricingData,
  loadDefaultPercentages,
  updateDefaultPercentages as persistDefaultPercentages,
  updateTenderStatus as persistTenderStatus,
  type SavePricingOptions,
} from './pricing'

/**
 * Tender Pricing Repository
 * Facade that delegates to specialized repositories
 */
export class TenderPricingRepository {
  async loadPricing(tenderId: string): Promise<Map<string, PricingData>> {
    return loadPricingData(tenderId)
  }

  async savePricing(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    defaultPercentages: PricingPercentages,
  ): Promise<void> {
    return savePricingData(tenderId, pricingData, defaultPercentages)
  }

  async persistPricingAndBOQ(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    quantityItems: QuantityItem[],
    defaultPercentages: PricingPercentages,
    options?: SavePricingOptions,
  ): Promise<void> {
    return pricingOrchestrator.persistPricingAndBOQ(
      tenderId,
      pricingData,
      quantityItems,
      defaultPercentages,
      options,
    )
  }

  async updateTenderStatus(
    tenderId: string,
    completedCount: number,
    totalCount: number,
    totalValue: number,
    options?: { allowRefresh?: boolean },
  ): Promise<void> {
    return persistTenderStatus(tenderId, completedCount, totalCount, totalValue, options)
  }

  async getDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
    return loadDefaultPercentages(tenderId)
  }

  async updateDefaultPercentages(tenderId: string, percentages: PricingPercentages): Promise<void> {
    return persistDefaultPercentages(tenderId, percentages)
  }
}

export const tenderPricingRepository = new TenderPricingRepository()

export type { SavePricingOptions }
