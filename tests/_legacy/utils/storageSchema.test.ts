import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS } from '@/config/storageKeys';
import { encodeValueForStorage, decodeStoredValue, sanitizeTenderPricingWizardStore } from '@/utils/storageSchema';

describe('storageSchema', () => {
  it('encodes project payloads with schema envelope and normalization', () => {
    const source = [
      {
        name: 'Project A',
        contractValue: '100',
        estimatedCost: '60',
        spent: '25',
        progress: '55',
        efficiency: 110,
        actualProfit: null
      }
    ];

    const { envelope, value } = encodeValueForStorage(STORAGE_KEYS.PROJECTS, source);

    expect(envelope.__meta.schemaVersion).toBe(2);
    expect(envelope.data).toEqual(value);
    expect(source[0].contractValue).toBe('100');

    expect(value).toEqual([
      expect.objectContaining({
        name: 'Project A',
        contractValue: 100,
        estimatedCost: 60,
        budget: 100,
        value: 100,
        spent: 25,
        actualCost: 25,
        remaining: 75,
        expectedProfit: 40,
        progress: 55,
        efficiency: 100
      })
    ]);
  });

  it('decodes raw project payloads and marks them for persistence', () => {
    const raw = [
      {
        name: 'Legacy project',
        contractValue: '150',
        estimatedCost: '90',
        spent: '40',
        progress: '200',
        efficiency: -20
      }
    ];

    const decoded = decodeStoredValue<typeof raw>(STORAGE_KEYS.PROJECTS, raw);

    expect(decoded.shouldPersist).toBe(true);
    expect(decoded.value).toEqual([
      expect.objectContaining({
        contractValue: 150,
        estimatedCost: 90,
        spent: 40,
        progress: 100,
        efficiency: 0,
        expectedProfit: 60
      })
    ]);
  });

  it('decodes outdated envelopes and requests persistence when schema version changes', () => {
    const normalized = encodeValueForStorage(STORAGE_KEYS.PROJECTS, [
      {
        name: 'Outdated project',
        contractValue: 200,
        estimatedCost: 170,
        spent: 50,
        progress: 45,
        efficiency: 50
      }
    ]).value;

    const outdatedEnvelope = {
      __meta: { schemaVersion: 1, storedAt: new Date().toISOString() },
      data: normalized
    };

    const decoded = decodeStoredValue<typeof normalized>(STORAGE_KEYS.PROJECTS, outdatedEnvelope);

    expect(decoded.shouldPersist).toBe(true);
    expect(decoded.value).toEqual(normalized);
  });

  it('keeps current envelopes without forcing persistence when unchanged', () => {
    const { envelope } = encodeValueForStorage(STORAGE_KEYS.PROJECTS, [
      {
        name: 'Current project',
        contractValue: 120,
        estimatedCost: 100,
        spent: 40,
        progress: 50,
        efficiency: 60
      }
    ]);

    const decoded = decodeStoredValue<typeof envelope.data>(STORAGE_KEYS.PROJECTS, envelope);

    expect(decoded.shouldPersist).toBe(false);
    expect(decoded.value).toEqual(envelope.data);
  });

  it('sanitizes tender pricing wizard drafts and drops invalid entries', () => {
    const rawStore = {
      ' tender-alpha ': {
        tenderId: 'tender-alpha',
        updatedAt: '2025-10-05T12:00:00Z',
        completedSteps: {
          registration: 'true',
          technical: 'false',
          unknown: 'true'
        },
        registration: {
          form: {
            name: '  منافسة الطاقة  ',
            client: 'وزارة الطاقة',
            deadline: '2025-11-01',
            type: 'تشغيلي',
            estimatedValue: '4500000'
          },
          notes: ' مراجعة بنود العقود ',
          lastSavedAt: 'invalid-date'
        },
        technical: {
          uploadedFiles: ['brief.pdf', 42, '  ', null],
          checklist: {
            specsReviewed: 'true',
            complianceConfirmed: 'yes',
            approvalsCollected: false
          },
          notes: null,
          lastSavedAt: '2025-10-05T12:20:00Z'
        },
        financial: {
          strategy: 'hybrid',
          profitMargin: 180,
          vatIncluded: 'false',
          riskLevel: 'critical',
          checklist: {
            pricingDataImported: 1,
            totalsReconciled: 'true',
            approvalsSecured: 'no'
          },
          notes: '  راجع المخاطر  ',
          lastSavedAt: '2025-10-05T12:30:00Z'
        },
        review: {
          comments: 'جاهز تقريباً',
          notifyTeam: 'false',
          readyForSubmission: 'true'
        }
      },
      orphan: {
        tenderId: '',
        registration: {}
      },
      invalid: 'not-an-object'
    };

    const sanitized = sanitizeTenderPricingWizardStore(rawStore);

    expect(Object.keys(sanitized)).toEqual(['tender-alpha']);

    const draft = sanitized['tender-alpha'] as Record<string, unknown>;
    expect(draft.tenderId).toBe('tender-alpha');
    expect(draft.updatedAt).toBe('2025-10-05T12:00:00.000Z');
    expect(draft.completedSteps).toEqual({ registration: true, technical: false });

    const registration = draft.registration as Record<string, unknown>;
    expect(registration).toMatchObject({
      notes: 'مراجعة بنود العقود',
      lastSavedAt: null
    });
    expect(registration.form).toEqual({
      name: 'منافسة الطاقة',
      client: 'وزارة الطاقة',
      type: 'تشغيلي',
      deadline: '2025-11-01T00:00:00.000Z',
      estimatedValue: '4500000'
    });

    const technical = draft.technical as Record<string, unknown>;
    expect(technical.uploadedFiles).toEqual(['brief.pdf']);
    expect(technical.checklist).toEqual({
      specsReviewed: true,
      complianceConfirmed: true,
      approvalsCollected: false
    });

    const financial = draft.financial as Record<string, unknown>;
    expect(financial).toMatchObject({
      strategy: 'hybrid',
      profitMargin: 100,
      vatIncluded: false,
      riskLevel: 'medium',
      notes: 'راجع المخاطر'
    });
    expect(financial.checklist).toEqual({
      pricingDataImported: true,
      totalsReconciled: true,
      approvalsSecured: false
    });

    const review = draft.review as Record<string, unknown>;
    expect(review).toEqual({
      comments: 'جاهز تقريباً',
      notifyTeam: false,
      readyForSubmission: true
    });
  });
});
