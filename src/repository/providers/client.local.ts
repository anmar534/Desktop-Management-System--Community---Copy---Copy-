import type { IClientRepository } from '../client.repository'
import type { Client } from '@/data/centralData'
import { clientsStorage } from '@/infrastructure/storage/modules/ClientsStorage'
import { APP_EVENTS, emit } from '@/events/bus'

const generateId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

const emitClientsUpdated = () => emit(APP_EVENTS.CLIENTS_UPDATED)

export class LocalClientRepository implements IClientRepository {
  async getAll(): Promise<Client[]> {
    return clientsStorage.getAll()
  }

  async getById(id: string): Promise<Client | null> {
    return clientsStorage.getById(id)
  }

  async create(data: Omit<Client, 'id'>): Promise<Client> {
    const client: Client = {
      ...data,
      id: generateId(),
    }
    await clientsStorage.add(client)
    emitClientsUpdated()
    return client
  }

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    const updated = await clientsStorage.update(id, updates)
    if (updated) {
      emitClientsUpdated()
    }
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await clientsStorage.delete(id)
    if (deleted) {
      emitClientsUpdated()
    }
    return deleted
  }
}

export const clientRepository = new LocalClientRepository()
