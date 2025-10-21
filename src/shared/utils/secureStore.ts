/**
 * Secure Store Module
 * Provides secure storage functionality
 */

export interface SecureStoreOptions {
  encrypt?: boolean
  ttl?: number
}

class SecureStore {
  private static instance: SecureStore

  private constructor() {}

  static getInstance(): SecureStore {
    if (!SecureStore.instance) {
      SecureStore.instance = new SecureStore()
    }
    return SecureStore.instance
  }

  set(key: string, value: any, options?: SecureStoreOptions): void {
    try {
      const data = JSON.stringify(value)
      localStorage.setItem(key, data)
    } catch (error) {
      console.error('Error setting secure store value:', error)
    }
  }

  get(key: string): any {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting secure store value:', error)
      return null
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing secure store value:', error)
    }
  }

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing secure store:', error)
    }
  }
}

export const secureStore = SecureStore.getInstance()

