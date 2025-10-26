/**
 * Electron Storage Adapter
 *
 * @module storage/adapters/ElectronAdapter
 * @description Storage adapter for Electron using IPC
 */

import { BaseStorage } from '../core/BaseStorage'
import type { StorageCapabilities } from '../core/types'

/**
 * Electron storage adapter
 * Uses Electron IPC to communicate with main process storage
 */
export class ElectronAdapter extends BaseStorage {
  readonly name = 'ElectronAdapter'

  readonly capabilities: StorageCapabilities = {
    supportsSync: true,
    supportsEncryption: true,
    supportsCompression: false,
    supportsMigrations: true,
    supportsTransactions: false,
  }

  private electronAPI: {
    storage: {
      ping: () => Promise<void>
      set: (key: string, value: unknown) => Promise<void>
      get: <T>(key: string, defaultValue: T) => Promise<T>
      remove: (key: string) => Promise<void>
      clear: () => Promise<void>
      has: (key: string) => Promise<boolean>
      keys: () => Promise<string[]>
      setSync?: (key: string, value: unknown) => void
      getSync?: <T>(key: string, defaultValue: T) => T
    }
  } | null = null
  private available = false

  constructor() {
    super()

    // Check if Electron API is available
    if (typeof window !== 'undefined') {
      const win = window as { electronAPI?: typeof this.electronAPI }
      if (win.electronAPI) {
        this.electronAPI = win.electronAPI
        this.available = true
      }
    }
  }

  /**
   * Check if Electron adapter is available
   */
  isAvailable(): boolean {
    return this.available && this.electronAPI?.storage !== undefined
  }

  /**
   * Initialize adapter
   */
  async initialize(): Promise<void> {
    if (!this.isAvailable() || !this.electronAPI) {
      throw new Error('Electron API not available')
    }

    // Test connection
    try {
      await this.electronAPI.storage.ping()
    } catch (error) {
      throw new Error(
        `Failed to initialize Electron storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Set value in Electron storage
   */
  async set(key: string, value: unknown): Promise<void> {
    this.validateKey(key)

    if (!this.isAvailable() || !this.electronAPI) {
      throw new Error('Electron storage not available')
    }

    try {
      await this.electronAPI.storage.set(key, value)
    } catch (error) {
      throw new Error(
        `Failed to set value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get value from Electron storage
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    this.validateKey(key)

    if (!this.isAvailable() || !this.electronAPI) {
      return defaultValue
    }

    try {
      const value = await this.electronAPI.storage.get(key, defaultValue)
      return value as T
    } catch (error) {
      console.warn(`Failed to get value for key "${key}":`, error)
      return defaultValue
    }
  }

  /**
   * Remove value from Electron storage
   */
  async remove(key: string): Promise<void> {
    this.validateKey(key)

    if (!this.isAvailable() || !this.electronAPI) {
      throw new Error('Electron storage not available')
    }

    try {
      await this.electronAPI.storage.remove(key)
    } catch (error) {
      throw new Error(
        `Failed to remove value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Clear all Electron storage
   */
  async clear(): Promise<void> {
    if (!this.isAvailable() || !this.electronAPI) {
      throw new Error('Electron storage not available')
    }

    try {
      await this.electronAPI.storage.clear()
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

    if (!this.isAvailable() || !this.electronAPI) {
      return false
    }

    try {
      return await this.electronAPI.storage.has(key)
    } catch (error) {
      console.warn(`Failed to check key existence:`, error)
      return false
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    if (!this.isAvailable() || !this.electronAPI) {
      return []
    }

    try {
      return await this.electronAPI.storage.keys()
    } catch (error) {
      console.warn('Failed to get keys:', error)
      return []
    }
  }

  /**
   * Synchronous set (uses Electron sync IPC)
   */
  setSync(key: string, value: unknown): boolean {
    this.validateKey(key)

    if (!this.isAvailable() || !this.electronAPI?.storage.setSync) {
      return false
    }

    try {
      this.electronAPI.storage.setSync(key, value)
      return true
    } catch (error) {
      console.error('Sync set failed:', error)
      return false
    }
  }

  /**
   * Synchronous get (uses Electron sync IPC)
   */
  getSync<T>(key: string, defaultValue: T): T {
    this.validateKey(key)

    if (!this.isAvailable() || !this.electronAPI?.storage.getSync) {
      return defaultValue
    }

    try {
      return this.electronAPI.storage.getSync(key, defaultValue) as T
    } catch (error) {
      console.warn('Sync get failed:', error)
      return defaultValue
    }
  }
}
