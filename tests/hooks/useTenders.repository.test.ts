import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { SpyInstance } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTenders } from '@/application/hooks/useTenders'
import type { Tender } from '@/data/centralData'
import type { ITenderRepository } from '@/repository/tender.repository'
import { registerTenderRepository } from '@/application/services/serviceRegistry'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'
import { APP_EVENTS } from '@/events/bus'

const makeTender = (overrides: Partial<Tender> = {}): Tender => ({
  id: 'tender-1',
  name: 'Tender 1',
  title: 'Main Tender',
  client: 'Test Client',
  value: 100000,
  status: 'new',
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
  ...overrides,
})

describe('useTenders repository integration', () => {
  let currentTenders: Tender[]
  let createSpy: SpyInstance
  let updateSpy: SpyInstance
  let deleteSpy: SpyInstance
  let getAllSpy: SpyInstance

  const registerStubRepository = () => {
    currentTenders = [makeTender()]
    const stub: ITenderRepository = {
      getAll: async () => currentTenders,
      getById: async (id: string) => currentTenders.find(t => t.id === id) ?? null,
      create: async (data: Omit<Tender, 'id'>) => {
        const newTender: Tender = { ...data, id: `generated-${Date.now()}` }
        currentTenders = [...currentTenders, newTender]
        return newTender
      },
      update: async (id: string, updates: Partial<Tender>) => {
        const existing = currentTenders.find(t => t.id === id)
        if (!existing) return null
        const updated = { ...existing, ...updates }
        currentTenders = currentTenders.map(t => (t.id === id ? updated : t))
        return updated
      },
      delete: async (id: string) => {
        const exists = currentTenders.some(t => t.id === id)
        currentTenders = currentTenders.filter(t => t.id !== id)
        return exists
      },
      search: async (query: string) => {
        const needle = query.toLowerCase()
        return currentTenders.filter(t =>
          t.name.toLowerCase().includes(needle) ||
          t.title.toLowerCase().includes(needle) ||
          t.client.toLowerCase().includes(needle)
        )
      },
    }

    getAllSpy = vi.spyOn(stub, 'getAll')
    createSpy = vi.spyOn(stub, 'create')
    updateSpy = vi.spyOn(stub, 'update')
    deleteSpy = vi.spyOn(stub, 'delete')

    registerTenderRepository(stub)
  }

  beforeEach(() => {
    registerStubRepository()
  })

  afterEach(() => {
    registerTenderRepository(defaultTenderRepository)
    vi.restoreAllMocks()
  })

  it('loads tenders via repository and reacts to update events', async () => {
    const { result } = renderHook(() => useTenders())

    await waitFor(() => {
      expect(result.current.tenders).toHaveLength(1)
    })

    act(() => {
      currentTenders = [
        ...currentTenders,
        makeTender({ id: 'tender-2', name: 'Tender 2' }),
      ]
      window.dispatchEvent(new CustomEvent(APP_EVENTS.TENDERS_UPDATED))
    })

    await waitFor(() => {
      expect(result.current.tenders).toHaveLength(2)
    })

    expect(getAllSpy).toHaveBeenCalled()
  })

  it('delegates CRUD operations to the repository', async () => {
    const { result } = renderHook(() => useTenders())
    await waitFor(() => {
      expect(result.current.tenders).toHaveLength(1)
    })

    const { id: _ignored, ...payload } = makeTender({ name: 'Generated Tender', title: 'Generated' })

    await act(async () => {
      await result.current.addTender(payload)
    })

    expect(createSpy).toHaveBeenCalledWith(payload)
    await waitFor(() => {
      expect(result.current.tenders).toHaveLength(2)
    })

    const target = result.current.tenders[0]

    await act(async () => {
      await result.current.updateTender({ ...target, status: 'won' })
    })

  expect(updateSpy).toHaveBeenCalledWith(target.id, expect.objectContaining({ id: target.id, status: 'won' }))
    await waitFor(() => {
      const updated = result.current.tenders.find(t => t.id === target.id)
      expect(updated?.status).toBe('won')
    })

    await act(async () => {
      await result.current.deleteTender(target.id)
    })

    expect(deleteSpy).toHaveBeenCalledWith(target.id)
    await waitFor(() => {
      expect(result.current.tenders.find(t => t.id === target.id)).toBeUndefined()
    })
  })
})
