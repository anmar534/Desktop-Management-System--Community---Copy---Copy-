# ✅ قائمة مهام تنفيذ اختبارات التكامل - Week 4 Integration Tests

**التاريخ:** 27 أكتوبر 2025  
**المنهجية:** Test-Driven Development (TDD)  
**المدة المتوقعة:** 3-4 أيام عمل (24-30 ساعة)

---

## 🎯 المبادئ الأساسية

### **Test-Driven Development (TDD) Workflow:**

```
1. 🔴 Red: Write failing test first
2. 🟢 Green: Write minimal code to pass
3. 🔵 Refactor: Improve code quality
4. ♻️ Repeat
```

### **Best Practices:**

- ✅ اكتب الاختبار **قبل** التطبيق
- ✅ اختبار واحد في كل مرة
- ✅ Commit بعد كل اختبار ناجح
- ✅ استخدم Mock data واقعية
- ✅ اختبر Edge cases
- ✅ تأكد من الـ Cleanup بعد كل اختبار

---

## 📋 Phase 1: التحضير والإعداد (2-3 ساعات)

### ✅ Task 1.1: إعداد بيئة الاختبار

**الوقت:** 30 دقيقة

```bash
# 1. تأكد من تثبيت Dependencies
npm install --save-dev @testing-library/react @testing-library/user-event vitest

# 2. تحقق من إعداد Vitest
cat vitest.config.ts

# 3. تشغيل اختبار تجريبي
npm test -- --version
```

**Checklist:**

- [ ] Vitest installed and configured
- [ ] @testing-library/react installed
- [ ] Test utilities working
- [ ] Coverage tools configured

---

### ✅ Task 1.2: إنشاء Test Utilities والـ Helpers

**الوقت:** 1 ساعة

**الملف:** `tests/utils/testHelpers.ts`

```typescript
/**
 * Test Utilities for Integration Tests
 */

import { EnhancedProject } from '@/shared/types/projects'
import { Tender } from '@/types/tender'
import { BOQData } from '@/types/boq'
import { PurchaseOrder } from '@/types/purchaseOrder'

/**
 * Generate unique ID for tests
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Create Mock Tender
 */
export function createMockTender(overrides?: Partial<Tender>): Tender {
  return {
    id: generateTestId('tender'),
    name: 'مشروع اختباري',
    client: 'عميل اختباري',
    totalValue: 1000000,
    value: 1000000,
    status: 'won',
    startDate: '2025-01-01',
    deadline: '2025-12-31',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create Mock Project
 */
export function createMockProject(overrides?: Partial<EnhancedProject>): EnhancedProject {
  return {
    id: generateTestId('project'),
    name: 'مشروع اختباري',
    client: 'عميل اختباري',
    status: 'active',
    estimatedCost: 1000000,
    actualCost: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phases: [],
    attachments: [],
    ...overrides,
  } as EnhancedProject
}

/**
 * Create Mock BOQ
 */
export function createMockBOQ(overrides?: Partial<BOQData>): BOQData {
  return {
    id: generateTestId('boq'),
    items: [
      {
        id: 'item_1',
        description: 'أعمال حفر',
        descriptionEn: 'Excavation Works',
        quantity: 100,
        unit: 'م³',
        unitPrice: 50,
        totalPrice: 5000,
        materials: 20,
        labor: 15,
        equipment: 10,
        subcontractors: 5,
      },
      {
        id: 'item_2',
        description: 'أعمال خرسانة',
        descriptionEn: 'Concrete Works',
        quantity: 200,
        unit: 'م³',
        unitPrice: 150,
        totalPrice: 30000,
        materials: 80,
        labor: 40,
        equipment: 20,
        subcontractors: 10,
      },
    ],
    totalValue: 35000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create Mock Purchase Order
 */
export function createMockPurchaseOrder(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: generateTestId('po'),
    orderNumber: `PO-${Date.now()}`,
    supplier: 'مورد اختباري',
    totalAmount: 50000,
    status: 'pending',
    category: 'materials',
    items: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as PurchaseOrder
}

/**
 * Wait for async operations
 */
export async function waitFor(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Clean up test data
 */
export async function cleanupTestData(ids: string[]): Promise<void> {
  // Implementation depends on your storage mechanism
  // This is a placeholder
  console.log('Cleaning up test data:', ids)
}
```

