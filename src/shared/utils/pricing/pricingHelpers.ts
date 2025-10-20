// Central pricing helpers (Phase 1 adoption)
// هدف: توفير واجهات موحّدة للتطبيع + الإثراء + التجميع + مقارنة النتائج

import { buildPricingMap } from './normalizePricing'
import { enrichPricingItems, aggregateTotals, getEffectivePercentages, DEFAULT_PERCENTAGES } from '@/application/services/pricingEngine'
import { DESCRIPTION_ALIASES } from './pricingConstants'
import type { EnrichedPricingItem, ItemBreakdown } from '@/application/services/pricingEngine'
import type { DefaultPercentages } from '@/application/services/pricingService'
import type { PricingData } from '@/types/pricing'

interface ImportMetaEnvLike {
  env?: Record<string, unknown>
}

export interface PricingResource extends Record<string, unknown> {
  id?: string | number
  name?: string
  description?: string
  price?: number
  quantity?: number
  total?: number
}

export interface PricingItemInput extends Record<string, unknown> {
  id: string
  description?: string
  unit?: string
  itemNumber?: string
  uom?: string
  quantity?: number
  materials?: PricingResource[]
  labor?: PricingResource[]
  equipment?: PricingResource[]
  subcontractors?: PricingResource[]
  additionalPercentages?: Partial<DefaultPercentages>
  defaultPercentages?: Partial<DefaultPercentages>
}

export type RawPricingInput = ([string, PricingItemInput][] | Record<string, PricingItemInput> | undefined)

interface PricingBreakdownArrays {
  materials: PricingResource[]
  labor: PricingResource[]
  equipment: PricingResource[]
  subcontractors: PricingResource[]
}

// Type guards centralised to keep components thin and reusable across hooks/services.
export const isPricingData = (value: unknown): value is PricingData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PricingData>
  const { additionalPercentages } = candidate

  const hasValidPercentages =
    additionalPercentages !== null &&
    typeof additionalPercentages === 'object' &&
    typeof additionalPercentages?.administrative === 'number' &&
    typeof additionalPercentages?.operational === 'number' &&
    typeof additionalPercentages?.profit === 'number'

  return (
    Array.isArray(candidate.materials) &&
    Array.isArray(candidate.labor) &&
    Array.isArray(candidate.equipment) &&
    Array.isArray(candidate.subcontractors) &&
    hasValidPercentages &&
    typeof candidate.technicalNotes === 'string'
  )
}

export const isPricingEntry = (entry: unknown): entry is [string, PricingData] => {
  if (!Array.isArray(entry) || entry.length !== 2) {
    return false
  }

  const [key, value] = entry
  return typeof key === 'string' && isPricingData(value)
}

const getEnvValue = (key: string): unknown => {
  if (typeof import.meta !== 'undefined') {
    const meta = (import.meta as ImportMeta & ImportMetaEnvLike).env
    if (meta && key in meta) {
      return meta[key]
    }
  }
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && key in process.env) {
    return process.env[key]
  }
  return undefined
}

const normalizeBooleanInput = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return undefined
}

const toResourceArray = (value: unknown): PricingResource[] => (Array.isArray(value) ? (value as PricingResource[]) : [])

const sumResources = (resources: PricingResource[]): number => {
  return resources.reduce((sum, resource) => {
    const totalValue = typeof resource.total === 'number' ? resource.total : undefined
    if (totalValue !== undefined) return sum + totalValue
    const price = typeof resource.price === 'number' ? resource.price : undefined
    const quantity = typeof resource.quantity === 'number' ? resource.quantity : undefined
    if (price !== undefined && quantity !== undefined) return sum + price * quantity
    if (price !== undefined) return sum + price
    return sum
  }, 0)
}

// Helper to read boolean env (supports Vite import.meta.env, Node process.env).
function readBoolEnv(keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const raw = getEnvValue(key)
    const normalized = normalizeBooleanInput(raw)
    if (normalized !== undefined) {
      return normalized
    }
  }
  return fallback
}

