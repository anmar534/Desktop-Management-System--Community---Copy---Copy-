import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tender, Project } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import type { IProjectRepository } from '@/repository/project.repository'
import {
  getTenderRepository,
  getProjectRepository,
  registerTenderRepository,
  registerProjectRepository,
} from '@/application/services/serviceRegistry'
import type { UnifiedCalculationsService } from '@/application/services/unifiedCalculationsService'

class StubTenderRepository implements ITenderRepository {
  private tenders: Tender[] = []

  public setData(data: Tender[]): void {
    this.tenders = data
  }

  async getAll(): Promise<Tender[]> {
    return this.tenders
  }

  async getById(id: string): Promise<Tender | null> {
    return this.tenders.find(tender => tender.id === id) ?? null
  }

  async getByProjectId(): Promise<Tender | null> {
    return null
  }

  async create(): Promise<Tender> {
    throw new Error('Not implemented in test stub')
  }

  async update(): Promise<Tender | null> {
    throw new Error('Not implemented in test stub')
  }

  async delete(): Promise<boolean> {
    throw new Error('Not implemented in test stub')
  }

  async search(query: string): Promise<Tender[]> {
    const normalized = query.toLowerCase()
    return this.tenders.filter(tender =>
      tender.name.toLowerCase().includes(normalized) ||
      tender.client.toLowerCase().includes(normalized)
    )
  }
}


class StubProjectRepository implements IProjectRepository {
  private projects: Project[] = []

  public setData(data: Project[]): void {
    this.projects = data
  }

  async getAll(): Promise<Project[]> {
    return this.projects
  }

  async getById(id: string): Promise<Project | null> {
    return this.projects.find(project => project.id === id) ?? null
  }

  async create(): Promise<Project> {
    throw new Error('Not implemented in test stub')
  }

  async upsert(): Promise<Project> {
    throw new Error('Not implemented in test stub')
  }

  async update(): Promise<Project | null> {
    throw new Error('Not implemented in test stub')
  }

  async delete(): Promise<boolean> {
    throw new Error('Not implemented in test stub')
  }

  async importMany(): Promise<Project[]> {
    throw new Error('Not implemented in test stub')
  }

  async reload(): Promise<Project[]> {
    return this.projects
  }
}

function createTender(overrides: Partial<Tender>): Tender {
  return {
    id: 't-1',
    name: 'منافسة تجريبية',
    title: 'Demo Tender',
    client: 'جهة حكومية',
    value: 500,
    totalValue: 500,
    documentPrice: 100,
    status: 'submitted',
    totalItems: 10,
    pricedItems: 10,
    technicalFilesUploaded: true,
    phase: 'proposal',
    deadline: '2025-12-01',
    daysLeft: 30,
    progress: 100,
    completionPercentage: 100,
    priority: 'medium',
    team: 'A-Team',
    manager: 'مدير المبيعات',
    winChance: 50,
    competition: 'open',
    submissionDate: '2025-08-01',
    lastAction: 'submitted',
    lastUpdate: '2025-08-05',
    category: 'construction',
    location: 'الرياض',
    type: 'general',
    ...overrides,
  }
}

function createProject(overrides: Partial<Project>): Project {
  return {
    id: 'p-1',
    name: 'مشروع تجريبي',
    client: 'هيئة تطوير',
    status: 'active',
    priority: 'medium',
    progress: 50,
    contractValue: 500,
    estimatedCost: 400,
    actualCost: 300,
    spent: 250,
    remaining: 250,
    expectedProfit: 100,
    actualProfit: 0,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    manager: 'مدير المشروع',
    team: 'فريق التنفيذ',
    location: 'الرياض',
    phase: 'execution',
    health: 'green',
    lastUpdate: '2025-08-15',
    category: 'construction',
    efficiency: 80,
    riskLevel: 'medium',
    budget: 500,
    value: 500,
    type: 'residential',
    ...overrides,
  }
}

describe('UnifiedCalculationsService repository-backed analytics', () => {
  const originalTenderRepository = getTenderRepository()
  const originalProjectRepository = getProjectRepository()
  const stubTenderRepository = new StubTenderRepository()
  const stubProjectRepository = new StubProjectRepository()
  let service: UnifiedCalculationsService

  beforeAll(async () => {
  const globalContext = globalThis as typeof globalThis & { vitest?: typeof vi }
    globalContext.vitest = vi
    registerTenderRepository(stubTenderRepository)
    registerProjectRepository(stubProjectRepository)
    const module = await import('@/application/services/unifiedCalculationsService')
    service = module.unifiedCalculationsService
  })

  afterAll(() => {
    registerTenderRepository(originalTenderRepository)
    registerProjectRepository(originalProjectRepository)
  })

  beforeEach(async () => {
    const tenders: Tender[] = [
      createTender({ id: 't-win', status: 'won', submissionDate: '2025-06-01', lastUpdate: '2025-06-05' }),
      createTender({ id: 't-lost', status: 'lost', submissionDate: '2025-04-10', lastUpdate: '2025-04-15' }),
      createTender({ id: 't-sub', status: 'submitted', submissionDate: '2025-05-20', lastUpdate: '2025-05-21' }),
    ]

    const projects: Project[] = [
      createProject({
        id: 'p-active',
        status: 'active',
        contractValue: 500,
        estimatedCost: 400,
        actualCost: 300,
        progress: 55,
      }),
      createProject({
        id: 'p-completed',
        status: 'completed',
        contractValue: 1000,
        estimatedCost: 900,
        actualCost: 800,
        progress: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        lastUpdate: '2024-12-31',
        actualProfit: 200,
      }),
    ]

    stubTenderRepository.setData(tenders)
    stubProjectRepository.setData(projects)

    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.clear()
    }

  await service.warmCachesForTesting()
  })

  it('calculates win rate using cached repository data', () => {
    const winRate = service.calculateWinRate()
    expect(winRate).toBe(33)
  })

  it('aggregates financial metrics from repository data', () => {
    const metrics = service.calculateFinancialMetrics()
    expect(metrics.totalRevenue).toBe(1500)
    expect(metrics.totalCosts).toBe(1100)
    expect(metrics.netProfit).toBe(250)
    expect(Math.round(metrics.returnOnInvestment)).toBe(19)
  })

  it('derives KPIs from repository-backed analytics cache', () => {
    const kpis = service.calculateKPIs()
    expect(kpis.winRate).toBe(33)
    expect(kpis.averageProjectValue).toBe(750)
    expect(kpis.projectCompletionRate).toBe(100)
    expect(kpis.costOverrunRate).toBe(0)
    expect(kpis.revenueGrowthRate).toBe(15)
  })
})
