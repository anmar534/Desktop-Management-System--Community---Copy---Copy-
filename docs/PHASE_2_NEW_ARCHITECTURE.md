# Phase 2.1.2 - New Storage Architecture Design

## 🏗️ تصميم البنية المعمارية الجديدة

**التاريخ:** 16 أكتوبر 2025  
**الحالة:** 🔄 قيد التصميم  
**المدة المتوقعة:** يوم 3-4

---

## 📋 ملخص تنفيذي

### الأهداف

1. ✅ تصميم بنية modular قابلة للتوسع
2. ✅ ضمان Backward Compatibility 100%
3. ✅ تحسين Testability والصيانة
4. ✅ دعم Multiple Storage Adapters
5. ✅ فصل المسؤوليات (Separation of Concerns)

### المبادئ الأساسية

- **SOLID Principles:** Single Responsibility, Open/Closed, etc.
- **Dependency Injection:** للتسهيل Testing
- **Adapter Pattern:** للـ Backward Compatibility
- **Strategy Pattern:** لدعم adapters متعددة
- **Singleton Pattern:** للـ StorageManager

---

## 🎯 الهيكل المقترح

### Directory Structure

```
src/storage/
├── core/
│   ├── BaseStorage.ts           # Abstract base class
│   ├── StorageManager.ts        # Singleton coordinator
│   ├── StorageCache.ts          # In-memory caching
│   ├── types.ts                 # Shared interfaces & types
│   └── index.ts                 # Public exports
│
├── adapters/
│   ├── ElectronAdapter.ts       # Electron IPC storage
│   ├── LocalStorageAdapter.ts  # Browser localStorage
│   ├── SecureStoreAdapter.ts   # Encrypted storage
│   ├── LegacyStorageAdapter.ts # Backward compatibility
│   └── index.ts
│
├── layers/
│   ├── SecurityLayer.ts         # Encryption & sensitive keys
│   ├── AuditLayer.ts            # Event logging
│   ├── SchemaLayer.ts           # Versioning & migration
│   └── index.ts
│
├── modules/
│   ├── ProjectsStorage.ts       # Domain-specific storage
│   ├── ClientsStorage.ts
│   ├── TendersStorage.ts
│   ├── PricingStorage.ts
│   ├── BackupStorage.ts
│   ├── BOQStorage.ts
│   ├── SettingsStorage.ts
│   └── index.ts
│
├── lifecycle/
│   ├── Initialization.ts        # Startup logic
│   ├── Suspend.ts               # Before app suspend
│   ├── Resume.ts                # After app resume
│   └── index.ts
│
├── migration/
│   ├── MigrationRunner.ts       # Migration coordinator
│   ├── migrations/
│   │   ├── 001_init.ts
│   │   ├── 002_sensitive_keys.ts
│   │   └── ...
│   └── index.ts
│
├── utils/
│   ├── validation.ts            # Data validation
│   ├── encoding.ts              # Serialization helpers
│   ├── errors.ts                # Custom error types
│   └── index.ts
│
└── index.ts                     # Main public exports
```

---

## 🧩 Core Components Design

### 1. BaseStorage (Abstract Class)

```typescript
/**
 * Base storage interface that all storage adapters must implement
 */
export abstract class BaseStorage {
  /**
   * Storage adapter name for debugging
   */
  abstract readonly name: string

  /**
   * Check if this adapter is available in current environment
   */
  abstract isAvailable(): boolean

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store (will be serialized)
   */
  abstract set(key: string, value: unknown): Promise<void>

  /**
   * Get a value from storage
   * @param key Storage key
   * @param defaultValue Default value if key doesn't exist
   */
  abstract get<T>(key: string, defaultValue: T): Promise<T>

  /**
   * Remove a value from storage
   * @param key Storage key
   */
  abstract remove(key: string): Promise<void>

  /**
   * Clear all storage (dangerous!)
   */
  abstract clear(): Promise<void>

  /**
   * Check if key exists in storage
   * @param key Storage key
   */
  abstract has(key: string): Promise<boolean>

  /**
   * Get all keys in storage
   */
  abstract keys(): Promise<string[]>

  /**
   * Synchronous set (if adapter supports it)
   * @returns true if successful, false otherwise
   */
  setSync(key: string, value: unknown): boolean {
    // Default: not supported
    console.warn(`${this.name}: Synchronous set not supported`)
    return false
  }

  /**
   * Synchronous get (if adapter supports it)
   */
  getSync<T>(key: string, defaultValue: T): T {
    // Default: return default value
    console.warn(`${this.name}: Synchronous get not supported`)
    return defaultValue
  }
}
```

