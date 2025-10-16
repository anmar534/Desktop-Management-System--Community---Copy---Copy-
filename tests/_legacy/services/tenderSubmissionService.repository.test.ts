import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import { registerTenderRepository } from '@/application/services/serviceRegistry'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'
import type { PurchaseOrder, BookletExpense } from '@/application/services/purchaseOrderService'
import type { DevelopmentStats } from '@/application/services/developmentStatsService'

vi.mock('@/application/services/purchaseOrderService', () => {
  return {
    purchaseOrderService: {
      getTenderRelatedOrdersCount: vi.fn(),
      processTenderSubmission: vi.fn()
    }
  }
})

vi.mock('@/application/services/developmentStatsService', () => {
  return {
    developmentStatsService: {
      updateStatsForTenderSubmission: vi.fn()
    }
  }
})

import { tenderSubmissionService } from '@/application/services/tenderSubmissionService'
import { purchaseOrderService } from '@/application/services/purchaseOrderService'
import { developmentStatsService } from '@/application/services/developmentStatsService'

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 'tender-1',
  name: 'Tender 1',
  title: 'Main Tender',
  client: 'Test Client',
  value: 100000,
  totalValue: 100000,
  documentPrice: 1500,
  status: 'ready_to_submit',
  phase: 'preparation',
  deadline: new Date('2025-01-01').toISOString(),
  daysLeft: 90,
  progress: 0,
  priority: 'medium',
  team: 'Tender Team',
  manager: 'Manager 1',
  winChance: 50,
  competition: 'Regional',
  submissionDate: new Date('2024-12-15').toISOString(),
  lastAction: 'created',
  lastUpdate: new Date('2024-10-01').toISOString(),
  category: 'General Works',
  location: 'Riyadh',
  type: 'construction',
  totalItems: 10,
  pricedItems: 10,
  technicalFilesUploaded: true,
  ...overrides
})

const makePurchaseOrder = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: 'PO-1',
  tenderName: 'Tender 1',
  tenderId: 'tender-1',
  client: 'Test Client',
  value: 100000,
  status: 'pending',
  createdDate: new Date().toISOString(),
  expectedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  priority: 'medium',
  department: 'المشاريع',
  approver: 'مدير المشاريع',
  description: 'أمر شراء تجريبي',
  source: 'tender_submitted',
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

const makeBookletExpense = (overrides: Partial<BookletExpense> = {}): BookletExpense => ({
  id: 'EXP-1',
  title: 'شراء كراسة Tender 1',
  amount: 1500,
  categoryId: 'marketing_advertising',
  subcategoryId: 'promotional_materials',
  frequency: 'one_time',
  paymentMethod: 'online_payment',
  paymentStatus: 'completed',
  dueDate: new Date().toISOString().slice(0, 10),
  isAdministrative: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tenderId: 'tender-1',
  tenderName: 'Tender 1',
  projectId: undefined,
  ...overrides
})

const makeStats = (overrides: Partial<DevelopmentStats> = {}): DevelopmentStats => ({
  submittedTenders: 1,
  wonTenders: 0,
  lostTenders: 0,
  submittedTendersValue: 100000,
  wonTendersValue: 0,
  totalBookletsCost: 1500,
  averageBookletCost: 1500,
  winRate: 0,
  lastUpdate: new Date().toISOString(),
  monthlyStats: {},
  currentMonthTenders: 1,
  currentMonthValue: 100000,
  ...overrides
})

describe('tenderSubmissionService', () => {
  let repositoryTender: Tender
  let updateMock: ReturnType<typeof vi.fn<[string, Partial<Tender>], Promise<Tender | null>>>

  const registerStubRepository = () => {
    repositoryTender = makeTender()

    updateMock = vi.fn<[string, Partial<Tender>], Promise<Tender | null>>(async (id, updates) => {
      if (id !== repositoryTender.id) {
        return null
      }
      repositoryTender = { ...repositoryTender, ...updates }
      return repositoryTender
    })

    const stub: ITenderRepository = {
      getAll: async () => [repositoryTender],
      getById: async (id: string) => (id === repositoryTender.id ? repositoryTender : null),
      getByProjectId: async () => null,
      create: async (data: Omit<Tender, 'id'>) => ({ ...data, id: `created-${Date.now()}` }),
      update: updateMock,
      delete: async () => false,
      search: async () => [repositoryTender]
    }

    registerTenderRepository(stub)
  }

  beforeEach(() => {
    registerStubRepository()
    const poMock = vi.mocked(purchaseOrderService)
    poMock.getTenderRelatedOrdersCount.mockReset()
    poMock.processTenderSubmission.mockReset()
    const statsMock = vi.mocked(developmentStatsService)
    statsMock.updateStatsForTenderSubmission.mockReset()
  })

  afterEach(() => {
    registerTenderRepository(defaultTenderRepository)
  })

  it('updates tender status and records new purchase artifacts', async () => {
    const poMock = vi.mocked(purchaseOrderService)
    poMock.getTenderRelatedOrdersCount
      .mockResolvedValueOnce({ ordersCount: 0, expensesCount: 0 })
      .mockResolvedValueOnce({ ordersCount: 1, expensesCount: 1 })

    const fakeOrder = makePurchaseOrder()
    const fakeExpense = makeBookletExpense()

    poMock.processTenderSubmission.mockResolvedValue({
      purchaseOrder: fakeOrder,
      bookletExpense: fakeExpense,
      relatedProject: null
    })

    const statsMock = vi.mocked(developmentStatsService)
    const fakeStats = makeStats()
    statsMock.updateStatsForTenderSubmission.mockReturnValue(fakeStats)

    const result = await tenderSubmissionService.submit(repositoryTender)

    expect(updateMock).toHaveBeenCalledWith(repositoryTender.id, expect.objectContaining({ status: 'submitted' }))
    expect(result.created.purchaseOrder).toBe(true)
    expect(result.created.bookletExpense).toBe(true)
    expect(result.purchaseOrder).toEqual(fakeOrder)
    expect(result.bookletExpense).toEqual(fakeExpense)
    expect(statsMock.updateStatsForTenderSubmission).toHaveBeenCalledWith(expect.objectContaining({ id: repositoryTender.id, status: 'submitted' }))
  })

  it('handles existing purchase data without duplicating records', async () => {
    const poMock = vi.mocked(purchaseOrderService)
    poMock.getTenderRelatedOrdersCount
      .mockResolvedValueOnce({ ordersCount: 1, expensesCount: 1 })
      .mockResolvedValueOnce({ ordersCount: 1, expensesCount: 1 })

    const existingOrder = makePurchaseOrder({ id: 'PO-existing' })
    const existingExpense = makeBookletExpense({ id: 'EXP-existing' })

    poMock.processTenderSubmission.mockResolvedValue({
      purchaseOrder: existingOrder,
      bookletExpense: existingExpense,
      relatedProject: null
    })

    const statsMock = vi.mocked(developmentStatsService)
    const fakeStats = makeStats({ totalBookletsCost: 0, submittedTenders: 2 })
    statsMock.updateStatsForTenderSubmission.mockReturnValue(fakeStats)

    const result = await tenderSubmissionService.submit(repositoryTender)

    expect(result.created.purchaseOrder).toBe(false)
    expect(result.created.bookletExpense).toBe(false)
    expect(result.counts.after.ordersCount).toBe(1)
    expect(result.counts.after.expensesCount).toBe(1)
    expect(result.purchaseOrder.id).toBe('PO-existing')
    expect(result.bookletExpense?.id).toBe('EXP-existing')
  })
})
