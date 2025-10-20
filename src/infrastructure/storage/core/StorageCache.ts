/**
 * Storage Cache
 *
 * @module storage/core/StorageCache
 * @description In-memory cache for faster storage access
 */

import type { CacheEntry } from './types'
import type { IStorageAdapter } from './types'

/**
 * In-memory storage cache
 * Provides fast access to frequently used data
 */
export class StorageCache {
  private cache = new Map<string, CacheEntry>()
  private hydrated = false
  private ttl: number
  private maxSize: number

  constructor(options: { ttl?: number; maxSize?: number } = {}) {
    this.ttl = options.ttl ?? 60 * 60 * 1000 // Default: 1 hour
    this.maxSize = options.maxSize ?? 1000 // Default: 1000 entries
  }

  /**
   * Load cache from storage adapter
   * @param adapter Storage adapter to hydrate from
   */
  async hydrate(adapter: IStorageAdapter): Promise<void> {
    if (this.hydrated) {
      return
    }

    try {
      const keys = await adapter.keys()

      for (const key of keys) {
        const value = await adapter.get(key, null)
        if (value !== null && value !== undefined) {
          this.setInternal(key, value)
        }
      }

      this.hydrated = true
    } catch (error) {
      console.error('Failed to hydrate cache:', error)
      // Continue without cache
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   */
  set(key: string, value: unknown): void {
    this.setInternal(key, value)
    this.enforceMaxSize()
  }

  /**
   * Internal set without size enforcement
   */
  private setInternal(key: string, value: unknown): void {
    const now = Date.now()
    const existing = this.cache.get(key)

    this.cache.set(key, {
      value: this.cloneValue(value),
      createdAt: existing?.createdAt ?? now,
      lastAccessedAt: now,
      hits: (existing?.hits ?? 0) + 1,
    })
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @param defaultValue Default value if not found or expired
   */
  get<T>(key: string, defaultValue: T): T {
    const entry = this.cache.get(key)

    if (!entry) {
      return defaultValue
    }

    // Check TTL
    if (this.ttl > 0) {
      const age = Date.now() - entry.createdAt
      if (age > this.ttl) {
        this.cache.delete(key)
        return defaultValue
      }
    }

    // Update access time and hits
    entry.lastAccessedAt = Date.now()
    entry.hits++

    return this.cloneValue(entry.value) as T
  }

  /**
   * Check if key exists in cache and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check TTL
    if (this.ttl > 0) {
      const age = Date.now() - entry.createdAt
      if (age > this.ttl) {
        this.cache.delete(key)
        return false
      }
    }

    return true
  }

  /**
   * Delete key from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.hydrated = false
  }

  /**
   * Get all cache entries
   */
  entries(): [string, unknown][] {
    const now = Date.now()
    const result: [string, unknown][] = []

    for (const [key, entry] of this.cache.entries()) {
      // Check TTL
      if (this.ttl > 0) {
        const age = now - entry.createdAt
        if (age > this.ttl) {
          this.cache.delete(key)
          continue
        }
      }

      result.push([key, this.cloneValue(entry.value)])
    }

    return result
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hydrated: boolean
    totalHits: number
    avgHits: number
  } {
    let totalHits = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
    }

    return {
      size: this.cache.size,
      hydrated: this.hydrated,
      totalHits,
      avgHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    }
  }

  /**
   * Enforce maximum cache size using LRU eviction
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) {
      return
    }

    // Sort by last access time (LRU)
    const sorted = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt,
    )

    // Remove oldest entries
    const toRemove = this.cache.size - this.maxSize
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(sorted[i][0])
    }
  }

  /**
   * Deep clone value to prevent mutations
   */
  private cloneValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value !== 'object') {
      return value
    }

    try {
      return JSON.parse(JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to clone cache value, returning as-is:', error)
      return value
    }
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    if (this.ttl <= 0) {
      return 0
    }

    const now = Date.now()
    let pruned = 0

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt
      if (age > this.ttl) {
        this.cache.delete(key)
        pruned++
      }
    }

    return pruned
  }
}
