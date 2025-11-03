/**
 * BOQ Sync Repository
 *
 * @module infrastructure/repositories/pricing/BOQSyncRepository
 * @description Focused repository for synchronizing pricing data with Bill of Quantities (BOQ)
 *
 * Responsibilities:
 * - Convert pricing data to BOQ items with full breakdowns
 * - Calculate totals, subtotals, and VAT
 * - Handle direct pricing method (directUnitPrice)
 * - Handle detailed pricing method (materials, labor, equipment, subcontractors)
 * - Update BOQ repository with synchronized data
 * - Apply administrative, operational, and profit percentages
 *
 * Architecture Pattern: Repository + Adapter
 * - Isolates BOQ synchronization logic
 * - Adapts PricingData to BOQItem format
 * - Provides clean API for pricing-to-BOQ conversion
 *
 * @see {@link https://github.com/anmar534/Desktop-Management-System/docs/TENDER_SYSTEM_ARCHITECTURE.md}
 *
 * @example
 * ```typescript
 * import { boqSyncRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Sync pricing to BOQ
 * await boqSyncRepository.syncPricingToBOQ(
 *   'tender-123',
 *   pricingDataMap,
 *   quantityItems,
 *   { administrative: 0.15, operational: 0.05, profit: 0.10 }
 * )
 * ```
 */

import { getBOQRepository } from '@/application/services/serviceRegistry'
import type { PricingData } from '@/shared/types/pricing'
import type { BOQData, BOQItem } from '@/shared/types/boq'
import type {
  QuantityItem,
  PersistedBOQItem,
  PersistedBreakdown,
} from '@/presentation/pages/Tenders/TenderPricing/types'
import type { PricingPercentages } from '@/shared/types/pricing'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Save options for BOQ sync
 *
 * @interface BOQSyncOptions
 * @property {boolean} [skipEvent] - Skip emitting update event to prevent loops
 */
export interface BOQSyncOptions {
  /** Skip emitting update event (prevent loops) */
  skipEvent?: boolean
}

/**
 * BOQ Sync Repository
 * Handles synchronization of pricing data with BOQ repository
 *
 * @class BOQSyncRepository
 * @description
 * Repository for synchronizing pricing calculations with Bill of Quantities.
 * Features:
 * - Converts PricingData to BOQItem format
 * - Handles both direct and detailed pricing methods
 * - Calculates comprehensive breakdowns (materials, labor, equipment, etc.)
 * - Applies percentage-based calculations (admin, operational, profit)
 * - Calculates VAT and final totals
 * - Updates BOQ repository with calculated data
 *
 * Pattern: Singleton
 * - Use `BOQSyncRepository.getInstance()` to get the instance
 * - Or import the pre-created `boqSyncRepository` instance
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const repository = BOQSyncRepository.getInstance()
 *
 * // Or use the exported instance
 * import { boqSyncRepository } from './BOQSyncRepository'
 * ```
 */
export class BOQSyncRepository {
  private static instance: BOQSyncRepository

  private constructor() {}

  /**
   * Get the singleton instance of BOQSyncRepository
   *
   * @static
   * @returns {BOQSyncRepository} The singleton instance
   */
  public static getInstance(): BOQSyncRepository {
    if (!BOQSyncRepository.instance) {
      BOQSyncRepository.instance = new BOQSyncRepository()
    }
    return BOQSyncRepository.instance
  }

  // ===========================
  // 🔄 Sync Operations
  // ===========================

