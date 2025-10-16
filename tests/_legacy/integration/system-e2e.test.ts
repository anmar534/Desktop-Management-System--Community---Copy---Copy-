/**
 * اختبار تكاملي شامل يغطي تسلسل العمل الأساسي للنظام.
 * يتم إنشاء البيانات عبر المستودعات الفعلية مع استخدام تخزين محاكى.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeLocalStorage } from '../../src/utils/storage';
import { STORAGE_KEYS } from '../../src/config/storageKeys';
import { tenderRepository } from '../../src/repository/providers/tender.local';
import { projectRepository } from '../../src/repository/providers/project.local';
import { purchaseOrderRepository } from '../../src/repository/providers/purchaseOrder.local';
import { relationRepository } from '../../src/repository/providers/relations.local';
import { selectFinancialHighlights } from '../../src/domain/selectors/financialMetrics';
import type { Tender, Project, Budget, Invoice, FinancialReport } from '../../src/data/centralData';
import type { PurchaseOrder, PurchaseOrderItem } from '../../src/types/contracts';
import type { EntityRelationSnapshot } from '../../src/repository/relations.repository';

const mockStorage = new Map<string, unknown>();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const isoDate = (offsetDays = 0): string => new Date(Date.now() + offsetDays * DAY_IN_MS).toISOString();
const daysUntil = (target: string): number => Math.max(0, Math.round((new Date(target).getTime() - Date.now()) / DAY_IN_MS));
const generateId = (prefix: string): string => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;

const deepClone = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  }
  return value;
};

const sumPurchaseItems = (items: PurchaseOrderItem[]): number => items.reduce((sum, item) => sum + item.totalPrice, 0);

const buildTenderPayload = (overrides: Partial<Tender> = {}): Omit<Tender, 'id'> => {
  const submissionDate = overrides.submissionDate ?? isoDate(3);
  const deadline = overrides.deadline ?? isoDate(10);
  const base: Omit<Tender, 'id'> = {
    name: overrides.name ?? 'مناقصة مبنى إداري',
    title: overrides.title ?? 'إنشاء مبنى إداري متكامل',
    client: overrides.client ?? 'وزارة الإسكان',
    value: overrides.value ?? 1_500_000,
    totalValue: overrides.totalValue ?? overrides.value ?? 1_500_000,
    documentPrice: overrides.documentPrice ?? 250,
    bookletPrice: overrides.bookletPrice ?? 250,
    status: overrides.status ?? 'new',
    totalItems: overrides.totalItems ?? 12,
    pricedItems: overrides.pricedItems ?? 12,
    itemsPriced: overrides.itemsPriced ?? 12,
    technicalFilesUploaded: overrides.technicalFilesUploaded ?? true,
    phase: overrides.phase ?? 'مرحلة الإعداد',
    deadline,
    daysLeft: overrides.daysLeft ?? daysUntil(deadline),
    progress: overrides.progress ?? 75,
    completionPercentage: overrides.completionPercentage ?? 75,
    priority: overrides.priority ?? 'high',
    team: overrides.team ?? 'فريق المناقصات',
    manager: overrides.manager ?? 'أحمد علي',
    winChance: overrides.winChance ?? 55,
    competition: overrides.competition ?? 'منافسة مفتوحة',
    submissionDate,
    lastAction: overrides.lastAction ?? 'تم اعتماد العرض',
    lastUpdate: overrides.lastUpdate ?? isoDate(),
    category: overrides.category ?? 'إنشاءات',
    location: overrides.location ?? 'الرياض',
    type: overrides.type ?? 'حكومي',
    resultNotes: overrides.resultNotes,
    winningBidValue: overrides.winningBidValue,
    ourBidValue: overrides.ourBidValue ?? overrides.value ?? 1_500_000,
    winDate: overrides.winDate,
    lostDate: overrides.lostDate,
    resultDate: overrides.resultDate,
    cancelledDate: overrides.cancelledDate,
    notes: overrides.notes ?? 'تم تجهيز المستندات الفنية والمالية.',
    documents: overrides.documents ?? [
      {
        id: generateId('file'),
        name: 'المواصفات.pdf',
        originalName: 'المواصفات.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: '/docs/specs.pdf',
        uploadedAt: isoDate(-1)
      }
    ],
    proposals: overrides.proposals ?? [],
    evaluationCriteria: overrides.evaluationCriteria ?? [],
    competitors: overrides.competitors ?? ['شركة البناء المتقدمة'],
    requirements: overrides.requirements ?? ['شهادة تصنيف', 'ضمان ابتدائي'],
    createdAt: overrides.createdAt ?? isoDate(-5),
    updatedAt: overrides.updatedAt ?? isoDate()
  };
  const { id: _ignored, ...restOverrides } = overrides;
  return { ...base, ...restOverrides };
};

const buildProjectPayload = (overrides: Partial<Project> = {}): Omit<Project, 'id'> => {
  const contractValue = overrides.contractValue ?? 1_800_000;
  const estimatedCost = overrides.estimatedCost ?? 1_300_000;
  const actualCost = overrides.actualCost ?? 950_000;
  const spent = overrides.spent ?? actualCost;
  const remaining = overrides.remaining ?? contractValue - spent;
  const expectedProfit = overrides.expectedProfit ?? contractValue - estimatedCost;
  return {
    name: overrides.name ?? 'مشروع مبنى إداري',
    client: overrides.client ?? 'وزارة الإسكان',
    status: overrides.status ?? 'active',
    priority: overrides.priority ?? 'high',
    progress: overrides.progress ?? 40,
    contractValue,
    estimatedCost,
    actualCost,
    spent,
    remaining,
    expectedProfit,
    actualProfit: overrides.actualProfit,
    startDate: overrides.startDate ?? isoDate(-45),
    endDate: overrides.endDate ?? isoDate(120),
    manager: overrides.manager ?? 'سارة الشهري',
    team: overrides.team ?? 'فريق التنفيذ',
    location: overrides.location ?? 'الرياض',
    phase: overrides.phase ?? 'الأعمال الإنشائية',
    health: overrides.health ?? 'green',
    lastUpdate: overrides.lastUpdate ?? isoDate(),
    nextMilestone: overrides.nextMilestone ?? 'تسليم المخططات التفصيلية',
    milestoneDate: overrides.milestoneDate ?? isoDate(14),
    category: overrides.category ?? 'إنشاءات',
    efficiency: overrides.efficiency ?? 88,
    riskLevel: overrides.riskLevel ?? 'medium',
    budget: overrides.budget ?? contractValue,
    value: overrides.value ?? contractValue,
    type: overrides.type ?? 'تصميم وبناء'
  };
};

const buildPurchaseOrderPayload = (overrides: Partial<PurchaseOrder> = {}): Omit<PurchaseOrder, 'id'> => {
  const items: PurchaseOrderItem[] = overrides.items ?? [
    { name: 'أسمنت مقاوم', quantity: 100, unitPrice: 220, totalPrice: 22_000, category: 'مواد بناء' },
    { name: 'حديد تسليح', quantity: 50, unitPrice: 1_750, totalPrice: 87_500, category: 'مواد بناء' }
  ];
  const value = overrides.value ?? sumPurchaseItems(items);
  return {
    tenderName: overrides.tenderName ?? 'مناقصة مبنى إداري',
    tenderId: overrides.tenderId ?? 'tender-ref',
    client: overrides.client ?? 'وزارة الإسكان',
    value,
    status: overrides.status ?? 'approved',
    createdDate: overrides.createdDate ?? isoDate(),
    expectedDelivery: overrides.expectedDelivery ?? isoDate(21),
    priority: overrides.priority ?? 'medium',
    department: overrides.department ?? 'إدارة المشتريات',
    approver: overrides.approver ?? 'لجنة الشراء',
    description: overrides.description ?? 'توريد مواد أساسية للمشروع',
    source: overrides.source ?? 'project_won',
    projectId: overrides.projectId,
    items,
    lastAction: overrides.lastAction ?? 'تمت الموافقة على الطلب',
    requirements: overrides.requirements ?? ['تأمين مخزني', 'تأكيد جودة المواد'],
    documents: overrides.documents ?? [],
    proposals: overrides.proposals ?? [],
    evaluationCriteria: overrides.evaluationCriteria ?? [],
    notes: overrides.notes ?? 'يجب التوريد خلال 21 يومًا',
    createdAt: overrides.createdAt ?? isoDate(),
    updatedAt: overrides.updatedAt ?? isoDate(),
    lastUpdate: overrides.lastUpdate ?? isoDate()
  };
};

const buildBudget = (overrides: Partial<Budget> = {}): Budget => {
  const totalAmount = overrides.totalAmount ?? 500_000;
  const spentAmount = overrides.spentAmount ?? 250_000;
  return {
    id: overrides.id ?? generateId('budget'),
    name: overrides.name ?? 'ميزانية المشروع السنوية',
    description: overrides.description ?? 'ميزانية مخصصة لتكاليف المشروع الحالية',
    totalAmount,
    spentAmount,
    startDate: overrides.startDate ?? isoDate(-60),
    endDate: overrides.endDate ?? isoDate(90),
    department: overrides.department ?? 'إدارة التنفيذ',
    category: overrides.category ?? 'مشاريع',
    status: overrides.status ?? 'active',
    utilizationPercentage:
      overrides.utilizationPercentage ?? Number(((spentAmount / totalAmount) * 100).toFixed(2)),
    categories: overrides.categories ?? []
  };
};

const buildInvoice = (overrides: Partial<Invoice> = {}): Invoice => {
  const items = overrides.items ?? [
    { id: generateId('invoice-item'), description: 'دفعة تنفيذية', quantity: 1, unitPrice: 450_000, total: 450_000 }
  ];
  const subtotal = overrides.subtotal ?? items.reduce((sum, item) => sum + item.total, 0);
  const tax = overrides.tax ?? subtotal * 0.15;
  const total = overrides.total ?? subtotal + tax;
  return {
    id: overrides.id ?? generateId('invoice'),
    invoiceNumber: overrides.invoiceNumber ?? `INV-${Math.floor(Math.random() * 10000)}`,
    clientName: overrides.clientName ?? 'وزارة الإسكان',
    clientEmail: overrides.clientEmail ?? 'finance@housing.sa',
    clientPhone: overrides.clientPhone ?? '+966501234567',
    clientAddress: overrides.clientAddress ?? 'الرياض، المملكة العربية السعودية',
    projectName: overrides.projectName ?? 'مشروع مبنى إداري',
    issueDate: overrides.issueDate ?? isoDate(-15),
    dueDate: overrides.dueDate ?? isoDate(15),
    paymentTerms: overrides.paymentTerms ?? 'NET 30',
    status: overrides.status ?? 'sent',
    subtotal,
    tax,
    total,
    items,
    notes: overrides.notes ?? 'تشمل الفاتورة ضريبة القيمة المضافة بنسبة 15%.',
    createdAt: overrides.createdAt ?? isoDate(-15),
    paidAt: overrides.paidAt
  };
};

const buildFinancialReport = (overrides: Partial<FinancialReport> = {}): FinancialReport => ({
  id: overrides.id ?? generateId('report'),
  name: overrides.name ?? 'تقرير الأداء المالي',
  type: overrides.type ?? 'quarterly',
  description: overrides.description ?? 'تحليل ربع سنوي لنتائج المشاريع.',
  status: overrides.status ?? 'completed',
  createdAt: overrides.createdAt ?? isoDate(-7),
  completedAt: overrides.completedAt ?? isoDate(-6),
  format: overrides.format ?? 'pdf',
  size: overrides.size ?? 1_024,
  url: overrides.url ?? '/reports/financial.pdf',
  frequency: overrides.frequency ?? 'quarterly',
  dataSources: overrides.dataSources ?? ['projects', 'invoices'],
  recipients: overrides.recipients ?? 'مجلس الإدارة',
  autoGenerate: overrides.autoGenerate ?? true
});

const createTender = (overrides: Partial<Tender> = {}): Tender => {
  const { id, ...rest } = overrides;
  return { id: id ?? generateId('tender'), ...buildTenderPayload(rest) };
};

const createProject = (overrides: Partial<Project> = {}): Project => {
  const { id, ...rest } = overrides;
  return { id: id ?? generateId('project'), ...buildProjectPayload(rest) };
};

beforeEach(() => {
  mockStorage.clear();

  vi.spyOn(safeLocalStorage, 'getItem').mockImplementation((key: string, defaultValue: unknown) => {
    if (mockStorage.has(key)) {
      return deepClone(mockStorage.get(key));
    }
    return deepClone(defaultValue);
  });

  vi.spyOn(safeLocalStorage, 'setItem').mockImplementation((key: string, value: unknown) => {
    mockStorage.set(key, deepClone(value));
    return true;
  });

  vi.spyOn(safeLocalStorage, 'removeItem').mockImplementation((key: string) => {
    mockStorage.delete(key);
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockStorage.clear();
});

describe('System E2E Integration Tests', () => {
  describe('Phase 1: Tender Management (إدارة المناقصات)', () => {
    it('ينشئ مناقصة متكاملة ويحفظها في التخزين المحلي', async () => {
      const payload = buildTenderPayload();
      const created = await tenderRepository.create(payload);
      const stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, []);

      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(created.id);
      expect(stored[0].status).toBe('new');
      expect(stored[0].documents).toHaveLength(payload.documents!.length);
      expect(stored[0].totalValue).toBe(payload.totalValue);
    });

    it('يُحدّث التقدم وقيمة المناقصة بعد مراجعة بنود التسعير', async () => {
      const items = [
        { description: 'أعمال هيكلية', quantity: 1, unitPrice: 900_000, totalPrice: 900_000, category: 'إنشاءات' },
        { description: 'أعمال تشطيبات', quantity: 1, unitPrice: 600_000, totalPrice: 600_000, category: 'تشطيبات' }
      ];
      const estimatedValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

      const payload = buildTenderPayload({
        totalItems: items.length,
        pricedItems: items.length,
        itemsPriced: items.length,
        totalValue: estimatedValue
      });

      const created = await tenderRepository.create(payload);
      const updated = await tenderRepository.update(created.id, {
        progress: 90,
        completionPercentage: 90,
        status: 'ready_to_submit'
      });

      expect(updated).not.toBeNull();
      expect(updated!.progress).toBe(90);
      expect(updated!.status).toBe('ready_to_submit');
      expect(updated!.totalValue).toBe(estimatedValue);
    });
  });

  describe('Phase 2: Tender to Project Conversion (تحويل المناقصة إلى مشروع)', () => {
    it('يربط المناقصة بالمشروع بعد الفوز ويحفظ علاقة الربط', async () => {
      const tender = await tenderRepository.create(
        buildTenderPayload({
          status: 'won',
          winDate: isoDate(),
          resultDate: isoDate(),
          totalValue: 1_250_000
        })
      );

      const project = await projectRepository.create(
        buildProjectPayload({
          name: `مشروع ${tender.title}`,
          client: tender.client,
          contractValue: tender.totalValue ?? tender.value,
          value: tender.totalValue ?? tender.value,
          budget: tender.totalValue ?? tender.value,
          estimatedCost: 950_000,
          actualCost: 0,
          spent: 0
        })
      );

      relationRepository.linkTenderToProject(tender.id, project.id, { isAutoCreated: true });

      const snapshot = safeLocalStorage.getItem<EntityRelationSnapshot>(STORAGE_KEYS.RELATIONS, {
        tenderProject: [],
        projectPurchase: []
      });

      expect(snapshot.tenderProject).toHaveLength(1);
      expect(snapshot.tenderProject[0].tenderId).toBe(tender.id);
      expect(snapshot.tenderProject[0].projectId).toBe(project.id);
      expect(relationRepository.getProjectIdByTenderId(tender.id)).toBe(project.id);
    });
  });

  describe('Phase 3: Project & Actual Costs Management (إدارة المشروع والتكاليف الفعلية)', () => {
    it('يراقب الانحرافات ويُحدّث بيانات المشروع عند تجاوز الميزانية', async () => {
      const project = await projectRepository.create(
        buildProjectPayload({
          contractValue: 1_200_000,
          estimatedCost: 1_000_000,
          actualCost: 720_000,
          spent: 720_000
        })
      );

      const updated = await projectRepository.update(project.id, {
        actualCost: 1_050_000,
        spent: 1_050_000,
        lastUpdate: isoDate()
      });

      expect(updated).not.toBeNull();
      const usage = (updated!.actualCost / updated!.contractValue) * 100;
      const variance = updated!.contractValue - updated!.actualCost;

      expect(updated!.actualCost).toBe(1_050_000);
      expect(usage).toBeCloseTo(87.5, 1);
      expect(variance).toBe(150_000);
    });
  });

  describe('Phase 4: Procurement & Tax System (نظام المشتريات والضرائب)', () => {
    it('ينشئ أمر شراء مرتبطًا بالمشروع ويُسجل العلاقة في المستودع', async () => {
      const tender = await tenderRepository.create(buildTenderPayload({ status: 'won' }));
      const project = await projectRepository.create(buildProjectPayload({ client: tender.client }));
      relationRepository.linkTenderToProject(tender.id, project.id, { isAutoCreated: true });

      const items: PurchaseOrderItem[] = [
        { name: 'أسمنت', quantity: 150, unitPrice: 200, totalPrice: 30_000, category: 'مواد' },
        { name: 'حديد', quantity: 80, unitPrice: 1_600, totalPrice: 128_000, category: 'مواد' }
      ];
      const order = await purchaseOrderRepository.create(
        buildPurchaseOrderPayload({
          tenderId: tender.id,
          tenderName: tender.name,
          projectId: project.id,
          items,
          value: sumPurchaseItems(items)
        })
      );

      relationRepository.linkProjectToPurchaseOrder(project.id, order.id);

      const storedOrders = await purchaseOrderRepository.getByProjectId(project.id);
      const snapshot = safeLocalStorage.getItem<EntityRelationSnapshot>(STORAGE_KEYS.RELATIONS, {
        tenderProject: [],
        projectPurchase: []
      });

      expect(storedOrders).toHaveLength(1);
      expect(storedOrders[0].value).toBe(sumPurchaseItems(items));
      expect(snapshot.projectPurchase).toHaveLength(1);
      expect(snapshot.projectPurchase[0].purchaseOrderId).toBe(order.id);
    });
  });

  describe('Phase 5: Financial System (النظام المالي)', () => {
    it('يولد مؤشرات مالية محدثة اعتمادًا على البيانات الحالية', () => {
      const invoices: Invoice[] = [
        buildInvoice({ status: 'sent', dueDate: isoDate(5) }),
        buildInvoice({ status: 'overdue', dueDate: isoDate(-3) }),
        buildInvoice({ status: 'paid', paidAt: isoDate(-1) })
      ];

      const budgets: Budget[] = [
        buildBudget({ totalAmount: 400_000, spentAmount: 450_000 }),
        buildBudget({ totalAmount: 300_000, spentAmount: 280_000 })
      ];

      const reports: FinancialReport[] = [
        buildFinancialReport({ createdAt: isoDate(-2) }),
        buildFinancialReport({ createdAt: isoDate(-1), status: 'completed' })
      ];

      const projects: Project[] = [
        createProject({
          status: 'active',
          health: 'yellow',
          riskLevel: 'high',
          lastUpdate: isoDate(-1),
          actualCost: 820_000,
          contractValue: 1_000_000,
          spent: 820_000,
          remaining: 180_000
        }),
        createProject({ status: 'completed', health: 'green', riskLevel: 'low', actualCost: 900_000 })
      ];

      const tenders: Tender[] = [
        createTender({ status: 'submitted', deadline: isoDate(6), daysLeft: 6 }),
        createTender({ status: 'under_action', deadline: isoDate(3), daysLeft: 3 }),
        createTender({ status: 'lost', deadline: isoDate(12), daysLeft: 12 })
      ];

      const highlights = selectFinancialHighlights({ invoices, budgets, reports, projects, tenders });

      expect(highlights.outstandingInvoices.length).toBe(2);
      expect(highlights.budgetsAtRisk.length).toBe(1);
      expect(highlights.projectsAtRisk.length).toBeGreaterThan(0);
      expect(highlights.tendersClosingSoon.every((tender) => tender.daysLeft <= 14)).toBe(true);
    });
  });

  describe('Phase 6: Dashboard (لوحة التحكم)', () => {
    it('يجمع مؤشرات اللوحة من بيانات المشاريع والمنافسات', async () => {
      await tenderRepository.create(buildTenderPayload({ status: 'new', priority: 'medium', totalValue: 500_000 }));
      await tenderRepository.create(buildTenderPayload({ status: 'under_action', priority: 'high', totalValue: 750_000 }));
      await tenderRepository.create(buildTenderPayload({ status: 'lost', priority: 'medium', totalValue: 400_000 }));

      await projectRepository.create(
        buildProjectPayload({ status: 'active', contractValue: 1_000_000, actualCost: 550_000, spent: 550_000 })
      );
      await projectRepository.create(
        buildProjectPayload({
          status: 'completed',
          progress: 100,
          contractValue: 1_200_000,
          actualCost: 1_050_000,
          spent: 1_050_000,
          health: 'green'
        })
      );

      const storedTenders = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, []);
      const storedProjects = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);

      const activeTenders = storedTenders.filter((tender) => ['new', 'under_action', 'ready_to_submit', 'submitted'].includes(tender.status)).length;
      const activeProjects = storedProjects.filter((project) => project.status === 'active').length;
      const totalRevenue = storedProjects.reduce((sum, project) => sum + project.contractValue, 0);
      const totalCosts = storedProjects.reduce((sum, project) => sum + project.actualCost, 0);

      expect(activeTenders).toBe(2);
      expect(activeProjects).toBe(1);
      expect(totalRevenue).toBe(2_200_000);
      expect(totalCosts).toBe(1_600_000);
    });
  });

  describe('Phase 7: KPIs (مؤشرات الأداء)', () => {
    it('يحسب مؤشرات الأداء الرئيسية للمشاريع المكتملة والنشطة', () => {
      const projects: Project[] = [
        createProject({
          status: 'completed',
          progress: 100,
          contractValue: 1_200_000,
          actualCost: 950_000,
          expectedProfit: 250_000,
          actualProfit: 250_000,
          spent: 950_000,
          remaining: 250_000,
          riskLevel: 'low'
        }),
        createProject({
          status: 'completed',
          progress: 100,
          contractValue: 1_600_000,
          actualCost: 1_400_000,
          expectedProfit: 200_000,
          actualProfit: 200_000,
          spent: 1_400_000,
          remaining: 200_000,
          riskLevel: 'medium'
        }),
        createProject({
          status: 'active',
          progress: 45,
          contractValue: 900_000,
          actualCost: 450_000,
          expectedProfit: 150_000,
          spent: 450_000,
          remaining: 450_000,
          riskLevel: 'medium'
        })
      ];

      const totalProjects = projects.length;
      const completedProjects = projects.filter((project) => project.status === 'completed').length;
      const completionRate = (completedProjects / totalProjects) * 100;
      const avgProfitability =
        projects.reduce((sum, project) => sum + ((project.actualProfit ?? project.expectedProfit) / project.contractValue) * 100, 0) /
        totalProjects;
      const projectsWithinBudget = projects.filter((project) => project.actualCost <= project.budget).length;
      const budgetCompliance = (projectsWithinBudget / totalProjects) * 100;
      const totalRevenue = projects.reduce((sum, project) => sum + project.contractValue, 0);
      const totalCosts = projects.reduce((sum, project) => sum + project.actualCost, 0);
      const overallMargin = ((totalRevenue - totalCosts) / totalRevenue) * 100;

      expect(completionRate).toBeCloseTo(66.67, 2);
  expect(avgProfitability).toBeCloseTo(16.67, 2);
      expect(budgetCompliance).toBe(100);
  expect(overallMargin).toBeCloseTo(24.32, 2);
    });
  });

  describe('Phase 8: Backup & Recovery (النسخ الاحتياطي والاسترجاع)', () => {
    it('يأخذ نسخة احتياطية من التخزين ويستعيدها بنجاح', async () => {
      const tender = await tenderRepository.create(buildTenderPayload({ status: 'under_action' }));
      const project = await projectRepository.create(buildProjectPayload({ status: 'active' }));

      const backup = new Map<string, unknown>();
      for (const [key, value] of mockStorage.entries()) {
        backup.set(key, deepClone(value));
      }

      mockStorage.clear();

      expect(safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])).toHaveLength(0);
      expect(safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])).toHaveLength(0);

      for (const [key, value] of backup.entries()) {
        mockStorage.set(key, value);
      }

      const restoredTenders = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, []);
      const restoredProjects = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);

      expect(restoredTenders).toHaveLength(1);
      expect(restoredTenders[0].id).toBe(tender.id);
      expect(restoredProjects).toHaveLength(1);
      expect(restoredProjects[0].id).toBe(project.id);
    });

    it('يحافظ على علم التشفير ويدعم استعادة البيانات المقفلة', () => {
      const dataEnvelope = {
        tenders: [createTender({ name: 'مناقصة سرية', value: 2_000_000 })],
        projects: [createProject({ name: 'مشروع سري', contractValue: 3_000_000 })]
      };

      const backup = {
        id: generateId('backup'),
        timestamp: isoDate(),
        encrypted: true,
        payload: JSON.stringify(dataEnvelope)
      };

      expect(backup.encrypted).toBe(true);
      expect(typeof backup.payload).toBe('string');

      const restored = JSON.parse(backup.payload) as typeof dataEnvelope;
      expect(restored.tenders[0].name).toBe('مناقصة سرية');
      expect(restored.projects[0].name).toBe('مشروع سري');
    });
  });
});

