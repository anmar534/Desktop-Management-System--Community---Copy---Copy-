/**
 * Test Utilities for Integration Tests
 * مساعدات الاختبار لاختبارات التكامل
 */

import type { EnhancedProject, ProjectPhase, ProjectMilestone } from '@/shared/types/projects'
import type { Tender } from '@/types/contracts'

/**
 * Generate unique ID for tests
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Create Mock Tender
 */
export function createMockTender(overrides?: Partial<Tender>): Tender {
  const id = overrides?.id || generateTestId('tender')

  return {
    id,
    name: 'مشروع اختباري',
    title: 'مشروع اختباري',
    description: 'وصف المشروع الاختباري',
    client: 'عميل اختباري',
    clientId: 'client_001',
    value: 1000000,
    status: 'won',
    phase: 'تنفيذ',
    category: 'Construction',
    location: 'الرياض',
    type: 'مباني',
    deadline: '2025-12-31',
    submissionDate: '2025-01-01',
    daysLeft: 300,
    progress: 0,
    priority: 'high',
    team: 'فريق اختباري',
    manager: 'مدير اختباري',
    managerId: 'manager_001',
    winChance: 75,
    competition: 'متوسطة',
    competitors: [],
    lastAction: 'تم إنشاء المشروع',
    requirements: [],
    documents: [],
    proposals: [],
    evaluationCriteria: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create Mock Project
 */
export function createMockProject(overrides?: Partial<EnhancedProject>): EnhancedProject {
  const id = overrides?.id || generateTestId('project')

  // Use type assertion to bypass complex nested types for testing
  const project = {
    id,
    name: 'مشروع اختباري',
    description: 'وصف المشروع الاختباري',
    clientId: 'client_001',
    client: 'عميل اختباري',
    status: 'planning',
    priority: 'medium',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    contractValue: 1100000,
    estimatedCost: 950000,
    actualCost: 0,
    spent: 0,
    remaining: 1000000,
    expectedProfit: 150000,
    progress: 0,
    manager: 'Test Manager',
    managerId: 'manager_001',
    phases: [],
    milestones: [],
    risks: [],
    attachments: [],
    notes: '',
    metadata: {},
    createdBy: 'test_user',
    lastModifiedBy: 'test_user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    linkedPurchaseOrders: [],
    ...overrides,
  } as EnhancedProject

  return project
}

/**
 * Create Mock Project Phase
 */
export function createMockPhase(overrides?: Partial<ProjectPhase>): ProjectPhase {
  const id = overrides?.id || generateTestId('phase')

  return {
    id,
    name: 'مرحلة اختبارية',
    nameEn: 'Test Phase',
    description: 'وصف المرحلة الاختبارية',
    order: 1,
    estimatedDuration: 30,
    dependencies: [],
    milestones: [],
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'pending',
    progress: 0,
    ...overrides,
  }
}

/**
 * Create Mock Project Milestone
 */
export function createMockMilestone(overrides?: Partial<ProjectMilestone>): ProjectMilestone {
  const id = overrides?.id || generateTestId('milestone')

  return {
    id,
    name: 'معلم اختباري',
    nameEn: 'Test Milestone',
    description: 'وصف المعلم الاختباري',
    targetDate: '2025-01-15',
    status: 'pending',
    progress: 0,
    deliverables: [],
    dependencies: [],
    ...overrides,
  }
}

/**
 * Create Mock BOQ Data
 */
export function createMockBOQ(
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  const id = (overrides?.id as string) || generateTestId('boq')

  return {
    id,
    projectId: overrides?.projectId || generateTestId('project'),
    tenderId: overrides?.tenderId,
    items: overrides?.items || [
      {
        id: generateTestId('boq_item'),
        description: 'بند اختباري 1',
        quantity: 100,
        unit: 'متر',
        unitPrice: 50,
        totalPrice: 5000,
      },
      {
        id: generateTestId('boq_item'),
        description: 'بند اختباري 2',
        quantity: 200,
        unit: 'متر',
        unitPrice: 75,
        totalPrice: 15000,
      },
    ],
    totalValue: overrides?.totalValue || 20000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create Mock Purchase Order
 */
export function createMockPurchaseOrder(
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  const id = (overrides?.id as string) || generateTestId('po')

  return {
    id,
    orderNumber: `PO-2025-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`,
    projectId: overrides?.projectId,
    supplier: 'مورد اختباري',
    supplierId: 'supplier_001',
    totalAmount: 50000,
    status: 'pending',
    category: 'مواد',
    items: overrides?.items || [
      {
        id: generateTestId('po_item'),
        description: 'صنف اختباري',
        quantity: 10,
        unitPrice: 5000,
        totalPrice: 50000,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create Mock Project with Tender Link
 */
export function createMockProjectWithTenderLink(tenderId?: string): EnhancedProject {
  const tender = createMockTender({ id: tenderId || generateTestId('tender') })

  const project = createMockProject({
    fromTender: {
      tenderId: tender.id,
      tenderName: tender.name,
      tenderValue: tender.value,
      winDate: new Date().toISOString(),
      boqTransferred: true,
      budgetCalculated: true,
      teamAssigned: false,
      clientMapped: true,
    },
    tenderLink: {
      id: generateTestId('tpl'),
      tenderId: tender.id,
      projectId: generateTestId('project'),
      linkType: 'created_from',
      linkDate: new Date().toISOString(),
      metadata: {
        createdBy: 'system',
        autoGenerated: true,
      },
    },
  })

  return project
}

/**
 * Create Test Project with Purchase Orders
 */
export function createTestProjectWithPOs(poCount = 2): {
  project: EnhancedProject
  purchaseOrders: Record<string, unknown>[]
} {
  const project = createMockProject()
  const purchaseOrders = Array.from({ length: poCount }, (_, index) =>
    createMockPurchaseOrder({
      projectId: project.id,
      totalAmount: (index + 1) * 25000,
      status: index === 0 ? 'completed' : 'pending',
    }),
  )

  return { project, purchaseOrders }
}

/**
 * Wait for async operations
 */
export function wait(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create Mock Timeline Phases
 */
export function createMockTimelinePhases(count = 3): ProjectPhase[] {
  const phases: ProjectPhase[] = []
  let currentStartDate = new Date('2025-01-01')

  for (let i = 0; i < count; i++) {
    const duration = 30 + i * 15 // 30, 45, 60 days
    const endDate = new Date(currentStartDate)
    endDate.setDate(endDate.getDate() + duration)

    phases.push(
      createMockPhase({
        id: `phase_${i + 1}`,
        name: `المرحلة ${i + 1}`,
        nameEn: `Phase ${i + 1}`,
        order: i + 1,
        estimatedDuration: duration,
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dependencies: i > 0 ? [`phase_${i}`] : [],
        status: i === 0 ? 'in_progress' : 'pending',
        progress: i === 0 ? 50 : 0,
        milestones: [
          createMockMilestone({
            id: `milestone_${i + 1}_1`,
            name: `معلم ${i + 1}.1`,
            targetDate: new Date(currentStartDate.getTime() + duration * 0.5 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          }),
        ],
      }),
    )

    currentStartDate = endDate
  }

  return phases
}

/**
 * Calculate Project Timeline Bounds
 */
export function calculateTimelineBounds(phases: ProjectPhase[]): {
  startDate: string
  endDate: string
  totalDays: number
} {
  if (phases.length === 0) {
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalDays: 90,
    }
  }

  const startDates = phases
    .map((p) => p.startDate)
    .filter(Boolean)
    .map((d) => new Date(d!))
  const endDates = phases
    .map((p) => p.endDate)
    .filter(Boolean)
    .map((d) => new Date(d!))

  const minDate = new Date(Math.min(...startDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...endDates.map((d) => d.getTime())))

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    startDate: minDate.toISOString().split('T')[0],
    endDate: maxDate.toISOString().split('T')[0],
    totalDays,
  }
}
