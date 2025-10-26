/**
 * Base Storage Adapter
 *
 * @module storage/core/BaseStorage
 * @description Abstract base class for all storage adapters
 */

import type { IStorageAdapter, StorageCapabilities } from './types'

/**
 * Abstract base storage adapter
 * All storage adapters must extend this class
 */
export abstract class BaseStorage implements IStorageAdapter {
  /**
   * Adapter name for identification and debugging
   */
  abstract readonly name: string

  /**
   * Adapter capabilities
   */
  abstract readonly capabilities: StorageCapabilities

  /**
   * Check if this adapter is available in the current environment
   */
  abstract isAvailable(): boolean

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store (will be serialized)
   */
  abstract set(key: string, value: unknown): Promise<void>

  /**
   * Get a value from storage
   * @param key Storage key
   * @param defaultValue Default value if key doesn't exist
   */
  abstract get<T>(key: string, defaultValue: T): Promise<T>

  /**
   * Remove a value from storage
   * @param key Storage key
   */
  abstract remove(key: string): Promise<void>

  /**
   * Clear all storage (dangerous!)
   */
  abstract clear(): Promise<void>

  /**
   * Check if key exists in storage
   * @param key Storage key
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key, null)
    return value !== null && value !== undefined
  }

  /**
   * Get all keys in storage
   */
  abstract keys(): Promise<string[]>

  /**
   * Synchronous set (if adapter supports it)
   * @param _key Storage key
   * @param _value Value to store
   * @returns true if successful, false if not supported
   */
  setSync(_key: string, _value: unknown): boolean {
    console.warn(`${this.name}: Synchronous set not supported`)
    return false
  }

  /**
   * Synchronous get (if adapter supports it)
   * @param _key Storage key
   * @param defaultValue Default value
   * @returns Value or default value
   */
  getSync<T>(_key: string, defaultValue: T): T {
    console.warn(`${this.name}: Synchronous get not supported`)
    return defaultValue
  }

  /**
   * Initialize adapter (optional)
   */
  async initialize(): Promise<void> {
    // Default: no initialization needed
  }

  /**
   * Close/cleanup adapter resources (optional)
   */
  async close(): Promise<void> {
    // Default: no cleanup needed
  }

  /**
   * Serialize value for storage
   * @param value Value to serialize
   * @returns Serialized string
   */
  protected serialize(value: unknown): string {
    try {
      return JSON.stringify(value)
    } catch (error) {
      console.error(`${this.name}: Failed to serialize value:`, error)
      throw new Error(
        `Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Deserialize value from storage
   * @param data Serialized data
   * @param defaultValue Default value if deserialization fails
   * @returns Deserialized value
   */
  protected deserialize<T>(data: string | null | undefined, defaultValue: T): T {
    if (data === null || data === undefined || data === '') {
      return defaultValue
    }

    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.warn(`${this.name}: Failed to deserialize value, returning default:`, error)
      return defaultValue
    }
  }

  /**
   * Validate key
   * @param key Storage key
   * @throws Error if key is invalid
   */
  protected validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string')
    }

    if (key.trim() === '') {
      throw new Error('Storage key cannot be empty or whitespace')
    }
  }

  /**
   * Clone value to prevent mutations
   * @param value Value to clone
   * @returns Cloned value
   */
  protected cloneValue<T>(value: T): T {
    if (value === null || value === undefined) {
      return value
    }

    // For primitives, return as-is
    if (typeof value !== 'object') {
      return value
    }

    try {
      // Deep clone via JSON (fast and simple)
      return JSON.parse(JSON.stringify(value)) as T
    } catch (error) {
      console.warn(`${this.name}: Failed to clone value, returning original:`, error)
      return value
    }
  }
}
