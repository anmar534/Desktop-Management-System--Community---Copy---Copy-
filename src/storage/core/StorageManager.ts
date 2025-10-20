/**
 * Storage Manager
 *
 * @module storage/core/StorageManager
 * @description Central storage manager - singleton that coordinates all storage operations
 */

import type {
  IStorageAdapter,
  StorageConfig,
  StorageStats,
  StorageEvent,
  StorageEventListener,
} from './types'
import { StorageCache } from './StorageCache'
import { ElectronAdapter } from '../adapters/ElectronAdapter'
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter'

/**
 * Central storage manager
 * Singleton that coordinates between adapters, cache, and layers
 */
export class StorageManager {
  private static instance: StorageManager | null = null

  private cache: StorageCache
  private adapter: IStorageAdapter | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null
  private config: StorageConfig
  private eventListeners = new Map<string, Set<StorageEventListener>>()
  private stats: StorageStats = {
    totalKeys: 0,
    totalSize: 0,
    cacheHitRate: 0,
    operationCount: 0,
    errorCount: 0,
  }
  private static readonly DEPRECATED_KEYS = ['app_pricing_snapshots', 'PRICING_SNAPSHOTS'] as const
  private static readonly DEPRECATED_PREFIXES = ['tender_snapshot_', 'backup-tender-pricing-'] as const

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor(config: StorageConfig = {}) {
    this.config = {
      enableCache: true,
      cacheTTL: 60 * 60 * 1000, // 1 hour
      enableAudit: false,
      enableSecurity: false,
      enableSchema: true,
      defaultSchemaVersion: 1,
      ...config,
    }

    this.cache = new StorageCache({
      ttl: this.config.cacheTTL,
      maxSize: 1000,
    })
  }