**Checklist:**

- [ ] Test helpers created
- [ ] Mock data factories working
- [ ] ID generation working
- [ ] Cleanup utilities ready

---

### ✅ Task 1.3: إنشاء Mock Repositories

**الوقت:** 1 ساعة

**الملف:** `tests/mocks/mockRepositories.ts`

```typescript
/**
 * Mock Repositories for Testing
 */

import { vi } from 'vitest'
import { EnhancedProject, TenderProjectLink } from '@/shared/types/projects'
import { BOQData } from '@/types/boq'
import { PurchaseOrder } from '@/types/purchaseOrder'

/**
 * Mock Project Repository
 */
export function createMockProjectRepository() {
  const projects: EnhancedProject[] = []

  return {
    create: vi.fn(async (data: any): Promise<EnhancedProject> => {
      const project = { ...data, id: `proj_${Date.now()}` } as EnhancedProject
      projects.push(project)
      return project
    }),

    getById: vi.fn(async (id: string): Promise<EnhancedProject | null> => {
      return projects.find((p) => p.id === id) || null
    }),

    getAll: vi.fn(async (): Promise<EnhancedProject[]> => {
      return [...projects]
    }),

    update: vi.fn(
      async (id: string, updates: Partial<EnhancedProject>): Promise<EnhancedProject> => {
        const index = projects.findIndex((p) => p.id === id)
        if (index === -1) throw new Error('Project not found')

        projects[index] = { ...projects[index], ...updates }
        return projects[index]
      },
    ),

    delete: vi.fn(async (id: string): Promise<boolean> => {
      const index = projects.findIndex((p) => p.id === id)
      if (index === -1) return false

      projects.splice(index, 1)
      return true
    }),

    linkToTender: vi.fn(
      async (projectId: string, tenderId: string, linkType: string): Promise<TenderProjectLink> => {
        const project = projects.find((p) => p.id === projectId)
        if (!project) throw new Error('Project not found')

        const link: TenderProjectLink = {
          id: `link_${Date.now()}`,
          projectId,
          tenderId,
          linkType: linkType as any,
          linkDate: new Date().toISOString(),
          metadata: {},
        }

        project.tenderLink = link
        return link
      },
    ),

    unlinkFromTender: vi.fn(async (projectId: string): Promise<boolean> => {
      const project = projects.find((p) => p.id === projectId)
      if (!project || !project.tenderLink) return false

      project.tenderLink = undefined
      return true
    }),

    getProjectsFromTender: vi.fn(async (tenderId: string): Promise<EnhancedProject[]> => {
      return projects.filter((p) => p.tenderLink?.tenderId === tenderId)
    }),

    getTenderLink: vi.fn(async (projectId: string): Promise<TenderProjectLink | null> => {
      const project = projects.find((p) => p.id === projectId)
      return project?.tenderLink || null
    }),

    // Helper for tests
    _reset: () => {
      projects.length = 0
    },

    _getProjects: () => projects,
  }
}

/**
 * Mock BOQ Repository
 */
export function createMockBOQRepository() {
  const boqs: BOQData[] = []

  return {
    create: vi.fn(async (data: BOQData): Promise<BOQData> => {
      boqs.push(data)
      return data
    }),

    getByTenderId: vi.fn(async (tenderId: string): Promise<BOQData | null> => {
      return boqs.find((b) => b.tenderId === tenderId) || null
    }),

    getByProjectId: vi.fn(async (projectId: string): Promise<BOQData | null> => {
      return boqs.find((b) => b.projectId === projectId) || null
    }),

    update: vi.fn(async (id: string, updates: Partial<BOQData>): Promise<BOQData> => {
      const index = boqs.findIndex((b) => b.id === id)
      if (index === -1) throw new Error('BOQ not found')

      boqs[index] = { ...boqs[index], ...updates }
      return boqs[index]
    }),

    _reset: () => {
      boqs.length = 0
    },
  }
}

/**
 * Mock Purchase Order Repository
 */
export function createMockPurchaseOrderRepository() {
  const pos: PurchaseOrder[] = []

  return {
    create: vi.fn(async (data: any): Promise<PurchaseOrder> => {
      const po = { ...data, id: `po_${Date.now()}` } as PurchaseOrder
      pos.push(po)
      return po
    }),

    getById: vi.fn(async (id: string): Promise<PurchaseOrder | null> => {
      return pos.find((p) => p.id === id) || null
    }),

    getByProjectId: vi.fn(async (projectId: string): Promise<PurchaseOrder[]> => {
      return pos.filter((p) => p.projectId === projectId)
    }),

    update: vi.fn(async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      const index = pos.findIndex((p) => p.id === id)
      if (index === -1) throw new Error('PO not found')

      pos[index] = { ...pos[index], ...updates }
      return pos[index]
    }),

    _reset: () => {
      pos.length = 0
    },
  }
}
```

