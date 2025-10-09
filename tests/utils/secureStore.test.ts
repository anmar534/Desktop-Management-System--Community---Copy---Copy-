import { describe, beforeEach, it, expect, vi } from 'vitest';
import { secureStore } from '@/utils/secureStore';

describe('secureStore fallback (non-Electron)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      (window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
    }
  });

  it('stores and retrieves values via in-memory fallback when bridge is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await secureStore.set('test-key', { value: 123 });
    const result = await secureStore.get<{ value: number }>('test-key');

    expect(result).toMatchObject({ value: 123 });
    expect(warnSpy).toHaveBeenCalled();

    await secureStore.remove('test-key');
    const afterRemoval = await secureStore.get('test-key');
    expect(afterRemoval).toBeUndefined();

    await secureStore.set('test-key', 'value');
    await secureStore.clear();
    const afterClear = await secureStore.get('test-key');
    expect(afterClear).toBeUndefined();

    warnSpy.mockRestore();
  });
});
