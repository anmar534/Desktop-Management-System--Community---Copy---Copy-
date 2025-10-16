import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import {
  getTenderRepository,
  registerTenderRepository,
} from '@/application/services/serviceRegistry'
import { developmentStatsService } from '@/application/services/developmentStatsService'
import { safeLocalStorage, STORAGE_KEYS } from '@/utils/storage'

class StubTenderRepository implements ITenderRepository {
  private tenders: Tender[] = []
  private shouldThrow = false

  public setData(data: Tender[]): void {
    this.tenders = data
  }

  public setShouldThrow(value: boolean): void {
    this.shouldThrow = value
  }

  async getAll(): Promise<Tender[]> {
    if (this.shouldThrow) {
      throw new Error('Repository unavailable')
    }
    return this.tenders
  }

  async getById(id: string): Promise<Tender | null> {
    return this.tenders.find(tender => tender.id === id) ?? null
  }

  async getByProjectId(): Promise<Tender | null> {
    return null
  }

  async create(): Promise<Tender> {
    throw new Error('Not implemented in stub')
  }

  async update(): Promise<Tender | null> {
    throw new Error('Not implemented in stub')
  }

  async delete(): Promise<boolean> {
    throw new Error('Not implemented in stub')
  }

  async search(query: string): Promise<Tender[]> {
    const normalized = query.toLowerCase()
    return this.tenders.filter(tender =>
      tender.name.toLowerCase().includes(normalized) ||
      tender.client.toLowerCase().includes(normalized)
    )
  }
}

const createTender = (overrides: Partial<Tender>): Tender => ({
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
  submissionDate: '2025-05-01',
  lastAction: 'submitted',
  lastUpdate: '2025-05-02',
  category: 'construction',
  location: 'الرياض',
  type: 'general',
  ...overrides,
})

const expectStatsToMatchData = (stats: ReturnType<typeof developmentStatsService.getDevelopmentStats>, data: Tender[]) => {
  const submittedStatuses = new Set(['submitted', 'under_review', 'awaiting_results', 'won', 'lost'])
  const submitted = data.filter(tender => tender.status && submittedStatuses.has(tender.status)).length
  const won = data.filter(tender => tender.status === 'won').length
  const lost = data.filter(tender => tender.status === 'lost').length
  const submittedValue = data.reduce((sum, tender) => {
    if (tender.status && submittedStatuses.has(tender.status)) {
      const value = typeof tender.totalValue === 'number' ? tender.totalValue : Number(tender.totalValue ?? 0)
      return sum + (Number.isFinite(value) ? value : 0)
    }
    return sum
  }, 0)
  const wonValue = data.reduce((sum, tender) => sum + (tender.status === 'won' ? Number(tender.totalValue ?? 0) : 0), 0)
  const bookletTotal = data.reduce((sum, tender) => {
    const documentPrice = typeof tender.documentPrice === 'number' ? tender.documentPrice : Number(tender.documentPrice ?? 0)
    return sum + (Number.isFinite(documentPrice) ? documentPrice : 0)
  }, 0)

  expect(stats.submittedTenders).toBe(submitted)
  expect(stats.wonTenders).toBe(won)
  expect(stats.lostTenders).toBe(lost)
  expect(stats.submittedTendersValue).toBe(submittedValue)
  expect(stats.wonTendersValue).toBe(wonValue)
  expect(stats.totalBookletsCost).toBe(bookletTotal)
  if (submitted > 0) {
    expect(stats.averageBookletCost).toBeCloseTo(bookletTotal / submitted, 5)
  } else {
    expect(stats.averageBookletCost).toBe(0)
  }
}

describe('DevelopmentStatsService repository-backed recalculation', () => {
  const originalTenderRepository = getTenderRepository()
  const stubTenderRepository = new StubTenderRepository()

  beforeAll(() => {
    registerTenderRepository(stubTenderRepository)
  })

  afterAll(() => {
    registerTenderRepository(originalTenderRepository)
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-01T00:00:00Z'))
    stubTenderRepository.setData([])
    stubTenderRepository.setShouldThrow(false)
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDERS)
    safeLocalStorage.removeItem(STORAGE_KEYS.TENDER_STATS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recalculates statistics using repository data', async () => {
    const tenders: Tender[] = [
      createTender({
        id: 't-submitted',
        status: 'submitted',
        totalValue: 1000,
        documentPrice: 100,
        submissionDate: '2025-05-05',
        lastUpdate: '2025-05-06',
      }),
      createTender({
        id: 't-won',
        status: 'won',
        totalValue: 500,
        documentPrice: 200,
        submissionDate: '2025-05-04',
        winDate: '2025-05-10',
        lastUpdate: '2025-05-10',
      }),
      createTender({
        id: 't-lost',
        status: 'lost',
        totalValue: 700,
        documentPrice: 150,
        submissionDate: '2025-04-01',
        lostDate: '2025-04-20',
        lastUpdate: '2025-04-21',
      }),
    ]

    stubTenderRepository.setData(tenders)

    const stats = await developmentStatsService.recalculateStatsFromRealData()

    expectStatsToMatchData(stats, tenders)
    expect(stats.winRate).toBe(40)
    expect(stats.currentMonthTenders).toBe(2)
    expect(stats.currentMonthValue).toBe(1500)
    expect(Object.keys(stats.monthlyStats)).toHaveLength(0)
    const stored = safeLocalStorage.getItem(STORAGE_KEYS.TENDER_STATS, null)
    expect(stored).not.toBeNull()
  })

  it('falls back to cached tenders when repository is unavailable', async () => {
    const cachedTenders: Tender[] = [
      createTender({
        id: 'cached-submitted',
        status: 'submitted',
        totalValue: 900,
        documentPrice: 80,
        submissionDate: '2025-05-03',
        lastUpdate: '2025-05-03',
      }),
      createTender({
        id: 'cached-won',
        status: 'won',
        totalValue: 400,
        documentPrice: 120,
        submissionDate: '2025-05-01',
        winDate: '2025-05-15',
        lastUpdate: '2025-05-15',
      }),
    ]

    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, cachedTenders)
    stubTenderRepository.setShouldThrow(true)

    const stats = await developmentStatsService.recalculateStatsFromRealData()

    expectStatsToMatchData(stats, cachedTenders)
    expect(stats.winRate).toBe(67)
    expect(stats.currentMonthTenders).toBe(2)
    expect(stats.currentMonthValue).toBe(1300)
  })
})