**Checklist:**

- [ ] Mock repositories created
- [ ] All CRUD methods implemented
- [ ] Tender linking methods mocked
- [ ] Reset helpers added

---

## 📋 Phase 2: Tender Integration Tests (يوم واحد - 8 ساعات)

### ✅ Task 2.1: Repository Integration Test 1

**الوقت:** 1.5 ساعة

**النهج:** TDD - اكتب الاختبار أولاً

**الملف:** `tests/integration/tenderProjectIntegration.test.ts`

```typescript
/**
 * Tender-Project Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMockProjectRepository, createMockBOQRepository } from '../mocks/mockRepositories'
import { createMockTender, createMockProject, generateTestId } from '../utils/testHelpers'

describe('Tender-Project Repository Integration', () => {
  let projectRepo: ReturnType<typeof createMockProjectRepository>
  let testIds: string[] = []

  beforeEach(() => {
    projectRepo = createMockProjectRepository()
  })

  afterEach(() => {
    projectRepo._reset()
    testIds = []
  })

  describe('linkToTender', () => {
    it('should link project to tender and retrieve it', async () => {
      // 🔴 RED: Write test first (will fail)

      // Setup
      const tender = createMockTender({ id: 'tender_001', name: 'منافسة اختبارية' })
      const project = await projectRepo.create({
        name: 'مشروع اختبار',
        client: 'عميل اختبار',
        status: 'active',
      })
      testIds.push(project.id)

      // Execute
      const link = await projectRepo.linkToTender(project.id, tender.id, 'created_from')

      // Verify link created
      expect(link).toBeDefined()
      expect(link.tenderId).toBe(tender.id)
      expect(link.projectId).toBe(project.id)
      expect(link.linkType).toBe('created_from')
      expect(link.linkDate).toBeDefined()

      // Verify link persisted
      const updatedProject = await projectRepo.getById(project.id)
      expect(updatedProject?.tenderLink).toBeDefined()
      expect(updatedProject?.tenderLink?.tenderId).toBe(tender.id)

      // Verify retrieval
      const linkedProjects = await projectRepo.getProjectsFromTender(tender.id)
      expect(linkedProjects).toHaveLength(1)
      expect(linkedProjects[0].id).toBe(project.id)

      // 🟢 GREEN: Now implement the code to make it pass
      // 🔵 REFACTOR: Improve if needed
    })
  })
})
```

**الخطوات:**

1. **🔴 Red Phase:**

```bash
# اكتب الاختبار
code tests/integration/tenderProjectIntegration.test.ts

# شغّل الاختبار (سيفشل)
npm test -- tenderProjectIntegration

# Expected: ❌ Test fails - method not implemented
```

2. **🟢 Green Phase:**

```bash
# طبّق الكود في Repository
code src/repository/providers/enhancedProject.local.ts

# شغّل الاختبار مرة أخرى
npm test -- tenderProjectIntegration

# Expected: ✅ Test passes
```

3. **🔵 Refactor Phase:**

