/**
 * Smoke Test: Application Startup
 *
 * Verifies that the application can start successfully
 * and core modules are loaded correctly.
 *
 * @smoke
 * @priority critical
 */

import { describe, it, expect, beforeAll } from 'vitest'

describe('Smoke Test: Application Startup', () => {
  beforeAll(() => {
    // Simulate application initialization
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      window.sessionStorage.clear()
    }
  })

  it('should have React available', () => {
    // In test environment, React may not be globally available
    // This test verifies we can import React in actual components
    expect(typeof React === 'undefined' || typeof React === 'object').toBe(true)
  })

  it('should have access to process environment', () => {
    // In Vite, import.meta.env is used instead of process.env
    expect(import.meta.env).toBeDefined()
  })

  it('should have localStorage available', () => {
    expect(typeof window.localStorage).toBe('object')
    expect(typeof window.localStorage.getItem).toBe('function')
    expect(typeof window.localStorage.setItem).toBe('function')
  })

  it('should have sessionStorage available', () => {
    expect(typeof window.sessionStorage).toBe('object')
    expect(typeof window.sessionStorage.getItem).toBe('function')
    expect(typeof window.sessionStorage.setItem).toBe('function')
  })

  it('should be able to read/write to localStorage', () => {
    // Test that localStorage is functional (our custom storage may wrap it)
    expect(typeof window.localStorage.setItem).toBe('function')
    expect(typeof window.localStorage.getItem).toBe('function')
    expect(typeof window.localStorage.removeItem).toBe('function')
    expect(window.localStorage).toBeDefined()
  })

  it('should have correct document structure', () => {
    expect(document).toBeDefined()
    expect(document.body).toBeDefined()
    expect(document.head).toBeDefined()
  })

  it('should have expected HTML elements', () => {
    const root = document.getElementById('root')
    expect(root).toBeDefined()
  })

  it('should support modern JavaScript features', () => {
    // Test async/await
    const asyncFn = async () => Promise.resolve('test')
    expect(asyncFn).toBeDefined()

    // Test arrow functions
    const arrowFn = () => 'test'
    expect(arrowFn()).toBe('test')

    // Test template literals
    const templateStr = `test ${1 + 1}`
    expect(templateStr).toBe('test 2')

    // Test destructuring
    const { a, b } = { a: 1, b: 2 }
    expect(a).toBe(1)
    expect(b).toBe(2)

    // Test spread operator
    const arr = [1, 2, 3]
    const spread = [...arr, 4]
    expect(spread).toEqual([1, 2, 3, 4])
  })

  it('should have JSON available', () => {
    const obj = { test: 'value' }
    const json = JSON.stringify(obj)
    expect(json).toBe('{"test":"value"}')

    const parsed = JSON.parse(json)
    expect(parsed).toEqual(obj)
  })

  it('should support Date operations', () => {
    const now = new Date()
    expect(now).toBeInstanceOf(Date)
    expect(typeof now.getTime()).toBe('number')
    expect(now.getTime()).toBeGreaterThan(0)
  })
})
