// Pricing Snapshot Model
// تعريف أنواع snapshot الموحّد لتوحيد القراءة بين صفحات التسعير والتفاصيل

import { PRICING_ENGINE_VERSION } from '@/application/services/pricingEngine'
import type { PricingResource } from '@/utils/pricingHelpers'

export interface PricingSnapshotItemBreakdown {
  materials: number
  labor: number
  equipment: number
  subcontractors: number
  administrative: number
  operational: number
  profit: number
  subtotal: number
  total: number
}

export interface PricingSnapshotItem {
  id: string
  itemNumber?: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  breakdown: PricingSnapshotItemBreakdown
  materials: PricingResource[]
  labor: PricingResource[]
  equipment: PricingResource[]
  subcontractors: PricingResource[]
  adminPercentage: number
  operationalPercentage: number
  profitPercentage: number
  isPriced: boolean
  flags?: Record<string, unknown>
}

export interface PricingSnapshotTotals {
  totalValue: number
  vatAmount: number
  totalWithVat: number
  profit: number
  administrative: number
  operational: number
  adminOperational: number
  vatRate: number
  profitPercentage: number
  adminOperationalPercentage: number
}

export interface PricingSnapshotMeta {
  engineVersion: string
  snapshotVersion: number
  configHash: string
  createdAt: string
  itemCount: number
  totalsHash: string
  integrityHash: string
  source: 'authoring' | 'migration' | 'rebuild'
  notes?: string
}

export interface PricingSnapshot {
  meta: PricingSnapshotMeta
  items: PricingSnapshotItem[]
  totals: PricingSnapshotTotals
}

export const CURRENT_SNAPSHOT_VERSION = 1
export const SNAPSHOT_ENGINE_VERSION = PRICING_ENGINE_VERSION

export interface SnapshotValidationResult { ok: boolean; errors: string[]; warnings: string[] }

export function minimalSnapshotValidation(snapshot: PricingSnapshot): SnapshotValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!snapshot?.meta) errors.push('missing meta')
  if (!Array.isArray(snapshot?.items)) errors.push('items not array')
  if (snapshot.items.length !== snapshot.meta.itemCount) warnings.push('itemCount mismatch meta')
  let recomputedTotal = 0
  for (const it of snapshot.items) {
    if (typeof it.totalPrice !== 'number') errors.push(`item ${it.id} missing totalPrice`)
    recomputedTotal += it.totalPrice || 0
  }
  if (Math.abs(recomputedTotal - snapshot.totals.totalValue) > 0.01) {
    warnings.push(`totals mismatch: meta=${snapshot.totals.totalValue} recomputed=${recomputedTotal}`)
  }
  return { ok: errors.length === 0, errors, warnings }
}