**Rationale:**

- ✅ Abstract class allows shared implementation
- ✅ Async by default (modern best practice)
- ✅ Sync methods optional (backward compatibility)
- ✅ Clear contract for all adapters

---

### 2. StorageManager (Singleton)

```typescript
/**
 * Central storage manager
 * Coordinates between different storage adapters and layers
 */
export class StorageManager {
  private static instance: StorageManager | null = null

  private cache: StorageCache
  private adapter: BaseStorage
  private securityLayer: SecurityLayer
  private auditLayer: AuditLayer
  private schemaLayer: SchemaLayer
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  private constructor() {
    // Private constructor (Singleton)
    this.cache = new StorageCache()
    this.securityLayer = new SecurityLayer()
    this.auditLayer = new AuditLayer()
    this.schemaLayer = new SchemaLayer()

    // Choose adapter based on environment
    this.adapter = this.selectAdapter()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  /**
   * Reset singleton (for testing only)
   */
  public static resetInstance(): void {
    StorageManager.instance = null
  }

  /**
   * Select appropriate storage adapter
   */
  private selectAdapter(): BaseStorage {
    // Priority order:
    // 1. Electron Store (if available)
    // 2. LocalStorage (browser fallback)
    // 3. Memory Store (testing/fallback)

    const electronAdapter = new ElectronAdapter()
    if (electronAdapter.isAvailable()) {
      return electronAdapter
    }

    const localStorageAdapter = new LocalStorageAdapter()
    if (localStorageAdapter.isAvailable()) {
      return localStorageAdapter
    }

    // Fallback to memory storage
    return new MemoryAdapter()
  }

  /**
   * Initialize storage manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._initialize()
    await this.initPromise
  }

  private async _initialize(): Promise<void> {
    // 1. Initialize adapter
    if ('initialize' in this.adapter) {
      await (this.adapter as any).initialize()
    }

    // 2. Load cache from storage
    await this.cache.hydrate(this.adapter)

    // 3. Run migrations if needed
    await this.runMigrations()

    this.initialized = true
    this.initPromise = null

    // Dispatch ready event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-manager-ready'))
    }
  }

  /**
   * Wait for initialization
   */
  public async waitForReady(): Promise<void> {
    await this.initialize()
  }

  /**
   * Check if manager is ready
   */
  public isReady(): boolean {
    return this.initialized
  }

  /**
   * Set a value
   */
  public async set(key: string, value: unknown): Promise<void> {
    await this.waitForReady()

    // 1. Schema encoding
    const encoded = this.schemaLayer.encode(key, value)

    // 2. Update cache
    this.cache.set(key, encoded.value)

    // 3. Security check
    if (this.securityLayer.isSensitiveKey(key)) {
      // Use secure storage
      const secureAdapter = new SecureStoreAdapter()
      await secureAdapter.set(key, encoded.envelope)

      // Audit
      await this.auditLayer.record(key, 'set', 'success', {
        secure: true,
        schemaVersion: encoded.envelope.__meta.schemaVersion,
      })
    } else {
      // Use regular adapter
      await this.adapter.set(key, encoded.envelope)

      // Audit
      await this.auditLayer.record(key, 'set', 'success', {
        schemaVersion: encoded.envelope.__meta.schemaVersion,
      })
    }
  }

  /**
   * Get a value
   */
  public async get<T>(key: string, defaultValue: T): Promise<T> {
    await this.waitForReady()

    // 1. Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key, defaultValue)
    }

    // 2. Load from storage
    let rawValue: unknown

    if (this.securityLayer.isSensitiveKey(key)) {
      const secureAdapter = new SecureStoreAdapter()
      rawValue = await secureAdapter.get(key, null)
    } else {
      rawValue = await this.adapter.get(key, null)
    }

    if (rawValue === null || rawValue === undefined) {
      this.cache.set(key, defaultValue)
      return defaultValue
    }

    // 3. Decode and validate
    const decoded = this.schemaLayer.decode<T>(key, rawValue)

    // 4. Upgrade if needed
    if (decoded.shouldUpgrade) {
      const upgraded = this.schemaLayer.encode(key, decoded.value)
      this.cache.set(key, upgraded.value)

      // Save upgraded value
      if (this.securityLayer.isSensitiveKey(key)) {
        const secureAdapter = new SecureStoreAdapter()
        await secureAdapter.set(key, upgraded.envelope)
      } else {
        await this.adapter.set(key, upgraded.envelope)
      }

      await this.auditLayer.record(key, 'upgrade', 'success')
    } else {
      this.cache.set(key, decoded.value)
    }

    return decoded.value as T
  }

  /**
   * Remove a value
   */
  public async remove(key: string): Promise<void> {
    await this.waitForReady()

    // 1. Remove from cache
    this.cache.delete(key)

    // 2. Remove from storage
    if (this.securityLayer.isSensitiveKey(key)) {
      const secureAdapter = new SecureStoreAdapter()
      await secureAdapter.remove(key)
    } else {
      await this.adapter.remove(key)
    }

    // 3. Audit
    await this.auditLayer.record(key, 'remove', 'success')
  }

  /**
   * Clear all storage
   */
  public async clear(): Promise<void> {
    await this.waitForReady()

    // 1. Clear cache
    this.cache.clear()

    // 2. Clear adapters
    await this.adapter.clear()

    const secureAdapter = new SecureStoreAdapter()
    if (secureAdapter.isAvailable()) {
      await secureAdapter.clear()
    }

    // 3. Audit
    await this.auditLayer.record('*', 'clear', 'success')
  }

  /**
   * Synchronous get (for backward compatibility)
   */
  public getSync<T>(key: string, defaultValue: T): T {
    if (!this.initialized) {
      console.warn('StorageManager not initialized, returning default value')
      return defaultValue
    }

    return this.cache.get(key, defaultValue)
  }

  /**
   * Synchronous set (for backward compatibility)
   */
  public setSync(key: string, value: unknown): boolean {
    if (!this.initialized) {
      console.warn('StorageManager not initialized, cannot set value')
      return false
    }

    try {
      // Update cache
      this.cache.set(key, value)

      // Try sync set on adapter (if supported)
      return this.adapter.setSync(key, value)
    } catch (error) {
      console.error('Sync set failed:', error)
      return false
    }
  }

  /**
   * Flush cache to storage
   */
  public async flush(): Promise<void> {
    await this.waitForReady()

    const entries = this.cache.entries()

    for (const [key, value] of entries) {
      await this.set(key, value)
    }
  }

  /**
   * Run migrations
   */
  private async runMigrations(): Promise<void> {
    const runner = new MigrationRunner(this)
    await runner.run()
  }
}
```

