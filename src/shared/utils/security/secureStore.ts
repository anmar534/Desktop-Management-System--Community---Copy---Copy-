import type { StorageKey } from '@/shared/constants/storageKeys';

interface SecureStoreBridge {
  get: (key: string) => Promise<unknown | null>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

const memoryFallback = new Map<string, unknown>();
let fallbackWarned = false;

const cloneValue = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

const warnFallback = (): void => {
  if (fallbackWarned) return;
  fallbackWarned = true;
  if (typeof console !== 'undefined') {
    console.warn(
      '[secure-store] Running without Electron secure bridge. Values will be kept in-memory only (NOT encrypted).'
    );
  }
};

type ElectronSecureBridgeWindow = Window & {
  electronAPI?: {
    secureStore?: SecureStoreBridge;
    store?: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<void>;
      delete: (key: string) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
};

const getBridge = (): SecureStoreBridge | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as ElectronSecureBridgeWindow).electronAPI?.secureStore ?? null;
};

export const secureStore = {
  async set(key: StorageKey | string, value: unknown): Promise<void> {
    const bridge = getBridge();

    if (bridge) {
      await bridge.set(key, value);
      return;
    }

    warnFallback();
    memoryFallback.set(key, cloneValue(value));
  },

  async get<T>(key: StorageKey | string): Promise<T | undefined> {
    const bridge = getBridge();

    if (bridge) {
      const value = await bridge.get(key);
      if (value === null || value === undefined) {
        return undefined;
      }
      return value as T;
    }

    warnFallback();
    if (!memoryFallback.has(key)) {
      return undefined;
    }
    return cloneValue(memoryFallback.get(key)) as T;
  },

  async getOrDefault<T>(key: StorageKey | string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value ?? cloneValue(defaultValue);
  },

  async remove(key: StorageKey | string): Promise<void> {
    const bridge = getBridge();

    if (bridge) {
      await bridge.delete(key);
      return;
    }

    warnFallback();
    memoryFallback.delete(key);
  },

  async clear(): Promise<void> {
    const bridge = getBridge();

    if (bridge) {
      await bridge.clear();
      return;
    }

    warnFallback();
    memoryFallback.clear();
  },

  isAvailable(): boolean {
    return Boolean(getBridge());
  }
};

export type SecureStore = typeof secureStore;
