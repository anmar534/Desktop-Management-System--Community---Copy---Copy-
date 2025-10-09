import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tender } from '@/data/centralData'
import { LocalTenderRepository } from '@/repository/providers/tender.local'
import type { EntityRelationSnapshot, IRelationRepository, LinkTenderOptions } from '@/repository/relations.repository'
import type { ProjectPurchaseRelation, TenderProjectRelation } from '@/repository/types'
import { getRelationRepository, registerRelationRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS, bus } from '@/events/bus'

class StubRelationRepository implements IRelationRepository {
  public tenderByProject = new Map<string, string>()
  public unlinkTenderCalls: string[] = []
  private purchaseByProject = new Map<string, Set<string>>()

  getSnapshot(): EntityRelationSnapshot {
    const tenderProject = Array.from(this.tenderByProject.entries()).map(([projectId, tenderId]) => ({
      tenderId,
      projectId,
      createdAt: new Date().toISOString(),
      isAutoCreated: false,
    }))
    const projectPurchase: ProjectPurchaseRelation[] = []
    for (const [projectId, purchaseOrders] of this.purchaseByProject.entries()) {
      for (const purchaseOrderId of purchaseOrders) {
        projectPurchase.push({
          projectId,
          purchaseOrderId,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return { tenderProject, projectPurchase }
  }

  saveSnapshot(snapshot: EntityRelationSnapshot): void {
    this.tenderByProject = new Map(snapshot.tenderProject.map(link => [link.projectId, link.tenderId]))
    this.purchaseByProject = new Map()
    for (const link of snapshot.projectPurchase) {
      const set = this.purchaseByProject.get(link.projectId) ?? new Set<string>()
      set.add(link.purchaseOrderId)
      this.purchaseByProject.set(link.projectId, set)
    }
  }

  linkTenderToProject(tenderId: string, projectId: string, options?: LinkTenderOptions): TenderProjectRelation {
    this.tenderByProject.set(projectId, tenderId)
    return {
      tenderId,
      projectId,
      createdAt: new Date().toISOString(),
      isAutoCreated: options?.isAutoCreated ?? false,
    }
  }

  unlinkTender(tenderId: string): void {
    this.unlinkTenderCalls.push(tenderId)
    for (const [projectId, storedTenderId] of this.tenderByProject.entries()) {
      if (storedTenderId === tenderId) {
        this.tenderByProject.delete(projectId)
      }
    }
  }

  unlinkProject(projectId: string): void {
    this.tenderByProject.delete(projectId)
  }

  getProjectIdByTenderId(tenderId: string): string | null {
    for (const [projectId, storedTenderId] of this.tenderByProject.entries()) {
      if (storedTenderId === tenderId) {
        return projectId
      }
    }
    return null
  }

  getTenderIdByProjectId(projectId: string): string | null {
    return this.tenderByProject.get(projectId) ?? null
  }

  getAllTenderProjectLinks(): TenderProjectRelation[] {
    return Array.from(this.tenderByProject.entries()).map(([projectId, tenderId]) => ({
      tenderId,
      projectId,
      createdAt: new Date().toISOString(),
      isAutoCreated: false,
    }))
  }

  linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): ProjectPurchaseRelation {
    const existing = this.purchaseByProject.get(projectId) ?? new Set<string>()
    existing.add(purchaseOrderId)
    this.purchaseByProject.set(projectId, existing)
    return {
      projectId,
      purchaseOrderId,
      createdAt: new Date().toISOString(),
    }
  }

  unlinkProjectPurchase(projectId: string, purchaseOrderId?: string): void {
    if (!this.purchaseByProject.has(projectId)) {
      return
    }
    if (!purchaseOrderId) {
      this.purchaseByProject.delete(projectId)
      return
    }
    const entries = this.purchaseByProject.get(projectId)
    if (!entries) return
    entries.delete(purchaseOrderId)
    if (entries.size === 0) {
      this.purchaseByProject.delete(projectId)
    } else {
      this.purchaseByProject.set(projectId, entries)
    }
  }

  getPurchaseOrderIdsByProjectId(projectId: string): string[] {
    return Array.from(this.purchaseByProject.get(projectId) ?? [])
  }

  getAllProjectPurchaseLinks(): ProjectPurchaseRelation[] {
    const result: ProjectPurchaseRelation[] = []
    for (const [projectId, purchaseOrders] of this.purchaseByProject.entries()) {
      for (const purchaseOrderId of purchaseOrders) {
        result.push({
          projectId,
          purchaseOrderId,
          createdAt: new Date().toISOString(),
        })
      }
    }
    return result
  }

  reset(): void {
    this.tenderByProject.clear()
    this.unlinkTenderCalls = []
    this.purchaseByProject.clear()
  }
}

const sampleTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: overrides.id ?? 'tender-seed',
  name: overrides.name ?? 'منافسة مجمع إداري',
  title: overrides.title ?? 'Warehouse Modernization',
  client: overrides.client ?? 'وزارة الإسكان',
  value: overrides.value ?? 2500000,
  totalValue: overrides.totalValue ?? 2500000,
  documentPrice: overrides.documentPrice ?? 1500,
  status: overrides.status ?? 'new',
  totalItems: overrides.totalItems ?? 50,
  pricedItems: overrides.pricedItems ?? 20,
  technicalFilesUploaded: overrides.technicalFilesUploaded ?? false,
  phase: overrides.phase ?? 'preparation',
  deadline: overrides.deadline ?? '2025-06-01',
  daysLeft: overrides.daysLeft ?? 15,
  progress: overrides.progress ?? 45,
  completionPercentage: overrides.completionPercentage ?? 40,
  priority: overrides.priority ?? 'medium',
  team: overrides.team ?? 'فريق المناقصات',
  manager: overrides.manager ?? 'قائد المشروع',
  winChance: overrides.winChance ?? 30,
  competition: overrides.competition ?? 'متوسط',
  submissionDate: overrides.submissionDate ?? '2025-05-25',
  lastAction: overrides.lastAction ?? 'مراجعة التسعير',
  lastUpdate: overrides.lastUpdate ?? '2025-05-01',
  category: overrides.category ?? 'construction',
  location: overrides.location ?? 'الرياض',
  type: overrides.type ?? 'government',
  resultNotes: overrides.resultNotes,
  winningBidValue: overrides.winningBidValue,
  ourBidValue: overrides.ourBidValue,
  winDate: overrides.winDate,
  lostDate: overrides.lostDate,
  resultDate: overrides.resultDate,
  cancelledDate: overrides.cancelledDate,
})

const createTenderInput = (overrides: Partial<Tender> = {}): Omit<Tender, 'id'> => {
  const { id: _omit, ...rest } = sampleTender(overrides)
  return rest
}

describe('LocalTenderRepository', () => {
  const repository = new LocalTenderRepository()
  const originalRelationRepository = getRelationRepository()
  const stubRelationRepository = new StubRelationRepository()

  const tendersUpdatedBusEvents: unknown[] = []
  const tenderUpdatedBusEvents: unknown[] = []
  const tendersUpdatedWindowEvents: unknown[] = []
  const tenderUpdatedWindowEvents: unknown[] = []

  const tendersUpdatedBusHandler = (event: CustomEvent<unknown>) => {
    tendersUpdatedBusEvents.push(event.detail)
  }

  const tenderUpdatedBusHandler = (event: CustomEvent<unknown>) => {
    tenderUpdatedBusEvents.push(event.detail)
  }

  const tendersUpdatedWindowHandler = (event: Event) => {
    const custom = event as CustomEvent<unknown>
    tendersUpdatedWindowEvents.push(custom.detail)
  }

  const tenderUpdatedWindowHandler = (event: Event) => {
    const custom = event as CustomEvent<unknown>
    tenderUpdatedWindowEvents.push(custom.detail)
  }

  beforeAll(() => {
    registerRelationRepository(stubRelationRepository)
    bus.on(APP_EVENTS.TENDERS_UPDATED, tendersUpdatedBusHandler)
    bus.on(APP_EVENTS.TENDER_UPDATED, tenderUpdatedBusHandler)
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.TENDERS_UPDATED, tendersUpdatedWindowHandler)
      window.addEventListener(APP_EVENTS.TENDER_UPDATED, tenderUpdatedWindowHandler)
    }
  })

