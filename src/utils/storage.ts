import { STORAGE_KEYS } from '../config/storageKeys';
import { secureStore } from './secureStore';
import {
  decodeStoredValue,
  encodeValueForStorage,
  cloneValue as clonePersistedValue,
  getSchemaVersionForKey,
  isPersistedEnvelope
} from './storageSchema';
import { recordAuditEvent } from './auditLog';

export { STORAGE_KEYS } from '../config/storageKeys';

// Analytics-specific storage utilities
export interface AnalyticsStorageOptions {
  enableIndexing?: boolean;
  enableCaching?: boolean;
  maxCacheSize?: number;
  compressionLevel?: 'none' | 'low' | 'high';
}

export const STORAGE_READY_EVENT = 'system-storage-ready';

type PersistedValue = unknown;

type StoreMethod<TArgs extends unknown[], TResult> = ((...args: TArgs) => Promise<TResult> | TResult) | undefined;

interface ElectronStore {
  set?: (key: string, value: string) => Promise<void> | void;
  get?: (key: string) => Promise<string | null | undefined> | string | null | undefined;
  delete?: (key: string) => Promise<void> | void;
  clear?: () => Promise<void> | void;
}

interface LifecycleAckPayload {
  id: string;
  status: string;
  details?: Record<string, unknown> | null;
  elapsedMs?: number;
}

interface ElectronAPI {
  store?: ElectronStore;
  secureStore?: {
    get?: (key: string) => Promise<unknown | null>;
    set?: (key: string, value: unknown) => Promise<void>;
    delete?: (key: string) => Promise<void>;
    clear?: () => Promise<void>;
  };
  on?: (channel: string, callback: (event: unknown, payload: unknown) => void) => void;
  removeListener?: (channel: string, callback: (event: unknown, payload: unknown) => void) => void;
  send?: (channel: string, data?: unknown) => void;
  lifecycle?: {
    ack?: (payload: LifecycleAckPayload) => Promise<void>;
  };
}

type ElectronWindow = Window & {
  electronAPI?: ElectronAPI;
  __STORAGE_FALLBACK_WARNED__?: boolean;
  __STORAGE_LIFECYCLE_BOUND__?: boolean;
};

const localCache = new Map<string, PersistedValue>();
let cacheInitialized = false;
let resolveReady: (() => void) | null = null;

const storageReadyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

const SENSITIVE_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.BANK_ACCOUNTS,
  STORAGE_KEYS.PRICING_DATA,
  STORAGE_KEYS.PRICING_OFFICIAL,
  STORAGE_KEYS.PRICING_DRAFT,
  STORAGE_KEYS.PRICING_SNAPSHOTS,
  STORAGE_KEYS.TENDER_BACKUPS,
  STORAGE_KEYS.TENDER_STATS,
  STORAGE_KEYS.BOQ_DATA,
  STORAGE_KEYS.TENDER_PRICING_WIZARDS,
  STORAGE_KEYS.PROJECT_COST_ENVELOPES,
  STORAGE_KEYS.COST_VARIANCE_CONFIG,
  STORAGE_KEYS.COST_VARIANCE_CACHE,
  STORAGE_KEYS.FINANCIAL_INVOICES,
  STORAGE_KEYS.FINANCIAL_BUDGETS,
  STORAGE_KEYS.FINANCIAL_REPORTS,
  STORAGE_KEYS.SECURITY_AUDIT_LOG
]);

const isSensitiveKey = (key: string): boolean => SENSITIVE_STORAGE_KEYS.has(key);

const shouldLog = (key: string): boolean => {
  if (key === STORAGE_KEYS.PRICING_DATA) return false;
  if (key.startsWith('backup-tender-pricing-')) return false;
  return true;
};

const reportAudit = async (
  key: string,
  action: 'set' | 'remove' | 'clear' | 'migrate' | 'upgrade-failed',
  status: 'success' | 'error' | 'skipped',
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await recordAuditEvent({
      category: 'storage',
      action,
      key,
      status,
      origin: isElectron() ? 'renderer' : 'browser',
      level: status === 'error' ? 'error' : 'info',
      metadata
    });
  } catch (error) {
    console.warn('⚠️ Failed to write audit event:', error);
  }
};

export type StorageMigrationAction = 'skipped' | 'noop' | 'upgraded' | 'removed-invalid';

