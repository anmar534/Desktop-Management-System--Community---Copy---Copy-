/**
 * LocalStorage Adapter
 *
 * @module storage/adapters/LocalStorageAdapter
 * @description Browser localStorage adapter (fallback)
 *
 * eslint-disable no-restricted-properties
 * This file IS the localStorage wrapper, so it needs direct access
 */

/* eslint-disable no-restricted-properties */

import { BaseStorage } from '../core/BaseStorage'
import type { StorageCapabilities } from '../core/types'

/**
 * LocalStorage adapter
 * Uses browser localStorage API
 */
export class LocalStorageAdapter extends BaseStorage {
  readonly name = 'LocalStorageAdapter'

  readonly capabilities: StorageCapabilities = {
    supportsSync: true,
    supportsEncryption: false,
    supportsCompression: false,
    supportsMigrations: false,
    supportsTransactions: false,
  }

  private prefix = 'dms_'

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }

      // Test localStorage
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * Set value in localStorage
   */
  async set(key: string, value: unknown): Promise<void> {
    this.validateKey(key)

    if (!this.isAvailable()) {
      throw new Error('localStorage not available')
    }

    try {
      const serialized = this.serialize(value)
      window.localStorage.setItem(this.getPrefixedKey(key), serialized)
    } catch (error) {
      throw new Error(
        `Failed to set value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get value from localStorage
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    this.validateKey(key)

    if (!this.isAvailable()) {
      return defaultValue
    }

    try {
      const data = window.localStorage.getItem(this.getPrefixedKey(key))
      return this.deserialize(data, defaultValue)
    } catch (error) {
      console.warn(`Failed to get value for key "${key}":`, error)
      return defaultValue
    }
  }

  /**
   * Remove value from localStorage
   */
  async remove(key: string): Promise<void> {
    this.validateKey(key)

    if (!this.isAvailable()) {
      throw new Error('localStorage not available')
    }

    try {
      window.localStorage.removeItem(this.getPrefixedKey(key))
    } catch (error) {
      throw new Error(
        `Failed to remove value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Clear all prefixed keys
   */
  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage not available')
    }

    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }

      for (const key of keysToRemove) {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      throw new Error(
        `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    this.validateKey(key)

    if (!this.isAvailable()) {
      return false
    }

    try {
      return window.localStorage.getItem(this.getPrefixedKey(key)) !== null
    } catch {
      return false
    }
  }

  /**
   * Get all prefixed keys
   */
  async keys(): Promise<string[]> {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const keys: string[] = []

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length))
        }
      }

      return keys
    } catch (error) {
      console.warn('Failed to get keys:', error)
      return []
    }
  }

  /**
   * Synchronous set
   */
  setSync(key: string, value: unknown): boolean {
    this.validateKey(key)

    if (!this.isAvailable()) {
      return false
    }

    try {
      const serialized = this.serialize(value)
      window.localStorage.setItem(this.getPrefixedKey(key), serialized)
      return true
    } catch (error) {
      console.error('Sync set failed:', error)
      return false
    }
  }

  /**
   * Synchronous get
   */
  getSync<T>(key: string, defaultValue: T): T {
    this.validateKey(key)

    if (!this.isAvailable()) {
      return defaultValue
    }

    try {
      const data = window.localStorage.getItem(this.getPrefixedKey(key))
      return this.deserialize(data, defaultValue)
    } catch (error) {
      console.warn('Sync get failed:', error)
      return defaultValue
    }
  }
}