  /**
   * Ensure a storage adapter is available by probing known implementations.
   */
  private ensureAdapter(): void {
    if (this.adapter) {
      return
    }

    // During unit tests we expect adapters to be set explicitly to control behavior.
    if (process.env.NODE_ENV === 'test') {
      return
    }

    try {
      const electronAdapter = new ElectronAdapter()
      if (electronAdapter.isAvailable()) {
        this.adapter = electronAdapter
        return
      }
    } catch (error) {
      console.warn('StorageManager: Electron adapter detection failed:', error)
    }

    try {
      const localStorageAdapter = new LocalStorageAdapter()
      if (localStorageAdapter.isAvailable()) {
        this.adapter = localStorageAdapter
      }
    } catch (error) {
      console.warn('StorageManager: LocalStorage adapter detection failed:', error)
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: StorageConfig): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager(config)
    }
    return StorageManager.instance
  }

  /**
   * Reset singleton (for testing only)
   */
  static resetInstance(): void {
    StorageManager.instance = null
  }

  /**
   * Set storage adapter
   * @param adapter Storage adapter to use
   */
  setAdapter(adapter: IStorageAdapter): void {
    if (this.initialized) {
      throw new Error('Cannot change adapter after initialization')
    }
    this.adapter = adapter
  }

  /**
   * Initialize storage manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._initialize()
    await this.initPromise
  }

  /**
   * Internal initialization
   */
  private async _initialize(): Promise<void> {
    this.ensureAdapter()

    if (!this.adapter) {
      throw new Error('No storage adapter set. Call setAdapter() before initialize()')
    }

    try {
      // 1. Initialize adapter
      if (this.adapter.initialize) {
        await this.adapter.initialize()
      }

      // 2. Hydrate cache if enabled
      if (this.config.enableCache) {
        await this.cache.hydrate(this.adapter)
      }

      await this.cleanupDeprecatedKeys()

      // 3. Update stats
      await this.updateStats()

      this.initialized = true
      this.initPromise = null

      // Dispatch ready event
      this.emitEvent({
        type: 'set',
        timestamp: Date.now(),
        success: true,
        metadata: { event: 'initialized' },
      })
    } catch (error) {
      this.initPromise = null
      this.stats.errorCount++
      throw new Error(
        `Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private async cleanupDeprecatedKeys(): Promise<void> {
    if (!this.adapter) {
      return
    }

    const adapter = this.adapter

    const removeKey = async (key: string, reason: string): Promise<void> => {
      try {
        if (!(await adapter.has(key))) {
          return
        }

        if (this.config.enableCache) {
          this.cache.delete(key)
        }

        await adapter.remove(key)
        this.emitEvent({
          type: 'remove',
          key,
          timestamp: Date.now(),
          success: true,
          metadata: { reason },
        })
      } catch (error) {
        console.warn('StorageManager: failed to remove deprecated key', key, error)
        this.emitEvent({
          type: 'error',
          key,
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
          metadata: { reason },
        })
      }
    }

    for (const key of StorageManager.DEPRECATED_KEYS) {
      await removeKey(key, 'cleanup-deprecated-key')
    }

    try {
      const keys = await this.adapter.keys()
      for (const key of keys) {
        if (StorageManager.DEPRECATED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          await removeKey(key, 'cleanup-deprecated-prefix')
        }
      }
    } catch (error) {
      console.warn('StorageManager: failed to enumerate keys for deprecated cleanup', error)
      this.emitEvent({
        type: 'error',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        metadata: { reason: 'cleanup-deprecated-prefix-enumeration' },
      })
    }
  }

  /**
   * Wait for initialization to complete
   */
  async waitForReady(): Promise<void> {
    await this.initialize()
  }

  /**
   * Check if manager is ready
   */
  isReady(): boolean {
    return this.initialized
  }

  /**
   * Set a value
   * @param key Storage key
   * @param value Value to store
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.waitForReady()
    this.stats.operationCount++

    if (!this.adapter) {
      throw new Error('No storage adapter available')
    }

    try {
      // 1. Update cache
      if (this.config.enableCache) {
        this.cache.set(key, value)
      }

      // 2. Set in adapter
      await this.adapter.set(key, value)

      // 3. Emit event
      this.emitEvent({
        type: 'set',
        key,
        value,
        timestamp: Date.now(),
        success: true,
      })
    } catch (error) {
      this.stats.errorCount++
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
      throw error
    }
  }

  /**
   * Get a value
   * @param key Storage key
   * @param defaultValue Default value if key doesn't exist
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    await this.waitForReady()
    this.stats.operationCount++

    if (!this.adapter) {
      throw new Error('No storage adapter available')
    }

    try {
      // 1. Check cache first
      if (this.config.enableCache && this.cache.has(key)) {
        return this.cache.get(key, defaultValue)
      }

      // 2. Load from adapter
      const value = await this.adapter.get<T>(key, defaultValue)

      // 3. Update cache
      if (this.config.enableCache && value !== defaultValue) {
        this.cache.set(key, value)
      }

      // 4. Emit event
      this.emitEvent({
        type: 'get',
        key,
        value,
        timestamp: Date.now(),
        success: true,
      })

      return value
    } catch (error) {
      this.stats.errorCount++
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
      return defaultValue
    }
  }

  /**
   * Remove a value
   * @param key Storage key
   */
  async remove(key: string): Promise<void> {
    await this.waitForReady()
    this.stats.operationCount++

    if (!this.adapter) {
      throw new Error('No storage adapter available')
    }

    try {
      // 1. Remove from cache
      if (this.config.enableCache) {
        this.cache.delete(key)
      }

      // 2. Remove from adapter
      await this.adapter.remove(key)

      // 3. Emit event
      this.emitEvent({
        type: 'remove',
        key,
        timestamp: Date.now(),
        success: true,
      })
    } catch (error) {
      this.stats.errorCount++
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
      throw error
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await this.waitForReady()
    this.stats.operationCount++

    if (!this.adapter) {
      throw new Error('No storage adapter available')
    }

    try {
      // 1. Clear cache
      if (this.config.enableCache) {
        this.cache.clear()
      }

      // 2. Clear adapter
      await this.adapter.clear()

      // 3. Reset stats
      this.stats.totalKeys = 0
      this.stats.totalSize = 0

      // 4. Emit event
      this.emitEvent({
        type: 'clear',
        timestamp: Date.now(),
        success: true,
      })
    } catch (error) {
      this.stats.errorCount++
      this.emitEvent({
        type: 'error',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
      throw error
    }
  }

  /**
   * Check if key exists
   * @param key Storage key
   */
  async has(key: string): Promise<boolean> {
    await this.waitForReady()

    if (!this.adapter) {
      return false
    }

    // Check cache first
    if (this.config.enableCache && this.cache.has(key)) {
      return true
    }

    return this.adapter.has(key)
  }

  /**
   * Get all storage keys
   */
  async keys(): Promise<string[]> {
    await this.waitForReady()

    if (!this.adapter) {
      return []
    }

    return this.adapter.keys()
  }

  /**
   * Synchronous get (for backward compatibility)
   * Only works with cached data
   */
  getSync<T>(key: string, defaultValue: T): T {
    if (!this.initialized) {
      console.warn('StorageManager not initialized, returning default value')
      return defaultValue
    }

    if (!this.config.enableCache) {
      console.warn('Cache disabled, returning default value')
      return defaultValue
    }

    return this.cache.get(key, defaultValue)
  }

  /**
   * Synchronous set (for backward compatibility)
   * Updates cache and queues adapter update
   */
  setSync(key: string, value: unknown): boolean {
    if (!this.initialized) {
      console.warn('StorageManager not initialized')
      return false
    }

    try {
      // Update cache immediately
      if (this.config.enableCache) {
        this.cache.set(key, value)
      }

      // Queue async update (fire and forget)
      if (this.adapter) {
        void this.adapter.set(key, value)
      }

      return true
    } catch (error) {
      console.error('Sync set failed:', error)
      return false
    }
  }

  /**
   * Flush cache to storage
   */
  async flush(): Promise<void> {
    await this.waitForReady()

    if (!this.adapter || !this.config.enableCache) {
      return
    }

    const entries = this.cache.entries()

    for (const [key, value] of entries) {
      await this.adapter.set(key, value)
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return { ...this.stats }
  }

  /**
   * Update statistics
   */
  private async updateStats(): Promise<void> {
    if (!this.adapter) {
      return
    }

    try {
      const keys = await this.adapter.keys()
      this.stats.totalKeys = keys.length

      // Update cache hit rate
      const cacheStats = this.cache.getStats()
      if (this.stats.operationCount > 0) {
        this.stats.cacheHitRate = cacheStats.totalHits / this.stats.operationCount
      }
    } catch (error) {
      console.warn('Failed to update stats:', error)
    }
  }

  /**
   * Add event listener
   * @param event Event type or '*' for all events
   * @param listener Event listener function
   */
  on(event: string, listener: StorageEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * Remove event listener
   * @param event Event type or '*' for all events
   * @param listener Event listener function
   */
  off(event: string, listener: StorageEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Emit storage event
   */
  private emitEvent(event: StorageEvent): void {
    // Emit to specific event listeners
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      }
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get('*')
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      }
    }
  }

  /**
   * Close storage manager and cleanup resources
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      // Flush cache
      await this.flush()

      // Close adapter
      if (this.adapter?.close) {
        await this.adapter.close()
      }

      // Clear cache
      this.cache.clear()

      // Clear event listeners
      this.eventListeners.clear()

      this.initialized = false
    } catch (error) {
      console.error('Failed to close storage manager:', error)
      throw error
    }
  }
}
