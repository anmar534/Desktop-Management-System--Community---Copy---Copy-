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
  PROJECTS: 'app_projects_data',
  TENDERS: 'app_tenders_data',
  RELATIONS: 'app_entity_relations',
  BOQ_DATA: 'app_boq_data',
  PROJECT_COST_ENVELOPES: 'app_project_cost_envelopes'
} as const;

const SCHEMA_VERSION: Record<(typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], number> = {
  [STORAGE_KEYS.PROJECTS]: 2,
  [STORAGE_KEYS.TENDERS]: 2,
  [STORAGE_KEYS.RELATIONS]: 1,
  [STORAGE_KEYS.BOQ_DATA]: 1,
  [STORAGE_KEYS.PROJECT_COST_ENVELOPES]: 1
};

const PROJECT_ID = 'project-cost-e2e';
const TENDER_ID = 'tender-cost-e2e';
const PROJECT_NAME = 'مشروع إدارة التكاليف - E2E';
const BOQ_ITEM_DESCRIPTION = 'بند تجريبي للأعمال المدنية';

const createEnvelope = <T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], data: T) => ({
  __meta: {
    schemaVersion: SCHEMA_VERSION[key],
    storedAt: new Date().toISOString()
  },
  data
});

async function seedProjectCostDataset(window: Page) {
  const now = new Date().toISOString();

  const projectRecord = {
    id: PROJECT_ID,
    name: PROJECT_NAME,
    client: 'عميل الاختبار',
    status: 'active',
    priority: 'high',
    progress: 35,
    contractValue: 250000,
    estimatedCost: 180000,
    actualCost: 0,
    spent: 0,
    remaining: 250000,
    expectedProfit: 70000,
    actualProfit: 0,
    startDate: '2025-01-10',
    endDate: '2025-12-20',
    manager: 'مدير المشروع',
    team: 'فريق التنفيذ',
    location: 'الرياض',
    phase: 'execution',
    health: 'green',
    lastUpdate: now,
    nextMilestone: 'استلام الهيكل الخرساني',
    milestoneDate: '2025-08-15',
    category: 'أعمال إنشاء',
    efficiency: 85,
    riskLevel: 'low',
    budget: 250000,
    value: 250000,
    type: 'construction'
  };

  const tenderRecord = {
    id: TENDER_ID,
    name: 'منافسة تكلفة - E2E',
    title: 'منافسة إنشاء مجمع تجاري',
    client: 'عميل الاختبار',
    value: 180000,
    status: 'won',
    totalItems: 1,
    pricedItems: 1,
    phase: 'pricing',
    deadline: '2025-06-30',
    daysLeft: 90,
    progress: 100,
    priority: 'medium',
    team: 'فريق التسعير',
    manager: 'مدير التسعير',
    winChance: 95,
    competition: 'مغلقة',
    submissionDate: '2025-04-15',
    lastAction: 'import_ready',
    lastUpdate: now,
    category: 'إنشاء',
    location: 'الرياض',
    type: 'construction'
  };

  const relationsSnapshot = {
    tenderProject: [
      {
        tenderId: TENDER_ID,
        projectId: PROJECT_ID,
        createdAt: now,
        isAutoCreated: true
      }
    ],
    projectPurchase: []
  };

  const boqItem = {
    id: 'boq-item-e2e-1',
    originalId: 'original-item-1',
    description: BOQ_ITEM_DESCRIPTION,
    unit: 'م2',
    category: 'أعمال مدنية',
    quantity: 10,
    unitPrice: 1000,
    totalPrice: 10000,
    estimated: {
      quantity: 10,
      unitPrice: 1000,
      totalPrice: 10000,
      breakdown: {
        materials: [
          { id: 'mat-1', name: 'خرسانة جاهزة', unit: 'م3', quantity: 5, unitCost: 600, totalCost: 3000, origin: 'estimated' }
        ],
        labor: [
          { id: 'lab-1', name: 'فريق صب', unit: 'ساعة', quantity: 40, unitCost: 50, totalCost: 2000, origin: 'estimated' }
        ],
        equipment: [],
        subcontractors: []
      },
      additionalPercentages: { administrative: 5, operational: 3, profit: 10 }
    },
    actual: {
      quantity: 10,
      unitPrice: 1000,
      totalPrice: 10000,
      breakdown: {
        materials: [
          { id: 'mat-1', name: 'خرسانة جاهزة', unit: 'م3', quantity: 5, unitCost: 600, totalCost: 3000, origin: 'estimated' }
        ],
        labor: [
          { id: 'lab-1', name: 'فريق صب', unit: 'ساعة', quantity: 40, unitCost: 50, totalCost: 2000, origin: 'estimated' }
        ],
        equipment: [],
        subcontractors: []
      },
      additionalPercentages: { administrative: 5, operational: 3, profit: 10 }
    }
  };

  const boqRecord = {
    id: 'boq-record-e2e-1',
    tenderId: TENDER_ID,
    items: [boqItem],
    totalValue: 10000,
    totals: null,
    lastUpdated: now
  };

  const payload = {
    projects: createEnvelope(STORAGE_KEYS.PROJECTS, [projectRecord]),
    tenders: createEnvelope(STORAGE_KEYS.TENDERS, [tenderRecord]),
    relations: createEnvelope(STORAGE_KEYS.RELATIONS, relationsSnapshot),
    boq: createEnvelope(STORAGE_KEYS.BOQ_DATA, [boqRecord])
  };

  await window.evaluate(async ({ keys, data }) => {
    const electronWindow = globalThis as unknown as {
      electronAPI: {
        store?: {
          set?: (key: string, value: unknown) => Promise<void> | void;
          delete?: (key: string) => Promise<void> | void;
          get?: (key: string) => Promise<unknown> | unknown;
        };
        secureStore?: {
          set?: (key: string, value: unknown) => Promise<void>;
          delete?: (key: string) => Promise<void>;
          get?: (key: string) => Promise<unknown>;
        };
      };
    };

    const isSensitiveKey = (key: string) =>
      key === keys.BOQ_DATA || key === keys.PROJECT_COST_ENVELOPES;

    const api = electronWindow.electronAPI;
    console.log('🧪 [E2E] Storage bridges available:', {
      hasStore: Boolean(api?.store?.set),
      hasSecureStore: Boolean(api?.secureStore?.set)
    });

    const setValue = async (key: string, value: unknown) => {
      const api = electronWindow.electronAPI;
      if (isSensitiveKey(key) && api.secureStore?.set) {
        await api.secureStore.set(key, value);
        return;
      }
      if (api.store?.set) {
        await api.store.set(key, value);
        return;
      }
      throw new Error(`No storage bridge available for ${key}`);
    };

    const deleteValue = async (key: string) => {
      const api = electronWindow.electronAPI;
      if (isSensitiveKey(key) && api.secureStore?.delete) {
        await api.secureStore.delete(key);
        return;
      }
      if (api.store?.delete) {
        await api.store.delete(key);
      }
    };

    await Promise.all([
      setValue(keys.PROJECTS, data.projects),
      setValue(keys.TENDERS, data.tenders),
      setValue(keys.RELATIONS, data.relations),
      setValue(keys.BOQ_DATA, data.boq)
    ]);

    try {
      await deleteValue(keys.PROJECT_COST_ENVELOPES);
    } catch (error) {
      console.warn('⚠️ [E2E] Failed to clear cost envelopes before test run:', error);
    }

    const relationsValue = await (electronWindow.electronAPI.store?.get?.(keys.RELATIONS));
    console.log('🧪 [E2E] Seeded relations snapshot:', relationsValue);
  }, { keys: STORAGE_KEYS, data: payload });
}

