/**
 * Core Storage Types & Interfaces
 *
 * @module storage/core/types
 * @description Shared types and interfaces for the storage system
 */

/**
 * Storage event types
 */
export type StorageEventType = 'set' | 'get' | 'remove' | 'clear' | 'migrate' | 'upgrade' | 'error'

/**
 * Storage event listener
 */
export type StorageEventListener = (event: StorageEvent) => void

/**
 * Storage event
 */
export interface StorageEvent {
  type: StorageEventType
  key?: string
  value?: unknown
  timestamp: number
  success: boolean
  error?: Error
  metadata?: Record<string, unknown>
}

/**
 * Storage adapter capabilities
 */
export interface StorageCapabilities {
  /** Supports synchronous operations */
  supportsSync: boolean
  /** Supports encryption */
  supportsEncryption: boolean
  /** Supports compression */
  supportsCompression: boolean
  /** Supports migrations */
  supportsMigrations: boolean
  /** Supports transactions */
  supportsTransactions: boolean
}

/**
 * Schema version envelope
 */
export interface SchemaEnvelope<T = unknown> {
  __meta: {
    schemaVersion: number
    createdAt: number
    updatedAt: number
  }
  data: T
}

/**
 * Decoded schema result
 */
export interface DecodedSchema<T = unknown> {
  value: T
  shouldUpgrade: boolean
  currentVersion: number
  targetVersion: number
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Enable caching */
  enableCache?: boolean
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** Enable audit logging */
  enableAudit?: boolean
  /** Enable security layer */
  enableSecurity?: boolean
  /** Enable schema versioning */
  enableSchema?: boolean
  /** Default schema version */
  defaultSchemaVersion?: number
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total keys stored */
  totalKeys: number
  /** Total size in bytes (approximate) */
  totalSize: number
  /** Cache hit rate (0-1) */
  cacheHitRate: number
  /** Number of operations */
  operationCount: number
  /** Number of errors */
  errorCount: number
}

/**
 * Migration definition
 */
export interface Migration {
  /** Migration version number */
  version: number
  /** Migration name/description */
  name: string
  /** Migration function */
  up: (data: unknown) => unknown | Promise<unknown>
  /** Rollback function (optional) */
  down?: (data: unknown) => unknown | Promise<unknown>
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Entry ID */
  id: string
  /** Storage key */
  key: string
  /** Operation type */
  operation: StorageEventType
  /** Operation status */
  status: 'success' | 'failure'
  /** Timestamp */
  timestamp: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
  /** Error details (if failed) */
  error?: string
}

/**
 * Cache entry
 */
export interface CacheEntry<T = unknown> {
  /** Cached value */
  value: T
  /** Entry creation timestamp */
  createdAt: number
  /** Entry last access timestamp */
  lastAccessedAt: number
  /** Number of hits */
  hits: number
}

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
  /** Adapter name */
  readonly name: string

  /** Adapter capabilities */
  readonly capabilities: StorageCapabilities

  /** Check if adapter is available in current environment */
  isAvailable(): boolean

  /** Initialize the adapter */
  initialize?(): Promise<void>

  /** Set a value */
  set(key: string, value: unknown): Promise<void>

  /** Get a value */
  get<T>(key: string, defaultValue: T): Promise<T>

  /** Remove a value */
  remove(key: string): Promise<void>

  /** Clear all values */
  clear(): Promise<void>

  /** Check if key exists */
  has(key: string): Promise<boolean>

  /** Get all keys */
  keys(): Promise<string[]>

  /** Synchronous set (if supported) */
  setSync?(key: string, value: unknown): boolean

  /** Synchronous get (if supported) */
  getSync?<T>(key: string, defaultValue: T): T

  /** Close/cleanup adapter resources */
  close?(): Promise<void>
}

/**
 * Storage layer interface
 */
export interface IStorageLayer {
  /** Layer name */
  readonly name: string

  /** Process before set operation */
  beforeSet?(key: string, value: unknown): Promise<unknown>

  /** Process after set operation */
  afterSet?(key: string, value: unknown): Promise<void>

  /** Process before get operation */
  beforeGet?(key: string): Promise<void>

  /** Process after get operation */
  afterGet?<T>(key: string, value: T): Promise<T>

  /** Process before remove operation */
  beforeRemove?(key: string): Promise<void>

  /** Process after remove operation */
  afterRemove?(key: string): Promise<void>
}

/**
 * Storage module interface
 */
export interface IStorageModule {
  /** Module name */
  readonly name: string

  /** Module storage keys */
  readonly keys: readonly string[]

  /** Initialize module */
  initialize?(): Promise<void>

  /** Cleanup module resources */
  cleanup?(): Promise<void>
}