  /**
   * Update BOQ repository with calculated pricing data
   *
   * @async
   * @param {string} tenderId - The tender ID
   * @param {Map<string, PricingData>} pricingData - Map of item IDs to pricing data
   * @param {QuantityItem[]} quantityItems - Array of quantity items (BOQ structure)
   * @param {PricingPercentages} defaultPercentages - Default percentages for calculations
   * @param {BOQSyncOptions} [options] - Optional sync options
   * @returns {Promise<void>}
   *
   * @description
   * Synchronizes pricing data with BOQ repository by:
   * 1. Converting each QuantityItem to PersistedBOQItem
   * 2. Handling direct pricing (directUnitPrice) and detailed pricing (materials/labor/equipment)
   * 3. Calculating breakdowns for each item
   * 4. Applying administrative, operational, and profit percentages
   * 5. Calculating total value and VAT
   * 6. Updating BOQ repository with all calculated data
   *
   * Pricing Methods:
   * - Direct: Uses directUnitPrice directly
   * - Detailed: Sums materials, labor, equipment, subcontractors + applies percentages
   *
   * @throws {Error} If BOQ repository update fails
   *
   * @example
   * ```typescript
   * const pricingMap = new Map([
   *   ['item-1', {
   *     pricingMethod: 'direct',
   *     directUnitPrice: 100,
   *     completed: true
   *   }],
   *   ['item-2', {
   *     pricingMethod: 'detailed',
   *     materials: [{ quantity: 10, unitPrice: 5 }],
   *     labor: [{ quantity: 2, unitPrice: 50 }],
   *     completed: true
   *   }]
   * ])
   *
   * await boqSyncRepository.syncPricingToBOQ(
   *   'tender-123',
   *   pricingMap,
   *   quantityItems,
   *   { administrative: 0.15, operational: 0.05, profit: 0.10 }
   * )
   * ```
   */
  async syncPricingToBOQ(
    tenderId: string,
    pricingData: Map<string, PricingData>,
    quantityItems: QuantityItem[],
    defaultPercentages: PricingPercentages,
    options?: BOQSyncOptions,
  ): Promise<void> {
    const round2 = (value: number): number => Math.round(value * 100) / 100

    console.log('[BOQSyncRepository] syncPricingToBOQ called:', {
      tenderId,
      pricingDataSize: pricingData.size,
      quantityItemsCount: quantityItems.length,
      pricingDataKeys: Array.from(pricingData.keys()),
      directPricingItems: Array.from(pricingData.entries())
        .filter(([_, p]) => p.pricingMethod === 'direct')
        .map(([id, p]) => ({ id, directUnitPrice: p.directUnitPrice })),
    })

    // Build items: include ALL quantityItems, not just priced ones
    const items = quantityItems.map<PersistedBOQItem>((quantityItem) => {
      const itemPricing = pricingData.get(quantityItem.id)

      // If no pricing data, create basic BOQ item with zero prices
      if (!itemPricing) {
        return this.createEmptyBOQItem(quantityItem, defaultPercentages)
      }

      // Check if this is DIRECT PRICING
      if (itemPricing.pricingMethod === 'direct' && itemPricing.directUnitPrice) {
        return this.createDirectPricingBOQItem(quantityItem, itemPricing, defaultPercentages)
      }

      // DETAILED PRICING (materials, labor, equipment, subcontractors)
      return this.createDetailedPricingBOQItem(quantityItem, itemPricing, defaultPercentages)
    })

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

    // Save to BOQ repository
    await this.updateBOQRepository(tenderId, items, totalValue, totals, options)
  }

  // ===========================
  // 🔨 Private Helper Methods
  // ===========================

  /**
   * Create empty BOQ item for unpriced quantity item
   *
   * @private
   * @param {QuantityItem} quantityItem - The quantity item
   * @param {PricingPercentages} defaultPercentages - Default percentages
   * @returns {PersistedBOQItem} Empty BOQ item with zero values
   *
   * @description
   * Creates a BOQ item for quantity items that haven't been priced yet.
   * All price fields are set to 0, but structure is maintained for consistency.
   */
  private createEmptyBOQItem(
    quantityItem: QuantityItem,
    defaultPercentages: PricingPercentages,
  ): PersistedBOQItem {
    return {
      id: quantityItem.id,
      description: quantityItem.canonicalDescription ?? quantityItem.description,
      canonicalDescription: quantityItem.canonicalDescription ?? quantityItem.description,
      unit: quantityItem.unit,
      quantity: quantityItem.quantity,
      unitPrice: 0,
      totalPrice: 0,
      category: 'BOQ' as const,
      breakdown: {
        materials: 0,
        labor: 0,
        equipment: 0,
        subcontractors: 0,
        administrative: 0,
        operational: 0,
        profit: 0,
      },
      estimated: {
        quantity: quantityItem.quantity,
        unitPrice: 0,
        totalPrice: 0,
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        additionalPercentages: {
          administrative: defaultPercentages.administrative,
          operational: defaultPercentages.operational,
          profit: defaultPercentages.profit,
        },
      },
    }
  }

  /**
   * Create BOQ item for direct pricing method
   *
   * @private
   * @param {QuantityItem} quantityItem - The quantity item
   * @param {PricingData} itemPricing - The pricing data (must have directUnitPrice)
   * @param {PricingPercentages} defaultPercentages - Default percentages
   * @returns {PersistedBOQItem} BOQ item with direct pricing
   *
   * @description
   * Creates a BOQ item for items priced using direct unit price method.
   * The directUnitPrice is used as-is without breakdown calculations.
   * Percentages are stored but not applied (direct pricing includes all costs).
   */
  private createDirectPricingBOQItem(
    quantityItem: QuantityItem,
    itemPricing: PricingData,
    defaultPercentages: PricingPercentages,
  ): PersistedBOQItem {
    const round2 = (value: number): number => Math.round(value * 100) / 100
    const unitPrice = itemPricing.directUnitPrice!
    const totalPrice = round2(unitPrice * quantityItem.quantity)

    // Use derived percentages if available, otherwise defaults
    const percentages =
      itemPricing.derivedPercentages || itemPricing.additionalPercentages || defaultPercentages

    return {
      id: quantityItem.id,
      description: quantityItem.canonicalDescription ?? quantityItem.description,
      canonicalDescription: quantityItem.canonicalDescription ?? quantityItem.description,
      unit: quantityItem.unit,
      quantity: quantityItem.quantity,
      unitPrice: round2(unitPrice),
      totalPrice: totalPrice,
      category: 'BOQ' as const,
      breakdown: {
        materials: 0,
        labor: 0,
        equipment: 0,
        subcontractors: 0,
        administrative: 0,
        operational: 0,
        profit: 0,
      },
      estimated: {
        quantity: quantityItem.quantity,
        unitPrice: round2(unitPrice),
        totalPrice: totalPrice,
        materials: [],
        labor: [],
        equipment: [],
        subcontractors: [],
        additionalPercentages: {
          administrative: percentages.administrative,
          operational: percentages.operational,
          profit: percentages.profit,
        },
      },
    }
  }