  afterAll(() => {
    registerRelationRepository(originalRelationRepository)
    bus.off(APP_EVENTS.TENDERS_UPDATED, tendersUpdatedBusHandler)
    bus.off(APP_EVENTS.TENDER_UPDATED, tenderUpdatedBusHandler)
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.TENDERS_UPDATED, tendersUpdatedWindowHandler)
      window.removeEventListener(APP_EVENTS.TENDER_UPDATED, tenderUpdatedWindowHandler)
    }
  })

  beforeEach(() => {
    tendersUpdatedBusEvents.length = 0
    tenderUpdatedBusEvents.length = 0
    tendersUpdatedWindowEvents.length = 0
    tenderUpdatedWindowEvents.length = 0
    stubRelationRepository.reset()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
  })

  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
    vi.restoreAllMocks()
  })

  it('creates and updates tenders while emitting bus and window events', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.654321098)

    const created = await repository.create(createTenderInput({ name: 'منافسة فرعية' }))
    expect(created.id).toMatch(/^tender_\d+_[a-z0-9]+$/)
    expect(created.name).toBe('منافسة فرعية')

    let stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
    expect(stored).toHaveLength(1)

    const updated = await repository.update(created.id, { status: 'won', progress: 90 })
    expect(updated?.status).toBe('won')
    expect(updated?.progress).toBe(90)

    stored = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
    expect(stored[0].status).toBe('won')

    expect(tendersUpdatedBusEvents.length).toBeGreaterThanOrEqual(2)
    expect(tendersUpdatedWindowEvents.length).toBeGreaterThanOrEqual(2)
    expect(tenderUpdatedBusEvents).toHaveLength(1)
    expect(tenderUpdatedWindowEvents).toHaveLength(1)

    const updateDetail = tenderUpdatedBusEvents[0] as { action: string; tenderId: string }
    expect(updateDetail.action).toBe('update')
    expect(updateDetail.tenderId).toBe(created.id)
  })

  it('normalizes tenders from storage and supports lookups', async () => {
  const raw: Record<string, unknown>[] = [
      { ...sampleTender({ id: 't-1', name: 'عروض مستودع', title: 'Warehouse Phase 2' }), status: 'preparing' },
      { ...sampleTender({ id: 't-2', name: 'كوبري علوي', status: 'won', title: 'Bridge Expansion' }) },
    ]

    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, raw)
    stubRelationRepository.tenderByProject.set('project-2', 't-2')

    const all = await repository.getAll()
    expect(all).toHaveLength(2)
    expect(all.find(tender => tender.id === 't-1')?.status).toBe('new')

    const storedAfter = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])
    expect(storedAfter.find(tender => tender.id === 't-1')?.status).toBe('new')

    const byId = await repository.getById('t-2')
    expect(byId?.status).toBe('won')

    const byProject = await repository.getByProjectId('project-2')
    expect(byProject?.id).toBe('t-2')

    const searchResults = await repository.search('warehouse')
    expect(searchResults.map(tender => tender.id)).toContain('t-1')
  })

  it('deletes tenders, unlinks relations, and emits delete events', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, [sampleTender({ id: 't-delete' })])
    stubRelationRepository.tenderByProject.set('project-delete', 't-delete')

    const removed = await repository.delete('t-delete')
    expect(removed).toBe(true)

    expect(safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, [])).toHaveLength(0)
    expect(stubRelationRepository.unlinkTenderCalls).toContain('t-delete')

    const lastBusDetail = tendersUpdatedBusEvents.at(-1) as { action?: string; tenderId?: string } | undefined
    expect(lastBusDetail?.action).toBe('delete')
    expect(lastBusDetail?.tenderId).toBe('t-delete')

    const lastWindowDetail = tendersUpdatedWindowEvents.at(-1) as { action?: string; tenderId?: string } | undefined
    expect(lastWindowDetail?.action).toBe('delete')
  })
})