```bash
# حسّن الكود إذا لزم
# تأكد أن الاختبار لا يزال يمر

# Commit
git add .
git commit -m "test: add tender link integration test"
```

**Checklist:**

- [ ] Test written and failing (Red)
- [ ] Implementation complete (Green)
- [ ] Code refactored (Blue)
- [ ] Test passing
- [ ] Committed to git

---

### ✅ Task 2.2: Repository Integration Test 2

**الوقت:** 1 ساعة

```typescript
describe('unlinkFromTender', () => {
  it('should unlink project from tender', async () => {
    // Setup - Create project with tender link
    const tender = createMockTender({ id: 'tender_002' })
    const project = await projectRepo.create({
      name: 'مشروع مرتبط',
      client: 'عميل',
      status: 'active',
    })
    await projectRepo.linkToTender(project.id, tender.id, 'created_from')
    testIds.push(project.id)

    // Verify link exists
    let linkedProject = await projectRepo.getById(project.id)
    expect(linkedProject?.tenderLink).toBeDefined()

    // Execute - Unlink
    const result = await projectRepo.unlinkFromTender(project.id)

    // Verify
    expect(result).toBe(true)

    linkedProject = await projectRepo.getById(project.id)
    expect(linkedProject?.tenderLink).toBeUndefined()

    // Verify no longer in tender's projects
    const linkedProjects = await projectRepo.getProjectsFromTender(tender.id)
    expect(linkedProjects).toHaveLength(0)
  })

  it('should return false when unlinking non-existent link', async () => {
    const project = await projectRepo.create({
      name: 'مشروع بدون ربط',
      client: 'عميل',
      status: 'active',
    })
    testIds.push(project.id)

    const result = await projectRepo.unlinkFromTender(project.id)

    expect(result).toBe(false)
  })
})
```

**الخطوات:** نفس TDD cycle (Red → Green → Refactor)

**Checklist:**

- [ ] Test 2.1 written and passing
- [ ] Test 2.2 written and passing
- [ ] Edge case tested
- [ ] Committed

---

### ✅ Task 2.3: Repository Integration Test 3

**الوقت:** 1 ساعة

```typescript
describe('duplicate link prevention', () => {
  it('should prevent duplicate tender links', async () => {
    // Setup
    const project = await projectRepo.create({
      name: 'مشروع',
      client: 'عميل',
      status: 'active',
    })
    testIds.push(project.id)

    // Link to first tender
    await projectRepo.linkToTender(project.id, 'tender_001', 'created_from')

    // Try to link to second tender
    await expect(
      projectRepo.linkToTender(project.id, 'tender_002', 'created_from'),
    ).rejects.toThrow(/already linked/i)

    // Verify still linked to first tender only
    const linkedProject = await projectRepo.getById(project.id)
    expect(linkedProject?.tenderLink?.tenderId).toBe('tender_001')
  })
})
```

**Checklist:**

- [ ] Test written
- [ ] Error handling implemented
- [ ] Test passing
- [ ] Committed

---

### ✅ Task 2.4: Auto-Creation Integration Test 1

**الوقت:** 2 ساعات

**الملف:** نفس الملف، test suite جديد

