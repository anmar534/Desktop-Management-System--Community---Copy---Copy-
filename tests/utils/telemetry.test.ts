import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('telemetry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
  });

  it('disables telemetry when DSN is missing', async () => {
    const init = vi.fn();
    // @ts-expect-error CommonJS module without type definitions
    const module = await import('../../src/electron/telemetry.cjs');
    module.__setSentryForTests({
      init,
      captureException: vi.fn(),
      addBreadcrumb: vi.fn()
    });

    const result = module.initTelemetry();
    expect(result.enabled).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('initialises Sentry when DSN is provided', async () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    process.env.SENTRY_TRACES_SAMPLE_RATE = '0.2';

    const init = vi.fn();
    const capture = vi.fn();

    // @ts-expect-error CommonJS module بدون تعريفات أنواع رسمية
    const module = await import('../../src/electron/telemetry.cjs');
    module.__setSentryForTests({
      init,
      captureException: capture,
      addBreadcrumb: vi.fn()
    });

    const result = module.initTelemetry({ release: '1.2.3', environment: 'production' });
    expect(result.enabled).toBe(true);
    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: process.env.SENTRY_DSN,
      release: '1.2.3',
      environment: 'production',
      tracesSampleRate: 0.2
    }));

    module.captureException(new Error('boom'));
    expect(capture).toHaveBeenCalled();
  });
});
