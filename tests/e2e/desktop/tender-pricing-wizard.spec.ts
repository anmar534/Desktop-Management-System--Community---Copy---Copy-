import { test, expect, _electron as electron } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

const baseElectronEnv = {
  ...process.env,
  NODE_ENV: 'production',
  E2E_TEST: '1',
  ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
  PLAYWRIGHT: '1'
};

const STORAGE_KEYS = {
  TENDERS: 'app_tenders_data',
  RELATIONS: 'app_entity_relations',
  TENDER_PRICING_WIZARDS: 'app_tender_pricing_wizards',
  SECURITY_AUDIT_LOG: 'app_security_audit_log'
} as const;

const SCHEMA_VERSION: Record<(typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], number> = {
  [STORAGE_KEYS.TENDERS]: 2,
  [STORAGE_KEYS.RELATIONS]: 1,
  [STORAGE_KEYS.TENDER_PRICING_WIZARDS]: 1,
  [STORAGE_KEYS.SECURITY_AUDIT_LOG]: 1
};

const TENDER_ID = 'tender-wizard-e2e';
const TENDER_NAME = 'منافسة E2E متعددة الخطوات';

const createEnvelope = <T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], data: T) => ({
  __meta: {
    schemaVersion: SCHEMA_VERSION[key],
    storedAt: new Date().toISOString()
  },
  data
});

interface PersistedEnvelope<T> {
  __meta?: {
    schemaVersion?: number;
    storedAt?: string;
  };
  data?: T;
}

const extractEnvelopeData = <T>(payload: PersistedEnvelope<T> | T | null | undefined): T | null => {
  if (!payload) {
    return null;
  }
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as PersistedEnvelope<T>;
    return envelope.data ?? null;
  }
  return payload as T;
};

interface WizardDraftSnapshot {
  tenderId?: string;
  registration?: {
    form?: {
      name?: string;
      client?: string;
      deadline?: string;
      estimatedValue?: string;
      type?: string;
    };
  };
  technical?: {
    checklist?: Record<string, boolean>;
  };
  financial?: {
    checklist?: Record<string, boolean>;
  };
  review?: {
    checklist?: Record<string, boolean>;
    notes?: string;
  };
  submit?: {
    confirmed?: boolean;
  };
  updatedAt?: string;
}

