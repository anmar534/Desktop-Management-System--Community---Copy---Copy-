/**
 * Test Setup Configuration
 * Global test setup for Vitest with React Testing Library
 */

import { expect, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { enableMapSet } from 'immer'
import { StorageManager } from '@/infrastructure/storage/core/StorageManager'
import { LocalStorageAdapter } from '@/infrastructure/storage/adapters/LocalStorageAdapter'

// Enable Immer MapSet plugin for Zustand stores that use Map
enableMapSet()

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Setup StorageManager before each test
beforeEach(() => {
  // Reset and initialize StorageManager with LocalStorageAdapter
  StorageManager.resetInstance()
  const manager = StorageManager.getInstance()
  manager.setAdapter(new LocalStorageAdapter())
})

// Cleanup after each test case
afterEach(() => {
  cleanup()
  // Reset StorageManager after each test
  StorageManager.resetInstance()
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  scrollMargin = ''
  thresholds = []
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock console history for tests
interface WindowWithMocks extends Window {
  __consoleHistory?: string[]
  __errors?: string[]
}

;(window as WindowWithMocks).__consoleHistory = []
;(window as WindowWithMocks).__errors = []

const origLog = console.log
const origError = console.error

console.log = (...args: any[]) => {
  ;(window as WindowWithMocks).__consoleHistory?.push(args.join(' '))
  origLog(...args)
}

console.error = (...args: any[]) => {
  ;(window as WindowWithMocks).__errors?.push(args.join(' '))
  origError(...args)
}

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: class ElectronStore {
      private store = new Map<string, any>()

      get(key: string) {
        return this.store.get(key)
      }

      set(key: string, value: any) {
        this.store.set(key, value)
      }

      delete(key: string) {
        this.store.delete(key)
      }

      clear() {
        this.store.clear()
      }

      has(key: string) {
        return this.store.has(key)
      }
    },
  }
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock HTMLElement.scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
})

// Mock HTMLElement.hasPointerCapture
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  writable: true,
  value: vi.fn(),
})

// Mock HTMLElement.setPointerCapture
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  writable: true,
  value: vi.fn(),
})

// Mock HTMLElement.releasePointerCapture
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  writable: true,
  value: vi.fn(),
})

// Mock DOMRect
global.DOMRect = {
  fromRect: () => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  }),
}

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: () => ({
    getPropertyValue: () => '',
  }),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0)
}

// Mock cancelAnimationFrame
global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: localStorageMock,
})

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url'),
})

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  writable: true,
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid'),
    getRandomValues: vi.fn((arr: any) => arr),
  },
})

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args: any[]) => {
  // Suppress specific React warnings in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Warning: validateDOMNesting') ||
      args[0].includes('Warning: Each child in a list should have a unique "key" prop'))
  ) {
    return
  }
  originalConsoleError(...args)
}

console.warn = (...args: any[]) => {
  // Suppress specific warnings in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: componentWillReceiveProps') ||
      args[0].includes('Warning: componentWillMount'))
  ) {
    return
  }
  originalConsoleWarn(...args)
}

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var vi: typeof import('vitest').vi
}

// Make vi globally available
global.vi = vi
