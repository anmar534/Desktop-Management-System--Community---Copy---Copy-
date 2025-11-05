/**
 * Pricing data persistence utilities.
 *
 * Converted from the legacy repository singleton into lightweight
 * functions so the pricing layer can call storage directly without
 * instantiating repository objects. This is part of simplifying the
 * architecture and removing the repository pattern from the pricing
 * workflow.
 */

import {
  pricingStorage,
  type TenderPricingPayload,
} from '@/infrastructure/storage/modules/PricingStorage'
import type { PricingData, PricingPercentages } from '@/shared/types/pricing'
import { isPricingEntry } from '@/shared/utils/pricing/pricingHelpers'
import { recordAuditEvent } from '@/shared/utils/storage/auditLog'

/**
 * Load pricing data for a tender and return it as a Map keyed by item id.
 */
export async function loadPricingData(tenderId: string): Promise<Map<string, PricingData>> {
  try {
    const payload = await pricingStorage.loadTenderPricing(tenderId)

    if (!payload || !payload.pricing) {
      return new Map()
    }

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
 * Persist pricing data and percentages to storage.
 */
export async function savePricingData(
  tenderId: string,
  pricingData: Map<string, PricingData>,
  defaultPercentages: PricingPercentages,
): Promise<void> {
  try {
    console.log('[pricingData.save] Saving with percentages:', {
      tenderId,
      defaultPercentages,
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

/**
 * Load default pricing percentages for a tender.
 */
export async function loadDefaultPercentages(tenderId: string): Promise<PricingPercentages | null> {
  try {
    const payload = await pricingStorage.loadTenderPricing(tenderId)
    return payload?.defaultPercentages || null
  } catch (error) {
    console.error('[pricingData.loadDefaultPercentages] Failed to load defaults:', error)
    return null
  }
}

/**
 * Update default percentages while keeping the existing pricing entries intact.
 */
export async function updateDefaultPercentages(
  tenderId: string,
  percentages: PricingPercentages,
): Promise<void> {
  try {
    const existingPayload = await pricingStorage.loadTenderPricing(tenderId)

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
