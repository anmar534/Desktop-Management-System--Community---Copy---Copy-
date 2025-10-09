import { describe, it, expect, beforeEach } from 'vitest'
import { safeLocalStorage, STORAGE_KEYS } from '@/utils/storage'
import { expensesService } from '@/application/services/expensesService'
import { purchaseOrderService } from '@/application/services/purchaseOrderService'
import type { BookletExpense } from '@/application/services/purchaseOrderService'
import { getProjectRepository, getTenderRepository, getRelationRepository } from '@/application/services/serviceRegistry'
import type { Project, Tender } from '@/data/centralData'

function resetAll() {
  // clear unified keys used in this scenario
  safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
  safeLocalStorage.removeItem(STORAGE_KEYS.PROJECTS)
  safeLocalStorage.removeItem(STORAGE_KEYS.PURCHASE_ORDERS)
  safeLocalStorage.removeItem(STORAGE_KEYS.EXPENSES)
  safeLocalStorage.removeItem(STORAGE_KEYS.RELATIONS)
}

describe('Integration: purchase order links to project and expense is project-bound', () => {
  beforeEach(() => {
    resetAll()
    expensesService.setAll([])
  })

  it('processTenderSubmission links PO to project and booklet expense has projectId and is queryable by project', async () => {
    const projectRepository = getProjectRepository()
    const tenderRepository = getTenderRepository()
    const relationRepository = getRelationRepository()

    // 1) seed project using repository
    const project: Project = {
      id: 'p-1',
      name: 'مشروع المستودع',
      client: 'عميل',
      status: 'active',
      priority: 'medium',
      progress: 0,
      contractValue: 100000,
      estimatedCost: 80000,
      actualCost: 0,
      spent: 0,
      remaining: 100000,
      expectedProfit: 20000,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      manager: 'mgr',
      team: 'team',
      location: 'loc',
      phase: 'phase',
      health: 'green',
      lastUpdate: new Date().toISOString(),
      category: 'cat',
      efficiency: 0,
      riskLevel: 'low',
      budget: 100000,
      value: 100000,
      type: 'type'
    }

    await projectRepository.upsert(project)

    const tenderInput: Omit<Tender, 'id'> = {
      name: 'منافسة المستودع',
      title: 'Tender',
      client: 'عميل',
      value: 100000,
      status: 'submitted',
      phase: 'phase',
      deadline: new Date().toISOString(),
      daysLeft: 10,
      progress: 0,
      priority: 'medium',
      team: 'team',
      manager: 'mgr',
      winChance: 50,
      competition: 'open',
      submissionDate: new Date().toISOString(),
  lastAction: 'submission',
      lastUpdate: new Date().toISOString(),
      category: 'cat',
      location: 'loc',
      type: 'type',
      documentPrice: 150
    }

    const tender = await tenderRepository.create(tenderInput)
    relationRepository.linkTenderToProject(tender.id, project.id)

    // 2) act: process tender submission
  const { purchaseOrder, bookletExpense } = await purchaseOrderService.processTenderSubmission(tender)

    // 3) assert: PO has projectId
    expect(purchaseOrder.projectId).toBe(project.id)

    // 4) assert: booklet expense has projectId and is returned by getByProject
    expect(bookletExpense).toBeTruthy()
    expect(bookletExpense?.projectId).toBe(project.id)
  const expensesForProject = expensesService.getByProject(project.id) as BookletExpense[]
  const hasBooklet = expensesForProject.some(expense => expense.tenderId === tender.id && expense.projectId === project.id)
    expect(hasBooklet).toBe(true)
  })
})
