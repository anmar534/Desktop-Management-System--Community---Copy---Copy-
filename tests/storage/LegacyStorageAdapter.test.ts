/**
 * Legacy Storage Adapter Tests
 *
 * @module tests/storage/LegacyStorageAdapter.test
 * @description Tests backward compatibility with old storage API
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllStorage,
  waitForStorageReady,
  safeLocalStorage,
  asyncStorage,
} from '../../src/storage/adapters/LegacyStorageAdapter'
import { StorageManager } from '../../src/storage/core/StorageManager'

describe('LegacyStorageAdapter - Backward Compatibility', () => {
  beforeEach(() => {
    // Reset singleton
    StorageManager.resetInstance()

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {}

      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString()
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        },
        get length() {
          return Object.keys(store).length
        },
        key: (index: number) => {
          const keys = Object.keys(store)
          return keys[index] || null
        },
      }
    })()

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  describe('Old API - saveToStorage/loadFromStorage', () => {
    it('should work with old saveToStorage/loadFromStorage API', async () => {
      await saveToStorage('test-key', { foo: 'bar' })
      const value = await loadFromStorage('test-key', null)

      expect(value).toEqual({ foo: 'bar' })
    })

    it('should return default value for non-existent keys', async () => {
      const value = await loadFromStorage('non-existent', 'default')

      expect(value).toBe('default')
    })

    it('should work with complex objects', async () => {
      const testData = {
        projects: [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' },
        ],
        settings: {
          theme: 'dark',
          language: 'ar',
        },
      }

      await saveToStorage('complex-data', testData)
      const loaded = await loadFromStorage('complex-data', null)

      expect(loaded).toEqual(testData)
    })
  })

  describe('Old API - removeFromStorage', () => {
    it('should remove values using old API', async () => {
      await saveToStorage('test-key', 'test-value')
      await removeFromStorage('test-key')
      const value = await loadFromStorage('test-key', null)

      expect(value).toBeNull()
    })
  })

  describe('Old API - clearAllStorage', () => {
    it('should clear all storage using old API', async () => {
      await saveToStorage('key1', 'value1')
      await saveToStorage('key2', 'value2')
      await clearAllStorage()

      const value1 = await loadFromStorage('key1', null)
      const value2 = await loadFromStorage('key2', null)

      expect(value1).toBeNull()
      expect(value2).toBeNull()
    })
  })

  describe('Old API - waitForStorageReady', () => {
    it('should wait for storage to be ready', async () => {
      await waitForStorageReady()

      // Should be able to use storage after waiting
      await saveToStorage('test-key', 'test-value')
      const value = await loadFromStorage('test-key', null)

      expect(value).toBe('test-value')
    })
  })

  describe('Old API - safeLocalStorage', () => {
    it('should work with safeLocalStorage.setItem/getItem', () => {
      const success = safeLocalStorage.setItem('test-key', { foo: 'bar' })
      const value = safeLocalStorage.getItem('test-key', null)

      expect(success).toBe(true)
      expect(value).toEqual({ foo: 'bar' })
    })

    it('should work with safeLocalStorage.removeItem', async () => {
      safeLocalStorage.setItem('test-key', 'test-value')
      const removed = safeLocalStorage.removeItem('test-key')

      // Wait a tick for async remove to complete in cache
      await new Promise((resolve) => setTimeout(resolve, 10))

      const value = safeLocalStorage.getItem('test-key', null)

      expect(removed).toBe(true)
      expect(value).toBeNull()
    })

    it('should work with safeLocalStorage.hasItem', () => {
      safeLocalStorage.setItem('test-key', 'test-value')

      const exists = safeLocalStorage.hasItem('test-key')
      const notExists = safeLocalStorage.hasItem('non-existent')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })
  })

  describe('Old API - asyncStorage', () => {
    it('should work with asyncStorage.setItem/getItem', async () => {
      await asyncStorage.setItem('test-key', { foo: 'bar' })
      const value = await asyncStorage.getItem('test-key', null)

      expect(value).toEqual({ foo: 'bar' })
    })

    it('should work with asyncStorage.removeItem', async () => {
      await asyncStorage.setItem('test-key', 'test-value')
      await asyncStorage.removeItem('test-key')
      const value = await asyncStorage.getItem('test-key', null)

      expect(value).toBeNull()
    })

    it('should work with asyncStorage.hasItem', async () => {
      await asyncStorage.setItem('test-key', 'test-value')

      const exists = await asyncStorage.hasItem('test-key')
      const notExists = await asyncStorage.hasItem('non-existent')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })
  })

  describe('Interoperability - Old API ↔ New API', () => {
    it('should read values set with old API using new API', async () => {
      // Import and setup adapter
      const { LocalStorageAdapter } = await import('../../src/storage/adapters/LocalStorageAdapter')

      // Set with old API
      await saveToStorage('test-key', { foo: 'bar' })

      // Setup new API
      const manager = StorageManager.getInstance()
      const adapter = new LocalStorageAdapter()
      manager.setAdapter(adapter)
      await manager.initialize()

      // Read with new API
      const value = await manager.get('test-key', null)

      expect(value).toEqual({ foo: 'bar' })
    })

    it('should read values set with new API using old API', async () => {
      // Import and setup adapter
      const { LocalStorageAdapter } = await import('../../src/storage/adapters/LocalStorageAdapter')

      // Set with new API
      const manager = StorageManager.getInstance()
      const adapter = new LocalStorageAdapter()
      manager.setAdapter(adapter)
      await manager.initialize()
      await manager.set('test-key', { foo: 'bar' })

      // Read with old API
      const value = await loadFromStorage('test-key', null)

      expect(value).toEqual({ foo: 'bar' })
    })

    it('should maintain consistency between old and new API', async () => {
      // Import and setup adapter
      const { LocalStorageAdapter } = await import('../../src/storage/adapters/LocalStorageAdapter')

      const manager = StorageManager.getInstance()
      const adapter = new LocalStorageAdapter()
      manager.setAdapter(adapter)
      await manager.initialize()

      // Set with old API
      await saveToStorage('key1', 'value1')

      // Set with new API
      await manager.set('key2', 'value2')

      // Read both with new API
      const value1 = await manager.get('key1', null)
      const value2 = await manager.get('key2', null)

      // Read both with old API
      const value3 = await loadFromStorage('key1', null)
      const value4 = await loadFromStorage('key2', null)

      expect(value1).toBe('value1')
      expect(value2).toBe('value2')
      expect(value3).toBe('value1')
      expect(value4).toBe('value2')
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should handle projects data (useProjects.ts scenario)', async () => {
      const projects = [
        {
          id: '1',
          name: 'Project Alpha',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Project Beta',
          createdAt: new Date().toISOString(),
        },
      ]

      // Save with old API (like useProjects.ts does)
      await saveToStorage('projects', projects)

      // Load with old API
      const loaded = await loadFromStorage<typeof projects>('projects', [])

      expect(loaded).toEqual(projects)
      expect(loaded).toHaveLength(2)
    })

    it('should handle pricing data (pricingService.ts scenario)', async () => {
      const pricingData = {
        store1: { items: ['item1', 'item2'], total: 1000 },
        store2: { items: ['item3'], total: 500 },
      }

      // Save pricing data
      await saveToStorage('pricing_data', pricingData)

      // Load pricing data
      const loaded = await loadFromStorage('pricing_data', {})

      expect(loaded).toEqual(pricingData)
    })

    it('should handle backup snapshots (backupManager.ts scenario)', async () => {
      const snapshot = {
        tenderId: 'tender-123',
        timestamp: Date.now(),
        data: { items: [], total: 0 },
      }

      const key = `tender_snapshot_${snapshot.tenderId}`

      // Save snapshot
      await saveToStorage(key, snapshot)

      // Load snapshot
      const loaded = await loadFromStorage(key, null)

      expect(loaded).toEqual(snapshot)
    })
  })
})
