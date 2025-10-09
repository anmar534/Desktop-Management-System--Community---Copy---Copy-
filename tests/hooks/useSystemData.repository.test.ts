import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSystemData } from '@/application/hooks/useSystemData'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import { registerTenderRepository } from '@/application/services/serviceRegistry'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'

const sampleTender: Tender = {
  id: 't-1',
  name: 'Sample',
  title: 'Sample Title',
  client: 'Client',
  value: 1000,
  status: 'new',
  phase: 'preparation',
  deadline: new Date('2025-01-01').toISOString(),
  daysLeft: 10,
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
}

describe('useSystemData with repository', () => {
  const stubRepository = (): ITenderRepository => {
    let current: Tender | null = sampleTender

    return {
      async getAll() { return current ? [current] : [] },
      async getById(id: string) { return current && current.id === id ? current : null },
      async create(data: Omit<Tender, 'id'>) {
        current = { ...data, id: 'generated' }
        return current
      },
      async update(id: string, updates: Partial<Tender>) {
        if (!current || current.id !== id) return null
        current = { ...current, ...updates }
        return current
      },
      async delete(id: string) {
        if (current && current.id === id) {
          current = null
          return true
        }
        return false
      },
      async search() { return current ? [current] : [] },
    }
  }

  beforeEach(() => {
    registerTenderRepository(stubRepository())
  })

  afterEach(() => {
    registerTenderRepository(defaultTenderRepository)
    vi.restoreAllMocks()
  })

  it('يحدّث المنافسة عبر المستودع ويعيد القيمة الجديدة', async () => {
    const { result } = renderHook(() => useSystemData())

    const updates: Partial<Tender> = { status: 'won', lastUpdate: new Date().toISOString() }
    let response: Tender | null = null

    await act(async () => {
      response = await result.current.updateTender(sampleTender.id, updates)
    })

  expect(response).not.toBeNull()
  expect(response!.status).toBe('won')
  })

  it('يرمي خطأً عندما لا يعثر على المنافسة', async () => {
    const { result } = renderHook(() => useSystemData())

    await expect(result.current.updateTender('missing', { status: 'lost' })).rejects.toThrow()
  })
})
