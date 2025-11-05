import { describe, it, expect } from 'vitest'
import { selectAllTenderCalculations } from '@/domain/selectors/tenderSelectors'
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

describe('selectAllTenderCalculations (replacing calculateTenderStats)', () => {
  it('returns zeros for empty array', () => {
    const stats = selectAllTenderCalculations([])
    expect(stats.total).toBe(0)
    expect(stats.new).toBe(0)
    expect(stats.underAction).toBe(0)
    expect(stats.submitted).toBe(0)
    expect(stats.won).toBe(0)
    expect(stats.lost).toBe(0)
    expect(stats.active).toBe(0)
    expect(stats.winRate).toBe(0)
    expect(stats.wonValue).toBe(0)
    expect(stats.lostValue).toBe(0)
    expect(stats.submittedValue).toBe(0)
  })

  it('computes counts, winRate and values for mixed tenders', () => {
    const today = Date.now()
    const tenders: Tender[] = [
      makeTender({
        id: 'n1',
        status: 'new',
        deadline: new Date(today + 3 * 86400000).toISOString(),
      }),
      makeTender({
        id: 'ua1',
        status: 'under_action',
        deadline: new Date(today + 5 * 86400000).toISOString(),
      }),
      makeTender({ id: 'sub1', status: 'submitted', value: 1000 }),
      makeTender({ id: 'won1', status: 'won', totalValue: 5000 }),
      makeTender({ id: 'lost1', status: 'lost', value: 2000 }),
      makeTender({
        id: 'exp1',
        status: 'new',
        deadline: new Date(today - 1 * 86400000).toISOString(),
      }),
    ]

    const stats = selectAllTenderCalculations(tenders)

    expect(stats.total).toBe(6)
    expect(stats.new).toBe(2)
    expect(stats.underAction).toBe(1)
    expect(stats.submitted).toBe(1)
    expect(stats.won).toBe(1)
    expect(stats.lost).toBe(1)
    expect(stats.winRate).toBe(33) // 1 won out of 3 (submitted + won + lost)
    expect(stats.wonValue).toBe(5000)
    expect(stats.lostValue).toBe(2000)
    expect(stats.submittedValue).toBe(1000)
  })

  it('winRate = 0 when no submitted-like tenders', () => {
    const stats = selectAllTenderCalculations([t('new'), t('under_action')])
    expect(stats.winRate).toBe(0)
  })

  it('winRate = won / (submitted + won + lost)', () => {
    const stats = selectAllTenderCalculations([
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
    const stats = selectAllTenderCalculations([t('won'), t('won'), t('lost')])
    expect(stats.winRate).toBe(67)
  })
})