```typescript
import { ProjectAutoCreationService } from '@/application/services/projectAutoCreation'

describe('Project Auto-Creation from Tender', () => {
  let projectRepo: ReturnType<typeof createMockProjectRepository>
  let boqRepo: ReturnType<typeof createMockBOQRepository>
  let testIds: string[] = []

  beforeEach(() => {
    projectRepo = createMockProjectRepository()
    boqRepo = createMockBOQRepository()
  })

  afterEach(() => {
    projectRepo._reset()
    boqRepo._reset()
    testIds = []
  })

  describe('BOQ Transfer', () => {
    it('should create project with complete BOQ transfer', async () => {
      // Setup
      const tender = createMockTender({
        id: 'tender_003',
        name: 'مشروع مبنى إداري',
        client: 'وزارة الإسكان',
        totalValue: 5000000,
      })

      const boq = createMockBOQ({
        id: 'boq_001',
        tenderId: tender.id,
        items: [
          {
            id: 'item_1',
            description: 'أعمال حفر',
            descriptionEn: 'Excavation',
            quantity: 100,
            unit: 'م³',
            unitPrice: 50,
            totalPrice: 5000,
            materials: 20,
            labor: 15,
            equipment: 10,
            subcontractors: 5,
          },
          {
            id: 'item_2',
            description: 'أعمال خرسانة',
            descriptionEn: 'Concrete',
            quantity: 200,
            unit: 'م³',
            unitPrice: 150,
            totalPrice: 30000,
            materials: 80,
            labor: 40,
            equipment: 20,
            subcontractors: 10,
          },
        ],
        totalValue: 35000,
      })

      // Save BOQ to mock repo
      await boqRepo.create(boq)

      // Execute
      const result = await ProjectAutoCreationService.createProjectFromWonTender(tender, {
        copyBOQ: true,
      })

      // Verify project created
      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.project.name).toContain(tender.name)
      expect(result.project.client).toBe(tender.client)
      expect(result.project.fromTender?.tenderId).toBe(tender.id)
      testIds.push(result.project.id)

      // Verify BOQ transferred
      const projectBOQ = await boqRepo.getByProjectId(result.project.id)
      expect(projectBOQ).toBeDefined()
      expect(projectBOQ?.items).toHaveLength(2)
      expect(projectBOQ?.items[0].description).toBe('أعمال حفر')
      expect(projectBOQ?.items[1].description).toBe('أعمال خرسانة')
      expect(projectBOQ?.totalValue).toBe(35000)

      // Verify BOQ items copied (not referenced)
      expect(projectBOQ?.id).not.toBe(boq.id)
      expect(projectBOQ?.tenderId).toBeUndefined()
      expect(projectBOQ?.projectId).toBe(result.project.id)
    })
  })
})
```

**الخطوات:**

1. 🔴 اكتب الاختبار (سيفشل)
2. 🟢 طبّق Service method
3. 🔵 حسّن الكود
4. ✅ Commit

**Checklist:**

- [ ] BOQ transfer test written
- [ ] Service method implemented
- [ ] Deep copy verified
- [ ] Test passing
- [ ] Committed

---

### ✅ Task 2.5: Auto-Creation Integration Test 2

**الوقت:** 1.5 ساعة

```typescript
describe('Attachments Transfer', () => {
  it('should create project with attachments transfer', async () => {
    // Setup
    const tender = createMockTender({
      id: 'tender_004',
      name: 'مشروع اختبار',
      attachments: [
        {
          id: 'att_1',
          name: 'contract.pdf',
          url: '/files/contract.pdf',
          size: 1024000,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'att_2',
          name: 'specifications.pdf',
          url: '/files/specs.pdf',
          size: 2048000,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
        },
      ],
    })

    // Execute
    const result = await ProjectAutoCreationService.createProjectFromWonTender(tender, {
      copyAttachments: true,
    })

    // Verify
    expect(result.success).toBe(true)
    expect(result.project.attachments).toBeDefined()
    expect(result.project.attachments).toHaveLength(2)

    // Verify first attachment
    expect(result.project.attachments[0].name).toContain('contract')
    expect(result.project.attachments[0].url).toBeDefined()

    // Verify second attachment
    expect(result.project.attachments[1].name).toContain('specifications')

    // Verify attachments copied (new IDs)
    expect(result.project.attachments[0].id).not.toBe(tender.attachments![0].id)
    expect(result.project.attachments[1].id).not.toBe(tender.attachments![1].id)

    testIds.push(result.project.id)
  })

  it('should handle tender without attachments', async () => {
    const tender = createMockTender({
      id: 'tender_005',
      attachments: [],
    })

    const result = await ProjectAutoCreationService.createProjectFromWonTender(tender, {
      copyAttachments: true,
    })

    expect(result.success).toBe(true)
    expect(result.project.attachments).toEqual([])
  })
})
```

**Checklist:**

- [ ] Attachments test written
- [ ] Service enhanced
- [ ] Edge case tested
- [ ] Committed

---

