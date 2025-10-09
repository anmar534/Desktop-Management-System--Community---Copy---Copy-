import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clearWindow = (): void => {
  delete (globalThis as Record<string, unknown>).window;
};

describe('auditLog utilities', () => {
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

  afterEach(async () => {
    const { clearAuditLog } = await import('../../src/utils/auditLog');
    await clearAuditLog();
    clearWindow();
  });

  it('records events and normalizes metadata', async () => {
    const { recordAuditEvent, getAuditEvents, clearAuditLog } = await import('../../src/utils/auditLog');

    await clearAuditLog();

    await recordAuditEvent({
      category: 'storage',
      action: 'set',
      key: 'secure-key',
      metadata: {
        attempts: 2,
        success: true
      }
    });

    const events = await getAuditEvents();
    expect(events.length).toBe(1);
    expect(events[0].key).toBe('secure-key');
    expect(events[0].metadata?.attempts).toBe('2');
    expect(events[0].metadata?.success).toBe('true');
  });

  it('applies retention window when exceeding maximum entries', async () => {
    const { recordAuditEvent, getAuditEvents, clearAuditLog } = await import('../../src/utils/auditLog');

    await clearAuditLog();

    for (let index = 0; index < 510; index += 1) {
      await recordAuditEvent({
        category: 'storage',
        action: 'set',
        key: `key-${index}`
      });
    }

    const events = await getAuditEvents();
    expect(events.length).toBeLessThanOrEqual(500);
    const uniqueKeys = new Set(events.map((event) => event.key));
    expect(uniqueKeys.has('key-0')).toBe(false);
    expect(uniqueKeys.has('key-9')).toBe(false);
    expect(uniqueKeys.has('key-509')).toBe(true);
  });

  it('notifies subscribers when entries change', async () => {
    const { recordAuditEvent, subscribeToAuditLog } = await import('../../src/utils/auditLog');

    const listener = vi.fn();
    const unsubscribe = subscribeToAuditLog(listener);

    await recordAuditEvent({ category: 'storage', action: 'set', key: 'secure-key' });

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    expect(listener.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'secure-key' })]));

    unsubscribe();
  });

  it('records auditable system events', async () => {
    const { getAuditEvents } = await import('../../src/utils/auditLog');
    const { SystemEvents } = await import('../../src/utils/eventManager');

    SystemEvents.emitTenderStatusChanged({ tenderId: 't-001', newStatus: 'awarded' }, 'test-suite');

    await vi.waitFor(async () => {
      const events = await getAuditEvents();
      const auditEntry = events.find((event) => event.key === 'event:tender-status-changed');
      expect(auditEntry).toBeTruthy();
      expect(auditEntry?.actor).toBe('test-suite');
      expect(auditEntry?.metadata?.tenderId).toBe('t-001');
      expect(auditEntry?.metadata?.newStatus).toBe('awarded');
    });
  });
});
