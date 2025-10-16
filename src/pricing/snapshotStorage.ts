// Snapshot storage & hashing utilities
// Provides: save/load/validate + hashing for integrity + config hashing

import { snapshotStorage } from '@/storage/modules/SnapshotStorage'
import type { PricingSnapshot } from './snapshotModel'
import { computeIntegrityHash } from './snapshotCompute'

export {
  computeTotalsHash,
  stableConfigHash,
  computeIntegrityHash,
  simpleHash,
} from './snapshotCompute'

export async function savePricingSnapshot(tenderId: string, snapshot: PricingSnapshot) {
  await snapshotStorage.savePricingSnapshot(tenderId, snapshot)
}

export async function loadPricingSnapshot(tenderId: string): Promise<PricingSnapshot | null> {
  return snapshotStorage.loadPricingSnapshot(tenderId)
}

export async function validateSnapshotIntegrity(
  tenderId: string,
): Promise<{ ok: boolean; reason?: string }> {
  return snapshotStorage.validateSnapshotIntegrity(tenderId, computeIntegrityHash)
}
