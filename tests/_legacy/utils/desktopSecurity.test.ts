import { describe, expect, it } from 'vitest';
import {
  authorizeDesktopNotification,
  authorizeDragAndDrop,
  authorizeExport,
  __desktopSecurityInternals
} from '@/utils/desktopSecurity';

describe('desktopSecurity utilities', () => {
  it('sanitizes notification payloads before authorization', async () => {
    const longTitle = 'أ'.repeat(400);
    const longMessage = 'م'.repeat(1000);

    const result = await authorizeDesktopNotification({
      severity: 'urgent',
      title: longTitle,
      message: longMessage,
      description: 'اختبار رسالة طويلة',
      actionLabel: 'عرض',
      scope: 'test-scope',
      correlationId: 'test-correlation'
    });

    expect(result.allowed).toBe(true);
    expect(result.payload?.title?.length).toBeLessThanOrEqual(160);
    expect(result.payload?.message.length).toBeLessThanOrEqual(512);
    expect(result.payload?.actionLabel).toBe('عرض');
  });

  it('rejects drag payloads that exceed the aggregate size limit', () => {
    const oversizedFiles = Array.from({ length: 6 }, (_, index) => ({
      name: `large-file-${index + 1}.pdf`,
      type: 'application/pdf',
      size: 15 * 1024 * 1024
    }));

    expect(() =>
      __desktopSecurityInternals.sanitizeDragRequestForTest({
        intent: 'stress-test',
        files: oversizedFiles
      })
    ).toThrow('drag authorization exceeds aggregate size limit');
  });

  it('sanitizes drag payload file names when allowed', async () => {
    const result = await authorizeDragAndDrop({
      intent: 'tender-upload',
      source: 'unit-test',
      tenderId: 'T-100',
      files: [
        {
          name: 'unsafe<>file?.pdf',
          type: 'application/pdf',
          size: 1024
        }
      ]
    });

    expect(result.allowed).toBe(true);
    expect(result.payload?.files[0].name).not.toContain('<');
    expect(result.payload?.files[0].name).not.toContain('>');
  });

  it('sanitizes export payload filenames', async () => {
    const result = await authorizeExport({
      format: 'pdf',
      filename: 'report....',
      bytes: 2048,
      origin: 'unit-test'
    });

    expect(result.allowed).toBe(true);
    expect(result.payload?.filename).toBeDefined();
    expect(result.payload?.filename?.endsWith('.')).toBe(false);
    expect(result.payload?.filename?.length).toBeLessThanOrEqual(120);
  });
});