async function launchElectronApp() {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: PROJECT_ROOT,
    env: baseElectronEnv
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  window.on('console', message => {
    console.log(`[renderer] ${message.type()}: ${message.text()}`);
  });

  return { electronApp, window };
}

test.describe.serial('Project cost integration', () => {
  test('imports BOQ items into the project cost view', async () => {
    const { electronApp, window } = await launchElectronApp();

    try {
      await seedProjectCostDataset(window);
      await window.reload();
      await window.waitForLoadState('domcontentloaded');

      const relationsSnapshot = await window.evaluate(async ({ key }) => {
        const api = (globalThis as unknown as { electronAPI?: { store?: { get?: (storageKey: string) => Promise<unknown> | unknown } } }).electronAPI;
        if (!api?.store?.get) {
          return null;
        }
        return await api.store.get(key);
      }, { key: STORAGE_KEYS.RELATIONS });
      console.log('🧪 Relations after reload:', relationsSnapshot);

      const projectsNavButton = window.getByRole('button', { name: 'المشاريع' });
      await projectsNavButton.click();

      await expect(window.getByRole('heading', { name: 'إدارة المشاريع' })).toBeVisible();

      const projectHeading = window.getByRole('heading', { name: PROJECT_NAME });
      await expect(projectHeading).toBeVisible();
      await projectHeading.click();

      const costsTab = window.getByRole('tab', { name: 'التكاليف التفصيلية' });
      await costsTab.click();

      const costTable = window.locator('table');
      await expect(costTable).toBeVisible();
      const costRowLocator = costTable.getByRole('cell', { name: BOQ_ITEM_DESCRIPTION });
      await expect(costRowLocator).toHaveCount(0);

  const importButton = window.locator('button[aria-label="استيراد بنود التكلفة من المنافسة"]').first();
  console.log('🧪 Simplified import button count:', await window.locator('button[aria-label="استيراد بنود التكلفة من المنافسة"]').count());
  await expect(importButton).toBeVisible({ timeout: 3000 });
  console.log('🧪 Import button text before click:', await importButton.innerText());
  await importButton.click();
  console.log('🧪 Import button text after click:', await importButton.innerText());

      await expect.poll(async () => await costRowLocator.count(), { timeout: 15000 }).toBeGreaterThan(0);

      const importedRow = costTable.getByText(BOQ_ITEM_DESCRIPTION, { exact: false });
      await expect(importedRow).toBeVisible({ timeout: 5000 });
      await expect(importButton).toBeEnabled({ timeout: 1000 });

      const successMessage = window.getByText(/تم (?:استيراد|تحديث) بنود (?:التكلفة|المنافسة)/, { exact: false });
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    } finally {
      await electronApp.close();
    }
  });
});
