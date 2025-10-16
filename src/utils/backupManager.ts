import { loadFromStorage, removeFromStorage } from './storage'
import { recordAuditEvent } from './auditLog'
import { SystemEvents } from './eventManager'
import { cloneValue } from './storageSchema'
import type { TenderBackupEntry } from '@/types/pricing'
import { backupStorage } from '@/storage/modules/BackupStorage'

const BACKUP_STORE_VERSION = '1.0.0'
const MS_PER_DAY = 86_400_000

export type BackupDataset = 'tender-pricing'
export type RetentionKey = BackupDataset

export interface RetentionRule {
  maxEntries: number
  maxAgeDays?: number
}

export const RETENTION_MATRIX: Record<RetentionKey, RetentionRule> = {
  'tender-pricing': {
    maxEntries: 10,
    maxAgeDays: 30,
  },
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

interface TenderBackupRecord extends TenderBackupEntry {
  dataset: BackupDataset
  payload: TenderPricingBackupPayload
}

interface BackupFailureState {
  count: number
  lastFailureAt: string
  lastError?: string
}

interface BackupStore {
  version: string
  updatedAt: string
  tenders: Record<string, TenderBackupRecord[]>
  failureCounters: Record<string, BackupFailureState>
}

// Legacy types moved to BackupStorage module

interface ApplyRetentionResult {
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

export interface CreateBackupOptions {
  actor?: string
  origin?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

// Moved to BackupStorage module
// const isBackupStore = ...
// const isLegacyIndex = ...

const ensureIsoTimestamp = (candidate: string | undefined): string => {
  if (typeof candidate === 'string') {
    const parsed = Date.parse(candidate)
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString()
    }
  }
  return new Date().toISOString()
}

const generateId = (): string => {
  const cryptoCandidate = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (typeof cryptoCandidate?.randomUUID === 'function') {
    return cryptoCandidate.randomUUID()
  }
  return `backup-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const computeRetentionExpiry = (timestamp: string, rule: RetentionRule): string | undefined => {
  if (typeof rule.maxAgeDays !== 'number') {
    return undefined
  }
  const basis = Date.parse(timestamp)
  if (Number.isNaN(basis)) {
    return undefined
  }
  return new Date(basis + rule.maxAgeDays * MS_PER_DAY).toISOString()
}

const hasCompletedFlag = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.completed === 'boolean') {
    return value.completed
  }

  const totals = value as Record<string, unknown>
  if (typeof totals.totalValue === 'number' && totals.totalValue > 0) {
    return true
  }

  return false
}

const sumPricingTotals = (pricing: [string, unknown][]): number => {
  return pricing.reduce((sum, [, item]) => {
    if (!isRecord(item)) {
      return sum
    }

    const total = item.totalValue
    if (typeof total === 'number' && Number.isFinite(total)) {
      return sum + total
    }

    const breakdown = item.breakdown
    if (isRecord(breakdown)) {
      const subtotal = breakdown.total ?? breakdown.subtotal
      if (typeof subtotal === 'number' && Number.isFinite(subtotal)) {
        return sum + subtotal
      }
    }

    return sum
  }, 0)
}

// Moved to BackupStorage module
// const createEmptyStore = ...

// Moved to BackupStorage module
// const normalizeStore = ...

const legacyBackupKey = (tenderId: string, entryId: number | string): string =>
  `backup-tender-pricing-${tenderId}-${entryId}`

// Legacy migration moved to BackupStorage module
// const migrateLegacyIndex = ...

const loadStore = async (): Promise<BackupStore> => {
  return backupStorage.loadTenderBackupStore()
}

const applyRetention = (
  records: TenderBackupRecord[],
  rule: RetentionRule,
): ApplyRetentionResult => {
  const sorted = records.slice().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))

  const now = Date.now()
  const maxAgeMs = typeof rule.maxAgeDays === 'number' ? rule.maxAgeDays * MS_PER_DAY : null
  const kept: TenderBackupRecord[] = []
  const pruned: TenderBackupRecord[] = []

  for (const record of sorted) {
    const age = now - Date.parse(record.timestamp)
    const expired = maxAgeMs !== null && age > maxAgeMs
    if (kept.length >= rule.maxEntries || expired) {
      pruned.push(record)
      continue
    }
    kept.push({
      ...record,
      retentionExpiresAt: computeRetentionExpiry(record.timestamp, rule),
    })
  }

  return {
    kept,
    pruned,
  }
}

const saveStore = async (store: BackupStore): Promise<void> => {
  await backupStorage.saveTenderBackupStore(store)
}

const toSummary = (record: TenderBackupRecord): TenderBackupEntry => ({
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
})

const resetFailureCounter = (store: BackupStore, tenderId: string): void => {
  if (store.failureCounters[tenderId]) {
    delete store.failureCounters[tenderId]
    void backupStorage.resetFailureCounter(tenderId)
  }
}

const registerFailure = async (tenderId: string, error: string): Promise<BackupFailureState> => {
  try {
    const store = await loadStore()
    const state = store.failureCounters[tenderId] ?? {
      count: 0,
      lastFailureAt: new Date().toISOString(),
    }

    state.count += 1
    state.lastFailureAt = new Date().toISOString()
    state.lastError = error

    store.failureCounters[tenderId] = state
    await saveStore(store)
    return state
  } catch {
    return {
      count: 1,
      lastFailureAt: new Date().toISOString(),
      lastError: error,
    }
  }
}

const cleanupLegacySnapshot = async (tenderId: string, entryId: string): Promise<void> => {
  const numericId = Number(entryId)
  if (!Number.isFinite(numericId)) {
    return
  }
  const key = legacyBackupKey(tenderId, numericId)
  await removeFromStorage(key).catch(() => {
    /* noop */
  })
}

export const createTenderPricingBackup = async (
  payload: TenderPricingBackupPayload,
  options?: CreateBackupOptions,
): Promise<TenderBackupEntry> => {
  const store = await loadStore()
  const retention = RETENTION_MATRIX['tender-pricing']

  const itemsTotal = Array.isArray(payload.quantityItems) ? payload.quantityItems.length : 0
  const itemsPriced = payload.pricing.reduce(
    (count, [, item]) => count + (hasCompletedFlag(item) ? 1 : 0),
    0,
  )

  const timestamp = ensureIsoTimestamp(payload.timestamp)
  const record: TenderBackupRecord = {
    id: generateId(),
    dataset: 'tender-pricing',
    retentionKey: 'tender-pricing',
    timestamp,
    tenderId: payload.tenderId,
    tenderTitle: payload.tenderTitle,
    completionPercentage:
      typeof payload.completionPercentage === 'number'
        ? payload.completionPercentage
        : itemsTotal > 0
          ? Number(((itemsPriced / itemsTotal) * 100).toFixed(2))
          : 0,
    totalValue:
      typeof payload.totalValue === 'number' && Number.isFinite(payload.totalValue)
        ? payload.totalValue
        : sumPricingTotals(payload.pricing),
    itemsTotal,
    itemsPriced,
    version: payload.version ?? 'unknown',
    retentionExpiresAt: computeRetentionExpiry(timestamp, retention),
    payload: {
      ...cloneValue(payload),
      timestamp,
    },
  }

  const existing = store.tenders[payload.tenderId] ?? []
  const { kept, pruned } = applyRetention([...existing, record], retention)
  store.tenders[payload.tenderId] = kept
  resetFailureCounter(store, payload.tenderId)

  await saveStore(store)

  if (pruned.length > 0) {
    await recordAuditEvent({
      category: 'backup',
      action: 'retention-prune',
      key: payload.tenderId,
      origin: options?.origin ?? 'backup-manager',
      actor: options?.actor ?? 'system',
      metadata: {
        dataset: 'tender-pricing',
        pruned: pruned.length,
        retained: kept.length,
      },
    }).catch(() => {
      /* noop */
    })

    SystemEvents.emitBackupRetentionApplied({
      dataset: 'tender-pricing',
      tenderId: payload.tenderId,
      pruned: pruned.length,
      retained: kept.length,
    })

    for (const entry of pruned) {
      await cleanupLegacySnapshot(payload.tenderId, entry.id)
    }
  }

  await recordAuditEvent({
    category: 'backup',
    action: 'create',
    key: payload.tenderId,
    origin: options?.origin ?? 'backup-manager',
    actor: options?.actor ?? 'system',
    metadata: {
      dataset: 'tender-pricing',
      backupId: record.id,
      retained: kept.length,
      pruned: pruned.length,
    },
  }).catch(() => {
    /* noop */
  })

  SystemEvents.emitBackupCompleted({
    dataset: 'tender-pricing',
    tenderId: payload.tenderId,
    backupId: record.id,
    retained: kept.length,
    pruned: pruned.length,
  })

  return toSummary(record)
}

export const listTenderBackupEntries = async (tenderId: string): Promise<TenderBackupEntry[]> => {
  const store = await loadStore()
  const records = store.tenders[tenderId] ?? []
  return records
    .slice()
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .map((record) => toSummary(record))
}

export const restoreTenderBackup = async (
  tenderId: string,
  backupId: string,
  options?: CreateBackupOptions,
): Promise<TenderPricingBackupPayload | null> => {
  const store = await loadStore()
  const record = (store.tenders[tenderId] ?? []).find((entry) => entry.id === backupId)

  if (record) {
    await recordAuditEvent({
      category: 'backup',
      action: 'restore',
      key: tenderId,
      origin: options?.origin ?? 'backup-manager',
      actor: options?.actor ?? 'system',
      metadata: {
        dataset: 'tender-pricing',
        backupId,
      },
    }).catch(() => {
      /* noop */
    })

    SystemEvents.emitBackupCompleted({
      dataset: 'tender-pricing',
      tenderId,
      backupId,
      retained: (store.tenders[tenderId] ?? []).length,
      pruned: 0,
    })

    return cloneValue(record.payload)
  }

  // Legacy fallback
  const legacyId = Number(backupId)
  if (Number.isFinite(legacyId)) {
    const legacyPayload = await loadFromStorage<TenderPricingBackupPayload | null>(
      legacyBackupKey(tenderId, legacyId),
      null,
    )
    if (legacyPayload) {
      return cloneValue(legacyPayload)
    }
  }

  await recordAuditEvent({
    category: 'backup',
    action: 'restore',
    key: tenderId,
    status: 'error',
    level: 'error',
    origin: options?.origin ?? 'backup-manager',
    actor: options?.actor ?? 'system',
    metadata: {
      dataset: 'tender-pricing',
      backupId,
      reason: 'not-found',
    },
  }).catch(() => {
    /* noop */
  })

  SystemEvents.emitBackupFailed({
    dataset: 'tender-pricing',
    tenderId,
    backupId,
    consecutiveFailures: 1,
    error: 'backup-not-found',
  })

  return null
}

export const getBackupHealth = async (): Promise<Record<string, BackupFailureState>> => {
  const store = await loadStore()
  return cloneValue(store.failureCounters)
}

export const getBackupExportSnapshot = async (): Promise<BackupExportSnapshot> => {
  const store = await loadStore()
  const tenders: BackupExportSnapshot['tenders'] = {}

  for (const [tenderId, records] of Object.entries(store.tenders)) {
    tenders[tenderId] = records
      .slice()
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .map((record) => ({
        summary: toSummary(record),
        payload: cloneValue(record.payload),
      }))
  }

  const totalEntries = Object.values(tenders).reduce((sum, list) => sum + list.length, 0)

  return {
    version: BACKUP_STORE_VERSION,
    generatedAt: new Date().toISOString(),
    retention: cloneValue(RETENTION_MATRIX),
    totals: {
      tenders: Object.keys(tenders).length,
      entries: totalEntries,
    },
    tenders,
    failures: cloneValue(store.failureCounters),
  }
}

export const getRetentionPolicies = (): Record<RetentionKey, RetentionRule> =>
  cloneValue(RETENTION_MATRIX)

export const noteBackupFailure = async (
  tenderId: string,
  error: string,
  options?: CreateBackupOptions,
): Promise<void> => {
  const state = await registerFailure(tenderId, error)

  await recordAuditEvent({
    category: 'backup',
    action: 'create',
    key: tenderId,
    status: 'error',
    level: 'error',
    origin: options?.origin ?? 'backup-manager',
    actor: options?.actor ?? 'system',
    metadata: {
      dataset: 'tender-pricing',
      consecutiveFailures: state.count,
      reason: error,
    },
  }).catch(() => {
    /* noop */
  })

  SystemEvents.emitBackupFailed({
    dataset: 'tender-pricing',
    tenderId,
    consecutiveFailures: state.count,
    error,
    backupId: undefined,
  })

  if (state.count >= 2) {
    SystemEvents.emitBackupFailureAlert({
      dataset: 'tender-pricing',
      tenderId,
      consecutiveFailures: state.count,
      error,
    })
  }
}