  /**
   * Create BOQ item for detailed pricing method
   *
   * @private
   * @param {QuantityItem} quantityItem - The quantity item
   * @param {PricingData} itemPricing - The pricing data with materials/labor/equipment
   * @param {PricingPercentages} defaultPercentages - Default percentages
   * @returns {PersistedBOQItem} BOQ item with detailed breakdown
   *
   * @description
   * Creates a BOQ item for items priced using detailed method.
   * Calculation steps:
   * 1. Sum materials, labor, equipment, subcontractors
   * 2. Apply administrative percentage
   * 3. Apply operational percentage
   * 4. Apply profit percentage
   * 5. Calculate unit price = total / quantity
   * 6. Build complete breakdown for transparency
   */
  private createDetailedPricingBOQItem(
    quantityItem: QuantityItem,
    itemPricing: PricingData,
    defaultPercentages: PricingPercentages,
  ): PersistedBOQItem {
    const round2 = (value: number): number => Math.round(value * 100) / 100

    // Calculate component totals
    const materialsTotal =
      itemPricing.materials?.reduce((sum, row) => sum + (row.total || 0), 0) || 0
    const laborTotal = itemPricing.labor?.reduce((sum, row) => sum + (row.total || 0), 0) || 0
    const equipmentTotal =
      itemPricing.equipment?.reduce((sum, row) => sum + (row.total || 0), 0) || 0
    const subcontractorsTotal =
      itemPricing.subcontractors?.reduce((sum, row) => sum + (row.total || 0), 0) || 0
    const subtotal = materialsTotal + laborTotal + equipmentTotal + subcontractorsTotal

    // Get percentages (use item-specific or defaults)
    const adminPercentage =
      itemPricing.additionalPercentages?.administrative ?? defaultPercentages.administrative
    const operationalPercentage =
      itemPricing.additionalPercentages?.operational ?? defaultPercentages.operational
    const profitPercentage = itemPricing.additionalPercentages?.profit ?? defaultPercentages.profit

    // Calculate additional costs
    const administrative = (subtotal * adminPercentage) / 100
    const operational = (subtotal * operationalPercentage) / 100
    const profit = (subtotal * profitPercentage) / 100
    const total = subtotal + administrative + operational + profit
    const unitPrice = quantityItem.quantity > 0 ? total / quantityItem.quantity : total

    return {
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
  }

  /**
   * Update BOQ repository with calculated items
   *
   * @private
   * @async
   * @param {string} tenderId - The tender ID
   * @param {PersistedBOQItem[]} items - Array of calculated BOQ items
   * @param {number} totalValue - Total value of all items
   * @param {Record<string, number>} totals - Calculated totals and percentages
   * @param {BOQSyncOptions} [options] - Optional sync options
   * @returns {Promise<void>}
   *
   * @description
   * Updates the BOQ repository with calculated data.
   * Features:
   * - Compares with existing data to skip unnecessary updates
   * - Preserves BOQ ID and projectId if exists
   * - Emits 'boqUpdated' event (unless skipEvent is true)
   * - Records audit events for tracking
   * - Handles both create and update operations
   *
   * @throws {Error} If BOQ repository update fails
   */
  private async updateBOQRepository(
    tenderId: string,
    items: PersistedBOQItem[],
    totalValue: number,
    totals: Record<string, number>,
    options?: BOQSyncOptions,
  ): Promise<void> {
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
}

/**
 * Singleton instance of BOQSyncRepository
 *
 * @type {BOQSyncRepository}
 * @description Pre-instantiated repository instance ready for use
 *
 * @example
 * ```typescript
 * import { boqSyncRepository } from '@/infrastructure/repositories/pricing'
 *
 * // Sync pricing to BOQ
 * await boqSyncRepository.syncPricingToBOQ(
 *   'tender-123',
 *   pricingDataMap,
 *   quantityItems,
 *   { administrative: 0.15, operational: 0.05, profit: 0.10 },
 *   { skipEvent: false }
 * )
 * ```
 */
export const boqSyncRepository = BOQSyncRepository.getInstance()
