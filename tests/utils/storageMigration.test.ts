import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BOQData } from '@/types/boq';

const createWindowStub = () => {
  const storeMap = new Map<string, unknown>();
  const secureMap = new Map<string, unknown>();

  const store = {
    get: (key: string) => storeMap.get(key),
    set: (key: string, value: unknown) => {
      storeMap.set(key, value);
    },
    delete: (key: string) => {
      storeMap.delete(key);
    },
    clear: () => {
      storeMap.clear();
    }
  };

  const secureStore = {
    get: async (key: string) => (secureMap.has(key) ? secureMap.get(key) : null),
    set: async (key: string, value: unknown) => {
      secureMap.set(key, value);
    },
    delete: async (key: string) => {
      secureMap.delete(key);
    },
    clear: async () => {
      secureMap.clear();
    }
  };

  return {
    storeMap,
    secureMap,
    windowStub: {
      electronAPI: {
        store,
        secureStore
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true
    } as unknown as Window & { electronAPI: { store: typeof store; secureStore: typeof secureStore } }
  };
};

describe('runStorageMigrations', () => {
  beforeEach(() => {
    vi.resetModules();
    (globalThis as unknown as { CustomEvent?: typeof CustomEvent }).CustomEvent =
      class {
        type: string;
        detail: unknown;

        constructor(type: string, init?: CustomEventInit) {
          this.type = type;
          this.detail = init?.detail;
        }
      } as unknown as typeof CustomEvent;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  it('upgrades legacy project envelopes in electron-store', async () => {
    const { storeMap, windowStub } = createWindowStub();
    (globalThis as unknown as { window?: Window }).window = windowStub;

    const { STORAGE_KEYS, runStorageMigrations } = await import('../../src/utils/storage');

    const legacyPayload = {
      __meta: { schemaVersion: 1, storedAt: new Date().toISOString() },
      data: [
        {
          id: 'project-1',
          name: 'Legacy Project',
          contractValue: '1500.55',
          estimatedCost: '925.40',
          spent: '420.25',
          progress: '58',
          budgets: [{ type: 'main', amount: '500.10' }]
        }
      ]
    };

    storeMap.set(STORAGE_KEYS.PROJECTS, legacyPayload);

    const report = await runStorageMigrations({ keys: [STORAGE_KEYS.PROJECTS] });
    const entry = report.entries.find((item) => item.key === STORAGE_KEYS.PROJECTS);

    expect(entry?.action).toBe('upgraded');
    expect(entry?.beforeVersion).toBe(1);
    expect(entry?.afterVersion).toBeGreaterThanOrEqual(1);

    const rawPersisted = storeMap.get(STORAGE_KEYS.PROJECTS);
    const persisted = typeof rawPersisted === 'string' ? JSON.parse(rawPersisted) : rawPersisted;

    expect(persisted?.__meta?.schemaVersion).toBe(entry?.afterVersion);
    expect(Array.isArray(persisted?.data)).toBe(true);
  expect(typeof persisted?.data?.[0]?.contractValue).toBe('number');
  expect(typeof persisted?.data?.[0]?.estimatedCost).toBe('number');
  expect(typeof persisted?.data?.[0]?.spent).toBe('number');
  expect(typeof persisted?.data?.[0]?.progress).toBe('number');
  });

  it('rewrites sensitive pricing payloads into secure envelopes', async () => {
    const { secureMap, windowStub } = createWindowStub();
    (globalThis as unknown as { window?: Window }).window = windowStub;

    const { STORAGE_KEYS, runStorageMigrations } = await import('../../src/utils/storage');

    const legacySecureValue = {
      t1: {
        pricing: [
          ['cement', '2500.40'],
          ['labor', '3500.85']
        ],
        defaultPercentages: {
          administrative: '7.5',
          operational: '14.25',
          profit: '12.75'
        },
        lastUpdated: ''
      }
    };

    secureMap.set(STORAGE_KEYS.PRICING_DATA, legacySecureValue);

    const report = await runStorageMigrations({ keys: [STORAGE_KEYS.PRICING_DATA] });
    const entry = report.entries.find((item) => item.key === STORAGE_KEYS.PRICING_DATA);

    expect(entry?.action).toBe('upgraded');
    expect(entry?.beforeVersion).toBeNull();
    expect(entry?.afterVersion).toBeGreaterThanOrEqual(1);

    const persisted = secureMap.get(STORAGE_KEYS.PRICING_DATA) as
      | { __meta?: { schemaVersion?: number }; data?: Record<string, unknown> }
      | undefined;

    expect(persisted).toBeTruthy();
    expect(persisted?.__meta?.schemaVersion).toBe(entry?.afterVersion);
    const storedTender = persisted?.data?.t1 as
      | { defaultPercentages?: { administrative?: unknown }; pricing?: unknown }
      | undefined;
    expect(storedTender).toBeTruthy();
    expect(Array.isArray(storedTender?.pricing)).toBe(true);
    expect(typeof storedTender?.defaultPercentages?.administrative).toBe('number');
  });

  it('migrates legacy BOQ payloads from electron-store into secure storage during initialization', async () => {
    const { storeMap, secureMap, windowStub } = createWindowStub();
    (globalThis as unknown as { window?: Window }).window = windowStub;

    const { STORAGE_KEYS } = await import('../../src/config/storageKeys');

    const legacyBoqEnvelope = {
      __meta: { schemaVersion: 1, storedAt: new Date().toISOString() },
      data: [
        {
          id: 'legacy-boq',
          tenderId: 'legacy-tender',
          projectId: 'legacy-project',
          items: [],
          totalValue: 0,
          totals: null,
          lastUpdated: new Date().toISOString()
        }
      ]
    } satisfies { __meta: { schemaVersion: number; storedAt: string }; data: BOQData[] };

    storeMap.set(STORAGE_KEYS.BOQ_DATA, legacyBoqEnvelope);

    const storageModule = await import('../../src/utils/storage');
    const { whenStorageReady, safeLocalStorage } = storageModule;

    await whenStorageReady();

    expect(storeMap.has(STORAGE_KEYS.BOQ_DATA)).toBe(false);

    const secureEnvelope = secureMap.get(STORAGE_KEYS.BOQ_DATA) as
      | { __meta?: { schemaVersion?: number }; data?: BOQData[] }
      | undefined;
    expect(secureEnvelope).toBeTruthy();
    expect(typeof secureEnvelope?.__meta?.schemaVersion).toBe('number');

    const boqCache = safeLocalStorage.getItem<BOQData[]>(STORAGE_KEYS.BOQ_DATA, []);
    expect(Array.isArray(boqCache)).toBe(true);
    expect(boqCache).toHaveLength(1);
    expect(boqCache[0]).toMatchObject({ tenderId: 'legacy-tender', projectId: 'legacy-project' });
  });
});
