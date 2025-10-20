/**
 * StorageManager Tests
 *
 * @module tests/storage/StorageManager.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StorageManager } from '../../src/infrastructure/storage/core/StorageManager'
import { LocalStorageAdapter } from '../../src/infrastructure/storage/adapters/LocalStorageAdapter'

interface StorageEvent {
  type: string
  key?: string
  value?: unknown
  timestamp: number
  success: boolean
  error?: Error
}

describe('StorageManager', () => {
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

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageManager.getInstance()
      const instance2 = StorageManager.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should reset instance', () => {
      const instance1 = StorageManager.getInstance()
      StorageManager.resetInstance()
      const instance2 = StorageManager.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())

      await manager.initialize()

      expect(manager.isReady()).toBe(true)
    })

    it('should initialize only once', async () => {
      const manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())

      await manager.initialize()
      await manager.initialize() // Second call should not re-initialize

      expect(manager.isReady()).toBe(true)
    })

    it('should throw error if no adapter set', async () => {
      const manager = StorageManager.getInstance()

      await expect(manager.initialize()).rejects.toThrow('No storage adapter set')
    })

    it('should not allow adapter change after initialization', async () => {
      const manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())

      await manager.initialize()

      expect(() => {
        manager.setAdapter(new LocalStorageAdapter())
      }).toThrow('Cannot change adapter after initialization')
    })
  })

  describe('Basic Operations', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should set and get values', async () => {
      await manager.set('test-key', { foo: 'bar' })
      const value = await manager.get('test-key', null)

      expect(value).toEqual({ foo: 'bar' })
    })

    it('should return default value for non-existent keys', async () => {
      const value = await manager.get('non-existent', 'default')

      expect(value).toBe('default')
    })

    it('should remove values', async () => {
      await manager.set('test-key', 'test-value')
      await manager.remove('test-key')
      const value = await manager.get('test-key', null)

      expect(value).toBeNull()
    })

    it('should clear all storage', async () => {
      await manager.set('key1', 'value1')
      await manager.set('key2', 'value2')
      await manager.clear()

      const keys = await manager.keys()
      expect(keys.length).toBe(0)
    })

    it('should check if keys exist', async () => {
      await manager.set('test-key', 'test-value')

      const exists = await manager.has('test-key')
      const notExists = await manager.has('non-existent')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })

    it('should get all keys', async () => {
      await manager.set('key1', 'value1')
      await manager.set('key2', 'value2')
      await manager.set('key3', 'value3')

      const keys = await manager.keys()

      expect(keys.length).toBe(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })
  })

  describe('Synchronous Operations', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should set and get values synchronously', () => {
      const success = manager.setSync('test-key', { foo: 'bar' })
      const value = manager.getSync('test-key', null)

      expect(success).toBe(true)
      expect(value).toEqual({ foo: 'bar' })
    })

    it('should return default value for non-existent keys', () => {
      const value = manager.getSync('non-existent', 'default')

      expect(value).toBe('default')
    })
  })

  describe('Cache', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance({ enableCache: true })
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should cache values after get', async () => {
      await manager.set('test-key', 'test-value')

      // First get (from storage)
      const value1 = await manager.get('test-key', null)

      // Second get (from cache)
      const value2 = manager.getSync('test-key', null)

      expect(value1).toBe('test-value')
      expect(value2).toBe('test-value')
    })

    it('should update cache on set', async () => {
      await manager.set('test-key', 'value1')
      await manager.set('test-key', 'value2')

      const value = manager.getSync('test-key', null)

      expect(value).toBe('value2')
    })

    it('should remove from cache on delete', async () => {
      await manager.set('test-key', 'test-value')
      await manager.remove('test-key')

      const value = manager.getSync('test-key', null)

      expect(value).toBeNull()
    })
  })

  describe('Events', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should emit events on operations', async () => {
      const events: StorageEvent[] = []

      manager.on('set', (event) => {
        events.push(event as StorageEvent)
      })

      await manager.set('test-key', 'test-value')

      expect(events.length).toBe(1)
      expect(events[0].type).toBe('set')
      expect(events[0].key).toBe('test-key')
      expect(events[0].success).toBe(true)
    })

    it('should support wildcard listeners', async () => {
      const events: StorageEvent[] = []

      manager.on('*', (event) => {
        events.push(event as StorageEvent)
      })

      await manager.set('test-key', 'test-value')
      await manager.get('test-key', null)
      await manager.remove('test-key')

      // Should have at least set and remove events
      // Note: get may or may not emit depending on cache hits
      expect(events.length).toBeGreaterThanOrEqual(2)
      expect(events.some((e) => e.type === 'set')).toBe(true)
      expect(events.some((e) => e.type === 'remove')).toBe(true)
    })

    it('should remove event listeners', async () => {
      const events: StorageEvent[] = []
      const listener = (event: StorageEvent) => events.push(event)

      manager.on('set', listener)
      await manager.set('key1', 'value1')

      manager.off('set', listener)
      await manager.set('key2', 'value2')

      expect(events.length).toBe(1)
    })
  })

  describe('Statistics', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should track operation count', async () => {
      const stats1 = manager.getStats()

      await manager.set('key1', 'value1')
      await manager.get('key1', null)
      await manager.remove('key1')

      const stats2 = manager.getStats()

      expect(stats2.operationCount).toBeGreaterThan(stats1.operationCount)
    })
  })

  describe('Flush', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance({ enableCache: true })
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should flush cache to storage', async () => {
      // Set via sync (cache only)
      manager.setSync('test-key', 'test-value')

      // Flush to storage
      await manager.flush()

      // Verify in storage
      const value = await manager.get('test-key', null)
      expect(value).toBe('test-value')
    })
  })

  describe('Close', () => {
    let manager: StorageManager

    beforeEach(async () => {
      manager = StorageManager.getInstance()
      manager.setAdapter(new LocalStorageAdapter())
      await manager.initialize()
    })

    it('should close and cleanup resources', async () => {
      await manager.set('test-key', 'test-value')
      await manager.close()

      expect(manager.isReady()).toBe(false)
    })
  })
})