### ✅ Task 2.6: تشغيل ومراجعة Tender Integration Tests

**الوقت:** 30 دقيقة

```bash
# تشغيل جميع اختبارات Tender Integration
npm test -- tenderProjectIntegration

# تشغيل مع Coverage
npm test -- tenderProjectIntegration --coverage

# تحقق من النتائج
# Expected: 5/5 tests passing ✅
```

**Checklist:**

- [ ] All 5 tests passing
- [ ] Coverage >80%
- [ ] No console errors
- [ ] Git committed
- [ ] Documentation updated

---

## 📋 Phase 3: Purchase Order Integration Tests (يومين - 12 ساعة)

### ✅ Task 3.1: إنشاء PurchaseOrderProjectLinker Service

**الوقت:** 2 ساعات

**الملف:** `src/application/services/purchaseOrderProjectLinker.ts`

```typescript
/**
 * Purchase Order - Project Linking Service
 */

import { getEnhancedProjectRepository } from '@/repository/factory'
import { getPurchaseOrderRepository } from '@/repository/purchaseOrderRepository'

export class PurchaseOrderProjectLinker {
  /**
   * Link PO to project automatically
   */
  static async linkPOToProject(poId: string, projectId: string): Promise<boolean> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const po = await poRepo.getById(poId)

      if (!po) {
        throw new Error(`PO ${poId} not found`)
      }

      // Update PO with projectId
      await poRepo.update(poId, {
        projectId,
        metadata: {
          ...po.metadata,
          linkedAt: new Date().toISOString(),
          linkedBy: 'system',
        },
      })

      console.log(`✅ PO ${poId} linked to project ${projectId}`)
      return true
    } catch (error) {
      console.error('❌ Error linking PO to project:', error)
      return false
    }
  }

  /**
   * Update project costs from all POs
   */
  static async updateProjectCostsFromPOs(projectId: string): Promise<void> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const projectRepo = getEnhancedProjectRepository()

      // Get project
      const project = await projectRepo.getById(projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get all POs for project
      const pos = await poRepo.getByProjectId(projectId)

      // Calculate actual costs (only completed POs)
      const actualCost = pos
        .filter((po) => po.status === 'completed')
        .reduce((sum, po) => sum + (po.totalAmount || 0), 0)

      // Calculate commitments (pending POs)
      const commitments = pos
        .filter((po) => po.status === 'pending')
        .reduce((sum, po) => sum + (po.totalAmount || 0), 0)

      // Update project
      await projectRepo.update(projectId, {
        actualCost,
        remaining: (project.estimatedCost || 0) - actualCost,
        metadata: {
          ...project.metadata,
          commitments,
          lastCostUpdate: new Date().toISOString(),
        },
      })

      console.log(`✅ Project ${projectId} costs updated from ${pos.length} POs`)
    } catch (error) {
      console.error('❌ Error updating project costs:', error)
      throw error
    }
  }

  /**
   * Sync all POs across all projects
   */
  static async syncAllPOs(): Promise<void> {
    try {
      const poRepo = getPurchaseOrderRepository()
      const allPOs = await poRepo.getAll()

      // Group by project
      const posByProject = new Map<string, any[]>()
      for (const po of allPOs) {
        if (!po.projectId) continue

        const pos = posByProject.get(po.projectId) || []
        pos.push(po)
        posByProject.set(po.projectId, pos)
      }

      // Update each project
      for (const [projectId, pos] of posByProject) {
        await this.updateProjectCostsFromPOs(projectId)
      }

      console.log(`✅ Synced POs for ${posByProject.size} projects`)
    } catch (error) {
      console.error('❌ Error syncing all POs:', error)
      throw error
    }
  }
}
```

**الخطوات:**

1. اكتب unit tests أولاً
2. طبّق Service
3. تأكد من نجاح الاختبارات

**Checklist:**

- [ ] Service created
- [ ] 3 methods implemented
- [ ] Unit tests written
- [ ] All tests passing

---

### ✅ Task 3.2: إنشاء useProjectCostTracking Hook

**الوقت:** 2 ساعات

