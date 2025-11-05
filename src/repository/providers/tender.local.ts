import type { Tender } from '@/data/centralData'
import { ConflictError } from '@/domain/errors/ConflictError'

// Pagination types
export interface PaginationOptions {
  page: number
  pageSize: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

// ITenderRepository interface (moved from tender.repository.ts)
export interface ITenderRepository {
  getAll(): Promise<Tender[]>
  getById(id: string): Promise<Tender | null>
  getByProjectId?(projectId: string): Promise<Tender | null>
  getPage(options: PaginationOptions): Promise<PaginatedResult<Tender>>
  create(data: Omit<Tender, 'id'>): Promise<Tender>
  update(
    id: string,
    updates: Partial<Tender>,
    options?: { skipRefresh?: boolean },
  ): Promise<Tender | null>
  delete(id: string): Promise<boolean>
  search(query: string): Promise<Tender[]>
}
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { migrateTenderStatus, needsMigration } from '@/shared/utils/tender/tenderStatusMigration'
import { getRelationRepository } from '@/application/services/serviceRegistry'
import { bus, APP_EVENTS, emit } from '@/events/bus'
import {
  sanitizeTenderCollection,
  validateTender,
  validateTenderPayload,
  validateTenderUpdate,
} from '@/domain/validation'

const allowedStatuses: Tender['status'][] = [
  'new',
  'under_action',
  'ready_to_submit',
  'submitted',
  'won',
  'lost',
  'expired',
  'cancelled',
]

const generateId = () => `tender_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

/**
 * Get current user ID for audit trail
 * Returns 'system' if no auth service available (desktop mode)
 */
const getCurrentUserId = (): string => {
  try {
    // Try to get from auth service if available
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authService = (window as any).authService
      if (authService) {
        const user = authService.getCurrentUser()
        if (user?.id) {
          return user.id
        }
      }
    }
    // Desktop mode fallback
    return 'system'
  } catch {
    return 'system'
  }
}

const isDifferent = (a: Tender, b: Tender): boolean => JSON.stringify(a) !== JSON.stringify(b)

const normalizeTender = (tender: Tender): Tender => {
  let status = tender.status
  if (needsMigration(tender)) {
    status = migrateTenderStatus(status as string)
  }
  if (!allowedStatuses.includes(status)) {
    status = 'new'
  }

  // Normalize quantities field to quantityTable for pricing compatibility
  const normalized = { ...tender, status } as Record<string, unknown>

  // If quantities exists but quantityTable doesn't, copy quantities to quantityTable
  if (Array.isArray(normalized.quantities) && normalized.quantities.length > 0) {
    if (!Array.isArray(normalized.quantityTable) || normalized.quantityTable.length === 0) {
      normalized.quantityTable = normalized.quantities
    }
  }

  // Also ensure quantityItems is populated for backward compatibility
  if (Array.isArray(normalized.quantityTable) && normalized.quantityTable.length > 0) {
    if (!Array.isArray(normalized.quantityItems) || normalized.quantityItems.length === 0) {
      normalized.quantityItems = normalized.quantityTable
    }
  }

  return normalized as unknown as Tender
}

const persist = (tenders: Tender[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, tenders)
}

const loadAll = (): Tender[] => {
  console.log('[LocalTenderRepository] loadAll() - Reading from storage:', STORAGE_KEYS.TENDERS)
  const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
  console.log('[LocalTenderRepository] loadAll() - Raw stored data:', { 
    isArray: Array.isArray(stored),
    count: Array.isArray(stored) ? stored.length : 0,
    type: typeof stored
  })
  
  if (!Array.isArray(stored)) {
    return []
  }

  let shouldPersist = false
  const normalized = stored.map((entry) => {
    const normalizedTender = normalizeTender({ ...entry })
    if (!shouldPersist && isDifferent(entry, normalizedTender)) {
      shouldPersist = true
    }
    return normalizedTender
  })

  const sanitized = sanitizeTenderCollection(normalized)
  console.log('[LocalTenderRepository] loadAll() - After sanitization:', {
    normalizedCount: normalized.length,
    sanitizedCount: sanitized.length,
    shouldPersist
  })

  if (sanitized.length !== normalized.length || hasDifferences(normalized, sanitized)) {
    shouldPersist = true
  }

  if (shouldPersist) {
    persist(sanitized)
  }

  return sanitized
}

const emitTendersUpdated = <T>(detail: T) => {
  bus.emit(APP_EVENTS.TENDERS_UPDATED, detail)
  emit(APP_EVENTS.TENDERS_UPDATED, detail)
}

const emitTenderUpdated = <T>(detail: T) => {
  bus.emit(APP_EVENTS.TENDER_UPDATED, detail)
  emit(APP_EVENTS.TENDER_UPDATED, detail)
}

const hasDifferences = (original: Tender[], sanitized: Tender[]): boolean => {
  if (original.length !== sanitized.length) {
    return true
  }

  for (let index = 0; index < original.length; index += 1) {
    if (JSON.stringify(original[index]) !== JSON.stringify(sanitized[index])) {
      return true
    }
  }

  return false
}

export class LocalTenderRepository implements ITenderRepository {
  async getAll(): Promise<Tender[]> {
    const tenders = loadAll()
    console.log('[LocalTenderRepository] getAll() called, loaded:', {
      count: tenders.length,
      storageKey: STORAGE_KEYS.TENDERS,
      ids: tenders.map(t => t.id).slice(0, 5)
    })
    return tenders
  }

  async getById(id: string): Promise<Tender | null> {
    const tenders = loadAll()
    const tender = tenders.find((entry) => entry.id === id)
    return tender ? { ...tender } : null
  }

  async getByProjectId(projectId: string): Promise<Tender | null> {
    const relationRepository = getRelationRepository()
    const tenderId = relationRepository.getTenderIdByProjectId(projectId)
    if (!tenderId) {
      return null
    }
    return this.getById(tenderId)
  }

  async getPage(options: PaginationOptions): Promise<PaginatedResult<Tender>> {
    let tenders = await this.getAll()

    // Sort tenders if specified
    if (options.sortBy) {
      const sortDir = options.sortDir === 'desc' ? -1 : 1
      tenders = tenders.sort((a: Tender, b: Tender) => {
        const aVal = a[options.sortBy as keyof Tender]
        const bVal = b[options.sortBy as keyof Tender]

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * sortDir
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * sortDir
        }
        return 0
      })
    }

    // Calculate pagination
    const total = tenders.length
    const page = Math.max(1, options.page)
    const pageSize = Math.max(1, options.pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    // Get page items
    const items = tenders.slice(startIndex, endIndex)
    const hasMore = endIndex < total

    return {
      items,
      page,
      pageSize,
      total,
      hasMore,
    }
  }

  async create(data: Omit<Tender, 'id'>): Promise<Tender> {
    const tenders = loadAll()
    const payload = validateTenderPayload(data)

    // ⭐ Phase 5: Initialize version control fields for new tender
    const tender = validateTender(
      normalizeTender({
        ...payload,
        id: generateId(),
        version: 1, // Start with version 1
        lastModified: new Date().toISOString(),
        lastModifiedBy: getCurrentUserId(),
      }),
    )

    tenders.push(tender)
    persist(tenders)
    const detail = { action: 'create' as const, tender }
    emitTendersUpdated(detail)
    return tender
  }

  async update(
    id: string,
    updates: Partial<Tender>,
    options?: { skipRefresh?: boolean },
  ): Promise<Tender | null> {
    const tenders = loadAll()
    const index = tenders.findIndex((entry) => entry.id === id)

    if (index === -1) {
      return null
    }

    const current = tenders[index]

    // ⭐ Phase 5: Optimistic Locking - Check for version conflict
    if (updates.version !== undefined) {
      const currentVersion = current.version ?? 0
      const attemptedVersion = updates.version

      if (currentVersion !== attemptedVersion) {
        // Conflict detected! Throw ConflictError
        throw new ConflictError({
          message:
            'تم تحديث المنافسة من قبل مستخدم آخر. يرجى إعادة تحميل البيانات والمحاولة مرة أخرى.',
          current,
          attempted: { ...current, ...updates } as Tender,
        })
      }
    }

    // Validate and merge updates
    const sanitizedUpdates = validateTenderUpdate({ ...updates, id })

    // ⭐ Phase 5: Increment version and update audit fields
    const nextVersion = (current.version ?? 0) + 1
    const updated = validateTender(
      normalizeTender({
        ...current,
        ...sanitizedUpdates,
        id,
        version: nextVersion,
        lastModified: new Date().toISOString(),
        lastModifiedBy: getCurrentUserId(),
      }),
    )

    tenders[index] = updated
    persist(tenders)
    const detail = {
      action: 'update' as const,
      tenderId: id,
      tender: updated,
      skipRefresh: options?.skipRefresh || false, // ← تمرير skipRefresh flag
    }
    emitTendersUpdated(detail)
    emitTenderUpdated(detail)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const tenders = loadAll()
    const nextTenders = tenders.filter((entry) => entry.id !== id)

    if (nextTenders.length === tenders.length) {
      return false
    }

    persist(nextTenders)
    const relationRepository = getRelationRepository()
    relationRepository.unlinkTender(id)
    const detail = { action: 'delete' as const, tenderId: id }
    emitTendersUpdated(detail)
    return true
  }

  async search(query: string): Promise<Tender[]> {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      return this.getAll()
    }

    const lowercaseQuery = trimmed.toLowerCase()
    const tenders = await this.getAll()

    const matches = (value?: string) => (value ?? '').toLowerCase().includes(lowercaseQuery)

    return tenders.filter(
      (tender) => matches(tender.name) || matches(tender.client) || matches(tender.title),
    )
  }
}

export const tenderRepository = new LocalTenderRepository()