**Rationale:**

- ✅ Singleton ensures single source of truth
- ✅ Lazy initialization (performance)
- ✅ Coordinates all layers
- ✅ Backward compatible sync methods
- ✅ Adapter selection based on environment

---

### 3. StorageCache

```typescript
/**
 * In-memory cache for faster access
 */
export class StorageCache {
  private cache: Map<string, unknown> = new Map()
  private hydrated: boolean = false

  /**
   * Load cache from storage adapter
   */
  public async hydrate(adapter: BaseStorage): Promise<void> {
    if (this.hydrated) {
      return
    }

    try {
      // Get all keys from adapter
      const keys = await adapter.keys()

      // Load all values
      for (const key of keys) {
        const value = await adapter.get(key, null)
        if (value !== null) {
          this.cache.set(key, value)
        }
      }

      this.hydrated = true
    } catch (error) {
      console.error('Failed to hydrate cache:', error)
      // Continue without cache
    }
  }

  /**
   * Set value in cache
   */
  public set(key: string, value: unknown): void {
    this.cache.set(key, this.cloneValue(value))
  }

  /**
   * Get value from cache
   */
  public get<T>(key: string, defaultValue: T): T {
    if (!this.cache.has(key)) {
      return defaultValue
    }

    const value = this.cache.get(key)
    return this.cloneValue(value) as T
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete key from cache
   */
  public delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.cache.clear()
  }

  /**
   * Get all entries
   */
  public entries(): [string, unknown][] {
    return Array.from(this.cache.entries())
  }

  /**
   * Deep clone value to prevent mutations
   */
  private cloneValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value
    }

    try {
      return JSON.parse(JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to clone value, returning as-is:', error)
      return value
    }
  }
}
```