export interface StorageMigrationEntry {
  key: string;
  action: StorageMigrationAction;
  beforeVersion: number | null;
  afterVersion: number | null;
  details?: string;
}

export interface StorageMigrationFailure {
  key: string;
  error: string;
}

export interface StorageMigrationReport {
  startedAt: string;
  finishedAt: string;
  entries: StorageMigrationEntry[];
  failures: StorageMigrationFailure[];
}

export interface StorageMigrationOptions {
  keys?: string[];
}

export interface StorageFlushEntry {
  key: string;
  target: 'secure' | 'electron' | 'browser';
  status: 'success' | 'skipped' | 'error';
  error?: string;
}

export interface StorageFlushStats {
  total: number;
  persisted: number;
  skipped: number;
  errors: number;
  secure: number;
  electron: number;
  browser: number;
}

export interface StorageFlushReport {
  startedAt: string;
  finishedAt: string;
  entries: StorageFlushEntry[];
  stats: StorageFlushStats;
}

const extractSchemaVersion = (value: unknown): number | null => {
  if (isPersistedEnvelope(value)) {
    const version = value.__meta.schemaVersion;
    return typeof version === 'number' ? version : null;
  }
  return null;
};

const getElectronWindow = (): ElectronWindow | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window as ElectronWindow;
};

const getElectronAPI = (): ElectronAPI | undefined => getElectronWindow()?.electronAPI;

const hasElectronStore = (api: ElectronAPI | undefined): api is ElectronAPI & { store: ElectronStore } =>
  Boolean(api?.store && typeof api.store.get === 'function');

const isElectron = (): boolean => hasElectronStore(getElectronAPI());

