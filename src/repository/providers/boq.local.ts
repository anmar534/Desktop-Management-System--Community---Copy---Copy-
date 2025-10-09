import type { IBOQRepository } from '../boq.repository'
import type { BOQData } from '@/types/boq'
import { asyncStorage, whenStorageReady } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'

const generateId = () => `boq_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

const loadAll = async (): Promise<BOQData[]> => {
  await whenStorageReady()
  const entries = await asyncStorage.getItem<BOQData[]>(STORAGE_KEYS.BOQ_DATA, [])
  console.info('[BOQRepository] Loaded BOQ entries snapshot:', entries.map(entry => ({
    id: entry.id,
    tenderId: entry.tenderId,
    projectId: entry.projectId,
    itemCount: Array.isArray(entry.items) ? entry.items.length : 0,
  })))
  return entries
}

const persistAll = async (entries: BOQData[]): Promise<void> => {
  await asyncStorage.setItem(STORAGE_KEYS.BOQ_DATA, entries)
}

const normaliseItems = (items: unknown): BOQData['items'] => {
  if (!Array.isArray(items)) {
    return []
  }
  return items as BOQData['items']
}

const normaliseTotal = (total: unknown, items: BOQData['items']): number => {
  if (typeof total === 'number' && Number.isFinite(total)) {
    return total
  }
  return items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0)
}

const cloneTotals = (totals: BOQData['totals'] | undefined): BOQData['totals'] => {
  if (!totals) return null
  return { ...totals }
}

export class LocalBOQRepository implements IBOQRepository {
  async getByTenderId(tenderId: string): Promise<BOQData | null> {
    const all = await loadAll()
    return all.find(entry => entry.tenderId === tenderId) ?? null
  }

  async getByProjectId(projectId: string): Promise<BOQData | null> {
    const all = await loadAll()
    return all.find(entry => entry.projectId === projectId) ?? null
  }

  async createOrUpdate(boq: Omit<BOQData, 'id'> & { id?: string }): Promise<BOQData> {
    const all = await loadAll()

    let targetIndex = -1
    if (boq.id) {
      targetIndex = all.findIndex(entry => entry.id === boq.id)
    } else {
      targetIndex = all.findIndex(entry =>
        (boq.tenderId && entry.tenderId === boq.tenderId) ||
        (boq.projectId && entry.projectId === boq.projectId)
      )
    }

    const resolvedId = targetIndex >= 0 ? all[targetIndex].id : boq.id ?? generateId()
    const items = normaliseItems(boq.items)
    const record: BOQData = {
      ...boq,
      id: resolvedId,
      items,
      totalValue: normaliseTotal(boq.totalValue, items),
      totals: cloneTotals(boq.totals ?? undefined),
      lastUpdated: new Date().toISOString(),
    }

    if (targetIndex >= 0) {
      all[targetIndex] = record
    } else {
      all.push(record)
    }

    await persistAll(all)
    emit(APP_EVENTS.BOQ_UPDATED, { id: record.id, tenderId: record.tenderId, projectId: record.projectId })
    return record
  }
}

export const boqRepository = new LocalBOQRepository()
