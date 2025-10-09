import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '@/data/centralData'
import { LocalProjectRepository } from '@/repository/providers/project.local'
import type { IRelationRepository, EntityRelationSnapshot } from '@/repository/relations.repository'
import type { ProjectPurchaseRelation, TenderProjectRelation } from '@/repository/types'
import { getRelationRepository, registerRelationRepository } from '@/application/services/serviceRegistry'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS } from '@/events/bus'

class StubRelationRepository implements IRelationRepository {
  public unlinkProjectCalls: string[] = []
  private snapshot: EntityRelationSnapshot = { tenderProject: [], projectPurchase: [] }

  getSnapshot(): EntityRelationSnapshot {
    return {
      tenderProject: [...this.snapshot.tenderProject],
      projectPurchase: [...this.snapshot.projectPurchase],
    }
  }

  saveSnapshot(snapshot: EntityRelationSnapshot): void {
    this.snapshot = {
      tenderProject: [...snapshot.tenderProject],
      projectPurchase: [...snapshot.projectPurchase],
    }
  }

  linkTenderToProject(tenderId: string, projectId: string): TenderProjectRelation {
    const relation: TenderProjectRelation = {
      tenderId,
      projectId,
      createdAt: new Date().toISOString(),
      isAutoCreated: false,
    }
    this.snapshot.tenderProject = [...this.snapshot.tenderProject, relation]
    return relation
  }

  unlinkTender(tenderId: string): void {
    this.snapshot = {
      ...this.snapshot,
      tenderProject: this.snapshot.tenderProject.filter(link => link.tenderId !== tenderId),
    }
  }

  unlinkProject(projectId: string): void {
    this.unlinkProjectCalls.push(projectId)
    this.snapshot = {
      tenderProject: this.snapshot.tenderProject.filter(link => link.projectId !== projectId),
      projectPurchase: this.snapshot.projectPurchase.filter(link => link.projectId !== projectId),
    }
  }

  getProjectIdByTenderId(tenderId: string): string | null {
    return this.snapshot.tenderProject.find(link => link.tenderId === tenderId)?.projectId ?? null
  }

  getTenderIdByProjectId(projectId: string): string | null {
    return this.snapshot.tenderProject.find(link => link.projectId === projectId)?.tenderId ?? null
  }

  getAllTenderProjectLinks(): TenderProjectRelation[] {
    return [...this.snapshot.tenderProject]
  }

  linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): ProjectPurchaseRelation {
    const relation: ProjectPurchaseRelation = {
      projectId,
      purchaseOrderId,
      createdAt: new Date().toISOString(),
    }
    this.snapshot.projectPurchase = [...this.snapshot.projectPurchase, relation]
    return relation
  }

  unlinkProjectPurchase(projectId: string, purchaseOrderId?: string): void {
    this.snapshot = {
      ...this.snapshot,
      projectPurchase: this.snapshot.projectPurchase.filter(link => {
        if (link.projectId !== projectId) return true
        if (!purchaseOrderId) return false
        return link.purchaseOrderId !== purchaseOrderId
      }),
    }
  }

  getPurchaseOrderIdsByProjectId(projectId: string): string[] {
    return this.snapshot.projectPurchase
      .filter(link => link.projectId === projectId)
      .map(link => link.purchaseOrderId)
  }

  getAllProjectPurchaseLinks(): ProjectPurchaseRelation[] {
    return [...this.snapshot.projectPurchase]
  }
}

describe('LocalProjectRepository', () => {
  const repository = new LocalProjectRepository()
  const originalRelationRepository = getRelationRepository()
  const stubRelationRepository = new StubRelationRepository()
  const events: { id: string }[] = []
  const projectUpdatedHandler = () => {
    events.push({ id: APP_EVENTS.PROJECTS_UPDATED })
  }

  beforeAll(() => {
    registerRelationRepository(stubRelationRepository)
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.PROJECTS_UPDATED, projectUpdatedHandler)
    }
  })

  afterAll(() => {
    registerRelationRepository(originalRelationRepository)
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.PROJECTS_UPDATED, projectUpdatedHandler)
    }
  })

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2025-05-01T00:00:00Z'))
    stubRelationRepository.unlinkProjectCalls = []
    events.length = 0
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.PROJECTS)
  })

  afterEach(() => {
    vi.useRealTimers()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.PROJECTS)
  })

  const sampleProject = (overrides: Partial<Project> = {}): Project => ({
    id: overrides.id ?? 'project-seed',
    name: overrides.name ?? 'مشروع تجريبي',
    client: overrides.client ?? 'جهة حكومية',
    status: overrides.status ?? 'active',
    priority: overrides.priority ?? 'medium',
    progress: overrides.progress ?? 50,
    contractValue: overrides.contractValue ?? 1000,
    estimatedCost: overrides.estimatedCost ?? 900,
    actualCost: overrides.actualCost ?? 400,
    spent: overrides.spent ?? 350,
    remaining: overrides.remaining ?? 650,
    expectedProfit: overrides.expectedProfit ?? 100,
    actualProfit: overrides.actualProfit ?? 0,
    startDate: overrides.startDate ?? '2025-01-01',
    endDate: overrides.endDate ?? '2025-12-31',
    manager: overrides.manager ?? 'مدير المشروع',
    team: overrides.team ?? 'فريق التنفيذ',
    location: overrides.location ?? 'الرياض',
    phase: overrides.phase ?? 'execution',
    health: overrides.health ?? 'green',
    lastUpdate: overrides.lastUpdate ?? '2025-05-01',
    category: overrides.category ?? 'construction',
    efficiency: overrides.efficiency ?? 80,
    riskLevel: overrides.riskLevel ?? 'medium',
    budget: overrides.budget ?? 1000,
    value: overrides.value ?? 1000,
    type: overrides.type ?? 'residential',
  })

  it('creates, updates, and upserts projects while persisting to storage', async () => {
    const created = await repository.create(sampleProject({ id: undefined }))
    expect(created.id).toMatch(/^project_\d+_/)

    const storedAfterCreate = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])
    expect(storedAfterCreate).toHaveLength(1)

    const updated = await repository.update(created.id, { name: 'مشروع محدث', progress: 75 })
    expect(updated?.name).toBe('مشروع محدث')
    expect(updated?.progress).toBe(75)

    const upserted = await repository.upsert({ ...created, status: 'completed', progress: 100 })
    expect(upserted.status).toBe('completed')
    expect(upserted.progress).toBe(100)

    const retrieved = await repository.getById(created.id)
    expect(retrieved?.status).toBe('completed')

    expect(events.some(evt => evt.id === APP_EVENTS.PROJECTS_UPDATED)).toBe(true)
  })

  it('deletes projects and unlinks relations', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, [sampleProject()])

    const removed = await repository.delete('project-seed')
    expect(removed).toBe(true)
    expect(safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [])).toHaveLength(0)
    expect(stubRelationRepository.unlinkProjectCalls).toContain('project-seed')
  })

  it('imports projects with merge behaviour when replace is false', async () => {
    safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, [sampleProject({ id: 'project-1', name: 'A' })])

    const result = await repository.importMany(
      [
        sampleProject({ id: 'project-1', name: 'A-updated' }),
        sampleProject({ id: 'project-2', name: 'B' }),
      ],
      { replace: false },
    )

    expect(result).toHaveLength(2)
    expect(result.find(project => project.id === 'project-1')?.name).toBe('A-updated')
    expect(result.some(project => project.id === 'project-2')).toBe(true)
  })
})