export const PRICING_FLAGS = {
  USE_ENGINE_DETAILS: true, // عرض التفاصيل عبر المحرك
  // تم تعديل العلم ليكون مفعلاً افتراضياً ضمن مرحلة الاعتماد الكامل (يمكن تعطيله يدوياً إذا ظهرت مشاكل تحرير)
  USE_ENGINE_AUTHORING: readBoolEnv(['VITE_FEATURE_ENGINE_AUTHORING', 'FEATURE_ENGINE_AUTHORING'], true), // مسار التحرير (Authoring Mode)
  // Default flipped to true as part of domain adoption rollout (2025-09) – يمكن تعطيلها عبر متغيرات البيئة
  USE_DOMAIN_PRICING_UI: readBoolEnv(['VITE_FEATURE_DOMAIN_PRICING_UI', 'FEATURE_DOMAIN_PRICING_UI'], true), // (Phase 2.5) تفعيل واجهة التسعير عبر محرك الدومين
  // === Legacy safety flags (fallback/shadow/monitor) retired 2025‑09‑20 ===
  // تمت إزالتها بالكامل. إذا وُجد كود قديم يعتمدها يجب تحديثه إلى المسار الأحادي الحديث.
  DIFF_LOGGING: true,
  DIFF_THRESHOLD_PERCENT: 0.5,
  // Removed: dual-write + snapshot flags (2025-09) – النظام أصبح أحادي المصدر (BOQ + unified pricing)
}

// تم استبدال النسخة المحلية بقائمة مستوردة من pricingConstants للحفاظ على مصدر واحد

export function getCanonicalDescription(raw: Record<string, unknown> | null | undefined, fallback: string): string {
  if (!raw) return fallback
  for (const field of DESCRIPTION_ALIASES) {
    const value = raw[field]
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text.length > 0) return text
  }
  return fallback
}

export function normalizeAndEnrich(
  rawPricing: RawPricingInput,
  originalItems: PricingItemInput[],
  defaults?: DefaultPercentages
) {
  const effectiveDefaults = defaults ?? DEFAULT_PERCENTAGES
  type PricingMapSource = Parameters<typeof buildPricingMap>[0]
  const pricingMap = buildPricingMap(rawPricing as PricingMapSource)
  const enriched = enrichPricingItems(rawPricing, originalItems, effectiveDefaults)
  return { pricingMap, enriched }
}

