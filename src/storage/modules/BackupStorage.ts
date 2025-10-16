/**
 * Backup Storage Module
 *
 * Centralized storage management for backup operations.
 * Handles tender pricing backups, retention policies, and general system backups.
 *
 * @module storage/modules/BackupStorage
 */

import { STORAGE_KEYS } from '@/config/storageKeys'
import type { IStorageModule } from '../core/types'
import type { StorageManager } from '../core/StorageManager'
import type { TenderBackupEntry } from '@/types/pricing'

// ============================================================================
// Tender Pricing Backup Types (from backupManager.ts)
// ============================================================================

const BACKUP_STORE_VERSION = '1.0.0'

export type BackupDataset = 'tender-pricing'
export type RetentionKey = BackupDataset

export interface RetentionRule {
  maxEntries: number
  maxAgeDays?: number
}

export interface TenderPricingBackupPayload {
  tenderId: string
  tenderTitle: string
  pricing: [string, unknown][]
  quantityItems: unknown[]
  completionPercentage: number
  totalValue: number
  timestamp: string
  version: string
}

export interface TenderBackupRecord extends TenderBackupEntry {
  dataset: BackupDataset
  payload: TenderPricingBackupPayload
}

export interface BackupFailureState {
  count: number
  lastFailureAt: string
  lastError?: string
}

export interface BackupStore {
  version: string
  updatedAt: string
  tenders: Record<string, TenderBackupRecord[]>
  failureCounters: Record<string, BackupFailureState>
}

export interface ApplyRetentionResult {
  kept: TenderBackupRecord[]
  pruned: TenderBackupRecord[]
}

export interface BackupExportSnapshot {
  version: string
  generatedAt: string
  retention: Record<RetentionKey, RetentionRule>
  totals: {
    tenders: number
    entries: number
  }
  tenders: Record<string, { summary: TenderBackupEntry; payload: TenderPricingBackupPayload }[]>
  failures: Record<string, BackupFailureState>
}

// ============================================================================
// General System Backup Types (from backup.service.ts)
// ============================================================================

export interface BackupMetadata {
  id: string
  timestamp: Date
  version: string
  userId: string
  userName: string
  type: 'manual' | 'automatic'
  size: number
  encrypted: boolean
  description?: string
  tables: string[]
}

export interface BackupData {
  metadata: BackupMetadata
  data: Record<string, unknown[]>
}

// ============================================================================
// Backup Storage Module
// ============================================================================

export class BackupStorage implements IStorageModule {
  readonly name = 'BackupStorage'
  readonly keys = [STORAGE_KEYS.TENDER_BACKUPS] as const

  private manager!: StorageManager

  setManager(manager: StorageManager): void {
    this.manager = manager
  }

  async initialize(): Promise<void> {
    // Ensure backup store exists
    const existing = await this.manager.get<BackupStore | null>(STORAGE_KEYS.TENDER_BACKUPS, null)
    if (!existing) {
      const emptyStore = this.createEmptyStore()
      await this.manager.set(STORAGE_KEYS.TENDER_BACKUPS, emptyStore)
    }
  }

  async cleanup(): Promise<void> {
    // Optional cleanup logic
  }

  // ============================================================================
  // Tender Pricing Backup Operations
  // ============================================================================

  /**
   * Save tender backup store
   */
  async saveTenderBackupStore(store: BackupStore): Promise<void> {
    const payload = this.normalizeStore(store)
    payload.updatedAt = new Date().toISOString()
    await this.manager.set(STORAGE_KEYS.TENDER_BACKUPS, payload)
  }

  /**
   * Load tender backup store
   */
  async loadTenderBackupStore(): Promise<BackupStore> {
    const raw = await this.manager.get<unknown>(STORAGE_KEYS.TENDER_BACKUPS, null)

    if (this.isBackupStore(raw)) {
      return this.normalizeStore(raw)
    }

    // Return empty store for legacy or invalid data
    return this.createEmptyStore()
  }

  /**
   * Get backups for a specific tender
   */
  async getTenderBackups(tenderId: string): Promise<TenderBackupRecord[]> {
    const store = await this.loadTenderBackupStore()
    return store.tenders[tenderId] ?? []
  }

  /**
   * Save tender backup
   */
  async saveTenderBackup(tenderId: string, record: TenderBackupRecord): Promise<void> {
    const store = await this.loadTenderBackupStore()

    if (!store.tenders[tenderId]) {
      store.tenders[tenderId] = []
    }

    store.tenders[tenderId].push(record)
    await this.saveTenderBackupStore(store)
  }

  /**
   * Replace all tender backups (used after retention)
   */
  async setTenderBackups(tenderId: string, records: TenderBackupRecord[]): Promise<void> {
    const store = await this.loadTenderBackupStore()
    store.tenders[tenderId] = records
    await this.saveTenderBackupStore(store)
  }

  /**
   * Delete specific tender backup
   */
  async deleteTenderBackup(tenderId: string, backupId: string): Promise<void> {
    const store = await this.loadTenderBackupStore()
    const backups = store.tenders[tenderId] ?? []
    store.tenders[tenderId] = backups.filter((b) => b.id !== backupId)
    await this.saveTenderBackupStore(store)
  }

  /**
   * Delete all backups for a tender
   */
  async deleteTenderBackups(tenderId: string): Promise<void> {
    const store = await this.loadTenderBackupStore()
    delete store.tenders[tenderId]
    await this.saveTenderBackupStore(store)
  }

  /**
   * Get failure state for a tender
   */
  async getFailureState(tenderId: string): Promise<BackupFailureState | null> {
    const store = await this.loadTenderBackupStore()
    return store.failureCounters[tenderId] ?? null
  }

