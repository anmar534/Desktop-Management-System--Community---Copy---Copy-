import { STORAGE_KEYS, type StorageKey } from '@/shared/constants/storageKeys'

export type SchemaVersion = number

export interface MigrationContext {
  key: StorageKey | string
  fromVersion: SchemaVersion
  targetVersion: SchemaVersion
}

export type MigrationFn<T = unknown> = (value: unknown, context: MigrationContext) => T

export interface StorageSchemaEntry<T = unknown> {
  version: SchemaVersion
  migrate?: MigrationFn<T>
  sanitize?: (value: T) => T
}

export interface PersistedEnvelope<T = unknown> {
  __meta: {
    schemaVersion: SchemaVersion
    storedAt: string
  }
  data: T
}

type SchemaMap = Partial<Record<StorageKey, StorageSchemaEntry>>

const DEFAULT_SCHEMA_VERSION: SchemaVersion = 1
const DEFAULT_SCHEMA_ENTRY: StorageSchemaEntry = { version: DEFAULT_SCHEMA_VERSION }

const canStructuredClone = typeof globalThis.structuredClone === 'function'

export const cloneValue = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (canStructuredClone) {
    return structuredClone(value)
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

const safeStringify = (value: unknown): string => {
  if (value === undefined) return '__undefined__'
  if (typeof value === 'function') return '__function__'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
    if (
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'y' ||
      normalized === 'on' ||
      normalized === 'enabled'
    ) {
      return true
    }
    if (
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'n' ||
      normalized === 'off' ||
      normalized === 'disabled'
    ) {
      return false
    }
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return fallback
    return value !== 0
  }
  return fallback
}

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

const MAX_AUDIT_LOG_ENTRIES = 500

const sanitizeMetadata = (value: unknown): Record<string, string> | undefined => {
  if (!isPlainObject(value)) {
    return undefined
  }

  const sanitized: Record<string, string> = {}

  for (const [key, candidate] of Object.entries(value)) {
    if (typeof key !== 'string' || key.trim() === '') {
      continue
    }

    if (candidate === null || candidate === undefined) {
      continue
    }

    if (typeof candidate === 'string') {
      sanitized[key] = candidate
      continue
    }

    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
      sanitized[key] = String(candidate)
      continue
    }

    try {
      sanitized[key] = JSON.stringify(candidate)
    } catch {
      sanitized[key] = String(candidate)
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

const normalizeAuditLog = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return []
  }

  const entries = value
    .filter(isPlainObject)
    .map((item, index) => {
      const record = item as Record<string, unknown>
      const fallbackId = `legacy-${index}-${Date.now()}`
      const rawTimestamp =
        typeof record.timestamp === 'string' && record.timestamp.trim() !== ''
          ? record.timestamp
          : null
      const timestamp = rawTimestamp ?? new Date().toISOString()

      const sanitized: Record<string, unknown> = {
        id: typeof record.id === 'string' && record.id.trim() !== '' ? record.id : fallbackId,
        timestamp,
        category:
          typeof record.category === 'string' && record.category.trim() !== ''
            ? record.category
            : 'storage',
        action:
          typeof record.action === 'string' && record.action.trim() !== ''
            ? record.action
            : 'unknown',
        key: typeof record.key === 'string' ? record.key : 'unknown',
        actor:
          typeof record.actor === 'string' && record.actor.trim() !== '' ? record.actor : 'system',
        level:
          typeof record.level === 'string' && record.level.trim() !== '' ? record.level : 'info',
        origin:
          typeof record.origin === 'string' && record.origin.trim() !== ''
            ? record.origin
            : 'renderer',
        status:
          typeof record.status === 'string' && record.status.trim() !== ''
            ? record.status
            : 'success',
      }

      const metadata = sanitizeMetadata(record.metadata)
      if (metadata) {
        sanitized.metadata = metadata
      }

      return sanitized
    })
    .filter(isPlainObject)
    .sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? Date.parse(a.timestamp) : 0
      const timeB = typeof b.timestamp === 'string' ? Date.parse(b.timestamp) : 0
      return timeA - timeB
    })

  if (entries.length > MAX_AUDIT_LOG_ENTRIES) {
    return entries.slice(entries.length - MAX_AUDIT_LOG_ENTRIES)
  }

  return entries
}