**Rationale:**

- ✅ Fast in-memory access
- ✅ Prevents storage round-trips
- ✅ Deep cloning prevents mutations
- ✅ Simple and efficient

---

### 4. LegacyStorageAdapter (Backward Compatibility)

```typescript
/**
 * Adapter that wraps old storage.ts API
 * Provides 100% backward compatibility
 */
export class LegacyStorageAdapter {
  private manager: StorageManager

  constructor() {
    this.manager = StorageManager.getInstance()
  }

  /**
   * Old saveToStorage function
   */
  public async saveToStorage(key: string, data: unknown): Promise<void> {
    console.warn('⚠️ saveToStorage is deprecated. Use StorageManager.set() instead.')
    return this.manager.set(key, data)
  }

  /**
   * Old loadFromStorage function
   */
  public async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    console.warn('⚠️ loadFromStorage is deprecated. Use StorageManager.get() instead.')
    return this.manager.get(key, defaultValue)
  }

  /**
   * Old removeFromStorage function
   */
  public async removeFromStorage(key: string): Promise<void> {
    console.warn('⚠️ removeFromStorage is deprecated. Use StorageManager.remove() instead.')
    return this.manager.remove(key)
  }

  /**
   * Old clearAllStorage function
   */
  public async clearAllStorage(): Promise<void> {
    console.warn('⚠️ clearAllStorage is deprecated. Use StorageManager.clear() instead.')
    return this.manager.clear()
  }

  /**
   * Old waitForStorageReady function
   */
  public async waitForStorageReady(): Promise<void> {
    console.warn('⚠️ waitForStorageReady is deprecated. Use StorageManager.waitForReady() instead.')
    return this.manager.waitForReady()
  }

  /**
   * Old syncStorage function
   */
  public async syncStorage(): Promise<void> {
    console.warn('⚠️ syncStorage is deprecated. Use StorageManager.flush() instead.')
    return this.manager.flush()
  }

  /**
   * Old safeLocalStorage object
   */
  public get safeLocalStorage() {
    return {
      setItem: (key: string, value: unknown) => {
        console.warn('⚠️ safeLocalStorage.setItem is deprecated')
        return this.manager.setSync(key, value)
      },
      getItem: <T>(key: string, defaultValue: T) => {
        console.warn('⚠️ safeLocalStorage.getItem is deprecated')
        return this.manager.getSync(key, defaultValue)
      },
      removeItem: (key: string) => {
        console.warn('⚠️ safeLocalStorage.removeItem is deprecated')
        void this.manager.remove(key)
        return true
      },
      hasItem: (key: string) => {
        const value = this.manager.getSync(key, null)
        return value !== null
      },
    }
  }

  /**
   * Old asyncStorage object
   */
  public get asyncStorage() {
    return {
      setItem: async (key: string, value: unknown) => {
        console.warn('⚠️ asyncStorage.setItem is deprecated')
        return this.manager.set(key, value)
      },
      getItem: async <T>(key: string, defaultValue: T) => {
        console.warn('⚠️ asyncStorage.getItem is deprecated')
        return this.manager.get(key, defaultValue)
      },
      removeItem: async (key: string) => {
        console.warn('⚠️ asyncStorage.removeItem is deprecated')
        return this.manager.remove(key)
      },
      hasItem: async (key: string) => {
        const value = await this.manager.get(key, null)
        return value !== null
      },
    }
  }
}

// Create singleton instance
const legacyAdapter = new LegacyStorageAdapter()

// Export old API (backward compatible)
export const saveToStorage = legacyAdapter.saveToStorage.bind(legacyAdapter)
export const loadFromStorage = legacyAdapter.loadFromStorage.bind(legacyAdapter)
export const removeFromStorage = legacyAdapter.removeFromStorage.bind(legacyAdapter)
export const clearAllStorage = legacyAdapter.clearAllStorage.bind(legacyAdapter)
export const waitForStorageReady = legacyAdapter.waitForStorageReady.bind(legacyAdapter)
export const syncStorage = legacyAdapter.syncStorage.bind(legacyAdapter)
export const safeLocalStorage = legacyAdapter.safeLocalStorage
export const asyncStorage = legacyAdapter.asyncStorage
```

