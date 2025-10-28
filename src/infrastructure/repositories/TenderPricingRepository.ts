/**
 * Tender Pricing Repository
 *
 * @module infrastructure/repositories/TenderPricingRepository
 * @description Repository pattern implementation for tender pricing data
 *
 * Responsibilities:
 * - Load pricing data from storage
 * - Save pricing data with auto-save debouncing
 * - Sync with BOQ repository
 * - Handle dirty state tracking
 *
 * This replaces useTenderPricingPersistence hook logic
 */

import {
  pricingStorage,
  type TenderPricingPayload,
} from '@/infrastructure/storage/modules/PricingStorage'
import { getBOQRepository, getTenderRepository } from '@/application/services/serviceRegistry'
import type { PricingData } from '@/shared/types/pricing'
import type { BOQData, BOQItem } from '@/shared/types/boq'
import type {
  QuantityItem,
  PersistedBOQItem,
  PersistedBreakdown,
} from '@/presentation/pages/Tenders/TenderPricing/types'
import type { PricingPercentages } from '@/shared/types/pricing'
import { isPricingEntry } from '@/shared/utils/pricing/pricingHelpers'
import { APP_EVENTS } from '@/events/bus'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Save options for pricing data
 */
export interface SavePricingOptions {
  /** Skip emitting update event (prevent loops) */
  skipEvent?: boolean
}

/**
 * Tender Pricing Repository
 */
