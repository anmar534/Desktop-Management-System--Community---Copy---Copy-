import { beforeEach, describe, expect, it } from 'vitest'
import { StorageManager } from '@/storage/core/StorageManager'
import type { IStorageAdapter, StorageCapabilities } from '@/storage/core/types'

class MockAdapter implements IStorageAdapter {
  readonly name = 'mock-adapter'
  readonly capabilities: StorageCapabilities = {
    supportsSync: true,
    supportsEncryption: false,
    supportsCompression: false,
    supportsMigrations: false,
    supportsTransactions: false,
  }

  private readonly store = new Map<string, unknown>()

  constructor(seed?: Record<string, unknown>) {
    if (seed) {
      for (const [key, value] of Object.entries(seed)) {
        this.store.set(key, value)
      }
    }
  }

  isAvailable(): boolean {
    return true
  }

  async initialize(): Promise<void> {
    // no-op
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value)
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    return this.store.has(key) ? (this.store.get(key) as T) : defaultValue
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys())
  }
}

describe('StorageManager legacy cleanup', () => {
  beforeEach(() => {
    StorageManager.resetInstance()
  })

  it('removes deprecated snapshot keys on initialization', async () => {
    const adapter = new MockAdapter({
      app_pricing_snapshots: { legacy: true },
      PRICING_SNAPSHOTS: { legacy: true },
      tender_snapshot_demo: { legacy: true },
      'backup-tender-pricing-tender-1-42': { legacy: true },
      app_pricing_data: { keep: true },
    })

    const manager = StorageManager.getInstance({ enableCache: false })
    manager.setAdapter(adapter)
    await manager.initialize()

    expect(await adapter.has('app_pricing_snapshots')).toBe(false)
    expect(await adapter.has('PRICING_SNAPSHOTS')).toBe(false)
    expect(await adapter.has('tender_snapshot_demo')).toBe(false)
    expect(await adapter.has('backup-tender-pricing-tender-1-42')).toBe(false)
    expect(await adapter.has('app_pricing_data')).toBe(true)
  })
})
