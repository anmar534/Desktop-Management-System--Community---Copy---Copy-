/**
 * Legacy Storage Adapter
 *
 * @module storage/adapters/LegacyStorageAdapter
 * @description Backward compatibility layer for old storage API
 */

import { StorageManager } from '../core/StorageManager'
import { ElectronAdapter } from './ElectronAdapter'
import { LocalStorageAdapter } from './LocalStorageAdapter'

/**
 * Legacy storage adapter
 * Provides 100% backward compatibility with old storage.ts API
 */
class LegacyStorageAdapter {
  private manager: StorageManager
  private initialized = false

  constructor() {
    this.manager = StorageManager.getInstance()
    this.setupAdapter()
  }

  /**
   * Setup storage adapter (Electron or LocalStorage)
   */
  private setupAdapter(): void {
    // Try Electron adapter first
    const electronAdapter = new ElectronAdapter()
    if (electronAdapter.isAvailable()) {
      this.manager.setAdapter(electronAdapter)
      return
    }

    // Fall back to LocalStorage
    const localStorageAdapter = new LocalStorageAdapter()
    if (localStorageAdapter.isAvailable()) {
      this.manager.setAdapter(localStorageAdapter)
      return
    }

    console.error('No storage adapter available!')
  }

  /**
   * Ensure manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.manager.initialize()
      this.initialized = true
    }
  }

  /**
   * Old saveToStorage function
   * @deprecated Use StorageManager.set() instead
   */
  async saveToStorage(key: string, data: unknown): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ saveToStorage("${key}") is deprecated. Use StorageManager.set() instead.`)
    }

    await this.ensureInitialized()
    return this.manager.set(key, data)
  }

  /**
   * Old loadFromStorage function
   * @deprecated Use StorageManager.get() instead
   */
  async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ loadFromStorage("${key}") is deprecated. Use StorageManager.get() instead.`)
    }

    await this.ensureInitialized()
    return this.manager.get(key, defaultValue)
  }

  /**
   * Old removeFromStorage function
   * @deprecated Use StorageManager.remove() instead
   */
  async removeFromStorage(key: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ removeFromStorage("${key}") is deprecated. Use StorageManager.remove() instead.`,
      )
    }

    await this.ensureInitialized()
    return this.manager.remove(key)
  }

  /**
   * Old clearAllStorage function
   * @deprecated Use StorageManager.clear() instead
   */
  async clearAllStorage(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ clearAllStorage() is deprecated. Use StorageManager.clear() instead.')
    }

    await this.ensureInitialized()
    return this.manager.clear()
  }

  /**
   * Old waitForStorageReady function
   * @deprecated Use StorageManager.waitForReady() instead
   */
  async waitForStorageReady(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ waitForStorageReady() is deprecated. Use StorageManager.waitForReady() instead.',
      )
    }

    return this.ensureInitialized()
  }

  /**
   * Old syncStorage function
   * @deprecated Use StorageManager.flush() instead
   */
  async syncStorage(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ syncStorage() is deprecated. Use StorageManager.flush() instead.')
    }

    await this.ensureInitialized()
    return this.manager.flush()
  }

  /**
   * Old safeLocalStorage object
   * @deprecated Use StorageManager methods instead
   */
  get safeLocalStorage() {
    return {
      setItem: (key: string, value: unknown): boolean => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ safeLocalStorage.setItem("${key}") is deprecated. Use StorageManager.setSync() instead.`,
          )
        }
        return this.manager.setSync(key, value)
      },

      getItem: <T>(key: string, defaultValue: T): T => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ safeLocalStorage.getItem("${key}") is deprecated. Use StorageManager.getSync() instead.`,
          )
        }
        return this.manager.getSync(key, defaultValue)
      },

      removeItem: (key: string): boolean => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ safeLocalStorage.removeItem("${key}") is deprecated. Use StorageManager.remove() instead.`,
          )
        }
        void this.manager.remove(key)
        return true
      },

      hasItem: (key: string): boolean => {
        const value = this.manager.getSync(key, null)
        return value !== null
      },
    }
  }

  /**
   * Old asyncStorage object
   * @deprecated Use StorageManager methods instead
   */
  get asyncStorage() {
    return {
      setItem: async (key: string, value: unknown): Promise<void> => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ asyncStorage.setItem("${key}") is deprecated. Use StorageManager.set() instead.`,
          )
        }
        await this.ensureInitialized()
        return this.manager.set(key, value)
      },

      getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ asyncStorage.getItem("${key}") is deprecated. Use StorageManager.get() instead.`,
          )
        }
        await this.ensureInitialized()
        return this.manager.get(key, defaultValue)
      },

      removeItem: async (key: string): Promise<void> => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ asyncStorage.removeItem("${key}") is deprecated. Use StorageManager.remove() instead.`,
          )
        }
        await this.ensureInitialized()
        return this.manager.remove(key)
      },

      hasItem: async (key: string): Promise<boolean> => {
        await this.ensureInitialized()
        return this.manager.has(key)
      },
    }
  }
}

// Create singleton instance
const legacyAdapter = new LegacyStorageAdapter()

// Export old API functions (backward compatible)
export const saveToStorage = legacyAdapter.saveToStorage.bind(legacyAdapter)
export const loadFromStorage = legacyAdapter.loadFromStorage.bind(legacyAdapter)
export const removeFromStorage = legacyAdapter.removeFromStorage.bind(legacyAdapter)
export const clearAllStorage = legacyAdapter.clearAllStorage.bind(legacyAdapter)
export const waitForStorageReady = legacyAdapter.waitForStorageReady.bind(legacyAdapter)
export const syncStorage = legacyAdapter.syncStorage.bind(legacyAdapter)
export const safeLocalStorage = legacyAdapter.safeLocalStorage
export const asyncStorage = legacyAdapter.asyncStorage

// Also export the adapter class itself
export { LegacyStorageAdapter }
