/**
 * Storage Module
 *
 * @module storage
 * @description Main storage module - new modular architecture
 */

// Core exports
export * from './core'

// Adapter exports
export * from './adapters'

// Re-export commonly used items
export { StorageManager } from './core/StorageManager'
export { ElectronAdapter } from './adapters/ElectronAdapter'
export { LocalStorageAdapter } from './adapters/LocalStorageAdapter'

// Legacy API exports (for backward compatibility)
export {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllStorage,
  waitForStorageReady,
  syncStorage,
  safeLocalStorage,
  asyncStorage,
} from './adapters/LegacyStorageAdapter'
