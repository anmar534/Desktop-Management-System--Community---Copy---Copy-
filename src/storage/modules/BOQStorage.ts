/**
 * BOQ Storage Module
 *
 * Centralized storage management for Bill of Quantities (BOQ) data.
 * Handles BOQ CRUD operations, item management, and total calculations.
 *
 * @module storage/modules/BOQStorage
 */

import { STORAGE_KEYS } from '@/config/storageKeys'
import type { IStorageModule } from '../core/types'
import { StorageManager } from '../core/StorageManager'
import type { BOQData } from '@/types/boq'

// ============================================================================
// BOQ Storage Module
// ============================================================================

export class BOQStorage implements IStorageModule {
  readonly name = 'BOQStorage'
  readonly keys = [STORAGE_KEYS.BOQ_DATA] as const

  private manager: StorageManager

  constructor(manager: StorageManager = StorageManager.getInstance()) {
    this.manager = manager
  }

  setManager(manager: StorageManager): void {
    this.manager = manager
  }

  async initialize(): Promise<void> {
    // Ensure BOQ store exists
    const existing = await this.manager.get<BOQData[] | null>(STORAGE_KEYS.BOQ_DATA, null)
    if (!existing) {
      await this.manager.set(STORAGE_KEYS.BOQ_DATA, [])
    }
  }

  async cleanup(): Promise<void> {
    // Optional cleanup logic
  }

  // ============================================================================
  // BOQ Operations
  // ============================================================================

  /**
   * Get all BOQ entries
   */
  async getAll(): Promise<BOQData[]> {
    const stored = await this.manager.get<BOQData[]>(STORAGE_KEYS.BOQ_DATA, [])
    if (!Array.isArray(stored)) {
      return []
    }
    return stored
  }

  /**
   * Get BOQ by ID
   */
  async getById(id: string): Promise<BOQData | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.id === id) ?? null
  }

  /**
   * Get BOQ by tender ID
   */
  async getByTenderId(tenderId: string): Promise<BOQData | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.tenderId === tenderId) ?? null
  }

  /**
   * Get BOQ by project ID
   */
  async getByProjectId(projectId: string): Promise<BOQData | null> {
    const entries = await this.getAll()
    return entries.find((entry) => entry.projectId === projectId) ?? null
  }

  /**
   * Save all BOQ entries (replace)
   */
  async saveAll(entries: BOQData[]): Promise<void> {
    await this.manager.set(STORAGE_KEYS.BOQ_DATA, entries)
  }

  /**
   * Add a new BOQ entry
   */
  async add(entry: BOQData): Promise<void> {
    const entries = await this.getAll()
    entries.push(entry)
    await this.saveAll(entries)
  }

  /**
   * Update an existing BOQ entry
   */
  async update(id: string, updates: Partial<BOQData>): Promise<BOQData | null> {
    const entries = await this.getAll()
    const index = entries.findIndex((entry) => entry.id === id)

    if (index === -1) {
      return null
    }

    const updated: BOQData = {
      ...entries[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    }
    entries[index] = updated
    await this.saveAll(entries)
    return updated
  }

  /**
   * Create or update BOQ entry
   */
  async createOrUpdate(boq: Omit<BOQData, 'id'> & { id?: string }): Promise<BOQData> {
    const entries = await this.getAll()

    let targetIndex = -1
    if (boq.id) {
      targetIndex = entries.findIndex((entry) => entry.id === boq.id)
    } else {
      targetIndex = entries.findIndex(
        (entry) =>
          (boq.tenderId && entry.tenderId === boq.tenderId) ||
          (boq.projectId && entry.projectId === boq.projectId),
      )
    }

    const resolvedId = targetIndex >= 0 ? entries[targetIndex].id : (boq.id ?? this.generateId())
    const items = this.normalizeItems(boq.items)
    const record: BOQData = {
      ...boq,
      id: resolvedId,
      items,
      totalValue: this.normalizeTotal(boq.totalValue, items),
      totals: this.cloneTotals(boq.totals ?? undefined),
      lastUpdated: new Date().toISOString(),
    } as BOQData

    if (targetIndex >= 0) {
      entries[targetIndex] = record
    } else {
      entries.push(record)
    }

    await this.saveAll(entries)
    return record
  }

  /**
   * Delete a BOQ entry
   */
  async delete(id: string): Promise<boolean> {
    const entries = await this.getAll()
    const nextEntries = entries.filter((entry) => entry.id !== id)

    if (nextEntries.length === entries.length) {
      return false
    }

    await this.saveAll(nextEntries)
    return true
  }

  /**
   * Delete BOQ by tender ID
   */
  async deleteByTenderId(tenderId: string): Promise<boolean> {
    const entries = await this.getAll()
    const nextEntries = entries.filter((entry) => entry.tenderId !== tenderId)

    if (nextEntries.length === entries.length) {
      return false
    }

    await this.saveAll(nextEntries)
    return true
  }

  /**
   * Delete BOQ by project ID
   */
  async deleteByProjectId(projectId: string): Promise<boolean> {
    const entries = await this.getAll()
    const nextEntries = entries.filter((entry) => entry.projectId !== projectId)

    if (nextEntries.length === entries.length) {
      return false
    }

    await this.saveAll(nextEntries)
    return true
  }

  /**
   * Check if BOQ exists
   */
  async exists(id: string): Promise<boolean> {
    const entry = await this.getById(id)
    return entry !== null
  }

  /**
   * Count total BOQ entries
   */
  async count(): Promise<number> {
    const entries = await this.getAll()
    return entries.length
  }

  /**
   * Clear all BOQ entries
   */
  async clear(): Promise<void> {
    await this.manager.set(STORAGE_KEYS.BOQ_DATA, [])
  }

  /**
   * Import BOQ entries
   */
  async import(entries: BOQData[]): Promise<void> {
    await this.saveAll(entries)
  }

  /**
   * Export all BOQ entries
   */
  async export(): Promise<BOQData[]> {
    return this.getAll()
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateId(): string {
    return `boq_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  private normalizeItems(items: unknown): BOQData['items'] {
    if (!Array.isArray(items)) {
      return []
    }
    return items as BOQData['items']
  }

  private normalizeTotal(total: unknown, items: BOQData['items']): number {
    if (typeof total === 'number' && Number.isFinite(total)) {
      return total
    }
    return items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0)
  }

  private cloneTotals(totals: BOQData['totals'] | undefined): BOQData['totals'] {
    if (!totals) return null
    return { ...totals }
  }
}

// Singleton instance
export const boqStorage = new BOQStorage()
