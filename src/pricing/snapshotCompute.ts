// Compute Pricing Snapshot
// مسؤول عن: التطبيع + الإثراء + الدمج + تصحيح unitPrice + بناء meta + hashing

import { enrichPricingItems, aggregateTotals } from '@/application/services/pricingEngine'
import type { EnrichedPricingItem } from '@/application/services/pricingEngine'
import type { DefaultPercentages } from '@/application/services/pricingService'
import { dedupePricingItems } from '../utils/pricingHelpers'
import type { PricingItemInput, RawPricingInput } from '../utils/pricingHelpers'
import { getPricingConfig } from '../utils/pricingConstants'
import type { PricingBusinessConfig } from '../utils/pricingConstants'
import type { PricingSnapshot, PricingSnapshotItem, PricingSnapshotMeta, PricingSnapshotTotals } from './snapshotModel'
import { CURRENT_SNAPSHOT_VERSION, SNAPSHOT_ENGINE_VERSION } from './snapshotModel'

interface ComputeSnapshotParams {
  rawPricing: RawPricingInput
  originalItems: PricingItemInput[]
  defaults?: DefaultPercentages
  source: PricingSnapshotMeta['source']
  notes?: string
}

type AggregatedTotals = ReturnType<typeof aggregateTotals>

const toSnapshotItem = (item: EnrichedPricingItem): PricingSnapshotItem => {
  const potentialFlags = (item as Record<string, unknown>).flags
  const flags = typeof potentialFlags === 'object' && potentialFlags !== null
    ? (potentialFlags as Record<string, unknown>)
    : undefined

  return {
    id: item.id,
    itemNumber: item.itemNumber,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    breakdown: item.breakdown,
    materials: item.materials,
    labor: item.labor,
    equipment: item.equipment,
    subcontractors: item.subcontractors,
    adminPercentage: item.adminPercentage,
    operationalPercentage: item.operationalPercentage,
    profitPercentage: item.profitPercentage,
    isPriced: item.isPriced,
    flags
  }
}

// Helper: adjust unitPrice semantics (totalPrice = breakdown.total, unitPrice = total/quantity)
function normalizeUnitAndTotal(item: EnrichedPricingItem): { unitPrice: number; totalPrice: number } {
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1
  
  // ⚠️ CRITICAL FIX: item.totalPrice هو بالفعل محسوب صحيحاً في enrichPricingItems
  // لا نحتاج لإعادة حساب أو ضرب breakdown.total مرة أخرى
  let totalPrice = 0
  let unitPrice = 0
  
  if (typeof item.totalPrice === 'number' && item.totalPrice > 0) {
    // استخدام القيمة المحسوبة مسبقاً (الطريقة الصحيحة)
    totalPrice = item.totalPrice
    unitPrice = +(totalPrice / quantity).toFixed(4)
  } else if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
    // استخدام سعر الوحدة إذا كان متوفراً
    unitPrice = item.unitPrice
    totalPrice = +(unitPrice * quantity).toFixed(2)
  } else if (item.breakdown?.total) {
    // fallback: breakdown.total هو سعر الوحدة (ليس الإجمالي)
    unitPrice = item.breakdown.total
    totalPrice = +(unitPrice * quantity).toFixed(2)
  }
  
  return { unitPrice: +unitPrice.toFixed(4), totalPrice: +totalPrice.toFixed(2) }
}

export function computePricingSnapshot(params: ComputeSnapshotParams): PricingSnapshot {
  const { rawPricing, originalItems, defaults, source, notes } = params
  // 1) enrich using existing engine (legacy semantics inside engine)
  const enriched = enrichPricingItems(rawPricing, originalItems, defaults)
  // 2) dedupe
  const deduped = dedupePricingItems(enriched)
  // 3) adjust unit/total semantics
  const adjusted = deduped.map<EnrichedPricingItem>(it => {
    const { unitPrice, totalPrice } = normalizeUnitAndTotal(it)
    return { ...it, unitPrice, totalPrice, finalPrice: totalPrice }
  })
  const snapshotItems = adjusted.map(toSnapshotItem)
  // 4) recompute totals after adjustment
  const totalsRaw = aggregateTotals(adjusted)
  const totals: PricingSnapshotTotals = { ...totalsRaw }
  // 5) meta & hashing
  const cfg = getPricingConfig()
  const configHash = stableConfigHash(cfg)
  const totalsHash = computeTotalsHash(snapshotItems, totals)
  const integrityHash = computeIntegrityHash({ items: snapshotItems, totals, configHash, engineVersion: SNAPSHOT_ENGINE_VERSION })
  const meta: PricingSnapshotMeta = {
    engineVersion: SNAPSHOT_ENGINE_VERSION,
    snapshotVersion: CURRENT_SNAPSHOT_VERSION,
    configHash,
    createdAt: new Date().toISOString(),
    itemCount: snapshotItems.length,
    totalsHash,
    integrityHash,
    source,
    notes
  }
  const snapshot: PricingSnapshot = { meta, items: snapshotItems, totals }
  return snapshot
}

export function stableStringify(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

export function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return 'h' + (h >>> 0).toString(36)
}

export function computeTotalsHash(
  items: PricingSnapshotItem[],
  totals: Pick<AggregatedTotals, 'totalValue' | 'vatAmount' | 'totalWithVat'>
): string {
  const payload: Record<string, unknown> = {
    items: items.map(it => ({ id: it.id, totalPrice: it.totalPrice })),
    totals: {
      totalValue: totals.totalValue,
      vatAmount: totals.vatAmount,
      totalWithVat: totals.totalWithVat
    }
  }
  return simpleHash(stableStringify(payload))
}

export function stableConfigHash(cfg: PricingBusinessConfig): string {
  const subset: Record<string, unknown> = { vatRate: cfg.vatRate, defaults: cfg.defaultPercentages }
  return simpleHash(stableStringify(subset))
}

interface ComputeIntegrityHashInput {
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals
  configHash: string
  engineVersion: string
}

export function computeIntegrityHash(input: ComputeIntegrityHashInput): string {
  const core: Record<string, unknown> = {
    engineVersion: input.engineVersion,
    config: input.configHash,
    items: input.items.map(it => ({ id: it.id, quantity: it.quantity, unitPrice: it.unitPrice, totalPrice: it.totalPrice })),
    totals: input.totals.totalValue
  }
  return simpleHash(stableStringify(core))
}