const normalizeProjects = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((item) => {
    const record = { ...item } as Record<string, unknown>

    const contractValue = toNumber(record.contractValue ?? record.value ?? record.budget, 0)
    const estimatedCost = toNumber(
      record.estimatedCost ?? record.budget ?? contractValue,
      contractValue,
    )
    const spent = toNumber(record.spent ?? 0, 0)
    const actualCost = toNumber(record.actualCost ?? spent, spent)
    const remaining = toNumber(record.remaining ?? contractValue - spent, contractValue - spent)
    const expectedProfit = toNumber(
      record.expectedProfit ?? contractValue - estimatedCost,
      contractValue - estimatedCost,
    )
    const progress = clamp(toNumber(record.progress ?? 0, 0), 0, 100)
    const efficiency = clamp(toNumber(record.efficiency ?? progress, progress), 0, 100)

    const normalized: Record<string, unknown> = {
      ...record,
      contractValue,
      budget: toNumber(record.budget ?? contractValue, contractValue),
      value: contractValue,
      estimatedCost,
      actualCost,
      spent,
      remaining,
      expectedProfit,
      progress,
      efficiency,
    }

    if (record.actualProfit !== undefined && record.actualProfit !== null) {
      normalized.actualProfit = toNumber(record.actualProfit, expectedProfit)
    } else {
      delete normalized.actualProfit
    }

    return normalized
  })
}

const normalizeTenders = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((item) => {
    const record = { ...item } as Record<string, unknown>

    const baseValue = toNumber(record.value ?? record.totalValue ?? 0, 0)
    const totalValue = toNumber(record.totalValue ?? baseValue, baseValue)
    const pricedItems = toNumber(record.pricedItems ?? record.itemsPriced ?? 0, 0)
    const totalItems =
      record.totalItems !== undefined
        ? Math.max(0, Math.round(toNumber(record.totalItems, 0)))
        : undefined
    const progress = clamp(toNumber(record.progress ?? 0, 0), 0, 100)
    const completion =
      record.completionPercentage !== undefined
        ? clamp(toNumber(record.completionPercentage, progress), 0, 100)
        : undefined
    const winChance = clamp(toNumber(record.winChance ?? 0, 0), 0, 100)
    const daysLeft = Math.max(0, Math.round(toNumber(record.daysLeft ?? 0, 0)))

    const documentPrice = toNullableNumber(record.documentPrice)
    const bookletPrice = toNullableNumber(record.bookletPrice)

    const normalized: Record<string, unknown> = {
      ...record,
      value: baseValue,
      totalValue,
      pricedItems,
      itemsPriced: pricedItems,
      progress,
      winChance,
      daysLeft,
    }

    if (totalItems !== undefined) {
      normalized.totalItems = totalItems
    }

    if (completion !== undefined) {
      normalized.completionPercentage = completion
    }

    normalized.documentPrice = documentPrice
    normalized.bookletPrice = bookletPrice

    return normalized
  })
}

const normalizeClients = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((item) => {
    const record = { ...item } as Record<string, unknown>

    const projects = Math.max(0, Math.round(toNumber(record.projects ?? 0, 0)))
    const totalValue = toNumber(record.totalValue ?? 0, 0)
    const completedProjects = Math.max(0, Math.round(toNumber(record.completedProjects ?? 0, 0)))
    const outstanding =
      record.outstandingPayments !== undefined && record.outstandingPayments !== null
        ? toNumber(record.outstandingPayments, 0)
        : undefined

    const normalized: Record<string, unknown> = {
      ...record,
      projects,
      totalValue,
      completedProjects,
    }

    if (outstanding !== undefined) {
      normalized.outstandingPayments = outstanding
    } else {
      delete normalized.outstandingPayments
    }

    return normalized
  })
}

