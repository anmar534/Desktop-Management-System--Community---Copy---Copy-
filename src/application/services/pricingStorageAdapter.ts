/**
 * Simplified adapter for tender pricing storage
 * Direct save on button click only - no draft/official separation
 */
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { loadFromStorage, saveToStorage } from '@/shared/utils/storage/storage'

export interface PricingSnapshotItem {
  id?: string
  lineNo?: string
  totalPrice?: number
  [key: string]: unknown
}

export interface PricingSnapshotTotals {
  totalValue?: number
  vatAmount?: number
  totalWithVat?: number
  profitTotal?: number
  [key: string]: unknown
}

export interface PricingRecord {
  tenderId: string
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals | null
  meta: {
    savedAt: string
    source: 'user' | 'migration'
  }
}

type PricingStore = Record<string, PricingRecord>

function clone<T>(value: T): T {
  if (value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}

async function loadStore(): Promise<PricingStore> {
  const store = await loadFromStorage<PricingStore | null>(STORAGE_KEYS.PRICING_DATA, null)
  return store ?? {}
}

async function saveStore(store: PricingStore): Promise<void> {
  await saveToStorage(STORAGE_KEYS.PRICING_DATA, store)
}

export const pricingStorageAdapter = {
  /**
   * Load pricing data for a tender
   */
  async load(tenderId: string): Promise<PricingRecord | null> {
    const store = await loadStore()
    return store[tenderId] ? clone(store[tenderId]) : null
  },

  /**
   * Save pricing data for a tender
   */
  async save(
    tenderId: string,
    items: PricingSnapshotItem[],
    totals: PricingSnapshotTotals | null,
    source: 'user' | 'migration' = 'user',
  ): Promise<PricingRecord> {
    const store = await loadStore()
    const record: PricingRecord = {
      tenderId,
      items: clone(items),
      totals: clone(totals),
      meta: { savedAt: new Date().toISOString(), source },
    }
    store[tenderId] = record
    await saveStore(store)
    return clone(record)
  },
}