// Deduplicate enriched pricing items by id, merging arrays & preferring the most complete record.
// حالات التكرار تظهر عندما يُعاد إدخال نفس البند من مصدرين (مثلاً: إعادة تحميل + حدث بث) أو سوء تفسير أحد المصادر.
// سياسة الدمج:
// 1) اختيار سجل أساسي يمتلك: وصف (description) أطول + وحدة (unit) صالحة + quantity > 0.
// 2) دمج مصفوفات (materials / labor / equipment / subcontractors) مع إزالة التكرارات حسب (id || name+price+quantity).
// 3) إعادة حساب breakdown من المصفوفات إن توفرت بيانات تفصيلية، وإلا الإبقاء على أعلى subtotal متاح.
// 4) الحفاظ على ترتيب الظهور الأول في القائمة النهائية.
export function dedupePricingItems(items: EnrichedPricingItem[]): EnrichedPricingItem[] {
  if (items.length === 0) return items

  const groups: Record<string, EnrichedPricingItem[]> = Object.create(null)
  const order: string[] = []

  for (const entry of items) {
    const id = entry?.id != null ? String(entry.id) : undefined
    if (!id) continue
    if (!groups[id]) {
      groups[id] = []
      order.push(id)
    }
    groups[id].push(entry)
  }

  const pickPrimary = (entries: EnrichedPricingItem[]): EnrichedPricingItem => {
    if (entries.length === 1) return entries[0]

    let best = entries[0]
    let bestScore = -1

    for (const candidate of entries) {
      const desc = typeof candidate.description === 'string' ? candidate.description.trim() : ''
      const unit = typeof candidate.unit === 'string' ? candidate.unit.trim() : ''
      const arraysLength = (Array.isArray(candidate.materials) ? candidate.materials.length : 0) +
        (Array.isArray(candidate.labor) ? candidate.labor.length : 0) +
        (Array.isArray(candidate.equipment) ? candidate.equipment.length : 0) +
        (Array.isArray(candidate.subcontractors) ? candidate.subcontractors.length : 0)

      const normalizedDesc = desc.toLowerCase()
      const descriptionScore = desc && normalizedDesc !== 'البند' && !normalizedDesc.includes('غير محدد')
        ? Math.min(desc.length, 50)
        : 0

      const score = (
        descriptionScore +
        (unit && unit !== '-' && unit !== '—' ? 10 : 0) +
        (candidate.breakdown ? 5 : 0) +
        arraysLength
      )

      if (score > bestScore) {
        best = candidate
        bestScore = score
      }
    }

    return best
  }

  const uniqueRowKey = (row: PricingResource | undefined): string => {
    if (!row) return ''
    const idValue = row.id
    if (typeof idValue === 'string' || typeof idValue === 'number') return String(idValue)
    const nameValue = typeof row.name === 'string' ? row.name : typeof row.description === 'string' ? row.description : ''
    const priceValue = typeof row.price === 'number' ? row.price : 0
    const quantityValue = typeof row.quantity === 'number' ? row.quantity : 0
    return `${nameValue}__${priceValue}__${quantityValue}`
  }

  const mergeArrays = (arrays: PricingResource[][]): PricingResource[] => {
    const seen = new Set<string>()
    const merged: PricingResource[] = []

    for (const arr of arrays) {
      for (const row of arr) {
        const key = uniqueRowKey(row)
        if (!key || seen.has(key)) continue
        seen.add(key)
        merged.push(row)
      }
    }

    return merged
  }

  const computeBreakdownFromArrays = (primary: EnrichedPricingItem, merged: PricingBreakdownArrays): ItemBreakdown => {
    const materials = sumResources(merged.materials)
    const labor = sumResources(merged.labor)
    const equipment = sumResources(merged.equipment)
    const subcontractors = sumResources(merged.subcontractors)
    const subtotal = materials + labor + equipment + subcontractors
    const administrative = primary.breakdown.administrative
    const operational = primary.breakdown.operational
    const profit = primary.breakdown.profit
    const total = subtotal + administrative + operational + profit

    return { materials, labor, equipment, subcontractors, administrative, operational, profit, subtotal, total }
  }

  const result: EnrichedPricingItem[] = []

  for (const id of order) {
    const groupedEntries = groups[id]
    const primary = pickPrimary(groupedEntries)

    if (groupedEntries.length === 1) {
      result.push(primary)
      continue
    }

    const mergedArrays: PricingBreakdownArrays = {
      materials: mergeArrays(groupedEntries.map(entry => toResourceArray(entry.materials))),
      labor: mergeArrays(groupedEntries.map(entry => toResourceArray(entry.labor))),
      equipment: mergeArrays(groupedEntries.map(entry => toResourceArray(entry.equipment))),
      subcontractors: mergeArrays(groupedEntries.map(entry => toResourceArray(entry.subcontractors)))
    }

    const hasDetailedArrays = mergedArrays.materials.length + mergedArrays.labor.length + mergedArrays.equipment.length + mergedArrays.subcontractors.length > 0
    const breakdown = hasDetailedArrays ? computeBreakdownFromArrays(primary, mergedArrays) : primary.breakdown

    const resolvedItemNumber = primary.itemNumber ?? groupedEntries.find(entry => entry.itemNumber)?.itemNumber
    const resolvedUnitCandidate = typeof primary.unit === 'string' ? primary.unit : groupedEntries.find(entry => typeof entry.unit === 'string')?.unit
    const resolvedUnit = resolvedUnitCandidate && resolvedUnitCandidate !== '-' && resolvedUnitCandidate !== '—' ? resolvedUnitCandidate : primary.unit
    const resolvedDescription = typeof primary.description === 'string' && primary.description.trim().length > 0
      ? primary.description
      : groupedEntries.find(entry => typeof entry.description === 'string' && entry.description.trim().length > 0)?.description

    const mergedItem: EnrichedPricingItem = {
      ...primary,
      ...mergedArrays,
      breakdown,
      itemNumber: resolvedItemNumber,
      unit: resolvedUnit,
      description: resolvedDescription ?? primary.description
    }

    result.push(mergedItem)
  }

  return result
}

export function safeAggregate(items: EnrichedPricingItem[]) {
  return aggregateTotals(items)
}

// (Legacy Diff Removal 2025-09-20): تمت إزالة آليات مقارنة legacy vs engine (diffPrices/authoringDiff)
// إذا احتجنا مقارنة مستقبلية يمكن بناء أداة خارجية تعتمد على snapshots المحفوظة.

export { enrichPricingItems, aggregateTotals, getEffectivePercentages, DEFAULT_PERCENTAGES }
