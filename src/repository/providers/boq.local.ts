import type { IBOQRepository } from '../boq.repository'
import type { BOQData } from '@/types/boq'
import { boqStorage } from '@/infrastructure/storage/modules/BOQStorage'
import { APP_EVENTS, emit } from '@/events/bus'

export class LocalBOQRepository implements IBOQRepository {
  async getByTenderId(tenderId: string): Promise<BOQData | null> {
    return boqStorage.getByTenderId(tenderId)
  }

  async getByProjectId(projectId: string): Promise<BOQData | null> {
    return boqStorage.getByProjectId(projectId)
  }

  async createOrUpdate(boq: Omit<BOQData, 'id'> & { id?: string }): Promise<BOQData> {
    const record = await boqStorage.createOrUpdate(boq)

    // Log snapshot for debugging
    console.info('[BOQRepository] Created/Updated BOQ entry:', {
      id: record.id,
      tenderId: record.tenderId,
      projectId: record.projectId,
      itemCount: Array.isArray(record.items) ? record.items.length : 0,
    })

    emit(APP_EVENTS.BOQ_UPDATED, {
      id: record.id,
      tenderId: record.tenderId,
      projectId: record.projectId,
    })

    return record
  }
}

export const boqRepository = new LocalBOQRepository()
