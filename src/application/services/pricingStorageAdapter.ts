/**
 * Adapter مبسط لإدارة طبقتي التسعير: الرسمي (official) والمسودة (draft)
 * MVP: لا أحداث، لا hash متقدم. مقارنة بالتسلسل الكامل JSON فقط.
 */
import { STORAGE_KEYS } from '@/config/storageKeys'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

interface PricingSnapshotItem {
  id?: string
  lineNo?: string
  totalPrice?: number
  [key: string]: unknown
}

interface PricingSnapshotTotals {
  totalValue?: number
  vatAmount?: number
  totalWithVat?: number
  profitTotal?: number
  [key: string]: unknown
}

interface PricingRecord {
  tenderId: string
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals | null
  meta: {
    status: 'official' | 'draft'
    savedAt: string
    source: 'user' | 'auto' | 'migration'
  }
}

type PricingLayerStore = Record<string, PricingRecord>

function clone<T>(value: T): T {
  if (value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}

async function loadLayer(key: string): Promise<PricingLayerStore> {
  const store = await loadFromStorage<PricingLayerStore | null>(key, null)
  return store ?? {}
}

async function saveLayer(key: string, store: PricingLayerStore): Promise<void> {
  await saveToStorage(key, store)
}

export const pricingStorageAdapter = {
  async loadOfficial(tenderId: string): Promise<PricingRecord | null> {
    const store = await loadLayer(STORAGE_KEYS.PRICING_OFFICIAL)
    return store[tenderId] ? clone(store[tenderId]) : null
  },
  async loadDraft(tenderId: string): Promise<PricingRecord | null> {
    const store = await loadLayer(STORAGE_KEYS.PRICING_DRAFT)
    return store[tenderId] ? clone(store[tenderId]) : null
  },
  async saveOfficial(
    tenderId: string,
    items: PricingSnapshotItem[],
    totals: PricingSnapshotTotals | null,
    source: 'user' | 'migration' = 'user'
  ): Promise<PricingRecord> {
    const store = await loadLayer(STORAGE_KEYS.PRICING_OFFICIAL)
    const record: PricingRecord = {
      tenderId,
      items: clone(items),
      totals: clone(totals),
      meta: { status: 'official', savedAt: new Date().toISOString(), source }
    }
    store[tenderId] = record
    await saveLayer(STORAGE_KEYS.PRICING_OFFICIAL, store)
    // عند حفظ رسمي يمكن حذف المسودة إن وجدت (اختياري الآن)
    const draftStore = await loadLayer(STORAGE_KEYS.PRICING_DRAFT)
    if (draftStore[tenderId]) {
      delete draftStore[tenderId]
      await saveLayer(STORAGE_KEYS.PRICING_DRAFT, draftStore)
    }
    return clone(record)
  },
  async saveDraft(
    tenderId: string,
    items: PricingSnapshotItem[],
    totals: PricingSnapshotTotals | null,
    source: 'auto' | 'user' = 'auto'
  ): Promise<PricingRecord> {
    const store = await loadLayer(STORAGE_KEYS.PRICING_DRAFT)
    const prev = store[tenderId]
    const next: PricingRecord = {
      tenderId,
      items: clone(items),
      totals: clone(totals),
      meta: { status: 'draft', savedAt: new Date().toISOString(), source }
    }
    // تجنب الكتابة إذا لا تغيير (مقارنة JSON كاملة بسيطة)
    const changed = !prev || JSON.stringify(prev.items) !== JSON.stringify(next.items) || JSON.stringify(prev.totals) !== JSON.stringify(next.totals)
    if (changed) {
      store[tenderId] = next
      await saveLayer(STORAGE_KEYS.PRICING_DRAFT, store)
    }
    return clone(store[tenderId])
  },
  async clearDraft(tenderId: string): Promise<void> {
    const store = await loadLayer(STORAGE_KEYS.PRICING_DRAFT)
    if (store[tenderId]) {
      delete store[tenderId]
      await saveLayer(STORAGE_KEYS.PRICING_DRAFT, store)
    }
  },
  async getStatus(tenderId: string): Promise<{ hasOfficial: boolean; hasDraft: boolean; draftNewer: boolean; officialAt?: string; draftAt?: string; }>{
    const official = await this.loadOfficial(tenderId)
    const draft = await this.loadDraft(tenderId)
    const hasOfficial = !!official
    const hasDraft = !!draft
    const draftNewer = !!(official && draft && draft.meta.savedAt > official.meta.savedAt)
    return { hasOfficial, hasDraft, draftNewer, officialAt: official?.meta.savedAt, draftAt: draft?.meta.savedAt }
  }
}

export type { PricingRecord, PricingSnapshotItem, PricingSnapshotTotals }