const normalizeBankAccounts = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isPlainObject).map((item) => {
    const record = { ...item } as Record<string, unknown>

    const normalized: Record<string, unknown> = {
      ...record,
      currentBalance: toNumber(record.currentBalance ?? 0, 0),
      monthlyInflow: toNumber(record.monthlyInflow ?? 0, 0),
      monthlyOutflow: toNumber(record.monthlyOutflow ?? 0, 0),
      isActive: toBoolean(record.isActive, true),
      accountName: typeof record.accountName === 'string' ? record.accountName : '',
      bankName: typeof record.bankName === 'string' ? record.bankName : '',
      accountNumber: typeof record.accountNumber === 'string' ? record.accountNumber : '',
      iban: typeof record.iban === 'string' ? record.iban : '',
      accountType: typeof record.accountType === 'string' ? record.accountType : 'current',
      currency: typeof record.currency === 'string' ? record.currency : 'SAR',
    }

    if (typeof record.lastTransactionDate !== 'string') {
      delete normalized.lastTransactionDate
    }

    return normalized
  })
}

const normalizePricingStore = (value: unknown): unknown => {
  if (!isPlainObject(value)) {
    return {}
  }

  const normalized: Record<string, unknown> = {}

  for (const [entryKey, rawPayload] of Object.entries(value)) {
    if (!isPlainObject(rawPayload)) continue

    const payload = { ...rawPayload } as Record<string, unknown>

    payload.pricing = Array.isArray(rawPayload.pricing)
      ? rawPayload.pricing.filter(
          (entry): entry is [string, unknown] =>
            Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string',
        )
      : []

    if (isPlainObject(rawPayload.defaultPercentages)) {
      const defaults = rawPayload.defaultPercentages as Record<string, unknown>
      payload.defaultPercentages = {
        administrative: toNumber(defaults.administrative ?? 0, 0),
        operational: toNumber(defaults.operational ?? 0, 0),
        profit: toNumber(defaults.profit ?? 0, 0),
      }
    } else {
      delete payload.defaultPercentages
    }

    payload.lastUpdated =
      typeof rawPayload.lastUpdated === 'string' && rawPayload.lastUpdated.trim() !== ''
        ? rawPayload.lastUpdated
        : new Date().toISOString()

    payload.version = typeof rawPayload.version === 'number' ? rawPayload.version : 1

    normalized[entryKey] = payload
  }

  return normalized
}

const createEntry = (
  version: SchemaVersion,
  normalize: (value: unknown) => unknown,
): StorageSchemaEntry<unknown> => ({
  version,
  migrate: (value) => normalize(value),
  sanitize: (value) => normalize(value),
})

