// Snapshot storage & hashing utilities
// Provides: save/load/validate + hashing for integrity + config hashing

import { STORAGE_KEYS } from '../config/storageKeys'
import { saveToStorage, loadFromStorage } from '../utils/storage'
import type { PricingSnapshot } from './snapshotModel'
import { computeIntegrityHash } from './snapshotCompute'

export { computeTotalsHash, stableConfigHash, computeIntegrityHash, simpleHash } from './snapshotCompute'

type SnapshotStore = Record<string, PricingSnapshot>

export async function savePricingSnapshot(tenderId: string, snapshot: PricingSnapshot) {
  const store = await loadFromStorage<SnapshotStore | null>(STORAGE_KEYS.PRICING_SNAPSHOTS, null)
  const updatedStore: SnapshotStore = { ...(store ?? {}), [tenderId]: snapshot }
  await saveToStorage(STORAGE_KEYS.PRICING_SNAPSHOTS, updatedStore)
}

export async function loadPricingSnapshot(tenderId: string): Promise<PricingSnapshot | null> {
  const store = await loadFromStorage<SnapshotStore | null>(STORAGE_KEYS.PRICING_SNAPSHOTS, null)
  return store?.[tenderId] ?? null
}

export async function validateSnapshotIntegrity(tenderId: string): Promise<{ ok: boolean; reason?: string }> {
  const snap = await loadPricingSnapshot(tenderId)
  if (!snap) return { ok: false, reason: 'missing' }
  const expected = computeIntegrityHash({ items: snap.items, totals: snap.totals, configHash: snap.meta.configHash, engineVersion: snap.meta.engineVersion })
  if (expected !== snap.meta.integrityHash) return { ok: false, reason: 'hash-mismatch' }
  return { ok: true }
}