interface AuditEntry {
  key?: string;
  action?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

async function seedTenderWizardDataset(window: Page) {
  const now = new Date().toISOString();

  const tenderRecord = {
    id: TENDER_ID,
    name: 'منافسة تسعير قديمة',
    title: 'منافسة قديمة لإعادة التهيئة',
    client: 'جهة الاختبار',
    value: 1250000,
    totalValue: 1250000,
  status: 'under_action',
    totalItems: 10,
    pricedItems: 4,
    phase: 'pricing',
    deadline: '2025-12-01',
    daysLeft: 45,
    progress: 40,
    priority: 'medium',
    team: 'فريق التسعير',
    manager: 'قائد الفريق',
    winChance: 55,
    competition: 'مغلقة',
    submissionDate: '2025-12-20',
    lastAction: 'legacy-draft',
    lastUpdate: now,
    category: 'إنشاء',
    location: 'الرياض',
    type: 'construction',
    technicalFilesUploaded: false
  };

  const relationsSnapshot = {
    tenderProject: [],
    projectPurchase: []
  };

  const legacyWizardDraft = {
    [TENDER_ID]: {
      tenderId: TENDER_ID,
      updatedAt: '2025-09-27T09:15:00Z',
      registration: {
        form: {
          name: '  منافسة تسعير قديمة  ',
          client: 'جهة الاختبار',
          deadline: '2025-12-01',
          estimatedValue: '1250000'
        },
        notes: null
      },
      technical: {
        checklist: {
          specsReviewed: 'yes'
        }
      },
      financial: {
        strategy: 'unknown',
        checklist: {
          pricingDataImported: 'false'
        }
      },
      review: {}
    },
    orphan: {
      tenderId: '',
      registration: {}
    }
  };

  const payload = {
    tenders: createEnvelope(STORAGE_KEYS.TENDERS, [tenderRecord]),
    relations: createEnvelope(STORAGE_KEYS.RELATIONS, relationsSnapshot),
    wizards: {
      __meta: {
        schemaVersion: SCHEMA_VERSION[STORAGE_KEYS.TENDER_PRICING_WIZARDS],
        storedAt: now
      },
      data: legacyWizardDraft
    },
    auditLog: createEnvelope(STORAGE_KEYS.SECURITY_AUDIT_LOG, [])
  };

  const navigationPermissions = [
    'tenders:read',
    'tenders:write',
    'projects:read',
    'projects:write',
    'financial:read',
    'financial:write',
    'reports:read',
    'reports:write',
    'settings:read',
    'settings:write',
    'audit:read',
    'audit:write'
  ];

  await window.evaluate(async ({ keys, data, permissions }) => {
    const electronWindow = globalThis as unknown as {
      electronAPI: {
        store?: {
          set?: (key: string, value: unknown) => Promise<void> | void;
          delete?: (key: string) => Promise<void> | void;
        };
        secureStore?: {
          set?: (key: string, value: unknown) => Promise<void>;
          get?: (key: string) => Promise<unknown>;
          delete?: (key: string) => Promise<void>;
        };
      };
    };

    const api = electronWindow.electronAPI;
    if (!api) {
      throw new Error('Electron bridges are not available');
    }

    const writeStore = async (key: string, value: unknown) => {
      if (api.store?.set) {
        await api.store.set(key, value);
      } else {
        throw new Error(`store.set not available for ${key}`);
      }
    };

    const writeSecureStore = async (key: string, value: unknown) => {
      if (api.secureStore?.set) {
        await api.secureStore.set(key, value);
        return;
      }
      if (api.store?.set) {
        await api.store.set(key, value);
        return;
      }
      throw new Error(`secureStore.set not available for ${key}`);
    };

    await writeStore(keys.TENDERS, data.tenders);
    await writeStore(keys.RELATIONS, data.relations);
    await writeSecureStore(keys.TENDER_PRICING_WIZARDS, data.wizards);
    await writeSecureStore(keys.SECURITY_AUDIT_LOG, data.auditLog);

    await writeStore('ui_navigation_permissions', permissions);
  }, { keys: STORAGE_KEYS, data: payload, permissions: navigationPermissions });
}

async function launchElectronApp() {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: PROJECT_ROOT,
    env: baseElectronEnv
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  window.on('console', (message) => {
    console.log(`[renderer] ${message.type()}: ${message.text()}`);
  });

  return { electronApp, window };
}

const fetchSecureStoreValue = async <T>(window: Page, key: string): Promise<T | null> => {
  return await window.evaluate(async ({ storageKey }) => {
    const electronWindow = globalThis as unknown as {
      electronAPI?: {
        secureStore?: {
          get?: (targetKey: string) => Promise<unknown>;
        };
      };
    };

    const api = electronWindow.electronAPI;
    if (!api?.secureStore?.get) {
      return null;
    }

    const value = await api.secureStore.get(storageKey);
    return value ?? null;
  }, { storageKey: key }) as T | null;
};

test.describe.serial('Tender pricing wizard flow', () => {
  test('completes autosave flow and records audit events', async () => {
    test.setTimeout(120000);
    const { electronApp, window } = await launchElectronApp();

    try {
      await seedTenderWizardDataset(window);
      await window.reload();
      await window.waitForLoadState('domcontentloaded');
      console.log('[E2E] Navigating to tenders section');

  await window.getByRole('button', { name: 'المنافسات', exact: true }).first().click();
  await expect(window.getByRole('heading', { name: 'إدارة المنافسات' })).toBeVisible();
    await expect(window.getByText(/منافسة تسعير قديمة/)).toBeVisible({ timeout: 10000 });
      console.log('[E2E] Opening pricing wizard quick action');

  const headerQuickActionTexts = await window.locator('header button').allInnerTexts();
  console.log('[E2E] Header buttons:', headerQuickActionTexts);

  const wizardButtonCount = await window.locator('button', { hasText: 'معالج التسعير' }).count();
  console.log('[E2E] Wizard quick action buttons found:', wizardButtonCount);
      const sampleButtons = await window.locator('button').evaluateAll((elements) =>
        elements.map((element) => element.textContent?.trim()).filter((text) => (text ?? '').length > 0)
      );
      console.log('[E2E] Sample button texts:', sampleButtons);

  await window.getByRole('button', { name: /معالج التسعير/ }).first().click();
  const currentHash = await window.evaluate(() => globalThis.location.hash);
      console.log('[E2E] Current hash after click:', currentHash);
      const activeSection = await window.evaluate(() => {
        try {
          return globalThis.localStorage.getItem('ui_active_section');
        } catch (error) {
          console.warn('[E2E] Failed reading ui_active_section:', error);
          return null;
        }
      });
      console.log('[E2E] Stored active section:', activeSection);
      const headingTexts = await window.locator('h1').allInnerTexts();
      console.log('[E2E] Current H1 headings:', headingTexts);
      const mainContentSnapshot = await window.locator('main').innerText().catch(() => null);
      if (mainContentSnapshot) {
        console.log('[E2E] Main content (trimmed):', mainContentSnapshot.slice(0, 500));
      }
      const cardTitleTexts = await window.locator('[data-testid="card-title"]').allInnerTexts().catch(() => []);
      if (cardTitleTexts.length > 0) {
        console.log('[E2E] Card titles snapshot:', cardTitleTexts);
      }
      await expect(window.getByRole('heading', { name: 'معالج تسعير المنافسة' })).toBeVisible();
      console.log('[E2E] Selecting seeded tender in wizard');

    const selectTriggerLocator = window.locator('button', { hasText: /اختر المنافسة/ }).first();
    const wizardSelectButtonCount = await selectTriggerLocator.count();
    console.log('[E2E] Wizard select trigger buttons found:', wizardSelectButtonCount);
    await expect(selectTriggerLocator).toBeVisible();
    await selectTriggerLocator.click();
  await window.getByRole('option', { name: /منافسة تسعير قديمة/ }).click();
      console.log('[E2E] Filling registration step');

  const nameInput = window.locator('input[placeholder="مثال: مشروع تطوير المجمع التجاري"]');
      await nameInput.fill(TENDER_NAME);
      await window.locator('input[placeholder="اسم الجهة أو العميل"]').fill('هيئة الاختبار الوطنية');
  await window.locator('input[placeholder="إنشائي، تشغيلي، توريد..."]').fill('تشغيلي');
      await window.locator('input[type="date"]').fill('2025-12-31');
      await window.locator('input[placeholder="أدخل القيمة الرقمية"]').fill('7500000');

      await expect(window.getByText('جارٍ الحفظ التلقائي...', { exact: false })).toBeVisible();
      await expect(window.getByText('تم الحفظ تلقائياً')).toBeVisible({ timeout: 5000 });
  console.log('[E2E] Autosave confirmed, returning to tenders list');

      await window.getByRole('button', { name: 'العودة للمنافسات' }).click();
      await expect(window.getByRole('heading', { name: 'إدارة المنافسات' })).toBeVisible();

      await window.getByRole('button', { name: 'معالج التسعير' }).first().click();
      await expect(window.getByRole('heading', { name: 'معالج تسعير المنافسة' })).toBeVisible();
  const reopenSelectTrigger = window.locator('button', { hasText: /اختر المنافسة/ }).first();
  await expect(reopenSelectTrigger).toBeVisible();
  await reopenSelectTrigger.click();
  await window.getByRole('option', { name: /منافسة تسعير قديمة/ }).click();
      await expect(nameInput).toHaveValue(TENDER_NAME);
  console.log('[E2E] Draft restored successfully');

      const draftSnapshot = await fetchSecureStoreValue<PersistedEnvelope<Record<string, WizardDraftSnapshot>> | Record<string, WizardDraftSnapshot>>(
        window,
        STORAGE_KEYS.TENDER_PRICING_WIZARDS
      );
      expect(draftSnapshot).not.toBeNull();
      const sanitizedDrafts = extractEnvelopeData<Record<string, WizardDraftSnapshot>>(draftSnapshot) ?? {};
      expect(sanitizedDrafts).toHaveProperty(TENDER_ID);
  const sanitizedKeys = Object.keys(sanitizedDrafts);
  expect(sanitizedKeys).toContain(TENDER_ID);
  expect(sanitizedKeys).not.toContain('');

      const reopenedDraft = sanitizedDrafts[TENDER_ID];
      expect(reopenedDraft).toBeDefined();
      if (reopenedDraft?.registration?.form) {
        expect(reopenedDraft.registration.form.name).toBe(TENDER_NAME);
        expect(reopenedDraft.registration.form.client).toBe('هيئة الاختبار الوطنية');
      }

      await window.getByRole('button', { name: 'التالي' }).click();
      await expect(window.getByText('تم تحديث بيانات المنافسة بنجاح')).toBeVisible({ timeout: 5000 });
  console.log('[E2E] Registration step saved');

      const fileInput = window.locator('input[aria-label="رفع الملفات الفنية"]');
      await fileInput.setInputFiles({
        name: 'specifications.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4')
      });
      await expect(window.getByText('تم تسجيل رفع الملفات الفنية بنجاح')).toBeVisible({ timeout: 5000 });
  console.log('[E2E] Technical files step completed');

      const technicalChecklistLabels = [
        'مراجعة المواصفات الفنية',
        'اكتمال نماذج المطابقة',
        'توثيق الموافقات الداخلية'
      ];

      for (const label of technicalChecklistLabels) {
        await window.locator('label', { hasText: label }).click();
      }

      await window.getByRole('button', { name: 'التالي' }).click();
      await expect(window.getByText('قائمة التحقق المالية')).toBeVisible();
  console.log('[E2E] Navigated to financial step');

      const financialChecklistLabels = [
        'استيراد بيانات التسعير',
        'مطابقة الإجماليات',
        'الموافقات المالية'
      ];
      for (const label of financialChecklistLabels) {
        await window.locator('label', { hasText: label }).click();
      }
      await window.locator('textarea[placeholder="أضف ملاحظات مالية أو اعتبارات إضافية"]').fill('تمت مراجعة المؤشرات الحرجة.');

      await window.getByRole('button', { name: 'التالي' }).click();
      await expect(window.getByText('ملاحظات المراجعة النهائية')).toBeVisible();
  console.log('[E2E] On review step');

      await window.locator('textarea[placeholder="أضف أي ملاحظات أو توصيات قبل الإرسال"]').fill('المنافسة جاهزة بالكامل، يرجى الإرسال.');
      await window.locator('label', { hasText: 'تم الانتهاء من جميع المتطلبات والمنافسة جاهزة للإرسال' }).click();

    await window.getByRole('button', { name: 'التالي' }).click();
    const submitButton = window.getByRole('button', { name: 'إرسال المنافسة', exact: true });
    await expect(submitButton).toBeEnabled();
  console.log('[E2E] Submit step ready');

    await submitButton.click();
      await expect(window.getByText('تم إرسال المنافسة واعتمادها بنجاح')).toBeVisible({ timeout: 8000 });
      await expect(window.getByRole('heading', { name: 'إدارة المنافسات' })).toBeVisible({ timeout: 8000 });
  console.log('[E2E] Wizard submission complete');

      const wizardStoreAfterSubmit = await fetchSecureStoreValue<PersistedEnvelope<Record<string, WizardDraftSnapshot>> | Record<string, WizardDraftSnapshot>>(
        window,
        STORAGE_KEYS.TENDER_PRICING_WIZARDS
      );
      expect(wizardStoreAfterSubmit).not.toBeNull();
    const wizardPayload = extractEnvelopeData<Record<string, WizardDraftSnapshot>>(wizardStoreAfterSubmit) ?? {};
    expect(wizardPayload).not.toHaveProperty(TENDER_ID);
    expect(Object.keys(wizardPayload)).not.toContain('');
  console.log('[E2E] Wizard draft for tender removed');

      const auditLogValue = await fetchSecureStoreValue<PersistedEnvelope<AuditEntry[]> | AuditEntry[]>(
        window,
        STORAGE_KEYS.SECURITY_AUDIT_LOG
      );
      expect(auditLogValue).not.toBeNull();
      const auditEntries = extractEnvelopeData<AuditEntry[]>(auditLogValue) ?? [];
      expect(Array.isArray(auditEntries)).toBe(true);
      const wizardEvents = auditEntries.filter(
        (entry) => entry?.key === STORAGE_KEYS.TENDER_PRICING_WIZARDS
      );
      expect(wizardEvents.length).toBeGreaterThan(0);
      expect(
        wizardEvents.some((entry) => entry?.action === 'remove' || entry?.action === 'set')
      ).toBe(true);
      console.log('[E2E] Audit log captured wizard events');
    } finally {
      await electronApp.close();
    }
  });
});