const STORAGE_SCHEMA: SchemaMap = {
  [STORAGE_KEYS.PROJECTS]: createEntry(2, normalizeProjects),
  [STORAGE_KEYS.TENDERS]: createEntry(2, normalizeTenders),
  [STORAGE_KEYS.CLIENTS]: createEntry(2, normalizeClients),
  [STORAGE_KEYS.BANK_ACCOUNTS]: createEntry(2, normalizeBankAccounts),
  [STORAGE_KEYS.PRICING_DATA]: createEntry(2, normalizePricingStore),
  [STORAGE_KEYS.SECURITY_AUDIT_LOG]: createEntry(1, normalizeAuditLog),
  [STORAGE_KEYS.DEVELOPMENT_GOALS]: createEntry(1, (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value.filter(isPlainObject).map((item) => {
      const record = { ...(item as Record<string, unknown>) }
      const title = typeof record.title === 'string' ? record.title : ''
      const category = typeof record.category === 'string' ? record.category : 'tenders'
      const type = record.type === 'monthly' || record.type === 'yearly' ? record.type : 'yearly'
      const unit =
        record.unit === 'currency' || record.unit === 'percentage' || record.unit === 'number'
          ? record.unit
          : 'number'
      const currentValue = toNumber(record.currentValue ?? 0, 0)
      const targetValue2025 = toNumber(record.targetValue2025 ?? 0, 0)
      const targetValue2026 = toNumber(record.targetValue2026 ?? 0, 0)
      const targetValue2027 = toNumber(record.targetValue2027 ?? 0, 0)
      const id =
        typeof record.id === 'string' && record.id.trim() !== ''
          ? record.id
          : `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      const description = typeof record.description === 'string' ? record.description : undefined
      return {
        id,
        title,
        category,
        type,
        unit,
        currentValue,
        targetValue2025,
        targetValue2026,
        targetValue2027,
        ...(description ? { description } : {}),
      }
    })
  }),
}

export const getSchemaEntry = (key: string): StorageSchemaEntry => {
  return STORAGE_SCHEMA[key as StorageKey] ?? DEFAULT_SCHEMA_ENTRY
}

export const isPersistedEnvelope = (value: unknown): value is PersistedEnvelope => {
  if (!isPlainObject(value)) {
    return false
  }
  const meta = value.__meta
  if (!isPlainObject(meta)) {
    return false
  }
  return (
    typeof meta.schemaVersion === 'number' && Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

export const getSchemaVersionForKey = (key: string): SchemaVersion => getSchemaEntry(key).version

const sanitizeCandidate = (
  schema: StorageSchemaEntry,
  candidate: unknown,
): { sanitized: unknown; changed: boolean } => {
  if (!schema.sanitize) {
    return { sanitized: cloneValue(candidate), changed: false }
  }

  const processed = schema.sanitize(cloneValue(candidate))
  const sanitized = processed ?? cloneValue(candidate)
  const changed = safeStringify(sanitized) !== safeStringify(candidate)
  return { sanitized: cloneValue(sanitized), changed }
}

export interface DecodedValue<T = unknown> {
  value: T | undefined
  shouldPersist: boolean
}

export const decodeStoredValue = <T>(key: string, stored: unknown): DecodedValue<T> => {
  const schema = getSchemaEntry(key)
  const targetVersion = schema.version

  if (stored === undefined) {
    return { value: undefined, shouldPersist: false }
  }

  if (isPersistedEnvelope(stored)) {
    const storedVersion =
      typeof stored.__meta.schemaVersion === 'number' ? stored.__meta.schemaVersion : 0
    const migrated =
      schema.migrate && storedVersion < targetVersion
        ? schema.migrate(cloneValue(stored.data), {
            key,
            fromVersion: storedVersion,
            targetVersion,
          })
        : cloneValue(stored.data)

    const { sanitized, changed } = sanitizeCandidate(schema, migrated)
    const shouldPersist = changed || storedVersion !== targetVersion

    return {
      value: sanitized as T,
      shouldPersist,
    }
  }

  const migrated = schema.migrate
    ? schema.migrate(cloneValue(stored), { key, fromVersion: 0, targetVersion })
    : cloneValue(stored)

  const { sanitized } = sanitizeCandidate(schema, migrated)

  return {
    value: sanitized as T,
    shouldPersist: true,
  }
}

export const encodeValueForStorage = <T>(
  key: string,
  value: T,
): { envelope: PersistedEnvelope<T>; value: T } => {
  const schema = getSchemaEntry(key)
  const { sanitized } = sanitizeCandidate(schema, value)

  const normalized = sanitized as T
  const envelope: PersistedEnvelope<T> = {
    __meta: {
      schemaVersion: schema.version,
      storedAt: new Date().toISOString(),
    },
    data: cloneValue(normalized),
  }

  return {
    envelope,
    value: cloneValue(normalized),
  }
}