**الملف:** `src/application/hooks/useProjectCostTracking.ts`

```typescript
/**
 * Project Cost Tracking Hook
 */

import { useState, useEffect } from 'react'
import { getEnhancedProjectRepository } from '@/repository/factory'
import { getPurchaseOrderRepository } from '@/repository/purchaseOrderRepository'

interface ProjectCosts {
  estimated: number
  actual: number
  fromPOs: number
  commitments: number
  variance: number
  variancePercentage: number
  status: 'under' | 'over' | 'on-budget'
}

interface CostBreakdown {
  category: string
  amount: number
  percentage: number
}

export function useProjectCostTracking(projectId: string) {
  const [costs, setCosts] = useState<ProjectCosts>({
    estimated: 0,
    actual: 0,
    fromPOs: 0,
    commitments: 0,
    variance: 0,
    variancePercentage: 0,
    status: 'on-budget',
  })

  const [breakdown, setBreakdown] = useState<CostBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadCosts = async () => {
    setIsLoading(true)
    try {
      const projectRepo = getEnhancedProjectRepository()
      const poRepo = getPurchaseOrderRepository()

      const [project, pos] = await Promise.all([
        projectRepo.getById(projectId),
        poRepo.getByProjectId(projectId),
      ])

      if (!project) {
        throw new Error('Project not found')
      }

      // Calculate actual from completed POs
      const actualFromPOs = pos
        .filter((po) => po.status === 'completed')
        .reduce((sum, po) => sum + po.totalAmount, 0)

      // Calculate commitments
      const commitments = pos
        .filter((po) => po.status === 'pending')
        .reduce((sum, po) => sum + po.totalAmount, 0)

      const variance = (project.estimatedCost || 0) - actualFromPOs
      const variancePercentage =
        (project.estimatedCost || 0) > 0 ? (variance / (project.estimatedCost || 0)) * 100 : 0

      const status: 'under' | 'over' | 'on-budget' =
        variance > 0 ? 'under' : variance < 0 ? 'over' : 'on-budget'

      setCosts({
        estimated: project.estimatedCost || 0,
        actual: actualFromPOs,
        fromPOs: actualFromPOs + commitments,
        commitments,
        variance,
        variancePercentage,
        status,
      })

      // Calculate breakdown by category
      const categoryMap = new Map<string, number>()
      for (const po of pos.filter((p) => p.status === 'completed')) {
        const category = po.category || 'أخرى'
        const current = categoryMap.get(category) || 0
        categoryMap.set(category, current + po.totalAmount)
      }

      const breakdownData = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: actualFromPOs > 0 ? (amount / actualFromPOs) * 100 : 0,
      }))

      setBreakdown(breakdownData)
    } catch (error) {
      console.error('Error loading costs:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCosts = () => loadCosts()

  useEffect(() => {
    loadCosts()
  }, [projectId])

  return {
    costs,
    breakdown,
    isLoading,
    loadCosts,
    refreshCosts,
  }
}
```

**Checklist:**

- [ ] Hook created
- [ ] All calculations implemented
- [ ] Tests written
- [ ] Hook working

---

### ✅ Task 3.3-3.8: PO Integration Tests (8 اختبارات)

**الوقت:** 8 ساعات (1 ساعة لكل اختبار)

**الملف:** `tests/integration/purchaseOrderProjectIntegration.test.ts`

أنقل جميع الاختبارات من `WEEK4_INTEGRATION_TESTS_TODO.md`:

1. ✅ Auto-link PO to project
2. ✅ Update costs when PO completed
3. ✅ Handle multiple POs
4. ✅ Calculate breakdown by category
5. ✅ Track variance
6. ✅ Alert when over budget
7. ✅ Refresh costs on status change
8. ✅ Sync all POs

**نفس TDD Workflow لكل اختبار:**

- 🔴 Red: اكتب الاختبار
- 🟢 Green: طبّق الكود
- 🔵 Refactor: حسّن
- ✅ Commit

**Checklist:**

- [ ] Test 1-8 written
- [ ] All implementations done
- [ ] 8/8 tests passing
- [ ] Committed