**Rationale:**

- ✅ 100% backward compatibility
- ✅ Deprecation warnings (gradual migration)
- ✅ Same API surface
- ✅ No breaking changes

---

## 📊 Migration Strategy

### Phase 1: Create New Architecture (Week 1)

1. ✅ Implement BaseStorage
2. ✅ Implement StorageManager
3. ✅ Implement Adapters
4. ✅ Implement Layers
5. ✅ Write comprehensive tests

### Phase 2: Add Backward Compatibility (Week 1)

1. ✅ Create LegacyStorageAdapter
2. ✅ Export old API from new index.ts
3. ✅ Add deprecation warnings
4. ✅ Test old code still works

### Phase 3: Update High-Priority Files (Week 2-3)

1. 🔴 pricingService.ts
2. 🔴 useProjects.ts
3. 🟡 backupManager.ts
4. 🟡 Other files (gradual)

### Phase 4: Remove Old API (Version N+2)

1. Remove LegacyStorageAdapter
2. Remove old exports
3. Breaking change - major version bump

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('StorageManager', () => {
  beforeEach(() => {
    StorageManager.resetInstance()
  })

  it('should be singleton', () => {
    const instance1 = StorageManager.getInstance()
    const instance2 = StorageManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should initialize once', async () => {
    const manager = StorageManager.getInstance()
    await manager.initialize()
    await manager.initialize() // Should not re-initialize
    expect(manager.isReady()).toBe(true)
  })

  it('should set and get values', async () => {
    const manager = StorageManager.getInstance()
    await manager.initialize()

    await manager.set('test-key', { foo: 'bar' })
    const value = await manager.get('test-key', null)

    expect(value).toEqual({ foo: 'bar' })
  })
})
```

### Integration Tests

```typescript
describe('Backward Compatibility', () => {
  it('should work with old API', async () => {
    // Use old API
    await saveToStorage('test-key', { foo: 'bar' })
    const value = await loadFromStorage('test-key', null)

    expect(value).toEqual({ foo: 'bar' })
  })

  it('should work with new API', async () => {
    // Use new API
    const manager = StorageManager.getInstance()
    await manager.set('test-key', { foo: 'bar' })
    const value = await manager.get('test-key', null)

    expect(value).toEqual({ foo: 'bar' })
  })

  it('should be interoperable', async () => {
    // Set with old API
    await saveToStorage('test-key', { foo: 'bar' })

    // Get with new API
    const manager = StorageManager.getInstance()
    const value = await manager.get('test-key', null)

    expect(value).toEqual({ foo: 'bar' })
  })
})
```

---

## 📝 Next Steps

### Immediate (Phase 2.1.3)

- [ ] Implement BaseStorage.ts
- [ ] Implement StorageManager.ts
- [ ] Implement StorageCache.ts
- [ ] Implement ElectronAdapter.ts
- [ ] Implement LocalStorageAdapter.ts
- [ ] Implement LegacyStorageAdapter.ts
- [ ] Write comprehensive tests (>80%)

### Short-term (Phase 2.1.4+)

- [ ] Extract ProjectsStorage module
- [ ] Extract PricingStorage module
- [ ] Update high-priority files
- [ ] Performance testing

---

**Status:** ✅ Design Complete  
**Ready for Implementation:** ✅ Yes  
**Estimated Implementation Time:** 3-4 days

---

**Created:** 16 October 2025 - 10:00 AM  
**Last Updated:** 16 October 2025 - 10:00 AM
