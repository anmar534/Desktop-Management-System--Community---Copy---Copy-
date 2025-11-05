import { getTenderRepository } from '@/application/services/serviceRegistry'
import { APP_EVENTS } from '@/events/bus'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

export interface StatusUpdateOptions {
  allowRefresh?: boolean
}

/**
 * Update tender status metadata after pricing changes.
 */
export async function updateTenderStatus(
  tenderId: string,
  completedCount: number,
  totalCount: number,
  totalValue: number,
  options?: StatusUpdateOptions,
): Promise<void> {
  try {
    const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    const tenderRepo = getTenderRepository()

    console.log('[tenderStatus.update] Updating tender status:', {
      tenderId,
      completedCount,
      totalCount,
      totalValue,
      completionPercentage,
      allowRefresh: options?.allowRefresh,
    })

    const newTenderStatus = completionPercentage === 100 ? 'ready_to_submit' : 'under_action'

    await tenderRepo.update(
      tenderId,
      {
        status: newTenderStatus,
        pricedItems: completedCount,
        totalItems: totalCount,
        totalValue,
        completionPercentage,
      },
      { skipRefresh: true },
    )

    if (typeof window !== 'undefined') {
      const skipRefresh = !options?.allowRefresh
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
 * Calculate total tender value including VAT.
 */
export function calculateTotalValue(
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

    if (itemPricing.pricingMethod === 'direct' && itemPricing.directUnitPrice) {
      return sum + itemPricing.directUnitPrice * item.quantity
    }

    const materialsCost =
      itemPricing.materials?.reduce((s: number, m: { total: number }) => s + (m.total || 0), 0) || 0
    const laborCost =
      itemPricing.labor?.reduce((s: number, l: { total: number }) => s + (l.total || 0), 0) || 0
    const equipmentCost =
      itemPricing.equipment?.reduce((s: number, e: { total: number }) => s + (e.total || 0), 0) || 0
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

  const vatRate = 0.15
  const vatAmount = totalValue * vatRate
  return round2(totalValue + vatAmount)
}