const toJsonString = (value: PersistedValue): string => {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

const parseStoredValue = (value: unknown): PersistedValue => {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  try {
    return JSON.parse(value) as PersistedValue;
  } catch {
    return value;
  }
};

const awaitResult = async <TArgs extends unknown[], TResult>(
  method: StoreMethod<TArgs, TResult>,
  ...args: TArgs
): Promise<TResult | undefined> => {
  if (!method) return undefined;
  const result = method(...args);
  return result instanceof Promise ? await result : result;
};

class ElectronStoreInterface {
  constructor() {
    void this.init();

    const electronWindow = getElectronWindow();
    if (electronWindow && !isElectron() && !electronWindow.__STORAGE_FALLBACK_WARNED__) {
      electronWindow.__STORAGE_FALLBACK_WARNED__ = true;
      console.info(
        '[storage] Browser fallback mode: using localStorage only. Electron persistent data will NOT be reflected here. Desktop app is the primary source of truth.'
      );
    }
  }

  private async init(): Promise<void> {
    if (!isElectron()) {
      cacheInitialized = true;
      if (resolveReady) {
        resolveReady();
        resolveReady = null;
      }
      return;
    }

    await this.loadCacheFromStore();
  }

  private async loadCacheFromStore(options: { reset?: boolean; dispatchEvent?: boolean } = {}): Promise<void> {
    const { reset = false, dispatchEvent = true } = options;
    const wasInitialized = cacheInitialized;

    const api = getElectronAPI();
    if (!hasElectronStore(api)) {
      cacheInitialized = true;
      if (resolveReady) {
        resolveReady();
        resolveReady = null;
      }

      if (dispatchEvent) {
        const electronWindow = getElectronWindow();
        if (electronWindow) {
          electronWindow.dispatchEvent(new CustomEvent(STORAGE_READY_EVENT));
        }
      }

      return;
    }

    try {
      if (reset) {
        localCache.clear();
      }

      for (const key of Object.values(STORAGE_KEYS)) {
        if (isSensitiveKey(key)) {
          try {
            let secureValue = await secureStore.get<unknown>(key);
            if (secureValue === undefined) {
              const legacyValue = await this.getElectronValue(key);

              if (legacyValue !== null && legacyValue !== undefined) {
                const legacyDecoded = decodeStoredValue<unknown>(key, legacyValue);

                if (legacyDecoded.value !== undefined) {
                  const encoded = encodeValueForStorage(key, legacyDecoded.value);
                  try {
                    await secureStore.set(key, encoded.envelope);
                    secureValue = encoded.envelope;
                    localCache.set(key, clonePersistedValue(encoded.value));
                    void reportAudit(key, 'migrate', 'success', {
                      outcome: 'moved-from-electron',
                      from: 'electron-store'
                    });
                  } catch (error) {
                    console.error(`❌ Failed to migrate ${key} to SecureStore:`, error);
                  }

                  try {
                    await this.deleteElectronValue(key);
                  } catch (error) {
                    console.warn(`⚠️ Failed to remove legacy electron-store value for ${key}:`, error);
                  }
                } else if (legacyDecoded.shouldPersist) {
                  try {
                    await this.deleteElectronValue(key);
                  } catch (error) {
                    console.warn(`⚠️ Failed to clear invalid legacy value for ${key}:`, error);
                  }
                }
              }

              if (secureValue === undefined) {
                continue;
              }
            }

            const decoded = decodeStoredValue<unknown>(key, secureValue);
            if (decoded.value !== undefined) {
              localCache.set(key, clonePersistedValue(decoded.value));
            }

            if (decoded.shouldPersist && decoded.value !== undefined) {
              const encoded = encodeValueForStorage(key, decoded.value);
              localCache.set(key, clonePersistedValue(encoded.value));
              try {
                await secureStore.set(key, encoded.envelope);
              } catch (error) {
                console.error(`❌ Failed to upgrade secure value for ${key}:`, error);
              }
            }
          } catch (error) {
            console.error(`❌ Failed to hydrate secure cache for ${key}:`, error);
          }
          continue;
        }

        const value = await this.getElectronValue(key);
        if (value === null || value === undefined) {
          continue;
        }

        const decoded = decodeStoredValue<unknown>(key, value);
        if (decoded.value !== undefined) {
          localCache.set(key, clonePersistedValue(decoded.value));
        }

        if (decoded.shouldPersist && decoded.value !== undefined) {
          const encoded = encodeValueForStorage(key, decoded.value);
          localCache.set(key, clonePersistedValue(encoded.value));
          try {
            await this.setElectronValue(key, encoded.envelope);
          } catch (error) {
            console.error(`❌ Failed to upgrade electron-store value for ${key}:`, error);
          }
        }
      }

      cacheInitialized = true;
      if (!wasInitialized && resolveReady) {
        resolveReady();
        resolveReady = null;
      }

      if (dispatchEvent) {
        const electronWindow = getElectronWindow();
        if (electronWindow) {
          electronWindow.dispatchEvent(new CustomEvent(STORAGE_READY_EVENT));
        }
      }

      console.log('✅ Local cache initialized with electron-store data');
    } catch (error) {
      console.error('❌ Failed to initialize cache:', error);
    }
  }

  private async setElectronValue(key: string, value: PersistedValue): Promise<void> {
    const api = getElectronAPI();
    if (!hasElectronStore(api)) return;

    const serialized = toJsonString(value);
    await awaitResult(api.store.set?.bind(api.store), key, serialized);
  }

  private async getElectronValue(key: string): Promise<PersistedValue | null> {
    const api = getElectronAPI();
    if (!hasElectronStore(api)) return null;

    try {
      const raw = await awaitResult(api.store.get?.bind(api.store), key);
      if (raw === null || raw === undefined) {
        return null;
      }
      return parseStoredValue(raw);
    } catch (error) {
      console.error(`Error reading electron-store for ${key}:`, error);
      return null;
    }
  }

  private async deleteElectronValue(key: string): Promise<void> {
    const api = getElectronAPI();
    if (!hasElectronStore(api)) return;

    await awaitResult(api.store.delete?.bind(api.store), key);
  }

  private async clearElectronStore(): Promise<void> {
    const api = getElectronAPI();
    if (!hasElectronStore(api)) return;

    await awaitResult(api.store.clear?.bind(api.store));
  }

  async set(key: string, value: PersistedValue): Promise<void> {
    const encoded = encodeValueForStorage(key, value);
    localCache.set(key, clonePersistedValue(encoded.value));

    if (isSensitiveKey(key)) {
      try {
        await secureStore.set(key, encoded.envelope);
        void reportAudit(key, 'set', 'success', {
          schemaVersion: encoded.envelope.__meta.schemaVersion,
          payloadSize: Array.isArray(encoded.value) ? encoded.value.length : undefined
        });
      } catch (error) {
        console.error(`❌ Failed to store sensitive key ${key} in SecureStore:`, error);
        void reportAudit(key, 'set', 'error', {
          reason: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
      return;
    }

    if (!isElectron()) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(key, toJsonString(encoded.envelope));
        } catch (error) {
          console.error(`❌ Failed to save ${key} to localStorage:`, error);
        }
      }
      return;
    }

    try {
      await this.setElectronValue(key, encoded.envelope);
      if (shouldLog(key)) {
        console.log(`✅ Saved to electron-store: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Failed to save ${key}:`, error);
      throw error;
    }
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    if (isSensitiveKey(key)) {
      try {
        const secureValue = await secureStore.get<unknown>(key);
        if (secureValue === undefined) {
          const fallback = clonePersistedValue(defaultValue);
          localCache.set(key, fallback);
          return clonePersistedValue(fallback);
        }

        const decoded = decodeStoredValue<T>(key, secureValue);

        if (decoded.value === undefined) {
          const fallback = clonePersistedValue(defaultValue);
          localCache.set(key, fallback);

          if (decoded.shouldPersist) {
            const encoded = encodeValueForStorage<T>(key, fallback);
            try {
              await secureStore.set(key, encoded.envelope);
              void reportAudit(key, 'set', 'success', {
                schemaVersion: encoded.envelope.__meta.schemaVersion,
                upgrade: true,
                appliedFallback: true
              });
            } catch (error) {
              console.error(`❌ Failed to persist default value for sensitive key ${key}:`, error);
              void reportAudit(key, 'set', 'error', {
                reason: error instanceof Error ? error.message : String(error),
                during: 'persist-default'
              });
            }
          }

          return clonePersistedValue(fallback);
        }

        let result = decoded.value as T;

        if (decoded.shouldPersist) {
          const encoded = encodeValueForStorage<T>(key, result);
          localCache.set(key, clonePersistedValue(encoded.value));

          try {
            await secureStore.set(key, encoded.envelope);
            void reportAudit(key, 'set', 'success', {
              schemaVersion: encoded.envelope.__meta.schemaVersion,
              upgrade: true
            });
          } catch (error) {
            console.error(`❌ Failed to upgrade sensitive key ${key}:`, error);
            void reportAudit(key, 'set', 'error', {
              reason: error instanceof Error ? error.message : String(error),
              during: 'upgrade-existing'
            });
          }

          result = encoded.value;
        } else {
          localCache.set(key, clonePersistedValue(result));
        }

        return clonePersistedValue(result);
      } catch (error) {
        console.error(`❌ Failed to read sensitive key ${key} from SecureStore:`, error);
        void reportAudit(key, 'set', 'error', {
          reason: error instanceof Error ? error.message : String(error),
          during: 'read'
        });
        return defaultValue;
      }
    }

    if (!isElectron()) {
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            const parsed = parseStoredValue(raw);
            const decoded = decodeStoredValue<T>(key, parsed);

            if (decoded.value !== undefined) {
              let result = decoded.value as T;

              if (decoded.shouldPersist) {
                const encoded = encodeValueForStorage<T>(key, result);
                try {
                  localStorage.setItem(key, toJsonString(encoded.envelope));
                } catch (error) {
                  console.error(`❌ Failed to save ${key} to localStorage:`, error);
                }
                result = encoded.value;
              }

              const cacheValue = clonePersistedValue(result);
              localCache.set(key, cacheValue);
              return clonePersistedValue(cacheValue);
            }

            if (decoded.shouldPersist) {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.warn(`⚠️ Failed to clear invalid localStorage value for ${key}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Failed to read ${key} from localStorage:`, error);
        }
      }

      const fallback = clonePersistedValue(defaultValue);
      localCache.set(key, fallback);
      return clonePersistedValue(fallback);
    }

    try {
      const value = await this.getElectronValue(key);
      if (shouldLog(key)) {
        console.log(`📖 Read from electron-store: ${key}`);
      }

      if (value === null || value === undefined) {
        const fallback = clonePersistedValue(defaultValue);
        localCache.set(key, fallback);
        return clonePersistedValue(fallback);
      }

      const decoded = decodeStoredValue<T>(key, value);

      if (decoded.value === undefined) {
        if (decoded.shouldPersist) {
          try {
            await this.deleteElectronValue(key);
          } catch (error) {
            console.error(`❌ Failed to delete invalid value for ${key}:`, error);
          }
        }

        const fallback = clonePersistedValue(defaultValue);
        localCache.set(key, fallback);
        return clonePersistedValue(fallback);
      }

      let result = decoded.value as T;

      if (decoded.shouldPersist) {
        const encoded = encodeValueForStorage<T>(key, result);
        localCache.set(key, clonePersistedValue(encoded.value));

        try {
          await this.setElectronValue(key, encoded.envelope);
        } catch (error) {
          console.error(`❌ Failed to upgrade ${key} to latest schema:`, error);
        }

        result = encoded.value;
      } else {
        localCache.set(key, clonePersistedValue(result));
      }

      return clonePersistedValue(result);
    } catch (error) {
      console.error(`❌ Failed to read ${key}:`, error);
      return defaultValue;
    }
  }

  getSync<T>(key: string, defaultValue: T): T {
    if (!cacheInitialized && isElectron()) {
      console.warn(`⚠️ Cache not initialized for ${key}, using default value`);
      return clonePersistedValue(defaultValue);
    }

    if (localCache.has(key)) {
      const cached = localCache.get(key) as T;
      return clonePersistedValue(cached);
    }

    return clonePersistedValue(defaultValue);
  }

  setSync(key: string, value: PersistedValue): boolean {
    try {
      const encoded = encodeValueForStorage(key, value);
      localCache.set(key, clonePersistedValue(encoded.value));
      void this.set(key, encoded.value);
      return true;
    } catch (error) {
      console.error(`❌ Failed to sync set ${key}:`, error);
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    localCache.delete(key);

    if (isSensitiveKey(key)) {
      try {
        await secureStore.remove(key);
        void reportAudit(key, 'remove', 'success');
      } catch (error) {
        console.error(`❌ Failed to remove sensitive key ${key} from SecureStore:`, error);
        void reportAudit(key, 'remove', 'error', {
          reason: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
      return;
    }

    if (!isElectron()) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`❌ Failed to remove ${key} from localStorage:`, error);
        }
      }
      return;
    }

    try {
      await this.deleteElectronValue(key);
      if (shouldLog(key)) {
        console.log(`🗑️ Deleted from electron-store: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${key}:`, error);
      throw error;
    }
  }

  private async migrateElectronKey(key: string): Promise<StorageMigrationEntry> {
    const value = await this.getElectronValue(key);

    if (value === null || value === undefined) {
      localCache.delete(key);
      return {
        key,
        action: 'skipped',
        beforeVersion: null,
        afterVersion: null,
        details: 'No persisted value'
      };
    }

    const beforeVersion = extractSchemaVersion(value);
    const decoded = decodeStoredValue<unknown>(key, value);

    if (decoded.value === undefined) {
      localCache.delete(key);

      if (decoded.shouldPersist) {
        await this.deleteElectronValue(key);
        return {
          key,
          action: 'removed-invalid',
          beforeVersion,
          afterVersion: null,
          details: 'Invalid value cleared from electron-store'
        };
      }

      return {
        key,
        action: 'skipped',
        beforeVersion,
        afterVersion: beforeVersion,
        details: 'Invalid value ignored'
      };
    }

    if (decoded.shouldPersist) {
      const encoded = encodeValueForStorage(key, decoded.value);
      await this.setElectronValue(key, encoded.envelope);
      localCache.set(key, clonePersistedValue(encoded.value));

      return {
        key,
        action: 'upgraded',
        beforeVersion,
        afterVersion: encoded.envelope.__meta.schemaVersion,
        details: 'Value re-encoded with latest schema'
      };
    }

    localCache.set(key, clonePersistedValue(decoded.value));

    return {
      key,
      action: 'noop',
      beforeVersion,
      afterVersion: beforeVersion ?? getSchemaVersionForKey(key),
      details: 'Value already compliant'
    };
  }

  private async migrateSensitiveKey(key: string): Promise<StorageMigrationEntry> {
    const secureValue = await secureStore.get<unknown>(key);

    if (secureValue === undefined) {
      localCache.delete(key);
      void reportAudit(key, 'migrate', 'skipped', { reason: 'no-secure-payload' });
      return {
        key,
        action: 'skipped',
        beforeVersion: null,
        afterVersion: null,
        details: 'No secure payload stored'
      };
    }

    const beforeVersion = extractSchemaVersion(secureValue);
    const decoded = decodeStoredValue<unknown>(key, secureValue);

    if (decoded.value === undefined) {
      localCache.delete(key);

      if (decoded.shouldPersist) {
        await secureStore.remove(key);
        void reportAudit(key, 'migrate', 'success', {
          outcome: 'removed-invalid'
        });
        return {
          key,
          action: 'removed-invalid',
          beforeVersion,
          afterVersion: null,
          details: 'Invalid secure payload removed'
        };
      }

      return {
        key,
        action: 'skipped',
        beforeVersion,
        afterVersion: beforeVersion,
        details: 'Invalid secure payload ignored'
      };
    }

    if (decoded.shouldPersist) {
      const encoded = encodeValueForStorage(key, decoded.value);
      await secureStore.set(key, encoded.envelope);
      localCache.set(key, clonePersistedValue(encoded.value));

      void reportAudit(key, 'migrate', 'success', {
        outcome: 'upgraded',
        fromVersion: beforeVersion,
        toVersion: encoded.envelope.__meta.schemaVersion
      });

      return {
        key,
        action: 'upgraded',
        beforeVersion,
        afterVersion: encoded.envelope.__meta.schemaVersion,
        details: 'Secure payload re-encoded with latest schema'
      };
    }

    localCache.set(key, clonePersistedValue(decoded.value));

    void reportAudit(key, 'migrate', 'success', {
      outcome: 'noop',
      version: beforeVersion ?? getSchemaVersionForKey(key)
    });

    return {
      key,
      action: 'noop',
      beforeVersion,
      afterVersion: beforeVersion ?? getSchemaVersionForKey(key),
      details: 'Secure payload already compliant'
    };
  }

  private async persistCachedEntry(key: string, cachedValue: PersistedValue): Promise<StorageFlushEntry> {
    const target: StorageFlushEntry['target'] = isSensitiveKey(key) ? 'secure' : isElectron() ? 'electron' : 'browser';

    if (cachedValue === undefined) {
      return {
        key,
        target,
        status: 'skipped',
        error: 'no-cached-value'
      };
    }

    try {
      const normalized = clonePersistedValue(cachedValue);
      const encoded = encodeValueForStorage(key, normalized);

      if (target === 'secure') {
        await secureStore.set(key, encoded.envelope);
      } else if (target === 'electron') {
        await this.setElectronValue(key, encoded.envelope);
      } else {
        if (typeof localStorage === 'undefined') {
          return {
            key,
            target,
            status: 'skipped',
            error: 'local-storage-unavailable'
          };
        }
        localStorage.setItem(key, toJsonString(encoded.envelope));
      }

      return {
        key,
        target,
        status: 'success'
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (isSensitiveKey(key)) {
        void reportAudit(key, 'set', 'error', {
          reason,
          during: 'lifecycle-flush'
        });
      }

      return {
        key,
        target,
        status: 'error',
        error: reason
      };
    }
  }

  async flushCacheToPersistentStorage(): Promise<StorageFlushReport> {
    const startedAt = new Date().toISOString();
    const entries: StorageFlushEntry[] = [];
    const stats: StorageFlushStats = {
      total: 0,
      persisted: 0,
      skipped: 0,
      errors: 0,
      secure: 0,
      electron: 0,
      browser: 0
    };

    for (const [key, cachedValue] of Array.from(localCache.entries())) {
      const entry = await this.persistCachedEntry(key, cachedValue);
      entries.push(entry);

      stats.total += 1;
      if (entry.status === 'success') {
        stats.persisted += 1;
        stats[entry.target] += 1;
      } else if (entry.status === 'skipped') {
        stats.skipped += 1;
      } else if (entry.status === 'error') {
        stats.errors += 1;
        stats[entry.target] += 1;
      }
    }

    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      entries,
      stats
    };
  }

  async refreshCacheFromPersistentStorage(): Promise<void> {
    await this.loadCacheFromStore({ reset: true, dispatchEvent: true });
  }

  async migrate(options?: StorageMigrationOptions): Promise<StorageMigrationReport> {
    const startedAt = new Date().toISOString();
    const entries: StorageMigrationEntry[] = [];
    const failures: StorageMigrationFailure[] = [];

    const targetKeys = options?.keys?.length ? options.keys : Object.values(STORAGE_KEYS);

    for (const key of targetKeys) {
      try {
        const entry = isSensitiveKey(key)
          ? await this.migrateSensitiveKey(key)
          : await this.migrateElectronKey(key);

        entries.push(entry);
      } catch (error) {
        failures.push({ key, error: error instanceof Error ? error.message : String(error) });
        void reportAudit(key, 'migrate', 'error', {
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      entries,
      failures
    };
  }

  async clear(): Promise<void> {
    localCache.clear();

    try {
      await secureStore.clear();
      void reportAudit(STORAGE_KEYS.SECURITY_AUDIT_LOG, 'clear', 'success');
    } catch (error) {
      console.error('❌ Failed to clear SecureStore values:', error);
      void reportAudit(STORAGE_KEYS.SECURITY_AUDIT_LOG, 'clear', 'error', {
        reason: error instanceof Error ? error.message : String(error)
      });
    }

    if (!isElectron()) {
      console.warn('⚠️ Not in Electron environment');
      return;
    }

    try {
      await this.clearElectronStore();
      console.log('🧹 Cleared all electron-store data');
    } catch (error) {
      console.error('❌ Failed to clear electron-store:', error);
      throw error;
    }
  }
}

const storeInterface = new ElectronStoreInterface();

export const runStorageMigrations = async (
  options?: StorageMigrationOptions
): Promise<StorageMigrationReport> => {
  return await storeInterface.migrate(options);
};

export const saveToStorage = async (key: string, data: PersistedValue): Promise<void> => {
  await storeInterface.set(key, data);
};

export const loadFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  return await storeInterface.get(key, defaultValue);
};

export const removeFromStorage = async (key: string): Promise<void> => {
  await storeInterface.remove(key);
};

export const clearAllStorage = async (): Promise<void> => {
  await storeInterface.clear();
};

export const syncStorage = async (): Promise<void> => {
  const timestamp = new Date().toISOString();
  console.log(`🔄 [${timestamp}] Storage sync requested...`);

  if (!isElectron()) {
    console.log(`❌ [${timestamp}] Not in Electron environment`);
    return;
  }

  console.log(`✅ [${timestamp}] Using electron-store only (legacy migration removed)`);
};

export const waitForStorageReady = async (): Promise<void> => {
  await storageReadyPromise;
};

export const prepareStorageForSuspend = async (): Promise<StorageFlushReport> => {
  await storageReadyPromise;
  return await storeInterface.flushCacheToPersistentStorage();
};

export const resumeStorageAfterSuspend = async (): Promise<void> => {
  await storeInterface.refreshCacheFromPersistentStorage();
};

const LIFECYCLE_EVENT_CHANNEL = 'system-lifecycle';

const fallbackLifecycleAckId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }

  return `lifecycle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sendLifecycleAck = async (payload: LifecycleAckPayload): Promise<void> => {
  const api = getElectronAPI();
  const ack = api?.lifecycle?.ack;

  if (typeof ack !== 'function') {
    return;
  }

  try {
    await ack(payload);
  } catch (error) {
    console.warn('[storage] Failed to send lifecycle ack:', error);
  }
};

const registerLifecycleBridge = (): void => {
  const electronWindow = getElectronWindow();
  if (!electronWindow) {
    return;
  }

  if (electronWindow.__STORAGE_LIFECYCLE_BOUND__) {
    return;
  }

  const api = electronWindow.electronAPI;
  if (!api || typeof api.on !== 'function') {
    return;
  }

  const handler = async (_event: unknown, rawPayload: unknown) => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const payload = (rawPayload && typeof rawPayload === 'object' ? rawPayload : {}) as Record<string, unknown>;

    const id = typeof payload.id === 'string' && payload.id.trim() !== '' ? payload.id : fallbackLifecycleAckId();
    const action = typeof payload.action === 'string' ? payload.action : 'unknown';
    const reason = typeof payload.reason === 'string' ? payload.reason : undefined;
    const source = typeof payload.source === 'string' ? payload.source : undefined;

    const details: Record<string, unknown> = { action };
    if (source) {
      details.source = source;
    }
    if (reason) {
      details.reason = reason;
    }

    let status = 'ignored';

    try {
      if (action === 'prepare-suspend' || action === 'prepare-before-quit' || action === 'prepare-shutdown') {
        const report = await prepareStorageForSuspend();
        status = 'flushed';
        details.persisted = report.stats.persisted;
        details.errors = report.stats.errors;
      } else if (action === 'resume') {
        await resumeStorageAfterSuspend();
        status = 'resumed';
      } else {
        status = 'unknown-action';
      }
    } catch (error) {
      status = 'error';
      details.error = error instanceof Error ? error.message : String(error);
    } finally {
      const finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsedMsRaw = finishedAt - startedAt;
      const elapsedMs = Number.isFinite(elapsedMsRaw) ? Math.max(0, Math.round(elapsedMsRaw)) : undefined;

      await sendLifecycleAck({
        id,
        status,
        details,
        elapsedMs
      });
    }
  };

  api.on(LIFECYCLE_EVENT_CHANNEL, handler);
  electronWindow.__STORAGE_LIFECYCLE_BOUND__ = true;
};

if (typeof window !== 'undefined') {
  const scheduler = typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (cb: () => void) => {
        void Promise.resolve().then(cb);
      };

  scheduler(registerLifecycleBridge);
}

let legacyGuardInstalled = false;

export function installLegacyStorageGuard(): void {
  if (legacyGuardInstalled) return;
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const unifiedKeys = new Set<string>(Object.values(STORAGE_KEYS));
  const legacyKeys = new Set<string>([
    'app_tenders',
    'app_tenders_list',
    'tenders',
    'construction_tenders',
    'construction_app_tenders',
    'app_tenders_old',
    'app_projects',
    'projects',
    'construction_projects',
    'construction_app_projects',
    'app_projects_old',
    'app_clients',
    'clients',
    'construction_clients',
    'construction_app_clients',
    'app_clients_old',
    'pricing',
    'tender_pricing',
    'app_pricing',
    'construction_app_pricing'
  ]);

  const isLegacyKey = (key: string): boolean =>
    unifiedKeys.has(key) || legacyKeys.has(key) || key.startsWith('construction_app_');

  const warnedKeys = new Set<string>();
  const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

  const logOnce = (key: string, action: 'read' | 'write' | 'remove'): void => {
    if (isProd) return;
    if (warnedKeys.has(key)) return;
    warnedKeys.add(key);
    console.debug(`⚠️ Legacy storage access attempted: ${key} (${action}). Access is deprecated and blocked.`);
  };

  const storagePrototype = Object.getPrototypeOf(localStorage) as Storage | null;
  const target: Storage = storagePrototype ?? localStorage;

  const originalSetItem = target.setItem.bind(localStorage);
  const originalGetItem = target.getItem.bind(localStorage);
  const originalRemoveItem = target.removeItem.bind(localStorage);

  try {
    Object.defineProperty(target, 'setItem', {
      configurable: true,
      writable: true,
      value(this: Storage, key: string, value: string) {
        if (isLegacyKey(key)) {
          logOnce(key, 'write');
          return;
        }
        originalSetItem.call(this, key, value);
      }
    });

    Object.defineProperty(target, 'getItem', {
      configurable: true,
      writable: true,
      value(this: Storage, key: string) {
        if (isLegacyKey(key)) {
          logOnce(key, 'read');
          return null;
        }
        return originalGetItem.call(this, key);
      }
    });

    Object.defineProperty(target, 'removeItem', {
      configurable: true,
      writable: true,
      value(this: Storage, key: string) {
        if (isLegacyKey(key)) {
          logOnce(key, 'remove');
          return;
        }
        originalRemoveItem.call(this, key);
      }
    });
  } catch (error) {
    console.warn('⚠️ Failed to install legacy storage guard:', error);
  }

  legacyGuardInstalled = true;
}

export function isStorageReady(): boolean {
  return !isElectron() || cacheInitialized;
}

export function whenStorageReady(): Promise<void> {
  if (isStorageReady()) {
    return Promise.resolve();
  }
  return storageReadyPromise;
}

export const safeLocalStorage = {
  setItem: (key: string, value: PersistedValue): boolean => storeInterface.setSync(key, value),
  getItem: <T>(key: string, defaultValue: T): T => storeInterface.getSync(key, defaultValue),
  removeItem: (key: string): boolean => {
    try {
      void storeInterface.remove(key);
      return true;
    } catch {
      return false;
    }
  },
  hasItem: (key: string): boolean => {
    const value = storeInterface.getSync<unknown | null>(key, null);
    return value !== null && value !== undefined;
  }
};

export const asyncStorage = {
  setItem: async (key: string, value: PersistedValue): Promise<void> => {
    await saveToStorage(key, value);
  },
  getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
    return await loadFromStorage(key, defaultValue);
  },
  removeItem: async (key: string): Promise<void> => {
    await removeFromStorage(key);
  },
  hasItem: async (key: string): Promise<boolean> => {
    const value = await loadFromStorage<unknown | null>(key, null);
    return value !== null && value !== undefined;
  }
};

export default safeLocalStorage;
