/**
 * Smoke Test: Data Loading
 *
 * Verifies that core data loading mechanisms work correctly
 * and can retrieve data from storage.
 *
 * @smoke
 * @priority critical
 */

import { describe, it, expect, beforeEach } from 'vitest'
import storage from '../../src/utils/storage'

describe('Smoke Test: Data Loading', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  it('should be able to initialize storage', () => {
    expect(storage).toBeDefined()
    expect(typeof storage.getItem).toBe('function')
    expect(typeof storage.setItem).toBe('function')
    expect(typeof storage.removeItem).toBe('function')
  })

  it('should store and retrieve simple data', () => {
    const testKey = 'test_data'
    const testData = { id: 1, name: 'Test' }

    storage.setItem(testKey, testData)
    const retrieved = storage.getItem(testKey, null)

    expect(retrieved).toEqual(testData)
  })

  it('should store and retrieve array data', () => {
    const testKey = 'test_array'
    const testData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]

    storage.setItem(testKey, testData)
    const retrieved = storage.getItem(testKey, null)

    expect(retrieved).toEqual(testData)
    expect(Array.isArray(retrieved)).toBe(true)
    expect((retrieved as unknown as unknown[]).length).toBe(3)
  })

  it('should return default value for non-existent keys', () => {
    const defaultValue = { default: true }
    const retrieved = storage.getItem('non_existent_key_12345', defaultValue)
    expect(retrieved).toEqual(defaultValue)
  })

  it('should remove items correctly', () => {
    const testKey = 'remove_test'
    const testData = { value: 'test' }

    storage.setItem(testKey, testData)
    let retrieved = storage.getItem(testKey, null)
    expect(retrieved).toEqual(testData)

    storage.removeItem(testKey)
    retrieved = storage.getItem(testKey, null)
    expect(retrieved).toBeNull()
  })

  it('should handle complex nested objects', () => {
    const testKey = 'complex_data'
    const complexData = {
      user: {
        id: 1,
        name: 'Test User',
        settings: {
          theme: 'dark',
          language: 'ar',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
      },
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    }

    storage.setItem(testKey, complexData)
    const retrieved = storage.getItem(testKey, null) as unknown as typeof complexData

    expect(retrieved).toEqual(complexData)
    expect(retrieved.user.settings.notifications.email).toBe(true)
  })

  it('should handle large data sets', () => {
    const testKey = 'large_dataset'
    const largeData = Array(100)
      .fill(null)
      .map((_, index) => ({
        id: index,
        name: `Item ${index}`,
        description: `Description for item ${index}`,
        metadata: {
          created: new Date().toISOString(),
          tags: ['tag1', 'tag2', 'tag3'],
        },
      }))

    storage.setItem(testKey, largeData)
    const retrieved = storage.getItem(testKey, []) as typeof largeData

    expect(retrieved).toHaveLength(100)
    expect(retrieved[0].id).toBe(0)
    expect(retrieved[99].id).toBe(99)
  })

  it('should preserve data types', () => {
    const testKey = 'type_test'
    const testData = {
      string: 'text',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: 'value' },
    }

    storage.setItem(testKey, testData)
    const retrieved = storage.getItem(testKey, null) as unknown as typeof testData

    expect(typeof retrieved.string).toBe('string')
    expect(typeof retrieved.number).toBe('number')
    expect(typeof retrieved.boolean).toBe('boolean')
    expect(Array.isArray(retrieved.array)).toBe(true)
    expect(typeof retrieved.object).toBe('object')
  })

  it('should handle hasItem check', () => {
    const testKey = 'has_item_test'

    // Initially should not exist
    expect(storage.hasItem(testKey)).toBe(false)

    // After setting, should exist
    storage.setItem(testKey, { data: 'test' })
    expect(storage.hasItem(testKey)).toBe(true)

    // After removing, should not exist
    storage.removeItem(testKey)
    expect(storage.hasItem(testKey)).toBe(false)
  })
})
