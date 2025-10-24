/**
 * Electron Storage Middleware for Zustand
 *
 * This middleware integrates Zustand stores with Electron's storage system.
 * It automatically persists state changes to the Electron store and loads
 * initial state on store creation.
 */

import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

export interface ElectronStorageOptions {
  /**
   * The key to use in Electron storage
   */
  name: string

  /**
   * Optional function to transform state before saving
   * Use this to exclude non-serializable data or sensitive information
   */
  partialize?: <T>(state: T) => Partial<T>

  /**
   * Optional function to merge loaded state with initial state
   */
  merge?: <T>(persistedState: Partial<T>, currentState: T) => T

  /**
   * Version of the state schema (for migration support)
   */
  version?: number

  /**
   * Debounce delay in ms before persisting (default: 100ms)
   */
  debounce?: number
}

type ElectronStorage = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
  options: ElectronStorageOptions,
) => StateCreator<T, Mps, Mcs>

/**
 * Creates Electron storage middleware
 */
export const electronStorage: ElectronStorage = (initializer, options) => {
  const { name, partialize = (state) => state, debounce: delay = 100 } = options

  let timeoutId: NodeJS.Timeout | null = null

  return (set, get, api) => {
    const wrappedSet: typeof set = (...args) => {
      set(...args)

      // Debounce save to Electron storage
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        const state = partialize(get())

        // Save to Electron storage
        if (window.electronAPI?.setStoreValue) {
          window.electronAPI.setStoreValue(name, state).catch((error) => {
            console.error(`[ElectronStorage] Failed to save ${name}:`, error)
          })
        } else {
          console.warn(`[ElectronStorage] electronAPI not available for ${name}`)
        }
      }, delay)
    }

    // Load initial state from Electron storage
    if (window.electronAPI?.getStoreValue) {
      window.electronAPI
        .getStoreValue(name)
        .then((persistedState) => {
          if (persistedState) {
            // Merge persisted state with current state
            const currentState = get()
            const mergedState = options.merge
              ? options.merge(persistedState, currentState)
              : { ...currentState, ...persistedState }

            set(mergedState as T, true)
            console.info(`[ElectronStorage] Loaded ${name} from storage`)
          }
        })
        .catch((error) => {
          console.error(`[ElectronStorage] Failed to load ${name}:`, error)
        })
    }

    return initializer(wrappedSet, get, api)
  }
}

/**
 * Manually save store state to Electron storage
 */
export const saveToElectronStorage = async <T>(name: string, state: T): Promise<void> => {
  if (!window.electronAPI?.setStoreValue) {
    throw new Error('electronAPI not available')
  }

  await window.electronAPI.setStoreValue(name, state)
}

/**
 * Manually load state from Electron storage
 */
export const loadFromElectronStorage = async <T>(name: string): Promise<T | null> => {
  if (!window.electronAPI?.getStoreValue) {
    throw new Error('electronAPI not available')
  }

  return await window.electronAPI.getStoreValue(name)
}

/**
 * Clear specific key from Electron storage
 */
export const clearElectronStorage = async (name: string): Promise<void> => {
  if (!window.electronAPI?.deleteStoreValue) {
    throw new Error('electronAPI not available')
  }

  await window.electronAPI.deleteStoreValue(name)
}