---

## 📋 Phase 4: Final Validation (نصف يوم - 4 ساعات)

### ✅ Task 4.1: تشغيل جميع الاختبارات

**الوقت:** 1 ساعة

```bash
# All integration tests
npm test -- tests/integration/

# All tests with coverage
npm test -- --coverage

# Check results
cat coverage/lcov-report/index.html
```

**Expected Results:**

```
✅ Tender Integration: 5/5 passing
✅ PO Integration: 8/8 passing
✅ Timeline Integration: 9/9 passing (existing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 22/22 integration tests passing
Coverage: >80%
```

**Checklist:**

- [ ] All integration tests passing
- [ ] Coverage >80%
- [ ] No flaky tests
- [ ] No warnings

---

### ✅ Task 4.2: TypeScript و Build Validation

**الوقت:** 30 دقيقة

```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Test build output
npm run preview
```

**Checklist:**

- [ ] 0 TypeScript errors
- [ ] Build successful
- [ ] No build warnings

---

### ✅ Task 4.3: Code Review والتوثيق

**الوقت:** 1.5 ساعة

**مراجعة:**

- [ ] Clean code principles
- [ ] Proper error handling
- [ ] Consistent naming
- [ ] DRY principle
- [ ] No console.logs in production code

**توثيق:**

```markdown
# Update docs/INTEGRATION_TESTS.md

## Tender Integration Tests

- Repository linking (3 tests)
- Auto-creation (2 tests)

## PO Integration Tests

- PO linking (3 tests)
- Cost tracking (3 tests)
- Real-time updates (2 tests)

## Coverage

- Total: 22 integration tests
- Coverage: 85%
- All passing ✅
```

**Checklist:**

- [ ] Code reviewed
- [ ] Documentation updated
- [ ] README updated
- [ ] CHANGELOG updated

---

### ✅ Task 4.4: Git Commit النهائي

**الوقت:** 30 دقيقة

```bash
# Review changes
git status
git diff

# Stage all
git add .

# Commit with detailed message
git commit -m "feat: add comprehensive integration tests for Week 4

- Tender-Project integration (5 tests)
  * Repository linking methods
  * Auto-creation with BOQ/attachments

- Purchase Order integration (8 tests)
  * Auto-linking to projects
  * Cost tracking and variance
  * Real-time updates

- Test utilities and mocks
- 100% test coverage for new code
- All 22 integration tests passing

BREAKING CHANGE: none
Closes #XXX"

# Push
git push origin feature/projects-system-improvement
```

**Checklist:**

- [ ] Meaningful commit message
- [ ] All files staged
- [ ] Pushed to remote
- [ ] PR created (if needed)

---

## 📊 الملخص النهائي

### **الإنجازات المتوقعة:**

```
✅ Phase 1: Setup (2-3 hours)
   - Test utilities
   - Mock repositories
   - Test helpers

✅ Phase 2: Tender Integration (8 hours)
   - 5 integration tests
   - Repository methods
   - Auto-creation service

✅ Phase 3: PO Integration (12 hours)
   - 8 integration tests
   - PO linker service
   - Cost tracking hook

✅ Phase 4: Validation (4 hours)
   - All tests passing
   - Documentation
   - Git commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 26-30 hours (3-4 days)
Tests: 22 integration tests ✅
Coverage: >80% ✅
```

### **معايير النجاح:**

- ✅ 22/22 integration tests passing
- ✅ >80% code coverage
- ✅ 0 TypeScript errors
- ✅ Build successful
- ✅ All best practices followed
- ✅ Complete documentation

---

## 🚀 البدء الآن

```bash
# 1. Create branch
git checkout -b feature/week4-integration-tests

# 2. Start with Phase 1
mkdir -p tests/utils tests/mocks tests/integration
code tests/utils/testHelpers.ts

# 3. Follow TDD workflow
npm test -- --watch

# 4. Track progress in this checklist
```

**الخطوة الأولى:** Task 1.1 - إعداد بيئة الاختبار (30 دقيقة)

**هل أنت جاهز للبدء؟** 🚀
