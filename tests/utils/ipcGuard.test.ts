import { describe, expect, it } from 'vitest';

// @ts-expect-error CommonJS module used for runtime validation without type definitions
const guardModule = () => import('../../src/electron/ipcGuard.cjs');

describe('ipcGuard', () => {
  it('accepts valid storage operations', async () => {
    const { validateIpcPayload } = await guardModule();
    const verdict = validateIpcPayload('store-get', ['app_settings_data']);
    expect(verdict.ok).toBe(true);
    expect(verdict.args).toEqual(['app_settings_data']);
  });

  it('rejects invalid storage keys', async () => {
    const { validateIpcPayload } = await guardModule();
    const verdict = validateIpcPayload('store-set', ['../secret', { data: 1 }]);
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/storage key/);
  });

  it('normalizes fs-write-file payloads to safe values', async () => {
    const { validateIpcPayload } = await guardModule();
    const verdict = validateIpcPayload('fs-write-file', ['logs/output.json', { values: [1, 2, 3] }]);
    expect(verdict.ok).toBe(true);
    expect(verdict.args[0]).toMatch(/output\.json$/);
    expect(typeof verdict.args[1]).toBe('string');
    expect(verdict.args[1]).toContain('"values"');
  });

  it('sanitizes dialog options', async () => {
    const { validateIpcPayload } = await guardModule();
    const verdict = validateIpcPayload('dialog-open-file', [
      {
        title: ' اختر ملف ' ,
        properties: ['openFile', 'dangerous-option', 'openDirectory'],
        filters: [
          { name: ' JSON ', extensions: ['.json', ''] },
          'invalid'
        ],
        extra: 'ignored'
      }
    ]);

    expect(verdict.ok).toBe(true);
    const [options] = verdict.args;
    expect(options.title).toBe('اختر ملف');
    expect(options.properties).toEqual(['openFile', 'openDirectory']);
    expect(options.filters?.[0]?.extensions).toEqual(['json']);
    expect(options).not.toHaveProperty('extra');
  });

  it('redacts payload previews safely', async () => {
    const { redactArgs } = await guardModule();
    const preview = redactArgs([
      { token: 'a'.repeat(400) },
      () => null,
      Symbol('test')
    ]);

    expect(preview.length).toBeLessThanOrEqual(513);
    expect(preview).toMatch(/\[Function]/);
    expect(preview).toMatch(/\[Symbol]/);
  });

  it('allows reading the active CSP nonce without arguments', async () => {
    const { validateIpcPayload } = await guardModule();
    const verdict = validateIpcPayload('security-get-csp-nonce', []);
    expect(verdict.ok).toBe(true);
    expect(verdict.args).toEqual([]);
  });
});
