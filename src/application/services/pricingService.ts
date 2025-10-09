import { STORAGE_KEYS } from '@/config/storageKeys'
import { saveToStorage, loadFromStorage } from '@/utils/storage'

export interface DefaultPercentages {
  administrative: number
  operational: number
  profit: number
}

type PricingEntry = [string, unknown]

export interface TenderPricingPayload {
  pricing: PricingEntry[]
  defaultPercentages?: DefaultPercentages
  lastUpdated?: string
  version?: number
}

type PricingStore = Record<string, TenderPricingPayload>

const LEGACY_KEY = (tenderId: string) => `tender-pricing-${tenderId}`

// علم لتعطيل/تفعيل محاولة ترحيل مفتاح التسعير القديم (موقوف افتراضياً)
const ENABLE_LEGACY_PRICING_MIGRATION = false
let legacyPricingMigrationCount = 0

const isStorage = (value: unknown): value is Storage => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getItem' in value &&
    typeof (value as Storage).getItem === 'function'
  )
}

const resolveLegacyStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }

  const lsName = 'localStorage'
  const globalRecord = globalThis as Record<string, unknown>
  const candidate = globalRecord[lsName]

  return isStorage(candidate) ? candidate : null
}

async function attemptLegacyPricingImport(tenderId: string): Promise<TenderPricingPayload | null> {
  if (!ENABLE_LEGACY_PRICING_MIGRATION) {
    return null
  }

  try {
    const legacyStorage = resolveLegacyStorage()
    const legacyStr = legacyStorage?.getItem(LEGACY_KEY(tenderId)) ?? null
    if (!legacyStr) {
      return null
    }

    const legacy = JSON.parse(legacyStr) as Partial<TenderPricingPayload>
    const payload: TenderPricingPayload = {
      pricing: Array.isArray(legacy?.pricing) ? (legacy.pricing as PricingEntry[]) : [],
      defaultPercentages: legacy?.defaultPercentages,
      lastUpdated: legacy?.lastUpdated ?? new Date().toISOString(),
      version: 1
    }

    await pricingService.saveTenderPricing(tenderId, payload)

    try {
      legacyStorage?.removeItem(LEGACY_KEY(tenderId))
    } catch (error) {
      console.warn('⚠️ تعذر حذف مفتاح التسعير القديم بعد الترحيل', error)
    }

    legacyPricingMigrationCount += 1
    console.info(`[legacy-pricing-migration] imported tender ${tenderId}. total=${legacyPricingMigrationCount}`)
    return payload
  } catch (error) {
    console.warn('⚠️ فشل attemptLegacyPricingImport:', error)
    return null
  }
}

export const pricingService = {
  async loadTenderPricing(tenderId: string): Promise<TenderPricingPayload | null> {
    const store = await loadFromStorage<PricingStore | null>(STORAGE_KEYS.PRICING_DATA, null)
    const existing = store?.[tenderId]
    if (existing) {
      return existing
    }

    const migrated = await attemptLegacyPricingImport(tenderId)
    if (migrated) {
      return migrated
    }

    return null
  },

  async saveTenderPricing(tenderId: string, payload: TenderPricingPayload): Promise<void> {
    const data: TenderPricingPayload = {
      ...payload,
      lastUpdated: payload.lastUpdated ?? new Date().toISOString(),
      version: payload.version ?? 1
    }

    const store = await loadFromStorage<PricingStore>(STORAGE_KEYS.PRICING_DATA, {})
    const previous = store[tenderId]

    let isSame = false
    if (previous) {
      try {
        const normalize = (value: TenderPricingPayload): string => {
          return JSON.stringify(value, (key, val) => (key === 'lastUpdated' ? undefined : val))
        }
        isSame = normalize(previous) === normalize(data)
      } catch (error) {
        console.warn('⚠️ تعذر مقارنة بيانات التسعير السابقة', error)
      }
    }

    if (!isSame) {
      store[tenderId] = data
      await saveToStorage(STORAGE_KEYS.PRICING_DATA, store)
    }
  },

  async getDefaultPercentages(tenderId: string): Promise<DefaultPercentages | null> {
    const data = await this.loadTenderPricing(tenderId)
    return data?.defaultPercentages ?? null
  },

  async setDefaultPercentages(tenderId: string, defaults: DefaultPercentages): Promise<void> {
    const current = (await this.loadTenderPricing(tenderId)) ?? { pricing: [] as PricingEntry[] }
    await this.saveTenderPricing(tenderId, {
      ...current,
      defaultPercentages: defaults,
      lastUpdated: new Date().toISOString()
    })
  }
}