  /**
   * Update failure state
   */
  async updateFailureState(tenderId: string, state: BackupFailureState): Promise<void> {
    const store = await this.loadTenderBackupStore()
    store.failureCounters[tenderId] = state
    await this.saveTenderBackupStore(store)
  }

  /**
   * Reset failure counter
   */
  async resetFailureCounter(tenderId: string): Promise<void> {
    const store = await this.loadTenderBackupStore()
    delete store.failureCounters[tenderId]
    await this.saveTenderBackupStore(store)
  }

  /**
   * Get all failure counters
   */
  async getAllFailureCounters(): Promise<Record<string, BackupFailureState>> {
    const store = await this.loadTenderBackupStore()
    return { ...store.failureCounters }
  }

  /**
   * Get all tender IDs with backups
   */
  async getAllTenderIds(): Promise<string[]> {
    const store = await this.loadTenderBackupStore()
    return Object.keys(store.tenders)
  }

  /**
   * Count total backups
   */
  async countBackups(): Promise<number> {
    const store = await this.loadTenderBackupStore()
    return Object.values(store.tenders).reduce((sum, backups) => sum + backups.length, 0)
  }

  /**
   * Export full backup snapshot
   */
  async exportSnapshot(
    retentionMatrix: Record<RetentionKey, RetentionRule>,
  ): Promise<BackupExportSnapshot> {
    const store = await this.loadTenderBackupStore()
    const tenders: BackupExportSnapshot['tenders'] = {}

    for (const [tenderId, records] of Object.entries(store.tenders)) {
      tenders[tenderId] = records
        .slice()
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .map((record) => ({
          summary: this.toSummary(record),
          payload: JSON.parse(JSON.stringify(record.payload)),
        }))
    }

    const totalEntries = Object.values(tenders).reduce((sum, list) => sum + list.length, 0)

    return {
      version: BACKUP_STORE_VERSION,
      generatedAt: new Date().toISOString(),
      retention: JSON.parse(JSON.stringify(retentionMatrix)),
      totals: {
        tenders: Object.keys(tenders).length,
        entries: totalEntries,
      },
      tenders,
      failures: JSON.parse(JSON.stringify(store.failureCounters)),
    }
  }

  /**
   * Clear all tender backups
   */
  async clear(): Promise<void> {
    const emptyStore = this.createEmptyStore()
    await this.manager.set(STORAGE_KEYS.TENDER_BACKUPS, emptyStore)
  }

  // ============================================================================
  // General System Backup Operations
  // ============================================================================

  /**
   * Save general backup
   */
  async saveGeneralBackup(backupId: string, backup: BackupData): Promise<void> {
    const key = `backup_${backupId}`
    await this.manager.set(key, JSON.stringify(backup))
  }

  /**
   * Load general backup
   */
  async loadGeneralBackup(backupId: string): Promise<BackupData | null> {
    const key = `backup_${backupId}`
    const stored = await this.manager.get<string | null>(key, null)

    if (!stored) {
      return null
    }

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  /**
   * Delete general backup
   */
  async deleteGeneralBackup(backupId: string): Promise<void> {
    const key = `backup_${backupId}`
    // Note: StorageManager doesn't have delete method, we set to null
    await this.manager.set(key, null)
  }

  /**
   * Get backup list
   */
  async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const stored = await this.manager.get<string | null>('backup_list', null)
      if (!stored) {
        return []
      }

      const list = JSON.parse(stored) as Record<string, unknown>[]
      return list.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp as string),
      })) as BackupMetadata[]
    } catch {
      return []
    }
  }

  /**
   * Save backup list
   */
  async saveBackupList(list: BackupMetadata[]): Promise<void> {
    await this.manager.set('backup_list', JSON.stringify(list))
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createEmptyStore(): BackupStore {
    return {
      version: BACKUP_STORE_VERSION,
      updatedAt: new Date().toISOString(),
      tenders: {},
      failureCounters: {},
    }
  }

  private normalizeStore(store: BackupStore): BackupStore {
    const normalized = this.createEmptyStore()
    normalized.tenders = JSON.parse(JSON.stringify(store.tenders ?? {}))
    normalized.failureCounters = JSON.parse(JSON.stringify(store.failureCounters ?? {}))
    normalized.updatedAt = this.ensureIsoTimestamp(store.updatedAt)
    normalized.version = BACKUP_STORE_VERSION
    return normalized
  }

  private ensureIsoTimestamp(candidate: string | undefined): string {
    if (typeof candidate === 'string') {
      const parsed = Date.parse(candidate)
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString()
      }
    }
    return new Date().toISOString()
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  }

  private isBackupStore(value: unknown): value is BackupStore {
    if (!this.isRecord(value)) {
      return false
    }
    return (
      typeof value.version === 'string' &&
      typeof value.updatedAt === 'string' &&
      this.isRecord(value.tenders) &&
      this.isRecord(value.failureCounters)
    )
  }

  private toSummary(record: TenderBackupRecord): TenderBackupEntry {
    return {
      id: record.id,
      tenderId: record.tenderId,
      timestamp: record.timestamp,
      tenderTitle: record.tenderTitle,
      completionPercentage: record.completionPercentage,
      totalValue: record.totalValue,
      itemsTotal: record.itemsTotal,
      itemsPriced: record.itemsPriced,
      dataset: record.dataset,
      retentionKey: record.retentionKey,
      retentionExpiresAt: record.retentionExpiresAt,
      version: record.version,
    }
  }
}

// Singleton instance
export const backupStorage = new BackupStorage()
