import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { pricingDataSyncService } from '@/application/services/pricingDataSyncService'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import type { BOQData } from '@/types/boq'
import type { IBOQRepository } from '@/repository/boq.repository'
import { registerTenderRepository, registerBOQRepository } from '@/application/services/serviceRegistry'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'
import { boqRepository as defaultBOQRepository } from '@/repository/providers/boq.local'

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 't-1',
  name: 'Test Tender',
  title: 'Main Tender',
  client: 'Client',
  value: 1000,
  status: 'new',
  phase: 'preparation',
  deadline: new Date('2025-01-01').toISOString(),
  daysLeft: 30,
  progress: 0,
  priority: 'medium',
  team: 'Team',
  manager: 'Manager',
  winChance: 50,
  competition: 'Regional',
  submissionDate: new Date('2024-12-01').toISOString(),
  lastAction: 'created',
  lastUpdate: new Date('2024-09-30').toISOString(),
  category: 'General Works',
  location: 'Riyadh',
  type: 'construction',
  ...overrides,
})

describe('pricingDataSyncService repository integration', () => {
  let currentTender: Tender
  let updateSpy: ReturnType<typeof vi.fn>
  let getByIdSpy: ReturnType<typeof vi.fn>
  let boqCreateSpy: ReturnType<typeof vi.fn>
  let boqGetByTenderSpy: ReturnType<typeof vi.fn>

  const registerStubRepositories = () => {
    currentTender = makeTender()
    const tenderRepository: ITenderRepository = {
      async getAll() { return [currentTender] },
      async getById(id: string) {
        const result = currentTender && currentTender.id === id ? currentTender : null
        getByIdSpy(result)
        return result
      },
      async getByProjectId() { return null },
      async create() { throw new Error('not implemented') },
      async update(id: string, updates: Partial<Tender>) {
        updateSpy(id, updates)
        if (!currentTender || currentTender.id !== id) {
          return null
        }
        currentTender = { ...currentTender, ...updates }
        return currentTender
      },
      async delete() { return false },
      async search() { return [] },
    }

    const boqRepository: IBOQRepository = {
      async getByTenderId(id: string) {
        boqGetByTenderSpy(id)
        return null
      },
      async getByProjectId() {
        return null
      },
      async createOrUpdate(data) {
        boqCreateSpy(data)
        const result: BOQData = {
          id: data.id ?? 'boq-stub',
          tenderId: data.tenderId,
          projectId: data.projectId,
          items: data.items,
          totalValue: data.totalValue,
          totals: data.totals ?? null,
          lastUpdated: data.lastUpdated ?? new Date().toISOString(),
        }
        return result
      },
    }

    registerTenderRepository(tenderRepository)
    registerBOQRepository(boqRepository)
  }

  beforeEach(() => {
    updateSpy = vi.fn()
    getByIdSpy = vi.fn()
    boqCreateSpy = vi.fn()
    boqGetByTenderSpy = vi.fn()
    registerStubRepositories()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    registerTenderRepository(defaultTenderRepository)
    registerBOQRepository(defaultBOQRepository)
    pricingDataSyncService.clearSyncStateForTesting()
  })

  it('يستخدم مستودع المناقصات لتحديث حالة المنافسة بعد استقبال بيانات التسعير', async () => {
    const quantityTable = [
      { id: 'item-1', unitPrice: 100, quantity: 2, totalPrice: 200 },
      { id: 'item-2', unitPrice: 50, quantity: 4, totalPrice: 200 },
    ]

    await pricingDataSyncService.processPricingUpdateForTesting({
      tenderId: currentTender.id,
      quantityTable,
      source: 'unit-test',
    })

    expect(getByIdSpy).toHaveBeenCalledWith(expect.objectContaining({ id: currentTender.id }))
    expect(updateSpy).toHaveBeenCalled()
    expect(boqCreateSpy).toHaveBeenCalled()
    const [boqPayload] = boqCreateSpy.mock.calls[0]
    expect(boqPayload).toMatchObject({ tenderId: currentTender.id, totalValue: 400 })
    const [, payload] = updateSpy.mock.calls[0]
    expect(payload).toMatchObject({
      completionPercentage: expect.any(Number),
      totalValue: 400,
      pricedItems: 2,
      totalItems: 2,
      status: 'under_action',
    })
  })
})
