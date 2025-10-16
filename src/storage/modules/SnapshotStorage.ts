/**
 * Snapshot Storage Module
 *
 * @module storage/modules/SnapshotStorage
 * @description Specialized storage module for pricing snapshots
 */

import { StorageManager } from '../core/StorageManager'
import type { IStorageModule } from '../core/types'
import { STORAGE_KEYS } from '../../config/storageKeys'
import type {
  PricingSnapshot,
  PricingSnapshotItem,
  PricingSnapshotTotals,
  PricingSnapshotMeta,
} from '../../pricing/snapshotModel'

// Re-export types for convenience
export type { PricingSnapshot, PricingSnapshotItem, PricingSnapshotTotals, PricingSnapshotMeta }

/**
 * Store structure (tenderId -> snapshot)
 */
type SnapshotStore = Record<string, PricingSnapshot>

/**
 * Snapshot Storage Module
 * Handles all pricing snapshot operations with integrity validation
 */
export class SnapshotStorage implements IStorageModule {
  readonly name = 'SnapshotStorage'
  readonly keys = [STORAGE_KEYS.PRICING_SNAPSHOTS] as const

  private manager: StorageManager

  constructor() {
    this.manager = StorageManager.getInstance()
  }

  /**
   * Initialize snapshot storage
   */
  async initialize(): Promise<void> {
    await this.manager.waitForReady()
  }

  /**
   * Save pricing snapshot for a tender
   * @param tenderId Tender ID
   * @param snapshot Pricing snapshot
   */
  async savePricingSnapshot(tenderId: string, snapshot: PricingSnapshot): Promise<void> {
    const store = await this.manager.get<SnapshotStore>(STORAGE_KEYS.PRICING_SNAPSHOTS, {})
    store[tenderId] = snapshot
    await this.manager.set(STORAGE_KEYS.PRICING_SNAPSHOTS, store)
  }

  /**
   * Load pricing snapshot for a tender
   * @param tenderId Tender ID
   */
  async loadPricingSnapshot(tenderId: string): Promise<PricingSnapshot | null> {
    const store = await this.manager.get<SnapshotStore | null>(STORAGE_KEYS.PRICING_SNAPSHOTS, null)
    return store?.[tenderId] ?? null
  }

  /**
   * Delete pricing snapshot for a tender
   * @param tenderId Tender ID
   */
  async deletePricingSnapshot(tenderId: string): Promise<void> {
    const store = await this.manager.get<SnapshotStore>(STORAGE_KEYS.PRICING_SNAPSHOTS, {})
    delete store[tenderId]
    await this.manager.set(STORAGE_KEYS.PRICING_SNAPSHOTS, store)
  }

  /**
   * Validate snapshot integrity
   * @param tenderId Tender ID
   * @param computeHash Function to compute integrity hash
   */
  async validateSnapshotIntegrity(
    tenderId: string,
    computeHash: (data: {
      items: PricingSnapshotItem[]
      totals: PricingSnapshotTotals
      configHash: string
      engineVersion: string
    }) => string,
  ): Promise<{ ok: boolean; reason?: string }> {
    const snap = await this.loadPricingSnapshot(tenderId)

    if (!snap) {
      return { ok: false, reason: 'missing' }
    }

    const expected = computeHash({
      items: snap.items,
      totals: snap.totals,
      configHash: snap.meta.configHash,
      engineVersion: snap.meta.engineVersion,
    })

    if (expected !== snap.meta.integrityHash) {
      return { ok: false, reason: 'hash-mismatch' }
    }

    return { ok: true }
  }

  /**
   * Get all tender IDs with snapshots
   */
  async getAllTenderIds(): Promise<string[]> {
    const store = await this.manager.get<SnapshotStore>(STORAGE_KEYS.PRICING_SNAPSHOTS, {})
    return Object.keys(store)
  }

  /**
   * Check if snapshot exists for a tender
   * @param tenderId Tender ID
   */
  async exists(tenderId: string): Promise<boolean> {
    const snapshot = await this.loadPricingSnapshot(tenderId)
    return snapshot !== null
  }

  /**
   * Clear all snapshots
   */
  async clear(): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PRICING_SNAPSHOTS, {})
  }

  /**
   * Import snapshots (replace existing)
   * @param store Snapshot store
   */
  async import(store: SnapshotStore): Promise<void> {
    await this.manager.set(STORAGE_KEYS.PRICING_SNAPSHOTS, store)
  }

  /**
   * Export all snapshots
   */
  async export(): Promise<SnapshotStore> {
    return this.manager.get<SnapshotStore>(STORAGE_KEYS.PRICING_SNAPSHOTS, {})
  }

  /**
   * Get snapshot metadata
   * @param tenderId Tender ID
   */
  async getMetadata(tenderId: string): Promise<PricingSnapshotMeta | null> {
    const snapshot = await this.loadPricingSnapshot(tenderId)
    return snapshot?.meta ?? null
  }

  /**
   * Update snapshot metadata
   * @param tenderId Tender ID
   * @param metadata New metadata
   */
  async updateMetadata(tenderId: string, metadata: Partial<PricingSnapshotMeta>): Promise<void> {
    const snapshot = await this.loadPricingSnapshot(tenderId)

    if (!snapshot) {
      throw new Error(`Snapshot for tender "${tenderId}" not found`)
    }

    snapshot.meta = {
      ...snapshot.meta,
      ...metadata,
    }

    await this.savePricingSnapshot(tenderId, snapshot)
  }

  /**
   * Get snapshot count
   */
  async count(): Promise<number> {
    const tenderIds = await this.getAllTenderIds()
    return tenderIds.length
  }

  /**
   * Cleanup module resources
   */
  async cleanup(): Promise<void> {
    // Nothing to cleanup
  }
}

// Export singleton instance
export const snapshotStorage = new SnapshotStorage()