export class TenderPricingRepository {
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
        lastUpdated: new Date().toISOString(),
      }

      await pricingStorage.saveTenderPricing(tenderId, payload)

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'save-pricing',
        key: tenderId,
        level: 'info',
        metadata: { itemsCount: serializedPricing.length },
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

  /**
   * Persist pricing data and sync with BOQ repository
   * This is the core "persistence" operation that:
   * 1. Saves pricing data to storage
   * 2. Updates BOQ repository with calculated totals
   * 3. Emits update events (unless skipEvent is true)
   */
  async persistPricingAndBOQ(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    quantityItems: QuantityItem[],
    defaultPercentages: PricingPercentages,
    options?: SavePricingOptions,
  ): Promise<void> {
    try {
      // 1. Save pricing data
      await this.savePricing(tenderId, pricingData, defaultPercentages)

      // 2. Update BOQ repository
      await this.updateBOQRepository(
        tenderId,
        pricingData,
        quantityItems,
        defaultPercentages,
        options,
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
   * Update BOQ repository with calculated pricing data
   * @private
   */
  private async updateBOQRepository(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    quantityItems: QuantityItem[],
    defaultPercentages: PricingPercentages,
    options?: SavePricingOptions,
  ): Promise<void> {
    const round2 = (value: number): number => Math.round(value * 100) / 100

    const items = quantityItems
      .map<PersistedBOQItem | null>((quantityItem) => {
        const itemPricing = pricingData.get(quantityItem.id)
        if (!itemPricing) {
          return null
        }

        // Calculate totals
        const materialsTotal = itemPricing.materials.reduce((sum, row) => sum + (row.total || 0), 0)
        const laborTotal = itemPricing.labor.reduce((sum, row) => sum + (row.total || 0), 0)
        const equipmentTotal = itemPricing.equipment.reduce((sum, row) => sum + (row.total || 0), 0)
        const subcontractorsTotal = itemPricing.subcontractors.reduce(
          (sum, row) => sum + (row.total || 0),
          0,
        )
        const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

        // Get percentages (use item-specific or defaults)
        const adminPercentage =
          itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative
        const operationalPercentage =
          itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational
        const profitPercentage =
          itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit

        // Calculate additional costs
        const administrative = (subtotal * adminPercentage) / 100
        const operational = (subtotal * operationalPercentage) / 100
        const profit = (subtotal * profitPercentage) / 100
        const total = subtotal + administrative + operational + profit
        const unitPrice = quantityItem.quantity > 0 ? total / quantityItem.quantity : total

        // Build persisted item
        const persistedItem: PersistedBOQItem = {
          id: quantityItem.id,
          description: quantityItem.canonicalDescription ?? quantityItem.description,
          canonicalDescription: quantityItem.canonicalDescription ?? quantityItem.description,
          unit: quantityItem.unit,
          quantity: quantityItem.quantity,
          unitPrice: round2(unitPrice),
          totalPrice: round2(total),
          category: 'BOQ',
          breakdown: {
            materials: round2(materialsTotal),
            labor: round2(laborTotal),
            equipment: round2(equipmentTotal),
            subcontractors: round2(subcontractorsTotal),
            administrative: round2(administrative),
            operational: round2(operational),
            profit: round2(profit),
          },
          estimated: {
            quantity: quantityItem.quantity,
            unitPrice: round2(unitPrice),
            totalPrice: round2(total),
            materials: itemPricing.materials,
            labor: itemPricing.labor,
            equipment: itemPricing.equipment,
            subcontractors: itemPricing.subcontractors,
            additionalPercentages: {
              administrative: adminPercentage,
              operational: operationalPercentage,
              profit: profitPercentage,
            },
          },
        }

        return persistedItem
      })
      .filter((item): item is PersistedBOQItem => item !== null)

    // Calculate totals
    const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0)

    const sums = items.reduce<PersistedBreakdown>(
      (acc, item) => {
        acc.materials += item.breakdown.materials
        acc.labor += item.breakdown.labor
        acc.equipment += item.breakdown.equipment
        acc.subcontractors += item.breakdown.subcontractors
        acc.administrative += item.breakdown.administrative
        acc.operational += item.breakdown.operational
        acc.profit += item.breakdown.profit
        return acc
      },
      {
        materials: 0,
        labor: 0,
        equipment: 0,
        subcontractors: 0,
        administrative: 0,
        operational: 0,
        profit: 0,
      },
    )

    const baseSubtotal = sums.materials + sums.labor + sums.equipment + sums.subcontractors
    const adminOperational = sums.administrative + sums.operational
    const vatRate = 0.15
    const vatAmount = round2(totalValue * vatRate)
    const totalWithVat = round2(totalValue + vatAmount)

    const totals = {
      totalValue,
      baseSubtotal,
      vatRate,
      vatAmount,
      totalWithVat,
      profit: round2(sums.profit),
      administrative: round2(sums.administrative),
      operational: round2(sums.operational),
      adminOperational: round2(adminOperational),
      profitPercentage:
        baseSubtotal > 0 ? Number(((sums.profit / baseSubtotal) * 100).toFixed(4)) : 0,
      adminOperationalPercentage:
        totalValue > 0 ? Number(((adminOperational / totalValue) * 100).toFixed(4)) : 0,
      administrativePercentage:
        baseSubtotal > 0 ? Number(((sums.administrative / baseSubtotal) * 100).toFixed(4)) : 0,
      operationalPercentage:
        baseSubtotal > 0 ? Number(((sums.operational / baseSubtotal) * 100).toFixed(4)) : 0,
    }

    // Get existing BOQ
    const boqRepository = getBOQRepository()
    const existing = await boqRepository.getByTenderId(tenderId)

    // Check if data changed (skip lastUpdated in comparison)
    const serializeForComparison = (value: unknown): string =>
      JSON.stringify(value, (key, val) => (key === 'lastUpdated' ? undefined : val))

    const existingShape = existing ? serializeForComparison(existing) : null
    const nextShape = serializeForComparison({ items, totalValue, totals })

    if (existingShape === nextShape) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'persist-boq-skipped-no-change',
        key: tenderId,
        level: 'info',
        metadata: { itemsCount: items.length, totalValue },
      })
      return
    }

    // Save to BOQ repository
    const payload = {
      id: existing?.id,
      tenderId,
      projectId: existing?.projectId,
      items: items as BOQItem[],
      totalValue,
      totals,
      lastUpdated: new Date().toISOString(),
    } satisfies Omit<BOQData, 'id'> & { id?: string }

    await boqRepository.createOrUpdate(payload, { skipRefresh: true })

    // Emit event (unless skipEvent is true)
    if (typeof window !== 'undefined' && !options?.skipEvent) {
      window.dispatchEvent(
        new CustomEvent('boqUpdated', {
          detail: {
            tenderId,
            totalValue,
            itemsCount: items.length,
            skipRefresh: true,
          },
        }),
      )
    }

    recordAuditEvent({
      category: 'tender-pricing',
      action: 'persist-boq',
      key: tenderId,
      level: 'info',
      metadata: { itemsCount: items.length, totalValue },
    })
  }

  /**
   * Update tender status based on pricing completion
   */
  async updateTenderStatus(
    tenderId: string,
    completedCount: number,
    totalCount: number,
    totalValue: number,
  ): Promise<void> {
    try {
      const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
      const tenderRepo = getTenderRepository()

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

      // Emit event without skipRefresh to ensure tender list is updated with new progress data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APP_EVENTS.TENDER_UPDATED, {
            detail: { tenderId },
          }),
        )
      }

      recordAuditEvent({
        category: 'tender-pricing',
        action: 'tender-status-persisted',
        key: tenderId,
        level: 'info',
        metadata: {
          tenderStatus: newTenderStatus,
          completionPercentage,
          itemsPriced: completedCount,
          totalItems: totalCount,
          totalValue,
        },
      })
    } catch (error) {
      recordAuditEvent({
        category: 'tender-pricing',
        action: 'tender-status-update-failed',
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
   * Get default percentages for a tender
   */
  async getDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
    const percentages = await pricingStorage.getDefaultPercentages(tenderId)
    return percentages
  }

  /**
   * Update default percentages for a tender
   */
  async updateDefaultPercentages(tenderId: string, percentages: PricingPercentages): Promise<void> {
    await pricingStorage.updateDefaultPercentages(tenderId, {
      administrative: percentages.administrative,
      operational: percentages.operational,
      profit: percentages.profit,
    })
  }
}

// Singleton instance
export const tenderPricingRepository = new TenderPricingRepository()
