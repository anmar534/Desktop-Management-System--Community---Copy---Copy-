import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { BOQData } from '@/types/boq'
import { LocalBOQRepository } from '@/repository/providers/boq.local'
import { asyncStorage, whenStorageReady } from '@/utils/storage'
import { secureStore } from '@/utils/secureStore'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS } from '@/events/bus'

const createSampleEntry = (overrides: Partial<BOQData>): BOQData => ({
  id: overrides.id ?? 'boq-sample',
  tenderId: overrides.tenderId,
  projectId: overrides.projectId,
  items: overrides.items ?? [],
  totalValue: overrides.totalValue ?? 0,
  totals: overrides.totals ?? null,
  lastUpdated: overrides.lastUpdated ?? new Date().toISOString(),
})

describe('LocalBOQRepository', () => {
  const repository = new LocalBOQRepository()

  beforeEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    await whenStorageReady()
    await asyncStorage.removeItem(STORAGE_KEYS.BOQ_DATA)
  })

  afterEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    await asyncStorage.removeItem(STORAGE_KEYS.BOQ_DATA)
  })

  it('reads BOQ entries by tender and project id from storage', async () => {
    const stored: BOQData[] = [
      createSampleEntry({ id: 'boq-1', tenderId: 't-1', projectId: 'p-1' }),
      createSampleEntry({ id: 'boq-2', tenderId: 't-2', projectId: 'p-2' }),
    ]

    await asyncStorage.setItem(STORAGE_KEYS.BOQ_DATA, stored)

    await expect(repository.getByTenderId('t-1')).resolves.toMatchObject({ id: 'boq-1' })
    await expect(repository.getByProjectId('p-2')).resolves.toMatchObject({ id: 'boq-2' })
    await expect(repository.getByTenderId('missing')).resolves.toBeNull()
  })

  it('creates new entries and updates existing ones while emitting events', async () => {
    const captured: { id: string; tenderId?: string; projectId?: string }[] = []
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ id: string; tenderId?: string; projectId?: string }>
      captured.push(custom.detail ?? { id: 'unknown' })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.BOQ_UPDATED, handler)
    }

    const created = await repository.createOrUpdate({
      tenderId: 't-created',
      projectId: 'p-created',
      items: [
        {
          id: 'item-1',
          description: 'Test item',
          totalPrice: 75,
        },
      ],
    })

  const storedAfterCreate = await asyncStorage.getItem<BOQData[]>(STORAGE_KEYS.BOQ_DATA, [])
    expect(storedAfterCreate).toHaveLength(1)
    expect(storedAfterCreate[0].totalValue).toBe(75)
    expect(created.totalValue).toBe(75)

    const updated = await repository.createOrUpdate({
      tenderId: 't-created',
      projectId: 'p-created',
      items: [
        {
          id: 'item-1',
          description: 'Updated item',
          totalPrice: 125,
        },
      ],
      totalValue: 125,
    })

    expect(updated.id).toBe(created.id)
  const storedAfterUpdate = await asyncStorage.getItem<BOQData[]>(STORAGE_KEYS.BOQ_DATA, [])
    expect(storedAfterUpdate).toHaveLength(1)
    expect(storedAfterUpdate[0].totalValue).toBe(125)

    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.BOQ_UPDATED, handler)
    }

    expect(captured.length).toBeGreaterThanOrEqual(2)
    expect(captured[0]).toMatchObject({ tenderId: 't-created', projectId: 'p-created' })
    expect(captured[captured.length - 1].id).toBe(updated.id)
  })

  it('reads BOQ data seeded directly into secure storage', async () => {
    const envelope = {
      __meta: { schemaVersion: 1, storedAt: new Date().toISOString() },
      data: [
        createSampleEntry({
          id: 'boq-secure',
          tenderId: 't-secure',
          projectId: 'p-secure',
          totalValue: 999,
        }),
      ],
    }

    await secureStore.set(STORAGE_KEYS.BOQ_DATA, envelope)

    await expect(repository.getByTenderId('t-secure')).resolves.toMatchObject({ id: 'boq-secure', totalValue: 999 })
  })
})
