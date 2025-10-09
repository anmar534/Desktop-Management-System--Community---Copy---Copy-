import { describe, it, expect } from 'vitest'
import { calculateTenderStats } from '@/calculations/tender'
import type { Tender } from '@/data/centralData'

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 't1',
  name: 'Tender 1',
  title: 'T1',
  client: 'Client',
  value: 1000,
  status: 'new',
  phase: 'init',
  deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  daysLeft: 10,
  progress: 0,
  priority: 'medium',
  team: 'A',
  manager: 'M',
  winChance: 0,
  competition: 'N/A',
  submissionDate: '',
  lastAction: '',
  lastUpdate: new Date().toISOString(),
  category: 'General',
  location: 'City',
  type: 'Public',
  ...overrides,
})

const t = (status: Tender['status'], extra: Partial<Tender> = {}) =>
  makeTender({ id: Math.random().toString(), status, deadline: undefined, ...extra })

describe('calculateTenderStats', () => {
  it('returns zeros for empty array', () => {
    const stats = calculateTenderStats([])
    expect(stats).toEqual({
      total: 0,
      urgent: 0,
      new: 0,
      underAction: 0,
      waitingResults: 0,
      won: 0,
      lost: 0,
      expired: 0,
      winRate: 0,
      totalDocumentValue: 0,
    })
  })

  it('computes counts, winRate and document total for mixed tenders', () => {
    const today = Date.now()
    const tenders: Tender[] = [
      makeTender({ id: 'n1', status: 'new', deadline: new Date(today + 3 * 86400000).toISOString() }),
      makeTender({ id: 'ua1', status: 'under_action', deadline: new Date(today + 5 * 86400000).toISOString() }),
      makeTender({ id: 'sub1', status: 'submitted', documentPrice: 100 }),
  makeTender({ id: 'won1', status: 'won', totalValue: 5000, documentPrice: 200 }),
  makeTender({ id: 'lost1', status: 'lost', documentPrice: 150 }),
      makeTender({ id: 'exp1', status: 'new', deadline: new Date(today - 1 * 86400000).toISOString() }),
    ]

    const stats = calculateTenderStats(tenders)

    expect(stats.total).toBe(6)
    expect(stats.new).toBe(2)
    expect(stats.underAction).toBe(1)
    expect(stats.waitingResults).toBe(1)
    expect(stats.won).toBe(1)
    expect(stats.lost).toBe(1)
    expect(stats.expired).toBe(1)
    expect(stats.urgent).toBeGreaterThanOrEqual(1)
    expect(stats.winRate).toBe(33)
    expect(stats.totalDocumentValue).toBe(450)
  })

  it('winRate = 0 when no submitted-like tenders', () => {
    const stats = calculateTenderStats([t('new'), t('under_action')])
    expect(stats.winRate).toBe(0)
  })

  it('winRate = won / (submitted + won + lost)', () => {
    const stats = calculateTenderStats([
      t('submitted'),
      t('won'),
      t('won'),
      t('lost'),
      t('under_action'),
      t('new'),
    ])
    expect(stats.winRate).toBe(50)
  })

  it('rounds winRate to nearest integer', () => {
    const stats = calculateTenderStats([t('won'), t('won'), t('lost')])
    expect(stats.winRate).toBe(67)
  })
})
