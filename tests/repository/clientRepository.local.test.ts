import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Client } from '@/data/centralData'
import { LocalClientRepository } from '@/repository/providers/client.local'
import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS } from '@/events/bus'
import { StorageManager } from '@/storage/core/StorageManager'
import { LocalStorageAdapter } from '@/storage/adapters/LocalStorageAdapter'
import { clientsStorage } from '@/storage/modules/ClientsStorage'

const sampleClient = (overrides: Partial<Client> = {}): Client => ({
  id: overrides.id ?? 'client-seed',
  name: overrides.name ?? 'جهة حكومية',
  type: overrides.type ?? 'government',
  category: overrides.category ?? 'infrastructure',
  projects: overrides.projects ?? 3,
  totalValue: overrides.totalValue ?? 1200000,
  status: overrides.status ?? 'active',
  lastProject: overrides.lastProject ?? 'مشروع مترو الرياض',
  relationship: overrides.relationship ?? 'strategic',
  paymentRating: overrides.paymentRating ?? 'excellent',
  location: overrides.location ?? 'الرياض',
  contact: overrides.contact ?? 'مدير التعاقدات',
  phone: overrides.phone ?? '+966500000000',
  email: overrides.email ?? 'contracts@example.com',
  establishedDate: overrides.establishedDate ?? '1998-05-01',
  completedProjects: overrides.completedProjects ?? 12,
})

const createClientInput = (overrides: Partial<Client> = {}): Omit<Client, 'id'> => {
  const { id: _omit, ...rest } = sampleClient(overrides)
  return rest
}

describe('LocalClientRepository', () => {
  const repository = new LocalClientRepository()
  const windowEvents: unknown[] = []
  const windowHandler = (event: Event) => {
    const custom = event as CustomEvent<unknown>
    windowEvents.push(custom.detail)
  }

  beforeEach(async () => {
    windowEvents.length = 0
    if (typeof window !== 'undefined') {
      window.addEventListener(APP_EVENTS.CLIENTS_UPDATED, windowHandler)
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }

    // Initialize storage system
    StorageManager.resetInstance()
    const manager = StorageManager.getInstance()
    const adapter = new LocalStorageAdapter()
    manager.setAdapter(adapter)
    await manager.initialize()

    // Initialize Clients storage module
    clientsStorage.setManager(manager)
    await clientsStorage.initialize()

    safeLocalStorage.removeItem(STORAGE_KEYS.CLIENTS)
  })

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_EVENTS.CLIENTS_UPDATED, windowHandler)
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    safeLocalStorage.removeItem(STORAGE_KEYS.CLIENTS)
    vi.restoreAllMocks()
  })

  it('returns clients stored in safeLocalStorage', async () => {
    const stored = [sampleClient(), sampleClient({ id: 'client-b', name: 'مطور خاص' })]
    safeLocalStorage.setItem(STORAGE_KEYS.CLIENTS, stored)

    const all = await repository.getAll()
    expect(all).toHaveLength(2)

    const found = await repository.getById('client-b')
    expect(found?.name).toBe('مطور خاص')

    const missing = await repository.getById('missing')
    expect(missing).toBeNull()
  })

  it('creates, updates, and deletes clients while emitting events', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)

    const created = await repository.create(createClientInput({ name: 'عميل جديد' }))
    expect(created.id).toMatch(/^client_\d+_[a-z0-9]+$/)
    expect(created.name).toBe('عميل جديد')

    let stored = safeLocalStorage.getItem<Client[]>(STORAGE_KEYS.CLIENTS, [])
    expect(stored).toHaveLength(1)

    const updated = await repository.update(created.id, { status: 'inactive', projects: 10 })
    expect(updated?.status).toBe('inactive')
    expect(updated?.projects).toBe(10)

    stored = safeLocalStorage.getItem<Client[]>(STORAGE_KEYS.CLIENTS, [])
    expect(stored[0].status).toBe('inactive')

    const removed = await repository.delete(created.id)
    expect(removed).toBe(true)
    expect(safeLocalStorage.getItem<Client[]>(STORAGE_KEYS.CLIENTS, [])).toHaveLength(0)

    expect(windowEvents.length).toBeGreaterThanOrEqual(3)
  })
})
