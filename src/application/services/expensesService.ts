/**
 * Centralized Expenses Service
 * - Uses unified storage keys and safeLocalStorage
 * - Emits 'expenses-updated' event on change
 * - Provides simple CRUD helpers used by hooks/components
 */

import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import type { Expense } from '@/data/expenseCategories'
import { APP_EVENTS, emit } from '@/events/bus'

type LegacyStorage = Pick<Storage, 'getItem' | 'removeItem'>

const resolveLegacyStorage = (): LegacyStorage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }

  const globalReference = globalThis as { localStorage?: unknown }
  const candidate = globalReference.localStorage

  if (typeof candidate !== 'object' || candidate === null) {
    return null
  }

  if ('getItem' in candidate && typeof (candidate as Storage).getItem === 'function') {
    return candidate as Storage
  }

  return null
}

class ExpensesService {
  // علم مركزي لتعطيل الهجرة القديمة (يمكن تفعيله مؤقتاً إن لزم)
  private static ENABLE_LEGACY_EXPENSES_MIGRATION = false
  private static legacyMigrationDone = false

  /**
   * محاولة هجرة قديمة (مرة واحدة فقط إذا كان العلم مفعلاً)
   * تعيد عدد العناصر المضافة أثناء الدمج.
   */
  tryMigrateOnce(legacyKey = 'construction_system_expenses'): number {
    if (!ExpensesService.ENABLE_LEGACY_EXPENSES_MIGRATION) return 0
    if (ExpensesService.legacyMigrationDone) return 0
    const added = this.migrateFromLegacy(legacyKey)
    ExpensesService.legacyMigrationDone = true
    if (added > 0) {
      if (typeof console !== 'undefined' && typeof console.info === 'function') {
        console.info(`[legacy-migration] expenses migrated once: +${added}`)
      }
    }
    return added
  }

  private emitUpdated() {
    emit(APP_EVENTS.EXPENSES_UPDATED)
  }

  getAll<T extends Expense = Expense>(): T[] {
    return safeLocalStorage.getItem<T[]>(STORAGE_KEYS.EXPENSES, [])
  }

  setAll(expenses: Expense[]): void {
    safeLocalStorage.setItem(STORAGE_KEYS.EXPENSES, expenses)
    this.emitUpdated()
  }

  add(expense: Expense): Expense {
    const all = this.getAll()
    all.push(expense)
    this.setAll(all)
    return expense
  }

  update(id: string, updated: Expense): Expense | null {
    const all = this.getAll()
    const idx = all.findIndex((e) => e.id === id)
    if (idx === -1) return null
    all[idx] = updated
    this.setAll(all)
    return updated
  }

  delete(id: string): boolean {
    const all = this.getAll()
    const next = all.filter((e) => e.id !== id)
    const changed = next.length !== all.length
    if (changed) this.setAll(next)
    return changed
  }

  getByProject(projectId: string): Expense[] {
    const all = this.getAll()
    return all.filter((e) => e.projectId === projectId)
  }

  migrateFromLegacy(legacyKey = 'construction_system_expenses'): number {
    try {
      const storage = resolveLegacyStorage()
      const raw = storage?.getItem(legacyKey) ?? null
      if (!raw) return 0
      const legacy: Expense[] = JSON.parse(raw || '[]')
      const current = this.getAll()
      if (legacy.length === 0) return 0

      // merge by id, prefer current if duplicate
      const map = new Map<string, Expense>()
      for (const e of legacy) map.set(e.id, e)
      for (const e of current) map.set(e.id, e)
      const merged = Array.from(map.values())
      this.setAll(merged)
      try {
        storage?.removeItem?.(legacyKey)
      } catch (error) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[legacy-migration] Failed to remove legacy key', { legacyKey, error })
        }
      }
      return merged.length - current.length
    } catch {
      return 0
    }
  }
}

export const expensesService = new ExpensesService()
export default expensesService
