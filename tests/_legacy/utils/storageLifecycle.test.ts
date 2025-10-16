import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createWindowStub = () => {
  const storeMap = new Map<string, unknown>();
  const secureMap = new Map<string, unknown>();
  const listeners = new Map<string, (event: unknown, payload: unknown) => unknown>();

  const storeSetMock = vi.fn((key: string, value: unknown) => {
    storeMap.set(key, typeof value === 'string' ? JSON.parse(value) : value);
  });

  const storeGetMock = vi.fn((key: string) => storeMap.get(key));
  const storeDeleteMock = vi.fn((key: string) => {
    storeMap.delete(key);
  });
  const storeClearMock = vi.fn(() => {
    storeMap.clear();
  });

  const secureSetMock = vi.fn(async (key: string, value: unknown) => {
    secureMap.set(key, value);
  });
  const secureGetMock = vi.fn(async (key: string) => (secureMap.has(key) ? secureMap.get(key) ?? null : null));
  const secureDeleteMock = vi.fn(async (key: string) => {
    secureMap.delete(key);
  });
  const secureClearMock = vi.fn(async () => {
    secureMap.clear();
  });

  const ackMock = vi.fn(async () => {
    /* noop */
  });

  const windowStub = {
    electronAPI: {
      store: {
        get: storeGetMock,
        set: storeSetMock,
        delete: storeDeleteMock,
        clear: storeClearMock
      },
      secureStore: {
        get: secureGetMock,
        set: secureSetMock,
        delete: secureDeleteMock,
        clear: secureClearMock
      },
      on: vi.fn((channel: string, callback: (event: unknown, payload: unknown) => unknown) => {
        listeners.set(channel, callback);
      }),
      lifecycle: {
        ack: ackMock
      }
    },
    dispatchEvent: vi.fn(() => true)
  };

  return {
    windowStub,
    storeMap,
    secureMap,
    storeSetMock,
    secureSetMock,
    listeners,
    ackMock
  };
};

describe('storage lifecycle bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    (globalThis as { CustomEvent?: typeof CustomEvent }).CustomEvent = class {
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
    delete (globalThis as Record<string, unknown>).CustomEvent;
  });

  it('flushes cached entries during prepareStorageForSuspend', async () => {
    const {
      windowStub,
      storeMap,
      secureMap,
      storeSetMock,
      secureSetMock
    } = createWindowStub();
  (globalThis as Record<string, unknown>).window = windowStub as unknown;

    const {
      STORAGE_KEYS,
      saveToStorage,
      prepareStorageForSuspend,
      waitForStorageReady
    } = await import('../../src/utils/storage');

    await waitForStorageReady();

    await saveToStorage(STORAGE_KEYS.TENDERS, [
      {
        id: 't-1',
        name: 'Demo Tender',
        value: 125000
      }
    ]);

    await saveToStorage(STORAGE_KEYS.PRICING_DATA, {
      ['pricing:t-1']: {
        pricing: [
          ['cement', 2500],
          ['labor', 1800]
        ],
        defaultPercentages: {
          administrative: 7,
          operational: 14,
          profit: 12
        }
      }
    });

    storeSetMock.mockClear();
    secureSetMock.mockClear();

    const report = await prepareStorageForSuspend();

  expect(storeSetMock).toHaveBeenCalled();
  expect(secureSetMock).toHaveBeenCalled();
    expect(Array.isArray(report.entries)).toBe(true);
    expect(report.stats.persisted).toBeGreaterThan(0);
    expect(report.stats.errors).toBe(0);
    expect(storeMap.has(STORAGE_KEYS.TENDERS)).toBe(true);
    expect(secureMap.has(STORAGE_KEYS.PRICING_DATA)).toBe(true);
  });

  it('acknowledges lifecycle events sent from the main process', async () => {
    const {
      windowStub,
      listeners,
      ackMock
    } = createWindowStub();
  (globalThis as Record<string, unknown>).window = windowStub as unknown;

    const {
      STORAGE_KEYS,
      saveToStorage,
      waitForStorageReady
    } = await import('../../src/utils/storage');

    await waitForStorageReady();

    await saveToStorage(STORAGE_KEYS.TENDERS, [
      {
        id: 't-42',
        name: 'Lifecycle Tender',
        value: 4200
      }
    ]);

    await Promise.resolve();

    const lifecycleHandler = listeners.get('system-lifecycle');
    expect(typeof lifecycleHandler).toBe('function');

    await lifecycleHandler?.({}, {
      id: 'req-prepare',
      action: 'prepare-suspend',
      source: 'unit-test'
    });

    expect(ackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'req-prepare',
        status: 'flushed'
      })
    );

    ackMock.mockClear();

    await lifecycleHandler?.({}, {
      id: 'req-resume',
      action: 'resume',
      source: 'unit-test'
    });

    expect(ackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'req-resume',
        status: 'resumed'
      })
    );
  });
});
